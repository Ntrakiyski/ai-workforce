const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pack } = require('tar-stream');
const { packSingleFile, unpackTar, normalizeEntryName } = require('../dist/nodes/BoxLite/tar');

test('tar round trips empty files, arbitrary bytes, and long pax names', async () => {
	for (const [name, data] of [['empty.txt', Buffer.alloc(0)], ['bytes.bin', Buffer.from(Array.from({ length: 4096 }, (_, i) => i % 256))], ['l'.repeat(120) + '.txt', Buffer.from('long-name\n')]]) {
		const archive = await packSingleFile(name, data);
		assert.deepEqual(await unpackTar(archive, Math.max(data.length, 1)), [{ name, data, isDirectory: false }]);
	}
});

test('tar rejects a payload over the configured limit', async () => {
	const archive = await packSingleFile('large.bin', Buffer.alloc(1024));
	await assert.rejects(() => unpackTar(archive, 1023), /larger than/);
});

test('tar ignores symlinks instead of emitting them as empty files', async () => {
	const archive = pack();
	const chunks = [];
	const done = new Promise((resolve, reject) => {
		archive.on('data', (data) => chunks.push(data));
		archive.on('end', () => resolve(Buffer.concat(chunks)));
		archive.on('error', reject);
	});
	archive.entry({ name: 'link', type: 'symlink', linkname: '/elsewhere' });
	archive.finalize();
	assert.deepEqual(await unpackTar(await done, 1024), []);
});

test('tar normalizes tool-added prefixes and directory suffixes', () => {
	assert.equal(normalizeEntryName('./dir/sub/'), 'dir/sub');
});

test('tar rejects truncated archives', async () => {
	const archive = await packSingleFile('x', Buffer.from('payload'));
	await assert.rejects(() => unpackTar(archive.subarray(0, 520), 1024));
});

test('tar refuses unsafe member paths rather than forwarding them downstream', async () => {
	for (const name of ['../escape', '/absolute', 'dir/../../escape', 'dir\\..\\escape']) {
		const archive = await packSingleFile(name, Buffer.from('x'));
		await assert.rejects(() => unpackTar(archive, 1024), /unsafe.*path/i);
	}
});

test('tar rejects excessive zero-byte entries independently of its byte cap', async () => {
	const archive = pack();
	const chunks = [];
	const done = new Promise((resolve, reject) => {
		archive.on('data', (data) => chunks.push(data));
		archive.on('end', () => resolve(Buffer.concat(chunks)));
		archive.on('error', reject);
	});
	for (let i = 0; i < 4; i++) archive.entry({ name: 'empty-' + i, size: 0 }, Buffer.alloc(0));
	archive.finalize();
	const buffer = await done;
	await assert.rejects(() => unpackTar(buffer, 1024, 3), /entry limit/i);
});
