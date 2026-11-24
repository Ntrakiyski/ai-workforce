---
name: openwebui-dev
description: Build and operate Open WebUI models, provider connections, terminal agents, subagents, Python Functions and Tools, and scoped channel apps with the OIX SDK. Use for WebUI-side integration and troubleshooting.
---

# Open WebUI specialist

Start with the interaction the user needs. Identify who initiates it, what they should see, where the code executes, which identity can perform the operation, and what an unauthorized user should experience. Select the smallest surface that implements that behavior.

| Requested behavior | Start here |
| --- | --- |
| Diagnose WebUI readiness, connect a provider, curate a workspace model, expose a terminal-backed agent, or configure subagents | [Operations, models and agents](references/operations.md) |
| Expose a model-like service, transform chat input or output, add a clickable action, subscribe to server events, or give a model a callable tool | [Native extensions](references/extensions.md) |
| Connect a separately hosted app to channels and deliver results there | [OIX apps](references/oix-apps.md) |

For workflows calling WebUI chat, inspect this repository's existing `nodes/n8n-nodes-openwebui/` adapter. For WebUI calling n8n, define the request, response, authentication and failure contract with the n8n specialist. Each side should know the audience and target operation without using prompt text as proof of authority.

## Before changing an instance

Identify the target URL, deployment version, effective role and staging or production scope. For a read-only check run `python3 scripts/probe.py <instance-base-url>` relative to this skill. An optional `OPENWEBUI_TOKEN` from the operator's secret store enables a caller-specific model count. The probe uses no admin settings or model inference and makes at most four GETs. The absence of credentials still allows public version, liveness and readiness checks.

The references are source-verified against **Open WebUI v0.13.4** and **OIX 0.8.0**. Match the deployed version to its own upstream source before using a route, injected parameter or feature flag. Preserve scoped configuration and a rollback artifact before an authorized change. For a new capability, verify an allowed user, a denied user, and a failure through the same interface people will use. Record version, sanitized evidence and actual coverage. Follow the repository's staging and promotion boundaries.
