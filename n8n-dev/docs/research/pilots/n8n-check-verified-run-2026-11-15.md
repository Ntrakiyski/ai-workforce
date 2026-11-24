# Verified runtime pilot: n8n-check detects silent data loss

**Date:** 2026-11-15 (Europe/Sofia) / 2026-11-14 UTC  
**Status:** **VERIFIED_RUNTIME — limited synthetic fixture**  
**Runtime:** n8n **2.47.7** in isolated GitHub Actions Docker runner; Node **v26.13.0** in container  
**n8n-check runner:** **0.1.9**, source commit `61f6a2e50111f5a89b3131eba3ca5f2b548213d5`  
**Repo change:** `947e1aeaee2fb2caa5c828746e9cb880551b50de`  
**CI execution:** [GitHub Actions run 43649002040](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040), completed **success**  
**Report artifact:** [n8n-check-smoke-reports](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040/artifacts/14135875549) (artifact ID `14135875549`, ZIP SHA-256 `7f685804f0f52968b4b98f7d83153604d473e54c203a7b99e94e87e76296b987`)

## Objective and experiment design

Determine whether a third-party regression tool can detect **a business-output defect despite a successful n8n engine execution**, using a pinned real n8n runtime instead of static JSON checks.

**Two workflows:**
- **Positive control:** manual trigger -> fixture input -> Code filter (`score >= 0.70`). A test harness replaces the input with three synthetic tenant-A records; two scores exceed the threshold.
- **Negative mutation:** same workflow with filter changed to `score >= 0.95`, losing both eligible records.

**Contract:** output count **2**, and output IDs in order **[`request-A`, `request-B`]**. No real HTTP calls, credentials, client data or downstream side effects.

## Observed results from archived JSON/JUnit reports

| Assertion | Positive control | Negative mutation |
|---|---|---|
| Actual n8n command executed successfully | Yes (`cliExitCode=0`) | Yes (`cliExitCode=0`) |
| Test status | `passed` | `failed` (expected) |
| n8n-check exit | **0** | **1** |
| Output count expected | 2 | 2 |
| Output count actual | **2** | **0** |
| Output IDs expected | `request-A`, `request-B` | same |
| Output IDs actual | **Both correct** | **Empty array — regression detected** |
| JUnit | 5 tests, **0 failures** | 5 tests, **2 failures**, 0 errors |
| Runtime | n8n **2.47.7**, Node **v26.13.0** | same |
| Network | `loopback-only`, `enforced=true`, interfaces `[lo]` | same |
| Duration (report) | 12,985 ms | 12,742 ms |

The CI step for the deliberately broken workflow is configured `continue-on-error`; a separate assertion **requires exit code 1**, meaning the job must fail if the negative test unexpectedly passes or the runner returns setup error 2. The overall GitHub Actions job completed **success** after verifying both expectations.

**Critical finding:** The n8n engine itself reported success for the flawed workflow, but n8n-check correctly identified that the business data contract failed. This confirms usefulness as an independent regression checker for supported workflow slices.

## Evidence chain

1. [Git commit containing the exact test inputs and Action](https://github.com/Ntrakiyski/n8n-dev/commit/947e1aeaee2fb2caa5c828746e9cb880551b50de).
2. [Healthy export](../../../tests/fixtures/n8n-check-smoke/healthy.workflow.json), [defective mutation](../../../tests/fixtures/n8n-check-smoke/regression.workflow.json), [expected-output case](../../../tests/fixtures/n8n-check-smoke/eligible-rows.case.json).
3. [Pinned GitHub Actions workflow](../../../../.github/workflows/n8n-check-smoke.yml) at the commit above.
4. [Completed run 43649002040](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040) and archived positive/negative `report.json` and `junit.xml` files.
5. [Machine-readable condensed verification](../../../research/runtime-evidence/n8n-check-2026-11-15.json) generated from the archived reports.

## What this does NOT prove

- That all n8n nodes, versions, AI subnodes, queue mode, multi-execution waits, or sub-workflows work under this runner.
- That a mocked HTTP request is equivalent to an actual authenticated provider integration.
- That approval, signature/replay prevention, tenant segregation, or production deployment is secure.
- That the official CLI, n8n-as-code or schema generator is compatible or reliable; **none was executed** in this pilot.
- That production-ready workflow logic can be inferred from SDK/static validation.

## Decision and next gate

**Decision for this capability:** Promote `n8n-check` from *unverified candidate* to **PILOT-VALIDATED for synthetic, self-contained workflow-output regressions** on n8n 2.47.7. It is not yet a universal mandatory release gate.

**Next test additions before broader adoption:**
- HTTP mock contracts with method/path/body inspection and transient 503/retry behavior.
- A controlled duplicate side-effect scenario and an item-linking or item-order defect.
- A parent-child subworkflow case with accurate lineage mapping.
- A version matrix against the next target n8n upgrade.
- CI trust/permissions review, including pinning Actions and verifying runner host isolation.

The existing tests should remain isolated and synthetic, with no production credentials.
