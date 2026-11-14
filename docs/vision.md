# Product Charter: n8n Engineering System

## Mission

**Project direction (ADR-0002):** Build reusable systems using n8n as the principal visual execution language. Chat apps, API, MCP and simple HTML are interchangeable interface layers; external agents and storage providers extend the capabilities without replacing n8n as the organizing center. See [framework overview](framework/README.md).


Make n8n system construction a **repeatable, inspectable, testable engineering process** rather than a prompt that improvises application code. Systems encompass workflows, entry interfaces, state, authorization and integration contracts. Constrain agents with a versioned model of n8n internals, reusable composition patterns, integration-specific instructions, and machine-executed quality gates.

## User problem

An AI agent can generate hundreds of lines of opaque backend code. Non-code-reading users cannot confidently verify that implementation. An n8n-first system offers a more legible flow graph, but a visible graph is not sufficient proof of correctness. We need visual inspection plus source-grounded constraints, runtime evidence and independent review.

## System-first principles

- Business outcomes first; n8n workflows express the operational behavior.
- Core capabilities are reusable across Telegram, WhatsApp, HTTP, MCP and future interfaces.
- A shared workflow can serve many tenants only with verified identity, enforced authorization and tested state isolation.
- Data Tables, PostgreSQL, Redis and external providers are chosen for their semantics rather than because the framework must provide everything itself.
- A client-facing chat editor that modifies workflow configuration is license-sensitive and must not be shipped without a confirmed compliant arrangement.

## Product outcomes

1. A client requirement maps to an **architecture proposal** with workflow/sub-workflow boundaries, integration inventory and a clear diagram.
2. Agents produce **version-compatible n8n workflow JSON** and reference only known node types, operations, properties and credentials.
3. Each generated workflow has an explicit input/output contract, expected side effects, failure handling, idempotency and observability strategy.
4. Static checks catch malformed graphs/configuration before import; staging tests verify real execution behavior using controlled or sandbox resources.
5. A client can request an improvement by chat. A development agent builds it, an independent reviewer tests it, and an authorized release process decides whether to promote it.
6. Knowledge is reusable across clients and versions rather than generated from scratch on every task.

## Deliverable contract

For each production change, aim to supply:

- `workflow.json` or a collection of related importable workflow definitions;
- `architecture.md` and a graph (Mermaid or exported n8n diagram);
- `validation.json` with evidence per gate;
- `tests.json` with fixtures and actual runtime outputs/statuses;
- `release-manifest.json` with n8n version/commit, credentials mapping, external dependencies, rollback pointer and approval state.

> These are a **future contract**, not implemented files in this starter repository.

## Scope, boundaries and non-goals

**In scope:** native n8n nodes, sub-workflows, workflow JSON, schema discovery, validated integration patterns, error and reliability design, MCP discovery, REA investigations, staging testing, human-approved releases.

**Not initially in scope:** rebuilding the n8n editor; writing a universal code generator; guaranteeing zero errors; automatically granting agents production privileges; copying third-party workflow collections wholesale; or promising zero infrastructure/API cost.

## Success measurements (proposed, not current performance)

- Workflow import success on the pinned target n8n version.
- Static/schema and semantic gate pass rate.
- Staging scenario coverage (happy path, recoverable errors, permanent errors, duplicate events).
- Incidents per production deployment and time to safe rollback.
- Fraction of changes generated from verified reusable patterns.
- Human review time and source-evidence completeness.

## Principles

**Source before prompt.** **Contract before node.** **Explicit failures before generic continue-on-error.** **Runtime proof before release.** **Environment isolation before autonomy.** **Visual understanding alongside machine validation.**
