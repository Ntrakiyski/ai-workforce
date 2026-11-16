const { test } = require('node:test');
const assert = require('node:assert/strict');
const { WebSocketServer } = require('ws');
const { attachExecution } = require('../dist/nodes/BoxLite/attach');
const { BoxLite } = require('../dist/nodes/BoxLite/BoxLite.node');

async function server(t, messages) {
	const ws = new WebSocketServer({ host: '127.0.0.1', port: 0 });
	await new Promise((resolve) => ws.once('listening', resolve));
	t.after(async () => {
		for (const client of ws.clients) client.terminate();
		await new Promise((resolve) => ws.close(resolve));
	});
	ws.on('connection', (socket) => { for (const message of messages) socket.send(message); });
	return { baseUrl: `http://127.0.0.1:${ws.address().port}` };
}

test('attach strictly caps one oversized frame and exposes truncation', async (t) => {
	const credentials = await server(t, [Buffer.concat([Buffer.from([1]), Buffer.alloc(1024 * 1024 + 100, 'a')]), JSON.stringify({ type: 'exit', exit_code: 0 })]);
	const result = await attachExecution(credentials, 'box', 'exec', 2000);
	assert.equal(Buffer.byteLength(result.stdout), 1024 * 1024);
	assert.equal(result.truncated, true);
	assert.match(result.note, /truncated/);
});

test('attach ignores unknown binary channels without charging the output allowance', async (t) => {
	const credentials = await server(t, [Buffer.concat([Buffer.from([9]), Buffer.alloc(1024 * 1024)]), Buffer.from([1, 111, 107]), JSON.stringify({ type: 'exit', exit_code: 0 })]);
	assert.equal((await attachExecution(credentials, 'box', 'exec', 2000)).stdout, 'ok');
});

test('successful attach preserves authoritative terminal status and notes in Command output', async (t) => {
	const credentials = await server(t, [Buffer.concat([Buffer.from([1]), Buffer.alloc(1024 * 1024 + 1, 'a')]), JSON.stringify({ type: 'exit', exit_code: 124 })]);
	const params = { resource: 'command', operation: 'execute', boxId: 'box', command: 'sleep', additionalFields: { maxWaitSeconds: 2 } };
	const ctx = {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (key, _index, fallback) => params[key] ?? fallback,
		getNode: () => ({ name: 'BoxLite', type: 'n8n-nodes-boxlite.boxLite', typeVersion: 1, parameters: {}, position: [0, 0] }),
		getCredentials: async () => credentials,
		continueOnFail: () => false,
		helpers: { httpRequest: async (o) => o.method === 'POST' ? { execution_id: 'exec' } : { status: 'timed_out', exit_code: 124, error_message: 'server timeout' } },
	};
	const result = (await new BoxLite().execute.call(ctx))[0][0].json;
	assert.equal(result.status, 'timed_out');
	assert.equal(result.error_message, 'server timeout');
	assert.equal(result.output_truncated, true);
	assert.match(result.note, /truncated/);
});

test('invalid WebSocket URL returns an explicit unavailable result', async () => {
	const result = await attachExecution({ baseUrl: 'not a URL' }, 'box', 'exec', 100);
	assert.equal(result.exited, false);
	assert.match(result.note, /failed/i);
});

test('attach ignores JSON null and does not invent an exit code for malformed control frames', async (t) => {
	const credentials = await server(t, ['null', '[]', 'not-json', JSON.stringify({ type: 'exit' })]);
	const result = await attachExecution(credentials, 'box', 'exec', 2000);
	assert.equal(result.exited, false);
	assert.match(result.note, /valid exit code/);
});
