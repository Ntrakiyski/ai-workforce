# Spec-Driven Product Development with n8n

> **Status: Product thesis / PROPOSED_STANDARD.** A design direction for 2027, not a claim that this framework, its compiler, or its interface already exists.

## The thesis

**Product development should start with what the system must achieve, not the software that someone must write.**

In this framework, a human specifies behavior and acceptance criteria; specialized agents compose and test n8n workflows; the human understands and controls the resulting product through a visual map of **business behavior**, not source code.

n8n is our primary execution and orchestration substrate, **not a new general-purpose programming language**. Other services may provide data, isolated computation, agent inference, authentication, or external APIs.

**Positioning (a design goal, not a market fact):** 2027 is our target period for treating spec-driven, agent-executed system assembly as the default way we build products.

## Who this is for

> People who want to understand the systems they create and operate, but do not want to spend their time learning to program or reading implementation details.

This does **not** mean users lack technical curiosity or judgment. They must be able to understand triggers, decisions, dependencies, permissions, effects, failures, costs, and system health well enough to direct and approve changes. Technical depth remains available on demand.

## Three interface levels

| Level | Default object of attention | The human must understand |
|---|---|---|
| 1. Source-code inspection | Files, functions, diffs, framework internals | How the implementation works |
| 2. Agent conversation | Instructions, plans, tool use, summaries | What the agent changed or attempted |
| 3. Visual behavior map **(our default)** | Named capabilities, triggers, choices, results, exceptions | What the product does and whether it works |

These are **abstraction levels, not a universal history of software interfaces**. Each can be useful. Do not remove access to code or agent logs for authorized users who need them; simply do not make those the default view.

## System assembly lifecycle

~~~mermaid
flowchart LR
  WANT["Desired business outcome"] --> SPEC["Versioned product specification"]
  SPEC --> PLAN["Architect agent: capabilities and contracts"]
  PLAN --> BUILD["Builder agent: n8n workflows and integrations"]
  BUILD --> TEST["Static checks and staging execution"]
  TEST -->|fails| BUILD
  TEST -->|passes| REVIEW["Independent review and release authorization"]
  REVIEW -->|approved| LIVE["Deployed system"]
  LIVE --> VIEW["Visual behavior map for the human"]
  LIVE --> EVIDENCE["Run traces and health evidence"]
  EVIDENCE --> VIEW
  VIEW -->|change request| SPEC
~~~

All boxes above are proposed roles/capabilities, not proof of deployed software.

## Source-of-truth model

A change must maintain a linked chain:

1. **Product specification:** desired outcomes, actors, permissions, entry points, behaviors, failure policy, success criteria.
2. **System manifest:** versioned list of capabilities and their dependencies, interface adapters, storage contracts and workflow references.
3. **n8n workflow artifacts:** versioned, tested JSON with node types and settings for the target instance.
4. **Runtime evidence:** staging execution IDs, tests, approved release, production run traces and health checks.
5. **Behavioral projection:** the visual boxes and connections built from the manifest and **verified against** deployed workflows and tests.

The behavioral map is a **projection**, never a separate agent-invented diagram. If any part cannot be verified, display it as *proposed, unverified, out of sync, or degraded* instead of presenting it as operational truth.

## Minimum product specification

Before generating workflows, record:

| Field | Questions |
|---|---|
| Goal | What business outcome must the system produce? |
| Actors | Who triggers and who can change it? |
| Entry points | Which chats, APIs, events or MCP tools invoke it? |
| Capabilities | What named actions and decisions must happen? |
| Contracts | What inputs, outputs, side effects and errors are allowed? |
| State and identity | What is remembered? Who owns each record? |
| External dependencies | Which credentials, providers, agents and data stores are used? |
| Failure behavior | What retries, stops, escalation and compensation exist? |
| Acceptance | What test cases demonstrate the desired result? |
| Release | What authorization, evidence and rollback are required? |

Specifications should describe **behavior and constraints**. They should not dictate node-by-node implementation unless a requirement genuinely depends on a particular capability.

## Change requests

A user change request updates the specification first. Agents show a **behavioral difference**: what new box, connection, decision, permission or outcome will change. Then they build and verify the new version in staging. No production claim until release evidence exists.

For a concrete UI rendering contract, read [Behavior-first interface](behavior-first-interface.md). For technical system composition, read [System model](system-model.md).

## Success criteria for an eventual product

- A non-programmer can correctly explain the trigger, key behavior, outcome and failure path of a system by viewing the default map.
- The map reflects the approved release version and cannot silently drift from workflow artifacts.
- A change can be expressed as desired behavior without requiring users to pick n8n node types.
- Every visual status has a corresponding verified evidence reference or is explicitly marked unverified.
- Technical and security information remains available when required for safety or authorized review.

**Not yet demonstrated:** user research, comprehension tests, map generation, proof of synchronization, or any live n8n runtime implementation.
