# Delivery Roadmap

All milestones below are future work. There are no implied deadlines. The [executive decision record](strategy/executive-decisions-2026-11-15.md) defines the chosen product architecture and the distinctions between decisions and implementation evidence.

## Immediate priority — first spec-to-n8n-to-visual vertical slice

1. [ ] Confirm version-pinned official n8n Skills, Workflow SDK and instance-level MCP in a disposable non-production environment; document permissions and compatibility.
2. [ ] Define an executable system specification and manifest for one customer-request capability with two entry channels, explicit identity checks, data read, denial/error paths and an optional human-review gate.
3. [ ] Build the reference flow with the official SDK, inspect actual generated JSON/connections, and compare with an equivalent direct JSON fixture.
4. [ ] Execute staging tests for correct response, rejected access, errors, retries, duplicate requests and approval edge cases. Record real execution evidence.
5. [ ] Generate a business-level visual behavior map linked to the *approved workflow revision* and test map fidelity against the deployed graph.
6. [ ] Document independent review, release approval and rollback. **Do not** imply production readiness from SDK or static validation alone.

**Exit criteria:** an end-to-end reproducible, non-production example that converts a human product specification to a real n8n workflow and a truthful visual abstraction. Expand the pattern library only after this works.



## Adaptive execution pilot — Hermes on BoxLite (proposal)

Architecture: [Hermes task worker](architecture/adaptive-execution-hermes-boxlite.md) · [ADR-0006](decisions/0006-hermes-adaptive-agent-runtime.md) · [production control checklist](standards/agent-production-controls.md).

- [x] Verify vendor Hermes Gateway startup, authenticated task API, secret separation and wake behavior from official documentation.
- [x] Define three agent profiles (Research, Engineering, Data) and the proposed task/result JSON schemas.
- [x] Extract six production safeguards from the shared n8n training transcript.
- [ ] Implement a restricted n8n Hermes task adapter with version-pinned model/image profile, scope, budgets and trusted actor/tenant mapping.
- [ ] Verify task Gateway credentials are independent from the BoxLite Cloud management API key.
- [ ] Execute one synthetic agent task, capture a real file artifact, independently validate its content, and preserve run evidence.
- [ ] Test timeout/unknown outcome, 503 wake, malformed output, repeated requests, unauthorized data access, refusal, and Box cleanup.
- [ ] Pilot promotion of a verified discovery into one reusable n8n sub-workflow; do not publish directly from an agent run.
- [ ] Benchmark cost and latency of one warm Box versus request-triggered wake, without committing to three permanent VMs.

**Not implemented:** no BoxLite/Hermes integration has been provisioned by the project; the existing GitHub Actions CI remains in place. The BoxLite account-management key previously exposed in the conversation must be revoked/rotated before any future provisioning.

## Tooling reuse evaluation (four candidates)

**[Detailed pilot plan](roadmap/tooling-integration-pilots.md)** · **[Source-backed shortlist](research/tooling-reuse-shortlist-2026-11-15.md)**.

- [x] Identify distinct roles and overlaps for n8n-as-code, n8n-check, official @n8n/cli and n8n-schema-generator.
- [x] Record source, risk, version compatibility concerns and per-tool acceptance criteria.
- [x] Inspect core implementation, licensing, exposed server behavior, Docker isolation and version pins; publish engineering audit.
- [x] Prepare synthetic positive and deliberately broken n8n-check fixtures with GitHub Actions job (run result still unverified).
- [x] Verify the [GitHub Actions pilot](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040) completed: positive output contract passed; deliberately broken workflow failed by producing zero rather than two records. [Archived evidence](research/pilots/n8n-check-verified-run-2026-11-15.md).
- [ ] Expand n8n-check runner tests to HTTP mocks, retry/duplicate side effects and parent/child execution ancestry before making it a required release gate.
- [ ] Run official CLI read-only capability tests against disposable n8n.
- [ ] Verify a version-matched schema registry and rejected/skipped node cases.
- [ ] Generate one reference flow via official SDK and inspect real graph.
- [ ] Catch controlled silent-data-loss and duplicate-side-effect regressions using n8n-check with pinned engine.
- [ ] Test n8n-as-code Dev-to-Staging sync, dry run, diff and safe credential/workflow remapping only if official CLI cannot provide equivalent value.
- [ ] Decide per capability: adopt, adapt, reference-only or reject. Do not run competing write/sync jobs.

The previous fifth candidate is out of scope. **No tool integration has been completed.**

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

## M6 - Official SDK, skills and n8n community reuse (adopted toolchain; implementation pending)

The chosen toolchain is documented in [ADR-0004](decisions/0004-adopt-official-n8n-skills-and-sdk.md) and [official toolchain](framework/official-toolchain.md). We will **not** rebuild the upstream SDK. We will implement system-level specifications, governance and validation around it.

- [x] Discover official n8n agent skills and typed Workflow SDK in pinned upstream source.
- [x] Adopt official Skills and SDK-first generation as the primary design direction (benchmark still pending).
- [x] Audit native human review, sub-workflows, execution metadata and multiple trigger concepts.
- [x] Catalogue verified community approval/policy integrations and representative verified creators.
- [ ] Test official skills and `@n8n/workflow-sdk` in a pinned disposable n8n instance.
- [ ] Benchmark JSON directly vs typed SDK vs adapted template for identical specs.
- [ ] Build reusable human approval capability with identity, payload binding, expiry, replay protection and audit.
- [ ] Inspect creator workflow JSON and curate 20-30 license-safe, versioned patterns.
- [ ] Verify custom-node development process using official node CLI, and inspect package trust risks.

**Exit criteria:** evidence-backed decision on generation backend; representative tested workflow fixtures; community patterns approved only after reproducing expected behavior and failure handling.
