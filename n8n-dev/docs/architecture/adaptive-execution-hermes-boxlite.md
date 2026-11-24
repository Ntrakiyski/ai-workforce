# Adaptive execution: n8n orchestrator + Hermes in BoxLite

> **Status:** PROPOSED ARCHITECTURE, not deployed or integration-tested. This is **not** a revival of the reverted plan to host n8n development inside BoxLite. GitHub Actions remains our existing verified n8n CI environment.

## Decision

**n8n orchestrates and enforces policy. Trusted n8n workflows execute known business operations. Hermes inside BoxLite explores unfamiliar tasks, returning candidate artifacts and evidence for independent validation.**

A workflow exposed through MCP or webhook is not inherently trusted: it must have authenticated identity, tenant isolation, defined input/output contracts, tested behavior, versioning, approved side effects and monitoring.

~~~mermaid
flowchart TD
  USER["Chat / MCP / API / Webhook"] --> ENTRY["n8n authenticated entry"]
  ENTRY --> POLICY["Resolve actor, tenant and policy"]
  POLICY --> ROUTE{"Proven deterministic capability?"}
  ROUTE -->|Yes| NATIVE["Versioned n8n subworkflow"]
  ROUTE -->|No| TASK["Create scoped agent task"]
  TASK --> GATEWAY["Authenticated Hermes Gateway / BoxLite"]
  subgraph BOX["BoxLite isolated microVM"]
    GATEWAY --> HERMES["Hermes runtime + skills"]
    HERMES <--> TOOLS["Sandbox filesystem, shell, approved network"]
  end
  HERMES --> RESULT["Draft artifacts + supporting evidence"]
  RESULT --> CHECK["n8n independent result validation"]
  NATIVE --> CHECK
  CHECK -->|Passed| DONE["Response + approved business action + run record"]
  CHECK -->|Failed| ESC["Retry within limits or human escalation"]
  DONE --> LIB["Review for future reusable workflow"]
~~~

The diagram is the intended system, not evidence of a deployed environment.

## Verified vendor mechanism

