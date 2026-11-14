# ADR-0002: Treat n8n as the primary language of system behavior

- **Status:** Accepted as project direction; unimplemented and subject to evidence-based revisions.
- **Date:** 2026-11-14
- **Scope:** n8n Engineering System documentation and planned framework.

## Context

The original repository centered on generating correct n8n workflow JSON. That is necessary but narrower than the product goal: create whole, inspectable, reusable systems operated through chat, APIs, MCP, and optionally simple HTML surfaces.

A workflow graph describes executable behavior. AI agents can assemble it from researched, tested patterns and attach external capabilities for specialized needs. The human should inspect system behavior and outcomes, not reconstruct opaque source code.

## Decision

1. Treat **n8n as the primary execution environment and visual behavior language** for supported systems. This is a design analogy, not a technical reclassification of n8n.
2. Treat a **system** as entry interfaces, a family of workflows, validated contracts, state, tenant/identity rules, integration capabilities, release policy and run traces.
3. Build reusable core workflows once; adapt results to chat, API, MCP and HTML through thin channel-specific entry/exit paths.
4. Use native n8n capabilities by default, with external storage, sandboxing, AI agents, and APIs when the requirement is better met by a dedicated service.
5. Preserve version-pinned JSON generation, deterministic validation, staging, independent review and rollback as non-negotiable quality gates.
6. Make licensing review a release prerequisite before commercializing client-controlled workflow creation and modification.

## Considered alternatives

- **Generate a conventional application backend for every client:** more flexibility but more opaque code and bespoke maintenance; not the default.
- **Use only one giant n8n workflow per system:** visually centralized but weak composability and failure isolation; rejected as default.
- **Build a complete new orchestration runtime:** duplicates n8n; not justified.
- **Claim n8n can replace every service:** incorrect for specialized transactions, very low latency, UI, sandboxed computation or scaling needs; rejected.

## Consequences

- The repo needs a system model and manifest contract in addition to a workflow JSON validator.
- Every system must carry identity and state boundaries, rather than relying on a workflow's execution ID.
- Every interface must normalize to a stable input contract and respond using a stable output contract.
- Reusable patterns and connectors have test fixtures, known versions and explicit credential assumptions.
- Documentation must avoid asserting the framework is implemented when it is a research/design repository.
- Commercial client self-service may require a different n8n license or deployment arrangement.

## Follow-up

1. Demonstrate one named system through Telegram and Webhook interfaces.
2. Demonstrate isolation with two synthetic tenants, negative tests and explicit credential strategy.
3. Define a machine-readable system manifest (separate from n8n's actual workflow JSON).
4. Document a library of reusable system capabilities and interface adapters.
5. Check licensing with n8n for the intended client-editing product before enabling it.
