# Workflow JSON Contract - Research Baseline

**Status:** Partial, source-verified structural contract only. This is **not** an import specification for every n8n entry point. Target source: n8n `2.47.7`, commit `d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063`.

## Multiple contracts, not one universal schema

Do not conflate:

1. **Graph structural payload:** `nodes` and `connections` shape required by `safeParseWorkflowStructure`.
2. **Persisted/internal workflow model:** `IWorkflowBase` with workflow identity, lifecycle, active/archive state, settings and version metadata.
3. **Editor export/import:** export may include settings, tags and credential references; actual import rules must be captured from the exact version.
4. **Public API create/update:** endpoint DTOs may differ from internal and exported formats; inspect before generating requests.
5. **n8n packages/source-control:** may include related projects, resources and version-specific semantics.

Only contract (1) is initially verified at the source level. The rest are pending endpoint and runtime tests. [Source](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/workflow-structure-validation.ts).

## Native structural validator: fields

| Scope | Field | Native structure validation | Stronger generator convention (proposal) |
|---|---|---|---|
| Root | `nodes` | Required array | Required array with at least one meaningful node for a deployable workflow |
| Root | `connections` | Required mapping | Required mapping with graph connectivity rules |
| Node | `name` | Required nonempty string, globally unique | Stable human-readable names reflecting business responsibility |
| Node | `type` | Required nonempty string | Must resolve to a node installed in target environment |
| Node | `position` | Required numeric tuple length 2 | Place nodes for legible visual layout |
| Node | `id` | Optional string; supplied nonempty values unique | Generate unique stable identifiers |
| Node | `typeVersion` | Optional numeric | Supply a supported target-compatible version |
| Node | `parameters` | Optional object | Supply a complete operation-specific parameter object |
| Node | `credentials` | Not checked structurally | Reference existing authorized credentials; never embed secrets |
| Node | `onError`/retry flags | Not checked structurally | Specify based on failure policy and test expected behavior |
| Connection | source name | Source must exist | Source output type and slot must exist in node definition |
| Connection | destination `node` | Must exist | Destination input type/slot must exist |
| Connection | destination `type` | Nonempty string | Must match target node's accepted connection type |
| Connection | destination `index` | Integer 0-1000 | Must map to actual destination input |
| Connection | output bucket | Array of entries, nullable for unused output | Preserve meaningful graph routing |

### A structural illustration, not an importable workflow

```json
{
  "nodes": [
    {"name":"Fetch","type":"example.fetch","position":[100,200]},
    {"name":"Normalize","type":"example.normalize","position":[350,200]}
  ],
  "connections": {
    "Fetch": {"main":[[{"node":"Normalize","type":"main","index":0}]]}
  }
}
```

Both example node types are **fictional**; this JSON is intentionally not runnable/import ready. It illustrates source-node-keyed graph serialization only.

## Important structural source notes

The native validator's source says its purpose is the minimum editor/runtime structural assumption, distinct from publication checks; it does not resolve node type availability, parameters, credentials or readiness. The native source tolerates omitted `id`, `parameters` and `typeVersion`, even though `INode` requires them in its TypeScript interface. Do not assume that omission is accepted through every import/API path.

Source: [workflow-structure-validation.ts](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/workflow-structure-validation.ts), [interfaces.ts](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/workflow/src/interfaces.ts).

## Multi-gate validation contract (proposed)

| Gate | Must establish | Can it prove the workflow will run? |
|---|---|---|
| G0 JSON | Parses as JSON; no duplicate/ambiguous keys after canonicalization | No |
| G1 Structure | Node name/id uniqueness, connection bounds and existing targets | No |
| G2 Node catalog | Installed node types, supported node versions, legal parameters, valid operation choices | No |
| G3 Semantics | Triggers/sub-workflow entry, data references, expressions, required credentials, error routing | No |
| G4 Security/policy | No exposed secrets; permitted side effects, network destinations and risky nodes | No |
| G5 Runtime | Import success and scenario execution on version-matched staging | Only for tested cases |
| G6 Release | Review/authorization, rollback artifact and environment compatibility | Release readiness, not guarantee |

**Required behavior:** Fail closed when an unknown/unavailable node is requested; do not invent a `typeVersion` or a required property to satisfy a prompt.

## Generator metadata (proposal, external manifest)

Maintain separate metadata rather than injecting arbitrary keys into the n8n workflow JSON:

```json
{
  "target_n8n_version": "2.47.7",
  "source_commit": "d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063",
  "workflow_files": ["workflow.json"],
  "credential_bindings": {},
  "dependencies": [],
  "validation_gates": {},
  "staging_execution_evidence": [],
  "release_approval": "pending"
}
```

This is the system's **proposed manifest shape**, not an official n8n API object.

## Next fixture experiments

- UI export of a Manual Trigger + basic transformation.
- API create with the same graph and progressively omitted fields.
- Editor import with null output slots and multi-input Merge.
- Sub-workflow call and corresponding trigger with explicit input fields.
- Disabled trigger vs webhook trigger; verify publish/activation response.
- Credential mapping differences between staging and production.
- Versioned node operation and deprecated-version failure.
