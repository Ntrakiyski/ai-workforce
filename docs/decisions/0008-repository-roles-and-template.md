# ADR-0008 · Repository roles and specialist template

Accepted 24 November 2026.

## Context

More platforms will get specialists (LiteLLM, PostgreSQL/PostgREST, Logto and others appear in the wider platform). The first two specialists grew different layouts, which makes it hard for agents and people to know where things live.

## Decision

**Repository roles.**

| Repository | Owns |
| --- | --- |
| `ai-workforce` | Reusable, client-neutral know-how for building on each platform: skills, references, standards, starter packages, tests, joint examples |
| Platform control plane (e.g. `gcc-tech-stack`) | What is deployed and how it is operated: deployments, MCP adapters, operating rules, history |
| Client/project repositories | The concrete workflows, functions and apps for one client |

Dependency is one-way: control planes and client repos load ai-workforce specialists; ai-workforce never references a specific live instance, client data or secrets.

**Specialist template.** Every `<platform>-dev/` copies [`_template/`](../../_template/TEMPLATE.md): `SKILL.md` (routing table), `AGENTS.md`, `README.md` (capability/evidence table), `CHANGELOG.md`, `references/`, `docs/{decisions,research,roadmap.md}`, `packages/`, `examples/`, `scripts/`, `tests/`. Planned work is listed in `docs/roadmap.md` rather than empty folders.

**Shared root.** Cross-platform contracts in `docs/contracts/`, shared rules in `docs/standards/`, multi-specialist examples in `joint/`, repository checks in `tools/`.

## Consequences

`tools/check_docs.py` reports template gaps (warning first, `--strict` once all specialists comply). Existing specialists are migrated in follow-up changes.
