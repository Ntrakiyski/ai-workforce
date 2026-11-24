# Next Agent Task: Derive the Exact n8n JSON API and Import Contract

**Task ID:** M1-001 | **Priority:** P0 | **Baseline:** n8n `2.47.7`, commit `d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063`.

## Objective

Produce a precise, evidence-backed comparison of workflow JSON accepted by each supported entry path, especially the **n8n editor import** and **Public API create/update** paths. Distinguish native structural checks from endpoint DTO validation and publish/runtime semantics.

## Required starting context

Read, in order:

1. [`AGENTS.md`](../../AGENTS.md)
2. [`n8n internals`](../research/n8n-2.47.7-internals.md)
3. [`workflow JSON contract`](../contracts/workflow-json.md)
4. [`research methodology`](../research/methodology.md)
5. [`evidence index`](../../research/evidence-index.json)

## Analysis steps

1. Check out or inspect the **exact tagged source commit**, not `master`.
2. Locate the request DTOs, controllers, services and import routines for workflow create/update, editor import, package import and publish/activation.
3. Document allowed and required root fields per entry point; note behavior of unknown fields.
4. Trace how node IDs, versions, parameters, credentials, settings, connections and metadata are normalized or rejected.
5. Extract representative **actual exported** workflow JSON from n8n test fixtures or a disposable instance; avoid invented node type names.
6. Build a fixture matrix: positive minimal, missing root, missing node ID, unknown node version, duplicate node name, dangling connection, unknown credential and publish without trigger.
7. Test fixture submissions in a matching isolated n8n environment if available. Record exact version, HTTP endpoint/CLI command, response code, output and source checksum. Do not claim testing if no instance is available.
8. Update `docs/contracts/workflow-json.md`, the evidence index, and add an ADR for any material design choice.

## Expected output files

- `docs/research/api-and-import-paths-2.47.7.md` (new; per-path contract with source citations).
- `docs/contracts/workflow-json.md` (updated; native vs stricter generator fields).
- `research/evidence-index.json` (new verified facts only).
- `tests/fixtures/` (when samples have provenance and no secrets).
- `docs/backlog/open-questions.md` (resolved and new unknowns).

## Acceptance criteria

- Every required field claim is tied to a source file/line or reproducible runtime observation.
- No unreviewed or fictional node type appears in a purported runnable example.
- No assumption that `IWorkflowBase` equals create API DTO.
- No statement of runtime success without a stored execution receipt.
- Document link checker passes.
- Endpoint and version-specific uncertainty remains explicit.

## Constraints

Do not edit a client's running workflows. Do not use live client credentials. Do not use 'latest' source without resolving its commit. Do not promote a merely structurally valid example to 'production ready'.
