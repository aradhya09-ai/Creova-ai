"""Audio / TTS API routes."""
import asyncio
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models import database as db
from app.services import tts_service

router = APIRouter(prefix="/api/audio", tags=["audio"])


async def _run_in_thread(func, **kwargs):
    """Run a blocking function off the event loop (edge-tts needs its own loop)."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: func(**kwargs))


class TTSRequest(BaseModel):
    text: str
    voice: str = "female"
    style: str = "Natural"
    emotion: str = "Calm"
    speed: float = 1.0
    pitch_shift: float = 0.0


@router.post("/generate")
async def generate_tts(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        result = await _run_in_thread(
            tts_service.synthesize_tts,
            text=req.text,
            voice=req.voice,
            style=req.style,
            emotion=req.emotion,
            speed=req.speed,
            pitch_shift=req.pitch_shift,
        )
    except tts_service.GenerationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    entry = {
        "id": str(uuid.uuid4())[:12],
        "type": "audio",
        "kind": "tts",
        "prompt": req.text[:120],
        "filename": result["filename"],
        "preview": result["url"],
        "metadata": {
            "voice": req.voice,
            "style": req.style,
            "emotion": req.emotion,
            "speed": req.speed,
            "mode": result.get("mode"),
        },
        "project_id": "",
    }
    db.add_history(entry)

    return {"result": result, "entry": entry, "demo": result.get("mode", "") == "placeholder"}


@router.post("/synthesize-demo")
async def synthesize_demo(req: TTSRequest):
    """Demo path returns a metadata token the frontend uses to trigger
    the browser Web Speech API (no backend audio required)."""
    result = {
        "filename": "",
        "path": "",
        "url": "",
        "mode": "browser-tts",
        "format": "wav",
        "demo": True,
        "token": uuid.uuid4().hex[:12],
        "text": req.text,
        "voice": req.voice,
        "speed": req.speed,
    }
    return {"result": result, "demo": True}