The [official BoxLite Hermes Cloud guide](https://github.com/boxlite-ai/documentation/blob/main/cloud/agent-in-box/hermes.mdx) describes a digest-pinned Hermes image with its runtime, tools and Gateway. Its example:

- Starts Hermes via the saved startup command `gateway run` in a managed BoxLite Cloud microVM.
- Protects the model-provider key with a **host-scoped BoxLite Secret**, separate from the **Hermes Gateway caller token**.
- Opens a registered HTTPS tunnel to Hermes Gateway port **8642**; calls authenticated `GET /health` and `POST /v1/chat/completions` with `model: "hermes-agent"` and `stream: false`.
- Supports optional idle-stop and wake-on-request. An initializing Box may return **503 BOX_STARTING** with `Retry-After`; a timeout does not prove the task failed.
- Preserves files across stop/start when the Box remains provisioned. Persistent storage can still incur charges.

**Important:** The BoxLite management API (create/start/stop/delete boxes) and the Hermes Gateway API (execute agent tasks) are **two different surfaces with different keys**. Prefer a narrow, task-only Hermes credential in n8n. Keep account-wide BoxLite provisioning privileges in a restricted control workflow or broker, not in arbitrary agent tools.

The native Hermes Gateway consumes conversational messages. A framework-specific typed task envelope is **our proposed adapter contract**, not a native BoxLite API request. Hermes replies are model output: never treat self-reported success as validated completion.

## Three profiles, one worker interface

Start with **one pinned, known-good Hermes image** and distinguish work using three profiles. Later create immutable specialized images if the benchmark shows value. Do not keep three Boxes running unnecessarily.

| Profile | Tasks | Preapproved tools | Default boundaries |
|---|---|---|---|
| **Research & Discovery** | Investigate APIs, documentation and open-source tools | Browser/HTTP clients, Git, parsers | Read-only, allowlisted hosts, no business writes |
| **Engineering & Integration** | Experiment with SDKs, create/test code and n8n JSON | Node.js/Python, official n8n Skills and SDK, test runners | Isolated workspace, synthetic data; no production instance credentials |
| **Data & Documents** | Extract, transform and validate reports/files | PDF/CSV libraries, DuckDB/Polars, Python | Scoped artifacts only; no unrestricted tenant data |

The agent's system prompt does **not** enforce a capability boundary. Use actual filesystem permissions, network restrictions, scoped tokens, resource quotas and a tool broker.

## Proposed agent-task contract (not Hermes/BoxLite native)

~~~json
{
  "task_id": "task_demo_001",
  "system_id": "invoice-system",
  "tenant_id": "trusted-tenant-A",
  "profile": "data",
  "objective": "Extract invoice lines into validated JSON",
  "input_refs": ["artifact://input/sample-invoice.pdf"],
  "allowed_capabilities": ["read_scoped_artifact", "execute_local_code"],
  "limits": {"max_iterations": 8, "wall_time_seconds": 300, "max_cost_usd": 0.50},
  "side_effect_policy": "no_external_writes",
  "acceptance": {"schema_ref": "invoice-lines-v1", "checks": ["amounts_reconcile"]},
  "output_ref_prefix": "artifact://output/task_demo_001/"
}
~~~

Identity and tenant scope come from trusted n8n mapping, **not user-supplied task text**. Tool, time, budget, network and file permissions must be enforced by n8n and/or the sandbox broker—not merely requested in a prompt.

## Proposed execution lifecycle

1. **Authenticate & classify:** n8n verifies requester, tenant and permitted operation. Prefer an existing tested workflow when one exists.
2. **Specify:** n8n builds the task envelope, allowed tools, data references, acceptance tests, idempotency key and budgets.
3. **Route:** select or create a Box from a versioned profile; record Box ID and task ID against the trusted run.
4. **Invoke:** send the task to the authenticated Hermes Gateway and collect its response and artifact refs.
5. **Observe and recover:** on cold start, honor `503 BOX_STARTING` / `Retry-After`. Treat timeout as **unknown outcome** and inspect before a retry that could repeat side effects.
6. **Validate:** inspect artifact existence, contents, data ownership and acceptance checks independently of Hermes's text.
7. **Authorize:** money movement, account updates and other irreversible effects are performed by narrow n8n workflows only after policy and required human approval.
8. **Record and clean up:** persist run metadata and evidence outside disposable Boxes. Stop/delete Boxes and reconcile cleanup failures.
9. **Learn conservatively:** promote a successful method into a reusable n8n subworkflow only after independent reproduction, review, permissions analysis and versioned staging tests.

For long-running tasks, a durable asynchronous broker is safer than holding one HTTP request open; the vendor's basic Gateway example is synchronous and is **not** a reliable job queue by itself.

## First test to implement

One Engineering or Data profile with fake inputs, fixed artifact locations, bounded time, no client secrets, a deterministic acceptance test, a deliberately malformed-input negative case, and an explicit cleanup step. Verify gateway auth, actual tool execution, artifacts, failure handling and costs on a disposable Box. Only then test multiple profiles.

## References

- [BoxLite Hermes deployment guide](https://github.com/boxlite-ai/documentation/blob/main/cloud/agent-in-box/hermes.mdx)
- [BoxLite agent security and model secrets](https://github.com/boxlite-ai/documentation/blob/main/cloud/agent-in-box/index.mdx)
- [BoxLite idle stop and wake](https://github.com/boxlite-ai/documentation/blob/main/cloud/box-lifecycle.mdx)
- [BoxLite version-pinned image aliases](https://github.com/boxlite-ai/documentation/blob/main/cloud/image-aliases.mdx)
- [Production agent video supplied by project owner](https://www.youtube.com/watch?v=RvOErUwZq1g)
- [Production agent safeguards](../standards/agent-production-controls.md)
- [ADR-0006](../decisions/0006-hermes-adaptive-agent-runtime.md)
