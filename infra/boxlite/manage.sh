#!/usr/bin/env bash
# Day-two private BoxLite lifecycle operations; never exposes n8n publicly.
set -euo pipefail
BOX_NAME="${BOXLITE_BOX_NAME:-n8n-dev-staging}"
CONTEXT="${BOXLITE_CONTEXT_NAME:-app}"
ACTION="${1:-status}"
box() { boxlite --context "$CONTEXT" "$@"; }
command -v boxlite >/dev/null 2>&1 || { echo "Install the BoxLite CLI first." >&2; exit 2; }
box inspect "$BOX_NAME" >/dev/null || { echo "Box '$BOX_NAME' not found." >&2; exit 2; }

healthy() {
  box exec --user node "$BOX_NAME" -- node -e \
    'fetch("http://127.0.0.1:5678/healthz").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' \
    >/dev/null 2>&1
}

case "$ACTION" in
  status)
    box inspect "$BOX_NAME"
    if healthy; then echo 'Private n8n health: OK'; else echo 'Private n8n health: unavailable or Box stopped'; fi
    ;;
  start)
    if ! box exec "$BOX_NAME" -- true >/dev/null 2>&1; then
      box start "$BOX_NAME"
    fi
    box network outbound "$BOX_NAME" disabled
    if ! healthy; then
      box exec --detach --user node "$BOX_NAME" -- sh -lc \
        'export HOME=/home/node N8N_USER_FOLDER=/home/node/.n8n N8N_LISTEN_ADDRESS=127.0.0.1 N8N_HOST=localhost N8N_PORT=5678 N8N_PROTOCOL=http N8N_DIAGNOSTICS_ENABLED=false N8N_VERSION_NOTIFICATIONS_ENABLED=false N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true N8N_RUNNERS_MODE=internal; exec /home/node/n8n-dev/node_modules/.bin/n8n start >>/home/node/n8n-dev/n8n.log 2>&1'
    fi
    for attempt in $(seq 1 40); do
      if healthy; then echo "n8n healthy in private Box '$BOX_NAME'"; exit 0; fi
      sleep 3
    done
    echo 'n8n failed to start; inspect logs using manage.sh logs' >&2
    exit 1
    ;;
  stop)
    box stop "$BOX_NAME"
    echo 'Box stopped; persistent rootfs retained. Verify metered usage in BoxLite console.'
    ;;
  logs)
    box exec "$BOX_NAME" -- sh -lc 'tail -n 100 /home/node/n8n-dev/n8n.log'
    ;;
  *)
    echo "Usage: $0 {status|start|stop|logs}" >&2
    exit 2
    ;;
esac
