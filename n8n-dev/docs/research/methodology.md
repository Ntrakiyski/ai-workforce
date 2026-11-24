# Research Methodology and Evidence Policy

## Purpose

Turn n8n implementation facts, documentation, existing workflow examples and observed failures into reusable engineering rules with testable justification. Avoid treating community templates or LLM-generated instructions as authoritative.

## Evidence hierarchy

1. **VERIFIED_RUNTIME:** Reproduced on an isolated n8n instance with recorded version, configuration, fixture, commands and observed output. Strongest evidence for actual behavior in that environment.
2. **VERIFIED_SOURCE:** Inspected exact version/commit in n8n code or authoritative product documentation. Source code may not capture environmental variation; record what was actually examined.
3. **PROPOSED_STANDARD:** Our design or security convention, with rationale. It may be correct engineering without being an n8n requirement.
4. **SECONDARY_CLAIM:** Community workflow, blog, repo README, discussion or vendor self-report. Requires independent validation before it becomes a normative rule.
5. **UNVERIFIED:** Hypothesis or planned investigation with no direct evidence yet.

A claim can carry multiple evidence entries (e.g. VERIFIED_SOURCE + VERIFIED_RUNTIME); the most specific versioned result controls. Treat docs and source disagreements as research tasks, not silently resolved facts.

## Evidence record shape

Each record in `research/evidence-index.json` contains:

- `id` stable evidence identifier;
- `claim` narrowly worded observation;
- `status` using the vocabulary above;
- `source_type` (source, official_docs, third_party_repo or inference);
- `url` canonical URL, preferably an exact commit for source files;
- `n8n_version` for version-dependent claims;
- `source_commit` as applicable;
- `checked_at`, `notes`, and optional next experiment.

## Source collection process

1. Write a specific hypothesis: e.g. 'Does workflow structural validation require node typeVersion on import?'
2. Find the tagged implementation; record URL and exact source lines or symbols.
3. Compare official documentation, API contract and exported workflow samples.
4. Create positive and negative fixtures, including an edge case.
5. Run them on an isolated matching n8n version; record exact response, visible import state and execution state.
6. Draft a rule that separates **native constraints** from **our stronger quality policy**.
7. Connect the rule to a deterministic check and regression fixture.
8. Update evidence index and compatibility matrix when n8n versions change.

## Research sampling for workflow corpora

- Start with n8n's official workflow templates, then curated open-source repositories.
- Record upstream URL, license, author, version hints, nodes, approximate age, side effects and imported status.
- Deduplicate identical or near-identical graphs; avoid inflating counts from forked collections.
- Evaluate actual patterns by task category and risk, not stars/download count.
- Redact tokens, webhook URLs, credential names and customer data before storing samples.
- Mark a template 'example only' until import/fixture tests succeed on a pinned target version.

## Reverse-engineering with REA

For n8n, source analysis is the default: this is an available source project. Use [REA](https://github.com/morluto/rea) when a specific question requires inspection of compiled JavaScript/Electron output or runtime behavior not resolved by source and docs. Save observed evidence and limitations; REA is not itself a canonical n8n schema oracle. Do not run invasive inspection against a third-party instance without authorization.

## Quality of documentation

- Every normative `MUST` or `MUST NOT` in a proposed standard explains scope, exception and validation approach.
- Avoid unsupported numerical thresholds such as 'split after 20 nodes'.
- Clearly label unimplemented scripts, future integrations and tests.
- Prefer official documentation canonical URLs and immutable GitHub commit permalinks.
- Review version drift on each targeted n8n upgrade.
