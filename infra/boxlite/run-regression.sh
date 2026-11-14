#!/usr/bin/env bash
# Run the previously verified synthetic n8n-check fixtures inside a private Box.
# Designed for BoxLite, NOT GitHub Actions. Requires provision.sh to have succeeded.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BOX_NAME="${BOXLITE_BOX_NAME:-n8n-dev-staging}"
CONTEXT="${BOXLITE_CONTEXT_NAME:-app}"
GUEST="/home/node/n8n-dev"
FIXTURES="$ROOT/tests/fixtures/n8n-check-smoke"
box() { boxlite --context "$CONTEXT" "$@"; }

command -v boxlite >/dev/null 2>&1 || { echo "Missing boxlite CLI" >&2; exit 2; }
box inspect "$BOX_NAME" >/dev/null
if ! box exec "$BOX_NAME" -- true >/dev/null 2>&1; then
  box start "$BOX_NAME"
fi
box exec "$BOX_NAME" -- node --version

# The BoxLite network policy is the isolation boundary. The runner's
# --allow-network flag below only bypasses its heuristic that checks guest
# interfaces; it must NOT be used on a publicly reachable or unisolated host.
box network outbound "$BOX_NAME" disabled

box exec "$BOX_NAME" -- sh -lc "mkdir -p '$GUEST/fixtures' '$GUEST/reports' && chown -R node:node '$GUEST/fixtures' '$GUEST/reports'"
for name in healthy.workflow.json regression.workflow.json eligible-rows.case.json; do
  box cp "$FIXTURES/$name" "$BOX_NAME:$GUEST/fixtures/$name"
done
box exec "$BOX_NAME" -- sh -lc "chown -R node:node '$GUEST/fixtures'"

run_case() {
  local file="$1" out="$2" expected="$3"
  box exec --user node "$BOX_NAME" -- sh -lc "rm -rf '$GUEST/reports/$out'"
  local actual=0
  box exec --user node "$BOX_NAME" -- "$GUEST/node_modules/.bin/n8n-check" \
    "$GUEST/fixtures/$file" "$GUEST/fixtures/eligible-rows.case.json" \
    --n8n "$GUEST/node_modules/.bin/n8n" \
    --out "$GUEST/reports/$out" --allow-network || actual=$?
  if [[ "$actual" != "$expected" ]]; then
    echo "Unexpected result for $file: exit $actual, expected $expected" >&2
    exit 1
  fi
}

run_case healthy.workflow.json positive 0
run_case regression.workflow.json negative 1

# Verify the reports describe actual engine runs, not setup failures.
box exec --user node "$BOX_NAME" -- node -e '
  const fs=require("node:fs");
  const base="/home/node/n8n-dev/reports/";
  const a=JSON.parse(fs.readFileSync(base+"positive/report.json"));
  const b=JSON.parse(fs.readFileSync(base+"negative/report.json"));
  if(a.status!=="passed" || b.status!=="failed") process.exit(1);
  if(a.n8nVersion!=="2.47.7" || b.n8nVersion!=="2.47.7") process.exit(1);
  if(a.network?.mode!=="loopback-only") {
    console.error("Guest interface is not loopback-only; BoxLite outbound is disabled but runner heuristic was bypassed.");
  }
  if(a.checks.some(x=>!x.passed) || b.checks.every(x=>x.passed)) process.exit(1);
  console.log("Verified: healthy passed; intentional data-loss regression detected on n8n 2.47.7.");
'

mkdir -p "$ROOT/artifacts/boxlite-smoke"
box cp "$BOX_NAME:$GUEST/reports/positive/report.json" "$ROOT/artifacts/boxlite-smoke/positive-report.json"
box cp "$BOX_NAME:$GUEST/reports/positive/junit.xml" "$ROOT/artifacts/boxlite-smoke/positive-junit.xml"
box cp "$BOX_NAME:$GUEST/reports/negative/report.json" "$ROOT/artifacts/boxlite-smoke/negative-report.json"
box cp "$BOX_NAME:$GUEST/reports/negative/junit.xml" "$ROOT/artifacts/boxlite-smoke/negative-junit.xml"

echo 'PASS: expected positive and negative controls; reports saved under artifacts/boxlite-smoke/'
echo 'No test data or credentials were sent to an external service.'
