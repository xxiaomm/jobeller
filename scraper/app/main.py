import sys
import time
from datetime import datetime, timezone

import httpx

from app.companies import GREENHOUSE_COMPANIES
from app.config import API_URL
from app.sources.greenhouse import fetch_board_jobs, to_job_payload
from app.stats import CompanyScrapeStats, ScrapeRunStats, print_recent_stats, save_run_stats

SCHEDULE_INTERVAL_SECONDS = 60 * 60


def run(board_token: str, company_name: str) -> dict[str, int]:
    raw_jobs = fetch_board_jobs(board_token)
    jobs = [to_job_payload(raw_job, company_name) for raw_job in raw_jobs]

    response = httpx.post(
        f"{API_URL}/api/jobs/sync",
        json={"source": "greenhouse", "company": company_name, "jobs": jobs},
        timeout=30,
    )
    response.raise_for_status()
    result = response.json()

    print(
        f"{company_name}: fetched {len(jobs)} jobs from Greenhouse "
        f"({result['created']} created, {result['updated']} updated, "
        f"{result.get('deactivated', 0)} deactivated)"
    )
    return {
        "fetched": len(jobs),
        "created": result["created"],
        "updated": result["updated"],
        "deactivated": result.get("deactivated", 0),
    }


def run_companies(companies: list[tuple[str, str]]) -> ScrapeRunStats:
    started_at = datetime.now(timezone.utc)
    run_started = time.perf_counter()
    company_results: list[CompanyScrapeStats] = []

    for board_token, company_name in companies:
        company_started = time.perf_counter()
        try:
            counts = run(board_token, company_name)
            company_results.append(
                CompanyScrapeStats(
                    company=company_name,
                    success=True,
                    duration_seconds=round(time.perf_counter() - company_started, 2),
                    **counts,
                )
            )
        except Exception as exc:
            company_results.append(
                CompanyScrapeStats(
                    company=company_name,
                    success=False,
                    duration_seconds=round(time.perf_counter() - company_started, 2),
                    error=str(exc),
                )
            )
            print(f"{company_name}: scrape failed: {exc}", file=sys.stderr)

    finished_at = datetime.now(timezone.utc)
    stats = ScrapeRunStats(
        started_at=started_at.isoformat(),
        finished_at=finished_at.isoformat(),
        duration_seconds=round(time.perf_counter() - run_started, 2),
        companies_total=len(company_results),
        companies_succeeded=sum(result.success for result in company_results),
        companies_failed=sum(not result.success for result in company_results),
        fetched=sum(result.fetched for result in company_results),
        created=sum(result.created for result in company_results),
        updated=sum(result.updated for result in company_results),
        deactivated=sum(result.deactivated for result in company_results),
        companies=company_results,
    )
    history_path = save_run_stats(stats)
    print(
        f"Run summary: {stats.companies_succeeded}/{stats.companies_total} companies succeeded, "
        f"{stats.companies_failed} failed in {stats.duration_seconds:.2f}s; "
        f"fetched {stats.fetched}, created {stats.created}, updated {stats.updated}, "
        f"deactivated {stats.deactivated}"
    )
    print(f"Stats saved to {history_path}")
    return stats


def run_all() -> ScrapeRunStats:
    return run_companies(GREENHOUSE_COMPANIES)


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

    if len(sys.argv) == 2 and sys.argv[1] == "--stats":
        print_recent_stats()
        return

    if len(sys.argv) != 3:
        print("Usage: uv run python -m app.main <greenhouse_board_token> <company_name>")
        print("       uv run python -m app.main --all")
        print("       uv run python -m app.main --schedule")
        print("       uv run python -m app.main --stats")
        raise SystemExit(1)

    _, board_token, company_name = sys.argv
    run_companies([(board_token, company_name)])


if __name__ == "__main__":
    main()
