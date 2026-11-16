const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BoxLite } = require('../dist/nodes/BoxLite/BoxLite.node');
const { requestBinary } = require('../dist/nodes/BoxLite/transport');
const { Readable } = require('node:stream');
const { pack } = require('tar-stream');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const node = new BoxLite();
function context(parameters, response = {}, credentials = {}) {
	const calls = [];
	return {
		calls,
		getInputData: () => [{ json: {} }],
		getNodeParameter: (key, _index, fallback) => parameters[key] ?? fallback,
		getCredentials: async () => ({ baseUrl: 'http://example.test', ...credentials }),
		getNode: () => ({ name: 'BoxLite', type: 'n8n-nodes-boxlite.boxLite', typeVersion: 1, parameters: {}, position: [0, 0] }),
		continueOnFail: () => false,
		helpers: {
			httpRequest: async (options) => {
				calls.push(options);
				if (response instanceof Error) throw response;
				return response;
			},
		},
	};
}

test('Volume Create sends an optional name and preserves the raw response', async () => {
	for (const name of ['', '  ', 'my-data']) {
		const response = { id: 'vol_1', name: name.trim() || 'vol_1', created_at: '2026-11-16T00:00:00Z' };
		const ctx = context({ resource: 'volume', operation: 'create', name }, response);
		const result = await node.execute.call(ctx);
		assert.deepEqual(result[0][0].json, response);
		assert.deepEqual(ctx.calls[0].body, name.trim() ? { name: name.trim() } : {});
		assert.equal(ctx.calls[0].method, 'POST');
		assert.equal(ctx.calls[0].url, 'http://example.test/v1/volumes');
		assert.equal(ctx.calls[0].headers.Authorization, undefined);
	}
});

test('Volume List preserves the volumes envelope, including an empty list', async () => {
	for (const response of [{ volumes: [] }, { volumes: [{ id: 'vol_1' }] }]) {
		const ctx = context({ resource: 'volume', operation: 'list' }, response);
		assert.deepEqual((await node.execute.call(ctx))[0][0].json, response);
		assert.equal(ctx.calls[0].method, 'GET');
	}
});

test('Volume Get encodes the ID and uses the credential prefix and bearer', async () => {
	const ctx = context({ resource: 'volume', operation: 'get', volumeId: 'data/a b' }, { id: 'vol_1' }, { pathPrefix: '/org/', apiKey: 'test-key' });
	await node.execute.call(ctx);
	assert.equal(ctx.calls[0].url, 'http://example.test/v1/org/volumes/data%2Fa%20b');
	assert.equal(ctx.calls[0].headers.Authorization, 'Bearer test-key');
});

test('Volume Delete is non-force by default, force is opt-in', async () => {
	for (const force of [undefined, false, true]) {
		const ctx = context({ resource: 'volume', operation: 'delete', volumeId: 'vol_1', force });
		assert.deepEqual((await node.execute.call(ctx))[0][0].json, { id: 'vol_1', deleted: true });
		assert.equal(ctx.calls[0].method, 'DELETE');
		assert.deepEqual(ctx.calls[0].qs, force ? { force: 'true' } : undefined);
	}
});

test('Volume Get/Delete reject blank IDs without sending a request', async () => {
	for (const operation of ['get', 'delete']) {
		const ctx = context({ resource: 'volume', operation, volumeId: ' ' });
		await assert.rejects(() => node.execute.call(ctx), /Provide a volume ID or name/);
		assert.equal(ctx.calls.length, 0);
	}
});

test('Volume errors retain HTTP status and unsupported detail', async () => {
	const error = Object.assign(new Error('named volumes are not supported yet'), { statusCode: 400 });
	const ctx = context({ resource: 'volume', operation: 'list' }, error);
	await assert.rejects(() => node.execute.call(ctx), (e) => e.httpCode === '400' && /named volumes/.test(e.description));
});

test('Box Create sends managed volume wire fields, and omits unused mounts', async () => {
	for (const mount of [undefined, { volume: 'my-data', guestPath: '/data', readOnly: true }]) {
		const ctx = context({ resource: 'box', operation: 'create', image: 'alpine:latest', volumeMounts: mount ? { mount: [mount] } : {} });
		await node.execute.call(ctx);
		assert.deepEqual(ctx.calls[0].body.volumes, mount ? [{ managed_volume: 'my-data', guest_path: '/data', read_only: true }] : undefined);
	}
});

test('Box Create rejects invalid mount paths before calling the API', async () => {
	const ctx = context({ resource: 'box', operation: 'create', image: 'alpine:latest', volumeMounts: { mount: [{ volume: 'data', guestPath: 'relative' }] } });
	await assert.rejects(() => node.execute.call(ctx), /absolute guest path/);
	assert.equal(ctx.calls.length, 0);
});

