# Workflow examples

## BoxLite Guide

Import [`BoxLite-Guide.json`](BoxLite-Guide.json) after installing the
[BoxLite node package](../nodes/n8n-nodes-boxlite/README.md). Select your own **BoxLite API**
credential on its BoxLite nodes, then run manually. No credentials, instance workflow IDs,
saved execution data or production triggers are included.

The guide explains BoxLite and each implemented operation. Its 16-node manual path creates
a unique Alpine box, uploads a text file, transforms and downloads it, verifies contents,
inspects metrics, stops/starts and deletes the box. Nine sticky notes explain setup, outputs,
limits and failure behavior; nine disabled/disconnected nodes illustrate Volumes and async work.

**Side effects:** creates and deletes a box and writes files inside it. The default example
targets self-hosted `alpine:latest`; switching to Cloud may incur charges. It is not a
read-only workflow. Cancellation or process failure can bypass cleanup. Never substitute
a shared/reused box for the demo's unique box.

**VERIFIED_RUNTIME, evidence E-BOXLITE-001:** the configured local copy ran on single-instance,
Docker-hosted n8n 2.47.7 with self-hosted BoxLite v0.13.1. Execution 65 returned `ok: true`,
both verified files and `deleted: true`. Intentional download-error execution 63 deleted its
box before failing explicitly in the summary. Edition/license tier was not separately recorded.
Private raw traces are retained locally, not committed. These IDs are local evidence references,
not publicly accessible GitHub Actions runs or proof of another environment's compatibility.

**UNVERIFIED:** successful named-volume CRUD/persistence, Cloud write operations and visual
canvas layout. The tested server explicitly rejects named volumes. Diagnostic workflows
with temporary webhooks, test credentials or intentional API failures are not published here.

## Rebuild and verify

From the repository root:

```sh
npm ci --prefix nodes/n8n-nodes-boxlite
npm test --prefix nodes/n8n-nodes-boxlite
cp nodes/n8n-nodes-boxlite/examples/BoxLite-Guide.json workflow-examples/BoxLite-Guide.json
python3 tools/check_docs.py
```

The generator is `nodes/n8n-nodes-boxlite/scripts/build-guide.js`. Its package-local copy is
included in npm archives so installation and example links work outside this repository.
Keep the top-level example byte-identical to that generated copy.
