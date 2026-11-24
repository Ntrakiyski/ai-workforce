import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Works against BoxLite Cloud and a self-hosted `boxlite serve`.
 *
 * - Cloud: Base URL `https://api.boxlite.ai`, API key `blk_live_…`.
 * - Self-hosted, permissive: Base URL `http://host.docker.internal:8100`, no key.
 * - Self-hosted with `--api-key`: same URL plus that key.
 */
export class BoxLiteApi implements ICredentialType {
	name = 'boxLiteApi';

	displayName = 'BoxLite API';

	documentationUrl = 'https://docs.boxlite.ai/cloud/api-keys';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'BoxLite Cloud key (blk_live_…). Leave empty for a loopback `boxlite serve` started without --api-key.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.boxlite.ai',
			required: true,
			description:
				'Cloud default. For a self-hosted server: http://host.docker.internal:8100 when n8n runs in Docker, or http://127.0.0.1:8100 when n8n runs on the host.',
		},
		{
			displayName: 'Path Prefix',
			name: 'pathPrefix',
			type: 'string',
			default: '',
			description:
				'Only for a multi-tenant server that mounts routes at /v1/{prefix}/boxes. Leave empty for Cloud and a single-tenant `boxlite serve`.',
		},
	];

	// The transport builds the Authorization header itself, so this credential
	// deliberately has no `authenticate` block: a generic one would send
	// "Bearer " with an empty key on a permissive self-hosted server, and n8n
	// never calls it for this node anyway.

	// GET /v1/boxes needs auth on Cloud and on a keyed self-hosted server, and
	// is the cheapest route that proves the key works. Permissive servers accept
	// any bearer, which is why the fallback value is not a real secret. The path
	// has to mirror apiBase(), path prefix included, or a prefixed server tests
	// red while working fine.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '={{"/v1" + ($credentials.pathPrefix ? "/" + $credentials.pathPrefix.split("/").filter(Boolean).join("/") : "") + "/boxes"}}',
			method: 'GET',
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey || "permissive"}}',
			},
		},
	};
}
