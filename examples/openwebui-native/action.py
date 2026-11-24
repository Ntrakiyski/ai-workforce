"""
title: Count conversation messages
description: Display the number of messages in the current action payload.
"""


class Action:
    async def action(self, body: dict, __event_emitter__) -> None:
        count = len(body.get("messages", []))
        await __event_emitter__({
            "type": "notification",
            "data": {"type": "info", "content": f"Messages in this request: {count}"},
        })
