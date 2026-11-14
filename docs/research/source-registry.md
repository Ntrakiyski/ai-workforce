# Research Source Registry

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
