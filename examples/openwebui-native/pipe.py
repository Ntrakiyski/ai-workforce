"""
title: Local wiring check
description: A deterministic reply for testing model selection without a provider.
"""


class Pipe:
    def pipe(self, body: dict) -> str:
        return "The local Pipe received your chat request."
