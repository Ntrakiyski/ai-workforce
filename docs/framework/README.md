# n8n-Native Systems Framework

**Status:** Design proposal in the n8n Engineering System repository, not an implemented runtime or an independent programming language.

## One-sentence definition

**Use n8n as the visual language of system behavior: describe how an event enters, what decisions are made, what tools are called, what state changes, and what result leaves.**

n8n is technically a workflow automation platform. Calling it a "language" is our design analogy, not a claim that n8n is a general-purpose programming language or a Next.js replacement.

## Product definition

A **system** is a set of n8n workflows plus their entry points, durable state, external capabilities, permissions, and operational rules. A single workflow JSON file may be one component of a larger system. The framework builds and manages systems, not merely individual automations.

| Human-level question | Framework concept |
|---|---|
| What causes something to happen? | Entry point: Telegram, WhatsApp, webhook, chat, schedule, or MCP |
| What must the system do? | Named workflow or collection of sub-workflows |
| What can it use? | Native n8n nodes, API/MCP calls, external agents, services |
| What must it remember? | n8n Data Tables, PostgreSQL, or other approved stores |
| Who is making the request? | Verified principal and tenant context |
| What result should it produce? | Response contract and side effects |
| How do we know it worked? | Run trace, tests, reviewer decision, monitoring |

### Reference system

~~~mermaid
flowchart LR
  CH["Chat / API / MCP / HTML"] --> IN["Entry workflow"]
  IN --> ID["Verify actor and tenant"]
  ID --> SYS["n8n system workflow"]
  SYS --> TOOL["Tools, external agents, APIs"]
  SYS <--> DATA[("Data Tables / PostgreSQL / Redis")]
  SYS --> OUT["Response via chosen channel"]
  SYS --> OBS["Trace, review, recovery"]
~~~

The boxes are **responsibilities**, not evidence that every component has been implemented. The same named system can be invoked by several interfaces, provided identity, credentials, state isolation, and response contracts are preserved.

## Our intended method of building

1. Describe a desired business outcome and the actors allowed to request it.
2. Specify entry points, inputs, outputs, permissions, and data that must persist.
3. Design reusable capabilities as workflow/sub-workflow contracts.
4. Let agents assemble version-correct n8n workflows from approved nodes and patterns.
5. Run static validation and real staging scenarios.
6. Review side effects, cross-tenant access and security boundaries.
7. Release a pinned system version with a rollback artifact and observable run records.

The human designs **what the system should do**. Agents do implementation work; n8n gives the human an inspectable graph. Code remains allowed where a narrow, testable custom capability is genuinely needed.

## Reading order

1. [System model](system-model.md) - concepts, workflow grammar, system specification.
2. [Interfaces and external capabilities](interfaces-and-capabilities.md) - chat, API, MCP, HTML, storage and agent providers.
3. [Identity, runs and tenant state](state-and-tenancy.md) - safely run one system for many clients.
4. [ADR-0002](../decisions/0002-n8n-native-systems-framework.md) - strategic decision and alternatives.
5. [Reference architecture](../architecture/system-overview.md) - development, staging and independent review.
6. [JSON contract](../contracts/workflow-json.md) - what a valid workflow artifact actually guarantees.

## Important boundaries

- **n8n is the center, not necessarily the only process.** Use external services for functions that require specialized execution, storage, authentication, or latency guarantees.
- **Visual does not mean verified.** Machine validation and staging are mandatory.
- **Reuse is conditional.** A single workflow can serve multiple tenants only with authenticated identity, explicit authorization, secure credential mapping, and isolated data access.
- **A chat-controlled workflow editor is a commercial licensing question.** n8n's October 2026 FAQ says external users configuring workflows through an AI agent/API/MCP require a commercial license. Review the selected business model before enabling self-service workflow modification.
- **No zero-cost promise.** Hosting, model inference, external APIs, storage and monitoring still cost resources.

### References (verified documentation; check against target versions)

- [Webhook as API entry point](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Respond to Webhook, including HTML behavior](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
- [n8n Data Tables](https://docs.n8n.io/data/data-tables/)
- [n8n instance-level MCP](https://docs.n8n.io/advanced-ai/accessing-n8n-mcp-server/)
- [n8n licensing FAQ, updated October 2026](https://support.n8n.io/article/can-i-use-your-license-for-my-use-case)
