// Emits the inactive staging artifact on stdout. Requires @n8n/workflow-sdk 0.40.2.
const { workflow, trigger, node } = require('@n8n/workflow-sdk');

const incoming = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    id: '02eb5bfa-936e-4cee-88a9-37f992239ebe',
    webhookId: 'b17bebfa-897a-485c-9ec8-9650914dd732',
    name: 'Authenticate status request',
    position: [0, 0],
    parameters: {
      httpMethod: 'POST',
      path: 'homelab-status',
      authentication: 'headerAuth',
      responseMode: 'responseNode',
      options: {},
    },
    // Bind the installation-specific credential after importing.
  },
});

const probe = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    id: 'f86f67d5-4385-4273-a210-c4245abe4558',
    name: 'Read n8n readiness',
    position: [256, 0],
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: 'http://127.0.0.1:5678/healthz/readiness',
      options: {
        timeout: 3000,
        redirect: { redirect: { followRedirects: false } },
        response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } },
      },
    },
  },
});

const reply = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    id: 'e50bebf1-a811-454f-bb94-9f8e93fadd2f',
    name: 'Return service status',
    position: [512, 0],
    parameters: {
      respondWith: 'json',
      responseBody: "={{ { service: 'n8n', status: $json.statusCode === 200 && $json.body?.status === 'ok' ? 'ok' : 'unavailable' } }}",
      options: {},
    },
  },
});

const report = workflow('homelabStatus', 'Homelab status — n8n readiness', {
  executionOrder: 'v1',
  saveDataSuccessExecution: 'none',
  saveDataErrorExecution: 'none',
  saveManualExecutions: false,
  saveExecutionProgress: false,
}).add(incoming.to(probe).to(reply));

const artifact = report.toJSON();
delete artifact.id; // UI import should create a new inactive draft in each instance.
console.log(JSON.stringify({ ...artifact, active: false }, null, 2));
