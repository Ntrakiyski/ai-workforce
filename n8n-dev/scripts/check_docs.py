#!/usr/bin/env python3
"""Verify internal Markdown links, evidence-index structure and research baseline.

This deliberately does NOT validate n8n workflow JSON. No network calls are made.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
INDEX = Path("n8n-dev") / "research" / "evidence-index.json"
LINK_RE = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")
ALLOWED = {"VERIFIED_RUNTIME", "VERIFIED_SOURCE", "PROPOSED_STANDARD", "SECONDARY_CLAIM", "UNVERIFIED"}


def check_repository(root: Path = ROOT, index_path: Path = INDEX) -> list[str]:
    issues: list[str] = []
    markdown = sorted(p for p in root.rglob("*.md") if "node_modules" not in p.parts)
    for doc in markdown:
        for match in LINK_RE.finditer(doc.read_text(encoding="utf-8")):
            raw = match.group(1).strip()
            if raw.startswith(("http://", "https://", "mailto:", "#")):
                continue
            # Markdown optional titles and fragments are not local filesystem components.
            path = unquote(raw.split("#", 1)[0].split(" ", 1)[0])
            if not path:
                continue
            if not (doc.parent / path).exists():
                issues.append(f"{doc.relative_to(root)}: broken local link {raw}")
    index = root / index_path
    if not index.exists():
        issues.append(f"Missing {index_path}")
        return issues
    try:
        data = json.loads(index.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        issues.append(f"Invalid evidence index: {exc}")
        return issues
    base = data.get("research_baseline", {})
    if not base.get("version") or not re.fullmatch(r"[0-9a-f]{40}", base.get("commit", "")):
        issues.append("Research baseline must pin version and 40-character commit")
    if base.get("runtime_tested") is not False:
        issues.append("Baseline must not claim runtime testing without evidence")
    seen: set[str] = set()
    for n, item in enumerate(data.get("findings", [])):
        if item.get("id") in seen or not item.get("id"):
            issues.append(f"Duplicate or missing finding ID at index {n}")
        seen.add(item.get("id", ""))
        if item.get("status") not in ALLOWED:
            issues.append(f"Invalid evidence status for {item.get('id')}")
        if not str(item.get("url", "")).startswith("https://"):
            issues.append(f"Missing HTTPS provenance for {item.get('id')}")
    if not markdown:
        issues.append("No Markdown documentation found")
    return issues


def main() -> int:
    issues = check_repository()
    if issues:
        for issue in issues:
            print("ERROR:", issue)
        return 1
    print("PASS: documentation links and evidence structure are internally consistent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
