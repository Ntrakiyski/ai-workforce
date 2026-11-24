---
name: n8n-dev
description: Build, inspect, and validate n8n workflows and custom nodes. Use for webhook contracts, workflow SDK assembly, credentials, isolated execution tests, and n8n integrations with Open WebUI.
---

# n8n specialist

1. Record the target release, edition, deployment mode, trigger, authorized actor, expected result, and failure behavior. Read the [project instructions](AGENTS.md) and [official skill routing guide](skills/README.md). Select the upstream capability skill for the operation.
2. For workflow work, use the [official toolchain](docs/framework/official-toolchain.md) and [workflow JSON contract](docs/contracts/workflow-json.md). For a custom node, start from the [existing packages](nodes/README.md) and their package-local checks. Reuse the existing Open WebUI chat node when acting as its credential owner is the intended behavior.
3. Keep the workflow, endpoint contract, and credentials separate. For WebUI channel requests, hand installation, membership, event verification, and user-facing replies to [openwebui-dev](../openwebui-dev/SKILL.md). Agree on success and failure payloads before changing either side.
4. Inspect the actual graph, run success and denial cases with synthetic inputs, and record exactly which artifact, version, and execution path passed. Test in isolated staging before requesting promotion. Document rollback and any checks still open.

See the [joint status example](../openwebui-dev/examples/homelab-status/README.md) for the read-only webhook boundary.
