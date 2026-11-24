const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OpenWebUi } = require('../dist/nodes/OpenWebUi/OpenWebUi.node');

const node = new OpenWebUi();
function context(params, responder) {
	const calls = [];
	return {
		calls,
		getInputData: () => [{ json: {} }],
		getNodeParameter: (k, _i, f) => params[k] ?? f,
		getCredentials: async () => ({ baseUrl: 'http://owui.test/', apiKey: 'k' }),
		getNode: () => ({ name: 'Open WebUI', type: 'n8n-nodes-openwebui.openWebUi', typeVersion: 1, parameters: {}, position: [0, 0] }),
		continueOnFail: () => false,
		helpers: { httpRequestWithAuthentication: async (_c, o) => { calls.push(o); return responder(o); } },
	};
}

test('Start Chat creates the chat, then posts a linked first message', async () => {
	const ctx = context({ operation: 'start', model: 'gwai.mailbox', message: 'Hi', title: 'T' }, (o) =>
		o.url.endsWith('/chats/new') ? { id: 'c1' } : { choices: [{ message: { content: 'Hello' } }] });
	const [[r]] = await node.execute.call(ctx);
	assert.equal(ctx.calls[0].url, 'http://owui.test/api/v1/chats/new');
	assert.equal(ctx.calls[0].body.chat.title, 'T');
	const b = ctx.calls[1].body;
	assert.equal(b.chat_id, 'c1');
	assert.equal(b.parent_id, null);
	assert.equal(b.user_message.content, 'Hi');
	assert.equal(b.user_message.id, r.json.user_message_id);
	assert.equal(b.id, r.json.answer_message_id);
	assert.equal(r.json.answer, 'Hello');
	assert.equal(r.json.url, 'http://owui.test/c/c1');
});

test('Send Message continues after the current message with the chat model', async () => {
	const ctx = context({ operation: 'send', chatId: 'c1', message: 'More' }, (o) =>
		o.method === 'GET' ? { chat: { models: ['gwai.carrier'], history: { currentId: 'm9' } } } : { choices: [{ message: { content: 'ok' } }] });
	await node.execute.call(ctx);
	const b = ctx.calls[1].body;
	assert.equal(b.model, 'gwai.carrier');
	assert.equal(b.parent_id, 'm9');
	assert.equal(b.user_message.parentId, 'm9');
});
