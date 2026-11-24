# Engineering Standard: Workflow Architecture

**State:** PROPOSED_STANDARD unless a rule explicitly links to a VERIFIED_SOURCE observation. These are policies to test and refine, not native n8n limits.

## Design order

1. Define the business capability and observable outcome.
2. Define trigger/entry contract, inputs, outputs and external side effects.
3. Identify connected systems, permissions, rate limits and failure conditions.
4. Choose the smallest architecture that preserves readability, isolation and correctness.
5. Decide workflow boundaries and reusable sub-workflows.
6. Select nodes/operations from a target-compatible catalog.
7. Define monitoring, retry, compensation, manual escalation and test cases.
8. Generate JSON and architecture diagram together; do not treat diagram as an afterthought.

## Split one workflow into two when

Prefer a sub-workflow or separate workflow when one or more of these conditions **materially** applies:

- The capability has a **stable input/output contract** and is reused by multiple workflows.
- Different pieces have **independent failure ownership**, escalation or recovery.
- The work has a distinct **trigger**, scheduling or operational lifecycle.
- Separation improves **testing** with independent fixtures or **security** by removing privileges from a component.
- Memory/runtime behavior benefits from reducing a large execution graph; measure before assuming.
- A process requires a human approval/wait boundary that is easier to maintain separately.

**Don't split** solely because there are N nodes; no documented universal threshold is adopted here. Avoid tiny sub-workflows with high coupling, concealed data contracts or excessive back-and-forth calls.

Official support: [sub-workflows and input modes](https://docs.n8n.io/build/flow-logic/break-workflows-into-smaller-parts.md).

### Sub-workflow design checklist

- Identify caller and allowed callers; set permissions.
- Explicitly define expected fields or JSON example when possible; handle missing input.
- Document return items and whether order/count matters.
- Specify whether errors propagate, are translated or returned as structured business results.
- Define whether execution is synchronous, delayed/waiting or async, and test observed behavior for chosen settings.
- Include version and dependency information; avoid hidden references to production credentials.

## Reuse criteria

- Reuse *behavior*, not arbitrary node sequences. Extract a component after the interface stabilizes or at a clearly cross-cutting concern (error reporting, pagination, credential-gated API access).
- A reusable component must include a `README` with contract, supported n8n version(s), assumptions, example, negative tests and ownership.
- Avoid copying unreviewed community JSON into production; imported workflows may be syntactically valid but semantically wrong.

## Visual architecture expectations

- Use descriptive node names; names form part of expression and connection references.
- Group nodes by business stage; preserve left-to-right flow and clearly label failure paths.
- Show external systems, credentials required, side effects and sub-workflow boundaries on the architecture diagram.
- Keep an explicit index mapping diagram components to workflow/node names and IDs.
- A giant Code node that hides all business logic from reviewers needs an architecture exception and independent code review; don't ban Code nodes when native nodes would be less clear or more fragile.

## Architecture decision record (ADR) template

```markdown
# ADR-xxxx: Decision title
Status: Proposed / Accepted / Superseded
Target n8n version:
Context and constraints:
Options considered:
Decision and rationale:
Failure/rollback implications:
Evidence links and fixtures:
Follow-up checks:
```

## Anti-patterns (proposed)

- Repeating the same credential-bearing API logic in many workflows with no change control.
- Building a single workflow with several unrelated triggers and business owners without justification.
- Handling an upstream `continue` failure as though the operation succeeded.
- Relying on a single large expression referencing distant named nodes when an explicit data contract would be clearer.
- Returning output in a Code node that breaks `pairedItem` provenance.
- Editing a workflow simultaneously from an AI agent and the n8n UI without conflict detection.
- Using a production webhook endpoint during staging tests.
