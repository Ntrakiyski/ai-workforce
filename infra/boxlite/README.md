# BoxLite Cloud staging runtime for n8n-dev

> **Status (2026-11-15): PREPARED / NOT PROVISIONED.** Scripts and integration instructions are committed, but **no Box was created or inspected remotely from this chat**. The current execution environment cannot resolve `api.boxlite.ai`; no BoxLite Cloud connector is connected. This must be completed from a network-enabled machine with the BoxLite CLI or an authorized remote operator.

## Why this exists

Move interactive n8n development, SDK prototyping, and real-engine workflow regression tests into a persistent **private BoxLite microVM**, instead of using GitHub Actions as the development environment. GitHub Actions may continue to validate documentation or run lightweight review checks, but **BoxLite is intended to own the mutable n8n staging environment** once provisioned.

The Box is a **testing/workspace substrate**, not yet an autonomous agent, n8n client product, or externally accessible service. LLM API, chat provider, user account and MCP connections are intentionally not installed until their secrets and roles are configured through an approved process.

~~~mermaid
flowchart LR
    SPEC["Product specification / Git repo"] --> CLI["Developer or authorized agent CLI"]
    CLI --> BOX["Private BoxLite Cloud microVM"]
    BOX --> N8N["Local-only n8n 2.47.7"]
    BOX --> SDK["Official Workflow SDK 0.40.2"]
    BOX --> TEST["n8n-check 0.1.9"]
    TEST --> ART["Local JSON + JUnit evidence"]
    ART --> REVIEW["Review + approved release"]
~~~

**Security boundaries:** BoxLite account key stays on the machine running the CLI; it is **never copied inside the Box or GitHub**. Inbound is disabled; n8n listens on loopback only; outbound is disabled after acquiring dependencies. No public preview URL is created.

## Credential handling — do this before use

An earlier API key was pasted into a chat and appears in a screenshot. **Revoke it and create a new BoxLite Cloud key before running this setup.** BoxLite documents these as account-wide, powerful credentials; they may create/remove boxes and incur billing.

**Never paste the new key into a repository, script, log, issue or chat.** Instead sign in interactively:

```bash
# Install the CLI from the official BoxLite distribution after reviewing the installer:
curl -fsSL https://sh.boxlite.ai | sh

# The CLI will securely prompt for the NEW rotated key:
boxlite --context app auth login --url https://api.boxlite.ai --method api-key
```

Alternatively pass the key to `auth login --api-key-stdin` using a local secret manager; never put it in command arguments or shell history. The CLI saves credentials locally under `~/.boxlite/` with restricted file permissions.

## Provision the private development Box

From a local clone of this repository:

```bash
git clone https://github.com/Ntrakiyski/n8n-dev.git
cd n8n-dev

bash infra/boxlite/provision.sh
```

The script **first looks for a box with the same name**, creating one only if absent. Defaults:

| Property | Value | Reason |
|---|---|---|
| Name | `n8n-dev-staging` | Stable reuse across sessions |
| Base image | `docker.io/library/node:24-bookworm-slim` | n8n 2.47.7 requires Node >=24; Cloud supports public OCI refs |
| CPU / RAM / disk | **2 vCPU / 4096 MiB / 20 GB** | Medium-sized dev/testing machine; hourly charges apply |
| Network inbound | **Disabled** | No unauthenticated public n8n editor |
| Network outbound | Enabled only during npm install; then disabled | Reduce exfiltration risk during offline test execution |
| Auto stop | **3600 seconds** of no client/SDK traffic | Limits idle spend; background work alone does not keep a Box awake |
| Auto delete | Disabled | Retains rootfs across Box stop/start |
| n8n | `2.47.7`, local-only HTTP port 5678 | Version parity with our audited engine |
| Official SDK | `@n8n/workflow-sdk@0.40.2` | Matches source-pinned SDK |
| Regression runner | `@blucca/n8n-check@0.1.9` | Matches prior verified GitHub Actions pilot |

Provisioning installs pinned npm packages into `/home/node/n8n-dev/`, stores n8n files in `/home/node/.n8n/`, and launches the n8n health endpoint **within the Box only**. The owner enrollment UI and production integrations are deliberately not exposed.

