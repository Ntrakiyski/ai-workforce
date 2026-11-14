# Executive Decision Record — n8n-Native Product Development

**Decision snapshot:** 2026-11-15  
**Status:** Strategy locked for the first implementation milestone; **not** proof of a completed product.  
**Repository:** [n8n-dev](https://github.com/Ntrakiyski/n8n-dev)  
**Supporting ADRs:** [0002 — n8n-native systems](../decisions/0002-n8n-native-systems-framework.md), [0003 — behavior-first interface](../decisions/0003-behavior-first-visual-abstraction.md), [0004 — official tools](../decisions/0004-adopt-official-n8n-skills-and-sdk.md)

## One-sentence mandate

**The user specifies what a product must do; AI agents build and maintain it using n8n; the human understands, directs and approves it through an accurate visual map of business behavior.**

This is our **2027 product-development thesis**, not a general claim that all software will be developed this way in 2027.

## Decisions closed for product direction

| ID | Decision | Why it matters | Reference |
|---|---|---|---|
| D-01 | **Build a spec-driven product framework, not a workflow JSON generator alone.** A system includes interfaces, behaviors, contracts, storage, identity, credentials, runtime and lifecycle. | We deliver products, not disconnected automations. | ADR-0002; [system model](../framework/system-model.md) |
| D-02 | **n8n is the central visual execution/orchestration substrate.** "Programming language" is a useful analogy, not a literal reclassification. | Agents assemble native n8n capabilities and selected external services rather than starting each product from custom application code. | ADR-0002 |
| D-03 | **Audience: people who want to understand, but do not want to spend time learning every technical implementation detail.** | Design for control, comprehension, safe decisions, and transparency rather than coding proficiency. | [product thesis](../framework/spec-driven-product-development.md) |
| D-04 | **The default product UI is a behavior map of boxes, connections, decisions, exceptions and outcomes—not code diffs, agent logs or raw n8n node parameters.** Technical drill-down remains available. | Reduces cognitive overhead while preserving the information needed for safe decisions. | ADR-0003; [UI contract](../framework/behavior-first-interface.md) |
| D-05 | **The visual map must be a projection of the approved system manifest + real n8n artifacts + runtime evidence.** Never let an agent-invented diagram masquerade as proof. | Prevents false confidence and provides a trustworthy management interface. | ADR-0003 |
| D-06 | **Reuse official n8n Skills, `@n8n/workflow-sdk`, and authorized instance-level MCP.** Do not rebuild the official low-level SDK or independently recreate its general node knowledge. | Reduces duplication; agents focus on capabilities, contracts and correctness. | ADR-0004; [toolchain](../framework/official-toolchain.md) |
| D-07 | **Adopt SDK-first as the preferred candidate for workflow assembly, with an explicit benchmark before making it mandatory.** Inspect the actual generated JSON and graph. | Type safety improves authoring but does not guarantee business correctness or safe side effects. | ADR-0004 |
| D-08 | **Native n8n primitives are our default building blocks:** sub-workflows for reusable capabilities, channel triggers/webhooks for entry, execution metadata for traceability, and send-and-wait for human input. | Builds on supported mechanisms and avoids reinventing foundational runtime features. | [primitive audit](../research/n8n-native-primitives-and-community-2026-11.md) |
| D-09 | **Release safety is separate from generation:** deterministic checks, connection inspection, isolated staging, failure tests, independent review, authorized promotion, rollback. | "Valid JSON" and "agent says done" do not mean product readiness. | [reference architecture](../architecture/system-overview.md) |
| D-10 | **Keep integrations and deployment replaceable.** Chat/Telegram/WhatsApp/API/MCP and simple HTML are interfaces; PostgreSQL, Data Tables, Redis, external agents, SFTP and third-party APIs are selected capabilities. | One system may support many interfaces and client environments without rewriting its business core. | ADR-0002; [interfaces](../framework/interfaces-and-capabilities.md) |

These are **chosen engineering and product policies**. The repository has not demonstrated a fully functioning builder, visual interface, automatic staging pipeline or production system.

## What we are deliberately not building

- A clone of the n8n visual editor, core workflow engine, SDK, or general-purpose programming language.
- A new generic knowledge library that competes with official n8n Skills; add our own **system-level rules** on top of those skills.
- A product that forces non-programmers to inspect node configuration, source files or raw agent transcripts by default.
- A static pretty diagram with no versioned link to deployed workflows and evidence.
- An "always safe" agent with unrestricted production write privileges or unsandboxed root access.

## How a finished product should work (target experience)

~~~mermaid
flowchart TD
  USER["Human: describe outcome or change"] --> SPEC["Versioned product specification"]
  SPEC --> ARCH["Architect: system capabilities and contracts"]
  SKILLS["Official n8n Skills"] --> ARCH
  ARCH --> BUILD["Build: official n8n SDK + authorized MCP"]
  SKILLS --> BUILD
  BUILD --> JSON["Workflow JSON + exact connection graph"]
  JSON --> QA["Deterministic validation and isolated staging tests"]
  QA -->|Failed| BUILD
  QA -->|Passed| REVIEW["Independent reviewer + release approval"]
  REVIEW --> LIVE["Approved n8n system"]
  LIVE --> MAP["Human-facing behavior map"]
  LIVE --> PROOF["Version, run traces, health and rollback evidence"]
  PROOF --> MAP
  MAP -->|Request improvement| USER
~~~

**Diagram state:** intended system, not proof of implementation.

## Closed choices versus open validation

**Decided:** product direction, target user, default UX, n8n-first system model, reuse of official upstream tools, basic quality-gate policy.

**Still open / to be measured:**
1. **SDK-first fidelity:** compare n8n SDK assembly, direct JSON generation, and template adaptation against identical system specifications and staging tests.
2. **Toolchain installation and feature support:** official Skills plugin, n8n MCP authorization, actual supported node versions/editions, pinned packages.
3. **Manifest/visual contract implementation:** formal JSON Schema for product spec, capability-to-n8n mapping, projection consistency tests and UI usability.
4. **Commercial and deployment model:** per-client VPS versus hosted instances, whether clients can edit workflows, n8n licensing requirements, operating economics and tenant controls.
5. **Third-party quality:** audit Guardian/cQnce and curated creator templates; verified/community badges and published descriptions are not equivalent to security or correctness audits.

Do **not** write implementation decisions as completed tests. If the benchmark contradicts SDK-first, document the exception and follow evidence.

## Next execution milestone: one complete vertical slice

Build **one** isolated, non-production reference system with two entry interfaces and one reusable core capability. A suitable fixture is **Customer Message → Verify Identity → Retrieve Data → Decide → Respond / Escalate**, including a single protected send-and-wait approval action.

| Step | Artifact | Acceptance |
|---|---|---|
| 1. Product contract | `system-spec.json`, manifest schema, test cases | Actor, tenant, I/O, error and side-effect contracts unambiguous |
| 2. Upstream toolchain | pinned official Skills + SDK + staging MCP configuration | Versions recorded, safe permission set, install/auth state documented |
| 3. Typed workflow assembly | SDK source and generated n8n JSON | Intended actual graph and node versions verified |
| 4. Quality evidence | structure, semantic and staging tests | Happy path + denial + timeout + duplicate + replay/tenant isolation |
| 5. Behavior map | boxes and edges derived from real manifest and workflow references | All critical paths match deployed graph and test evidence |
| 6. Release record | reviewed artifact and rollback reference | No direct generative write to client production |

**Milestone outcome:** a demonstrated system created from a specification and understood through a truthful behavior map. Only then generalize into templates, client deployments, or an installable orchestration skill.

## Source of truth and ownership

- Native n8n behavior: pinned n8n source and official documentation, not prompts.
- Agent building standards: pinned [official n8n Skills](https://github.com/n8n-io/skills), extended by our documented policy.
- System product behavior: approved product specification and system manifest.
- Runtime claims: independent staging and deployed execution evidence.
- Business-facing UI: a faithful, rev-aware projection of those sources.
- GitHub decisions: ADRs and this executive record; don't silently overwrite accepted decisions.

> **Principle:** Users should see *exactly what they need to safely understand and control the system*—no more unnecessary implementation detail, no less essential truth.
