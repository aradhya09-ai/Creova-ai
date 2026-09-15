"""Video generation API routes."""
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.models import database as db
from app.services import video_service

router = APIRouter(prefix="/api/video", tags=["video"])


class VideoRequest(BaseModel):
    prompt: str
    mode: str = "text"
    duration: int = 5
    aspect_ratio: str = "16:9"
    style: str = "Cinematic"
    camera: str = "Static"
    motion_strength: int = 3
    image_url: str = ""
    video_url: str = ""
    force_demo: bool = False


@router.post("/generate")
async def generate_video(req: VideoRequest):
    if not req.prompt.strip() and req.mode == "text":
        raise HTTPException(status_code=400, detail="Prompt is required")

    try:
        result = video_service.generate_video(
            prompt=req.prompt,
            mode=req.mode,
            duration=req.duration,
            aspect=req.aspect_ratio,
            style=req.style,
            camera=req.camera,
            motion_strength=req.motion_strength,
            input_image_url=req.image_url,
            input_video_url=req.video_url,
            force_demo=req.force_demo,
        )
    except video_service.GenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    project_id = str(uuid.uuid4())[:12]
    entry = {
        "id": str(uuid.uuid4())[:12],
        "type": "video",
        "kind": "generated",
        "prompt": req.prompt,
        "filename": result["filename"],
        "preview": result["url"],
        "metadata": {
            "mode": result.get("mode"),
            "duration": req.duration,
            "style": req.style,
            "camera": req.camera,
        },
        "project_id": project_id,
    }
    db.add_history(entry)
    db.save_project(project_id, (req.prompt[:60].strip() or "New Video Project"),
                    [{"type": "video", "filename": result["filename"], "url": result["url"], "prompt": req.prompt}])

    return {
        "result": result,
        "entry": entry,
        "project_id": project_id,
        "demo": result.get("demo", False),
        "mode": result.get("mode", "demo"),
    }


@router.post("/upload")
async def upload_video_input(
    file: UploadFile = File(...),
    usage: str = Form("image_to_video"),
):
    import os
    from app.utils.config import Config

    Config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    safe = file.filename.replace("\\", "_").replace("/", "_")
    fn = f"{uuid.uuid4().hex[:10]}_{safe}"
    path = Config.UPLOAD_DIR / fn
    content = await file.read()
    path.write_bytes(content)
    return {
        "filename": fn,
        "url": f"/uploads/{fn}",
        "usage": usage,
    }