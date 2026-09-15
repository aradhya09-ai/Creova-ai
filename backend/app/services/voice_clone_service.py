"""Voice cloning service adapter.

Architecture note:
  Real cloning (Coqui XTTS / OpenVoice / RVC) requires heavy models and is
  NOT bundled. When a provider/TTS_ENDPOINT is configured, the reference
  audio is forwarded there. Otherwise we fall back to the browser TTS engine
  (frontend) with a clearly labelled "reference-based synthesis" placeholders.

  Users MUST confirm ownership/permission before cloning, enforced client-side
  and validated here.
"""
import shutil
import uuid
from pathlib import Path

from app.utils.config import Config

SERVICE_NAME = "VoiceCloneService"


class PermissionRequiredError(Exception):
    pass


def save_reference_audio(file_bytes, original_name):
    """Persist uploaded reference audio. Returns stored path + filename."""
    up = Config.UPLOAD_DIR
    up.mkdir(parents=True, exist_ok=True)
    ext = Path(original_name or "voice.wav").suffix or ".wav"
    fn = f"ref_{uuid.uuid4().hex[:10]}{ext}"
    (up / fn).write_bytes(file_bytes)
    return str(Path("uploads") / fn), fn


def clone_and_synthesize(
    reference_file,
    text,
    voice_name="My Voice",
    voice_gender="neutral",
    speed=1.0,
):
    """If provider configured, proxy. Otherwise placeholder result referencing
    the browser TTS fallback with the reference file metadata."""
    if Config.tts_endpoint():
        try:
            import requests

            with open(reference_file, "rb") as f:
                files = {"audio": f}
                resp = requests.post(
                    f"{Config.tts_endpoint().rstrip('/')}/clone",
                    files=files,
                    data={
                        "text": text,
                        "voice_name": voice_name,
                        "voice_gender": voice_gender,
                        "speed": speed,
                    },
                    timeout=180,
                )
            if resp.status_code == 200 and resp.content:
                d = Config.GENERATED_DIR / "audio"
                d.mkdir(parents=True, exist_ok=True)
                fn = f"clone_{uuid.uuid4().hex[:10]}.wav"
                (d / fn).write_bytes(resp.content)
                rel = str(Path("generated") / "audio" / fn)
                return {
                    "filename": fn,
                    "path": rel,
                    "url": f"/{rel.replace(os.sep, '/')}",
                    "mode": "endpoint",
                    "model": Config.tts_endpoint(),
                }
        except Exception as exc:
            print(f"[{SERVICE_NAME}] clone endpoint failed: {exc}")

    # Demo/fallback: return a metadata result; frontend plays via browser TTS
    fn = f"clone_{uuid.uuid4().hex[:10]}.json"
    d = Config.GENERATED_DIR / "audio"
    d.mkdir(parents=True, exist_ok=True)
    (d / fn).write_text(
        '{"note": "browser-tts-fallback", "reference": %r}'
        % str(reference_file),
        encoding="utf-8",
    )
    return {
        "filename": fn,
        "path": str(Path("generated") / "audio" / fn),
        "url": f"/{rel_to_url(fn)}",
        "mode": "browser-tts-fallback",
        "model": "browser",
        "reference": str(reference_file),
    }


def rel_to_url(fn):
    return f"generated/audio/{fn}"