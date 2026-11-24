// Generates a portable, credential-free n8n documentation workflow.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const nodes = [];
const connections = {};
const id = (name) => createHash('sha256').update('boxlite-guide:' + name).digest('hex').slice(0, 32);
function add(name, type, parameters, position, extra = {}) {
	const n = { id: id(name), name, type, typeVersion: type === 'n8n-nodes-base.code' ? 2 : 1, position, parameters, ...extra };
	nodes.push(n);
	return n;
}
function note(name, content, position, width, height, color = 4) {
	return add(name, 'n8n-nodes-base.stickyNote', { content, width, height, color }, position);
}
let x = 0;
function step(name, resource, operation, parameters = {}, description = '') {
	const n = add(name, 'n8n-nodes-boxlite.boxLite', { resource, operation, ...parameters }, [x, 1080], {
		notes: description, notesInFlow: true, ...(operation !== 'create' ? { onError: 'continueRegularOutput' } : {}),
	});
	x += 240;
	return n;
}
function code(name, jsCode, description = '') {
	const n = add(name, 'n8n-nodes-base.code', { mode: 'runOnceForAllItems', jsCode }, [x, 1080], {
		notes: description, notesInFlow: true, onError: 'continueRegularOutput',
	});
	x += 240;
	return n;
}
function link(a, b) { connections[a.name] = { main: [[{ node: b.name, type: 'main', index: 0 }]] }; }

note('Start here — What is BoxLite?', `# BoxLite • field guide
## What it is → how to connect → how the nodes fit together
BoxLite runs commands inside hardware-isolated microVM boxes. This community node wraps its REST API and execution WebSocket, so n8n can create a box, run work, move files, inspect status and delete the box without a chain of HTTP nodes.

**Read left to right.** The middle row is a runnable, manual-only example. The lower row is a disabled reference library. Opening this workflow does not run anything. There is no webhook or schedule.

**Before Execute Workflow:** select your **BoxLite API** credential on the BoxLite nodes. This example is configured for **self-hosted alpine:latest**, not Cloud. It creates a uniquely named box per execution and deletes only that box. The run can incur cost if you switch to Cloud.`, [0, -100], 3780, 370, 5);

