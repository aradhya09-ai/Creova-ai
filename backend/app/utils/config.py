"""Configuration & environment loading for CREOVA AI backend."""
import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")
load_dotenv()  # also try local dir


def _settings_map():
    """Read provider overrides saved via Settings -> AI Providers (local DB).

    Values stored in the settings table take precedence over environment
    variables so users can change providers from the UI without a restart.
    """
    try:
        from app.models import database as db

        return db.get_settings_map()
    except Exception:
        return {}


class Config:
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")
    GENERATED_DIR = Path(os.getenv("GENERATED_DIR", str(BASE_DIR / "generated")))
    UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))

    # AI provider config (optional, env fallback)
    HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")
    HF_IMAGE_MODEL = os.getenv("HF_IMAGE_MODEL", "stabilityai/sdxl-turbo")
    HF_IMAGE_FALLBACK_MODEL = os.getenv("HF_IMAGE_FALLBACK_MODEL", "black-forest-labs/FLUX.1-schnell")
    IMG_LOCAL_ENDPOINT = os.getenv("IMG_LOCAL_ENDPOINT", "")
    VIDEO_ENDPOINT = os.getenv("VIDEO_ENDPOINT", "")
    TTS_ENDPOINT = os.getenv("TTS_ENDPOINT", "")

    # Google Gemini / Veo 2 (free tier)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    VEO_MODEL = os.getenv("VEO_MODEL", "veo-2.0-generate-001")
    GEMINI_HOST = os.getenv("GEMINI_HOST", "https://generativelanguage.googleapis.com/v1beta")

    # Pollinations.ai (free API key, pollen credits; nova-reel is free)
    POLLINATIONS_KEY = os.getenv("POLLINATIONS_KEY", "")
    POLLINATIONS_HOST = os.getenv("POLLINATIONS_HOST", "https://gen.pollinations.ai")
    POLLINATIONS_VIDEO_MODEL = os.getenv("POLLINATIONS_VIDEO_MODEL", "amazon/nova-reel-v1")

    # Agnes AI (genuinely free video API, 20 RPM rate cap)
    AGNES_KEY = os.getenv("AGNES_KEY", "")
    AGNES_HOST = os.getenv("AGNES_HOST", "https://apihub.agnes-ai.com")
    AGNES_VIDEO_MODEL = os.getenv("AGNES_VIDEO_MODEL", "agnes-video-v2.0")
    AGNES_IMAGE_MODEL = os.getenv("AGNES_IMAGE_MODEL", "agnes-image-2.5-flash")
    VIDEO_BACKEND = os.getenv("VIDEO_BACKEND", "auto")  # auto | agnes | pollinations | veo | endpoint

    # Public URL of this backend, used to build absolute URLs for media refs
    # the model providers must be able to fetch. Render injects
    # RENDER_EXTERNAL_URL automatically; override with PUBLIC_BASE_URL if needed.
    PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "") or os.getenv("RENDER_EXTERNAL_URL", "")

    @classmethod
    def hf_token(cls):
        return _settings_map().get("hf_token") or os.getenv("HUGGINGFACE_TOKEN", "") or cls.HUGGINGFACE_TOKEN

    @classmethod
    def hf_image_model(cls):
        return _settings_map().get("hf_image_model") or cls.HF_IMAGE_MODEL

    @classmethod
    def video_backend(cls):
        return _settings_map().get("video_backend") or cls.VIDEO_BACKEND

    @classmethod
    def pollinations_key(cls):
        return _settings_map().get("pollinations_key") or cls.POLLINATIONS_KEY or os.getenv("POLLINATIONS_KEY", "")

    @classmethod
    def pollinations_video_model(cls):
        return _settings_map().get("pollinations_video_model") or cls.POLLINATIONS_VIDEO_MODEL

    @classmethod
    def pollinations_host(cls):
        return (_settings_map().get("pollinations_host") or cls.POLLINATIONS_HOST).rstrip("/")

    @classmethod
    def agnes_key(cls):
        return _settings_map().get("agnes_key") or cls.AGNES_KEY or os.getenv("AGNES_KEY", "")

    @classmethod
    def agnes_video_model(cls):
        return _settings_map().get("agnes_video_model") or cls.AGNES_VIDEO_MODEL

    @classmethod
    def agnes_image_model(cls):
        return _settings_map().get("agnes_image_model") or cls.AGNES_IMAGE_MODEL

    @classmethod
    def agnes_host(cls):
        return (_settings_map().get("agnes_host") or cls.AGNES_HOST).rstrip("/")

    @classmethod
    def img_local_endpoint(cls):
        return _settings_map().get("img_endpoint") or cls.IMG_LOCAL_ENDPOINT or os.getenv("IMG_LOCAL_ENDPOINT", "")

    @classmethod
    def video_endpoint(cls):
        return _settings_map().get("video_endpoint") or cls.VIDEO_ENDPOINT or os.getenv("VIDEO_ENDPOINT", "")

    @classmethod
    def tts_endpoint(cls):
        return _settings_map().get("tts_endpoint") or cls.TTS_ENDPOINT or os.getenv("TTS_ENDPOINT", "")

    @classmethod
    def gemini_api_key(cls):
        return _settings_map().get("gemini_api_key") or cls.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @classmethod
    def veo_model(cls):
        return _settings_map().get("veo_model") or cls.VEO_MODEL

    @classmethod
    def ensure_dirs(cls):
        cls.GENERATED_DIR.mkdir(parents=True, exist_ok=True)
        for sub in ("images", "videos", "audio", "cards", "projects"):
            (cls.GENERATED_DIR / sub).mkdir(parents=True, exist_ok=True)
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


Config.ensure_dirs()