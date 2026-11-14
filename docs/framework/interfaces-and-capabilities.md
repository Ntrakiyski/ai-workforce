# Interfaces and External Capabilities

> **Status:** Mixed verified product capabilities and proposed project design. Confirm availability for the chosen n8n version, hosting mode and plan.

## The n8n-centered view

A system should be implemented **once** as a reusable core capability and exposed through one or more interfaces. These are *ways to call the same system*, not reasons to duplicate the logic.

~~~mermaid
flowchart LR
  T["Telegram / WhatsApp / chat"] --> ADAPT["Channel adapters"]
  H["HTTP API / external app"] --> ADAPT
  M["MCP tool"] --> ADAPT
  W["Simple HTML response"] --> ADAPT
  ADAPT --> ID["Authenticated identity + authorization"]
  ID --> CORE["Core n8n system"]
  CORE <--> STORE[("Approved storage")]
  CORE --> EXT["External agents, MCP clients, APIs"]
  CORE --> RETURN["Response contract"]
  RETURN --> ADAPT
~~~

## Interface capabilities

| Interface | Candidate n8n mechanism | Important constraint |
|---|---|---|
| Chat apps | Provider trigger/webhook and outgoing provider node or HTTP call | Verify sender identity, signatures, retries, rate limits, platform rules |
| HTTP/API | Webhook + Respond to Webhook | Design auth, status codes, timeouts, idempotency and payload contract |
| MCP | Instance-level MCP or MCP Server Trigger tool exposure | Scope what each client can discover and invoke |
| HTML | Text/HTML response to a webhook or generated file | Useful for simple views, **not** equivalent to a full client app |
| Schedule/background event | Schedule Trigger and external events | Make asynchronous side effects observable and recoverable |

n8n documents that the Webhook node can return workflow results as an API response. Respond to Webhook can return JSON, text/HTML, files and other formats. Modern n8n wraps webhook HTML responses in an iframe for security, so do not design around unrestricted top-level browser scripting.

n8n provides an **instance-level MCP server** and a **workflow-level MCP Server Trigger**. They are different integration surfaces with different access controls. Not all workflows are automatically available to MCP.

## Approved external capabilities

Treat providers as replaceable capabilities rather than as the center of the system:

- **AI agent or secure sandbox provider:** execute a bounded task, return structured data and evidence, honor a timeout and cancellation policy.
- **PostgreSQL:** persistent business state, transactionally consistent records and tenant-aware authorization.
- **n8n Data Tables:** modest workflow-local persistent records and lookups.
- **Redis:** caching, temporary sessions, coordination and queues where appropriate.
- **Airtable/CRM/other client systems:** read/write data already owned by those systems.
- **MCP servers and HTTP APIs:** access pre-existing tools rather than implementing every operation inside a Code node.

Before adopting any provider, record its identity/authentication model, data residency, costs, API/usage limits, required permissions, failure modes, secret handling, timeout behavior, and fallback policy.

## Run lifecycle

1. Receive an event at the appropriate interface.
2. Validate transport authenticity and resolve the user and tenant.
3. Normalize input to the framework's request envelope.
4. Call a named, reusable n8n capability.
5. Read/write context using the correct durability and isolation policy.
6. Call external tools/agents when needed, using least-privilege credentials.
7. Produce an interface-independent result object.
8. Adapt that result back into Telegram, WhatsApp, JSON/API, MCP, or HTML.
9. Persist trace, business status, and metrics; handle retry and recovery.

Do not wait synchronously for a long-running operation when the caller's transport or platform will time out. Acknowledge and use an asynchronous callback/poll/reply pattern instead.

## Licensing and commercial deployment (high priority)

**n8n is source-available, not OSI open-source.** Its Sustainable Use License has commercial-use restrictions. The [n8n Help Center's October 6, 2026 FAQ](https://support.n8n.io/article/can-i-use-your-license-for-my-use-case) says:

- Building and operating automations **for clients** on an agency-owned Community instance can be allowed if only the agency creates/edits workflows and clients only receive outputs.
- If external clients use an app, chat, API, MCP, or an agent to **configure or modify workflows**, a commercial license is required.
- Hosting n8n as a service and white-labeling likewise require commercial arrangements.
- Installing and managing an instance on a client's own server is a different scenario and the client must choose an appropriate license.

These are published n8n guidelines, **not legal advice**. Before launching the original self-service business model, request written confirmation for the exact operating pattern at license@n8n.io.

Do not confuse client *using a chat application powered by a fixed workflow* with client *using chat to author/configure automation*. The distinction affects the business model.

## Versioned evidence

- [Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
- [Data Tables](https://docs.n8n.io/data/data-tables/)
- [Connect to n8n MCP server](https://docs.n8n.io/advanced-ai/accessing-n8n-mcp-server/)
- [n8n main source LICENSE.md](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)
- [n8n licensing use-case FAQ](https://support.n8n.io/article/can-i-use-your-license-for-my-use-case)

## Implementation priority

Start with a controlled **one-system, two-interface** demo (Telegram plus webhook), tenant-safe state, and a mockable external agent call. Add MCP and simple HTML views after the shared capability works, not as prerequisites.
