# Instructions for Coding and Research Agents

You are contributing to the `n8n-engineering-system` repository.

**Strategic architecture direction:** Read `docs/framework/README.md`, `docs/framework/system-model.md`, `docs/framework/interfaces-and-capabilities.md`, and `docs/framework/state-and-tenancy.md` before designing a new system. Follow ADR-0002. n8n is the principal visual execution environment, while state, auth, interfaces and third-party capabilities are explicit system boundaries. Do not conflate a workflow JSON file with a complete client system. This is a **research-first** repository, not a license to generate speculative n8n JSON.

## Human-facing product principle

**The intended human user wants to understand the system, not learn to program it.** Read [spec-driven development](docs/framework/spec-driven-product-development.md), [behavior-first interface](docs/framework/behavior-first-interface.md), and [ADR-0003](docs/decisions/0003-behavior-first-visual-abstraction.md).

- Describe **what a system does** in plain-language business capabilities, decisions and observable outcomes before listing nodes, code, or tools.
- In user-facing designs, default to an appropriately simplified behavior map; expose underlying n8n structure, logs and code as optional, authorized drill-down.
- Preserve critical information: warnings, identity and permissions, side effects, failure paths, costs, deployment state and unresolved risks may never disappear purely for visual simplicity.
- A behavior map is **derived from** a versioned system manifest, actual workflow references and test/deployment evidence. Never treat a diagram made from a prompt as verified runtime truth.
- No arbitrary "healthy", "tested", or "live" badges. If execution evidence is missing, mark it unknown/unverified.
- Treat 2027 positioning as our product strategy, not as a demonstrated universal trend. This interface and its fidelity checks are currently **design proposals**.

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
