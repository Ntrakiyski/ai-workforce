# AI Workforce

Platform specialists that agents load to build and operate our AI platform. Each specialist owns one platform and follows the same [template](_template/TEMPLATE.md).

| Specialist | Responsibilities |
| --- | --- |
| [n8n-dev](n8n-dev/SKILL.md) | Build workflows and custom nodes, verify their contracts, own business logic and service credentials. |
| [openwebui-dev](openwebui-dev/SKILL.md) | Operate Open WebUI, configure models, providers and agents, build native Functions/Tools and OIX apps, verify the ordinary user's experience. |
| litellm-dev | Planned. |

Other tools we use: [tool-stack](tool-stack/README.md).

## Where this repo fits

ai-workforce holds **reusable, client-neutral know-how**. The platform control plane (e.g. `gcc-tech-stack`) records what is deployed and how it is operated; client repositories hold concrete workflows and apps. Those repos load specialists from here; this repo never references live instances, client data or secrets. See [ADR-0008](docs/decisions/0008-repository-roles-and-template.md).

## Layout

```
<platform>-dev/   one specialist per platform (same template)
_template/        starting point for a new specialist
joint/            examples spanning several specialists
docs/contracts/   boundaries between platforms
docs/standards/   rules every specialist follows
docs/decisions/   cross-specialist decisions
tools/            repository checks
```

First joint example: [homelab status](joint/README.md). To add a specialist, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Checks

```bash
python3 tools/check_docs.py
python3 -m unittest discover -s tools/tests -v
python3 -m unittest discover -s openwebui-dev/examples/openwebui-native -v
```
