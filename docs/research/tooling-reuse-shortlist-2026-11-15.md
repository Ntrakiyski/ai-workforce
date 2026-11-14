# Tooling reuse shortlist — four candidates

**Reviewed:** 2026-11-15  
**Status:** RESEARCHED / NOT INSTALLED / NOT RUNTIME-VALIDATED  
**Target baseline:** n8n 2.47.7 (source commit `d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063`); verify exact client instance independently.

**Implementation-level follow-up:** [2026-11-15 source audit](tooling-source-audit-2026-11-15.md) and [isolated n8n-check pilot](../../tests/fixtures/n8n-check-smoke/README.md). The prior shortlist was a hypothesis; these references examine executable source and failure behavior.

## Scope

This shortlist contains **exactly four** candidates from the November discussion. The fifth proposal was explicitly rejected and is **not** a dependency, reference corpus, or planned framework component. Do not reintroduce it through a generated research plan.

This is a **reuse assessment**, not an instruction to adopt every tool. Official n8n Skills, the official `@n8n/workflow-sdk`, authorized n8n MCP, and our system specification remain the foundation described in [ADR-0004](../decisions/0004-adopt-official-n8n-skills-and-sdk.md).

## Candidate map

| Candidate | Confirmed upstream capability | Proposed role | Priority | Decision status |
|---|---|---|---|---|
| [EtienneLescot/n8n-as-code](https://github.com/EtienneLescot/n8n-as-code) (`n8nac`) | Workspaces/environments, workflow pull/push, GitOps-like sync, TypeScript source format, VS Code and agent tooling, dry-run promotion | **Optional developer workspace + environment sync/promotion adapter** | P0 | Evaluate; **do not replace official SDK by default** |
| [blucca/n8n-check](https://github.com/blucca/n8n-check) (`@blucca/n8n-check`) | Run exported workflows in an n8n engine with fixtures/mocked HTTP, assert results, produce JSON/JUnit, GitHub Action | **Regression test runner** for controlled workflow behavior in CI | P0 | Pilot in non-production |
| [n8n-io/n8n/packages/@n8n/cli](https://github.com/n8n-io/n8n/tree/master/packages/%40n8n/cli) (`@n8n/cli`) | Official API client for workflows, executions, credentials, projects, data tables and supported promotion/package operations; machine-readable output | **Operational baseline** to manage authorized n8n instances | P0 | Prefer upstream for supported commands; verify edition/version |
| [yigitkonur/n8n-schema-generator](https://github.com/yigitkonur/n8n-schema-generator) | Extract node/credential schemas from installed packages; JSON schema registry and a validation API | **Schema extraction / node-parameter evidence**, only if pinned and reproducible | P1 | Candidate, validate version skew and coverage |

### Important differences and potential conflicts

- **Official SDK versus n8n-as-code transformer:** Both offer programmatic workflow authoring, but `n8n-as-code` includes its own `@n8n-as-code/transformer` format. **Do not introduce a second primary workflow language** just because the project offers one. Benchmark its synchronization and promotion features *separately* from its alternate authoring system.
- **Official CLI versus n8n-as-code:** Both can operate n8n instances. Use **official CLI/API as the baseline**; adopt `n8nac` only for concrete missing value (environment binding, drift detection, workflow diff/review, promotion or developer UX) proven by a pilot. Do not run two independent mutation/synchronization loops against the same workflow without revision ownership.
- **Official Skills/MCP versus n8n-as-code skills/MCP:** Avoid duplicating instructions, tool routing and permissions. Prefer n8n-owned documentation as source authority; evaluate community helpers as optional adapters.
- **Static schema validation versus real execution:** Neither `n8n-schema-generator` nor the SDK proves business correctness. Use `n8n-check` in controlled CI and an isolated real staging instance for integration/security evidence.
- **Version drift:** `n8n-schema-generator` declares `n8n-nodes-base ^1.120.1` and `n8n-workflow ^1.119.1` in its package file, not a guarantee of parity with our pinned n8n 2.47.7 source. Its README reports 428 nodes/389 credentials; treat these as historical maintainer numbers, not current validated coverage.
- **Runner pinning:** `n8n-check` documents an older default test image (2.41.7) and permits an explicit `n8n-version`. **Always specify the target version** and record the exact image/tag; never implicitly test 2.47.7 workflows on a different version.
- **Deployment licensing:** n8n instance operations, source-control/promotion features, and client-controlled editing have edition/license boundaries. A successful CLI command in a developer installation does not establish permission to provide hosted editing to clients.

## Specific things worth extracting or reusing

### A. n8n-as-code

**Reuse candidates**
- Environment definitions, workflow source in Git, pull/push sync, conflict detection.
- Promotion plan/dry-run and supported credential + sub-workflow reference remapping.
- Agent-workspace inventory, examples, diagrams, and reviewable workflow changes.

**Avoid copying blindly:** the alternate `@n8n-as-code/transformer` authoring dialect, mutable production credentials, or implicit activation. Check how it handles API drift, concurrent UI edits, revision locking, rollback and error recovery.

**Pilot question:** Can a typed *official SDK* workflow be safely transported, diffed and promoted via `n8nac` without losing connections, node IDs, credentials or execution behavior?

**Pass criteria:** fully reproducible Dev→Staging promotion with explicit approval, no unrequested updates, correct dependency mapping and reversible failed deployment.

### B. n8n-check

**Reuse candidates**
- Fixture format for expected item counts, fields and output JSON.
- Intercepted/mocked HTTP requests to verify side effects and retries.
- JSON/JUnit reports and GitHub required CI status checks.
- Captured parent/child execution ancestry and negative regression examples.

**Limitations:** a self-contained runner may not reproduce queue mode, complex waits, long-lived approvals, real credentials, production connectors, or cross-system state semantics. Never substitute it for integration tests.

**Pilot question:** Does it catch **silent data loss** and **duplicate side effects** that pass JSON/static validation?

**Pass criteria:** at least one positive case, one controlled data-loss failure, one duplicate-write/retry case, JUnit evidence and a required failing CI gate. Run malicious/user-supplied Code nodes only inside a genuinely isolated runner with minimal network/file permissions.

### C. Official @n8n/cli

**Reuse candidates**
- Workflow/project/credential **inspection** through authorized API.
- Execution lookups, status reporting, machine-readable JSON for agents.
- Explicit workflow lifecycle operations, and possibly export/promotion on supported versions/plans.

**Boundary:** a client CLI is not the n8n engine, not the Workflow SDK, and not automatically permitted to publish. Protect API keys and start with read-only credentials. The pinned 2.47.7 source includes this package; confirm installed published version, API support, and command-level permissions in the pilot.

**Pilot question:** What operations can the official CLI handle entirely, making `n8nac` redundant for that action?

**Pass criteria:** audited, versioned capability matrix; stable read/inspect calls on a disposable instance; explicitly approved create/update only in staging.

### D. n8n-schema-generator

**Reuse candidates**
- Source-derived node/credential metadata, default values, required/configurable properties.
- Offline searchable node catalog and validator endpoint.
- Detection of invalid node versions and malformed references *before* import.

**Boundary:** its extractor may silently skip nodes that fail to instantiate; its installed package versions may not match our target. Do not rely on README node counts, hourly auto-updated snapshots, or passing static checks as proof of coverage.

**Pilot question:** Can it extract an accurate, version-pinned catalog that agrees with the target instance's actual node registry?

**Pass criteria:** inventory of successfully parsed nodes **plus skipped/failing nodes**; comparison across a representative set of 20 core/AI/integration types; explicit unsupported-version behavior; deterministic snapshot hash; no hidden schema auto-upgrades.

## Combined proposed workflow (design, not implementation)

~~~mermaid
flowchart TD
  SPEC["Our product specification"] --> ARCH["Architect + official n8n Skills"]
  ARCH --> BUILD["Official @n8n/workflow-sdk"]
  SCHEMA["Candidate schema extractor"] -.-> BUILD
  BUILD --> JSON["Workflow JSON + expected graph"]
  JSON --> STATIC["Source/version/connection checks"]
  SCHEMA -.-> STATIC
  STATIC --> CHECK["Candidate n8n-check CI fixtures"]
  CHECK --> STAGE["Disposable n8n staging instance"]
  CLI["Official @n8n/cli/API"] --> STAGE
  ASCODE["Optional n8n-as-code Git sync"] -.-> STAGE
  STAGE --> REVIEW["Independent review + explicit release decision"]
  REVIEW --> MAP["Evidence-bound business behavior map"]
~~~

Dashed edges are **optional / unproven integrations**. None of these tools has been installed or tested by this document.

## Evidence gathered (repository primary-source READMEs / manifests)

- [n8n-as-code README](https://github.com/EtienneLescot/n8n-as-code/blob/main/README.md), [packages](https://github.com/EtienneLescot/n8n-as-code/tree/main/packages), [CLI usage](https://n8nascode.dev/docs/usage/cli/). Its LICENSE is MIT.
- [n8n-check README](https://github.com/blucca/n8n-check/blob/main/README.md), [Action source](https://github.com/blucca/n8n-check/blob/main/action.yml), [regression examples](https://blucca.github.io/n8n-check/examples/green-runs/). Its LICENSE is MIT.
- [Official @n8n/cli README](https://github.com/n8n-io/n8n/blob/master/packages/%40n8n/cli/README.md), [n8n 2.47.7 SDK/CLI source](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/cli). **Review n8n's sustainable-use licensing** and relevant installed edition.
- [n8n-schema-generator README](https://github.com/yigitkonur/n8n-schema-generator/blob/main/README.md), [package.json](https://github.com/yigitkonur/n8n-schema-generator/blob/main/package.json). Its LICENSE is MIT.

**Source-derived versus proposed:** README/project descriptions identify capabilities; all adoption choices, success criteria, risks, and comparisons above are **our engineering proposals**. No successful production run or security audit is claimed.
