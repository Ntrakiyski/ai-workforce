# Instructions for Coding and Research Agents

You are contributing to the `n8n-engineering-system` repository.

**Read first:** [Executive Decision Record](docs/strategy/executive-decisions-2026-11-15.md). This consolidates the accepted product choices in ADR-0002/0003/0004 and separates those **decisions** from **benchmarks and tools still unimplemented**. Do not reopen an accepted direction merely to reinvent existing SDK/skill capabilities, but test assumptions that remain explicitly open.

**Strategic architecture direction:** Read `docs/framework/README.md`, `docs/framework/system-model.md`, `docs/framework/interfaces-and-capabilities.md`, and `docs/framework/state-and-tenancy.md` before designing a new system. Follow ADR-0002. n8n is the principal visual execution environment, while state, auth, interfaces and third-party capabilities are explicit system boundaries. Do not conflate a workflow JSON file with a complete client system. This is a **research-first** repository, not a license to generate speculative n8n JSON.

## Human-facing product principle

**The intended human user wants to understand the system, not learn to program it.** Read [spec-driven development](docs/framework/spec-driven-product-development.md), [behavior-first interface](docs/framework/behavior-first-interface.md), and [ADR-0003](docs/decisions/0003-behavior-first-visual-abstraction.md).

- Describe **what a system does** in plain-language business capabilities, decisions and observable outcomes before listing nodes, code, or tools.
- In user-facing designs, default to an appropriately simplified behavior map; expose underlying n8n structure, logs and code as optional, authorized drill-down.
- Preserve critical information: warnings, identity and permissions, side effects, failure paths, costs, deployment state and unresolved risks may never disappear purely for visual simplicity.
- A behavior map is **derived from** a versioned system manifest, actual workflow references and test/deployment evidence. Never treat a diagram made from a prompt as verified runtime truth.
- No arbitrary "healthy", "tested", or "live" badges. If execution evidence is missing, mark it unknown/unverified.
- Treat 2027 positioning as our product strategy, not as a demonstrated universal trend. This interface and its fidelity checks are currently **design proposals**.

## n8n native skills and SDK research (November 2026)

