import sys
import time

import httpx

from app.companies import GREENHOUSE_COMPANIES
from app.config import API_URL
from app.sources.greenhouse import fetch_board_jobs, to_job_payload

SCHEDULE_INTERVAL_SECONDS = 60 * 60


def run(board_token: str, company_name: str) -> None:
    raw_jobs = fetch_board_jobs(board_token)
    jobs = [to_job_payload(raw_job, company_name) for raw_job in raw_jobs]

    response = httpx.post(
        f"{API_URL}/api/jobs/sync",
        json={"source": "greenhouse", "jobs": jobs},
        timeout=30,
    )
    response.raise_for_status()
    result = response.json()

    print(
        f"{company_name}: fetched {len(jobs)} jobs from Greenhouse "
        f"({result['created']} created, {result['updated']} updated)"
    )


def run_all() -> None:
    for board_token, company_name in GREENHOUSE_COMPANIES:
        run(board_token, company_name)


def run_on_schedule() -> None:
    """Run all configured sources immediately and then once every hour."""
    print("Starting hourly scraper schedule (interval: 1 hour)")
    while True:
        try:
            run_all()
        except Exception as exc:
            # A temporary source/API failure should not stop future scheduled runs.
            print(f"Scheduled scrape failed: {exc}", file=sys.stderr)

        print("Next scheduled scrape in 1 hour")
        time.sleep(SCHEDULE_INTERVAL_SECONDS)


def main() -> None:
    if len(sys.argv) == 2 and sys.argv[1] == "--schedule":
        try:
            run_on_schedule()
        except KeyboardInterrupt:
            print("Stopping scraper schedule")
        return

    if len(sys.argv) == 2 and sys.argv[1] == "--all":
        run_all()
        return

    if len(sys.argv) != 3:
        print("Usage: uv run python -m app.main <greenhouse_board_token> <company_name>")
        print("       uv run python -m app.main --all")
        print("       uv run python -m app.main --schedule")
        raise SystemExit(1)

    _, board_token, company_name = sys.argv
    run(board_token, company_name)


if __name__ == "__main__":
    main()
