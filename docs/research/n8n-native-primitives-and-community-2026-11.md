# n8n native primitives and community-node audit — 2026-11-14

**Research state:** Source/docs verified where indicated, **no live n8n execution performed**. Baseline source n8n 2.47.7 at commit d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063. Recheck installed instance, edition, enabled nodes and public MCP tool list before generating configuration.

## Why these screenshots matter

The user's n8n editor screenshots expose three architectural primitives that our system-building framework should incorporate instead of recreating ad hoc: (1) send-and-wait human review, (2) modular execution and searchable execution metadata, and (3) multiple entry triggers per workflow.

### Screenshot 1: Human review / send and wait for response

- The Human review picker lists native or installed channel options such as Chat, Discord, Gmail, Google Chat, Outlook, Teams, Send Email, Slack, Telegram and WhatsApp Business Cloud. It also shows a third-party **cQnce Approval** node with a verified marker.
- The [Chat node](https://github.com/n8n-io/n8n-docs/blob/main/docs/changelog/README.md) supports "Send a message and wait for response" for chat-based workflows, including inline buttons or free text; documented in n8n 2.5 changelog.
- The [Gmail node send-and-wait operation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/) can pause for approval. Official docs recommend the **Wait node** for more complex approval logic.
- A webhook-based resume can be useful when a human uses an external portal or chat integration. Do not confuse an incoming Webhook Trigger with a waiting execution's per-execution resume mechanism.
- The [cQnce n8n package](https://github.com/cqnce-app/n8n-nodes-cqnce) README documents a signed n8n resume URL, callback mode, outbound-only polling for private instances, approval and rejection branches and timeout/expiration semantics. It is vendor-maintained, not an n8n core node.

**Design implication:** create a reusable APPROVAL capability with human identity, intended action/payload hash, TTL, verdict, correlation ID, audit reference and one-time execution claim. Put the actual irreversible action *after* authorization, not before. Use native send-and-wait for low-risk convenience; evaluate specialized policy/approval providers when requirements include compliance, quorum, independent identity and tamper evidence. See [human authorization standard](../standards/human-approval-and-policy-gates.md).

### Screenshot 2: Execute Sub-workflow, Execution Data, FTP, Guardian

| Node | Verified purpose | What it should mean in our framework |
|---|---|---|
| **Execute Sub-workflow** | Run another workflow and optionally wait for completion. Documented inputs can be mapped from selected child workflow; mode all items vs each item. [Official source](https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow.md). | The equivalent of a reusable named capability with an explicit input/output contract, not an arbitrary node-count split. |
| **Execution Data** | Attach searchable key-value execution metadata; **not** a business database. [Official node doc](https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/core-nodes/n8n-nodes-base.executiondata.md) and [custom execution data doc](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/understand-workflows/understand-executions/customize-executions-data.md). | Attach short correlation and classification fields to run history; store durable client business state in Data Tables/PostgreSQL as needed. |
| **FTP** | File exchange over FTP/SFTP. | Use SFTP when supported; verify protocol, credentials, retry, file size, atomic rename and remote availability. Not a general-purpose persistence layer. |
| **Guardian** | A separately maintained, n8n-verified community integration for **policy decisions**: allow, deny or require approval before a sensitive action. [n8n integration](https://n8n.io/integrations/guardian/), [vendor source](https://github.com/X-Guardian-X/n8n-nodes-guardian). | Candidate for a risk-based enforcement gate, but independently verify policies, dependency trust, tenant separation, cost and failure behavior. |

**Execution Data caution:** Official docs give key and value limits that differ depending on the way data is set. The dedicated node docs list keys up to 50 characters and values up to 512; the Code-node custom data docs mention values up to 255 and max 10 items. Test against the target version and do not build a durable data model around these small metadata fields. Availability is edition/registration-dependent; consult current docs.

**Guardian caution:** n8n's integration gallery lists it as verified. The vendor README self-describes self-hosted requirements, which may conflict with more general n8n verified community-node support guidance. Treat deployment-plan support as **unverified for the target account** until tested. n8n verification is not a third-party service security audit.

### Screenshot 3: Add another trigger

The [official trigger-design documentation](https://github.com/n8n-io/n8n-docs/blob/main/docs/connect/create-nodes/plan-your-node/choose-a-node-type.md) explicitly states that a workflow can contain multiple triggers but that **only the trigger whose event fires runs during a particular execution**.

This enables multiple interfaces into one logical workflow. For a simple process, several triggers can connect into one normalized path. For substantial systems, prefer thin channel-specific entry workflows that authenticate, normalize and then call a shared capability sub-workflow. The latter keeps channel-specific payload shapes and security settings outside the business core.

**Do not misread multiple triggers as simultaneous execution or automatic parallelism.** Both are separate behavior questions.

## Official node creation versus workflow composition

**Workflow/sub-workflow (no new node package):** create a child workflow with Execute Sub-workflow Trigger / Workflow Input Trigger, define a stable input contract, implement behavior with known nodes, then call it from an Execute Sub-workflow node. Add tests, tags and error behavior. Prefer this for reusable business capabilities.

**Custom/community node package (new integration or operation):** use the [official n8n-node CLI](https://github.com/n8n-io/n8n/tree/master/packages/%40n8n/node-cli). The tool scaffolds node metadata and credential definitions, runs a local development instance and lint/build checks, and prepares publishing:

~~~bash
npm create @n8n/node@latest
# in generated project:
npm run dev
npm run lint
npm run build
~~~

Decide between **declarative HTTP API node** (routine CRUD operations) and **programmatic node** (custom execution/data processing). Define node description, display conditions, credentials, operations, outputs, error behavior, versions, tests, and package provenance. Read the [n8n community-node verification requirements](https://github.com/n8n-io/n8n-docs/blob/main/docs/connect/create-nodes/build-your-node/reference/verification-guidelines.md) including GitHub Actions provenance guidance in 2026. Never copy/install an arbitrary third-party node solely because it displays a badge.

## First reference pattern to build

~~~mermaid
flowchart LR
    IN["Telegram / Webhook entry"] --> AUTH["Verify actor and tenant"]
    AUTH --> CORE["Reusable capability sub-workflow"]
    CORE --> RISK{"Risk and policy check"}
    RISK -->|allow| ONCE["Idempotent execution claim"]
    RISK -->|deny| REJECT["Explain denial + record decision"]
    RISK -->|human needed| REVIEW["Send and wait / external approval"]
    REVIEW -->|approved| ONCE
    REVIEW -->|rejected / expired| REJECT
    ONCE --> EFFECT["Execute side effect"]
    EFFECT --> RUN[("Execution data + durable audit")]
~~~

**Proposed only**: diagram is not n8n export JSON or a production-ready guard. Negative tests must cover rejected/expired requests, forged callbacks, replay, concurrent approval, tenant crossover, duplicate side effects and audit gaps.

## Source priorities

- [n8n official skills](https://github.com/n8n-io/skills): 14 capability skills plus routing meta-skill, 50+ references and n8n MCP conventions; snapshot commit \`626f50fdf2934116eea2c5469339e03d2d524e83\` (2026-11-14).
- [n8n Workflow SDK](https://github.com/n8n-io/n8n/tree/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/workflow-sdk): typed generation, JSON/code conversion and validation, present at pinned n8n 2.47.7.
- [n8n MCP tool reference](https://github.com/n8n-io/n8n-docs/blob/main/docs/connect/connect-to-n8n-mcp-server/mcp-server-tools-reference.md): create_workflow_from_code and validation; check minimum version per operation.
- [Official SDK web-app guide](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/%40n8n/workflow-sdk/src/prompts/best-practices/guides/web-app.ts): serving simple HTML/SPA from webhooks; deployment security and CSP must be tested.
- [cQnce package](https://github.com/cqnce-app/n8n-nodes-cqnce): provider-managed, signed resume callback and polling.
- [Guardian package](https://github.com/X-Guardian-X/n8n-nodes-guardian): deterministic allow/deny/approval and atomic intent claims (maintainer claims; needs testing).
- [Node CLI](https://github.com/n8n-io/n8n/tree/master/packages/%40n8n/node-cli): official custom-node scaffolding and QA.

No third-party code is vendored, installed or run by this research note.
