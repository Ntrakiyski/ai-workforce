# AI Workforce

Platform specialists for agents building and operating n8n and Open WebUI. Each specialist is self-contained in its own folder; start at the skill for the platform you are changing.

| Specialist | Responsibilities |
| --- | --- |
| [n8n-dev](n8n-dev/SKILL.md) | Build workflows and custom nodes, verify their contracts, and own business logic and service credentials. |
| [openwebui-dev](openwebui-dev/SKILL.md) | Operate Open WebUI, configure models and providers, build native extensions and OIX apps, and verify the ordinary user's experience. |

**First joint example.** The [homelab status app](openwebui-dev/examples/homelab-status/README.md) answers a channel request using the [n8n readiness workflow](n8n-dev/examples/homelab-status/README.md). The [native extension examples](openwebui-dev/examples/openwebui-native/README.md) exercise the in-process hooks independently.

## Layout

```
n8n-dev/        n8n specialist: skill, docs, research, nodes, tests, examples
openwebui-dev/  Open WebUI specialist: skill, references, scripts, examples
.github/        CI for both specialists
```

## Checks

```bash
python3 n8n-dev/scripts/check_docs.py          # links across the whole repo + evidence index
python3 -m unittest discover -s n8n-dev/tests -v
python3 -m unittest discover -s openwebui-dev/examples/openwebui-native -v
```
