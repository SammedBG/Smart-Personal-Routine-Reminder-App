"""Tests for completion and streak endpoints."""

import pytest
from httpx import AsyncClient


API = "/api/v1"


async def _setup_user_with_reminder(client: AsyncClient, email: str):
    """Register, login, create a daily reminder, return (token, reminder_id)."""
    await client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "securepassword"},
    )
    login = await client.post(
        f"{API}/auth/login",
        json={"email": email, "password": "securepassword"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        f"{API}/reminders/",
        headers=headers,
        json={
            "title": "Test reminder",
            "reminder_type": "custom",
            "time_of_day": "08:00:00",
            "repeat_type": "daily",
        },
    )
    rid = resp.json()["id"]
    return token, rid


@pytest.mark.asyncio
async def test_record_completion(client: AsyncClient):
    token, rid = await _setup_user_with_reminder(client, "comp@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        f"{API}/completions/",
        headers=headers,
        json={
            "reminder_id": rid,
            "status": "done",
            "scheduled_at": "2025-01-15T08:00:00Z",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert data["reminder_id"] == rid


@pytest.mark.asyncio
async def test_completion_ownership_check(client: AsyncClient):
    """Recording a completion for a non-existent/other user's reminder should fail."""
    await client.post(
        f"{API}/auth/register",
        json={"email": "own@example.com", "password": "securepassword"},
    )
    login = await client.post(
        f"{API}/auth/login",
        json={"email": "own@example.com", "password": "securepassword"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        f"{API}/completions/",
        headers=headers,
        json={
            "reminder_id": "00000000-0000-0000-0000-000000000000",
            "status": "done",
            "scheduled_at": "2025-01-15T08:00:00Z",
        },
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_today_completions(client: AsyncClient):
    token, rid = await _setup_user_with_reminder(client, "today@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get(f"{API}/completions/today", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_streak_info(client: AsyncClient):
    token, rid = await _setup_user_with_reminder(client, "streak@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get(f"{API}/completions/streak", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "current_streak" in data
    assert "longest_streak" in data
    assert "today_done" in data
    assert "weekly_stats" in data
