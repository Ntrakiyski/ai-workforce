# Shared standards

Rules every specialist follows. Platform-specific standards extend these in `<platform>-dev/docs/standards/`.

1. **One platform per specialist.** Cross-platform work names the other specialist and a [contract](../contracts/README.md).
2. **Short skills.** `SKILL.md` routes; detail lives in `references/`.
3. **Evidence status on every claim:** `VERIFIED_RUNTIME`, `VERIFIED_SOURCE`, `PROPOSED_STANDARD`, `SECONDARY_CLAIM` or `UNVERIFIED`, with the version or commit it was checked against.
4. **Done means proven.** A capability is verified only after a real run covering an allowed caller, a denied caller and a failure.
5. **Staging first.** Changes to a live instance need a recorded scope, a rollback artifact and operator approval.
6. **No secrets or client data.** Use synthetic fixtures; credentials come from the operator's secret store.
7. **No empty placeholders.** Planned work goes in `docs/roadmap.md`.
