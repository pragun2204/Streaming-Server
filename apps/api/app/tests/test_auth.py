import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_guest_login_and_me(client: AsyncClient):
    # 1. Successful guest login
    res = await client.post("/api/v1/auth/guest", json={"displayName": "AliceInWonder"})
    assert res.status_code == 200
    data = res.json()
    assert data["displayName"] == "AliceInWonder"
    assert "id" in data
    assert "watchparty_session" in res.cookies

    # 2. Check /me with session cookie
    me_res = await client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["id"] == data["id"]
    assert me_data["displayName"] == "AliceInWonder"


@pytest.mark.asyncio
async def test_guest_login_invalid(client: AsyncClient):
    res = await client.post("/api/v1/auth/guest", json={"displayName": " "})
    assert res.status_code in (400, 422)


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    # Fresh client without cookies
    client.cookies.clear()
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401
