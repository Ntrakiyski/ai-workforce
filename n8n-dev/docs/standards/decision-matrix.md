# Initial Do / Don't Decision Matrix

**Scope:** Proposed engineering defaults for agent-generated n8n systems. Detailed reasoning lives in the linked standards; no fixed node-count heuristics are declared.

| Topic | Prefer (DO) | Avoid (DON'T) | Verification |
|---|---|---|---|
| Workflow boundary | Split at clear input/output contracts, independent recovery or proven reuse | Split merely because a graph has many nodes | Architecture review, sub-workflow contract test |
| Custom code | Use Code for complex transformations with unit tests and paired-item behavior | Hide an entire business process in one unreviewable Code node | Code review and output fixtures |
| Continue on error | Continue only when failure is explicitly routed and recorded | Convert errors into silent success | Inject an item-level failure |
| Retry | Bound retries, backoff and dedupe repeated side effects | Blindly retry all errors or non-idempotent calls | Simulate timeouts and duplicate delivery |
| Input contract | Declare typed fields and defaults for reusable sub-workflows | Rely on undocumented caller payloads | Bad/missing field fixture |
| Versioning | Query installed node type/version and pin research revision | Guess typeVersion/operations from old templates | Staging version check |
| Graph mapping | Preserve item provenance and clear branch semantics | Assume output index/paired items always resolve | Multi-item expression fixture |
| Credentials | Reference least-privilege credentials, keep secrets out of exports | Paste tokens or credentials in JSON | Secret scan and permissions test |
| Staging | Sandbox downstream APIs and inject realistic faults | Use production webhook/services to 'test quickly' | Environment inspection |
| Production change | Compare versions, verify rollback, require policy approval | Allow simultaneous agent/UI writes or undocumented auto-publish | Concurrency and restore test |

See [architecture](architecture.md), [node design](node-design.md), [errors](error-handling.md), [security/release](security-and-release.md).
