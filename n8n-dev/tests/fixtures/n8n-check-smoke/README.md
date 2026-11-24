# n8n-check isolated regression experiment

**Purpose:** This is a safe *synthetic* proof-of-concept for n8n-check; it is not a client workflow or a production release.

- `healthy.workflow.json`: manual trigger -> fixture input -> Code filter retaining rows with score >=0.70.
- `regression.workflow.json`: the identical workflow with a deliberate threshold defect (>=0.95) that should lose the two expected rows.
- `eligible-rows.case.json`: three fake records, asserts exactly two IDs from the filter node.

The n8n-check runner replaces `Fixture input` with controlled data and injects a manual test trigger. Every record is fake; no credentials or external HTTP calls are included.

Expected engine-level results: **healthy passes (exit 0)**; **regression fails for the expected business-output reason (exit 1)**.

A GitHub Actions pilot under `.github/workflows/n8n-check-smoke.yml` pins the n8n image to **2.47.7** and the runner source to an immutable commit, with read-only permissions and an explicit negative-test exit assertion.

Do not interpret static file checks or an unexecuted workflow definition as evidence the engine actually ran; see the workflow run logs. If this pilot cannot run because of environment/Actions limits, document the blocker honestly.

**Source:** [n8n-check fixture format](https://github.com/blucca/n8n-check/blob/61f6a2e50111f5a89b3131eba3ca5f2b548213d5/src/workflow.mjs) and [action definition](https://github.com/blucca/n8n-check/blob/61f6a2e50111f5a89b3131eba3ca5f2b548213d5/action.yml).

## Completed evidence

[GitHub Actions run 43649002040](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040) **completed successfully** on n8n 2.47.7. Its reports show healthy **pass (exit 0; count 2; IDs request-A/request-B; 5/5 checks passed)** and intentionally broken **expected fail (exit 1; count 0; 2 output assertions failed)**. Both n8n engine executions succeeded; network was verified loopback-only. [Evidence report](../../../docs/research/pilots/n8n-check-verified-run-2026-11-15.md) and [artifact ZIP](https://github.com/Ntrakiyski/n8n-dev/actions/runs/43649002040/artifacts/14135875549).
