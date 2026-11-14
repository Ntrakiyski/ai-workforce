# Engineering Standard: Security, Isolation and Release

**Status:** PROPOSED_STANDARD, based on official documentation and community tool warnings.

## Artifact and credential security

- Never embed secrets in workflow JSON, copied cURL parameters, URLs, node notes, fixtures or logs.
- Record *references* to credentials and their least-privilege requirements in a separate manifest.
- Sanitize exported workflow files: n8n warns they can contain credential names/IDs and HTTP auth headers.
- Use staging-only credentials and isolated service accounts; refuse a staging test that would mutate client production data.
- Restrict risky/community nodes and evaluate installed packages before approving a workflow.
- Implement log redaction, execution-data retention and access controls before enabling self-service client changes.

Official references: [export/import warning](https://docs.n8n.io/build/manage-workflows/export-and-import.md), [security audit](https://docs.n8n.io/hosting/securing/security-audit/).

## Instance safety

- Protect production write tokens from planning, builder and review agents.
- Enforce one active editor per workflow/revision. Require an explicit version compare or edit lock before making writes.
- Verify a usable rollback export or prior-version snapshot before deployment.
- Disable auto-publishing of unapproved changes; require release policy and a tamper-resistant audit trail.
- Gate high-impact/destructive/financial changes behind explicit human approval, regardless of passing tests.

Community n8n-MCP README warns about concurrent edits and snapshots that may fail without blocking the edit. Source: https://github.com/czlonkowski/n8n-mcp#working-safely-on-live-workflows

## Release sequence

1. Capture target n8n version, installed node set and required credentials.
2. Generate workflow(s) from a known revision under an exclusive edit lock.
3. Execute static, schema, semantic and security checks.
4. Import into an isolated, version-matched staging instance.
5. Run functional, error/retry and side-effect tests against sandbox services.
6. Require independent review and retain evidence.
7. Confirm rollback source and production compatibility.
8. Apply authorized release action to the target environment.
9. Verify published/active state, smoke-test and monitor.
10. Roll back on failed verification; record incident evidence.

**Important:** n8n's source-control tutorial states it pushes *saved* versions, not *published* versions; publication on a remote instance is separate. The native environments feature is described as available on Business/Enterprise plans, so do not assume it exists for every client account. Source: https://docs.n8n.io/administer/use-source-control-and-environments/tutorial-create-environments-with-source-control.md

## Hosting/scaling considerations

n8n queue mode uses a main instance, Redis and worker instances. Its docs warn that filesystem-backed binary data storage is not supported with queue mode and that workers require access to the same encryption key. Record deployment mode and external storage requirements in each release manifest. Source: https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode.md

## Commercial/legal research gate

Do not treat n8n's source availability as a blanket grant to resell, white-label, embed or offer multi-tenant managed n8n capabilities without reviewing the applicable license, enterprise/OEM provisions, third-party code licenses and deployment use case. Document legal findings before finalizing commercial packaging. Start at https://docs.n8n.io/sustainable-use-license/.
