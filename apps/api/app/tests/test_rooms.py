import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_room_lifecycle_and_capacity():
    transport = ASGITransport(app=app)

    # 1. Create Host client
    async with AsyncClient(transport=transport, base_url="http://testserver") as host_client:
        host_login = await host_client.post("/api/v1/auth/guest", json={"displayName": "HostUser"})
        assert host_login.status_code == 200
        host_id = host_login.json()["id"]

        # Create Room
        create_res = await host_client.post("/api/v1/rooms", json={"name": "Epic Movie Night"})
        assert create_res.status_code == 201
        room_data = create_res.json()
        room_id = room_data["id"]
        invite_token = room_data["inviteToken"]
        assert room_data["hostUserId"] == host_id
        assert len(room_data["participants"]) == 1

        # 2. Add 9 more participants (total reaches 10)
        viewer_ids = []
        for i in range(1, 10):
            async with AsyncClient(transport=transport, base_url="http://testserver") as v_client:
                v_login = await v_client.post("/api/v1/auth/guest", json={"displayName": f"Viewer_{i}"})
                viewer_ids.append(v_login.json()["id"])
                join_res = await v_client.post(
                    f"/api/v1/rooms/{room_id}/join",
                    json={"inviteToken": invite_token},
                )
                assert join_res.status_code == 200

        # Check room participant count
        info_res = await host_client.get(f"/api/v1/rooms/{room_id}")
        assert info_res.status_code == 200
        assert len(info_res.json()["participants"]) == 10

        # 3. 11th participant attempts to join -> MUST BE REJECTED WITH 409 CONFLICT
        async with AsyncClient(transport=transport, base_url="http://testserver") as v11_client:
            await v11_client.post("/api/v1/auth/guest", json={"displayName": "Viewer_11"})
            overflow_res = await v11_client.post(
                f"/api/v1/rooms/{room_id}/join",
                json={"inviteToken": invite_token},
            )
            assert overflow_res.status_code == 409
            assert "maximum capacity" in overflow_res.json()["detail"]

        # 4. Host transfers host privilege to viewer 1
        transfer_res = await host_client.post(
            f"/api/v1/rooms/{room_id}/transfer-host",
            json={"newHostUserId": viewer_ids[0]},
        )
        assert transfer_res.status_code == 200
        assert transfer_res.json()["newHostUserId"] == viewer_ids[0]


@pytest.mark.asyncio
async def test_invalid_invite_rejected(client: AsyncClient):
    await client.post("/api/v1/auth/guest", json={"displayName": "Eve"})
    res = await client.post("/api/v1/rooms/random-id/join", json={"inviteToken": "invalid-token"})
    assert res.status_code in (404, 403)
