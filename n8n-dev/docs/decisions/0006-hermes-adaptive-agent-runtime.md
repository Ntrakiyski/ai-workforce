# ADR-0006 — Adopt Hermes-on-BoxLite as the candidate adaptive execution worker

- **Status:** ACCEPTED DESIGN DIRECTION, **not** adopted as a tested production dependency
- **Date:** 2026-11-15
- **Related:** [n8n-native systems ADR-0002](0002-n8n-native-systems-framework.md), [official SDK and Skills ADR-0004](0004-adopt-official-n8n-skills-and-sdk.md)
- **Design:** [Adaptive Execution with Hermes](../architecture/adaptive-execution-hermes-boxlite.md)
- **Controls:** [Production agent safety](../standards/agent-production-controls.md)

## Context

Our framework has two categories of work:

1. Repeatable, well-understood business operations that are best represented as **versioned, independently tested n8n workflows**.
2. Open-ended tasks where solving the problem requires exploration, code execution, investigating open-source tools, temporary files or adaptive iteration.

The project owner identified BoxLite Cloud's [official Hermes Agent deployment pattern](https://github.com/boxlite-ai/documentation/blob/main/cloud/agent-in-box/hermes.mdx) as a practical way to run a tool-using AI agent in an isolated environment. The owner also supplied [a production n8n agent training transcript](https://www.youtube.com/watch?v=RvOErUwZq1g) detailing six operating controls.

## Decision

**Keep n8n as the orchestrator and trusted business action layer. Evaluate Hermes inside an isolated BoxLite Cloud microVM as the preferred external adaptive worker.** Do not move the n8n development/CI environment from GitHub Actions; that idea was explicitly reverted.

- Default to existing tested n8n sub-workflows for known tasks.
- Route genuinely exploratory tasks into a **typed, bounded agent-task contract**.
- Initially reuse **one digest-pinned Hermes Gateway image** with up to three differentiated skill/tool profiles: research, engineering and data. Make specialized immutable images only if testing justifies them.
- Call Hermes through its authenticated **Gateway**. BoxLite Cloud control-plane API key is separate and restricted to provisioning/cleanup operations.
- Keep real business reads, writes, approvals, workflow publication, financial actions and tenant authorization in narrow trusted workflows or services.
- Independently verify artifacts and acceptance criteria, record traces, costs, budgets and image/agent versions.
- Never assume a successful adaptive run can immediately become a production workflow. Reproduction, tests and approval precede promotion.

## Rejected alternatives

- **Use arbitrary shells directly from n8n production flows:** unacceptable credential and blast-radius coupling.
- **Give an LLM the BoxLite account-wide key and full n8n administrator authority:** breaks least privilege, separation and audit.
- **Use three permanently running Boxes before any benchmark:** unnecessary operational expense.
- **Treat the Hermes Gateway as a trusted business transaction service:** native chat outputs do not enforce our authorization/acceptance contracts.
- **Replace GitHub Actions/staging with BoxLite:** previously reverted and out of scope.
- **Build our own entire agent runtime:** unsupported effort when an official Hermes image and Gateway already exist.

## Consequences

- Implement a reusable **n8n Hermes Task adapter**, task-result validator, policy gate and cleanup/reconciliation path.
- Add a **profile/image registry** linking profile names to pinned image digests, skills, allowed tools, resource budgets and verified test evidence.
- Use a restricted broker for Box lifecycle and per-task credentials instead of distributing management tokens.
- Explicitly handle idle-stop, 503 wake behavior, timeouts with uncertain outcomes, rate limits, persistent artifacts, failed cleanup and usage charges.
- Build a sample with **synthetic data** and no client secrets. Record real execution evidence before claiming integration.
- Evaluate the requirements against the user's previously supplied 6-part production agent checklist.

## First pilot acceptance

1. A restricted n8n workflow submits one structured synthetic task to Hermes Gateway.
2. A Box is created or reused from a pinned image, without making the Cloud management key accessible to the agent.
3. The agent performs a real bounded tool operation in its own filesystem and returns artifact refs.
4. n8n independently validates the output rather than trusting the chat response.
5. Denial, invalid output, timeout/wake and duplicate-task cases fail safely; cleanup is recorded.
6. Run time, token spend, tool calls, image digest and n8n execution correlation are retrievable.

**No pilot completion is claimed.** External provider setup and a fresh safely stored API key would be required; do not reuse credentials previously pasted into chat.
