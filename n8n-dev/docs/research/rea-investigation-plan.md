# REA Investigation Plan for n8n

**Status:** Research plan; REA has not been installed or executed here.

## Tool and purpose

[REA](https://github.com/morluto/rea) is an agent-facing reverse-engineering toolkit. The project's README advertises JavaScript/Electron application inspection in addition to binary/runtime investigations. Because n8n's repository is open-source, first inspect its tagged TypeScript source, tests, and official docs; use REA only when a targeted behavior remains unclear.

## Candidate investigations

1. Observe compiled editor behavior when pasting/importing a workflow with incomplete `typeVersion` or missing node IDs; compare with source and API behavior.
2. Trace editor UI behavior when using `Continue (using error output)` and dynamic connection slots; correlate with the saved JSON.
3. Compare editor rendering/layout handling for multiple branches, null connection buckets and node groups.
4. Investigate discrepancies between compiled node configuration and documented property defaults.

## Required experiment note

Every experiment records target version/build, REA version, target path, question, command/tool invocation, observations, logs, evidence files, uncertainty and a minimal reproduction. Never decompile or inspect an instance you do not have permission to analyze. Exclude secrets and private client data from captures.

## Decision gate

Use REA only when its expected added evidence is greater than what source inspection and first-party runtime tests already provide. Don't convert inferred internals into architecture standards without reproduction.
