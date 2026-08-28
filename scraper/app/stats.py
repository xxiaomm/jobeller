from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


DEFAULT_STATS_FILE = Path(__file__).resolve().parents[1] / "data" / "scrape_history.jsonl"


@dataclass
class CompanyScrapeStats:
    company: str
    success: bool
    duration_seconds: float
    fetched: int = 0
    created: int = 0
    updated: int = 0
    deactivated: int = 0
    error: str | None = None


@dataclass
class ScrapeRunStats:
    started_at: str
    finished_at: str
    duration_seconds: float
    companies_total: int
    companies_succeeded: int
    companies_failed: int
    fetched: int
    created: int
    updated: int
    deactivated: int
    companies: list[CompanyScrapeStats] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def stats_file_path() -> Path:
    configured_path = os.environ.get("SCRAPER_STATS_FILE")
    return Path(configured_path).expanduser() if configured_path else DEFAULT_STATS_FILE


def save_run_stats(stats: ScrapeRunStats) -> Path:
    path = stats_file_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as history_file:
        json.dump(stats.to_dict(), history_file, ensure_ascii=False)
        history_file.write("\n")
    return path


def load_recent_stats(limit: int = 10) -> list[dict[str, Any]]:
    path = stats_file_path()
    if not path.exists():
        return []

    with path.open(encoding="utf-8") as history_file:
        lines = history_file.readlines()

    recent: list[dict[str, Any]] = []
    for line in lines[-limit:]:
        if line.strip():
            recent.append(json.loads(line))
    return recent


def print_recent_stats(limit: int = 10) -> None:
    runs = load_recent_stats(limit)
    if not runs:
        print(f"No scrape history found at {stats_file_path()}")
        return

    print(f"Recent scrape runs ({len(runs)} shown, newest last):")
    for run in runs:
        print(
            f"{run['started_at']} | {run['duration_seconds']:.2f}s | "
            f"companies {run['companies_succeeded']}/{run['companies_total']} succeeded, "
            f"{run['companies_failed']} failed | fetched {run['fetched']}, "
            f"created {run['created']}, updated {run['updated']}, "
            f"deactivated {run['deactivated']}"
        )
