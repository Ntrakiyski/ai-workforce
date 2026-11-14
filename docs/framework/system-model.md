# The System Model: n8n as Executable Behavior

> **Category:** PROPOSED_STANDARD. The n8n node graph and JSON format are real; the "system model" defined below is our framework's abstraction and is not an official n8n feature.

## The analogy

A conventional language expresses executable behavior in text. Our n8n-native approach expresses most behavior in a **versioned directed graph of nodes and connections**. n8n's editor makes this behavior visible, while its JSON files make it portable and inspectable.

| Our conceptual primitive | n8n-first realization | Caution |
|---|---|---|
| Program/system | A family of workflows plus configuration and state | One JSON does not equal a deployed application |
| Entry point | Trigger, webhook, schedule, chat, MCP tool | Authentication and publishing are separate concerns |
| Instruction | Node operation and its parameters | Exact operation depends on node type/version |
| Sequence/branch | Connections, IF/Switch/Loop patterns | Pay attention to item semantics and branch behavior |
| Function/capability | Reusable sub-workflow with contract | Don't split by arbitrary node counts |
| Input/output | Item data plus explicit contract | Test item-linking and result shapes |
| State | Table/database/cache selected by durability needs | Execution logs are not business state |
| Library | Approved workflow pattern or integration skill | Templates are examples, not source of truth |
| Exception handling | Node error modes, retry policies, error workflow | A continued error is still a business decision |
| Runtime | n8n deployment + relevant workers and services | Queue mode introduces Redis and worker behavior |
| Interface | Chat, HTTP webhook, MCP, optional HTML response | n8n HTML output is not a complete frontend stack |

## System specification (conceptual; not n8n-importable JSON)

A system specification should exist *before* agents generate individual workflow JSON files. This example is a human-readable framework contract, **not** an actual n8n export or deployable manifest:

~~~yaml
system_id: client-operations-assistant
system_version: 0.1.0
entry_points:
  - channel: telegram
    operation: ask
  - channel: http
    operation: ask
actors:
  identity_source: verified-channel-or-gateway
  tenant_rule: derive-from-authorized-identity
capabilities:
  - answer_question
  - read_customer_records
  - request_external_agent
state:
  primary_store: postgres
  ephemeral_store: redis
  required_keys:
    - tenant_id
    - system_id
    - correlation_id
outputs:
  - channel_reply
  - run_audit_record
quality:
  require_staging_tests: true
  require_cross_tenant_isolation_tests: true
  require_reviewer_approval: true
~~~

Later, a deterministic schema validator should verify this specification before any workflow is built.

## System composition

~~~mermaid
flowchart TD
  REQUIREMENT["Outcome, actors, constraints"] --> SPEC["System specification"]
  SPEC --> ENTRY["Entry workflows"]
  SPEC --> CORE["Reusable core workflows"]
  SPEC --> DATA["State contracts"]
  SPEC --> CAP["Capability inventory"]
  ENTRY --> CORE
  CORE --> CAP
  CORE --> DATA
  CORE --> OUT["Contracted result and side effects"]
  CORE --> TRACE["Correlated execution trace"]
  SPEC --> QA["Quality gates and release policy"]
  QA --> OUT
~~~

## Rules for choosing boundaries

1. Prefer one named system capability per reusable sub-workflow when it has a stable purpose and input/output contract.
2. Separate interfaces from business behavior when the same capability is invoked through several channels.
3. Avoid tying the reusable system's input contract to one chat provider's raw webhook payload.
4. Treat external calls as capabilities with timeouts, retry semantics, authorization and side effects.
5. Never use an execution ID as the sole long-term business record.
6. Reuse proven native nodes first, but allow a tested code node or external service when it reduces total complexity.
7. Assign explicit system and workflow versions. A workflow's n8n import success does not prove the system works.

## First reference system to build

**A multi-interface assistant**: a Telegram message or HTTP request invokes the same core n8n capability, retrieves tenant-authorized data, optionally calls an external agent, writes a business run record, and sends an answer to the original channel.

Test at least two synthetic tenants. Verify positive retrieval, denied cross-tenant access, duplicate inputs, external timeout, retry safety, staging behavior, and returned contract. This is a planned example, not an implemented proof of concept.

## Acceptance definition

A system is complete only when its manifest and diagram agree with deployed workflows, credentials and storage are configured safely, all supported interface paths are tested, and a release record references successful staging evidence and a rollback artifact.
