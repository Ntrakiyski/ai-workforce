"""Exercise a fresh, disposable Open WebUI 0.13.4 and the published staging workflow."""

import json
import os
import secrets
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

WEBUI = "http://127.0.0.1:8080"
API = WEBUI + "/api/v1"
APP_URL = "http://127.0.0.1:8000/events"
APP_DIR = Path(__file__).resolve().parents[1]


def call(url, token=None, payload=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    body = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload).encode()
    with urlopen(Request(url, data=body, headers=headers), timeout=15) as response:
        return json.load(response)


@contextmanager
def running_app(env):
    # Bind to loopback on the disposable runner.
    process = subprocess.Popen(
        [
            sys.executable,
            "-c",
            "from app import create_app; create_app().run(host='127.0.0.1')",
        ],
        cwd=APP_DIR,
        env=env,
    )
    try:
        for _ in range(60):
            if process.poll() is not None:
                raise RuntimeError("OIX app exited during startup")
            try:
                call(APP_URL, env["API_KEY"])
                break
            except HTTPError:
                raise
            except URLError:
                time.sleep(0.25)
        else:
            raise RuntimeError("OIX app did not start")
        yield
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


def account(name):
    return {
        "name": name,
        "email": f"{name}@example.test",
        "password": secrets.token_urlsafe(28) + "9!Aa",
    }


def main():
    if call(WEBUI + "/api/config").get("onboarding") is not True:
        raise RuntimeError("Requires a disposable instance with zero users")
    admin = call(API + "/auths/signup", payload=account("owner"))
    member = call(
        API + "/auths/add", admin["token"], {**account("member"), "role": "user"}
    )
    if admin["role"] != "admin" or member["role"] != "user":
        raise RuntimeError("Unexpected fixture roles")
    channel = call(
        API + "/channels/create",
        admin["token"],
        {
            "name": "Status checks",
            "type": "group",
            "user_ids": [member["id"]],
        },
    )
    channel_api = API + "/channels/" + channel["id"]

    with tempfile.TemporaryDirectory() as tmp:
        key_file = Path(tmp) / "private.pem"
        key_file.write_bytes(
            Ed25519PrivateKey.generate().private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
        )
        env = {
            **os.environ,
            "API_KEY": secrets.token_hex(32),
            "APP_PRIVATE_KEY_FILE": str(key_file),
            "STATUS_DISCOVER_IDS": "1",
        }
        with running_app(env):
            registration = {"url": APP_URL, "api_key": env["API_KEY"]}
            manifest = call(
                API + "/apps/manifest/preview", admin["token"], registration
            )
            app = call(
                API + "/apps",
                admin["token"],
                {
                    **registration,
                    "slug": "homelab-status",
                    "manifest": manifest,
                    "granted_scopes": manifest["requested_scopes"],
                    "access_grants": [
                        {
                            "principal_type": "user",
                            "principal_id": member["id"],
                            "permission": "read",
                        }
                    ],
                },
            )
            app_api = API + "/apps/" + app["id"]
            connected = call(app_api + "/connect", admin["token"], {})
            installation = connected["data"]["installation_id"]
            call(channel_api + "/apps", admin["token"], {"app_id": app["id"]})

        env.update(
            STATUS_DISCOVER_IDS="0",
            STATUS_INSTALLATION_ID=installation,
            STATUS_CHANNEL_ID=channel["id"],
            STATUS_USER_IDS=member["id"],
            N8N_STATUS_URL="http://127.0.0.1:5678/webhook/homelab-status",
        )
        with running_app(env):
            call(app_api + "/connect", admin["token"], {})
            mention = {"content": f"<@A:{app['id']}|Homelab Status> status?"}
            denied = call(channel_api + "/messages/post", admin["token"], mention)
            source = call(channel_api + "/messages/post", member["token"], mention)
            for _ in range(80):
                messages = call(channel_api + "/messages", member["token"])
                for msg in messages:
                    if msg["app_id"] != app["id"]:
                        continue
                    if msg["reply_to_id"] == denied["id"]:
                        raise RuntimeError("App replied to an unlisted actor")
                    if msg["reply_to_id"] == source["id"]:
                        if msg["content"] != "n8n readiness check passed.":
                            raise RuntimeError(
                                "Readiness check returned an unexpected report"
                            )
                        print(
                            "Verified ordinary member received the app's n8n readiness reply",
                            f"(source {source['id']}, reply {msg['id']}).",
                        )
                        return
                time.sleep(0.5)
            raise RuntimeError("No app reply linked to the ordinary member's message")


if __name__ == "__main__":
    main()
