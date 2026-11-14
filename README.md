# n8n Engineering System

> **Status:** Documentation baseline / research in progress. Not a production-ready n8n workflow generator or validated skill.
>
> **Research baseline:** n8n `2.47.7` (release 2026-11-13), commit [`d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063`](https://github.com/n8n-io/n8n/commit/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063), checked 2026-11-14. Target deployment versions must be checked independently.

## Purpose

Build a source-grounded, version-aware engineering knowledge system that enables AI agents to **design, generate, explain, validate, test, review, and improve n8n workflows** without rediscovering n8n behavior on every client project.

The intended product output is more than one JSON file: validated **workflow JSON + visual architecture + test evidence + release manifest**. n8n is the inspectable execution layer; MCP enables discovery/operations; research and engineering standards constrain generation; independent testing gates changes before release.

## What this repository is *today*

An auditable documentation and research baseline. It has early engineering *proposals* and confirmed source-code observations. It **does not** claim full n8n schema coverage, production deployment validation, or exhaustive reverse-engineering. A first-party n8n staging environment has not been exercised as part of this baseline.

## Start here

1. [Project charter](docs/vision.md): outcomes, product boundaries, non-goals.
2. [System architecture](docs/architecture/system-overview.md): components, trust and execution boundaries.
3. [Research methodology](docs/research/methodology.md): evidence levels and reproducible investigation.
4. [Source registry](docs/research/source-registry.md): prioritized primary and secondary sources.
5. [n8n internals](docs/research/n8n-2.47.7-internals.md): first verified source findings.
6. [JSON contract](docs/contracts/workflow-json.md): the difference between structural, semantic, runtime and release validity.
7. [Engineering rulebook](docs/standards/architecture.md): decision criteria, not arbitrary node-count rules.
8. [Quality gates](docs/testing/quality-gates.md) and [roadmap](docs/roadmap.md).
9. [AGENTS.md](AGENTS.md): operating rules for AI contributors.

## Directory map

```text
n8n-engineering-system/
  AGENTS.md                       Agent contribution rules
  docs/
    architecture/                 Agent/platform architecture
    contracts/                    Output and workflow JSON contracts
    research/                     n8n internals, provenance, tooling and methodology
    standards/                    Normative proposed engineering rules
    testing/                      Acceptance criteria and quality gates
    decisions/                    Architecture decision records (ADRs)
    backlog/                      Open questions and research tasks
  research/evidence-index.json    Machine-readable findings with statuses
  schemas/                        Reserved for versioned schema snapshots
  patterns/                       Reserved for parameterized, tested workflow recipes
  integrations/                   Reserved for connector-specific guidance
  validators/                     Reserved for the n8n validation implementation
  skills/                         Reserved for installable agent skills
  scripts/check_docs.py           Local documentation consistency check
  tests/                          Documentation-check tests; n8n runtime tests later
  artifacts/                      Empty until generated and verified
```

## Ground rules

- **Do not equate JSON parsing with n8n importability or runtime correctness.** n8n itself separates structural checks from semantic/publish checks.
- **Pin every source** to a revision/version; label unsupported inferences and open questions.
- **Keep secrets out of exports.** n8n warns workflow exports can include credential names/IDs and request auth headers. Sanitize before sharing.
- **No direct client production edits by generative agents.** Stage, independently validate, review and require the configured release authorization.
- **Prefer reusable n8n nodes/sub-workflows** when the implementation remains legible and behaviorally correct; custom code is a justified exception, not a ban.
- **Treat template repositories as examples, not authority.** Import and execute representative patterns before approving them.

## Current deliverable status

| Deliverable | State |
|---|---|
| Repo skeleton and architecture plan | Documented |
| Version-pinned source and source registry | Documented |
| Initial workflow JSON semantics | Source-verified subset |
| Full node schemas and integration catalog | Not built |
| Pattern library with tested JSON | Not built |
| Deterministic n8n validator | Not built |
| Staging test harness | Not built |
| Installable expert skill | Not built |

## Verification

```bash
python3 scripts/check_docs.py
python3 -m unittest discover -s tests -v
```

These commands check **documentation consistency only**; they do not validate n8n workflow JSON.

## Sources and attribution

Every factual n8n statement should carry a source URL or evidence ID. See [evidence index](research/evidence-index.json) and [source registry](docs/research/source-registry.md). Third-party repositories are not vendored in this baseline; their licenses and reuse rights must be reviewed before copying content.