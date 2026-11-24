# Contributing

## Add a specialist

1. `cp -R _template <platform>-dev` and replace `PLATFORM` everywhere.
2. Fill `SKILL.md` with a routing table to `references/`. Keep it short.
3. Pin the upstream version in `docs/research/evidence-index.json`.
4. Add at least one example with a test, and list it in the README capability table.
5. Add a CI workflow under `.github/workflows/` running that specialist's tests.
6. Add the specialist to the root README table.
7. `python3 tools/check_docs.py --strict` must pass.

## Cross-platform work

Write or update a contract in `docs/contracts/`, put the example in `joint/<name>/<platform>/`, and add a cross-specialist ADR in `docs/decisions/` when the boundary changes.

## Checks

```bash
python3 tools/check_docs.py            # links, evidence, template gaps (warnings)
python3 -m unittest discover -s tools/tests -v
```

Follow the [shared standards](docs/standards/README.md).
