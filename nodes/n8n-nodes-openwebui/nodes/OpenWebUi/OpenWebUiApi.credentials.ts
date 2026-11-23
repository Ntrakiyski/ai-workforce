import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

/** Open WebUI API key (Settings > Account > API keys). Chats are created as the key's owner. */
export class OpenWebUiApi implements ICredentialType {
	name = 'openWebUiApi';

	displayName = 'Open WebUI API';

	documentationUrl = 'https://docs.openwebui.com/getting-started/api-endpoints';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://agents.gccssofia.com',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'sk-… key of the user who will own the chats',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
	};

	test: ICredentialTestRequest = {
		request: { baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}', url: '/api/models', method: 'GET' },
	};
}
