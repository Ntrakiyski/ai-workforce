# AI Workforce skills

Load [n8n-dev](n8n-dev/SKILL.md) or [openwebui-dev](openwebui-dev/SKILL.md) from the repository checkout. The relative links in the skills resolve against that checkout.

## n8n foundation

**Decision:** Use the **official n8n Skills** as the baseline knowledge package rather than reconstructing n8n expertise from scratch. See [ADR-0004](../docs/decisions/0004-adopt-official-n8n-skills-and-sdk.md) and the [official toolchain](../docs/framework/official-toolchain.md).

## Upstream

- Source: [n8n-io/skills](https://github.com/n8n-io/skills)
- Pinned research snapshot: commit `626f50fdf2934116eea2c5469339e03d2d524e83`; review and upgrade intentionally
- Router: `using-n8n-skills-official`
- Relevant capability skills: `n8n-workflow-lifecycle-official`, `n8n-subworkflows-official`, `n8n-node-configuration-official`, `n8n-error-handling-official`, `n8n-credentials-and-security-official`, plus others as needed
- Source license: Apache-2.0 (upstream LICENSE); this repo currently **links to** rather than vendors the official skill files

## Install locally in Codex

~~~bash
codex plugin marketplace add n8n-io/skills
codex plugin add n8n-skills@n8n-io
# Restart Codex, review hook prompts, configure the n8n MCP endpoint:
codex mcp add n8n-mcp --url https://YOUR-N8N-DOMAIN/mcp-server/http
~~~

The official README documents Codex >= 0.142.0 for its plugin route. Authenticate through the MCP OAuth flow. **This Git repository cannot install the plugin in your local Codex runtime or authorize your n8n instance for you.** If unavailable, follow the official manual-install documentation for the current agent environment.

## How to use in projects

Before workflow design, generation or MCP edits, load the meta skill and the relevant capability skill; inspect the target instance version. Add our custom constraints **on top**: tenant-aware system model, safe approvals, versioned behavior mapping and stronger staging/release gates.

The [n8n specialist](n8n-dev/SKILL.md) routes agents to these specifications, validators, and upstream skills.

## Status

- [x] Official source identified and catalogued
- [x] Official skills adopted as an engineering baseline
- [ ] Installed and authenticated in a target development environment
- [ ] Version-pinned skills validated on a disposable n8n instance
- [x] Repository specialist entry point added
- [ ] Specialist evaluated in an installed agent runtime
