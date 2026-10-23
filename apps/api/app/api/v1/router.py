from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, rooms, media

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(media.router, prefix="/rooms", tags=["Media"])
