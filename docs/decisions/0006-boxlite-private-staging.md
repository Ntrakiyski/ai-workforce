# ADR-0006 — BoxLite Cloud as private n8n development runtime

- **Status:** Accepted target deployment approach; **NOT PROVISIONED**
- **Date:** 2026-11-15
- **Related:** [ADR-0004](0004-adopt-official-n8n-skills-and-sdk.md), [ADR-0005](0005-tooling-reuse-evaluation.md)
- **Operational guide:** [BoxLite bootstrap](../../infra/boxlite/README.md)

## Decision

Move the **mutable n8n development/staging environment** from ephemeral GitHub Actions runner jobs to a persistent private **BoxLite Cloud microVM**, after runtime verification and cost/security review.

- n8n runtime **2.47.7**; SDK **0.40.2**; n8n-check **0.1.9**.
- **Node 24** as the guest base: n8n 2.47.7 source specifies Node >=24.
- One stable named private Box with persist-on-stop disk; start, inspect and test through an authenticated BoxLite CLI context.
- **No public inbound access.** n8n health and editor remain loopback-only until an explicit authenticated service exposure design is approved.
- Use synthetic data and no production/client credentials; restrict guest egress during regression testing.
- The BoxLite API key is an **operator control-plane secret** and must not be placed in guest environment variables, source files, commit history or agent tool traces.
- Keep GitHub for code review, specs, evidence and lightweight source integrity checks. GitHub Actions' earlier regression experiment remains historical evidence, not the intended permanent staging host.

## Reasoning

The framework's next iteration requires a **reusable engine** whose filesystem and dependencies persist, and a place agents can create/test multiple workflows with consistent versions. GitHub Actions provides proof-of-concept evidence but is not a convenient interactive development environment.

BoxLite Cloud offers a managed microVM with state surviving stop/start, programmable execution, network policies, and a separate image/runtime. The resource model is **metered**, not a fixed-price VPS, and default auto-stop can interrupt background activity. Always-on client webhooks likely require a dedicated VPS or a separate deployment policy.

## Current blocker / explicit non-claim

The chat's current execution environment **cannot reach api.boxlite.ai** (DNS resolution fails) and has no BoxLite connector. The API key previously pasted in chat is **exposed and must be revoked/rotated**. We **have not** created a Box, installed n8n on BoxLite, authenticated its API, or run BoxLite regression tests.

[Bootstrap scripts](../../infra/boxlite/README.md) are **prepared, not executed**. A network-enabled authorized operator must authenticate with a freshly rotated credential, run the scripts, and upload or record verified runtime evidence.

## Security and operational constraints

1. No remote n8n editor, public tunnel, webhooks, or exposed secret values in initial bootstrap.
2. Customer/tenant state requires separate persistence, backup and permission architecture.
3. Runtime auto-stop is not uptime: treat private staging and always-on client production as different architectures.
4. Cloud account keys may have organization-wide box and billing privileges. Revoke leaked keys promptly.
5. Before any release promotion: verify owner authentication, HTTPS, policy gates, workflow revision locks, and approved n8n license/commercial model.
6. No production credentials or client data in an agent-accessible Box before authorization constraints exist.
7. Maintain explicit run reports and their source revisions; a completed shell script alone is not proof of environment security.

## Acceptance tests to close operational validation

- [ ] Fresh BoxLite Cloud key rotated and stored only in operator CLI credential store.
- [ ] Private Box created, Node 24 confirmed, exact n8n/SDK/n8n-check versions installed.
- [ ] Successful private `/healthz` response, no public port/preview URL.
- [ ] Synthetic positive and negative regression fixtures executed in Box, actual outputs and engine versions recorded.
- [ ] Outbound network restriction verified during tests.
- [ ] Box stops and restarts with n8n data preserved; actual billing/idle-stop behavior recorded.
- [ ] Credentials and client data verified absent; environment ownership and teardown/backup tested.
- [ ] Agent access via approved n8n MCP/API integration tested with least privilege.

No acceptance item is checked merely because it is scripted.

## Sources

- [BoxLite Cloud quickstart](https://github.com/boxlite-ai/documentation/blob/main/cloud/quickstart.mdx)
- [BoxLite lifecycle and billing caveats](https://github.com/boxlite-ai/documentation/blob/main/cloud/box-lifecycle.mdx)
- [BoxLite private/public network policy](https://github.com/boxlite-ai/documentation/blob/main/cloud/network-policy.mdx)
- [n8n 2.47.7 Node engine requirement](https://github.com/n8n-io/n8n/blob/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063/packages/cli/package.json)
