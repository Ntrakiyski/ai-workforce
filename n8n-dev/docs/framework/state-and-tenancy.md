# Identity, Runs, State and Multi-Tenant Safety

> **Status:** PROPOSED_STANDARD. All storage layouts below are design recommendations, not built-in tenant isolation from n8n.

## The central promise and the central risk

One n8n workflow **can** serve many users and organizations. The workflow can branch or query state according to a tenant identity. However, a value like \`tenant_id\` in a payload is not proof of identity or authorization. Data isolation is not automatically enforced by putting a filter node in a workflow.

A shared workflow is acceptable only when:
- An authenticated source identifies the requester.
- The requester's allowed tenant(s), actions and resources are resolved from trusted records.
- Every business read/write is scoped to the verified tenant and checked independently where possible.
- Credential boundaries are explicit. A shared node may be bound to one credential; do not assume credentials dynamically switch per tenant.
- Cross-tenant tests are part of the release gate.

For strict regulatory, credential, blast-radius or contractual needs, use separated workflows, projects, instances, credentials, or databases. Document the trade-off.

## Standard request envelope

Every entry adapter should normalize its provider-specific payload into the following *conceptual framework contract*. This is not a native n8n object schema:

~~~json
{
  "request_id": "req_example",
  "correlation_id": "corr_example",
  "system_id": "customer-assistant",
  "interface": "telegram",
  "actor_id": "internal-principal-123",
  "tenant_id": "verified-tenant-abc",
  "session_id": "session-example",
  "operation": "ask",
  "payload": {"message": "What is my order status?"},
  "requested_at": "2026-11-14T00:00:00Z"
}
~~~

The entry adapter MUST populate \`actor_id\` and \`tenant_id\` from a validated channel/gateway identity and trusted authorization mapping. Never trust raw caller-supplied \`tenant_id\` or target table names.

## Standard business run record

Persist only data that the business actually needs. A proposed minimal table:

| Field | Purpose |
|---|---|
| \`run_id\` | Framework-owned stable identifier independent of n8n execution ID |
| \`n8n_execution_id\` | Operational correlation link when available |
| \`request_id\` | Idempotency key for incoming request |
| \`correlation_id\` | End-to-end trace across workflows and external agents |
| \`tenant_id\` | Trusted tenant partition key |
| \`actor_id\` | Authorized requester |
| \`system_id\` | Named system capability |
| \`system_version\` | Version of deployed system contract |
| \`status\` | Pending, running, succeeded, failed, compensated |
| \`input_ref\` / \`output_ref\` | Protected references rather than unbounded sensitive payloads |
| \`created_at\` / \`completed_at\` | Timing and audit history |

Maintain a unique idempotency constraint appropriate to the domain, for example \`(tenant_id, system_id, request_id)\`. Side-effect operations (payments, outbound messages, record writes) may require their own deduplication keys.

## Storage choice

| Storage | Good default use | Do not assume |
|---|---|---|
| n8n Data Tables | Small workflow-owned records, lookup data, markers, simple persistence | Unlimited scale, full relational constraints, or automatic isolation among customers |
| PostgreSQL | Durable business records, relational queries, transactions, enforceable row permissions | Tenancy security without a concrete database policy |
| Redis | Cache, transient sessions, queues, locks and time-bounded state | Durable system of record by default |
| Other providers (Airtable, CRM, object storage) | Data already owned by the client's existing system | Equivalent transactions, query guarantees, or compliance posture |

n8n queue mode itself uses Redis to coordinate execution workers. This does not by itself make Redis your application database.

## Shared-table versus separate-table strategy

**Default for compatible tenants:** use a shared schema with explicit \`tenant_id\`, database-level policies when available, narrow access grants and tenant-scoped queries.

**Separate storage when required:** use per-tenant database/schema/instance when confidentiality, customer-owned credentials, isolation or compliance demands it. Individual client tables can simplify some operations but are not a security boundary unless permissions also enforce separation.

In all cases, tests must prove that tenant A cannot read or modify tenant B's records even if it submits B's ID, session ID, or malformed input.

## Example lifecycle

~~~mermaid
sequenceDiagram
  participant U as User/Chat
  participant G as Trusted gateway
  participant N as n8n shared workflow
  participant D as Tenant-aware storage
  participant A as External agent
  U->>G: Message + provider identity
  G->>G: Authenticate and resolve tenant
  G->>N: Normalized request envelope
  N->>D: Read tenant-scoped context
  D-->>N: Authorized context
  N->>A: Scoped task + correlation ID
  A-->>N: Tool result
  N->>D: Persist run status + result reference
  N-->>G: Contracted response
  G-->>U: Reply
~~~

## Mandatory negative tests

- Spoofed \`tenant_id\` in HTTP or chat message must not override verified tenancy.
- A guessed other-tenant \`session_id\` cannot expose conversation history.
- Tenant A cannot select tenant B's database connection or integration credential.
- A repeated message cannot repeat an irreversible side effect.
- Missing identity mapping must fail closed rather than route to a default tenant.
- Sensitive data must not leak into logs, exported workflow JSON, prompts or staging copies.
- Version changes must not invalidate isolation guarantees or stored state without migration.

## Sources

- [n8n Data Tables](https://docs.n8n.io/data/data-tables/)
- [Queue mode and Redis workers](https://docs.n8n.io/hosting/scaling/queue-mode/)
- [n8n security auditing](https://docs.n8n.io/hosting/securing/security-audit/)
