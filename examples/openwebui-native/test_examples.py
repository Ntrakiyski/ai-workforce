import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

from action import Action
from filter import Filter
from pipe import Pipe
from tools import Tools


class ExtensionExamples(unittest.IsolatedAsyncioTestCase):
    def test_pipe_returns_local_result(self):
        self.assertEqual(Pipe().pipe({"messages": []}), "The local Pipe received your chat request.")

    def test_filter_preserves_message_and_other_options(self):
        body = {"stream": True, "model": "test", "messages": [{"role": "user", "content": "Hi"}]}
        self.assertEqual(Filter().inlet(body), {**body, "stream": False})
        self.assertTrue(body["stream"])

    async def test_action_reports_only_count(self):
        emit = AsyncMock()
        await Action().action({"messages": [{"content": "private"}]}, emit)
        emit.assert_awaited_once_with({
            "type": "notification", "data": {"type": "info", "content": "Messages in this request: 1"}
        })

    def test_clock_is_current_utc(self):
        before = datetime.now(timezone.utc).replace(microsecond=0)
        result = datetime.fromisoformat(Tools().utc_now())
        self.assertEqual(result.utcoffset(), timedelta(0))
        self.assertLessEqual(before, result)
        self.assertLessEqual(result, datetime.now(timezone.utc))
