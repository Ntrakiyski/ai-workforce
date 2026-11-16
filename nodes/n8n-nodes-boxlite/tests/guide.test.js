const { test } = require('node:test');
const assert = require('node:assert/strict');
const guide = require('../examples/BoxLite-Guide.json');
const { BoxLite } = require('../dist/nodes/BoxLite/BoxLite.node');

test('guide is portable, manual-only, and contains no credentials or production triggers', () => {
	assert.equal(new Set(guide.nodes.map((n) => n.id)).size, guide.nodes.length);
	assert.equal(new Set(guide.nodes.map((n) => n.name)).size, guide.nodes.length);
	assert.equal(guide.nodes.filter((n) => n.type === 'n8n-nodes-base.manualTrigger').length, 1);
	assert.ok(!guide.nodes.some((n) => n.credentials || /webhook|scheduleTrigger/.test(n.type)));
	assert.ok(!guide.active);
	for (const n of guide.nodes.filter((n) => n.name.startsWith('Reference'))) {
		assert.equal(n.disabled, true);
		assert.equal(guide.connections[n.name], undefined);
	}
});

test('guide includes a real example of every implemented resource operation', () => {
	const properties = new BoxLite().description.properties;
	for (const operation of properties.filter((p) => p.name === 'operation')) {
		const resource = operation.displayOptions.show.resource[0];
		for (const option of operation.options) {
			assert.ok(guide.nodes.some((n) => n.parameters.resource === resource && n.parameters.operation === option.value), `${resource}.${option.value} missing`);
		}
	}
});

test('guide executable chain is connected, bounded, and ends with cleanup then validation', () => {
	let current = guide.nodes.find((n) => n.type === 'n8n-nodes-base.manualTrigger');
	const seen = [];
	while (current) {
		assert.ok(!seen.includes(current.name), 'demo must not loop');
		seen.push(current.name);
		const edges = guide.connections[current.name]?.main[0] ?? [];
		assert.ok(edges.length <= 1, 'demo must not fan out into concurrent cleanup');
		current = edges[0] && guide.nodes.find((n) => n.name === edges[0].node);
	}
	assert.equal(seen.at(-2), 'Delete demo box');
	assert.equal(seen.at(-1), 'Run summary');
	assert.equal(guide.settings.executionTimeout, 300);
	assert.equal(guide.nodes.find((n) => n.name === 'Create demo box').parameters.ifExists, 'fail');
	assert.match(guide.nodes.find((n) => n.name === 'Create demo box').parameters.name, /execution.id/);
});
