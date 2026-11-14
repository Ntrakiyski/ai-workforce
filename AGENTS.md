# Instructions for Coding and Research Agents

You are contributing to the `n8n-engineering-system` repository. This is a **research-first** repository, not a license to generate speculative n8n JSON.

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
