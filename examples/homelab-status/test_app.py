import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from aiohttp import web
from aiohttp.test_utils import TestServer
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from oix import Client
from oix.models import Event

from app import Access, create_app, read_status, respond, webhook_url


class StatusTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.calls = 0
        self.result = web.json_response({"status": "ok", "service": "n8n"})

        async def webhook(request):
            self.calls += 1
            self.assertEqual(request.headers["X-Status-Key"], "fixture")
            self.assertEqual(await request.json(), {})
            return self.result

        server = web.Application()
        server.router.add_post("/webhook/homelab-status", webhook)
        self.server = TestServer(server)
        await self.server.start_server()
        self.addAsyncCleanup(self.server.close)
        self.url = str(self.server.make_url("/webhook/homelab-status"))
        self.access = Access("install", "channel", frozenset({"member"}))

    def event(self):
        event = Event(
            id="event",
            type="channel.mention",
            app_id="app",
            installation_id="install",
            channel={"id": "channel"},
            actor={"id": "member"},
            data={"message_id": "message", "parent_id": "thread", "text": "status?"},
        )
        event._client = AsyncMock(spec=Client)
        return event

    async def test_reply_in_source_thread(self):
        event = self.event()
        await respond(event, self.access, self.url, "fixture")
        event.client.create_message.assert_awaited_once_with(
            "channel",
            content="n8n readiness check passed.",
            actions=None,
            embeds=None,
            parent_id="thread",
            reply_to_id="message",
        )
        self.assertEqual(self.calls, 1)

    async def test_failed_probe_is_reported(self):
        self.result = web.json_response({"service": "n8n", "status": "unavailable"})
        self.assertEqual(await read_status(self.url, "fixture"), "unavailable")

    async def test_indeterminate_results(self):
        for result in [
            web.Response(status=403),
            web.json_response({"status": "ok"}),
            web.Response(text="[" * 4000, content_type="application/json"),
            web.Response(text="{", content_type="application/json"),
            web.Response(status=307, headers={"Location": self.url}),
        ]:
            with self.subTest(result=result):
                before = self.calls
                self.result = result
                self.assertEqual(await read_status(self.url, "fixture"), "unknown")
                self.assertEqual(self.calls, before + 1)

    async def test_denied_contexts(self):
        for field, value in [
            ("installation_id", "other"),
            ("channel", {"id": "other"}),
            ("actor", {"id": "other"}),
            ("data", {}),
        ]:
            event = self.event()
            setattr(event, field, value)
            await respond(event, self.access, self.url, "fixture")
            event.client.create_message.assert_not_awaited()
        self.assertEqual(self.calls, 0)

    def test_external_http_is_rejected(self):
        with (
            patch.dict(
                os.environ,
                {"N8N_STATUS_URL": "http://n8n.example/webhook/homelab-status"},
            ),
            self.assertRaises(ValueError),
        ):
            webhook_url()

    async def test_startup(self):
        with tempfile.TemporaryDirectory() as tmp:
            key_path = Path(tmp) / "signing.pem"
            key_path.write_bytes(
                Ed25519PrivateKey.generate().private_bytes(
                    serialization.Encoding.PEM,
                    serialization.PrivateFormat.PKCS8,
                    serialization.NoEncryption(),
                )
            )
            env = {
                "API_KEY": "a" * 48,
                "APP_PRIVATE_KEY_FILE": str(key_path),
                "N8N_STATUS_URL": self.url,
                "N8N_STATUS_KEY": "fixture",
                "STATUS_INSTALLATION_ID": "install",
                "STATUS_USER_IDS": "member",
                "STATUS_CHANNEL_ID": "channel",
            }
            with patch.dict(os.environ, env, clear=True):
                app = create_app()
                self.assertEqual(
                    app.manifest["requested_scopes"],
                    ["channels:mentions:read", "channels:messages:write"],
                )
                await app.close()
                del os.environ["STATUS_INSTALLATION_ID"]
                with self.assertRaises(ValueError):
                    create_app()
