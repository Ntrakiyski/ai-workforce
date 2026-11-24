# Production controls for n8n-orchestrated AI agents

> **Status:** PROPOSED STANDARD. Six control families derived from the project owner's supplied transcript of [AI Agent Best Practices for Production (n8n)](https://www.youtube.com/watch?v=RvOErUwZq1g), plus our security and release model. The video demonstrates a particular UI and setup; **do not assume all pictured agent settings exist in our pinned n8n 2.47.7 instance or in Hermes Gateway**. Implement and test the guarantees independently.

## Guiding principle

**Agent decides; trusted workflows enforce what work may be performed.** This is stronger than treating tools as mere freeform agent functions.

The n8n workflow holds verified identity and policy; the agent receives only appropriate context and can propose an operation. High-impact writes are implemented as narrow workflows that verify authorization and side effects using code or data policies outside the model.

## Six required production controls

| # | Lesson from supplied video transcript | Required framework implementation | Validation evidence |
|---|---|---|---|
| 1 | **Split the agent into small parts.** Keep changing facts out of long prompts; wrap actions as reusable workflows. | System contracts, versioned sub-workflows, scoped knowledge retrieval, minimal agent roles | Test capability independently and verify references to updated policies |
| 2 | **Require predictable outputs.** The video uses structured JSON and validates response fields after agent execution. | Typed input/output JSON Schema at our adapter; reject malformed or incomplete outputs; route failures to an explicit handler | Malformed JSON, missing required field, wrong type, unexpected action test |
| 3 | **Cap loops and spend.** Set iteration, parallelism, wall time and cost budgets with fallback. | n8n/broker-enforced budgets and cancellation; do not rely exclusively on a prompt or unverified UI setting | Forced endless/tool-loop case stops, records reason and incurs bounded charges |
| 4 | **Limit agent data access and side effects.** Tenant-specific queries and refunds should be controlled by workflows, not generated freeform by the model. | Authenticate caller, derive tenant from trusted mapping, scope reads, enforce authorization for every write, reject arbitrary SQL | Cross-tenant attempt and prompt-injection test fail closed |
| 5 | **Trace and alert.** Observe failed runs, tool calls, time, resource use, cost and stop reasons. | Correlation IDs spanning n8n and Hermes, run records, artifact hashes, errors, traces and alerting; redact secrets and sensitive content | Trace from request through Box ID, task ID, acceptance test, error and cleanup |
| 6 | **Require human review for risky actions.** The video pauses a high-value refund for approval. | Independent policy gate, verified approver identity, intended payload hash, TTL, anti-replay, atomic execution claim | Approve/deny/expire/replay/altered-payload/duplicate-call negative cases |

The **video is a training reference**, not a certification or proof that the shown workflows are secure. Its claims about exact agent settings, billing controls and user interfaces must be checked against the target product version.

## Boundary between agent and action

~~~mermaid
flowchart TD
  USER["Authenticated user + verified tenant"] --> N8N["n8n control plane"]
  N8N --> REASON["Hermes in isolated Box: reasoning, experimentation"]
  REASON --> INTENT["Structured proposed action + evidence"]
  INTENT --> VALIDATE["n8n validates schema, identity and tenant permissions"]
  VALIDATE --> RISK{"Risk threshold?"}
  RISK -->|Normal| ACTION["Versioned approved capability"]
  RISK -->|High| REVIEW["Human approval bound to exact action"]
  REVIEW -->|Approved and valid| ACTION
  REVIEW -->|Denied / expired| STOP["No side effect"]
  ACTION --> AUDIT["Audit outcome + correlation ID"]
~~~

**A Hermes terminal tool has real authority inside the Box.** Enforce Box resource quotas, egress allowlists, filesystem scoping, no privileged credentials, and task-broker restrictions outside model instructions. Do not allow Hermès's success claim to independently authorize a database write, refund, workflow publication or customer-data export.

## Required minimum agent-task controls

- **Contract:** task ID, system/version, trusted tenant/actor, objective, scoped artifact refs, allowed operations, acceptance test refs, deduplication key.
- **Budget:** max iterations, max elapsed time, max cost/token allowance, max concurrent tasks, cancellation/escalation policy.
- **Authority:** no production mutation by default, per-operation authorization, scoped network and ephemeral tool credentials.
- **Results:** typed status and artifact refs, independently validated business output, evidence and sanitized logs.
- **Operations:** retries on known recoverable errors, do-not-repeat on unknown timeout outcomes, guaranteed cleanup reconciliation.
- **Observability:** who requested, what profile/image/skills/model versions ran, which tools executed, why it stopped, what was reviewed, how much was spent.

For human authorization follow [approval and policy gates](human-approval-and-policy-gates.md). For the architectural integration see [Hermes on BoxLite adaptive execution](../architecture/adaptive-execution-hermes-boxlite.md).

## First acceptance tests to add

1. Parse a synthetic success response with schema and independently verify its artifacts.
2. Supply malformed/extra JSON and prove the business write does not run.
3. Force an agent into repeated tool use and prove the wall-time/iteration budget stops it.
4. Attempt an unauthorized tenant data query; verify the broker and workflow deny it regardless of agent output.
5. Simulate duplicate callbacks / 503 wake / unknown-timeout; prove no duplicate side effect.
6. Reject/expire an approval and verify the underlying action is never committed.
7. Correlate each n8n run to its Box reference, Gateway request, accepted/failed checks and cleanup record.

**No tests above are marked completed by the existence of this document.**