Before planning or generating n8n workflows, inspect [official n8n skills](https://github.com/n8n-io/skills) using the `using-n8n-skills-official` routing guidance and applicable capability skill where available. Check the installed n8n instance's MCP tool schema and feature version before relying on a tool name.

Read `docs/research/n8n-native-primitives-and-community-2026-11.md` and `docs/research/creator-and-builder-ecosystem-2026-11.md` for resource discoveries. Prefer `@n8n/workflow-sdk` as the SDK-first candidate, subject to ADR-0004's benchmark and version checks; do **not** bypass original JSON contract, connection fidelity, approval or staging gates. Do not present third-party verified community nodes as audited safe for clients.

For approval/policy gates consult `docs/standards/human-approval-and-policy-gates.md`: authorization must be scoped to actual actor, tenant and action payload, time-limited, replay-protected, and verified before sensitive side effects.

## Official n8n building baseline

Follow [ADR-0004](docs/decisions/0004-adopt-official-n8n-skills-and-sdk.md) and [official toolchain](docs/framework/official-toolchain.md). We are **not** rebuilding the n8n SDK. Use upstream [n8n Skills](https://github.com/n8n-io/skills) and its `using-n8n-skills-official` router when installed, the official workflow SDK when supported, and scoped instance-level MCP where available. Our original work is system-level specifications, safety policy, reusable capabilities, tests, revision control and evidence-backed maps.

If the official skills/plugin or MCP is not installed/authenticated, clearly report that limitation and do not claim to have used it. If SDK methods do not support a required feature, use a documented alternative and retain all validation, staging and release gates.

## Additional tooling evaluations — not dependencies

Read [the source-level findings](docs/research/tooling-source-audit-2026-11-15.md), [the four-tool shortlist](docs/research/tooling-reuse-shortlist-2026-11-15.md) and [pilot plan](docs/roadmap/tooling-integration-pilots.md) before installing or replacing workflow construction, validation, QA or deployment tooling.

- Evaluate exactly four research candidates: `n8n-as-code`, `n8n-check`, official `@n8n/cli`, and `n8n-schema-generator`. The fifth proposal in the previous comparison was **explicitly excluded**; do not add it.
- Prefer `@n8n/cli` for supported authorized operations; test `n8n-as-code` as an **optional** GitOps/environment adapter, not as a competing default SDK or a second writer to the same workflows.
- Pin `n8n-check` test execution to the target n8n release and run synthetic, isolated fixtures; the documented default runner version is not automatically the target release.
- Demand complete coverage reporting from schema extraction; a skipped node must not be silently treated as validated. Verify node/credential versions match the target instance.
- Do not install any candidate, add write credentials, or claim runtime test success merely because its upstream README describes capabilities.
- Treat `n8n-schema-generator`'s committed n8n `1.120.10` snapshot as **incompatible research data** for 2.47.7 until exact source-derived regeneration and skipped-node accounting succeed. Do not expose its unauthenticated wildcard-CORS server on the internet.
- Treat `n8nac push` as potentially **live publishing** for published workflows. Never give an agent unapproved production push access. `push --verify` is not a dry run; use explicit reviewed dry-run promotion before any staged writes.
- The `.github/workflows/n8n-check-smoke.yml` fixture is an experimental test. Only completed CI run logs and results can establish real execution; configuration alone is not evidence.

## Mandatory operating procedure

1. Identify the target n8n **instance version, edition and deployment mode**. Use the pinned research baseline only for baseline research, not as a substitute for the target instance's exact version.
2. Before making an implementation claim, consult `docs/research/n8n-2.47.7-internals.md`, `docs/contracts/workflow-json.md`, and the relevant engineering standards.
3. Cross-check version-dependent behavior in the n8n source at the pinned commit, the official docs, or an appropriately versioned staging instance. Do not guess node parameters, `typeVersion`, credentials or expression syntax.
4. Cite sources with precise file/URL, revision or release, and evidence ID (see `research/evidence-index.json`). Mark each statement VERIFIED_SOURCE, VERIFIED_RUNTIME, PROPOSED_STANDARD, SECONDARY_CLAIM or UNVERIFIED.
5. For any new reusable pattern, define inputs, outputs, side effects, failure behavior, idempotency requirements, security assumptions, fixture cases and target version before accepting it.
6. Reject invalid graph structures, unknown nodes, unsupported versions, missing mandatory node parameters, unresolved credentials, broken expressions, unsafe side effects and untested recovery paths through separate gates.
7. Never claim an artifact was runtime tested if it has only been statically inspected. Do not fake execution IDs, screenshots, successful imports or test results.
8. Do not push or edit production workflows directly. Use a locked change branch or snapshot, isolated staging, independent review, approval and a rollback path.
9. Never put secrets, tokens, raw credentials or sensitive client data into this repository, exported JSON, fixtures, model prompts or analysis logs.
10. When uncertain, record a reproducible question in `docs/backlog/open-questions.md`; don't silently invent a rule.
11. When adding or changing a system capability, keep its human-facing box, graph edges, input/output contract, failure behavior and mapped n8n node/workflow references traceable to the same versioned specification.
12. Never label a user-facing behavior map production-ready based only on visual plausibility, passing JSON syntax checks or a successful agent-run summary.

## Research contribution format

- **Question:** Specific behavior or design decision.
- **Environment:** n8n release + commit; node type/version; deployment mode.
- **Evidence:** Official docs/source links, source lines or reproducible runtime trace.
- **Observation:** What was actually verified, narrowly stated.
- **Proposed rule:** What agents should do and when it is an exception.
- **Test:** How a second agent or deterministic script can reproduce/validate it.
- **Status:** One of the five evidence statuses defined above.

## Change procedure

- Update `docs/research/source-registry.md` and `research/evidence-index.json` for new facts.
- Put engineering rules under `docs/standards/`, not in raw source notes.
- Add significant trade-offs as ADRs under `docs/decisions/`.
- Run `python3 scripts/check_docs.py` before submitting documentation changes.
- No full skill installation or automatic production deployment until required quality gates exist.
