"""Projects + History + Downloads + Models + Settings + Uploads API routes."""
import json
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.models import database as db
from app.utils.config import Config
from app.services import image_service, video_service, tts_service, card_service

router = APIRouter(prefix="/api", tags=["core"])


# ---- Projects ----

class ProjectCreate(BaseModel):
    name: str = "Untitled Project"
    assets: list = []


@router.get("/projects")
async def list_projects():
    return {"projects": db.get_projects()}


@router.post("/projects")
async def create_project(req: ProjectCreate):
    pid = str(uuid.uuid4())[:12]
    db.save_project(pid, req.name, req.assets)
    return {"project": db.get_project(pid)}


@router.get("/projects/{project_id}")
async def get_project_route(project_id: str):
    p = db.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"project": p}


@router.patch("/projects/{project_id}")
async def update_project_route(project_id: str, req: dict):
    p = db.update_project(project_id, name=req.get("name"), assets=req.get("assets"))
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"project": p}


@router.delete("/projects/{project_id}")
async def delete_project_route(project_id: str):
    db.delete_project(project_id)
    return {"ok": True}


# ---- History ----

@router.get("/history")
async def get_history_route(limit: int = 100):
    return {"items": db.get_history(limit)}


@router.delete("/history/{entry_id}")
async def delete_history_route(entry_id: str):
    db.delete_history(entry_id)
    return {"ok": True}


# ---- Downloads ----

@router.get("/download/{kind}/{filename}")
async def download_file(kind: str, filename: str):
    safe_kinds = {"images", "videos", "audio", "cards"}
    if kind not in safe_kinds or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid path")
    path = Config.GENERATED_DIR / kind / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(path), filename=filename, media_type="application/octet-stream")


# ---- Uploads (generic) ----

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    Config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    safe = file.filename.replace("\\", "_").replace("/", "_")
    fn = f"{uuid.uuid4().hex[:10]}_{safe}"
    (Config.UPLOAD_DIR / fn).write_bytes(await file.read())
    return {"filename": fn, "url": f"/uploads/{fn}"}


# ---- Models / system status ----

@router.get("/models")
async def list_models():
    """Report which generation backends are available (no secrets leaked)."""
    hf_configured = bool(Config.hf_token())
    local_img = bool(Config.img_local_endpoint())
    video_cfg = bool(Config.video_endpoint())
    tts_cfg = bool(Config.tts_endpoint())
    gemini_cfg = bool(Config.gemini_api_key())
    agnes_img = bool(Config.agnes_key())

    try:
        import torch  # noqa: F401
        torch_available = True
    except ImportError:
        torch_available = False

    return {
        "demo_mode": not (hf_configured or local_img or gemini_cfg or video_cfg or agnes_img),
        "image": {
            "default": "agnes" if agnes_img else ("huggingface" if hf_configured else ("local-endpoint" if local_img else "demo")),
            "agnes": {"available": agnes_img, "model": Config.agnes_image_model()},
            "huggingface": {"available": hf_configured, "models": [Config.hf_image_model(), Config.HF_IMAGE_FALLBACK_MODEL]},
            "local": {"available": torch_available, "models": ["stabilityai/sdxl-turbo"]},
            "local_endpoint": {"available": local_img, "endpoint": Config.img_local_endpoint()},
        },
        "video": {
            "default": "agnes" if Config.agnes_key() else ("veo" if gemini_cfg else ("endpoint" if video_cfg else "demo")),
            "agnes": {"available": bool(Config.agnes_key()), "model": Config.agnes_video_model(), "max_duration": 60},
            "gemini": {"available": gemini_cfg, "models": [Config.veo_model()]},
            "endpoint": {"available": video_cfg, "endpoint": Config.video_endpoint()},
            "local": {"available": False, "note": "Install a ComfyUI-compatible service and set VIDEO_ENDPOINT."},
        },
        "voice": {
            "default": "browser",
            "browser_tts": {"available": True},
            "endpoint": {"available": tts_cfg, "endpoint": Config.tts_endpoint()},
        },
        "voice_clone": {
            "available": tts_cfg,
            "note": "Requires Coqui XTTS / OpenVoice-compatible endpoint or TTS_ENDPOINT.",
        },
        "storage": {"backend": Config.STORAGE_BACKEND, "dir": str(Config.GENERATED_DIR)},
    }


