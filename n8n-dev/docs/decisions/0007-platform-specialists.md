# ADR-0007 · Platform specialists in AI Workforce

Accepted 24 November 2026. The n8n and Open WebUI specialists share one repository because their integrations require coordinated contracts, fixtures, and review. One change can update both sides of a channel-to-workflow interaction.

Each specialist owns its platform knowledge. Open WebUI owns channel identity, app scopes, provider and model configuration, and user-facing behavior. n8n owns workflow execution and credential-bound service operations. Hermes can load either skill from a checkout. A new model, agent service, or standing administrative credential is unnecessary to consume a repository skill.

For the [first joint example](../../../openwebui-dev/examples/homelab-status/README.md), an authorized channel interaction requests n8n readiness. The OIX app validates context, asks a fixed webhook for the result, and replies to the source channel. n8n checks one predefined service. Both sides handle unavailable or malformed results without claiming the service is healthy. Acceptance includes an ordinary authorized user, denied access, and failure handling. Runtime evidence belongs with the example.

Keep existing n8n paths and upstream skills usable. Add platform-specific references and tests as concrete capabilities are built. Each deployment remains an independent operator decision.
