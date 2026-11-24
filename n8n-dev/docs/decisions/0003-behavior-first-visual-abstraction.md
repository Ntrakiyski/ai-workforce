# ADR-0003: Make system behavior the default human interface

- **Status:** Accepted as product direction; implementation pending.
- **Date:** 2026-11-14.
- **Related:** [ADR-0002](0002-n8n-native-systems-framework.md); [Behavior-first interface](../framework/behavior-first-interface.md).

## Context

Users who build products with agents can specify outcomes but may not read source code or follow detailed agent traces. An n8n technical workflow canvas is more inspectable than arbitrary code, yet may still expose low-level information that is unnecessary for business decisions.

Our intended audience **wants to understand the product without needing to learn every technology used to build it**. We need an abstraction above raw code, agent tool logs and n8n node configuration.

## Decision

1. **System behavior is the default interface.** Show business-level boxes, icons, explicit decisions, connections, outputs and failure routes.
2. **Make the map a faithful projection**, derived from versioned system contracts and deployed n8n workflow artifacts, checked against real staging/runtime evidence. Never fabricate a happy-path diagram.
3. **Progressive disclosure:** show the system map first, capability details on request, and technical evidence to authorized users.
4. **Use a context budget:** offer exactly enough information for the next decision; always surface meaningful uncertainty, high-impact effects and security concerns.
5. **Spec-first changes:** users describe what should change, not how to change nodes. Agents plan, implement, test, and compare behavioral changes before release.
6. **Retain developer escape hatches:** raw n8n, logs, configuration and code inspection remain available where needed and permitted.
7. **Visual status is evidence-bound:** distinguish planned, built, staging-verified, released, degraded and unknown states.

## Alternatives considered

- **Code/diff as default:** precise for developers but inappropriate as a mandatory interface for our target audience.
- **Agent transcript as default:** shows what an agent attempted, not necessarily the deployed product or its behavior.
- **Raw n8n canvas as default:** useful for technical inspection but node-level details can overwhelm an operations-oriented user.
- **Static diagram generated from a prompt:** easy to present but can drift from deployments and conceal failures; rejected.
- **No technical access:** would obstruct debugging, independent auditing and safe operation; rejected.

## Consequences

- Implement a system manifest, mapping from business capabilities to workflows/nodes, a behavior-map generator and consistency checks.
- Every box and status needs a source reference and version linkage.
- The roadmap must include usability and fidelity tests, not only n8n JSON correctness.
- Production authorization, permissions and safety notices stay explicit even in the simplified interface.
- Treat the 2027 product-development positioning as a **strategy thesis**, not a fact about market adoption.

## Next validation step

Prototype a single multi-interface, tenant-safe customer support system. Generate its business-level view from the same manifest used to describe its n8n implementation. Verify that the diagram correctly reflects success, denial, error, escalation and release states when staging executions are exercised.
