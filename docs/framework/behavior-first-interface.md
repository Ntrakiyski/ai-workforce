# Behavior-First Visual Interface

> **Status: PROPOSED_STANDARD.** This document defines intended UX and data contracts; no visual product UI, diagram compiler or production n8n integration has been built by this repository.

## The central design rule

**Show what the system does, not how the agent coded it.**

**Audience:** people who want to understand and direct the product, but do not have the time or intention to learn every underlying technology.

**Context budget:** show *exactly the context needed for the user's next decision — no more, no less*. This is a design hypothesis that must be tested with real users, not an excuse to hide risk or uncertainty.

The default experience should be a graph of recognizable **business capabilities** with icon, plain-language name, relationship, outcome and truthful state. It is not a raw n8n node canvas, nor a static marketing architecture slide.

## Three visual depths

| View | Purpose | Should show | Should normally omit |
|---|---|---|---|
| **Level A — System map (default)** | Understand the product in seconds | Entry points, named capabilities, decisions, outputs, failures, statuses | Code, node settings, environment variables, raw logs |
| **Level B — Capability details (on demand)** | Understand why/how a step behaves | Input/output contract, external provider, data read/write, permissions, errors, run history, dependencies | Every implementation node and stack trace |
| **Level C — Technical evidence (opt-in for authorized roles)** | Debug, audit, approve risky changes | Mapped n8n workflows/nodes, config without secrets, revisions, tests, traces, API errors | Secrets, unnecessary personal data |

Progressive disclosure must not conceal mandatory warnings. Failures, high-risk actions, permission changes, irreversible effects, unknown states, and production-vs-staging differences must be visible at Level A.

## Default box anatomy

Each visible box is a **business step**, not necessarily one n8n node.

- **Title:** verb + object, such as "Identify customer" or "Send reply".
- **Icon:** recognizable action category; icons help scan, but textual names remain essential.
- **Role:** trigger, decision, transformation, external call, store, action, output or recovery.
- **Connection:** direction and meaning of the transition, including conditional/failure paths.
- **State:** planned, building, unverified, tested, active, degraded, failed, or out-of-sync (see below).
- **Outcome:** one plain-language sentence describing the result or side effect.
- **Details:** optional input/output, dependencies, authorized actor, cost/risk and evidence link.

A box may map to several n8n nodes or sub-workflows. A single node may contribute to several conceptual operations. Preserve mapping references; **never assume a 1:1 relationship**.

## Example: customer service behavior map

~~~mermaid
flowchart TD
  MESSAGE["Customer sends message"] --> IDENTIFY["Identify customer and permissions"]
  IDENTIFY -->|authorized| LOOKUP["Find customer information"]
  IDENTIFY -->|denied| DENY["Explain access restriction"]
  LOOKUP --> RESOLVE["AI handles request using approved tools"]
  RESOLVE -->|success| REPLY["Reply to customer"]
  RESOLVE -->|retryable error| RECOVER["Retry or escalate"]
  RECOVER -->|resolved| REPLY
  RECOVER -->|unresolved| HUMAN["Request human help"]
  REPLY --> AUDIT["Record outcome"]
  HUMAN --> AUDIT
  DENY --> AUDIT
~~~

This is an **illustrative desired-behavior model**. It is not evidence that any linked n8n workflow exists, that data is protected, or that the error paths execute correctly.

## The behavioral map must be grounded

The eventual interface generator MUST ingest the **approved system manifest and deployed workflow artifacts**, not extrapolate from an agent's conversational summary.

Required linkage per box (proposed schema contract, not n8n JSON):

| Property | Purpose |
|---|---|
| system_id, system_version | Which product and released version is shown |
| box_id | Stable UI identity across edits |
| capability_id | The user-facing business responsibility |
| workflow_refs | Workflow IDs and relevant version/revision identifiers |
| node_refs | Optional node IDs supporting the capability |
| entry/exit refs | How transitions correspond to workflow edges or event contracts |
| input/output schema refs | What business contracts it fulfills |
| side_effects | External writes, notifications, irreversible actions |
| permissions and tenant_scope | Who can invoke, inspect, change or access its data |
| test_refs, release_ref, trace_refs | Verification and runtime provenance |
| validation_state, runtime_state | Truthful state, from source evidence not freeform agent prose |

The projection compiler should validate that all references exist, check expected edges and contracts, and flag **unmapped behavior or stale revisions**. UI simplification must never silently omit execution branches that can change authorization, money, external state or failure outcomes.

## Truthful status vocabulary

A single "green check" is insufficient. Distinguish independent dimensions:

- **Design:** proposed / accepted / superseded.
- **Build:** not implemented / generated / statically validated.
- **Verification:** untested / test failed / staging verified.
- **Deployment:** not deployed / staging / active release / revision mismatch.
- **Operation:** unknown / healthy / degraded / failed / no recent evidence.

Show a small, human-readable summary in Level A, with underlying dimensions visible in Level B. Do not call something "live and healthy" based only on static JSON, model assertion, a past test, or lack of reported errors. If telemetry is unavailable, show "status unknown".

## Change review: what the human approves

A change request should show:

1. **Before / after behavior**: which capabilities, paths, or outputs will be added, changed or removed.
2. **Impact**: users affected, data touched, external actions and possible downtime.
3. **Risk**: permission/credential changes, money movement, outbound messages, deleted records.
4. **Evidence**: which test scenarios passed or failed on which version.
5. **Release controls**: rollback reference and explicit authorization when required.

The human reviews the **impact on the system** first. Technical diffs remain accessible for authorized engineering/audit roles.

## Acceptance tests for the future UI

1. **Comprehension:** Show a system map to a non-programmer and ask them to identify its trigger, purpose, outcome, important decisions and failure path.
2. **Fidelity:** Diff projection against actual workflow definitions and an instrumented staging execution. Any missing critical branch fails the test.
3. **Revision consistency:** Deploy a change and verify that boxes, edges and statuses update only after an approved release; show mismatches.
4. **Truthful status:** Force failed tests, missing telemetry and unavailable integrations; the UI must not display success.
5. **Security:** Verify the map and drill-down redact secrets, enforce per-tenant and per-role access, and reveal high-risk actions at Level A.
6. **Accessibility:** Text labels must carry meaning independently of icons and colors; keyboard and screen-reader paths should be considered when implementing the actual interface.
7. **Usability:** Compare the map against a technical n8n workflow and an agent-chat-only view for representative tasks; measure task completion and incorrect assumptions rather than assuming the new abstraction is always better.

## What we deliberately do not claim

- That every product can be explained truthfully in a single five-box linear diagram.
- That n8n itself provides this specific end-user map or projection compiler.
- That the user should never need technical oversight in regulated or high-risk cases.
- That a pretty diagram proves runtime correctness.

## Relationship to other documents

- [Spec-driven product development](spec-driven-product-development.md): the overall creation lifecycle and 2027 thesis.
- [System model](system-model.md): how reusable systems are assembled.
- [Reference architecture](../architecture/system-overview.md): builder, staging, reviewer and release boundaries.
- [Quality gates](../testing/quality-gates.md): validation requirements.

**Design rule to preserve in future implementations:** the best default interface is **the simplest faithful representation of the system that still supports a safe human decision**.
