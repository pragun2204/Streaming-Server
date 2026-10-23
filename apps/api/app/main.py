from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.websocket.endpoint import router as ws_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
# Import all models so metadata knows about them
import app.models # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables automatically on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup engine connections on shutdown
    await engine.dispose()


app = FastAPI(
    title="Watch Party API",
    description="High-performance, real-time backend for synchronized watch parties and LiveKit media",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
origins = settings.ALLOWED_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "service": "Watch Party Backend API",
        "docs": "/docs",
        "version": "1.0.0",
    }
