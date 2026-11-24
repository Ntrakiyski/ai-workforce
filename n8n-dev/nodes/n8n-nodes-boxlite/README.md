# n8n-nodes-boxlite

BoxLite microVM sandboxes as a native n8n node: create a box, run a command, read its real
stdout/stderr, delete the box. Works against BoxLite Cloud and a self-hosted `boxlite serve`.

## Interactive documentation workflow

Import [`examples/BoxLite-Guide.json`](examples/BoxLite-Guide.json) into n8n. It is one canvas with
“what/why/how” notes, connection instructions, **every implemented operation**, troubleshooting,
and a runnable manual example. `npm run build` regenerates it from `scripts/build-guide.js`.

Select your **BoxLite API** credential on the enabled BoxLite nodes, then **Execute Workflow**.
The demo targets self-hosted `alpine:latest`: list → create a uniquely named box → upload a tiny
text file → execute → inspect executions → download and verify both files → metrics → stop/start
→ delete → summary. Intermediate errors flow through cleanup and the summary then fails explicitly.
There is no production webhook or schedule. Cancellation/crashes can bypass cleanup; inspect boxes
after an interrupted run. Auto-stop/auto-delete are set as a fallback where the server supports them.

Volume and async examples are **disabled and disconnected reference nodes**, not extra live branches.
Volume success needs a capable server. Async references are a recipe, not an automatic polling loop.
The exported workflow contains no credential IDs or secrets. Use the existing credential locally;
do not paste keys into nodes or sticky notes. Switching the demo to Cloud can incur charges.

## Install (self-hosted n8n)

```sh
npm install            # dev dependencies
npm run build
npm test               # build + isolated API/tar tests
npm pack               # -> n8n-nodes-boxlite-0.1.0.tgz
```

Then, with the container name of your n8n instance:

```sh
docker cp n8n-nodes-boxlite-0.1.0.tgz <n8n-container>:/tmp/
docker exec <n8n-container> sh -c \
  'cd /home/node/.n8n/nodes && npm install --omit=dev --legacy-peer-deps --no-audit --no-fund /tmp/n8n-nodes-boxlite-0.1.0.tgz'
docker restart <n8n-container>
```

`--legacy-peer-deps` is required: without it npm tries to compile `isolated-vm` from source and fails
inside the n8n image.

Do **not** use `N8N_CUSTOM_EXTENSIONS` for this package. It loads the folder under the synthetic
package name `custom-nodes`, so the node type becomes `custom-nodes.boxLite` and workflows referring to
`n8n-nodes-boxlite.boxLite` fail with `Unrecognized node type`.

## Credential: BoxLite API

| Field | Cloud | Self-hosted |
| --- | --- | --- |
| API Key | `blk_live_…` (required) | empty for a permissive server, or the `--api-key` value |
| Base URL | `https://api.boxlite.ai` | `http://host.docker.internal:8100` when n8n runs in Docker, `http://127.0.0.1:8100` when it runs on the host |
| Path Prefix | leave empty | leave empty unless routes are mounted at `/v1/{prefix}/boxes` |

The credential test calls `GET /v1/boxes`. A permissive server accepts the placeholder bearer, so a
blank key still tests green.

## Operations

**Box**

- Create — image, optional name, `If a Box With This Name Exists: fail | reuse`, CPUs, memory, disk,
  working directory, env, auto-stop, auto-delete
- Get, List, Start, Stop, Delete (force), Metrics

**Command**

- Execute — command plus argv entries, optional env, working dir, user, server-side timeout, and
  `Max Wait (Seconds)`. Output is streamed over the execution WebSocket, so `stdout` and `stderr` are
  the real streams and `exit_code` is the process exit status.

**Execution**

- Get, List

**File**

- Upload — takes an n8n binary property (`data` by default), a destination directory (`/workspace`
  by default), and an optional filename. Returns `path`, `file_name`, `bytes` and `sha256`.
- Download — accepts a file or directory; returns one item per regular file with an n8n binary
  property, `path`, `relative_path`, `file_name`, `bytes` and `sha256`. Directories preserve nested
  relative paths; symbolic links are skipped. Empty directories produce a clear “No files found” error.
- Max Download Size defaults to 100 MiB and counts the tar headers as well as file contents. The
  response stream is aborted when it crosses the limit; this is not a total process-memory budget.
- Downloads reject unsafe archive paths and archives with more than 10,000 entries. Entry count
  includes directory and skipped link headers, not only the emitted regular files.
