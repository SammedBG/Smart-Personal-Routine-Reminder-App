"""Tests for reminder CRUD endpoints."""

import pytest
from httpx import AsyncClient


API = "/api/v1"


async def _register_and_login(client: AsyncClient, email: str = "rem@example.com"):
    """Helper: register + login, return access token."""
    await client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "securepassword"},
    )
    resp = await client.post(
        f"{API}/auth/login",
        json={"email": email, "password": "securepassword"},
    )
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_create_reminder(client: AsyncClient):
    token = await _register_and_login(client)
    resp = await client.post(
        f"{API}/reminders/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Take medicine",
            "reminder_type": "medicine",
            "time_of_day": "08:00:00",
            "repeat_type": "daily",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Take medicine"
    assert data["repeat_type"] == "daily"


@pytest.mark.asyncio
async def test_list_reminders(client: AsyncClient):
    token = await _register_and_login(client, "list@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create 3 reminders
    for i in range(3):
        await client.post(
            f"{API}/reminders/",
            headers=headers,
            json={
                "title": f"Reminder {i}",
                "reminder_type": "exercise",
                "time_of_day": "09:00:00",
                "repeat_type": "daily",
            },
        )

    resp = await client.get(f"{API}/reminders/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 3


@pytest.mark.asyncio
async def test_list_reminders_pagination(client: AsyncClient):
    token = await _register_and_login(client, "page@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    for i in range(5):
        await client.post(
            f"{API}/reminders/",
            headers=headers,
            json={
                "title": f"Rem {i}",
                "reminder_type": "exercise",
                "time_of_day": "09:00:00",
                "repeat_type": "daily",
            },
        )

    resp = await client.get(f"{API}/reminders/?skip=0&limit=2", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2

    resp = await client.get(f"{API}/reminders/?skip=4&limit=10", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_get_reminder(client: AsyncClient):
    token = await _register_and_login(client, "get@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post(
        f"{API}/reminders/",
        headers=headers,
        json={
            "title": "Drink water",
            "reminder_type": "custom",
            "time_of_day": "10:00:00",
            "repeat_type": "daily",
        },
    )
    rid = create_resp.json()["id"]

    resp = await client.get(f"{API}/reminders/{rid}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Drink water"


@pytest.mark.asyncio
async def test_update_reminder(client: AsyncClient):
    token = await _register_and_login(client, "update@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post(
        f"{API}/reminders/",
        headers=headers,
        json={
            "title": "Old title",
            "reminder_type": "custom",
            "time_of_day": "11:00:00",
            "repeat_type": "daily",
        },
    )
    rid = create_resp.json()["id"]

    resp = await client.patch(
        f"{API}/reminders/{rid}",
        headers=headers,
        json={"title": "New title"},
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "New title"


@pytest.mark.asyncio
async def test_delete_reminder(client: AsyncClient):
    token = await _register_and_login(client, "delete@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post(
        f"{API}/reminders/",
        headers=headers,
        json={
            "title": "To delete",
            "reminder_type": "custom",
            "time_of_day": "12:00:00",
            "repeat_type": "once",
        },
    )
    rid = create_resp.json()["id"]

    resp = await client.delete(f"{API}/reminders/{rid}", headers=headers)
    assert resp.status_code == 204

    resp = await client.get(f"{API}/reminders/{rid}", headers=headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_toggle_reminder(client: AsyncClient):
    token = await _register_and_login(client, "toggle@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post(
        f"{API}/reminders/",
        headers=headers,
        json={
            "title": "Toggle me",
            "reminder_type": "exercise",
            "time_of_day": "06:00:00",
            "repeat_type": "daily",
        },
    )
    data = create_resp.json()
    rid = data["id"]
    original_active = data["is_active"]

    resp = await client.post(f"{API}/reminders/{rid}/toggle", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_active"] != original_active