const chapters = [
	['01 · Connect', `## 01 / Connect once
Choose **BoxLite API** on each BoxLite node.

**Self-hosted from Docker**
- Base URL: \`http://host.docker.internal:8100\`
- API Key: your server's \`--api-key\` value, or blank only for a trusted permissive server.
- Path Prefix: blank for ordinary \`boxlite serve\`.

**Self-hosted from the host**
Use \`http://127.0.0.1:8100\` instead.

**Cloud**
Base URL: \`https://api.boxlite.ai\`; use your Cloud key and a supported image alias (\`base\`, \`python\`, \`node\`). Cloud write paths are not live-verified here.

Do not append \`/v1\` to Base URL. Prefix is only for routes mounted at \`/v1/{prefix}/…\`.

The credential test lists boxes. Secrets belong in credentials, never in nodes, sticky notes or exports. Use TLS outside a trusted local network.`, 4],
	['02 · Boxes', `## 02 / Box lifecycle
**List → Create → Get** starts the demo.

- **Create:** image, optional name, CPUs, memory, disk, working directory, JSON environment, idle auto-stop and auto-delete.
- **Get:** inspect one box by ID or name.
- **List:** returns \`{boxes: [...]}\`; Limit follows pages, Return All reads every page.
- **Metrics:** CPU and memory data.
- **Stop / Start:** change lifecycle state.
- **Delete:** permanently removes the box. Force permits deleting a running box.

Auto-stop/auto-delete inputs are **minutes**; the wire uses seconds. Zero leaves the server default. When both are set, auto-delete must be greater than auto-stop on the tested server (demo: 5 / 15 minutes).

**Reuse** finds an existing named box, but does not update its image, env or mounts. Do not blindly delete a reused box.

This example deliberately uses **Fail**, not Reuse, and names its box with the execution ID. Only a box created by this run is cleaned up.`, 4],
	['03 · Commands and executions', `## 03 / Run work and inspect it
**Run command** uses \`sh -c\` to read the uploaded file and create an output file. Arguments are separate argv values; empty strings are preserved. Prefer argv over interpolating untrusted text into a shell script.

Output fields:
- \`box_id\`, \`execution_id\`, \`status\`
- \`exit_code\`, \`stdout\`, \`stderr\`
- \`output_captured\`, \`output_truncated\`
- optional \`error_message\` and \`note\`

**A non-zero exit is data, not a node error.** Check exit_code explicitly. Server status (completed / killed / timed_out) is authoritative.

**Execution → Get** reads one command's status; **List** returns the server-reported execution/session list, which may omit finished commands. Neither retrieves stdout/stderr. The demo uses both.

Output capture uses WebSocket binary channels, not the status response. At 1 MiB combined output is truncated; inspect the flag/note. Save larger results as files.`, 4],
	['04 · Binary files', `## 04 / Files in and out
**Make input file → Upload → Run command → Download → Collect files** is the file example.

- **Upload:** Input Binary Field defaults to \`data\`. Destination is a directory; File Name is optional. Returns path, file_name, bytes and SHA-256.
- **Download:** accepts a file or directory; produces one n8n binary item per regular file with path, relative_path, file_name, bytes and SHA-256.

Use \`/workspace\`, **not /tmp**: the tested server's file API cannot reach the /tmp mount. Upload needs sh, cp, rm and rmdir in the image. Existing files are overwritten; directories and symbolic-link targets are refused.

Max Download defaults to 100 MiB **including tar headers**. Archives are limited to 10,000 entries. Unsafe tar paths are rejected; symbolic links are skipped. These are not total RAM limits.

Box operations return API JSON, not incoming binaries. Generate the binary after Create, as here, or restore it with Merge/Code. Collect fan-out before cleanup: otherwise Delete could run once per downloaded file.`, 4],
	['05 · Wait and failure behavior', `## 05 / Waiting, failures and cleanup
Wait for Completion defaults on; Max Wait defaults to 120 seconds. **Max Wait does not kill the command.** At the ceiling, continue with an n8n Wait node and Execution → Get.

Server-side Timeout is different: it limits command runtime when supported. Execution states other than completed/killed/timed_out are not terminal.

If attach fails, status polling still works, but \`output_captured: false\` warns that silence is not proof of no output. Keep the IDs for inspection.

HTTP/API errors normally stop a node. **Continue On Fail** keeps \`error\`, \`description\` and \`httpCode\` (where available) for routing.

The demo deliberately continues through intermediate errors, runs Delete, then reports failures in **Run summary**. Its Code nodes also run once for all items. Cancellation, process crashes or Create failing after remote acceptance cannot guarantee cleanup; use auto-stop/delete and inspect leftovers.`, 3],
	['06 · Troubleshoot and boundaries', `## 06 / Troubleshoot
- **401:** wrong/missing key or mismatched credential.
- **404 box:** wrong box ID/name or already deleted.
- **404 file:** the source path does not exist.
- **400 unsupported volumes:** expected on the tested self-hosted v0.13.1. Not a bad node configuration.
- **No binary data:** wrong property name or an upstream node dropped the binary.
- **Upload finalization failed:** check the reported staging path/execution; the target must not be a directory/symlink and the image needs shell tools.
- **Output unavailable:** check proxy WebSocket upgrades and inspect Execution Get.

**Implemented:** Box, Command, Execution, File and Volume.
**Not implemented yet:** Checkpoint, tunnel/network, SSH and Image resources. Do not confuse Box image selection with an Image-management resource.

Verified on self-hosted BoxLite v0.13.1 + n8n 2.47.7. Cloud has only a read-only reachability check. Volume success/persistence needs a capable server.

Source docs: package README, REVIEW.md and boxlite-node-plan.md in the local repository.`, 3],
];
chapters.forEach(([name, text, color], i) => note(name, text, [i * 640, 340], 600, 650, color));

