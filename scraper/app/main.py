import sys

import httpx

from app.config import API_URL
from app.sources.greenhouse import fetch_board_jobs, to_job_payload


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


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: uv run python -m app.main <greenhouse_board_token> <company_name>")
        raise SystemExit(1)

    _, board_token, company_name = sys.argv
    run(board_token, company_name)


if __name__ == "__main__":
    main()
