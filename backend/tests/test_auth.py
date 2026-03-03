"""Tests for auth endpoints: register, login, refresh, logout."""

import pytest
from httpx import AsyncClient


API = "/api/v1"


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post(
        f"{API}/auth/register",
        json={"email": "test@example.com", "password": "securepassword", "full_name": "Test User"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    payload = {"email": "dup@example.com", "password": "securepassword"}
    await client.post(f"{API}/auth/register", json=payload)
    resp = await client.post(f"{API}/auth/register", json=payload)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    resp = await client.post(
        f"{API}/auth/register",
        json={"email": "short@example.com", "password": "abc"},
    )
    assert resp.status_code == 422  # validation error


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post(
        f"{API}/auth/register",
        json={"email": "login@example.com", "password": "securepassword"},
    )
    resp = await client.post(
        f"{API}/auth/login",
        json={"email": "login@example.com", "password": "securepassword"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        f"{API}/auth/register",
        json={"email": "wrong@example.com", "password": "securepassword"},
    )
    resp = await client.post(
        f"{API}/auth/login",
        json={"email": "wrong@example.com", "password": "badpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    await client.post(
        f"{API}/auth/register",
        json={"email": "refresh@example.com", "password": "securepassword"},
    )
    login_resp = await client.post(
        f"{API}/auth/login",
        json={"email": "refresh@example.com", "password": "securepassword"},
    )
    tokens = login_resp.json()
    resp = await client.post(
        f"{API}/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    await client.post(
        f"{API}/auth/register",
        json={"email": "logout@example.com", "password": "securepassword"},
    )
    login_resp = await client.post(
        f"{API}/auth/login",
        json={"email": "logout@example.com", "password": "securepassword"},
    )
    tokens = login_resp.json()
    resp = await client.post(
        f"{API}/auth/logout",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["detail"] == "Logged out"

    # Old refresh token should no longer work
    resp = await client.post(
        f"{API}/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert resp.status_code == 401
