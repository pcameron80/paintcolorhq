"""
fetch_page.py — SSRF-protected HTTP fetcher for drift scripts.

Validates that the resolved host is not a private/loopback IP before
fetching. Raises ValueError for any disallowed address.
"""

import ipaddress
import socket
import urllib.request
import urllib.error
from typing import Tuple


_PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

_ALLOWED_SCHEMES = {"http", "https"}


def _check_host(hostname: str) -> None:
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise ValueError(f"Cannot resolve host '{hostname}': {exc}") from exc

    for family, _type, _proto, _canon, sockaddr in addr_info:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        for net in _PRIVATE_NETWORKS:
            if ip in net:
                raise ValueError(
                    f"SSRF protection: host '{hostname}' resolves to private "
                    f"address {ip_str}"
                )


def fetch(url: str, timeout: int = 20) -> Tuple[int, dict, bytes]:
    """
    Fetch *url* and return (status_code, headers_dict, body_bytes).
    Raises ValueError for private IPs or disallowed schemes.
    """
    from urllib.parse import urlparse

    parsed = urlparse(url)
    if parsed.scheme not in _ALLOWED_SCHEMES:
        raise ValueError(f"Scheme '{parsed.scheme}' not allowed.")
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL has no hostname.")

    _check_host(hostname)

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (compatible; SEO-Drift-Monitor/1.0; "
                "+https://www.paintcolorhq.com/)"
            ),
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            headers = dict(resp.headers)
            body = resp.read()
    except urllib.error.HTTPError as exc:
        status = exc.code
        headers = dict(exc.headers) if exc.headers else {}
        body = exc.read() if exc.fp else b""

    return status, headers, body
