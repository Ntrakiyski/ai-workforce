"""
title: UTC clock
description: Provide the current UTC timestamp to a model using a local tool.
"""

from datetime import datetime, timezone


class Tools:
    def utc_now(self) -> str:
        """Get the current UTC date and time in ISO 8601 format."""
        return datetime.now(timezone.utc).isoformat(timespec="seconds")