test('required IDs and operation fields stay scoped to their resource', () => {
	for (const property of node.description.properties) {
		if (['boxId', 'volumeId', 'operation'].includes(property.name)) {
			assert.equal(property.displayOptions.show.resource.length, 1);
		}
	}
});

test('binary download consumes a stream and aborts when its byte limit is crossed', async () => {
	const ctx = context({}, { body: Readable.from([Buffer.alloc(10), Buffer.alloc(20)]) });
	assert.equal((await requestBinary(ctx, 'GET', '/files', undefined, undefined, 'application/x-tar', 30)).length, 30);
	assert.equal(ctx.calls[0].encoding, 'stream');
	const stream = Readable.from([Buffer.alloc(10), Buffer.alloc(21)]);
	const tooLarge = context({}, { body: stream });
	await assert.rejects(() => requestBinary(tooLarge, 'GET', '/files', undefined, undefined, 'application/x-tar', 30), /exceeds Max Download/);
	assert.equal(stream.destroyed, true);
});

test('binary errors decode JSON from streams and buffers with status intact', async () => {
	const body = JSON.stringify({ error: { message: 'not found: source path does not exist', code: 'not_found' } });
	for (const raw of [Buffer.from(body), Readable.from([Buffer.from(body)])]) {
		const ctx = context({}, { statusCode: 404, body: raw });
		await assert.rejects(() => requestBinary(ctx, 'GET', '/files', undefined, undefined, 'application/x-tar', 1024),
			(e) => e.httpCode === '404' && /source path does not exist/.test(e.description ?? e.message));
	}
});

test('all one-to-one resources retain item links for multiple inputs', async () => {
	for (const parameters of [
		{ resource: 'box', operation: 'get', boxId: 'box' },
		{ resource: 'command', operation: 'execute', boxId: 'box', command: 'true', additionalFields: { waitForCompletion: false } },
		{ resource: 'execution', operation: 'get', boxId: 'box', executionId: 'exec' },
	]) {
		const ctx = context(parameters, { execution_id: 'exec' });
		ctx.getInputData = () => [{ json: {} }, { json: {} }];
		assert.deepEqual((await node.execute.call(ctx))[0].map((i) => i.pairedItem), [{ item: 0 }, { item: 1 }]);
	}
});

test('Command preserves empty argv values and terminal error messages', async () => {
	const ctx = context({ resource: 'command', operation: 'execute', boxId: 'box', command: 'printf', arguments: { argument: [{ value: '%s' }, { value: '' }, { value: 'last' }] }, additionalFields: { captureOutput: false } });
	ctx.helpers.httpRequest = async (options) => {
		ctx.calls.push(options);
		return options.method === 'POST' ? { execution_id: 'exec' } : { status: 'timed_out', exit_code: 124, error_message: 'deadline exceeded' };
	};
	const result = (await node.execute.call(ctx))[0][0].json;
	assert.deepEqual(ctx.calls[0].body.args, ['%s', '', 'last']);
	assert.equal(result.error_message, 'deadline exceeded');
	assert.ok(ctx.calls[1].timeout > 0 && ctx.calls[1].timeout <= 120000);
});

test('Box List follows pages up to the requested limit', async () => {
	const ctx = context({ resource: 'box', operation: 'list', limit: 3 });
	const pages = [{ boxes: [{ box_id: '1' }], next_page_token: 'a' }, { boxes: [{ box_id: '2' }, { box_id: '3' }], next_page_token: 'b' }];
	ctx.helpers.httpRequest = async (options) => { ctx.calls.push(options); return pages.shift(); };
	assert.equal((await node.execute.call(ctx))[0][0].json.boxes.length, 3);
	assert.deepEqual(ctx.calls[1].qs, { pageToken: 'a' });
	assert.equal(ctx.calls.length, 2);
});

test('Box List refuses repeated pagination tokens instead of looping', async () => {
	const ctx = context({ resource: 'box', operation: 'list', returnAll: true });
	ctx.helpers.httpRequest = async (options) => {
		ctx.calls.push(options);
		if (ctx.calls.length > 3) throw new Error('test guard: infinite pagination');
		return { boxes: [], next_page_token: 'same' };
	};
	await assert.rejects(() => node.execute.call(ctx), /repeated.*page token/i);
	assert.equal(ctx.calls.length, 2);
});

