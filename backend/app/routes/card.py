"""Card generation API routes."""
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models import database as db
from app.services import card_service

router = APIRouter(prefix="/api/card", tags=["card"])


class CardRequest(BaseModel):
    title: str = ""
    description: str = ""
    quote: str = ""
    author: str = ""
    template: str = "Motivation"
    accent: str = "#8b5cf6"
    background: str = "#0f0f23"
    width: int = 1080
    height: int = 1920


@router.post("/generate")
async def generate_card(req: CardRequest):
    if not (req.title or req.quote):
        raise HTTPException(status_code=400, detail="Title or quote is required")

    payload = {
        "title": req.title,
        "description": req.description,
        "quote": req.quote,
        "author": req.author,
        "template": req.template,
        "accent": req.accent,
        "background": req.background,
        "width": req.width,
        "height": req.height,
    }
    result = card_service.generate_card(payload)

    entry = {
        "id": str(uuid.uuid4())[:12],
        "type": "card",
        "kind": "generated",
        "prompt": req.title or req.quote,
        "filename": f"{result['id']}.png",
        "preview": result["preview"],
        "metadata": {"template": req.template, "files": result["files"]},
        "project_id": "",
    }
    db.add_history(entry)
    return {"result": result, "entry": entry, "demo": False, "mode": "service"}


@router.post("/render")
async def render_card(req: CardRequest):
    """Alternate render-only path for the canvas editor (same as generate)."""
    return await generate_card(req)