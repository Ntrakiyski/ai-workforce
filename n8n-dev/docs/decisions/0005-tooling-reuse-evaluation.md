# ADR-0005 — Tooling reuse evaluation and safe ownership boundaries

- **Status:** Accepted evaluation policy; **no third-party tool adopted for production**
- **Date:** 2026-11-15
- **Depends on:** [ADR-0004: official n8n SDK and Skills](0004-adopt-official-n8n-skills-and-sdk.md)
- **Evidence:** [Source audit](../research/tooling-source-audit-2026-11-15.md); [Pilot plan](../roadmap/tooling-integration-pilots.md)

## Decision

Investigate **exactly four** candidates and decide based on reproducible behavior instead of package popularity:

1. Official `@n8n/cli` as the default candidate for supported instance API operations, under scoped permissions.
2. `n8n-check` as a candidate isolated, real-engine workflow regression checker.
3. `n8n-as-code` as a candidate **optional** Git/workspace sync adapter, not the canonical workflow authoring language.
4. `n8n-schema-generator` as an **audit/possible extraction approach**, not a trusted schema source until regenerated for the exact target release.

The proposed fifth candidate from the prior shortlist is **explicitly excluded** from our evaluation, source corpus, framework dependencies, and roadmap.

## Boundaries

- The accepted official SDK/Skills/MCP architecture remains authoritative for authoring and expert behavior.
- Mutating a published workflow must not be an unreviewed side effect of "sync."
- There must be **one assigned writer per workflow/environment** and an approval path for production changes.
- Regenerated schema snapshots are invalid when extraction failures are silent, packages are version-skewed, or node coverage cannot be measured.
- Regression tests run with synthetic inputs, no secrets, pinned n8n runtime, network isolation and demonstrable failing mutations.
- README claims and CI configuration are **not** test evidence; only a completed runtime report justifies `VERIFIED_RUNTIME`.
- This plan can recommend adoption/optional/rejection *per capability*; it does not require adopting any package in full.

## Why

The four tools overlap substantially. Accepting them as an inseparable stack would increase dependency, credentials, version drift and maintenance risk. We need reproducible functional evidence, lowest privilege, and a single canonical workflow generation format.

## Follow-up

- Execute the isolated [n8n-check smoke experiment](../../tests/fixtures/n8n-check-smoke/README.md) and record GitHub Actions results.
- In a disposable 2.47.7 instance, compare the official CLI to n8nac read-only and dry-run operations.
- Regenerate node definitions for the correct version, including errors and skipped types.
- Review and accept/reject each candidate by individual capability, with tests and rollback.

**State:** All items remain experiments pending execution evidence.

## Subsequent limited verification — 2026-11-15

[n8n-check's synthetic regression pilot](../research/pilots/n8n-check-verified-run-2026-11-15.md) succeeded on a real n8n 2.47.7 engine: positive workflow output passed, deliberately broken workflow output failed as intended, and the isolated runner produced JUnit evidence. This moves **only the self-contained regression-check capability** to `PILOT-VALIDATED`, not to unconditional production adoption. The other three candidates are still source-reviewed, not runtime-tested.
