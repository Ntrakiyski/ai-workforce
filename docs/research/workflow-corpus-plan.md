# Workflow Corpus Collection and Analysis Plan

**Status:** Research design only. No workflows have been imported, executed or scored.

## Candidate sources

1. Official n8n workflow templates (preferred starting point).
2. https://github.com/enescingoz/awesome-n8n-templates
3. https://github.com/zengfr/n8n-workflow-all-templates
4. The template catalog described by https://github.com/czlonkowski/n8n-mcp
5. Public issue reports with reproducible JSON and verified fixes.

## What to capture per workflow

```json
{
  "source_url": "https://example.invalid/source",
  "license_reviewed": false,
  "n8n_version_hint": null,
  "node_types": [],
  "node_type_versions": {},
  "nodes_count": null,
  "subworkflow_refs": [],
  "external_side_effects": [],
  "error_strategy": "unreviewed",
  "credentials_redacted": false,
  "duplicate_hash": null,
  "import_status": "not_run",
  "runtime_status": "not_run",
  "reviewer": null
}
```

The URL above is fictional, and this is an *internal research record proposal*, not a n8n workflow.

## Selection method

Deduplicate by normalized structure, categorize by business problem, filter sensitive data and incompatible licenses, inspect versioned node configurations, select representative examples, and run staging smoke/failure tests. Prefer **useful differences** across categories rather than copying near-duplicate marketing examples.

## Analysis questions

- Which patterns make complexity legible while preserving resilience?
- Where do errors become silent due to 'continue on fail'?
- How often are state, pagination and rate limits handled explicitly?
- What criteria predict that a sub-workflow improves maintainability?
- Which nodes and parameters have drifted across releases?
- Do linked items, expressions and branch merges preserve semantic intent?

## Proposed quality score dimensions

Architecture clarity, testability, parameter correctness, version compatibility, security, retry/idempotency, observability, maintainability and source provenance. Don't publish numeric scores before defining and testing a rubric.
