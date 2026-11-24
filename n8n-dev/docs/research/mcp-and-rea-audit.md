# MCP and REA: Build vs Reuse Assessment

**Status:** Preliminary source/README review, not functional deployment verification.

## Native n8n instance-level MCP

Consult current n8n docs and the target instance. Its tool set and permissions are version/feature dependent. Use native instance capabilities when they cover the operation with sufficient permissions and audit controls; do not assume a third-party MCP is required.

## Community n8n-MCP

Repo: https://github.com/czlonkowski/n8n-mcp

As of the checked README, the maintainer claims node discovery, validation, workflow tests, updates, execution debugging, snapshots, multi-instance support and a catalog of 3,501 nodes/2,352 templates. These are **SECONDARY_CLAIM** until the corresponding operations have been exercised on our selected `2.47.7` staging target. The README itself advertises node-data coverage for `2.46.7`, so version alignment is a specific concern.

### Valuable capabilities to audit

- `validate_node`, `validate_workflow`, `n8n_validate_workflow`: determine exact error classes and whether false negatives occur.
- `n8n_update_partial_workflow`: determine data-loss and race conditions; isolate from production.
- `n8n_executions` error mode: determine event and error-data coverage.
- `n8n_test_workflow`: test supported triggers; test claims about pinned data separately.
- `n8n_workflow_versions`: test snapshot creation and rollback guarantees rather than relying on backup presence.

### Documented cautions

The README warns about concurrent edits (API write may overwrite UI changes), snapshots that can fail without blocking updates, and editing live workflows. Our platform should implement independent change-locking, confirmed snapshot persistence and audit logs.

## REA

Repo: https://github.com/morluto/rea

REA advertises reverse engineering of native binaries, JavaScript/Electron apps and websites through an agent-accessible MCP. For open-source n8n, reserve REA for targeted experiments such as tracing compiled editor behavior or comparing behavior across builds. Source code and official API contracts should remain the primary basis for node and JSON schemas.

## Decision: hybrid discovery stack (PROPOSED_STANDARD)

1. Use a pinned n8n source checkout as the primary technical reference.
2. Use the official docs for supported user/API behavior and licensing/feature availability.
3. Use native n8n MCP or n8n-MCP to discover **target-instance capabilities** and operate on non-production workflows.
4. Use REA for specific unresolved runtime/editor analysis questions.
5. Make deterministic validators, not an LLM's output, the authority for structural and schema-related acceptance.
6. Require actual staging executions for runtime correctness.

## Required audit outputs

A tool matrix with name, server version, purpose, privilege scope, destructive capability, target-version support, confirmed tests, error semantics and rollback requirements. No credentials or endpoints are stored here.
