import WebSocket from 'ws';

import type { BoxLiteCredentials } from './transport';
import { wsBase } from './transport';

export interface AttachResult {
	stdout: string;
	stderr: string;
	exitCode?: number;
	errorMessage?: string;
	exited: boolean;
	note?: string;
	truncated?: boolean;
}

const MAX_CAPTURE_BYTES = 1024 * 1024;

/**
 * Streams one execution's output from
 * `WS /v1/boxes/{box}/executions/{exec}/attach`.
 *
 * Wire protocol (from the BoxLite SDK): binary frames carry a channel byte
 * first — 0x01 stdout, 0x02 stderr — and text frames are JSON control messages,
 * either {"type":"exit","exit_code":n} or {"type":"error","message":"…"}.
 */
export function attachExecution(
	credentials: BoxLiteCredentials,
	boxId: string,
	executionId: string,
	maxWaitMs: number,
): Promise<AttachResult> {
	const url = `${wsBase(credentials)}/boxes/${encodeURIComponent(boxId)}/executions/${encodeURIComponent(
		executionId,
	)}/attach?stdin=0`;

	const headers: Record<string, string> = {};
	if (credentials.apiKey) headers.Authorization = `Bearer ${credentials.apiKey}`;

	return new Promise<AttachResult>((resolve) => {
		const stdout: Buffer[] = [];
		const stderr: Buffer[] = [];
		let captured = 0;
		let truncated = false;
		let settled = false;
		let errorMessage: string | undefined;
		let timer: ReturnType<typeof setTimeout>;

		let socket: WebSocket;
		try {
			socket = new WebSocket(url, { headers, maxPayload: 2 * MAX_CAPTURE_BYTES, handshakeTimeout: Math.max(1, maxWaitMs) });
		} catch (error) {
			resolve({ stdout: '', stderr: '', exited: false, note: `Output stream failed: ${(error as Error).message}` });
			return;
		}

		const finish = (result: Omit<AttachResult, 'stdout' | 'stderr'>) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			try {
				socket.terminate();
			} catch {
				/* already closed */
			}
			resolve({
				...result,
				stdout: Buffer.concat(stdout).toString('utf8'),
				stderr: Buffer.concat(stderr).toString('utf8'),
				errorMessage: result.errorMessage ?? errorMessage,
				truncated,
				note: [result.note, truncated ? 'Output was truncated at 1 MiB.' : undefined].filter(Boolean).join(' ') || undefined,
			});
		};

		timer = setTimeout(() => {
			finish({
				exited: false,
				note: `No exit frame within ${Math.round(maxWaitMs / 1000)}s; check the execution status.`,
			});
		}, Math.max(maxWaitMs, 1));

		socket.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
			if (settled) return;
			const buffer = Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data as ArrayBuffer);

			if (isBinary) {
				if (buffer.length === 0) return;
				const channel = buffer[0];
				if (channel !== 0x01 && channel !== 0x02) return;
				const payload = buffer.subarray(1);
				const remaining = MAX_CAPTURE_BYTES - captured;
				if (payload.length > remaining) truncated = true;
				if (remaining <= 0) return;
				// Copy the slice: a subarray would retain the whole oversized frame.
				const bytes = Buffer.from(payload.subarray(0, remaining));
				captured += bytes.length;
				if (channel === 0x01) stdout.push(bytes);
				else stderr.push(bytes);
				return;
			}

			let control: { type?: string; exit_code?: number; message?: string };
			try {
				control = JSON.parse(buffer.toString('utf8')) as typeof control;
			} catch {
				return;
			}
			if (!control || typeof control !== 'object') return;
			if (control.type === 'exit') {
				if (!Number.isInteger(control.exit_code)) {
					finish({ exited: false, note: 'Output stream sent an exit frame without a valid exit code.' });
					return;
				}
				finish({ exited: true, exitCode: control.exit_code });
			} else if (control.type === 'error') {
				errorMessage = control.message ?? 'BoxLite reported an error';
				finish({ exited: false, errorMessage });
			}
		});

		socket.on('error', (error: Error) => {
			finish({ exited: false, note: `Output stream failed: ${error.message}` });
		});

		socket.on('close', () => {
			finish({ exited: false, note: 'Output stream closed before the exit frame.' });
		});
	});
}
