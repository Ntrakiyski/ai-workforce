import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError, NodeOperationError } from 'n8n-workflow';
import { createHash, randomUUID } from 'node:crypto';

import { attachExecution } from './attach';
import { packSingleFile, unpackTar } from './tar';
import type { BoxLiteCredentials, BoxLiteExecution } from './transport';
import { compact, request, requestBinary, requireBoxId, statusOf } from './transport';

const TERMINAL_STATUSES = ['completed', 'killed', 'timed_out'];

const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	default: 'box',
	options: [
		{ name: 'Box', value: 'box' },
		{ name: 'Command', value: 'command' },
		{ name: 'Execution', value: 'execution' },
		{ name: 'File', value: 'file' },
		{ name: 'Volume', value: 'volume' },
	],
};

// n8n matches `operation` values across resources, so each copy of this field
// is scoped to exactly one resource. Otherwise `execution.list` would also
// match `box.list` and demand a box ID for the List operation.
const boxIdProperty = (resource: string, operations: string[]): INodeProperties => ({
	displayName: 'Box',
	name: 'boxId',
	type: 'string',
	default: '',
	required: true,
	displayOptions: { show: { resource: [resource], operation: operations } },
	description: 'Box ID or the name it was created with',
});

const nodeProperties: INodeProperties[] = [
	resourceProperty,

	// ---------------------------------------------------------------- box
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['box'] } },
		default: 'create',
		options: [
			{ name: 'Create', value: 'create', action: 'Create a box', description: 'Create a box' },
			{ name: 'Delete', value: 'delete', action: 'Delete a box', description: 'Delete a box' },
			{ name: 'Get', value: 'get', action: 'Get a box', description: 'Get one box' },
			{ name: 'List', value: 'list', action: 'List boxes', description: 'List boxes' },
			{ name: 'Metrics', value: 'metrics', action: 'Get box metrics', description: 'Get CPU and memory use' },
			{ name: 'Start', value: 'start', action: 'Start a box', description: 'Start a stopped box' },
			{ name: 'Stop', value: 'stop', action: 'Stop a box', description: 'Stop a running box' },
		],
	},
	{
		displayName: 'Image',
		name: 'image',
		type: 'string',
		default: 'python',
		required: true,
		displayOptions: { show: { resource: ['box'], operation: ['create'] } },
		description:
			'Cloud accepts the aliases base, python or node. A self-hosted server accepts any OCI image, for example alpine:latest',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['box'], operation: ['create'] } },
		description: 'Stable name, so a later run can find the same box. BoxLite assigns an ID otherwise.',
	},
	{
		displayName: 'If a Box With This Name Exists',
		name: 'ifExists',
		type: 'options',
		default: 'fail',
		displayOptions: { show: { resource: ['box'], operation: ['create'] } },
		options: [
			{ name: 'Fail', value: 'fail' },
			{ name: 'Reuse It', value: 'reuse' },
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['box'], operation: ['create'] } },
		options: [
			{
				displayName: 'Auto-Delete After Minutes',
				name: 'autoDeleteMinutes',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description:
					'How long after the box stops before it is deleted, in minutes. 0 leaves the server default (never). The tested server requires a non-zero value to be greater than Auto-Stop.',
			},
			{
				displayName: 'Auto-Stop After Minutes',
				name: 'autoStopMinutes',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description:
					'Idle minutes before the box stops. 0 leaves the server default (15 minutes on Cloud).',
			},
			{
				displayName: 'CPUs',
				name: 'cpus',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 4 },
				description: '0 leaves the server default',
			},
			{
				displayName: 'Disk Size (GB)',
				name: 'diskSizeGb',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: '0 leaves the server default',
			},
			{
				displayName: 'Environment',
				name: 'env',
				type: 'json',
				default: '{}',
				description: 'Plain environment variables for the box',
			},
			{
				displayName: 'Memory (MiB)',
				name: 'memoryMib',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: '0 leaves the server default',
			},
			{
				displayName: 'Working Directory',
				name: 'workingDir',
				type: 'string',
				default: '',
			},
		],
	},
	{
		displayName: 'Volume Mounts',
		name: 'volumeMounts',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		placeholder: 'Add Volume',
		displayOptions: { show: { resource: ['box'], operation: ['create'] } },
		description: 'Requires a server that supports named volumes. Reusing an existing box does not change its mounts.',
		options: [{
			displayName: 'Mount', name: 'mount', values: [
				{ displayName: 'Volume ID or Name', name: 'volume', type: 'string', default: '', required: true },
				{ displayName: 'Guest Path', name: 'guestPath', type: 'string', default: '/data', required: true },
				{ displayName: 'Read Only', name: 'readOnly', type: 'boolean', default: false },
			],
		}],
	},
	boxIdProperty('box', ['get', 'start', 'stop', 'delete', 'metrics']),
	{
		displayName: 'Force',
		name: 'force',
		type: 'boolean',
		default: true,
		displayOptions: { show: { resource: ['box'], operation: ['delete'] } },
		description: 'Whether to delete a running box instead of refusing',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['box'], operation: ['list'] } },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['box'], operation: ['list'], returnAll: [false] } },
		description: 'Max number of results to return',
	},

	// ------------------------------------------------------------ command
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['command'] } },
		default: 'execute',
		options: [
			{
				name: 'Execute',
				value: 'execute',
				action: 'Execute a command in a box',
				description: 'Run one command inside a box',
			},
		],
	},
	boxIdProperty('command', ['execute']),
	{
		displayName: 'Command',
		name: 'command',
		type: 'string',
		default: 'sh',
		required: true,
		displayOptions: { show: { resource: ['command'], operation: ['execute'] } },
		description: 'Executable to run, for example python3 or sh',
	},
	{
		displayName: 'Arguments',
		name: 'arguments',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		placeholder: 'Add Argument',
		displayOptions: { show: { resource: ['command'], operation: ['execute'] } },
		options: [
			{
				displayName: 'Argument',
				name: 'argument',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'One argument, passed as a separate argv entry',
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['command'], operation: ['execute'] } },
		options: [
			{
				displayName: 'Capture Output',
				name: 'captureOutput',
				type: 'boolean',
				default: true,
				description:
					'Whether to stream stdout and stderr over the execution WebSocket. Turn off to rely on the status endpoint alone.',
			},
			{
				displayName: 'Environment',
				name: 'env',
				type: 'json',
				default: '{}',
			},
			{
				displayName: 'Max Wait (Seconds)',
				name: 'maxWaitSeconds',
				type: 'number',
				default: 120,
				typeOptions: { minValue: 1 },
				description:
					'How long to wait before returning the execution ID so the workflow can continue with a Wait node',
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeoutSeconds',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Server-side command timeout. 0 leaves it to the server.',
			},
			{
				displayName: 'User',
				name: 'user',
				type: 'string',
				default: '',
				description: 'Run as this user inside the box, when the server supports it',
			},
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				description:
					'Whether to wait for the command to finish. Turn off to return the execution ID immediately.',
			},
			{
				displayName: 'Working Directory',
				name: 'workingDir',
				type: 'string',
				default: '',
			},
		],
	},

	// ---------------------------------------------------------- execution
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['execution'] } },
		default: 'get',
		options: [
			{ name: 'Get', value: 'get', action: 'Get an execution', description: 'Get one execution' },
			{ name: 'List', value: 'list', action: 'List executions', description: 'List a box’s executions' },
		],
	},
	boxIdProperty('execution', ['get', 'list']),
	{
		displayName: 'Execution ID',
		name: 'executionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['execution'], operation: ['get'] } },
	},

	// ------------------------------------------------------------- volume
	{
		displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
		displayOptions: { show: { resource: ['volume'] } }, default: 'create',
		options: [
			{ name: 'Create', value: 'create', action: 'Create a volume' },
			{ name: 'Delete', value: 'delete', action: 'Delete a volume' },
			{ name: 'Get', value: 'get', action: 'Get a volume' },
			{ name: 'List', value: 'list', action: 'List volumes' },
		],
	},
	{
		displayName: 'Name', name: 'name', type: 'string', default: '',
		displayOptions: { show: { resource: ['volume'], operation: ['create'] } },
		description: 'Optional name. Omitted when blank so the server assigns one.',
	},
	{
		displayName: 'Volume ID or Name', name: 'volumeId', type: 'string', default: '', required: true,
		displayOptions: { show: { resource: ['volume'], operation: ['get', 'delete'] } },
	},
	{
		displayName: 'Force', name: 'force', type: 'boolean', default: false,
		displayOptions: { show: { resource: ['volume'], operation: ['delete'] } },
		description: 'Whether to force deletion of a volume that may still be in use. This permanently deletes its data.',
	},

	// --------------------------------------------------------------- file
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['file'] } },
		default: 'upload',
		options: [
			{
				name: 'Download',
				value: 'download',
				action: 'Download a file from a box',
				description: 'Copy a file or a whole directory out of a box as binary data',
			},
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a file to a box',
				description: 'Copy one binary item into a box',
			},
		],
	},
	boxIdProperty('file', ['upload', 'download']),
	{
		displayName: 'Input Binary Field',
		name: 'inputBinaryField',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
		description: 'Name of the binary property that holds the file to upload',
	},
	{
		displayName: 'Destination Directory',
		name: 'destinationDir',
		type: 'string',
		default: '/workspace',
		required: true,
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
		description:
			'Directory inside the box to write into. /workspace is always writable. Paths under /tmp cannot be reached by the file API, so use exec with tar if you need them.',
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
		description: 'Name to store the file under. Defaults to the binary item’s own file name.',
	},
	{
		displayName: 'Source Path',
		name: 'sourcePath',
		type: 'string',
		default: '/workspace',
		required: true,
		displayOptions: { show: { resource: ['file'], operation: ['download'] } },
		description:
			'File or directory inside the box. A directory produces one output item per file, each with its relative path.',
	},
	{
		displayName: 'Output Binary Field',
		name: 'outputBinaryField',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: { show: { resource: ['file'], operation: ['download'] } },
	},
	{
		displayName: 'Max Download Size (MB)',
		name: 'maxDownloadMb',
		type: 'number',
		default: 100,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['file'], operation: ['download'] } },
		description:
			'Maximum tar download size, including archive headers. Larger transfers fail before the full response is buffered.',
	},
];

