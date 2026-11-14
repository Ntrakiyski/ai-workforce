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
