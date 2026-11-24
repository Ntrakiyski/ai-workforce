# Quality Gates and Acceptance Evidence

**State:** Specification only. No workflow fixtures were executed and no n8n integration tests are implemented in this repository.

## Gate matrix

| Gate | Nature | Evidence required | Fail examples |
|---|---|---|---|
| G0 JSON decoding | Deterministic | JSON parser output, checksum | Invalid JSON, duplicate properties if strict parser enabled |
| G1 Graph structure | Deterministic; match pinned source | Node/edge diagnostics and positive/negative tests | Missing nodes, duplicate names or IDs, invalid connection buckets |
| G2 Node catalog | Deterministic using target catalog | Node type/version and operation/property diagnostics | Unknown type, unsupported version, required field missing |
| G3 Semantic checks | Static plus targeted evaluation | Trigger/entry contract, expressions, credential binding, item mapping | Broken expression, missing workflow input or disabled-only triggers |
| G4 Security/policy | Deterministic and reviewer | Secret scan, node/endpoint allowlist, change permissions | Embedded token, unapproved risky node, unauthorized endpoint |
| G5 Staging behavior | Runtime only | n8n version, instance ID (redacted), import receipt, case inputs/outputs, execution IDs, timestamps | Failed import, incorrect side effect, duplicate mutation, retry loop |
| G6 Independent review | Human/agent review plus policy | Acceptance checklist, reviewer identity, approved/rejected evidence | Missing critical cases or inconsistent test results |
| G7 Release | Authorized promotion | Checksum, approval, target version, rollback artifact, smoke result | Unsaved snapshot, version mismatch, unpublished workflow |

## Minimum test matrix per workflow

- **Happy path:** valid typical data; correct results and side effects.
- **Empty/null:** missing required fields and empty item lists.
- **Malformed inputs:** wrong types, unexpected formats and invalid expressions.
- **Volume:** multiple items, partial batch failures, pagination and time/resource limits.
- **Transient failures:** 429, 503, network timeout, backoff, exhausted retry.
- **Permanent failures:** 400, 401, authorization and invalid credentials.
- **Duplicate delivery:** verify idempotency and deduplication.
- **Partial side effects:** correct compensation/escalation and status.
- **Observability:** redacted logs, error workflow, correlation IDs.
- **Recovery:** restart/replay/rollback and external state reconciliation.

## Test-result schema (proposed)

```json
{
  "case_id": "WF-ERR-001",
  "target_version": "2.47.7",
  "environment": "staging",
  "status": "not_run",
  "fixture": "tests/fixtures/fault-429.json",
  "expected": "bounded retry then success",
  "observed": null,
  "execution_id": null,
  "evidence_url": null
}
```

This is a **documentation example**, not a completed test report. Never convert `not_run` to `passed` without actual evidence.

## Independent review checklist

- The architecture matches explicit user requirements and approved side effects.
- Each node/operation is available on the target n8n version.
- No unknown `typeVersion` or made-up parameter exists.
- Every data mapping and `pairedItem`-sensitive path is checked.
- Failure routes preserve failed item identity and meaningful status.
- Retried side effects are safe or deduplicated.
- A real staging execution was observed and archived.
- Reviewer verified snapshots, conflicts, approval and rollback.

## Benchmark design

Create a held-out set of unseen workflows spanning simple integrations, sub-workflows, branching, AI tool calls, credential-gated APIs and high-risk side effects. Report exact import success, per-gate recall/precision, runtime pass rate, false-positive review rate and failed release count. Never report an unmeasured 'zero error' claim.