export class BoxLite implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BoxLite',
		name: 'boxLite',
		icon: 'file:boxlite.svg',
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Run commands in hardware-isolated BoxLite microVM sandboxes',
		defaults: { name: 'BoxLite' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'boxLiteApi', required: true }],
		properties: nodeProperties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			try {
				if (resource === 'box') {
					returnData.push({ json: await runBoxOperation.call(this, operation, i), pairedItem: { item: i } });
				} else if (resource === 'command') {
					returnData.push({ json: await runCommand.call(this, i), pairedItem: { item: i } });
				} else if (resource === 'execution') {
					returnData.push({ json: await runExecutionOperation.call(this, operation, i), pairedItem: { item: i } });
				} else if (resource === 'file') {
					returnData.push(...(await runFileOperation.call(this, operation, i, items[i])));
				} else if (resource === 'volume') {
					returnData.push({ json: await runVolumeOperation.call(this, operation, i), pairedItem: { item: i } });
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource "${resource}"`, {
						itemIndex: i,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const failure = error as Error & { description?: string; httpCode?: string };
					returnData.push({ json: {
						error: failure.message,
						...(failure.description ? { description: failure.description } : {}),
						...(failure.httpCode ? { httpCode: failure.httpCode } : {}),
					}, pairedItem: { item: i } });
					continue;
				}
				if (error instanceof NodeOperationError) throw error;
				// A wrapped API error already carries the server's status, message
				// and description. Re-wrapping it would replace them with a generic
				// "resource could not be found".
				if (error instanceof NodeApiError) throw error;
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

// ---------------------------------------------------------------- helpers

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `auto_stop` and `auto_delete` are seconds on the wire (the server default is
 * 900, i.e. 15 idle minutes), while the field is expressed in minutes.
 */
function minutesToSeconds(value: unknown): number | undefined {
	const minutes = Number(value);
	if (!Number.isFinite(minutes) || minutes <= 0) return undefined;
	return Math.round(minutes * 60);
}

/**
 * Reads an Environment field. A `json` parameter arrives as a string, so it has
 * to be parsed here — sending the raw string would either be rejected by the
 * server or, worse, look like it worked while the variables never reached the
 * process.
 */
function envFrom(ctx: IExecuteFunctions, value: unknown, index: number): IDataObject | undefined {
	if (value === undefined || value === null) return undefined;

	let parsed: unknown = value;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			throw new NodeOperationError(
				ctx.getNode(),
				'Environment must be a JSON object, for example {"FOO":"bar"}',
				{ itemIndex: index },
			);
		}
	}

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Environment must be a JSON object, for example {"FOO":"bar"}',
			{ itemIndex: index },
		);
	}

	const out: IDataObject = {};
	for (const [key, raw] of Object.entries(parsed as Record<string, unknown>)) {
		if (raw === null || raw === undefined) continue;
		if (typeof raw === 'object') {
			throw new NodeOperationError(
				ctx.getNode(),
				`Environment value for "${key}" must be a string or number`,
				{ itemIndex: index },
			);
		}
		out[key] = typeof raw === 'string' ? raw : String(raw);
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

async function runBoxOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject> {
	if (operation === 'create') {
		const image = (this.getNodeParameter('image', index) as string).trim();
		if (!image) {
			throw new NodeOperationError(this.getNode(), 'Provide an image for the box', {
				itemIndex: index,
			});
		}
		const name = (this.getNodeParameter('name', index, '') as string).trim();
		const ifExists = this.getNodeParameter('ifExists', index, 'fail') as string;
		const extra = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
		const autoStop = minutesToSeconds(extra.autoStopMinutes);
		const autoDelete = minutesToSeconds(extra.autoDeleteMinutes);
		if (autoStop !== undefined && autoDelete !== undefined && autoDelete <= autoStop) {
			throw new NodeOperationError(this.getNode(), 'Auto-Delete must be greater than Auto-Stop when both are configured', { itemIndex: index });
		}
		const mounts = this.getNodeParameter('volumeMounts', index, {}) as {
			mount?: Array<{ volume: string; guestPath: string; readOnly?: boolean }>;
		};
		const volumes = (mounts.mount ?? []).map((mount) => {
			const volume = mount.volume.trim();
			const guestPath = mount.guestPath.trim();
			if (!volume || !guestPath.startsWith('/') || guestPath.includes('\0')) {
				throw new NodeOperationError(this.getNode(), 'Each volume mount needs a volume ID or name and an absolute guest path', { itemIndex: index });
			}
			return { managed_volume: volume, guest_path: guestPath, read_only: mount.readOnly === true };
		});

		const body = compact({
			image,
			name: name || undefined,
			cpus: extra.cpus || undefined,
			memory_mib: extra.memoryMib || undefined,
			disk_size_gb: extra.diskSizeGb || undefined,
			working_dir: extra.workingDir || undefined,
			env: envFrom(this, extra.env, index),
			volumes: volumes.length ? volumes : undefined,
			// The API takes seconds; the field is in minutes so a human can type
			// "15" instead of "900".
			auto_stop: autoStop,
			auto_delete: autoDelete,
		});

		if (name && ifExists === 'reuse') {
			try {
				const existing = await request(this, 'GET', `/boxes/${encodeURIComponent(name)}`);
				return { ...existing, reused: true };
			} catch (error) {
				if (statusOf(error) !== 404) throw error;
			}
		}

		try {
			const created = await request(this, 'POST', '/boxes', body);
			return { ...created, reused: false };
		} catch (error) {
			if (statusOf(error) === 409 && name) {
				if (ifExists === 'reuse') {
					const existing = await request(this, 'GET', `/boxes/${encodeURIComponent(name)}`);
					return { ...existing, reused: true };
				}
				throw new NodeOperationError(
					this.getNode(),
					`A box named "${name}" already exists. Set "If a Box With This Name Exists" to "Reuse It", or pick another name.`,
					{ itemIndex: index },
				);
			}
			throw error;
		}
	}

	if (operation === 'list') {
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		if (!returnAll && (!Number.isInteger(limit) || limit < 1)) {
			throw new NodeOperationError(this.getNode(), 'Limit must be a positive integer', { itemIndex: index });
		}
		const boxes: IDataObject[] = [];
		const seenTokens = new Set<string>();
		let pageToken: string | undefined;

		do {
			const query: Record<string, string> = pageToken ? { pageToken } : {};
			const page = (await request(this, 'GET', '/boxes', undefined, query)) as {
				boxes?: IDataObject[];
				next_page_token?: string | null;
			};
			boxes.push(...(page.boxes ?? []));
			pageToken = page.next_page_token ?? undefined;
			if (pageToken && (returnAll || boxes.length < limit)) {
				if (seenTokens.has(pageToken)) throw new NodeOperationError(this.getNode(), 'Server repeated a page token; refusing an endless list', { itemIndex: index });
				seenTokens.add(pageToken);
			}
		} while (pageToken && (returnAll || boxes.length < limit));

		return { boxes: returnAll ? boxes : boxes.slice(0, limit) };
	}

	const boxId = requireBoxId(this, index);
	const path = `/boxes/${encodeURIComponent(boxId)}`;

	if (operation === 'get') return await request(this, 'GET', path);
	if (operation === 'start') return await request(this, 'POST', `${path}/start`);
	if (operation === 'stop') return await request(this, 'POST', `${path}/stop`);
	if (operation === 'metrics') return await request(this, 'GET', `${path}/metrics`);
	if (operation === 'delete') {
		const force = this.getNodeParameter('force', index, true) as boolean;
		await request(this, 'DELETE', path, undefined, force ? { force: 'true' } : undefined);
		return { box_id: boxId, deleted: true };
	}

	throw new NodeOperationError(this.getNode(), `Unknown box operation "${operation}"`, {
		itemIndex: index,
	});
}

async function runCommand(this: IExecuteFunctions, index: number): Promise<IDataObject> {
	const boxId = requireBoxId(this, index);
	const command = (this.getNodeParameter('command', index) as string).trim();
	if (!command) {
		throw new NodeOperationError(this.getNode(), 'Provide a command to run', { itemIndex: index });
	}

	const argumentsParam = this.getNodeParameter('arguments', index, {}) as {
		argument?: Array<{ value: string }>;
	};
	const args = (argumentsParam.argument ?? []).map((entry) => entry.value);

	const extra = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
	const waitForCompletion = extra.waitForCompletion !== false;
	const captureOutput = extra.captureOutput !== false;
	const maxWaitSeconds = (extra.maxWaitSeconds as number | undefined) ?? 120;
	if (!Number.isFinite(maxWaitSeconds) || maxWaitSeconds < 1) {
		throw new NodeOperationError(this.getNode(), 'Max Wait must be at least 1 second', { itemIndex: index });
	}

	const body = compact({
		command,
		args: args.length > 0 ? args : undefined,
		env: envFrom(this, extra.env, index),
		timeout_seconds: extra.timeoutSeconds || undefined,
		working_dir: extra.workingDir || undefined,
		user: extra.user || undefined,
	});

	const execution = (await request(
		this,
		'POST',
		`/boxes/${encodeURIComponent(boxId)}/exec`,
		body,
	)) as BoxLiteExecution;

	const base: IDataObject = { box_id: boxId, execution_id: execution.execution_id };

	if (!waitForCompletion) {
		return { ...base, status: 'running', waited: false };
	}

	// One deadline for the whole wait, so a failed attach cannot silently double
	// the time the node spends before returning.
	const deadline = Date.now() + Math.max(maxWaitSeconds, 1) * 1000;

	if (captureOutput) {
		const credentials = (await this.getCredentials('boxLiteApi')) as unknown as BoxLiteCredentials;
		const attached = await attachExecution(
			credentials,
			boxId,
			execution.execution_id,
			Math.max(deadline - Date.now(), 0),
		);

		if (attached.exited) {
			const status = await waitForTerminal(this, boxId, execution.execution_id, deadline);
			return {
				...base,
				status: status.status,
				exit_code: status.exit_code ?? attached.exitCode,
				...(status.error_message ? { error_message: status.error_message } : {}),
				stdout: attached.stdout,
				stderr: attached.stderr,
				output_captured: true,
				output_truncated: attached.truncated === true,
				...(attached.note ? { note: attached.note } : {}),
			};
		}

		// The socket failed or timed out: the exit code may still be available,
		// but the streamed output is not. Say so instead of implying silence.
		const status = await waitForTerminal(this, boxId, execution.execution_id, deadline);
		const note = [attached.note, attached.errorMessage].filter(Boolean).join(' ');
		return {
			...base,
			status: status.status,
			exit_code: status.exit_code ?? null,
			...(status.error_message ? { error_message: status.error_message } : {}),
			stdout: attached.stdout,
			stderr: attached.stderr,
			output_captured: false,
			output_truncated: attached.truncated === true,
			...(note ? { note } : {}),
		};
	}

	const status = await waitForTerminal(this, boxId, execution.execution_id, deadline);
	return {
		...base,
		status: status.status,
		exit_code: status.exit_code ?? null,
		...(status.error_message ? { error_message: status.error_message } : {}),
		output_captured: false,
	};
}

interface ExecutionStatus {
	status: string;
	exit_code?: number | null;
	error_message?: string | null;
}

async function waitForTerminal(
	ctx: IExecuteFunctions,
	boxId: string,
	executionId: string,
	deadline: number,
): Promise<ExecutionStatus> {
	const path = `/boxes/${encodeURIComponent(boxId)}/executions/${encodeURIComponent(executionId)}`;

	let status: ExecutionStatus = { status: 'running' };
	for (;;) {
		const budget = deadline - Date.now();
		if (budget <= 0) return status;
		try {
			status = (await request(ctx, 'GET', path, undefined, undefined, Math.min(30_000, budget))) as ExecutionStatus;
		} catch (error) {
			// A request using the remaining budget can time out at the ceiling.
			// Keep the execution ID usable, but never swallow an HTTP/API refusal.
			if (Date.now() >= deadline && statusOf(error) === undefined) return status;
			throw error;
		}
		if (TERMINAL_STATUSES.includes(status.status)) return status;
		const remaining = deadline - Date.now();
		if (remaining <= 0) return status;
		await sleep(Math.min(1000, remaining));
	}
}

async function runExecutionOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject> {
	const boxId = requireBoxId(this, index);
	const base = `/boxes/${encodeURIComponent(boxId)}/executions`;

	if (operation === 'list') {
		const result = (await request(this, 'GET', base)) as IDataObject | IDataObject[];
		return Array.isArray(result) ? { executions: result } : result;
	}
	if (operation === 'get') {
		const executionId = (this.getNodeParameter('executionId', index, '') as string).trim();
		if (!executionId) {
			throw new NodeOperationError(this.getNode(), 'Provide an execution ID', { itemIndex: index });
		}
		return await request(this, 'GET', `${base}/${encodeURIComponent(executionId)}`);
	}

	throw new NodeOperationError(this.getNode(), `Unknown execution operation "${operation}"`, {
		itemIndex: index,
	});
}

// ------------------------------------------------------------------ files

/**
 * Upload into a unique staging directory so concurrent uploads and a user's
 * existing `extracted` directory are never mixed with server staging data.
 */
async function flattenStaging(
	ctx: IExecuteFunctions,
	boxId: string,
	destinationDir: string,
	stagingDir: string,
	fileName: string,
): Promise<void> {
	const script = [
		'd="$1"; s="$2"; n="$3"',
		'if [ -d "$d/$n" ] || [ -L "$d/$n" ]; then echo "Upload target is a directory or symbolic link" >&2; exit 1; fi',
		'if [ -d "$s/extracted" ]; then src="$s/extracted/$n"; else src="$s/$n"; fi',
		'cp -a "$src" "$d/$n" && rm -f "$src" || exit 1',
		'if [ -d "$s/extracted" ]; then rmdir "$s/extracted" || exit 1; fi',
		'rmdir "$s"',
	].join('\n');

	const execution = (await request(ctx, 'POST', `/boxes/${encodeURIComponent(boxId)}/exec`, {
		command: 'sh',
		args: ['-c', script, '_', destinationDir, stagingDir, fileName],
	})) as BoxLiteExecution;

	const status = await waitForTerminal(
		ctx,
		boxId,
		execution.execution_id,
		Date.now() + 60_000,
	);

	if (status.status !== 'completed' || (status.exit_code ?? 0) !== 0) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Uploaded, but could not finalize ${joinPath(destinationDir, fileName)} (exit ${status.exit_code ?? 'unknown'}). The target must not be a directory or symbolic link. Staging: ${stagingDir}; execution: ${execution.execution_id}.`,
		);
	}
}

