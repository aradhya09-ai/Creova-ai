"""Voice cloning API routes."""
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.models import database as db
from app.services import voice_clone_service

router = APIRouter(prefix="/api/voice", tags=["voice"])

ALLOWED_EXTS = {".mp3", ".wav", ".m4a", ".ogg", ".webm"}


@router.post("/clone")
async def clone_voice(
    file: UploadFile = File(...),
    voice_name: str = Form("My Voice"),
    voice_gender: str = Form("neutral"),
    consent: str = Form("false"),
    text: str = Form("Hello, this is my cloned voice."),
    speed: float = Form(1.0),
):
    if consent.lower() not in ("true", "1", "yes"):
        raise HTTPException(
            status_code=400,
            detail="You must confirm that you own the voice or have permission to clone it.",
        )

    orig = file.filename or "voice.wav"
    ext = "." + orig.rsplit(".", 1)[-1].lower() if "." in orig else ".wav"
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type {ext}")

    content = await file.read()
    if len(content) > 30 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file exceeds 30MB")

    ref_path, ref_fn = voice_clone_service.save_reference_audio(content, orig)

    result = voice_clone_service.clone_and_synthesize(
        reference_file=ref_path,
        text=text,
        voice_name=voice_name,
        voice_gender=voice_gender,
        speed=speed,
    )

    voice_id = str(uuid.uuid4())[:12]
    db.save_voice(voice_id, voice_name, voice_gender, ref_fn)
    db.add_history({
        "id": str(uuid.uuid4())[:12],
        "type": "audio",
        "kind": "voice-clone",
        "prompt": f"Voice clone: {voice_name}",
        "filename": result.get("filename", ref_fn),
        "preview": result.get("url", ""),
        "metadata": {"voice_name": voice_name, "gender": voice_gender, "mode": result.get("mode")},
        "project_id": "",
    })

    return {
        "voice_id": voice_id,
        "reference": f"/uploads/{ref_fn}",
        "result": result,
        "note": "If a cloning model is not configured, playback uses browser speech synthesis in the voice settings.",
    }


@router.get("/list")
async def list_voices():
    return {"voices": db.get_voices()}


@router.delete("/{voice_id}")
async def delete_voice(voice_id: str):
    db.delete_voice(voice_id)
    return {"ok": True}