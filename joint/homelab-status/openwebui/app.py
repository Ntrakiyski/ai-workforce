"""An explicit mention requests one read-only n8n readiness report."""

import asyncio
import json
import os
from dataclasses import dataclass
from urllib.parse import urlsplit

import aiohttp
from oix import App


@dataclass(frozen=True)
class Access:
    installation: str
    channel: str
    users: frozenset[str]


def required(name):
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Set {name} before starting the app")
    return value


def webhook_url():
    value = required("N8N_STATUS_URL")
    url = urlsplit(value)
    local = url.hostname in {"localhost", "127.0.0.1", "::1"}
    if not (
        url.hostname
        and (url.scheme == "https" or (url.scheme == "http" and local))
        and url.path.endswith("/webhook/homelab-status")
        and url.username is None
        and url.password is None
        and not url.query
        and not url.fragment
    ):
        raise ValueError(
            "Use an HTTPS status webhook URL (HTTP is allowed on loopback)"
        )
    return value


async def read_status(url, key):
    try:
        timeout = aiohttp.ClientTimeout(total=6)
        async with (
            aiohttp.ClientSession(timeout=timeout) as client,
            client.post(
                url, headers={"X-Status-Key": key}, json={}, allow_redirects=False
            ) as response,
        ):
            if response.status != 200 or response.content_type != "application/json":
                return "unknown"
            # Read at most 1 KiB, including chunked responses without Content-Length.
            try:
                await response.content.readexactly(1025)
            except asyncio.IncompleteReadError as exc:
                payload = json.loads(exc.partial)
            else:
                return "unknown"
            if payload == {"service": "n8n", "status": "ok"}:
                return "ok"
            if payload == {"service": "n8n", "status": "unavailable"}:
                return "unavailable"
    except (
        aiohttp.ClientError,
        TimeoutError,
        ValueError,
        UnicodeError,
        RecursionError,
    ):
        pass
    return "unknown"


async def respond(event, access, url, key):
    if (
        event.installation_id != access.installation
        or event.channel_id != access.channel
        or event.actor.get("id") not in access.users
        or not event.message_id
    ):
        return
    status = await read_status(url, key)
    reports = {
        "ok": "n8n readiness check passed.",
        "unavailable": "n8n readiness check failed.",
        "unknown": "n8n readiness is unknown. The status workflow did not return a valid report.",
    }
    await event.reply(reports[status])


def create_app():
    app = App(
        manifest_id="homelab-status",
        name="Homelab Status",
        scopes=["channels:mentions:read", "channels:messages:write"],
    )
    if os.getenv("STATUS_DISCOVER_IDS") == "1":

        @app.on("channel.mention")
        async def identify(event):
            print(
                json.dumps(
                    {
                        "installation": event.installation_id,
                        "channel": event.channel_id,
                        "user": event.actor.get("id"),
                    }
                ),
                flush=True,
            )

        return app

    users = frozenset(
        s.strip() for s in required("STATUS_USER_IDS").split(",") if s.strip()
    )
    if not users:
        raise ValueError("STATUS_USER_IDS requires at least one user ID")
    access = Access(
        required("STATUS_INSTALLATION_ID"), required("STATUS_CHANNEL_ID"), users
    )
    url, key = webhook_url(), required("N8N_STATUS_KEY")

    @app.on("channel.mention")
    async def status(event):
        await respond(event, access, url, key)

    return app


if __name__ == "__main__":
    create_app().run()