test('reuse recovers from a concurrent create name conflict', async () => {
	const ctx = context({ resource: 'box', operation: 'create', image: 'alpine:latest', name: 'shared', ifExists: 'reuse' });
	ctx.helpers.httpRequest = async (options) => {
		ctx.calls.push(options);
		if (ctx.calls.length === 1) throw Object.assign(new Error('missing'), { statusCode: 404 });
		if (options.method === 'POST') throw Object.assign(new Error('already exists'), { statusCode: 409 });
		return { box_id: 'winner' };
	};
	assert.deepEqual((await node.execute.call(ctx))[0][0].json, { box_id: 'winner', reused: true });
});

async function tarEntries(entries) {
	const archive = pack();
	const chunks = [];
	const done = new Promise((resolve, reject) => {
		archive.on('data', (data) => chunks.push(data));
		archive.on('end', () => resolve(Buffer.concat(chunks)));
		archive.on('error', reject);
	});
	for (const entry of entries) archive.entry(entry, entry.type === 'directory' ? undefined : Buffer.from('x'));
	archive.finalize();
	return done;
}

test('Download maps root paths and strips only a real archive wrapper', async () => {
	for (const [sourcePath, entries, paths] of [
		['/', [{ name: '.', type: 'directory' }, { name: 'a/x' }, { name: 'b/y' }], ['/a/x', '/b/y']],
		['/workspace/', [{ name: 'workspace', type: 'directory' }, { name: 'workspace/sub/x' }], ['/workspace/sub/x']],
		['/workspace', [{ name: '.', type: 'directory' }, { name: 'sub/x' }], ['/workspace/sub/x']],
		['/workspace/file.txt', [{ name: '.', type: 'directory' }, { name: 'file.txt' }], ['/workspace/file.txt']],
	]) {
		const ctx = context({ resource: 'file', operation: 'download', boxId: 'box', sourcePath }, { body: await tarEntries(entries) });
		ctx.helpers.prepareBinaryData = async () => ({ data: '', mimeType: 'text/plain' });
		const result = (await node.execute.call(ctx))[0];
		assert.deepEqual(result.map((i) => i.json.path), paths);
	}
});

test('explicit invalid download limits fail before making HTTP requests', async () => {
	for (const maxDownloadMb of [0, -1, NaN, Infinity]) {
		const ctx = context({ resource: 'file', operation: 'download', boxId: 'box', maxDownloadMb });
		await assert.rejects(() => node.execute.call(ctx), /at least 1 MB/);
		assert.equal(ctx.calls.length, 0);
	}
});

test('binary fallback responses must obey the same byte cap as streams', async () => {
	for (const raw of [Buffer.alloc(31), new ArrayBuffer(31), 'x'.repeat(31)]) {
		const ctx = context({}, { body: raw });
		await assert.rejects(() => requestBinary(ctx, 'GET', '/files', undefined, undefined, 'application/x-tar', 30), /exceeds Max Download/);
	}
});

test('Upload finalization rejects directories and symlinks, never silently nesting files', async (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boxlite-upload-test-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const ctx = context({ resource: 'file', operation: 'upload', boxId: 'box', destinationDir: root, fileName: 'target' });
	ctx.getInputData = () => [{ json: {}, binary: { data: { fileName: 'target' } } }];
	ctx.helpers.getBinaryDataBuffer = async () => Buffer.from('new');
	let script;
	ctx.helpers.httpRequest = async (options) => {
		if (options.method === 'PUT') return { statusCode: 204, body: Buffer.alloc(0) };
		if (options.method === 'POST') { script = options.body.args[1]; return { execution_id: 'exec' }; }
		return { status: 'completed', exit_code: 0 };
	};
	await node.execute.call(ctx);
	for (const kind of ['directory', 'symlink']) {
		const dest = path.join(root, kind);
		const stage = path.join(dest, '.stage');
		fs.mkdirSync(path.join(stage, 'extracted'), { recursive: true });
		fs.writeFileSync(path.join(stage, 'extracted', 'target'), 'new');
		if (kind === 'directory') fs.mkdirSync(path.join(dest, 'target'));
		else { fs.writeFileSync(path.join(dest, 'old'), 'old'); fs.symlinkSync('old', path.join(dest, 'target')); }
		assert.throws(() => execFileSync('sh', ['-c', script, '_', dest, stage, 'target'], { stdio: 'pipe' }));
		if (kind === 'directory') assert.deepEqual(fs.readdirSync(path.join(dest, 'target')), []);
		else assert.equal(fs.readFileSync(path.join(dest, 'old'), 'utf8'), 'old');
	}
});

test('invalid auto-delete/auto-stop combinations fail clearly before the API', async () => {
	const ctx = context({ resource: 'box', operation: 'create', image: 'alpine:latest', additionalFields: { autoStopMinutes: 5, autoDeleteMinutes: 5 } });
	await assert.rejects(() => node.execute.call(ctx), /Auto-Delete must be greater than Auto-Stop/);
	assert.equal(ctx.calls.length, 0);
});
