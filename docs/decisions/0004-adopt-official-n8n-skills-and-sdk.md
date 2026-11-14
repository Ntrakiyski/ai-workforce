# ADR-0004 — Adopt official n8n Skills and Workflow SDK as primary building blocks

- Status: **Accepted architectural direction; implementation and benchmarks pending**
- Date: 2026-11-15
- Related: [ADR-0002](0002-n8n-native-systems-framework.md), [ADR-0003](0003-behavior-first-visual-abstraction.md)

## Decision

**We are not building a competing low-level n8n workflow SDK.** Use n8n's official tools as the starting point:

1. **Official n8n Skills** — the agent's foundational expert documentation. Load \`using-n8n-skills-official\` and the relevant capability skills before designing or editing workflows.
2. **Official \`@n8n/workflow-sdk\`** — preferred *candidate* for representing and composing workflows with typed builder constructs. Do not assume SDK correctness: validate exact generated graph, compatible nodes, expressions and runtime side effects.
3. **n8n instance-level MCP** — discovery and permitted create/edit/inspect/test operations against an authorized, version-matched instance.
4. **Our framework** — specification schema, system composition rules, reusable capabilities, tenant/security contracts, testing and review, versioned deployment, and business-level visual projection.

The **SDK-first** path is our preferred implementation direction, subject to a controlled benchmark versus direct JSON and template adaptation. If a verified feature is unavailable in a target SDK version, use a documented, narrowly scoped alternative with identical quality gates.

## Proposed pipeline

~~~mermaid
flowchart TD
 SPEC["Product specification"] --> PLAN["System architecture + capability contracts"]
 SKILLS["Official n8n skills"] --> PLAN
 PLAN --> ASSEMBLE["SDK-first workflow assembly"]
 SKILLS --> ASSEMBLE
 MCP["Authorized n8n instance MCP"] --> ASSEMBLE
 ASSEMBLE --> JSON["n8n workflow artifacts + exact connections"]
 JSON --> STATIC["Structural / node / semantic validation"]
 STATIC -->|failure| ASSEMBLE
 STATIC -->|pass| STAGE["Isolated staging executions"]
 STAGE -->|failure| ASSEMBLE
 STAGE -->|pass| REVIEW["Independent review + approval"]
 REVIEW --> RELEASE["Versioned deployment + rollback"]
 RELEASE --> VIEW["Evidence-backed human behavior map"]
~~~

**None of the above pipeline is implemented end-to-end in this repository.** This records the system design.

## What already exists versus what we must build

| n8n provides | Our project must provide |
|---|---|
| Workflow SDK: typed builder, flow control, validation | Complete product specification, tenant-safe system manifest |
| Official Skills: integration, error-handling, sub-workflow guidance | Opinionated orchestration enforcing our business rules |
| n8n MCP: selected workflow actions and inspections | Permission boundary, revision safety, stage gates, production control |
| n8n workflow JSON and editor | Human-friendly system map linked to deployed reality |
| n8n execution engine | Cross-system tests, approval/audit/rollback policy and monitoring contracts |
| Reusable workflows | Curated version-pinned patterns with test evidence and product semantics |

## Reasons

- Avoid duplicating already supported node configuration and workflow-construction logic.
- Preserve n8n's source as the authority for behavior, rather than speculative templates.
- Use agents to compose reliable components instead of inventing implementation details from scratch.
- Maintain a separate product layer: **humans specify outcomes; agents assemble tested n8n systems; humans understand behavior**.

## Boundaries and validation

- A successfully generated SDK definition, parseable JSON or passing MCP validation does not establish a working or safe system.
- Compare serialized connections against intended edges. Test conditionals, retries, error outputs, idempotency and external side effects in staging.
- Pin the official skills revision and target n8n/SDK versions; audit compatibility before upgrades.
- A plugin installation requires local installation and authentication to the user's n8n instance. A GitHub documentation commit does **not** connect or enable MCP.
- Enforce n8n license terms and protect tenant identity, credentials and client data.

## Sources checked

- Official Skills: https://github.com/n8n-io/skills (snapshot 626f50fdf2934116eea2c5469339e03d2d524e83)
- SDK README at our pinned n8n release: https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/workflow-sdk/README.md
- Lifecycle guidance: https://github.com/n8n-io/skills/blob/626f50fdf2934116eea2c5469339e03d2d524e83/skills/n8n-workflow-lifecycle-official/SKILL.md
- [Research audit](../research/n8n-native-primitives-and-community-2026-11.md)

## First implementation milestone

Create a version-pinned reproducible test of one workflow generated via the official SDK, then:
1. Obtain JSON and inspect the connection graph.
2. Compare with an equivalent direct-JSON fixture.
3. Validate and import into a disposable matching n8n instance.
4. Run happy-path and failure-path scenarios and record evidence.
5. Decide whether SDK-first should become mandatory for supported use cases.
