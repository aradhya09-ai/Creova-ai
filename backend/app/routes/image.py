"""Image generation API routes."""
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models import database as db
from app.services import image_service

router = APIRouter(prefix="/api/image", tags=["image"])


class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2500)
    negative_prompt: str = ""
    style: str = "Cinematic"
    aspect_ratio: str = "1:1"
    resolution: int = 768
    num_images: int = 1
    seed: int | None = None
    guidance_scale: float = 7.5
    steps: int = 30


@router.post("/generate")
async def generate_image(req: ImageRequest):
    try:
        results = image_service.generate_image(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            style=req.style,
            aspect_ratio=req.aspect_ratio,
            resolution=req.resolution,
            num_images=req.num_images,
            seed=req.seed,
            guidance_scale=req.guidance_scale,
            steps=req.steps,
        )
    except image_service.GenerationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    project_id = str(uuid.uuid4())[:12]
    entries = []
    for r in results:
        entry = {
            "id": str(uuid.uuid4())[:12],
            "type": "image",
            "kind": "generated",
            "prompt": req.prompt,
            "filename": r["filename"],
            "preview": r["url"],
            "metadata": {
                "style": req.style,
                "aspect_ratio": req.aspect_ratio,
                "resolution": req.resolution,
                "seed": r.get("seed"),
                "mode": r.get("mode"),
                "model": r.get("model"),
            },
            "project_id": project_id,
        }
        db.add_history(entry)
        entries.append(entry)

    project_name = req.prompt[:60].strip() or "New Image Project"
    db.save_project(project_id, project_name, [
        {"type": "image", "filename": r["filename"], "url": r["url"], "prompt": req.prompt}
        for r in results
    ])

    return {
        "results": results,
        "entries": entries,
        "project_id": project_id,
        "demo": all(r.get("demo") for r in results),
        "mode": results[0].get("mode", "demo") if results else "demo",
    }


@router.post("/upscale")
async def upscale_image(req: dict):
    filename = req.get("filename", "")
    if not filename:
        raise HTTPException(status_code=400, detail="filename required")
    result = image_service.upscale_image(filename)
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")
    entry = {
        "id": str(uuid.uuid4())[:12],
        "type": "image",
        "kind": "upscaled",
        "prompt": f"Upscale of {filename}",
        "filename": result["filename"],
        "preview": result["url"],
        "metadata": {"mode": "service", "action": "upscale"},
        "project_id": "",
    }
    db.add_history(entry)
    return {"result": result, "entry": entry}


@router.post("/convert")
async def convert_image(req: dict):
    filename = req.get("filename", "")
    fmt = req.get("format", "jpg")
    if not filename:
        raise HTTPException(status_code=400, detail="filename required")
    result = image_service.convert_image(filename, fmt)
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"result": result}