# Open Questions and Research Backlog

| ID | Priority | Research question | Required evidence | State |
|---|---|---|---|---|
| Q-001 | P0 | What differs between exported JSON, editor import JSON, Public API create/update DTOs and n8n packages? | Tagged endpoint/source inspection + staging requests | Open |
| Q-002 | P0 | Which fields are normalized on save (`id`, `typeVersion`, `parameters`, `settings`, credentials)? | Positive/negative fixtures, API response | Open |
| Q-003 | P0 | How can a generator query exact node types, versions, dynamic fields and credential dependencies? | Catalog and target staging query | Open |
| Q-004 | P0 | What are the runtime results of each `onError` and retry configuration? | Fault-injection fixtures | Open |
| Q-005 | P0 | What is the safe edit-lock/version-compare process when MCP/Public API lacks conditional writes? | Concurrent-edit experiment + mitigation | Open |
| Q-006 | P0 | How to promote saved vs published versions across environments and editions? | Official docs + staging deployment | Open |
| Q-007 | P0 | How should error-workflow output differ for trigger-time vs execution-time failures? | Official docs + staged failure | Open |
| Q-008 | P1 | When is a sub-workflow boundary justified by isolation, contracts, reuse or memory? | Measured scenarios + design review | Open |
| Q-009 | P1 | How do Code and AI sub-nodes preserve `pairedItem` with many input items? | Runtime fixtures | Open |
| Q-010 | P1 | What side-effect retry policy works for non-idempotent APIs? | Mock service with duplicate detection | Open |
| Q-011 | P1 | What licenses apply to templates, n8n-MCP DB, n8n source, and managed-client product models? | License text and legal assessment | Open |
| Q-012 | P1 | What execution data redaction/retention guarantees apply across queue workers and logs? | Docs + config/runtime test | Open |
| Q-013 | P2 | What template selection metrics predict production quality rather than just popularity? | Curated corpus and scoring experiment | Open |
| Q-014 | P2 | Which REA probes actually add knowledge beyond source code for the editor? | Small proof-of-concept | Open |

## November 2026 research additions

| ID | Priority | Research question | Required evidence | State |
|---|---|---|---|---|
| Q-015 | P0 | Is SDK-first construction more reliable than direct JSON generation on the target n8n release? | Identical specifications, valid graph comparisons, staging results | Open |
| Q-016 | P0 | Which official n8n skills and MCP tools work on each instance version/edition? | Pinned skills, MCP list, reproducible tool calls | Open |
| Q-017 | P0 | What are the exact callback, identity and replay semantics of native human review? | Signed/resume runtime tests, malicious and expired cases | Open |
| Q-018 | P0 | How do we safely map approval to immutable action payload and once-only side effect? | Concurrent/stale/replayed decision tests | Open |
| Q-019 | P1 | When does Execution Data remain searchable and how do retention and limits vary by method/edition? | Official docs + API and pruning tests | Open |
| Q-020 | P1 | Does a multi-trigger workflow preserve independent entry security and predictable branch semantics? | Webhook/chat/schedule staged tests | Open |
| Q-021 | P1 | Which verified community nodes are safe and compatible in our deployment profiles? | Dependency/security/license/ops audit | Open |
| Q-022 | P1 | Which creator templates provide high-reliability reusable patterns rather than marketing demos? | Licensed JSON corpus and staging tests | Open |