function sha256(data: Buffer): string {
	return createHash('sha256').update(data).digest('hex');
}

/** Keeps uploads inside the destination directory, whatever the binary is called. */
function sanitizeFileName(name: string): string {
	const base = name.split(/[\\/]/).pop()?.trim() ?? '';
	if (!base || base === '.' || base === '..' || base.includes('\0')) {
		throw new Error('The file name must be a plain name without a path');
	}
	return base;
}

function joinPath(dir: string, name: string): string {
	const trimmed = dir.replace(/\/+$/, '');
	return trimmed ? `${trimmed}/${name}` : `/${name}`;
}

async function runFileOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
	item: INodeExecutionData,
): Promise<INodeExecutionData[]> {
	const boxId = requireBoxId(this, index);

	if (operation === 'upload') {
		const binaryField = (this.getNodeParameter('inputBinaryField', index, 'data') as string).trim();
		const destinationDir =
			(this.getNodeParameter('destinationDir', index, '/workspace') as string).trim() || '/workspace';
		const overrideName = (this.getNodeParameter('fileName', index, '') as string).trim();
		if (!destinationDir.startsWith('/') || destinationDir.includes('\0')) {
			throw new NodeOperationError(this.getNode(), 'Destination Directory must be an absolute path', { itemIndex: index });
		}

		const binary = item.binary?.[binaryField];
		if (!binary) {
			throw new NodeOperationError(
				this.getNode(),
				`No binary data in field "${binaryField}". Connect a node that produces a file, or change Input Binary Field.`,
				{ itemIndex: index },
			);
		}

		const data = await this.helpers.getBinaryDataBuffer(index, binaryField);
		let fileName: string;
		try {
			fileName = sanitizeFileName(overrideName || binary.fileName || 'file.bin');
		} catch (error) {
			throw new NodeOperationError(this.getNode(), (error as Error).message, {
				itemIndex: index,
			});
		}

		const archive = await packSingleFile(fileName, data);
		const stagingDir = joinPath(destinationDir, `.n8n-boxlite-${randomUUID()}`);
		const query = `path=${encodeURIComponent(stagingDir)}&source_is_dir=false`;
		await requestBinary(
			this,
			'PUT',
			`/boxes/${encodeURIComponent(boxId)}/files?${query}`,
			archive,
			'application/x-tar',
		);

		await flattenStaging(this, boxId, destinationDir, stagingDir, fileName);

		return [
			{
				json: {
					box_id: boxId,
					path: joinPath(destinationDir, fileName),
					file_name: fileName,
					bytes: data.length,
					sha256: sha256(data),
				},
				pairedItem: { item: index },
			},
		];
	}

	if (operation === 'download') {
		const sourcePath =
			(this.getNodeParameter('sourcePath', index, '/workspace') as string).trim() || '/workspace';
		const outputField = (this.getNodeParameter('outputBinaryField', index, 'data') as string).trim();
		const maxMb = this.getNodeParameter('maxDownloadMb', index, 100) as number;
		if (!Number.isFinite(maxMb) || maxMb < 1) {
			throw new NodeOperationError(this.getNode(), 'Max Download Size must be at least 1 MB', { itemIndex: index });
		}
		if (!sourcePath.startsWith('/') || sourcePath.includes('\0') || !outputField) {
			throw new NodeOperationError(this.getNode(), 'Provide an absolute Source Path and a non-empty Output Binary Field', { itemIndex: index });
		}

		const archive = await requestBinary(
			this,
			'GET',
			`/boxes/${encodeURIComponent(boxId)}/files?path=${encodeURIComponent(sourcePath)}`,
			undefined,
			undefined,
			'application/x-tar',
			maxMb * 1024 * 1024,
		);

		let entries;
		try {
			entries = await unpackTar(archive, maxMb * 1024 * 1024);
		} catch (error) {
			throw new NodeOperationError(this.getNode(), (error as Error).message, {
				itemIndex: index,
			});
		}

		const files = entries.filter((entry) => !entry.isDirectory && entry.name !== '');
		if (files.length === 0) {
			throw new NodeOperationError(this.getNode(), `No files found at "${sourcePath}"`, {
				itemIndex: index,
			});
		}

		const normalizedSource = sourcePath.replace(/\/+$/, '') || '/';
		const basename = normalizedSource.split('/').pop() || '';
		const directories = entries.filter((entry) => entry.isDirectory).map((entry) => entry.name);
		const root = basename && directories.includes(basename) && files.every((file) => file.name.startsWith(`${basename}/`)) ? basename : undefined;
		const isDirectory = Boolean(root) || normalizedSource === '/' || files.length > 1 ||
			files.some((file) => file.name.includes('/')) || directories.some((dir) => dir !== '.' && dir !== '');
		const results: INodeExecutionData[] = [];

		for (const file of files) {
			const relative = root ? file.name.slice(root.length + 1) : file.name;
			const fullPath = isDirectory ? joinPath(normalizedSource, relative) : normalizedSource;
			const fileName = relative.split('/').pop() || 'file.bin';

			results.push({
				json: {
					box_id: boxId,
					path: fullPath,
					relative_path: relative,
					file_name: fileName,
					bytes: file.data.length,
					sha256: sha256(file.data),
				},
				binary: {
					[outputField]: await this.helpers.prepareBinaryData(file.data, fileName),
				},
				pairedItem: { item: index },
			});
		}

		return results;
	}

	throw new NodeOperationError(this.getNode(), `Unknown file operation "${operation}"`, {
		itemIndex: index,
	});
}

async function runVolumeOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject> {
	if (operation === 'create') {
		const name = (this.getNodeParameter('name', index, '') as string).trim();
		return await request(this, 'POST', '/volumes', compact({ name: name || undefined }));
	}
	if (operation === 'list') return await request(this, 'GET', '/volumes');
	if (operation === 'get' || operation === 'delete') {
		const id = (this.getNodeParameter('volumeId', index, '') as string).trim();
		if (!id) throw new NodeOperationError(this.getNode(), 'Provide a volume ID or name', { itemIndex: index });
		const path = `/volumes/${encodeURIComponent(id)}`;
		if (operation === 'get') return await request(this, 'GET', path);
		const force = this.getNodeParameter('force', index, false) as boolean;
		await request(this, 'DELETE', path, undefined, force ? { force: 'true' } : undefined);
		return { id, deleted: true };
	}
	throw new NodeOperationError(this.getNode(), `Unknown volume operation "${operation}"`, { itemIndex: index });
}
