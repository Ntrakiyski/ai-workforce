# n8n-nodes-openwebui

Open WebUI node for n8n. It covers only what agents need to reach a human in Open WebUI:

| Operation | What it does |
| --- | --- |
| Start Chat | Creates a chat (title, model), posts the first message and waits for the model's answer. Returns `chat_id`, `url`, `answer`. |
| Send Message | Adds a message to an existing chat (after its current message) and waits for the answer. |
| Get Chat / Delete Chat | Read or remove a chat. |

Chats belong to the owner of the API key.

Messages go through `/api/chat/completions` with `chat_id`, `parent_id` and `user_message`, so Open WebUI saves the
user message and the answer as a linked pair, runs the model's pipe and stores its embeds.

## Credential: Open WebUI API
- Base URL: e.g. `https://agents.gccssofia.com`
- API Key: `sk-…` from Settings → Account. The credential test calls `GET /api/models`.

## Build and install (same as n8n-nodes-boxlite)
```sh
npm install && npm test && npm pack
docker cp n8n-nodes-openwebui-0.1.0.tgz <n8n-container>:/tmp/
docker exec <n8n-container> sh -c 'cd /home/node/.n8n/nodes && npm install --omit=dev --legacy-peer-deps --no-audit --no-fund /tmp/n8n-nodes-openwebui-0.1.0.tgz'
docker restart <n8n-container>
```
Node type: `n8n-nodes-openwebui.openWebUi`.