**Important:** This is a *proposed* installation plan, not a proven Cloud runtime. Package availability, Cloud quotas, image support and all bootstrap commands must be checked by executing on the target provider. Some plans may not allow the requested size. If installation fails, inspect the console/Box before retrying; do not create a second duplicate box.

### Operating the Box

```bash
bash infra/boxlite/manage.sh status
bash infra/boxlite/manage.sh logs
bash infra/boxlite/manage.sh stop
bash infra/boxlite/manage.sh start
```

Stopping retains the Box filesystem. **Deleting the Box may delete n8n state and encryption material**; back up the n8n user folder and export workflows first. The auto-stop policy can stop unattended activity, including running n8n. It is not suitable as a permanent client webhook server until always-on operation, durable volumes and appropriate network security have been designed.

### Run our existing tests in BoxLite instead of GitHub Actions

```bash
bash infra/boxlite/run-regression.sh
```

The script copies the same synthetic positive/negative fixtures already proven in the [GitHub Actions evidence](../../docs/research/pilots/n8n-check-verified-run-2026-11-15.md), disables Box outbound networking, then uses the installed n8n executable and n8n-check to assert **positive exit 0** and **known-bad exit 1**.

New reports are copied back to `artifacts/boxlite-smoke/`, which is ignored by Git. The runner's `--allow-network` option is used solely to bypass its simplistic network-interface detector because the BoxLite hypervisor/network policy is the intended isolation boundary; **do not remove the BoxLite egress restriction or use this flag on a trusted, network-open host with untrusted workflows**.

Before treating tests as a replacement for CI, compare BoxLite JSON/JUnit evidence against the original reports, verify actual n8n version and network state, and document any differences.

## Prerequisite matrix and limitations

| Requirement | Current state |
|---|---|
| BoxLite Cloud account | User has shown setup interface |
| Fresh non-exposed API key | **Required**; previous key must be rotated |
| BoxLite CLI installed & Cloud login | **Unverified** |
| Cloud Box created/running | **NOT DONE** in this chat |
| Node 24 and npm packages inside Box | **Not installed** from this chat |
| n8n listening privately on 127.0.0.1:5678 | **Not running** from this chat |
| Regression run inside Box | **Not executed** from this chat |
| Equivalent GitHub Actions regression pilot | **Verified on n8n 2.47.7** |
| Agent/MCP/chat integration | **Future implementation**; requires separate credentials |
| External webhook/HTML/editor access | **Disabled intentionally** |

**Reason the setup was not executed here:** the current sandbox has no BoxLite CLI and cannot resolve `api.boxlite.ai`; no enabled connector supports Box creation. This is an execution access limitation, not an API-key validation result. No request carrying the API key was sent.

## Decisions and future requirements

- [ADR-0006: BoxLite private staging](../../docs/decisions/0006-boxlite-private-staging.md) records the environment direction.
- Use managed/persistent storage and backups for real client state; never rely on a demo Box's rootfs as the only copy of credentials/data.
- Before opening inbound access, configure HTTPS, authenticated n8n owner access, API/MCP scope, rate limits, and tenant isolation. A preview/tunnel URL alone is **not** authentication.
- Use n8n Community Edition only within allowed terms; commercial resale/white-label provisioning should receive a separate license review.
- For an always-on client bot, benchmark a dedicated VPS against BoxLite's metered Cloud runtime; auto-stop is not compatible with reliable 24/7 webhook delivery.
- Keep the SDK-based system specification, validation, reviewer and business behavior map separate from this VM runtime.

## Primary sources

- [BoxLite Cloud quickstart](https://github.com/boxlite-ai/documentation/blob/main/cloud/quickstart.mdx)
- [BoxLite Cloud lifecycle / idle auto-stop](https://github.com/boxlite-ai/documentation/blob/main/cloud/box-lifecycle.mdx)
- [Custom public OCI images](https://github.com/boxlite-ai/documentation/blob/main/cloud/use-your-image.mdx)
- [BoxLite Cloud network policy](https://github.com/boxlite-ai/documentation/blob/main/cloud/network-policy.mdx)
- [BoxLite CLI reference](https://github.com/boxlite-ai/boxlite/blob/main/src/cli/README.md)
- [n8n official Node requirement at version 2.47.7](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/cli/package.json)
