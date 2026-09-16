"""Text-to-speech service adapter.

Priority:
  1. Local Coqui TTS / espeak / system binary if configured or installed.
  2. Browser Web Speech API is handled by the frontend (no audio backend needed).
  3. If an uploaded reference voice is used, this service performs simple
     pitch/formant-free cloning placeholder (behaves like TTS with the
     reference voice's gender/speed adjustments) — actual voice cloning needs
     a dedicated model (Coqui XTTS / OpenVoice), wired via TTS_ENDPOINT.
"""
import os
import shutil
import subprocess
import uuid
import wave
from pathlib import Path

from app.utils.config import Config

SERVICE_NAME = "TextToSpeechService"


class GenerationError(Exception):
    pass


def _audio_dir():
    d = Config.GENERATED_DIR / "audio"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _synthesize_wav(text, speed=1.0, pitch_shift=0, voice=None):
    """Minimal WAV synthesis (beeps/tone-based placeholder) only used when no
    TTS engine is available. Real speech uses browser Web Speech API."""
    import math
    import struct

    duration = max(0.8, min(12, len(text) / 12.0))
    sample_rate = 22050
    dur_frames = int(duration * sample_rate)
    frames = []
    # a gentle, faint carrier so the file is a valid "voice-like" placeholder
    for i in range(dur_frames):
        t = i / sample_rate
        envelope = math.exp(-3.0 * (t / duration))
        freq = 165 * (pitch_shift + 1.0) * (0.97 + 0.06 * math.sin(2 * math.pi * 3.7 * t))
        base = 0.10 * envelope * math.sin(2 * math.pi * freq * t)
        vib = 0.03 * envelope * math.sin(2 * math.pi * (freq * 1.5) * t)
        val = base + vib
        frames.append(struct.pack("<h", int(max(-1.0, min(1.0, val)) * 30000)))

    d = _audio_dir()
    fn = f"tts_{uuid.uuid4().hex[:10]}.wav"
    path = d / fn
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b"".join(frames))
    rel = str(Path("generated") / "audio" / fn)
    return {
        "filename": fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "placeholder",
        "format": "wav",
    }


def _edge_tts(text, voice="female", speed=1.0, pitch_shift=0.0):
    """Free Microsoft Edge neural TTS (edge-tts, no API key needed)."""
    import asyncio

    try:
        import edge_tts
    except ImportError:
        return None

    voice_map = {
        "female": "en-US-JennyNeural",
        "male": "en-US-GuyNeural",
        "neutral": "en-US-AriaNeural",
    }
    edge_voice = voice_map.get((voice or "female").lower(), "en-US-JennyNeural")
    delta = round((speed - 1.0) * 100)
    rate = f"{delta:+d}%" if delta else "+0%"
    pitch_delta = int(round(pitch_shift * 20))
    pitch = f"{pitch_delta:+d}Hz" if pitch_delta else "+0Hz"

    d = _audio_dir()
    fn = f"tts_{uuid.uuid4().hex[:10]}.mp3"
    path = d / fn
    try:
        asyncio.run(edge_tts.Communicate(text, edge_voice, rate=rate, pitch=pitch).save(str(path)))
        if not path.exists() or path.stat().st_size == 0:
            return None
    except Exception:
        return None
    rel = str(Path("generated") / "audio" / fn)
    return {
        "filename": fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "edge",
        "model": f"edge-tts ({edge_voice})",
        "format": "mp3",
    }


def _coqui_tts(text, speed=1.0):
    """Generate with Coqui TTS if installed."""
    try:
        from TTS.api import TTS  # type: ignore

        tts = TTS("tts_models/en/ljspeech/tacotron2-DDC", gpu=False)
        d = _audio_dir()
        fn = f"tts_{uuid.uuid4().hex[:10]}.wav"
        path = d / fn
        tts.tts_to_file(text=text, file_path=str(path), speed=speed)
        rel = str(Path("generated") / "audio" / fn)
        return {
            "filename": fn,
            "path": rel,
            "url": f"/{rel.replace(os.sep, '/')}",
            "mode": "coqui",
            "model": "tts_models/en/ljspeech/tacotron2-DDC",
            "format": "wav",
        }
    except ImportError:
        return None


def _espeak_tts(text, speed=1.0):
    if shutil.which("espeak-ng") or shutil.which("espeak"):
        exe = shutil.which("espeak-ng") or shutil.which("espeak")
        d = _audio_dir()
        fn = f"tts_{uuid.uuid4().hex[:10]}.wav"
        path = d / fn
        try:
            subprocess.run(
                [exe, "-w", str(path), "-s", str(int(150 * speed)), text],
                check=True,
                capture_output=True,
            )
            rel = str(Path("generated") / "audio" / fn)
            return {
                "filename": fn,
                "path": rel,
                "url": f"/{rel.replace(os.sep, '/')}",
                "mode": "espeak",
                "model": "espeak-ng",
                "format": "wav",
            }
        except Exception:
            return None
    return None


def synthesize_tts(
    text,
    voice="female",
    style="Natural",
    emotion="Calm",
    speed=1.0,
    pitch_shift=0.0,
    reference_voice_file=None,
):
    # 1) Endpoint
    if Config.tts_endpoint():
        try:
            import requests

            resp = requests.post(
                f"{Config.tts_endpoint().rstrip('/')}/synthesize",
                json={
                    "text": text,
                    "voice": voice,
                    "style": style,
                    "emotion": emotion,
                    "speed": speed,
                    "pitch_shift": pitch_shift,
                    "reference_voice_file": reference_voice_file,
                },
                timeout=120,
            )
            if resp.status_code == 200 and resp.content:
                d = _audio_dir()
                fn = f"tts_{uuid.uuid4().hex[:10]}.wav"
                (d / fn).write_bytes(resp.content)
                rel = str(Path("generated") / "audio" / fn)
                return {
                    "filename": fn,
                    "path": rel,
                    "url": f"/{rel.replace(os.sep, '/')}",
                    "mode": "endpoint",
                    "model": Config.tts_endpoint(),
                    "format": "wav",
                }
        except Exception as exc:
            print(f"[{SERVICE_NAME}] endpoint failed: {exc}")

    # 2) edge-tts (free Microsoft neural voices, no key)
    result = _edge_tts(text, voice=voice, speed=speed, pitch_shift=pitch_shift)
    if result:
        return result

    # 3) Coqui
    result = _coqui_tts(text, speed=speed)
    if result:
        return result

    # 4) espeak
    result = _espeak_tts(text, speed=speed)
    if result:
        return result

    # 5) Placeholder — real speech via browser Web Speech API
    return _synthesize_wav(text, speed=speed, pitch_shift=pitch_shift)


def convert_to_mp3(wav_path):
    d = _audio_dir()
    out_fn = Path(wav_path).stem + ".mp3"
    out_path = d / out_fn
    if shutil.which("ffmpeg"):
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-qscale:a", "2", str(out_path)],
                check=True,
                capture_output=True,
            )
            return {"filename": out_fn, "path": str(Path("generated") / "audio" / out_fn), "url": f"/generated/audio/{out_fn}"}
        except Exception:
            return None
    return None