import type { IExecuteFunctions, IHttpRequestOptions, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { Readable } from 'node:stream';

export interface BoxLiteCredentials {
	apiKey?: string;
	baseUrl?: string;
	pathPrefix?: string;
}

export interface BoxLiteBox {
	box_id: string;
	name?: string | null;
	status: string;
	image: string;
	cpus: number;
	memory_mib: number;
	created_at: string;
	updated_at: string;
	exit_code?: number | null;
	[key: string]: unknown;
}

export interface BoxLiteExecution {
	execution_id: string;
}

/** Joins the credential's base URL, `/v1` and an optional routing prefix. */
export function apiBase(credentials: BoxLiteCredentials): string {
	const base = (credentials.baseUrl || 'https://api.boxlite.ai').trim().replace(/\/+$/, '');
	const prefix = (credentials.pathPrefix || '').trim().replace(/^\/+|\/+$/g, '');
	return `${base}/v1${prefix ? `/${prefix}` : ''}`;
}

/** WebSocket origin for the same server, so `http` becomes `ws` and `https` `wss`. */
export function wsBase(credentials: BoxLiteCredentials): string {
	const base = (credentials.baseUrl || 'https://api.boxlite.ai').trim().replace(/\/+$/, '');
	const prefix = (credentials.pathPrefix || '').trim().replace(/^\/+|\/+$/g, '');
	const wsOrigin = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
	return `${wsOrigin}/v1${prefix ? `/${prefix}` : ''}`;
}

/**
 * One REST call. Optional fields are only sent when they carry a value, because
 * older self-hosted servers reject unknown or empty fields instead of ignoring
 * them.
 */
export async function request(
	ctx: IExecuteFunctions,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	path: string,
	body?: JsonObject,
	query?: Record<string, string>,
	timeoutMs = 30_000,
): Promise<any> {
	const credentials = (await ctx.getCredentials('boxLiteApi')) as unknown as BoxLiteCredentials;

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (credentials.apiKey) headers.Authorization = `Bearer ${credentials.apiKey}`;

	const options: IHttpRequestOptions = {
		method,
		url: apiBase(credentials) + path,
		headers,
		json: true,
		timeout: Math.max(1, Math.ceil(timeoutMs)),
	};
	if (body !== undefined) options.body = body;
	if (query && Object.keys(query).length > 0) options.qs = query;

	try {
		return await ctx.helpers.httpRequest(options);
	} catch (error) {
		// Carry the HTTP status onto the wrapped error. n8n stores it as a
		// string, so without this a 404 from a "does it exist?" probe is
		// indistinguishable from a real failure.
		const status = statusOf(error);
		throw new NodeApiError(ctx.getNode(), error as JsonObject, {
			httpCode: status === undefined ? undefined : String(status),
		});
	}
}

/**
 * Binary transfer against `/boxes/{id}/files`. Those endpoints speak tar
 * instead of JSON, so this bypasses the JSON helper entirely.
 */
export async function requestBinary(
	ctx: IExecuteFunctions,
	method: 'GET' | 'PUT',
	path: string,
	body?: Buffer,
	contentType?: string,
	accept?: string,
	maxBytes?: number,
): Promise<Buffer> {
	const credentials = (await ctx.getCredentials('boxLiteApi')) as unknown as BoxLiteCredentials;

	const headers: Record<string, string> = {};
	if (accept) headers.Accept = accept;
	if (contentType) headers['Content-Type'] = contentType;
	if (credentials.apiKey) headers.Authorization = `Bearer ${credentials.apiKey}`;

	const options: IHttpRequestOptions = {
		method,
		url: apiBase(credentials) + path,
		headers,
		encoding: maxBytes === undefined ? 'arraybuffer' : 'stream',
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
		timeout: 60_000,
	};
	if (body !== undefined) options.body = body;

	try {
		const response = (await ctx.helpers.httpRequest(options)) as {
			body: ArrayBuffer | Buffer | string | Readable;
			statusCode: number;
		};
		const raw = response.body;
		if (response.statusCode >= 400) {
			// With stream encoding n8n cannot decode the API's JSON error itself.
			// Read only a bounded error body, then retain the server's own detail.
			let text: string;
			if (raw && typeof raw === 'object' && Symbol.asyncIterator in raw) {
				const chunks: Buffer[] = [];
				let total = 0;
				for await (const chunk of raw as Readable) {
					const bytes = Buffer.from(chunk);
					chunks.push(bytes.subarray(0, Math.max(0, 65536 - total)));
					total += bytes.length;
					if (total >= 65536) { (raw as Readable).destroy(); break; }
				}
				text = Buffer.concat(chunks).toString('utf8');
			} else {
				text = typeof raw === 'string' ? raw : Buffer.from(raw as ArrayBuffer).toString('utf8');
			}
			let detail: JsonObject;
			try { detail = JSON.parse(text) as JsonObject; }
			catch { detail = { message: text || `HTTP ${response.statusCode}` }; }
			throw new NodeApiError(ctx.getNode(), detail, { httpCode: String(response.statusCode) });
		}
		if (maxBytes !== undefined && raw && typeof raw === 'object' && Symbol.asyncIterator in raw) {
			const chunks: Buffer[] = [];
			let total = 0;
			for await (const chunk of raw as Readable) {
				const bytes = Buffer.from(chunk);
				total += bytes.length;
				if (total > maxBytes) {
					(raw as Readable).destroy();
					throw new NodeOperationError(ctx.getNode(), 'Download archive exceeds Max Download Size (MB)');
				}
				chunks.push(bytes);
			}
			return Buffer.concat(chunks);
		}
		const bytes = Buffer.isBuffer(raw) ? raw : typeof raw === 'string' ? Buffer.from(raw, 'binary') : Buffer.from(raw as ArrayBuffer);
		if (maxBytes !== undefined && bytes.length > maxBytes) {
			throw new NodeOperationError(ctx.getNode(), 'Download archive exceeds Max Download Size (MB)');
		}
		return bytes;
	} catch (error) {
		if (error instanceof NodeOperationError || error instanceof NodeApiError) throw error;
		const status = statusOf(error);
		throw new NodeApiError(ctx.getNode(), error as JsonObject, {
			httpCode: status === undefined ? undefined : String(status),
		});
	}
}

export function statusOf(error: unknown): number | undefined {
	const candidate = error as {
		statusCode?: number | string;
		httpCode?: number | string;
		response?: { status?: number | string };
	};
	const raw = candidate?.statusCode ?? candidate?.httpCode ?? candidate?.response?.status;
	if (raw === undefined || raw === null) return undefined;
	const parsed = typeof raw === 'number' ? raw : Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export function requireBoxId(ctx: IExecuteFunctions, index: number, name = 'boxId'): string {
	const value = (ctx.getNodeParameter(name, index, '') as string).trim();
	if (!value) throw new NodeOperationError(ctx.getNode(), 'Provide a box ID or name', { itemIndex: index });
	return value;
}

/** Drops empty optional fields so a self-hosted server never sees them. */
export function compact(input: Record<string, unknown>): JsonObject {
	const out: JsonObject = {};
	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || value === null || value === '') continue;
		if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) {
			continue;
		}
		out[key] = value as JsonObject[string];
	}
	return out;
}
