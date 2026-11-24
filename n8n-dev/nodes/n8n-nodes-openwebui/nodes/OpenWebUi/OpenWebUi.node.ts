import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { randomUUID } from 'node:crypto';

/**
 * Open WebUI chats, only what agents need to reach a human:
 * - Start Chat: new chat with a title and a first message; the model answers and the answer is saved.
 * - Send Message: append a message to an existing chat; the model answers in that chat.
 * - Get / Delete chat.
 * The message goes through /api/chat/completions with `user_message` + `parent_id`, so Open WebUI
 * links the user message and the answer correctly (without it the answer is saved without a parent).
 */
export class OpenWebUi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Open WebUI',
		name: 'openWebUi',
		icon: 'file:openwebui.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Start agent chats and post messages in Open WebUI',
		defaults: { name: 'Open WebUI' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'openWebUiApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'start',
				options: [
					{ name: 'Start Chat', value: 'start', action: 'Start a chat', description: 'Create a chat and let a model answer the first message' },
					{ name: 'Send Message', value: 'send', action: 'Send a message', description: 'Add a message to a chat and let the model answer' },
					{ name: 'Get Chat', value: 'get', action: 'Get a chat' },
					{ name: 'Delete Chat', value: 'delete', action: 'Delete a chat' },
				],
			},
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['send', 'get', 'delete'] } },
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'gwai.mailbox',
				displayOptions: { show: { operation: ['start'] } },
				description: 'Model ID in Open WebUI',
			},
			{
				displayName: 'Model',
				name: 'sendModel',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['send'] } },
				description: 'Leave empty to use the chat\'s model',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['start'] } },
				description: 'Chat title in the sidebar. Empty: first 60 characters of the message.',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['start', 'send'] } },
				description: 'Shown in the chat as the user\'s message',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				displayOptions: { show: { operation: ['start', 'send'] } },
				options: [
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						default: 300,
						description: 'How long to wait for the model\'s answer',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];
		const creds = await this.getCredentials('openWebUiApi');
		const base = String(creds.baseUrl || '').replace(/\/+$/, '');

		const api = async (method: IHttpRequestOptions['method'], path: string, body?: IDataObject, timeout = 60000) => {
			try {
				return await this.helpers.httpRequestWithAuthentication.call(this, 'openWebUiApi', {
					method, url: base + path, body, json: true, timeout,
				});
			} catch (error) {
				throw new NodeApiError(this.getNode(), error as never);
			}
		};

		// Post one user message; Open WebUI saves the message and the model's answer in the chat.
		const ask = async (chatId: string, model: string, parentId: string | null, text: string, timeout: number) => {
			const userId = randomUUID();
			const answerId = randomUUID();
			const res = await api('POST', '/api/chat/completions', {
				model,
				chat_id: chatId,
				parent_id: parentId,
				id: answerId,
				messages: [{ role: 'user', content: text }],
				user_message: { id: userId, parentId, role: 'user', content: text, models: [model], timestamp: Math.floor(Date.now() / 1000) },
				stream: false,
				background_tasks: {},
			}, timeout * 1000);
			const answer = (res as IDataObject)?.choices ? ((res as { choices: Array<{ message?: { content?: string } }> }).choices[0]?.message?.content ?? '') : '';
			return { user_message_id: userId, answer_message_id: answerId, answer };
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const op = this.getNodeParameter('operation', i) as string;
				const timeout = ((this.getNodeParameter('options', i, {}) as IDataObject).timeout as number) || 300;
				let json: IDataObject;

				if (op === 'start') {
					const model = (this.getNodeParameter('model', i) as string).trim();
					const message = this.getNodeParameter('message', i) as string;
					const title = (this.getNodeParameter('title', i, '') as string).trim() || message.slice(0, 60);
					if (!model) throw new NodeOperationError(this.getNode(), 'Model is required', { itemIndex: i });
					const chat = (await api('POST', '/api/v1/chats/new', {
						chat: { title, models: [model], history: { messages: {}, currentId: null }, messages: [], timestamp: Date.now() },
					})) as IDataObject;
					const chatId = chat.id as string;
					const r = await ask(chatId, model, null, message, timeout);
					json = { chat_id: chatId, title, model, url: `${base}/c/${chatId}`, ...r };
				} else if (op === 'send') {
					const chatId = (this.getNodeParameter('chatId', i) as string).trim();
					const message = this.getNodeParameter('message', i) as string;
					const chat = (await api('GET', `/api/v1/chats/${chatId}`)) as { chat?: { models?: string[]; history?: { currentId?: string } } };
					const model = (this.getNodeParameter('sendModel', i, '') as string).trim() || chat.chat?.models?.[0] || '';
					if (!model) throw new NodeOperationError(this.getNode(), 'Chat has no model; set Model', { itemIndex: i });
					const r = await ask(chatId, model, chat.chat?.history?.currentId ?? null, message, timeout);
					json = { chat_id: chatId, model, url: `${base}/c/${chatId}`, ...r };
				} else if (op === 'get') {
					const chatId = (this.getNodeParameter('chatId', i) as string).trim();
					json = (await api('GET', `/api/v1/chats/${chatId}`)) as IDataObject;
				} else {
					const chatId = (this.getNodeParameter('chatId', i) as string).trim();
					json = { chat_id: chatId, deleted: Boolean(await api('DELETE', `/api/v1/chats/${chatId}`)) };
				}
				out.push({ json, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}
		return [out];
	}
}
