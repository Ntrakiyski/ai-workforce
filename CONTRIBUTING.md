# Contributing Research and Engineering Rules

Read [AGENTS.md](AGENTS.md), [methodology](docs/research/methodology.md), and [evidence index](research/evidence-index.json).

## New research finding

Provide (1) a narrowly scoped question, (2) version/commit, (3) source or runtime trace, (4) what was observed, (5) what remains uncertain, (6) a recommended rule if warranted, and (7) the acceptance test that would establish the rule.

## New pattern

Include a contract, prerequisites, input/output examples, target n8n version, external side-effect analysis, error/retry behavior, fixture tests, expected outputs and a demonstration of real staging execution. Do not commit client credentials or private payloads.

## Updating n8n baseline

Create a new ADR, preserve prior evidence and fixtures, diff changed source/metadata, run compatibility tests and update only affected rules. **Do not** silently rewrite source claims to match a moving target.

## Local checks

```bash
python3 scripts/check_docs.py
python3 -m unittest discover -s tests -v
```
