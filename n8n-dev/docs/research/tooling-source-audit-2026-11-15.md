# Engineering assessment: reuse of four n8n tooling projects

**Review date:** 2026-11-15  
**Scope:** Source-level evaluation of four candidates; design of one safe automated regression pilot  
**Baseline:** n8n `2.47.7`, source commit `d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063`  
**Status:** Source inspected; **limited n8n-check regression pilot verified on an isolated real n8n 2.47.7 runner**. No live client/production n8n instance was connected. The other three candidate tools remain unexecuted.  
**Audience:** Product architecture, agent engineering, platform operations, security review.

## Executive decision

**Recommendation: evaluate the official n8n CLI as the default operations adapter, use n8n-check for limited verified output-regression CI with expansion gates, evaluate n8n-as-code only where Git/environment sync adds unique value, and defer live use of the schema generator until its extracted node metadata matches n8n 2.47.7.**

The primary workflow authoring stack **remains official n8n Skills + `@n8n/workflow-sdk` + approved instance-level MCP**, as established in [ADR-0004](../decisions/0004-adopt-official-n8n-skills-and-sdk.md). None of the four candidates replaces our product specification, manifest, version binding, execution evidence or behavior-map work.

## First independently observed runtime finding

**F-12 — Regression runner detects silent data loss, n8n 2.47.7 — VERIFIED_RUNTIME.** [GitHub Actions run 43649002040](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040) completed **success**. The positive workflow executed successfully and returned exactly 2 eligible IDs (**5 JUnit checks passing**). The intentionally flawed workflow also executed successfully in n8n, but produced 0 records and triggered **2 expected JUnit assertion failures**, correctly returning runner exit **1**, not a setup error. The tests were run under Node v26.13.0 with `network: loopback-only; enforced=true`. [See the immutable evidence report](pilots/n8n-check-verified-run-2026-11-15.md) and [machine-readable condensed evidence](../../research/runtime-evidence/n8n-check-2026-11-15.json).

**Interpretation:** Validates only a synthetic self-contained output regression on this engine version. Does not validate queue mode, credentials, security, human review or production rollout.

## Cross-cutting SDK documentation compatibility

