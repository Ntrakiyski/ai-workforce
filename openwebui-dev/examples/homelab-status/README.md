# Homelab status from an Open WebUI channel

Mention **Homelab Status** in its staging channel to ask for a read-only n8n readiness report. The result is visible to everyone in that channel. A successful check covers n8n readiness only. Host load, disk health and the availability of other services are outside this first example.

```text
Authorized member mentions app → Open WebUI verifies interaction → OIX checks installation, channel and user
  → fixed n8n status webhook → workflow checks readiness → app replies to original message
```

## Install on staging

1. Use Python 3.11+ in an isolated environment and install `requirements.txt` with `python -m pip install -r requirements.txt`. The app targets OIX 0.8.0. Confirm the staging Open WebUI has Apps, Channels and the OIX socket transport. [Pinned OIX setup and compatibility notes](https://github.com/open-webui/oix/blob/6134c423f553aa9886f2de6ad822f46fb51239e0/README.md).
2. Configure the [n8n workflow](../../../n8n-dev/examples/homelab-status) on isolated staging. Keep its webhook header credential and the OIX app credentials separate.
3. Provision the app's persistent `API_KEY` and Ed25519 signing key using the pinned OIX setup guide. Provide the key's file path as `APP_PRIVATE_KEY_FILE`. Connect Open WebUI to the app's reachable `/events` URL, with WebSocket support. Grant only the requested mention-read and message-write scopes and invite the app to the intended private channel.
4. To identify the staging installation before enabling checks, start the app with `STATUS_DISCOVER_IDS=1 python app.py` for the connection step. Mention the app as each intended requester. This mode prints the verified installation, channel and user IDs to the operator's console and never contacts n8n. Confirm these IDs belong to the intended staging members and channel before adding them. Discovery does not enroll anyone.
5. Stop discovery. Set the values below in the app process environment and run `python app.py`. OIX does not load a dotenv file automatically.

| Variable | Value |
| --- | --- |
| `STATUS_INSTALLATION_ID` | Exact OIX installation ID |
| `STATUS_CHANNEL_ID` | Exact Open WebUI channel ID |
| `STATUS_USER_IDS` | Comma-separated IDs of members allowed to request the report |
| `N8N_STATUS_URL` | Full published staging webhook URL ending in `/webhook/homelab-status`. Use HTTPS across hosts. Local processes can use loopback HTTP. |
| `N8N_STATUS_KEY` | Secret matching the n8n Header Auth credential for `X-Status-Key` |

An explicit mention is the entire command. Text in the message cannot select endpoints or add checks. The app sends an empty JSON object, and never forwards identities, channel text or OIX credentials to n8n. The webhook credential gives the app one read-only operation.

## Verify

Run `python -m unittest -v test_app.py` from this directory with the dependencies installed. The tests exercise an OIX event and reply, real HTTP requests to a loopback fixture, identity restrictions, configuration and invalid responses. They do not establish live WebUI compatibility.

For staging acceptance, mention the app as an allowed user and confirm the reply references the source message and one webhook execution. Repeat as an unlisted user and confirm no reply and no execution. A valid workflow response with `status=unavailable` reports a failed probe. A failed webhook call, redirect, timeout or invalid result reports unknown readiness. Remove the app from the channel to stop new requests, and unpublish the staging workflow to disable its webhook.
