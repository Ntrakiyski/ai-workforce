"""
title: Disable streaming for a test model
description: Force a complete response while troubleshooting a staging model.
"""


class Filter:
    def inlet(self, body: dict) -> dict:
        return {**body, "stream": False}
