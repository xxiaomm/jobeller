from __future__ import annotations

from typing import Any

import pytest
from httpx import AsyncClient


def job_payload(
    external_id: str,
    *,
    company: str = "Acme",
    title: str = "Software Engineer",
    location: str = "Remote",
    salary_max: int | None = 180_000,
) -> dict[str, Any]:
    return {
        "source": "test",
        "external_id": external_id,
        "company": company,
        "title": title,
        "location": location,
        "salary_max": salary_max,
        "url": f"https://example.com/jobs/{external_id}",
        "is_active": True,
    }


async def create_user(client: AsyncClient, email: str = "user@example.com") -> str:
    response = await client.post(
        "/api/auth/signup",
        json={"email": email, "password": "password123", "full_name": "Test User"},
    )
    assert response.status_code == 201
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_email_signup_login_and_current_user(client: AsyncClient) -> None:
    signup_token = await create_user(client)

    me = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {signup_token}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "user@example.com"
    assert me.json()["auth_provider"] == "email"

    login = await client.post(
        "/api/auth/login",
        data={"username": "user@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]

    rejected = await client.post(
        "/api/auth/login",
        data={"username": "user@example.com", "password": "wrong-password"},
    )
    assert rejected.status_code == 401


@pytest.mark.asyncio
async def test_job_filters_return_only_matching_jobs(client: AsyncClient) -> None:
    jobs = [
        job_payload("1", company="Acme", title="Senior Backend Engineer", salary_max=220_000),
        job_payload("2", company="Other", title="Product Designer", salary_max=150_000),
    ]
    sync = await client.post(
        "/api/jobs/sync",
        json={"source": "test", "company": "Acme", "jobs": [jobs[0]]},
    )
    assert sync.status_code == 200
    sync = await client.post(
        "/api/jobs/sync",
        json={"source": "test", "company": "Other", "jobs": [jobs[1]]},
    )
    assert sync.status_code == 200

    response = await client.get(
        "/api/jobs",
        params={"title": "backend", "company": "acme", "location": "remote", "min_salary": 200_000},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["external_id"] == "1"


@pytest.mark.asyncio
async def test_favorites_require_auth_and_can_be_added_and_removed(client: AsyncClient) -> None:
    await client.post(
        "/api/jobs/sync",
        json={"source": "test", "company": "Acme", "jobs": [job_payload("favorite")]},
    )
    job = (await client.get("/api/jobs")).json()["items"][0]

    unauthorized = await client.post(f"/api/favorites/{job['id']}")
    assert unauthorized.status_code == 401

    token = await create_user(client)
    headers = {"Authorization": f"Bearer {token}"}
    added = await client.post(f"/api/favorites/{job['id']}", headers=headers)
    assert added.status_code == 200
    assert added.json() == {"job_id": job["id"], "favorited": True}

    favorites = await client.get("/api/favorites", headers=headers)
    assert favorites.status_code == 200
    assert [item["id"] for item in favorites.json()] == [job["id"]]

    removed = await client.delete(f"/api/favorites/{job['id']}", headers=headers)
    assert removed.status_code == 204
    assert (await client.get("/api/favorites", headers=headers)).json() == []


@pytest.mark.asyncio
async def test_sync_creates_updates_deactivates_and_reactivates_jobs(client: AsyncClient) -> None:
    first = await client.post(
        "/api/jobs/sync",
        json={
            "source": "test",
            "company": "Acme",
            "jobs": [job_payload("1"), job_payload("2", title="Designer")],
        },
    )
    assert first.json() == {"created": 2, "updated": 0, "deactivated": 0}

    second = await client.post(
        "/api/jobs/sync",
        json={
            "source": "test",
            "company": "Acme",
            "jobs": [job_payload("1", title="Staff Software Engineer")],
        },
    )
    assert second.json() == {"created": 0, "updated": 1, "deactivated": 1}
    active_jobs = (await client.get("/api/jobs")).json()
    assert active_jobs["total"] == 1
    assert active_jobs["items"][0]["title"] == "Staff Software Engineer"

    third = await client.post(
        "/api/jobs/sync",
        json={
            "source": "test",
            "company": "Acme",
            "jobs": [job_payload("1", title="Staff Software Engineer"), job_payload("2", title="Designer")],
        },
    )
    assert third.json() == {"created": 0, "updated": 2, "deactivated": 0}
    assert (await client.get("/api/jobs")).json()["total"] == 2