const manual = add('Read notes, then run manually', 'n8n-nodes-base.manualTrigger', {}, [x, 1080]); x += 240;
step('List boxes', 'box', 'list', { returnAll: false, limit: 10 }, 'Read-only. Returns a boxes array.');
step('Create demo box', 'box', 'create', { image: 'alpine:latest', name: "={{ 'n8n-boxlite-guide-' + $execution.id }}", ifExists: 'fail', additionalFields: { autoStopMinutes: 5, autoDeleteMinutes: 15, env: '{"GUIDE_MODE":"demo"}' } }, 'Self-hosted Alpine example. Do not switch to a shared/reused box.');
const boxId = "={{ $('Create demo box').first().json.box_id }}";
step('Get demo box', 'box', 'get', { boxId }, 'Inspect the raw API object.');
code('Make input file', "const text = 'hello from n8n\\n';\nreturn [{json: {file_name: 'input.txt', bytes: Buffer.byteLength(text)}, binary: {data: {data: Buffer.from(text).toString('base64'), mimeType: 'text/plain', fileName: 'input.txt'}}}];", 'One tiny text file, created after the box so its binary cannot be lost by Create.');
step('Upload input file', 'file', 'upload', { boxId, inputBinaryField: 'data', destinationDir: '/workspace/boxlite-guide', fileName: 'input.txt' }, 'Upload hash and path are available in this node output.');
step('Run command', 'command', 'execute', { boxId, command: 'sh', arguments: { argument: [{ value: '-c' }, { value: 'set -eu; tr "[:lower:]" "[:upper:]" < /workspace/boxlite-guide/input.txt > /workspace/boxlite-guide/output.txt; printf "processed input.txt\\n"; printf "example stderr (not a failure)\\n" >&2' }] }, additionalFields: { captureOutput: true, waitForCompletion: true, maxWaitSeconds: 30, timeoutSeconds: 20 } }, 'Uppercase the file. stderr can contain diagnostics even when exit_code is zero.');
step('Get execution status', 'execution', 'get', { boxId, executionId: "={{ $('Run command').first().json.execution_id }}" }, 'Status only: completed, killed or timed_out is terminal.');
step('List recent executions', 'execution', 'list', { boxId }, 'Server-reported executions/sessions; finished commands may be omitted.');
step('Download demo directory', 'file', 'download', { boxId, sourcePath: '/workspace/boxlite-guide', outputBinaryField: 'data', maxDownloadMb: 5 }, 'Two binary output items: input.txt and output.txt.');
code('Collect files', "const files = [];\nfor (let i=0; i<$input.all().length; i++) {\n const item = $input.all()[i];\n if (item.json.error) return [{json: item.json}];\n const bytes = await this.helpers.getBinaryDataBuffer(i, 'data');\n files.push({...item.json, text: bytes.toString('utf8')});\n}\nconst input = files.find(f=>f.relative_path==='input.txt');\nconst output = files.find(f=>f.relative_path==='output.txt');\nconst verified = files.length===2 && input?.text==='hello from n8n\\n' && output?.text==='HELLO FROM N8N\\n' && input.sha256===$('Upload input file').first().json.sha256;\nreturn [{json:{verified, files}}];", 'Collapse file fan-out into one item; verify downloaded bytes, then clean up once.');
step('Read box metrics', 'box', 'metrics', { boxId }, 'CPU and memory data from the running demo box.');
step('Stop demo box', 'box', 'stop', { boxId }, 'Stops the box without deleting it.');
step('Start demo box', 'box', 'start', { boxId }, 'Starts the same box again.');
step('Delete demo box', 'box', 'delete', { boxId, force: true }, 'Deletes only the unique box created by this run.');
const summary = code('Run summary', `const names = ['List boxes','Get demo box','Make input file','Upload input file','Run command','Get execution status','List recent executions','Download demo directory','Collect files','Read box metrics','Stop demo box','Start demo box','Delete demo box'];
const failures = names.flatMap(name => $(name).all().filter(i=>i.json.error).map(i=>({node:name,...i.json})));
const files = $('Collect files').first().json;
const command = $('Run command').first().json;
const deleted = $('Delete demo box').first().json.deleted === true;
if (failures.length || !files.verified || command.exit_code!==0 || !deleted) throw new Error('Demo did not fully succeed. Cleanup attempted: '+deleted+'. Inspect node outputs: '+JSON.stringify(failures));
return [{json:{ok:true, box_id:$('Create demo box').first().json.box_id, deleted, stdout:command.stdout, stderr:command.stderr, files:files.files, next:'Duplicate the workflow or copy an example node; keep cleanup and review the notes.'}}];`, 'After cleanup, reports real failures rather than hiding them behind Continue On Fail.');
delete summary.onError;
const main = nodes.filter(n => n.position[1] === 1080);
for (let i = 0; i < main.length - 1; i++) link(main[i], main[i + 1]);

