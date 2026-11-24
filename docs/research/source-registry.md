# Research Source Registry

## Local BoxLite node pilot — 2026-11-16

- **E-BOXLITE-001 / VERIFIED_RUNTIME:** [node review and local execution record](../../nodes/n8n-nodes-boxlite/REVIEW.md),
  [portable guide and reproduction instructions](../../workflow-examples/README.md).
  Target: n8n 2.47.7, Docker single-instance; self-hosted BoxLite v0.13.1. Local guide execution 65
  succeeded; execution 63 intentionally failed after cleanup. Raw traces remain private/local.
  This does not verify Cloud writes, named-volume persistence or the proposed Hermes integration.

**Snapshot date:** 2026-11-14. This is a prioritized queue, not an assertion that every source has been thoroughly audited.

## Tier A - Native n8n implementation

| Priority | Source | Focus | State |
|---|---|---|---|
| P0 | [n8n `2.47.7` release](https://github.com/n8n-io/n8n/releases/tag/n8n%402.47.7) | Baseline version and release changes | Version and commit verified |
| P0 | [`packages/workflow/src/workflow-structure-validation.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/workflow-structure-validation.ts) | Native structural graph validation | Read and summarized |
| P0 | [`packages/workflow/src/interfaces.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/interfaces.ts) | Node, connection, workflow and settings types | Selected types inspected |
| P0 | [`packages/workflow/src/workflow-validation.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/workflow-validation.ts) | Trigger-like node check | Read |
| P0 | [`packages/workflow/src/common/map-connections-by-destination.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/common/map-connections-by-destination.ts) | Connection bounds and traversal | Read |
| P0 | [`packages/workflow/src/node-validation.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/node-validation.ts) | Native node validation | Queued |
| P0 | [`packages/workflow/src/workflow.ts`](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/workflow.ts) | Graph runtime and expressions | Queued |
| P0 | [`packages/core/`](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/core) | Execution engine | Directory identified, detailed analysis queued |
| P0 | [`packages/cli/`](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/cli) | Persistence, Public API, import/publish lifecycle | Detailed analysis queued |
| P0 | [`packages/nodes-base/`](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/nodes-base) | Built-in node operations and versions | Detailed analysis queued |
| P1 | [`packages/frontend/`](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/frontend) | Editor serialization and UX | Queued |

## Tier A - Official documentation

| Source | Why it matters |
|---|---|
| [Export/import](https://docs.n8n.io/build/manage-workflows/export-and-import.md) | Workflow JSON, CLI/API migration and sensitive exported data |
| [Break into sub-workflows](https://docs.n8n.io/build/flow-logic/break-workflows-into-smaller-parts.md) | Modular design and input contracts |
| [Error handling](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully.md) | Error workflow, Error Trigger and failure payloads |
| [Item linking](https://docs.n8n.io/data/data-mapping/data-item-linking/item-linking-node-building/) | Provenance of output items and downstream expression safety |
| [Queue mode](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode.md) | Redis/workers, binary storage, encryption keys and operational constraints |
| [Source-control environments](https://docs.n8n.io/administer/use-source-control-and-environments/tutorial-create-environments-with-source-control.md) | Commercial feature access, push/pull vs publish, protected instances |
| [Security audit](https://docs.n8n.io/hosting/securing/security-audit/) | Risk inventory and audit categories |
| [Official docs index](https://docs.n8n.io/llms.txt) | Discover canonical documentation paths |
| [n8n licensing](https://docs.n8n.io/sustainable-use-license/) | Commercial packaging and managed-service model: requires legal review |

## Tier B - Reuse candidates and analytical instruments

| Source | Role | Caution |
|---|---|---|
| [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) | Node/property docs, templates, workflow edit/validation/test tools and instance integration | Maintainer-reported coverage; need compare with exact n8n target, concurrency and permissions |
| [morluto/rea](https://github.com/morluto/rea) | Reverse-engineer compiled JavaScript/Electron and runtime behavior | Research instrument only; not schema authority |
| [enescingoz/awesome-n8n-templates](https://github.com/enescingoz/awesome-n8n-templates) | Curated workflow examples | License, outdated nodes, duplicate patterns and secrets must be checked |
| [zengfr/n8n-workflow-all-templates](https://github.com/zengfr/n8n-workflow-all-templates) | Large candidate corpus | Size does not imply correctness or production robustness |
| [makafeli/n8n-workflow-builder](https://github.com/makafeli/n8n-workflow-builder) | Competitor/adjacent workflow generator approach | Audit architecture and test claims before reuse |

## High-value cross-source investigations

- Which JSON shape is accepted by editor import vs Public API workflow creation vs package import?
- Which node properties and type versions have changed between 2.46.x and 2.47.7?
- How are `onError`, retries, paired items and execution order implemented at runtime?
- How do native instance MCP and community n8n-MCP differ by tool, permission and minimum n8n version?
- Which workflow template patterns remain valid after migration and have reproducible tests?

See [open questions](../backlog/open-questions.md) and [methodology](methodology.md).

## November 2026: high-value additions

| Priority | Source | Verified role | Next action |
|---|---|---|---|
| P0 | [Official n8n Skills](https://github.com/n8n-io/skills) at commit `626f50fdf2934116eea2c5469339e03d2d524e83` | 14 capability skills plus meta-skill, 50+ references, MCP tool routing, test/publish practices | Read references, compare rules and pin install version |
| P0 | [Official Workflow SDK](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/workflow-sdk) | Typed workflow creation, code/JSON conversion and SDK validation | Benchmark against direct JSON generation on pinned staging |
| P0 | [SDK web-app guide](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/workflow-sdk/src/prompts/best-practices/guides/web-app.ts) | Webhook-served HTML app pattern and file-based template embedding | Test HTML security, CSP and browser functionality |
| P0 | [Execute Sub-workflow and Execution Data docs](https://docs.n8n.io/) | Reusable workflow boundaries and searchable execution metadata | Verify target edition/version and exact JSON |
| P1 | [cQnce Approval](https://github.com/cqnce-app/n8n-nodes-cqnce) | Third-party human approval callback/polling patterns | Audit callback/replay/tenant safety and install constraints |
| P1 | [Guardian](https://github.com/X-Guardian-X/n8n-nodes-guardian) | Third-party action policy, approval and atomic intent claims | Audit security and instance compatibility |
| P1 | [Verified Creators](https://n8n.io/creators/) | Examples of MCP wrappers, backup workflows and business patterns | Collect 20-30 examples with provenance and stage them |
| P1 | [Official node CLI](https://github.com/n8n-io/n8n/tree/master/packages/%40n8n/node-cli) | Scaffold custom nodes and credentials | Compare declarative vs programmatic node effort |

Details: [native primitives audit](n8n-native-primitives-and-community-2026-11.md), [creator ecosystem](creator-and-builder-ecosystem-2026-11.md), [approval standard](../standards/human-approval-and-policy-gates.md). These sources are not proof of any running system.


## Additional tooling candidates — 2026-11-15

The candidates below are [under evaluation](tooling-reuse-shortlist-2026-11-15.md), **not approved runtime dependencies**. The earlier fifth proposal is excluded.

| Priority | Repository | Source-confirmed capability | Validation before reuse |
|---|---|---|---|
| P0 | [EtienneLescot/n8n-as-code](https://github.com/EtienneLescot/n8n-as-code/tree/97b7e53c9ebad9dd516345b7d3664cb397987580) | n8nac CLI, editor/workspace integration, Git-like sync, environment promotion | Compare to official CLI, test drift and promotion against staging |
| P0 | [blucca/n8n-check](https://github.com/blucca/n8n-check/tree/61f6a2e50111f5a89b3131eba3ca5f2b548213d5) | Real-engine workflow regression harness, fixture assertions, CI JSON/JUnit | Pin test n8n image, run positive/negative mock cases safely |
| P0 | [Official @n8n/cli](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/cli) | Public API operations, inspections and optional edition-dependent promotion | Read-only tests, version/permission capability table |
| P1 | [yigitkonur/n8n-schema-generator](https://github.com/yigitkonur/n8n-schema-generator/tree/10374df02d96fdb206e1e950c6d566cf90af372f) | Node and credential schema extraction, static validation API | Match n8n instance version and enumerate skipped node classes |

See [the experimental integration plan](../roadmap/tooling-integration-pilots.md). Do not mistake a documented tool for a verified deployment.

**Implementation/source audit:** [2026-11-15 source assessment](tooling-source-audit-2026-11-15.md) inspected the Docker action, runner, CLI source, and schema extractor/server. Critical findings: n8n-check defaults to engine 2.41.7; schema snapshot is n8n 1.120.10 with silent extractor skips and a permissive HTTP server; n8nac can live-publish existing workflows. Source inspection is not runtime acceptance.

**First runtime proof:** [n8n-check 2.47.7 positive/negative CI report](pilots/n8n-check-verified-run-2026-11-15.md), [run 43649002040](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040). Both examples executed successfully in n8n; the incorrect-output mutation failed 2 JUnit checks while the healthy control passed all 5. This is narrow test evidence, not a general certification.

**SDK version drift note:** n8n 2.47.7 source at pinned commit bundles `@n8n/workflow-sdk` version **0.40.2**; [Subworkflow's unofficial SDK guide](https://github.com/Subworkflow-AI/unofficial-n8n-workflow-sdk-docs) documents version **0.27.2**. Use the guide as version-specific research and retest APIs against pinned upstream, not as current authority.

## Adaptive agents and BoxLite Hermes Gateway — 2026-11-15

| Priority | Source | Verified research use | Limitation |
|---|---|---|---|
| P0 | [BoxLite Hermes Cloud example](https://github.com/boxlite-ai/documentation/blob/main/cloud/agent-in-box/hermes.mdx) | Digest-pinned Hermes image, Gateway on 8642, authenticated `/health` and `/v1/chat/completions`, model secret vs caller token, optional request-triggered wake | Official docs were read; no Box was provisioned or called |
| P0 | [BoxLite agent-in-box overview](https://github.com/boxlite-ai/documentation/blob/main/cloud/agent-in-box/index.mdx) | Host-scoped model secrets, isolate agent filesystem and network, supported agent examples | Secret substitution host restrictions are not equivalent to complete egress policy |
| P0 | [BoxLite lifecycle](https://github.com/boxlite-ai/documentation/blob/main/cloud/box-lifecycle.mdx) | Default auto-stop, wake on request, stopped-box resume behavior | Idle-stop can terminate an unattended run; per-request task reliability needs separate design |
| P1 | [Video: AI Agent Best Practices for Production (n8n)](https://www.youtube.com/watch?v=RvOErUwZq1g) | Project-owner-supplied transcript describes six production safeguards: decomposition, output validation, bounds, permissions, traces and approvals | Training content is not evidence that shown controls are available on the pinned target version |

Engineering synthesis: [Hermes adaptive runtime](../architecture/adaptive-execution-hermes-boxlite.md), [production agent standard](../standards/agent-production-controls.md), [ADR-0006](../decisions/0006-hermes-adaptive-agent-runtime.md). All runtime and integration operations remain untested.

## Open WebUI and OIX · 24 November 2026

- The v0.13.4 backend mounts dedicated routers for apps, channels, models and Functions. [OWUI-OPS-001](https://github.com/open-webui/open-webui/blob/0666e59d26a4d056e0bacee41742486badd71cf8/backend/open_webui/main.py#L838-L857)
- The native Python Function loader recognizes Pipe, Filter, Action and Event classes. [OWUI-EXT-001](https://github.com/open-webui/open-webui/blob/0666e59d26a4d056e0bacee41742486badd71cf8/backend/open_webui/utils/plugin.py#L254-L304)
- Agent model discovery needs a terminal identity and a compatible terminal agent catalog. [OWUI-AGENTS-001](https://github.com/open-webui/open-webui/blob/0666e59d26a4d056e0bacee41742486badd71cf8/backend/open_webui/utils/agents/discovery.py#L36-L83)
- OIX authenticates channel interactions and binds the event client to the originating installation. [OIX-APP-001](https://github.com/open-webui/oix/blob/6134c423f553aa9886f2de6ad822f46fb51239e0/README.md)
