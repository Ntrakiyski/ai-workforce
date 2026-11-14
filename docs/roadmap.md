# Delivery Roadmap

All milestones below are future work. There are no implied deadlines.

## M0 - Documentation baseline (this archive)

- [x] Record product goals and explicit non-goals.
- [x] Pin a stable n8n source revision.
- [x] Define evidence provenance and status model.
- [x] Inspect the first n8n types and structural-validation implementation.
- [x] Draft architecture, reliability and security rulebooks.
- [x] Define quality gates and open research questions.
- [ ] Validate any workflow against a running n8n instance.

## Product direction - Specification-to-behavior interface (planned)

- [x] Document the 2027 spec-driven product-development thesis, intended users and design goals.
- [x] Define a behavior-first visual interface contract with evidence-linked statuses and three inspection levels.
- [ ] Create a schema for a product specification and versioned system manifest.
- [ ] Design capability-to-workflow/node mapping and graph projection.
- [ ] Validate visual fidelity against deployed n8n workflows and staging tests.
- [ ] Prototype the behavior map on a multi-interface assistant with error, denial and escalation paths.
- [ ] Test user comprehension, fidelity and usability with representative non-programmer users.
- [ ] Implement before/after behavior review, human approval and truthful production-state badges.

**Exit criteria:** a non-programmer can explain what a real deployed system does and what changed, and every presented box, edge and status traces to the approved system manifest and verified workflow/runtime evidence. No UI implementation is claimed at this stage.

## M1 - Exact workflow contract

- [ ] Extract all relevant workflow API/create/import/publish schemas from n8n `2.47.7`.
- [ ] Diff saved UI export, API create/update payload and source-control formats.
- [ ] Collect 10 minimal native UI-exported workflow fixtures, covering triggers, routes, split/merge and sub-workflows.
- [ ] Document required/optional fields per *context*, not just a universal JSON shape.
- [ ] Build a deterministic structural linter that matches the tagged source.

**Exit criteria:** All fixtures pass structural checks and are accepted by a disposable matching n8n instance.

## M2 - Node registry and parameter validation

- [ ] Audit n8n-MCP's node catalog and template DB against our pinned version.
- [ ] Map typeVersion, operations, required fields, display conditions and credential dependencies.
- [ ] Define version compatibility and 'unavailable node' behavior.
- [ ] Implement node-level schema/semantic checks.

**Exit criteria:** Repeatable validations for a representative set of 20 native node types and controlled invalid cases.

## M3 - Engineering rulebook and pattern corpus

- [ ] Curate public templates with licenses and source attribution.
- [ ] Cluster repeatable solutions: pagination, API throttling, polling, error routing, fan-out, sub-workflow contracts, AI tool calls.
- [ ] Turn findings into decision records with counterexamples and tests.
- [ ] Produce 10 parameterized patterns with fixtures.

**Exit criteria:** Every pattern has I/O contract, supported versions, failure behavior and staging evidence.

## M4 - Safe client change pipeline

- [ ] Isolate development/staging/production instances and credentials.
- [ ] Implement create/edit locking, version comparison, snapshots and rollback checks.
- [ ] Implement staging test runner with synthetic/sandbox external services.
- [ ] Add an independent review policy and human approval for high-risk changes.

**Exit criteria:** A chat-requested change proceeds end-to-end without implicit production write privileges.

## M5 - Installable expert skill

- [ ] Package compact `SKILL.md` and agent metadata with progressive reference loading.
- [ ] Connect it to pinned reference files and deterministic validators.
- [ ] Benchmark on unseen workflows and record accuracy by failure category.
- [ ] Release only after reproducible validation.

**Exit criteria:** Skill consistently selects existing tools, generates compatible JSON and refuses unsupported claims.

## M6 - Official SDK, skills and n8n community reuse (research track)

- [x] Discover official n8n agent skills and typed Workflow SDK in pinned upstream source.
- [x] Audit native human review, sub-workflows, execution metadata and multiple trigger concepts.
- [x] Catalogue verified community approval/policy integrations and representative verified creators.
- [ ] Test official skills and `@n8n/workflow-sdk` in a pinned disposable n8n instance.
- [ ] Benchmark JSON directly vs typed SDK vs adapted template for identical specs.
- [ ] Build reusable human approval capability with identity, payload binding, expiry, replay protection and audit.
- [ ] Inspect creator workflow JSON and curate 20-30 license-safe, versioned patterns.
- [ ] Verify custom-node development process using official node CLI, and inspect package trust risks.

**Exit criteria:** evidence-backed decision on generation backend; representative tested workflow fixtures; community patterns approved only after reproducing expected behavior and failure handling.
