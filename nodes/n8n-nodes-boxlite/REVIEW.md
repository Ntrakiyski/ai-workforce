# BoxLite self-review — 2026-11-16

Scope: the full untracked `n8n-nodes-boxlite` package (node, transport, attach, tar,
credential, tests, and README), not unrelated pilot changes. Reviewed before fixes;
line numbers below refer to that snapshot. User requested review **and fixes**.

## Findings

1. **High — upload destination ambiguity** (`nodes/BoxLite/BoxLite.node.ts:827–832`).
   `cp -a source destination` succeeds when destination is a directory by copying *inside*
   it. Upload then reports the directory itself as a file, with the input hash rather than
   the bytes at the claimed path. Reject directory/symlink destinations before finalization.
2. **High — output capture cap is not a cap** (`nodes/BoxLite/attach.ts:82–88`).
   A single frame can exceed the remaining 1 MiB allowance and is retained whole. The
   successful return path (`BoxLite.node.ts:731–739`) also drops the truncation warning.
   Slice by remaining bytes, bound individual WebSocket messages, and expose truncation.
3. **Medium — execution status and errors lost** (`BoxLite.node.ts:731–762`).
   Every exit frame is called `completed`, even when the status endpoint says `killed`
   or `timed_out`; `error_message` is discarded on polling paths. Read authoritative
   status, retain error details and attach notes. Poll requests also need bounded timeouts.
4. **Medium — changed argv** (`BoxLite.node.ts:689`). Empty arguments are filtered out,
   shifting positional parameters and making commands that intentionally pass `""` incorrect.
5. **Medium — missing item pairing** (`BoxLite.node.ts:475–480`). Box, Command and
   Execution outputs lack explicit `pairedItem`, making expressions unreliable in multi-item flows.
6. **Medium — incomplete and potentially endless pagination** (`BoxLite.node.ts:642–658`).
   Limit mode only reads page one even when more results are requested. Return All loops
   forever if a server repeats its page token. Continue to the requested count and reject cycles.
7. **Medium — incorrect root-directory file paths** (`BoxLite.node.ts:873–879,979–984`).
   Downloading `/` with files across multiple top-level directories gives every item `path: "/"`.
   Determine directory roots from tar directory headers and the requested basename, not just
   a shared file prefix. Validate archive entry paths before exposing them downstream.
8. **Medium — archive metadata amplification** (`tar.ts:42–63`). The byte cap does not
   bound the number of zero-byte entries. A modest tar can create hundreds of thousands of
   output objects. Limit entry count as well as payload bytes and reject unsafe member names.
9. **Medium — safety defaults can be bypassed** (`BoxLite.node.ts:948`, `transport.ts:154–156`).
   Explicit zero/NaN download limits fall back to 100 MiB, and a non-stream binary response
   is returned without checking the cap. Validate configured numbers and check both paths.
10. **Medium — reuse race** (`BoxLite.node.ts:618–637`). With `If exists: reuse`, two runs
    can both observe 404; the loser of Create gets a name-conflict failure instead of reusing
    the winner. Retry the name lookup on 409 only for reuse mode.

11. **Medium — malformed WebSocket control frames** (`attach.ts:92–101`). JSON `null`
    parses successfully but dereferencing `control.type` throws inside the event handler;
    a missing exit code also becomes invented `-1`. Guard the control shape and fall back
    to authoritative status instead of inventing process results.
12. **Medium — invalid lifecycle combination in the guide** (live execution 59).
    Equal auto-stop/auto-delete values are rejected by self-hosted v0.13.1. Create now
    rejects a non-zero auto-delete at or below auto-stop before HTTP; the demo uses 5/15 minutes.

## Non-findings and boundaries

- API secrets stay in n8n credentials; no keys belong in the documentation workflow/export.
- Shell values are separate argv entries, not interpolated into the script; directory
  validation and unique upload staging already protect the main injection/deletion paths.
- Tar downloads are not extracted onto the n8n host filesystem; path validation is defense
  for downstream consumers, not a claim of an existing host extraction exploit.
- Named-volume success remains unverified: the test server explicitly does not support it.
- No changes to unrelated Gmail workflows, credentials or job-service code are in scope.

## Fix/verification record

- All findings above were fixed, with regression coverage. The first expanded run reproduced
  15 failures before the fixes; the final suite has **36 passed, 0 failed**.
- Rebuilt, packed and installed the reviewed package in the local n8n instance.
- Created one guide, workflow `THwHtu5glI0HTWGw`: 34 nodes (9 sticky notes, 16-node manual
  demonstration, 9 disabled/disconnected references). The portable export has no credentials.
- Guide execution **60** succeeded: uploaded input SHA-256 matched the downloaded file;
  output was `HELLO FROM N8N\n`; stdout/stderr were captured; metrics, stop/start and deletion
  succeeded. The Code node binary helper ran successfully in n8n's task runner.
- Core execution **61** returned real stdout/stderr with exit code 3 and deleted its box.
  Files execution **62** verified the 4 KiB payload and all four directory files.
- Deliberately broke the guide's Download path for execution **63**: it retained HTTP 404,
  continued through deletion, and failed explicitly in Run summary after cleanup. The
  temporary test definition/webhook was removed in `finally`, restoring the manual-only guide.
- Live Execution List returned only the main session on this server, not finished commands.
  Guide notes now state that limitation rather than promising a complete command history.
- After that note correction, repacked/reinstalled and verified guide execution **65** again
  (`ok: true`, two files, real output, deletion). Edge execution **64** verified long filenames,
  preserved existing directories, staging cleanup, download caps, detailed 404 and unsupported volumes.
- Named-volume success/persistence and Cloud writes are still unverified. No Cloud resources
  created; unrelated workflows and credentials preserved. Canvas layout was structurally
  checked, not visually browser-verified (BrowserOS tools unavailable).
