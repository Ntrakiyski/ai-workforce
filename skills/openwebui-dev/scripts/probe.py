"""Check Open WebUI version, readiness and optional caller-specific model visibility."""

import argparse
import ipaddress
import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def is_loopback(hostname):
    if hostname == "localhost":
        return True
    try:
        return ipaddress.ip_address(hostname).is_loopback
    except ValueError:
        return False


def request_json(opener, url, token=None):
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    with opener.open(Request(url, headers=headers), timeout=5) as response:
        body = response.read(4 * 1024 * 1024 + 1)
    if len(body) > 4 * 1024 * 1024:
        raise ValueError("Response exceeds probe limit")
    value = json.loads(body)
    if not isinstance(value, dict):
        raise ValueError("Expected an object")
    return value


def summarize(path, data):
    if path == "/api/version" and isinstance(data.get("version"), str) and data["version"]:
        return {"version": data["version"]}
    if path in {"/health", "/ready"} and data.get("status") is True:
        return {"available": True}
    if path == "/api/models" and isinstance(data.get("data"), list):
        return {"visible_model_count": len(data["data"])}
    raise ValueError("Unexpected response shape")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url", help="Instance URL, including any reverse-proxy path prefix")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    target = urlsplit(base)
    if (
        target.scheme not in {"http", "https"}
        or not target.hostname
        or target.username is not None
        or target.password is not None
        or target.query
        or target.fragment
    ):
        parser.error("Use an HTTP(S) instance URL without credentials, query or fragment.")
    token = os.environ.get("OPENWEBUI_TOKEN")
    if token and target.scheme != "https" and not is_loopback(target.hostname):
        parser.error("An authenticated probe needs HTTPS or a loopback address.")
    opener = build_opener(NoRedirect())
    checks = ["/api/version", "/health", "/ready"]
    if token:
        checks.append("/api/models")
    result = {}
    failed = False
    for path in checks:
        try:
            data = request_json(opener, base + path, token if path == "/api/models" else None)
            result[path] = summarize(path, data)
        except HTTPError as error:
            result[path] = {"http_status": error.code}
            error.close()
            failed = True
        except (OSError, URLError, ValueError) as error:
            result[path] = {"error": type(error).__name__}
            failed = True
    if not token:
        result["/api/models"] = {"skipped": "No caller token"}
    print(json.dumps(result, indent=2))
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
