"""CREOVA AI — FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.models import database as db
from app.utils.config import Config
from app.routes import image, video, audio, voice, card, core


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    Config.ensure_dirs()
    yield


app = FastAPI(
    title="CREOVA AI",
    description="Free / open-source AI creative workspace API.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image.router)
app.include_router(video.router)
app.include_router(audio.router)
app.include_router(voice.router)
app.include_router(card.router)
app.include_router(core.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "name": "CREOVA AI", "free": True, "open_source": True}


# Static: generated + uploads
app.mount("/generated", StaticFiles(directory=str(Config.GENERATED_DIR)), name="generated")
app.mount("/uploads", StaticFiles(directory=str(Config.UPLOAD_DIR)), name="uploads")


@app.get("/")
async def root():
    return {
        "message": "CREOVA AI backend is running. Free / open-source AI workspace.",
        "docs": "/docs",
    }