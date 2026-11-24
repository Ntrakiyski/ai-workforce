# Idea: n8n community nodes for Open WebUI

**Status:** Future integration idea, recorded 22 November 2026. The [existing chat node](../../nodes/n8n-nodes-openwebui/README.md) implements a narrower set of operations. The additional resources below remain proposed.

## Goal

Create `n8n-nodes-gcc-openwebui`, a reusable TypeScript n8n community node for verified, authorized **n8n -> Open WebUI API** operations. It should reduce repeated HTTP Request configuration and provide typed, tested resources such as current user, permitted chats and history, folders, knowledge collections and (later) files.

This is **not** a replacement for native Open WebUI Pipes and Filters, which remain the chosen **Open WebUI -> n8n** user-facing path for the proposed M365 Agent Platform.

## Ownership and design references

- Product rationale and security constraints: [GCC M365 integration idea](https://github.com/Ntrakiyski/gcc-tech-stack/blob/main/projects/m365-agent-platform-2027/OPENWEBUI-N8N-NODES-IDEA.md).
- n8n execution integration: [GCC n8n architecture](https://github.com/Ntrakiyski/gcc-tech-stack/blob/main/apps/n8n/ARCHITECTURE-AND-USAGE.md).
- Local engineering example: [n8n-nodes-boxlite](../../nodes/n8n-nodes-boxlite/README.md) and its tested installation/interactive workflow guide.
- API discovery: `https://agents.gccssofia.com/openapi.json` and `https://agents.gccssofia.com/docs` are **expected endpoints**, not live-verified for this plan; use a release-matched OpenAPI export. GCC already owns an OpenAPI-derived administrative MCP adapter.
- Research reference only: [KyroLabs Open WebUI node](https://github.com/kyrolabs/n8n-nodes-openwebui) — old API assumptions and incomplete package wiring require evaluation.
- [n8n official community node documentation](https://docs.n8n.io/integrations/creating-nodes/overview/).

## Intended delivery sequence

1. Pin target n8n/Open WebUI versions and export a valid release-matched OpenAPI JSON from an appropriate test environment; do not switch production to developer mode for convenience.
2. Build an endpoint coverage and authorization matrix; avoid treating API schema declarations as proof of user permission.
3. Prototype read-only operations with n8n HTTP Request using synthetic or approved users.
4. Create a native typed client, credentials, resource-operation UI, pagination, binary handling, item linking and controlled errors following BoxLite conventions.
5. Test 401/403 and two-user cross-access denials, retries, response validity, node installation, stale schema/404 handling, and least-privilege read-only operation.
6. Provide a reproducible importable example workflow, package/release instructions, license/dependency audit and staging evidence. Promote only after human review.

**First milestone:** a verified, staging-only Open WebUI node with current-user, permitted chats/history, folders and knowledge metadata operations. Do not add write/admin operations without separate contracts, audit and tests.

**Important:** An Open WebUI admin token in an n8n credential does not become an employee's delegated identity. Do not expose arbitrary user selection or cross-user reads to employee-facing workflows. Match n8n official Skills/SDK/MCP constraints from [AGENTS.md](../../AGENTS.md) and keep client-specific credentials out of this repository.

No change to the existing BoxLite node, M365 MiniMe runtime, Open WebUI configuration or production workflow is authorized by recording this idea.
