# Homelab status (Open WebUI channel → n8n)

An authorized channel member mentions the app; the OIX app calls a fixed n8n webhook; n8n checks its own readiness; the app replies to the source message.

- [Open WebUI side (OIX app)](openwebui/README.md) — owned by [openwebui-dev](../../openwebui-dev/SKILL.md)
- [n8n side (workflow + contract)](n8n/README.md) — owned by [n8n-dev](../../n8n-dev/SKILL.md)
- CI: `.github/workflows/homelab-status.yml` runs both in disposable staging.
