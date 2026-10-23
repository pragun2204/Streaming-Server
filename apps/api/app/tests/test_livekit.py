import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_livekit_token_generation_and_authorization():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as host_client:
        login_res = await host_client.post("/api/v1/auth/guest", json={"displayName": "HostAlice"})
        assert login_res.status_code == 200
        user_id = login_res.json()["id"]

        room_res = await host_client.post("/api/v1/rooms", json={"name": "LiveKit Party"})
        assert room_res.status_code == 201
        room_id = room_res.json()["id"]

        # 1. Active host requests LiveKit token
        token_res = await host_client.post(f"/api/v1/rooms/{room_id}/livekit-token")
        assert token_res.status_code == 200
        token_data = token_res.json()
        assert "token" in token_data
        assert token_data["roomName"] == f"room_{room_id}"
        assert token_data["participantIdentity"] == user_id
        assert len(token_data["token"]) > 20

    # 2. Non-member user attempts to get LiveKit token -> MUST BE REJECTED (403)
    async with AsyncClient(transport=transport, base_url="http://testserver") as stranger_client:
        await stranger_client.post("/api/v1/auth/guest", json={"displayName": "Stranger"})
        unauth_res = await stranger_client.post(f"/api/v1/rooms/{room_id}/livekit-token")
        assert unauth_res.status_code == 403
