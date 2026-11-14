#!/usr/bin/env bash
# Private BoxLite Cloud staging environment for the n8n-native framework.
# Does NOT contain, upload or log a BoxLite API key.
set -euo pipefail

BOX_NAME="${BOXLITE_BOX_NAME:-n8n-dev-staging}"
CONTEXT="${BOXLITE_CONTEXT_NAME:-app}"
CPUS="${BOXLITE_CPUS:-2}"
MEMORY_MIB="${BOXLITE_MEMORY_MIB:-4096}"
DISK_GB="${BOXLITE_DISK_GB:-20}"
AUTO_STOP_SECONDS="${BOXLITE_AUTO_STOP_SECONDS:-3600}"
IMAGE="docker.io/library/node:24-bookworm-slim"

if ! command -v boxlite >/dev/null 2>&1; then
  echo 'BoxLite CLI is missing. Install the official CLI and authenticate before running this script.' >&2
  exit 2
fi

box() { boxlite --context "$CONTEXT" "$@"; }

# Verify that the configured context is authenticated. No credentials are printed.
if ! box auth status >/dev/null 2>&1; then
  echo "BoxLite context '$CONTEXT' is not authenticated. Run:" >&2
  echo "  boxlite --context $CONTEXT auth login --url https://api.boxlite.ai --method api-key" >&2
  exit 2
fi

if box inspect "$BOX_NAME" >/dev/null 2>&1; then
  echo "Reusing existing Box: $BOX_NAME (verify its size, image and network policy)."
else
  echo "Creating private Box '$BOX_NAME' (2 vCPU/4 GiB defaults; metered by BoxLite Cloud)."
  box create --name "$BOX_NAME" --cpus "$CPUS" --memory "$MEMORY_MIB" \
    --disk-size "$DISK_GB" --auto-stop "$AUTO_STOP_SECONDS" --auto-delete 0 \
    --inbound disabled "$IMAGE" sleep infinity
fi

if ! box exec "$BOX_NAME" -- node --version >/dev/null 2>&1; then
  box start "$BOX_NAME"
fi

echo "Node version inside Box:"
box exec "$BOX_NAME" -- node --version

# Outbound network is necessary only for acquiring pinned npm packages.
# No client tokens/credentials have been provisioned in this Box.
box network outbound "$BOX_NAME" enabled
box exec "$BOX_NAME" -- sh -lc \
  'mkdir -p /home/node/n8n-dev /home/node/.n8n && chown -R node:node /home/node/n8n-dev /home/node/.n8n'

echo 'Installing n8n 2.47.7, official SDK 0.40.2, and n8n-check 0.1.9 into persistent Box filesystem.'
box exec --user node "$BOX_NAME" -- sh -lc \
  'export HOME=/home/node; cd /home/node/n8n-dev; npm install --no-audit --no-fund --save-exact --omit=dev n8n@2.47.7 @n8n/workflow-sdk@0.40.2 @blucca/n8n-check@0.1.9'

echo 'Checking installed tool versions:'
box exec --user node "$BOX_NAME" -- sh -lc \
  '/home/node/n8n-dev/node_modules/.bin/n8n --version && /home/node/n8n-dev/node_modules/.bin/n8n-check --version'

# Secure-by-default staging: Box is private, service will only listen on loopback,
# and no outbound requests may leave the guest until explicitly re-enabled.
box network outbound "$BOX_NAME" disabled

health() {
  box exec --user node "$BOX_NAME" -- node -e \
    'fetch("http://127.0.0.1:5678/healthz").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' \
    >/dev/null 2>&1
}

if ! health; then
  echo 'Starting private n8n staging server on 127.0.0.1:5678 (not publicly reachable).'
  box exec --detach --user node "$BOX_NAME" -- sh -lc \
    'export HOME=/home/node N8N_USER_FOLDER=/home/node/.n8n N8N_LISTEN_ADDRESS=127.0.0.1 N8N_HOST=localhost N8N_PORT=5678 N8N_PROTOCOL=http N8N_DIAGNOSTICS_ENABLED=false N8N_VERSION_NOTIFICATIONS_ENABLED=false N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true N8N_RUNNERS_MODE=internal; exec /home/node/n8n-dev/node_modules/.bin/n8n start >>/home/node/n8n-dev/n8n.log 2>&1'
fi

ok=0
for attempt in $(seq 1 40); do
  if health; then ok=1; break; fi
  sleep 3
done

if [[ "$ok" -ne 1 ]]; then
  echo 'n8n health check failed. Last server logs:' >&2
  box exec "$BOX_NAME" -- sh -lc 'tail -n 60 /home/node/n8n-dev/n8n.log' >&2 || true
  exit 1
fi

echo "HEALTHY: private n8n 2.47.7 in Box '$BOX_NAME'."
echo "Data persists across stop/restart but is deleted with the Box unless backed up."
echo "Cloud auto-stop is $AUTO_STOP_SECONDS seconds of API/terminal inactivity; running processes do not prevent auto-stop."
echo 'Next: bash infra/boxlite/run-regression.sh'
