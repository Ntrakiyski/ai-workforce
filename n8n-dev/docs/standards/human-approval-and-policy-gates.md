# Human approval and action policy gates

> **Status:** PROPOSED_STANDARD, not a completed implementation. Derived from native send-and-wait capabilities, documentation and third-party governance patterns. Validate against an isolated n8n instance and production security policy.

## Why approval buttons are not enough

A send-and-wait step provides a human input. A production authorization control must also answer:
- **Who** is allowed to approve for this tenant and action?
- **What exactly** did they approve? The complete proposed payload or only a textual summary?
- **When** is the approval valid and when does it expire?
- **How** do we prevent a changed payload, forged callback, or replay from authorizing a different action?
- **How** will the action run only once, even after retries or delayed callbacks?
- **Where** is the immutable or tamper-evident decision record stored?

Do not allow an AI model or workflow author's own unverified "approved" field to authorize irreversible side effects.

## Conceptual reusable capability contract

~~~json
{
  "capability": "authorize-action",
  "input": {
    "tenant_id": "verified-acme",
    "actor_id": "trusted-principal",
    "action_type": "send-customer-email",
    "payload_hash": "hash-of-canonical-intended-action",
    "risk_tier": "medium",
    "expires_at": "2026-11-15T12:00:00Z",
    "request_id": "unique-key"
  },
  "output": {
    "verdict": "ALLOW | DENY | REQUIRE_APPROVAL | EXPIRED",
    "authorized_action_ref": "approved-intent-id",
    "decision_audit_ref": "audit-event-id"
  }
}
~~~

**Illustrative framework contract only; not native n8n node JSON.** The policy service, approver registry, signature validation and execution claim semantics must be implemented or delegated to a verified provider.

## Reference sequence

~~~mermaid
sequenceDiagram
  participant A as Agent
  participant G as Policy gate
  participant H as Human approver
  participant N as n8n action workflow
  participant L as Audit store
  A->>G: Propose typed action + tenant + payload hash
  G->>L: Append policy result
  alt Denied
    G-->>A: DENY
  else Allowed
    G->>N: Authorized intent
  else Needs approval
    G->>H: Approval request with exact intended action
    H-->>G: Approve / reject / timeout
    G->>L: Append decision + approver identity
    opt Approved and unexpired
      G->>N: Approved intent
    end
  end
  N->>G: Verify intent + claim once
  G-->>N: Claim accepted / denied
  N->>L: Record actual action result
~~~

## Engineering rules

1. **Policy before side effect.** Low-risk actions can auto-allow; high-impact actions require an explicit gate or denial.
2. **Human identity, not button identity.** Validate the approver and tenant association. Public reply links, chat IDs and messages are not automatically sufficient for financial or sensitive permissions.
3. **Bind authorization to payload.** Include the exact intended action and a stable hash or equivalent immutable intent reference. Recheck before execution.
4. **Expire and fail closed.** Missing, expired, denied, cancelled or unverifiable approval must not execute the action.
5. **Idempotent, atomic commit.** The action execution needs a single-use claim/idempotency key and compensation planning for partial failures.
6. **Keep independent audit records.** Execution metadata is searchable but may be pruned and is not an audit-grade ledger.
7. **Use approved external services when warranted.** n8n native Chat/Wait can cover simple cases; provider integrations add identity/routing/audit features but need independent reviews.
8. **Never leak resume URLs.** A per-execution signed resume URL is an authorization-bearing capability, so redact from logs, prompts, traces and shared workflow JSON.
9. **Separate approval and deployment.** Approving an agent's business action is not the same as authorizing a workflow to be promoted to production.
10. **Credential/edition check.** Supported human-review action nodes and verified community packages vary by instance version, installation and account.

## Candidate implementations to benchmark

| Choice | Suited for | Limitations to test |
|---|---|---|
| Native Chat / Telegram / Gmail send-and-wait | Routine low-risk human approvals | Approver identity, expiration, auditable authorization, resume URL handling |
| Wait + webhook | Custom external review portals | Signature validation, reply semantics, expiry, replay protection, durable audit |
| [cQnce Approval](https://github.com/cqnce-app/n8n-nodes-cqnce) | External human approvers, structured routing/quorum and device authorization | Vendor costs, availability, callback vs polling, tenant model, credential handling |
| [Guardian](https://github.com/X-Guardian-X/n8n-nodes-guardian) | Deterministic policy gate and once-only execution claim | Policy precedence, external dependency failure, API signing, target installation support |

## Staging scenarios

- Approve and execute exactly once.
- Deny, expire or cancel; no action executes.
- Approval callback arrives twice, late, out of order, or with a different action hash.
- Human approves tenant B's action without authorization; must reject.
- Approval is revoked, or action payload changes, before execution claim.
- Network timeout between claim and side effect.
- Audit service unavailable: enforce defined fail-closed behavior.
- Model falsely asserts approval in a tool response; hard gate ignores it.

## References

- [Official Gmail send-and-wait operation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/)
- [n8n Chat human-in-the-loop](https://github.com/n8n-io/n8n-docs/blob/main/docs/changelog/README.md)
- [cQnce package source](https://github.com/cqnce-app/n8n-nodes-cqnce)
- [Guardian package source](https://github.com/X-Guardian-X/n8n-nodes-guardian)
- [Community discussion of authorization vs waiting](https://community.n8n.io/t/how-do-you-handle-human-approvals-for-ai-agent-workflows-in-n8n/311957)

These cited vendors and community members make implementation/security claims; the repository has **not independently tested** those claims.
