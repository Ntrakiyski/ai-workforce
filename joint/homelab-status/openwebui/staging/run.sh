#!/usr/bin/env bash
# Requires a fresh GitHub-hosted Linux runner. All state belongs to this run.
set -euo pipefail
: "${GITHUB_ACTIONS:?Run this check on a disposable GitHub runner}"
cd "$(dirname "$0")"
work="$(mktemp -d)"
volume="status-n8n-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
n8n_container="$volume-server"
webui_container="status-webui-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
cleanup() {
  docker rm -fv "$n8n_container" "$webui_container" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
  sudo rm -rf "$work"
}
trap cleanup EXIT
n8n_image="n8nio/n8n:2.47.7@sha256:b4b90747b81fcda7e76550c0d3aa7f0f64917a1e9573cff40d6834eaf2e0f8ea"
webui_image="ghcr.io/open-webui/open-webui:v0.13.4-slim@sha256:0c4439e78c24c85e3e7a41936771d3b02f0df38daf28a086cd83ca74804f7676"
export N8N_STATUS_KEY="$(openssl rand -hex 32)"
export N8N_ENCRYPTION_KEY="$(openssl rand -hex 32)"
docker run -d --name "$webui_container" --network host \
  -e HOST=127.0.0.1 -e PORT=8080 -e ENABLE_APPS=true -e ENABLE_CHANNELS=true \
  -e ENABLE_SIGNUP=true -e DEFAULT_USER_ROLE=user -e OFFLINE_MODE=true \
  -e APP_ALLOWED_PRIVATE_ORIGINS=http://127.0.0.1:8000 \
  "$webui_image"

jq '[. | .id="homelabStatus" | (.nodes[] | select(.type=="n8n-nodes-base.webhook")).credentials={httpHeaderAuth:{id:"statusCredential",name:"Homelab status"}}]' \
  ../../n8n/workflow.json > "$work/workflow.json"
jq -n '[{id:"statusCredential",name:"Homelab status",type:"httpHeaderAuth",data:{name:"X-Status-Key",value:env.N8N_STATUS_KEY}}]' > "$work/credential.json"
# The image runs as uid 1000. Mount only these generated fixture files.
sudo chown -R 1000:1000 "$work"
sudo chmod 700 "$work"
docker volume create "$volume" >/dev/null
n8n_args=(-v "$volume:/home/node/.n8n" -e N8N_ENCRYPTION_KEY -e N8N_DIAGNOSTICS_ENABLED=false)
for kind in credentials workflow; do
  filename="$kind"
  if [[ "$kind" == credentials ]]; then filename=credential; fi
  docker run --rm "${n8n_args[@]}" -v "$work:/fixture:ro" "$n8n_image" "import:$kind" "--input=/fixture/$filename.json"
done
docker run --rm "${n8n_args[@]}" "$n8n_image" publish:workflow --id=homelabStatus
docker run -d --name "$n8n_container" "${n8n_args[@]}" -p 127.0.0.1:5678:5678 "$n8n_image"
for url in http://127.0.0.1:8080/health http://127.0.0.1:5678/healthz/readiness; do
  curl -fsS --retry 60 --retry-all-errors --retry-delay 2 --max-time 4 "$url" >/dev/null
done
# Database readiness can precede workflow activation on a fresh instance.
for attempt in {1..30}; do
  status="$(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' -d '{}' http://127.0.0.1:5678/webhook/homelab-status)"
  case "$status" in
    401|403) break ;;
    404|503) sleep 1 ;;
    *) echo "Unexpected unauthenticated webhook response: HTTP $status" >&2; exit 1 ;;
  esac
done
if [[ "$status" != 401 && "$status" != 403 ]]; then
  echo "Webhook did not become available: HTTP $status" >&2
  docker logs --tail 25 "$n8n_container" >&2
  exit 1
fi
python ../../../../openwebui-dev/scripts/probe.py http://127.0.0.1:8080
python check_channel.py