# ---- Settings ----

class SettingsUpdate(BaseModel):
    key: str
    value: object


@router.get("/settings")
async def get_settings():
    return {"settings": db.get_settings_map()}


@router.post("/settings")
async def set_settings(req: SettingsUpdate):
    db.set_setting(req.key, req.value)
    return {"ok": True}


@router.get("/providers/test")
async def test_providers():
    """Validate configured provider keys (no secrets leaked, cheap requests)."""
    import requests

    result = {}

    gemini_key = Config.gemini_api_key()
    if gemini_key:
        model = Config.veo_model()
        host = Config.GEMINI_HOST.rstrip("/")
        try:
            r = requests.get(
                f"{host}/models/{model}",
                headers={"x-goog-api-key": gemini_key},
                timeout=20,
            )
            if r.status_code == 200:
                result["gemini"] = {"ok": True, "model": model}
            else:
                try:
                    msg = r.json()["error"]["message"]
                except Exception:
                    msg = r.text[:200]
                result["gemini"] = {"ok": False, "error": msg}
        except Exception as exc:
            result["gemini"] = {"ok": False, "error": str(exc)}
    else:
        result["gemini"] = {"ok": False, "error": "No API key saved"}

    hf_token = Config.hf_token()
    if hf_token:
        try:
            r = requests.get(
                "https://huggingface.co/api/whoami-v2",
                headers={"Authorization": f"Bearer {hf_token}"},
                timeout=20,
            )
            if r.status_code == 200:
                result["huggingface"] = {"ok": True, "user": r.json().get("name", "user")}
            else:
                result["huggingface"] = {"ok": False, "error": r.text[:200]}
        except Exception as exc:
            result["huggingface"] = {"ok": False, "error": str(exc)}
    else:
        result["huggingface"] = {"ok": False, "error": "No token saved"}

    polli_key = Config.pollinations_key()
    if polli_key:
        try:
            r = requests.get(
                f"{Config.pollinations_host()}/video/models",
                headers={"Authorization": f"Bearer {polli_key}"},
                timeout=20,
            )
            if r.status_code == 200:
                result["pollinations"] = {
                    "ok": True,
                    "model": Config.pollinations_video_model(),
                    "note": "Key valid. nova-reel costs ~0.08 pollen/sec; check balance at enter.pollinations.ai",
                }
            else:
                result["pollinations"] = {"ok": False, "error": r.text[:200]}
        except Exception as exc:
            result["pollinations"] = {"ok": False, "error": str(exc)}
    else:
        result["pollinations"] = {
            "ok": False,
            "error": "No Pollinations key. Get one at enter.pollinations.ai/keys",
        }

    result["video_endpoint"] = {"configured": bool(Config.video_endpoint())}
    result["video_backend"] = {"configured": True, "value": Config.video_backend()}

    agnes_key = Config.agnes_key()
    if agnes_key:
        try:
            r = requests.get(
                f"{Config.agnes_host()}/v1/models?all=true",
                headers={"Authorization": f"Bearer {agnes_key}"},
                timeout=20,
            )
            if r.status_code == 200:
                result["agnes"] = {
                    "ok": True,
                    "model": Config.agnes_video_model(),
                    "image_model": Config.agnes_image_model(),
                    "available": [m.get("id") for m in r.json().get("data", [])][:12],
                }
            else:
                result["agnes"] = {"ok": False, "error": r.text[:200]}
        except Exception as exc:
            result["agnes"] = {"ok": False, "error": str(exc)}
    else:
        result["agnes"] = {
            "ok": False,
            "error": "No Agnes AI key. Free key at platform.agnes-ai.com",
        }
    result["img_endpoint"] = {"configured": bool(Config.img_local_endpoint())}
    result["tts_endpoint"] = {"configured": bool(Config.tts_endpoint())}

    return {"results": result}


# ---- Export project ----

@router.get("/projects/{project_id}/export")
async def export_project(project_id: str):
    from fastapi.responses import JSONResponse

    p = db.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return JSONResponse(content={"project": p, "note": "This metadata export is JSON; binary assets are downloaded per-file."})