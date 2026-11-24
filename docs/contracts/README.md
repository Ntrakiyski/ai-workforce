# Cross-platform contracts

A contract defines one boundary between specialists: caller, request, authentication, response, failure states and retry semantics. Both sides link to it; neither side changes it alone.

| Contract | Caller → callee | Reference implementation |
| --- | --- | --- |
| Read-only status webhook | OIX app → n8n webhook | [joint/homelab-status](../../joint/homelab-status/README.md) |

Planned: Open WebUI Filter/Pipe → n8n business webhook (identity context, correlation ID, async status); durable human approval; n8n → Open WebUI API via the [community node](../../n8n-dev/nodes/n8n-nodes-openwebui/README.md).
