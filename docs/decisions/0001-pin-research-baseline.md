# ADR-0001: Pin n8n Research to a Release and Commit

- **Status:** Accepted as a repository documentation policy; no runtime test performed.
- **Date:** 2026-11-14

## Context

n8n changes frequently. Workflow shape, nodes, APIs and MCP tools may vary across releases, so a live `master` checkout is not an adequate engineering reference.

## Decision

Use **n8n `2.47.7`** and exact commit `d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063` as the initial research snapshot. Every future generator task must still inspect the client's actual target version and node inventory; an older/newer instance needs its own compatibility assessment.

## Consequences

- Source claims can be replayed against immutable GitHub permalinks.
- Version changes will require diffing affected facts, nodes and fixture tests.
- The 'latest' version label is temporary; commit hash is the durable reference.

## Alternatives rejected

- Always read `master`: non-reproducible and potentially prerelease behavior.
- Use only docs: misses implementation-specific edge cases.
- Use only community example workflows: lacks trustworthy correctness/version guarantees.

## Verification

- Release: https://github.com/n8n-io/n8n/releases/tag/n8n%402.47.7
- Commit: https://github.com/n8n-io/n8n/commit/d4dcb1b152a98fc31ea7c4ee6aecdc45c5c88063
