from __future__ import annotations

import html
import re
from html.parser import HTMLParser
from typing import Any

import httpx

BOARD_JOBS_URL = "https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"

_BLOCK_TAGS = {"p", "div", "li", "br", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol"}


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data.strip())

    def handle_endtag(self, tag: str) -> None:
        if tag in _BLOCK_TAGS:
            self.parts.append("\n")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "br":
            self.parts.append("\n")


def strip_html(html_content: str) -> str:
    parser = _TextExtractor()
    parser.feed(html.unescape(html_content))
    text = " ".join(parser.parts)
    text = re.sub(r"\s*\n\s*", "\n", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    return text.strip()


def fetch_board_jobs(board_token: str) -> list[dict[str, Any]]:
    url = BOARD_JOBS_URL.format(board_token=board_token)
    response = httpx.get(url, params={"content": "true"}, timeout=30)
    response.raise_for_status()
    return response.json()["jobs"]


def to_job_payload(raw_job: dict[str, Any], company_name: str) -> dict[str, Any]:
    return {
        "source": "greenhouse",
        "external_id": str(raw_job["id"]),
        "company": company_name,
        "title": raw_job["title"],
        "level": None,
        "location": (raw_job.get("location") or {}).get("name"),
        "min_years_experience": None,
        "max_years_experience": None,
        "education": None,
        "employment_type": None,
        "url": raw_job["absolute_url"],
        "description": strip_html(raw_job["content"]) if raw_job.get("content") else None,
        "posted_at": raw_job.get("first_published"),
        "is_active": True,
    }