note('07 · Volumes — reference only', `## 07 / Persistent volumes • disabled reference
Volumes are for data that must outlive a box. **The current self-hosted v0.13.1 refuses named-volume operations.** These examples are disabled and disconnected from the manual run. Successful volume CRUD/persistence has not been live-verified.

On a capable server: **Create → use its id on Box Create / Volume Mounts → work → delete box → keep volume**. Attach it to a later box to reuse data. Read Only prevents writes in the guest. Box Reuse does not change mounts.

List returns \`{volumes: [...]}\`. Get/Delete take an ID or name. **Volume Delete permanently destroys the data; Force defaults off.** Uncheck disabled only after configuring a capable server and the intended volume reference. Never use a real shared volume just to test deletion.`, [0, 1450], 1780, 480, 2);
function reference(name, resource, operation, parameters, pos) {
	return add(name, 'n8n-nodes-boxlite.boxLite', { resource, operation, ...parameters }, pos, { disabled: true, notesInFlow: true, notes: 'REFERENCE ONLY — disabled, disconnected. Configure explicitly before use.' });
}
reference('Reference — Create volume', 'volume', 'create', { name: 'my-data' }, [100, 2010]);
reference('Reference — List volumes', 'volume', 'list', {}, [420, 2010]);
reference('Reference — Get volume', 'volume', 'get', { volumeId: 'REPLACE_WITH_VOLUME_ID_OR_NAME' }, [740, 2010]);
reference('Reference — Delete volume', 'volume', 'delete', { volumeId: 'REPLACE_WITH_DISPOSABLE_VOLUME_ID', force: false }, [1060, 2010]);
reference('Reference — Create with a volume', 'box', 'create', { image: 'alpine:latest', name: '', ifExists: 'fail', volumeMounts: { mount: [{ volume: 'REPLACE_WITH_VOLUME_ID_OR_NAME', guestPath: '/data', readOnly: false }] } }, [1400, 2010]);

note('08 · Async recipe and limits', `## 08 / Longer work • copy this pattern deliberately
The disconnected examples below show an asynchronous command and status inspection. They are **not a runnable polling loop**. Add your own Wait + condition/loop with an attempt/time limit.

1. Command Execute with **Wait for Completion off** returns an execution ID immediately.
2. Save both box_id and execution_id. Wait a few seconds with an n8n Wait node.
3. Execution Get with those IDs. Branch on completed/killed/timed_out; otherwise wait and poll again.
4. Handle non-zero exit, error_message and timeout. Delete only when work is terminal (or deliberately cancel it by deleting the box).

**Status polling does not recover stdout/stderr.** For async output, redirect results into /workspace and download files after completion. For short work, keep output capture on and wait in Command.

One incoming item means one API action. For batches, use item links or explicit saved IDs; collapse multi-file outputs before lifecycle cleanup.`, [1950, 1450], 1830, 480, 6);
reference('Reference — Execute without waiting', 'command', 'execute', { boxId: 'REPLACE_WITH_BOX_ID', command: 'sh', arguments: { argument: [{ value: '-c' }, { value: 'sleep 10; printf "done\\n" > /workspace/result.txt' }] }, additionalFields: { waitForCompletion: false, timeoutSeconds: 60 } }, [2100, 2010]);
add('Reference — Wait before polling', 'n8n-nodes-base.wait', { amount: 3, unit: 'seconds' }, [2500, 2010], { typeVersion: 1.1, disabled: true, webhookId: id('reference-wait'), notesInFlow: true, notes: 'Reference only. Add a bounded loop around Get status.' });
reference('Reference — Get async status', 'execution', 'get', { boxId: 'REPLACE_WITH_BOX_ID', executionId: 'REPLACE_WITH_EXECUTION_ID' }, [2900, 2010]);
reference('Reference — Download async output', 'file', 'download', { boxId: 'REPLACE_WITH_BOX_ID', sourcePath: '/workspace/result.txt', outputBinaryField: 'data', maxDownloadMb: 5 }, [3300, 2010]);

const workflow = {
	name: 'BoxLite Guide — what, how and every node',
	nodes, connections,
	settings: { executionOrder: 'v1', executionTimeout: 300, saveManualExecutions: true },
};
const dir = path.join(__dirname, '..', 'examples');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'BoxLite-Guide.json'), JSON.stringify(workflow, null, 2) + '\n');
console.log(`Built BoxLite Guide: ${nodes.length} nodes, one manual demo, no embedded credentials`);
