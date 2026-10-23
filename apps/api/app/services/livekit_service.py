import datetime
from livekit import api
from app.core.config import settings


class LiveKitService:
    def __init__(self):
        self.api_key = settings.LIVEKIT_API_KEY
        self.api_secret = settings.LIVEKIT_API_SECRET
        self.public_url = settings.LIVEKIT_PUBLIC_URL

    def create_token(
        self,
        room_name: str,
        user_id: str,
        display_name: str,
        is_host: bool = False,
    ) -> str:
        """
        Creates a scoped, short-lived JWT grant for connecting to LiveKit SFU.
        Both hosts and viewers can publish audio (for voice chat).
        Hosts also receive permission to publish screen-share video tracks.
        """
        grant = api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        )

        token = (
            api.AccessToken(self.api_key, self.api_secret)
            .with_identity(user_id)
            .with_name(display_name)
            .with_ttl(datetime.timedelta(hours=2))
            .with_grants(grant)
        )

        return token.to_jwt()


livekit_service = LiveKitService()
