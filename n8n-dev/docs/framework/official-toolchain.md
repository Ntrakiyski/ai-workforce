# Official n8n toolchain — implementation baseline

**Decision:** [ADR-0004](../decisions/0004-adopt-official-n8n-skills-and-sdk.md). **Status:** Architecture adopted, integration not yet installed/tested in a running instance.

Our repo **is not** intended to recreate the official n8n Workflow SDK. It defines the higher-level **spec-driven systems framework** that uses n8n's official construction and execution capabilities.

## Layers and ownership

~~~mermaid
flowchart TB
 BUSINESS["Human: product goal and approval"] --> SPEC["Our system specification / manifest"]
 SPEC --> ARCH["Our agent architecture and capability rules"]
 SK["Official n8n Skills"] --> ARCH
 ARCH --> BUILD["Official SDK-first builder candidate"]
 SK --> BUILD
 MCP["n8n instance MCP + exact node catalog"] --> BUILD
 BUILD --> J["Generated workflow JSON + graph references"]
 J --> V["Our validation / staging / independent review"]
 V --> LIVE["Deployed n8n system"]
 LIVE --> MAP["Our behavior-first visual product interface"]
~~~

| Layer | Reuse from n8n | We add |
|---|---|---|
| Domain intent | — | Product specs, acceptance criteria, actors and risk |
| Agent expertise | [n8n-io/skills](https://github.com/n8n-io/skills) | Skill routing and additional rules for our system contracts |
| Workflow authoring | [@n8n/workflow-sdk](https://github.com/n8n-io/n8n/tree/master/packages/%40n8n/workflow-sdk) | Decide how multiple workflows form a product and which patterns are allowed |
| Instance operations | Official instance-level MCP | Safe instance selection, least privilege, diff/revision handling |
| Quality | Official validators + native execution | Explicit connection comparison, negative tests, independent review, release evidence |
| Human presentation | n8n native editor for technical inspection | Business-level behavior map, progressive disclosure, exact deployed references |

## Why not generate every JSON property manually?

The official SDK's pinned README describes a TypeScript builder with typed operations, branches, code-to-JSON/JSON-to-code capabilities, and built-in validation. These features can reduce low-level generation errors. But native validation **does not** prove business semantics, permissions, data isolation, side-effect safety or that every expected wire survived serialization.

We will **prefer SDK-first for supported workflows, then validate actual JSON and execute tests**. This is a chosen hypothesis to benchmark, not an assertion that the SDK is always superior.

## Before a coding agent begins

1. Read \`AGENTS.md\` and the specification/model documents.
2. Load \`using-n8n-skills-official\` and appropriate capabilities (lifecycle, node configuration, subworkflows, error handling, credentials, etc.) if installed. If not available, state the missing dependency and consult the pinned official source; do not invent tool names.
3. Inspect target n8n release, available node versions, credentials and instance-level MCP permissions.
4. Produce capability contracts and planned behavioral graph.
5. Build a typed workflow where supported; derive JSON; validate actual connections, expressions and permissions.
6. Run isolation and failure tests; only then claim tested or ready for authorized release.

## Official installation instructions (Codex)

From the official Skills README (check compatibility before use):

~~~bash
codex plugin marketplace add n8n-io/skills
codex plugin add n8n-skills@n8n-io
# restart Codex and review the hook-trust prompt
codex mcp add n8n-mcp --url https://YOUR-N8N-DOMAIN/mcp-server/http
# authorize the MCP session using OAuth
~~~

Codex setup may require a supported version (official README documents >= 0.142.0). The n8n instance must be reachable and configured for instance-level MCP; enabling or authenticating MCP requires action by its owner. Do **not** commit tokens or remote instance secrets. Do not interpret these commands as already executed.

See also [skills setup](../../skills/README.md).

## Next task

Create the first **SDK-first reference fixture**: Manual/Webhook -> authorize identity -> read data -> decision -> return structured response. Include a dedicated error path and test evidence. Build the same case directly in JSON for the benchmark. No production effects.
