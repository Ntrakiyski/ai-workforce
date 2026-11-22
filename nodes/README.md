# Native n8n nodes

## BoxLite

[`n8n-nodes-boxlite`](n8n-nodes-boxlite/README.md) lets a workflow create an isolated
BoxLite box, run commands with real stdout/stderr, transfer files, inspect executions
and clean up the box. It also implements named-volume API operations, whose successful
runtime use is not verified on the current server.

- [Package source and installation](n8n-nodes-boxlite/README.md)
- [Review, fixes and local runtime evidence](n8n-nodes-boxlite/REVIEW.md)
- [Importable workflow examples](../workflow-examples/README.md)

## Proposed: Open WebUI

[Open WebUI native node idea and delivery gates](../docs/backlog/openwebui-community-node.md) records the future `n8n-nodes-gcc-openwebui` package. Use the BoxLite package as the implementation reference and a version-matched Open WebUI OpenAPI schema as the API source. **No Open WebUI node has been built or installed.** Employee-facing Open WebUI integration continues through native Pipes and Filters.

Each node package owns its dependencies and build. No package is automatically installed,
published to npm or deployed by adding it here. Do not commit credentials or built archives.