**F-13 — The official SDK version and community reverse-engineered guide are not the same release.** The [official Workflow SDK package at our pinned n8n 2.47.7 source](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/workflow-sdk/package.json) reports SDK **0.40.2**. The [Subworkflow-AI unofficial SDK documentation](https://github.com/Subworkflow-AI/unofficial-n8n-workflow-sdk-docs/blob/128b29226f27ba31e8541587fe8a49b58f71a413/package.json) targets SDK **0.27.2**.

**Policy:** Treat the unofficial guide as a tested historical learning resource, **not an API specification for 0.40.2**. Before generating code, inspect `npm ls @n8n/workflow-sdk`, the installed SDK export surface and version-pinned upstream examples; compile and run a minimal fixture. Do not assume all historical SDK traps/fixes still apply.

This compatibility note concerns our existing official SDK foundation; it does **not** add a fifth tooling evaluation candidate.

### Key source-verified findings

| Finding | Severity | Source observation | Engineering consequence |
|---|---|---|---|
| F-01 — Old schema snapshot | **High** | [`schemas/_meta.json`](https://github.com/yigitkonur/n8n-schema-generator/blob/10374df02d96fdb206e1e950c6d566cf90af372f/schemas/_meta.json) reports `n8nVersion: 1.120.10`, `nodeCount: 428`, extracted 2026-04-18. | Reject these snapshots as authoritative for 2.47.7. Extract from exact matching dependency versions, compare to instance. |
| F-02 — Silent schema omissions | **High** | [`extract.ts`](https://github.com/yigitkonur/n8n-schema-generator/blob/10374df02d96fdb206e1e950c6d566cf90af372f/extract.ts) uses empty `catch {}` blocks while loading/instantiating node and credential classes. | Report failures/skips explicitly and compare to expected inventory before trusting catalog completeness. |
| F-03 — Schema server exposure | **High** | [`server.ts`](https://github.com/yigitkonur/n8n-schema-generator/blob/10374df02d96fdb206e1e950c6d566cf90af372f/server.ts) sets `Access-Control-Allow-Origin: *`, has no visible authorization check for validation endpoints, and calls `server.listen(PORT)` without a loopback-only host argument. | Do **not** expose directly on a VPS/public network. If evaluated, run inside isolated localhost-only environment with request/payload limits. |
| F-04 — Default test engine mismatched | **High** | [n8n-check `Dockerfile`](https://github.com/blucca/n8n-check/blob/61f6a2e50111f5a89b3131eba3ca5f2b548213d5/Dockerfile) defaults to `n8n 2.41.7`; the [Action](https://github.com/blucca/n8n-check/blob/61f6a2e50111f5a89b3131eba3ca5f2b548213d5/action.yml) accepts an exact `n8n-version`. | Our pilot pins `2.47.7`; report actual runtime version rather than assuming image parity. |
| F-05 — Real engine, controlled sandbox | **Positive** | [`n8n-check/src/runner.mjs`](https://github.com/blucca/n8n-check/blob/61f6a2e50111f5a89b3131eba3ca5f2b548213d5/src/runner.mjs) invokes n8n `import:workflow` and `execute --rawOutput`, records reports; [`src/action.mjs`](https://github.com/blucca/n8n-check/blob/61f6a2e50111f5a89b3131eba3ca5f2b548213d5/src/action.mjs) uses Docker `--network none` and read-only input mounts, but explicitly allows a report output directory. | Good controlled regression lane for self-contained workflow slices; not a substitute for credentials, multi-tenant, queue-mode, wait/resume or real-provider staging tests. |
| F-06 — Published workflow push can publish | **Critical operations risk** | [`n8n-as-code` CLI README](https://github.com/EtienneLescot/n8n-as-code/blob/97b7e53c9ebad9dd516345b7d3664cb397987580/packages/cli/README.md) warns that pushing a **published** n8n 2.x workflow updates its live published version; `--draft` provides an alternative behavior. [`sync.ts`](https://github.com/EtienneLescot/n8n-as-code/blob/97b7e53c9ebad9dd516345b7d3664cb397987580/packages/cli/src/commands/sync.ts) reports this risk before pushing. | Restrict `n8nac` writes to disposable Dev/Staging. Require authorization, snapshot, and release gate; no agent direct production push. |
| F-07 — Two competing authoring formats | **Architecture risk** | [n8n-as-code CLI package](https://github.com/EtienneLescot/n8n-as-code/blob/97b7e53c9ebad9dd516345b7d3664cb397987580/packages/cli/package.json) depends on its own `@n8n-as-code/transformer`; the [project README](https://github.com/EtienneLescot/n8n-as-code/blob/97b7e53c9ebad9dd516345b7d3664cb397987580/README.md) describes decorator-based `.workflow.ts` files. | Keep **official SDK** as candidate authoring source. Investigate n8nac for pull/push/diff/promote only; prove format compatibility before using both. |
| F-08 — Official operator is available | **Positive** | [Official `@n8n/cli` README](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/cli/README.md) documents workflow, execution, project, credential and data-table operations. [`config.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/cli/src/config.ts) uses permissions `0600` for stored API-key configuration. | Evaluate it before introducing a second operations CLI, using read-only tests and least-privilege API credentials. |
| F-09 — CLI licensing | **Business risk** | [Official CLI package](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/cli/package.json) declares `LicenseRef-n8n-sustainable-use`; third-party candidate package licenses were read as MIT. | Do not treat the official CLI as MIT/open-source or assume the commercial client-hosting model is cleared. |
| F-10 — Environment capability not present here | **Execution blocker** | Assessment environment has Node `22.16.0`, npm `10.9.2`, no `docker` binary, and outbound package-registry DNS requests fail. [n8n-check's `package.json`](https://github.com/blucca/n8n-check/blob/61f6a2e50111f5a89b3131eba3ca5f2b548213d5/package.json) declares Node `>=24`. | No local n8n runtime/npm integration pilot can be claimed. Use the narrowly scoped GitHub Actions synthetic smoke test and separately provision staging for integration tests. |

### F-11 — n8nac readiness may misclassify licensing (issue report; not independently reproduced)

[Open issue #704](https://github.com/EtienneLescot/n8n-as-code/issues/704) reports that `n8nac env status` returns `invalid-api-key` when `GET /api/v1/projects?limit=1` actually responds HTTP 403 due to a restricted project-administration license feature, while the same API key can read workflows (HTTP 200). The report covers n8n 2.44.5 and `n8nac 2.7.0`, not our 2.47.7 target.

**Action:** test environment readiness with a permission/edition matrix. Do not treat this user's issue as proof of a widespread bug; reproduce on a disposable edition before concluding. A single project-admin probe should not be our only credential-validity signal.

## Candidate-by-candidate disposition

### A — Official `@n8n/cli`: baseline operations adapter

- **Use:** inspect instance version/configuration, list workflows and executions, read workflow definitions, enumerate feature support; eventually authorized promotion/rollback if supported by edition.
- **Do not use to author workflows:** `@n8n/workflow-sdk` builds them; CLI operates a target instance.
- **Gate:** verify client instance/edition, endpoint permissions and source vs saved revision; redact secrets from command output. Start read-only; no production mutating token in an agent session.
- **Choice:** **candidate baseline**; requires actual API probing before an operational adoption claim.

### B — `n8n-check`: trial real-engine regression runner

- **Use:** controlled item-transform tests, output assertions, request contract checks, JSON/JUnit CI evidence, negative mutations.
- **Proposed smoke:** [synthetic scoring fixture](../../tests/fixtures/n8n-check-smoke/README.md) + [pinned GitHub workflow](../../../.github/workflows/n8n-check-smoke.yml) where a healthy filter should return 2 IDs and an intentionally broken filter should fail.
- **Gate:** runner must return pass (0) on healthy, regression (1) on broken, not setup error (2); report real version 2.47.7 and record upstream tool commit.
- **Security:** Action pinned to immutable commit, checkout with no persisted credentials, read-only contents permission, fake inputs, no providers and Docker `--network none`. **Still untrusted third-party code:** the workflow action itself runs on the host runner during setup. Keep privileged tokens and secrets unavailable.
- **Choice:** **PILOT-VALIDATED for this self-contained output-regression fixture**. Broader CI gate acceptance requires HTTP mock/retry, side-effect and subworkflow tests.

### C — `n8n-as-code` (`n8nac`): optional repo-environment synchronization

- **Use only if unique:** reviewable Git sync, remote drift detection, conflict handling, Dev/Staging promotion, credential and workflow-reference remapping.
- **Important verified behavior:** `push --verify` performs a live push and check; it is **not** a dry run. `promote --dry-run` is documented as no-write but may read target environment; `promote` without that flag may write/push. The CLI explicitly warns about live publication on n8n 2.x.
- **Gate:** benchmark versus official CLI/API/MCP; compare exported JSON and connection graphs; inject conflict and missing-credential cases; require one owner of mutating updates.
- **Choice:** **optional adapter**; do not replace the official SDK's authoring model.

### D — `n8n-schema-generator`: source-inspection aid, not the schema authority

- **Use:** examine schema-extraction approach and conditional-display validation; evaluate whether a modified extractor can produce a pinned catalog.
- **Do not use as-is:** historical `1.120.10` snapshot, skipped class instantiations hidden in catch blocks, permissive local API exposure.
- **Gate:** patch and run extractor with **exactly matched** n8n package versions, emit `extracted / skipped / failed` manifests, compare with 20 known nodes from installed instance (including AI nodes), fail closed for missing typeVersions.
- **Choice:** **reference/adapt candidate only** until evidence meets gate; do not install server on client VPS.

## Overlap resolution

| Capability | Default owner | Alternative / supplement | Policy |
|---|---|---|---|
| Node knowledge | Official n8n Skills + versioned source | Schema extractor | Extractor must prove version/coverage parity |
| Workflow generation | Official SDK | n8n-as-code transformer | Keep one canonical authored form |
| Instance operations | Official CLI / approved MCP | n8nac | Prefer one authorized operator per operation |
| Workflow sync & promotion | Explicit, approved deployment process | n8nac Dev/Staging adapter | Dry-run, review, drift and rollback |
| Runtime regression | Actual isolated n8n staging | n8n-check fixture runner | Separate unit/slice checks from integration tests |
| End-user behavior UI | Our manifest/projection layer | None of these tools | Must be evidence-backed and versioned |

## Recommendation for the first implementation sprint

1. **[Completed]** Run n8n-check synthetic CI on n8n 2.47.7: positive pass and mutation detected; archive results. Next expand to HTTP/retry/subworkflow scenarios.
2. **Prepare disposable n8n staging** with read-only API credentials, exact version and no client secrets; document installed capabilities.
3. **Use official SDK + Skills** to create a small system fixture and inspect serialized connections and node versions.
4. **Probe official CLI** against staging in read-only mode, then evaluate n8nac's *unique* Git-sync functions under scoped credentials.
5. **Audit schema coverage** independently; do not block the first vertical slice on accepting a third-party stale schema catalog.
6. **Bind resulting artifacts** into our System Specification → tested n8n workflows → behavior-first visualization chain.

## Follow-up acceptance contract

A tool cannot be promoted to `ADOPTED` unless we have:

- An immutable upstream source/version and license check.
- A redacted, repeatable command/fixture and a recorded real execution result.
- Positive and negative tests, including a failure that the tool detects.
- A statement of what the tool **does not** validate.
- A scoped permissions model, failure policy, ownership and rollback plan.
- No duplicate uncoordinated workflow mutation path.

**Evidence classification:** upstream file inspection = **VERIFIED_SOURCE**. Upstream README behavior not independently run = **MAINTAINER_CLAIM**. User repo proposed workflow + fixture = **TEST_PREPARED**, until GitHub Actions logs prove execution. Do not convert these statuses silently.
