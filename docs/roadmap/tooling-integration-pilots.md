# Four-tool integration research and pilot plan

**Status:** PROPOSED EXPERIMENTS, not installed or connected.  
**Decisions:** official SDK and Skills remain the base ([ADR-0004](../decisions/0004-adopt-official-n8n-skills-and-sdk.md)); four additional projects are [evaluation candidates](../research/tooling-reuse-shortlist-2026-11-15.md). No fifth candidate.

## Goal

Prove which existing tools can supply **workflow schema knowledge, truthful runtime verification, safe n8n instance operations, and optional Git-based environment promotion** without introducing duplicate infrastructure or changing our product vision.

## First experiment prepared: isolated CI regression pilot

The [synthetic n8n-check fixture](../../tests/fixtures/n8n-check-smoke/README.md) and [GitHub Actions job](../../.github/workflows/n8n-check-smoke.yml) use an immutable `n8n-check` source commit, specify n8n **2.47.7**, and supply a positive workflow and a known-broken mutation. The positive control must exit 0; the broken control must exit 1 rather than 2. The action runs no client workflows and requires no secrets.

**Status at documentation time:** CI configuration prepared; not yet recorded as a completed runtime test. Check the associated GitHub run logs and preserve output artifacts. Local execution is blocked by missing Docker, blocked package-registry DNS, and Node 22 (n8n-check CLI declares Node >=24).

[Detailed source-level risk assessment](../research/tooling-source-audit-2026-11-15.md) documents version drift, published-workflow mutation risks and wildcard-CORS schema-server exposure.

## Execution order and concrete artifacts

| Gate | Experiment | Deliverable | Exit condition |
|---|---|---|---|
| 0 | Inventory versions, licenses, exact API/CLI command support | `reports/toolchain-compatibility.json` (future) | All actual versions/permissions documented; no production secrets |
| 1 | **Official CLI** — read-only inspect a disposable n8n instance | Capability matrix of CLI vs direct Public API vs MCP | Commands and access rights recorded; no writes |
| 2 | **Schema generator** — extract snapshot from matching package versions | Node/credential snapshot + missing-node report | Known node types/versions match instance; skips are visible |
| 3 | **Official SDK** — generate a fixture workflow | JSON, intended graph, actual graph diff | No broken edges or unrecognized parameters |
| 4 | **n8n-check** — run mockable workflow CI checks | Golden fixture, mutation tests, JSON and JUnit reports | Intended regression fails; positive fixture passes |
| 5 | **n8n-as-code** — test Dev→Staging only after snapshot | Reproducible promotion dry-run + mapping/diff report | No unexpected writes; no lost identity/connection data |
| 6 | Audit final combined setup | Decision matrix with Adopt / Optional / Reject per feature | No overlapping production write ownership; explicit release gate |

**All outputs named here are future artifacts.** Do not check the tasks off until real evidence exists.

## Pilot reference system

**Customer message intake**: Webhook + alternate chat-style entry adapter → verify trusted actor/tenant → call reusable child capability → select deterministic response → human approval on one safe simulated side effect → response + execution/run evidence.

Run synthetic two-tenant fixtures. The flow must include: correct path, denied identity, missing record, failed external API, retry/duplicate event, approval rejected/expired, and changed workflow version. No live client data or production integrations.

## Reuse policy

1. **Official-first:** SDK for authoring; official Skills for expertise; official CLI/Public API/MCP for actions supported by the target n8n instance.
2. **One owner of mutable workflows:** either a chosen sync orchestrator holds the write lock or all writes are disabled. No independent n8nac + CLI jobs that update the same workflow concurrently.
3. **No auto-adoption:** evaluate third-party components in read-only mode first. Pin tested commit/package, audit dependencies and license, sandbox Code nodes and avoid production credentials.
4. **Schema mismatch fails closed:** missing/unknown node properties and skipped schemas must be visible as 'unverified'; never silently default to a different node type.
5. **Runtime tests need isolation:** use synthetic fixtures and mocked side effects; n8n-check is not a substitute for isolated staging.
6. **The visual map comes last:** its success and health markers must be traced to the actual release and runtime evidence, not only successful validation.

## Architecture choice after pilots

- If the **official CLI** covers our operations, keep `n8nac` only for differentiating workspace/GitOps capabilities; otherwise consider it as the selected sync adapter.
- If **n8n-check** reliably catches controlled data/output regressions at our pinned n8n version, make its report a required CI artifact for supported workflow classes.
- If **schema-generator** cannot match n8n 2.47.7 precisely, use it as a research reference only and derive required schemas directly from pinned n8n packages instead.
- If any tool requires excessive privilege, obscures revisions, or introduces unsafe implicit publishing, **do not integrate it**.

## Work to record for every pilot

- Tool name, repository URL, exact commit or package version, transitive license review.
- Source repo/README claim versus what was tested.
- Command and sanitized configuration; input fixture; expected outputs; real logs.
- Node/instance version and feature/edition availability.
- Security observations, secret-handling policy, rollback and failure behavior.
- Recommendation per feature: `adopt`, `adapt`, `reference-only`, or `reject`.

**Unresolved dependency:** access to an isolated target n8n installation. This document does not claim such an instance exists or is connected.
