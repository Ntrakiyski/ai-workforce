# n8n readiness capability

An authorized caller obtains the readiness of one n8n main process. The workflow authenticates the request, reads the configured readiness endpoint, and returns a two-field report. It checks database connectivity and completed migrations. Other homelab services, queue workers and individual workflows require their own checks. [Upstream readiness contract](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/cli/test/integration/healthcheck.controller.test.ts)

## Contract

| Property | Value |
| --- | --- |
| Caller | The status app with a dedicated Header Auth credential |
| Request | `POST /webhook/homelab-status`, header `X-Status-Key`, empty JSON object accepted |
| Probe | One GET of the fixed readiness URL, 3-second timeout, redirects disabled |
| Ready | HTTP 200 and `{"service":"n8n","status":"ok"}` |
| Probe unavailable | HTTP 200 and `{"service":"n8n","status":"unavailable"}` when the probe fails or its response differs from HTTP 200 with `status: ok` |
| Webhook unavailable | The app receives a connection error, timeout or HTTP error and must report that it could not retrieve status |
| Wrong or missing key | Rejected by the Webhook node before the probe |
| Retries | Each request makes one new read. Repeating a request has no business side effects. |

## Bind to staging

1. Import [workflow.json](workflow.json) as a new draft on a self-hosted n8n 2.47.7 staging instance. The default target is a single process listening on port 5678. When workers run in another container or the main port differs, set the HTTP Request node's fixed URL to a readiness endpoint accessible under the installation's existing outbound policy.
2. Create a Header Auth credential with header name `X-Status-Key` and a generated secret shared only with the status app. Select this credential on **Authenticate status request**. Keep it out of workflow exports and chat messages.
3. Test with the draft's test webhook while listening. For an authorized staging publication, use its production webhook URL from the app. Carry the key over TLS or an isolated local test connection. Use a dedicated private channel accessible to the intended audience.
4. Verify an authorized response, a denied request with a missing key, and an unavailable response when the fixed probe target is offline. For rollback, unpublish the staging workflow and revoke the app's dedicated credential.

## Regenerate

[build.cjs](build.cjs) uses the official `@n8n/workflow-sdk@0.40.2` and emits the inactive import file to stdout. From this directory, with Node 24 and that exact SDK installed in a temporary prefix:

```sh
NODE_PATH="$sdk_prefix/node_modules" node build.cjs | diff - workflow.json
```

The release evidence targets n8n 2.47.7 (bundled `n8n-nodes-base@2.47.5`). It uses Webhook 2.2, HTTP Request 4.5 and Respond to Webhook 1.5. Sources for the node contracts are pinned to the same release. [Webhook authentication](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/nodes-base/nodes/Webhook/description.ts) · [HTTP Request options](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/nodes-base/nodes/HttpRequest/V3/Description.ts) · [Webhook response](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/nodes-base/nodes/RespondToWebhook/RespondToWebhook.node.ts)

## Verification record

On 2026-11-24 the generated file matched a clean SDK rebuild byte for byte. SDK validation returned zero errors and zero warnings. A disposable loopback n8n 2.47.7 instance with fresh SQLite storage imported the workflow and a temporary header credential, published the fixture, and served the webhook. Test-only changes were the workflow ID and credential binding.

| Test through the published webhook | Observed |
| --- | --- |
| Authorized POST against the real readiness endpoint | HTTP 200, exact `ok` contract |
| Missing or incorrect key | HTTP 403 |
| Connection refused or four-second probe delay | HTTP 200, exact `unavailable` contract |
| Probe HTTP 503 with a misleading `ok` body | `unavailable` |
| Probe HTTP 200 with `status: error` or invalid JSON | `unavailable` |
| Redirect to another path | `unavailable`; destination received no follow-up |
| POST body included its own URL and status | Neither field affected the report |

The failure fixtures received exactly one GET from each authorized request and zero from the denied requests. This verifies the n8n service boundary on localhost.