- The file API cannot reach `/tmp` on the tested server. Use `/workspace` or another reachable path.
- Upload uses a unique temporary directory inside the destination, then a short `sh` command with
  `cp`, `rm` and `rmdir` to normalize the server's `extracted/` staging layout. Those tools must exist
  in the image. Existing regular files of the same name are overwritten; directory and symbolic-link
  targets are rejected instead of silently copying inside/following them. Successful uploads remove their
  staging directory; a failed transfer/finalization can leave `.n8n-boxlite-…` for inspection.
- Box operations return API JSON, not the incoming binary data. If a binary-producing node comes
  before Box → Create, use a Merge or Code node after Create to restore that binary before Upload.

**Volume**

- Create (optional name), List, Get and Delete. Get/Delete accept an ID or name. List returns the
  server's `{volumes: [...]}` envelope, consistent with Box → List. Delete defaults to **Force off**.
- Box → Create → Volume Mounts attaches managed volumes by ID or name at an absolute guest path,
  optionally read-only. Reusing an existing box does not change its mounts.
- **Requires server support.** The tested self-hosted v0.13.1 returns HTTP 400,
  `unsupported: named volumes are not supported yet`. The node surfaces this rather than pretending
  a volume exists. Successful volume CRUD and cross-box persistence still need a capable server.

## Behaviour worth knowing

- A non-zero exit code is **data**, not a node error: the item comes back with `exit_code`, `stdout`
  and `stderr` so you can branch on it. Only transport and API failures throw.
- Command arguments are passed exactly, including intentional empty strings. Shell scripts remain
  your responsibility: do not interpolate untrusted workflow input into a `sh -c` script.
- Output capture is capped at **1 MiB combined stdout/stderr**, with `output_truncated: true` and a
  note when cut short. `output_captured: true` means the output socket reached its exit frame, not
  that output was unlimited. Individual WebSocket messages above 2 MiB fail attach explicitly.
- Execution status comes from the status endpoint even after an output exit frame; killed/timed_out
  and `error_message` are not relabelled as successful completion.
- `Max Wait` is a client-side ceiling, not a kill switch. Past it the node returns
  `status: "running"` with the `execution_id` (and `output_captured: false`), so a Wait node can poll
  `Execution → Get` later.
- JSON API requests default to 30-second timeouts; status requests use only their remaining wait
  budget. Binary transfers use a 60-second transport timeout. These are not command kill switches.
- Turn off `Capture Output` to skip the WebSocket and rely on status polling only.
- `Environment` is a JSON object (for example `{"FOO":"bar"}`), not a list of `KEY=value` lines.
  Numbers are stringified; nested objects are rejected; invalid JSON fails the node with a clear
  message instead of silently running without the variables.
- `Auto-Stop` and `Auto-Delete` are entered in **minutes**. The API takes seconds, and the node
  converts (15 → 900), so the box is not stopped after 15 seconds.
  When both are non-zero, Auto-Delete must be greater than Auto-Stop on the tested server.
- Cloud stops an idle box after 15 minutes; in-box work does not count as activity. Use `Auto-Stop`
  and `Auto-Delete` deliberately, and delete boxes you no longer need.
- Cloud only accepts the image aliases `base`, `python` and `node`. A self-hosted server accepts any
  OCI reference such as `alpine:latest`.
- Optional fields are omitted rather than sent empty, because older self-hosted servers reject unknown
  or blank fields.
- Every resource preserves n8n item links. Box List follows pages up to Limit (or all pages for
  Return All), and rejects repeated tokens rather than looping forever. List operations return arrays
  inside an envelope; use Split Out if you want one item per listed object.

## Verified

Built and tested against `boxlite serve` v0.13.1 on n8n 2.47.7: create → exec → delete with
`exit_code: 3`, `stdout: "hello-from-node\n"`, `stderr: "oops\n"`; wait-ceiling handoff; name reuse;
`List`; `Stop`/`Start`/`Get`/`Metrics`; environment variables at create and exec time; `auto_stop` and
`auto_delete` unit conversion; and 401/404 error surfacing. Details in `../boxlite-node-plan.md`.

Files were also tested through real n8n workflows: binary and nested-directory downloads, matching
SHA-256 before upload/inside the box/after download, a 124-character filename, preservation of an
existing `extracted/` directory, and the download size ceiling. Volume request contracts and mounts
are covered by isolated tests; live volume success and Cloud write operations are **not verified**.
