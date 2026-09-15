"""Video generation service adapter.

Strategy:
  1. Compatible endpoint (self-hosted local/open-source video model) — highest quality.
  2. Procedural demo generation:
     - MP4 (H.264) when ffmpeg or PyAV is available.
     - Animated GIF (Pillow-only, plays in every browser) otherwise.
  The demo output is always clearly labeled.

  Never an infinite spinner: every path returns bytes or raises GenerationError.
"""
import json
import os
import shutil
import subprocess
import uuid
from pathlib import Path

from app.utils.config import Config
from PIL import Image, ImageDraw, ImageFilter

SERVICE_NAME = "VideoGenerationService"


class GenerationError(Exception):
    pass


def _video_dir():
    d = Config.GENERATED_DIR / "videos"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _draw_background(draw, W, H):
    """Fast vertical gradient (H draw.line calls only)."""
    for y in range(H):
        tt = y / H
        draw.line(
            [(0, y), (W, y)],
            fill=(int(10 + 26 * tt), int(8 + 16 * tt), int(26 + 50 * tt)),
        )


def _orb_frame(W, H, t, motion_strength):
    """Build an orb glow layer using small buffers + resize (O(W*H) via C)."""
    glow = Image.new("L", (W // 6, H // 6), 0)
    gd = ImageDraw.Draw(glow)
    cx = (W // 6) * 3 + int(t * (W // 12) * (motion_strength / 3))
    cy = (H // 6) * 2 - int(t * (H // 36))
    r = min(W, H) // 12
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    glow = glow.resize((W, H), Image.BILINEAR)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=min(W, H) // 40))
    return glow


def _skyline(draw, rng, W, H):
    base_y = int(H * 0.72)
    for i in range(0, W, rng.randint(14, 34)):
        bh = rng.randint(int(H * 0.1), int(H * 0.22))
        bw = max(6, W // rng.randint(20, 50))
        draw.rectangle([i, base_y - bh, i + bw, base_y], fill=(8, 6, 20))
        for wx in range(i + 2, min(i + bw, W), 4):
            for wy in range(base_y - bh + 3, base_y - 2, 6):
                if rng.random() < 0.35:
                    draw.rectangle([wx, wy, wx + 1, wy + 2], fill=(255, 190, 110))


def _render_frame(W, H, frame, total, motion_strength):
    t = frame / max(1, total)
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    _draw_background(draw, W, H)

    glow = _orb_frame(W, H, t, motion_strength)
    orb = Image.new("RGB", (W, H))
    oi = ImageDraw.Draw(orb)
    ox = int(W * (0.5 + t * 0.06 * (motion_strength / 3)))
    oy = int(H * 0.3 - t * H * 0.02)
    oi.ellipse(
        [ox - W // 10, oy - W // 10, ox + W // 10, oy + W // 10],
        fill=(139, 92, 246),
    )
    orb.putalpha(glow)
    img.paste(orb, (0, 0), orb)

    _skyline(draw, __import__("random").Random(hash((frame, 7)) % (2**32)), W, H)

    # rain
    rng = __import__("random").Random(hash((frame, 11)) % (2**32))
    for _ in range(24):
        rx = rng.randint(0, W)
        ry0 = rng.randint(0, H)
        draw.line([(rx, ry0), (rx - 2, ry0 + 10)], fill=(130, 140, 180))

    # light sweep
    sweep = int((t * 1.4 - 0.3) * W)
    for yy in range(0, H, 3):
        alpha = max(0, 60 - abs(yy - H // 2) // 6)
        if alpha > 0 and 0 < sweep < W:
            draw.point((sweep, yy), fill=(240, 220, 200))

    return img


def _encode_ffmpeg(frame_dir, fps, out_path, W, H):
    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", str(fps),
            "-i", str(frame_dir / "frame_%04d.png"),
            "-vf", f"scale={W}:{H}",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "veryfast", "-crf", "26",
            str(out_path),
        ],
        check=True,
        capture_output=True,
    )


def _encode_pyav(frame_dir, fps, out_path, W, H):
    import av  # type: ignore

    container = av.open(str(out_path), mode="w")
    stream = container.add_stream("h264", rate=fps)
    stream.width = W
    stream.height = H
    stream.pix_fmt = "yuv420p"
    for frame_file in sorted(frame_dir.glob("*.png")):
        png = Image.open(frame_file).convert("RGB").resize((W, H))
        for pkt in stream.encode(av.VideoFrame.from_image(png)):
            container.mux(pkt)
    for pkt in stream.encode():
        container.mux(pkt)
    container.close()


def _encode_gif(frames, fps, out_path, W, H):
    """Pure-Pillow animated GIF fallback — plays in every browser."""
    first = frames[0].resize((W, H))
    others = [f.resize((W, H)) for f in frames[1:]]
    first.save(
        out_path,
        save_all=True,
        append_images=others,
        duration=int(1000 / fps),
        loop=0,
        optimize=True,
    )


def _generate_demo_video(prompt, duration=5, aspect="16:9", fps=12, motion_strength=3):
    ratio = {"16:9": (640, 360), "9:16": (360, 640), "1:1": (480, 480)}
    W, H = ratio.get(aspect, (640, 360))
    out_W, out_H = W, H
    frames = max(8, int(duration * fps))

    d = _video_dir()
    base = f"vid_{uuid.uuid4().hex[:10]}"
    out_file = d / f"{base}.mp4"
    ext = "mp4"

    # Render to disk as PNGs so encoders and GIF pipeline are equivalent
    frame_dir = d / f"{base}_frames"
    frame_dir.mkdir(exist_ok=True)
    pil_frames = []
    for f in range(frames):
        img = _render_frame(W, H, f, frames, motion_strength)
        pil_frames.append(img)

    if shutil.which("ffmpeg"):
        for i, img in enumerate(pil_frames):
            img.save(frame_dir / f"frame_{i:04d}.png")
        try:
            _encode_ffmpeg(frame_dir, fps, out_file, out_W, out_H)
        except (subprocess.CalledProcessError, OSError) as exc:
            shutil.rmtree(frame_dir, ignore_errors=True)
            raise GenerationError(f"ffmpeg encoding failed: {exc}")
        container_name = "mp4"
    else:
        pyav = False
        try:
            import av  # noqa: F401
            pyav = True
        except ImportError:
            pyav = False

        if pyav:
            for i, img in enumerate(pil_frames):
                img.save(frame_dir / f"frame_{i:04d}.png")
            try:
                _encode_pyav(frame_dir, fps, out_file, out_W, out_H)
            except Exception as exc:
                raise GenerationError(f"PyAV encoding failed: {exc}")
            container_name = "mp4"
        else:
            # Animated GIF fallback (Pillow only) — works in every browser
            out_file = d / f"{base}.gif"
            try:
                _encode_gif(pil_frames, fps, out_file, out_W, out_H)
            except Exception as exc:
                raise GenerationError(f"GIF encoding failed: {exc}")
            container_name = "gif"

    shutil.rmtree(frame_dir, ignore_errors=True)

    rel = str(Path("generated") / "videos" / out_file.name)
    return {
        "filename": out_file.name,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "demo",
        "model": "procedural-demo",
        "demo": True,
        "container": container_name,
    }


def _read_uploaded_bytes(url_or_name):
    """Resolve an uploaded file (/uploads/<name> or bare name) to bytes."""
    name = str(url_or_name).split("/")[-1]
    p = Config.UPLOAD_DIR / name
    if not p.exists():
        raise GenerationError(f"Uploaded source '{name}' was not found on the server. Upload it again.")
    return p.read_bytes()


def _api_error(resp):
    """Best-effort human-readable error from an API response."""
    try:
        obj = resp.json()
        err = obj.get("error", obj)
        if isinstance(err, dict):
            return err.get("message") or json.dumps(err)[:300]
        return str(err)[:300]
    except Exception:
        return (resp.text or f"HTTP {resp.status_code}")[:300]


def _veo_capabilities(model):
    """Per-model durations and aspect ratios for the Gemini API (2026)."""
    is_v3 = "veo-3" in model
    durations = [4, 6, 8] if is_v3 else [5, 6, 7, 8]
    aspects = {"16:9": "16:9", "9:16": "9:16"}  # Veo 3.x has no 1:1
    if not is_v3:
        aspects["1:1"] = "1:1"
    image_duration_only_8 = is_v3  # Veo 3.x image->video = 8s only
    return durations, aspects, image_duration_only_8


def _generate_veo(prompt, mode, duration, aspect, style, camera, motion_strength,
                  input_image_url, input_video_url):
    """Google Veo via the Gemini API (free tier) — best free video quality.

    REST flow: POST :predict (:predictLongRunning for Veo 3.x) -> poll -> bytes.
    """
    import base64
    import time

    import requests

    key = Config.gemini_api_key()
    model = Config.veo_model()
    host = Config.GEMINI_HOST.rstrip("/")
    headers = {"x-goog-api-key": key, "Content-Type": "application/json"}

    durations, aspects, image_dur8 = _veo_capabilities(model)

    instance = {"prompt": prompt}
    if mode == "image":
        if not input_image_url:
            raise GenerationError("Image → Video needs an uploaded image. Upload one first.")
        image_b64 = base64.b64encode(_read_uploaded_bytes(input_image_url)).decode()
        instance["image"] = {"bytesBase64Encoded": image_b64, "mimeType": "image/png"}
    elif mode == "video":
        raise GenerationError(
            f'{model} supports text-to-video and image-to-video, not video-to-video. '
            'Use "Image" mode with a start frame, or configure a VIDEO_ENDPOINT that supports v2v.'
        )

    requested = int(duration)
    if image_dur8 and mode == "image":
        chosen = 8
    else:
        chosen = max(min(durations), min([d for d in durations if d <= requested] or durations, key=lambda d: abs(d - requested)))
    chosen = max(min(durations), chosen)

    parameters = {
        "aspectRatio": aspects.get(aspect, "16:9"),
        "resolution": "720p",
        "durationSeconds": chosen,
        "sampleCount": 1,
    }

    body = {"instances": [instance], "parameters": parameters}
    method = ":predictLongRunning" if "veo-3" in model else ":predict"

    url = f"{host}/models/{model}{method}"
    resp = requests.post(url, headers=headers, json=body, timeout=180)
    if resp.status_code != 200:
        raise GenerationError(f"{model}: {_api_error(resp)}")

    op = resp.json()
    name = op.get("name") or (op.get("operation") or {}).get("name")
    if not name:
        raise GenerationError(f"{model} returned no operation id.")

    for _ in range(300):  # poll up to ~12 min (Veo typically 1–4 min)
        if op.get("done"):
            break
        time.sleep(2)
        poll = requests.get(f"{host}/{name}", headers=headers, timeout=120)
        if poll.status_code != 200:
            raise GenerationError(f"{model} status failed: {_api_error(poll)}")
        op = poll.json()

    if not op.get("done"):
        raise GenerationError(f"{model} generation timed out. Try a shorter prompt.")

    content = op.get("response") or op.get("result") or op
    gvr = (content.get("generateVideoResponse") or {}) if isinstance(content, dict) else {}
    samples = gvr.get("generatedSamples") or content.get("generatedSamples") or content.get("videos") or []
    video_bytes = None
    for sample in samples:
        video = sample.get("video") or sample
        b64 = video.get("bytesBase64Encoded") or sample.get("bytesBase64Encoded")
        if b64:
            video_bytes = base64.b64decode(b64)
            break
        uri = video.get("uri") or video.get("fileUri")
        if uri:
            fetch = requests.get(uri, headers={"x-goog-api-key": key}, timeout=120)
            if fetch.status_code == 200:
                video_bytes = fetch.content
                break

    if not video_bytes:
        raise GenerationError(f"{model} finished but returned no usable video bytes.")

    d = _video_dir()
    fn = f"vid_{uuid.uuid4().hex[:10]}.mp4"
    (d / fn).write_bytes(video_bytes)
    rel = str(Path("generated") / "videos" / fn)
    return {
        "filename": fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "gemini",
        "model": f"Veo ({model})",
        "container": "mp4",
        "demo": False,
    }


def _video_size(aspect):
    if aspect == "9:16":
        return 512, 896
    if aspect == "1:1":
        return 640, 640
    return 896, 512  # 16:9 default


def _video_size_480p(aspect):
    """480p-tier dims used when the requested duration exceeds the 720p frame cap."""
    if aspect == "9:16":
        return 384, 672
    if aspect == "1:1":
        return 448, 448
    return 672, 384  # 16:9 default


def _snap_frames(frames):
    """Agnes requires num_frames = 8n + 1 (e.g. 1, 9, 17, 25, ...)."""
    snapped = max(1, ((max(1, int(frames)) - 1 + 4) // 8) * 8 + 1)
    return snapped


def _agnes_frame_plan(duration, aspect):
    """Choose num_frames / frame_rate / size for a requested duration (1-60s).

    Agnes v2.0 frame caps per resolution tier (at 24 fps):
      1080p -> 169 | 720p -> 409 | 480p -> 961
    num_frames must be 8n+1. To honor up to 60 seconds we hold the frame cap
    and lower fps when needed.
    """
    duration = max(1, min(60, int(duration)))
    fps = 24
    frames = duration * fps
    if frames <= 409:
        w, h = _video_size(aspect)
    elif frames <= 961:
        w, h = _video_size_480p(aspect)
    else:
        fps = max(10, 961 // duration)
        frames = duration * fps
        if frames > 961:
            frames = 961
        w, h = _video_size_480p(aspect)
    return _snap_frames(frames), fps, w, h


def _resolve_media_file(url_or_name):
    """Resolve a local media path (/uploads/<n> or /generated/... or bare name)."""
    name = str(url_or_name).split("/")[-1]
    candidates = [
        Config.UPLOAD_DIR / name,
        Config.GENERATED_DIR / "images" / name,
        Config.GENERATED_DIR / "videos" / name,
        Path(name),
    ]
    for p in candidates:
        if Path(p).exists():
            return p
    raise GenerationError(f"Uploaded source '{name}' was not found on the server. Upload it again.")


def _reference_data_uri(url_or_name):
    """Turn a local upload (/uploads/<name> or /generated/images/<name>) into a base64 data URI Agnes can read.

    Public http(s) URLs pass through untouched.
    """
    import base64
    import mimetypes

    if str(url_or_name).startswith("http"):
        return url_or_name
    p = _resolve_media_file(url_or_name)
    mime = mimetypes.guess_type(str(p))[0] or "image/png"
    b64 = base64.b64encode(Path(p).read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


def _video_first_frame_data_uri(url_or_name):
    """Extract the first frame of an uploaded video as a base64 PNG data URI."""
    import base64
    import io

    p = _resolve_media_file(url_or_name)
    b64 = None

    # 1) PyAV (fastest, no external binary)
    try:
        import av  # type: ignore

        container = av.open(str(p))
        frame = next(container.decode(video=0))
        img = frame.to_image().convert("RGB")
        buf = io.BytesIO()
        img.save(buf, "PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
    except Exception:
        b64 = None
    if b64:
        return f"data:image/png;base64,{b64}"

    # 2) ffmpeg one-frame grab
    if shutil.which("ffmpeg"):
        out = Config.UPLOAD_DIR / f"{p.stem}_frame{uuid.uuid4().hex[:6]}.png"
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(p), "-frames:v", "1", str(out)],
                check=True, capture_output=True,
            )
            if out.exists():
                b64 = base64.b64encode(out.read_bytes()).decode()
            out.unlink(missing_ok=True)
        except Exception:
            b64 = None
    if b64:
        return f"data:image/png;base64,{b64}"

    # 3) Pillow (animated GIF only)
    try:
        from PIL import Image

        im = Image.open(p)
        im.seek(0)
        img = im.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, "PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
    except Exception:
        b64 = None
    if b64:
        return f"data:image/png;base64,{b64}"

    raise GenerationError(
        "Couldn't read a frame from the uploaded video (MP4/GIF only, no ffmpeg found). "
        "Use Image mode with a screenshot instead, or keep duration short."
    )


def _generate_pollinations(prompt, mode, duration, aspect, input_image_url=None):
    """Video via Pollinations.ai (free key required; nova-reel is pollen-free).

    GET https://gen.pollinations.ai/video/{prompt}?model=...&duration=...&aspectRatio=...
    with `Authorization: Bearer <pollinations_key>`; returns video bytes.
    """
    import requests

    key = Config.pollinations_key()
    if not key:
        raise GenerationError(
            "Pollinations requires a free API key. Create one at "
            "https://enter.pollinations.ai/keys and paste it in Settings → AI Providers."
        )

    model = Config.pollinations_video_model()
    host = Config.pollinations_host()

    params = {
        "model": model,
        "duration": _clamp_duration(int(duration), model),
        "aspectRatio": aspect if aspect in ("16:9", "9:16", "1:1") else "16:9",
    }
    if mode == "image" and input_image_url:
        abs_url = input_image_url
        if abs_url.startswith("/"):
            base = (Config.PUBLIC_BASE_URL or "").rstrip("/")
            abs_url = f"{base}{abs_url}" if base else f"http://127.0.0.1:8000{abs_url}"
        params["image"] = abs_url

    url = f"{host}/video/{requests.utils.quote(prompt, safe='')}"
    resp = requests.get(url, headers={"Authorization": f"Bearer {key}"}, params=params, timeout=1200)
    if resp.status_code != 200:
        raise GenerationError(f"Pollinations ({model}): {_api_error(resp)}")

    d = _video_dir()
    ext = "mp4"
    magic = resp.content
    if magic[:8] in (b"GIF87a", b"GIF89a"):
        ext = "gif"
    elif magic[:6] == b"\x1aE\xdf\xa3":
        ext = "webm"
    fn = f"vid_{uuid.uuid4().hex[:10]}.{ext}"
    (d / fn).write_bytes(resp.content)
    rel = str(Path("generated") / "videos" / fn)
    return {
        "filename": fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "pollinations",
        "model": f"Pollinations ({model})",
        "container": "gif" if ext == "gif" else "video",
        "demo": False,
    }


def _clamp_duration(duration, model):
    if "nova-reel" in model:
        return max(6, min(duration, 120))
    return max(2, min(duration, 15))


def _generate_agnes_v25(prompt, mode, duration, aspect, model, host, headers,
                        input_image_url=None, input_video_url=None):
    """Agnes Video 2.5 / 2.5-flash (seconds-based API, 4-12s, modes text/keyframe/reference)."""
    import requests
    import time

    seconds = max(4, min(12, int(duration)))
    payload = {
        "model": model,
        "mode": "text",
        "prompt": prompt,
        "seconds": str(seconds),
        "size": "720P",
        "aspect_ratio": aspect if aspect in ("16:9", "9:16", "1:1", "4:3", "3:4", "21:9") else "16:9",
        "n": 1,
    }
    if mode == "image" and input_image_url:
        payload["mode"] = "keyframe"
        payload["first_frame"] = _reference_data_uri(input_image_url)
    elif mode == "video" and input_video_url:
        payload["mode"] = "keyframe"
        payload["first_frame"] = _video_first_frame_data_uri(input_video_url)

    resp = requests.post(f"{host}/v1/videos", headers=headers, json=payload, timeout=(30, 90))
    if resp.status_code == 429:
        raise GenerationError(f"Agnes AI ({model}): rate limited (20 req/min cap). Wait and retry.")
    if resp.status_code != 200:
        if resp.status_code == 403:
            raise GenerationError(
                f"Agnes AI ({model}): not available on the free tier. Use the v2.0 model for free generation."
            )
        raise GenerationError(f"Agnes AI ({model}): {_api_error(resp)}")

    video_id = (resp.json().get("video_id")
                or resp.json().get("task_id")
                or resp.json().get("id"))
    if not video_id:
        raise GenerationError(f"Agnes AI ({model}): no video_id in response: {resp.text[:200]}")

    deadline = time.time() + 1800
    final = None
    while time.time() < deadline:
        time.sleep(20)
        try:
            pr = requests.get(
                f"{host}/agnesapi",
                headers=headers,
                params={"video_id": video_id, "model_name": model},
                timeout=30,
            )
            if pr.status_code != 200:
                continue
            result = pr.json()
        except Exception:
            continue
        status = (result.get("status") or "").lower()
        if status in ("completed", "success"):
            final = result
            break
        if status in ("failed", "error"):
            detail = result.get("error") or result.get("message") or "unknown error"
            raise GenerationError(f"Agnes AI ({model}): generation failed — {detail}")
    if not final:
        raise GenerationError(f"Agnes AI ({model}): timed out after 30 min polling video {video_id}")

    video_url = (final.get("video_url") or final.get("url")
                 or (final.get("metadata") or {}).get("url"))
    data = final.get("data") or {}
    if isinstance(data, dict):
        video_url = video_url or data.get("video_url") or data.get("url")
    if not video_url:
        raise GenerationError(f"Agnes AI ({model}): no video URL in completed task")

    vr = requests.get(video_url, timeout=300)
    if vr.status_code != 200:
        raise GenerationError(f"Agnes AI ({model}): could not download result ({vr.status_code})")

    d = _video_dir()
    fn = f"vid_{uuid.uuid4().hex[:10]}.mp4"
    (d / fn).write_bytes(vr.content)
    rel = str(Path("generated") / "videos" / fn)
    return {
        "filename": fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "agnes",
        "model": f"Agnes ({model})",
        "container": "video",
        "demo": False,
    }


def _generate_agnes(prompt, mode, duration, aspect, input_image_url=None, input_video_url=None):
    """Video via Agnes AI (genuinely free). Bearer key, 20 RPM rate cap.

    v2.0 family:  POST {host}/v1/videos  {model,prompt,width,height,num_frames,frame_rate}
    2.5 family:   POST {host}/v1/videos  {model,mode,prompt,seconds,size,aspect_ratio}
    -> {"video_id"}  then poll GET {host}/agnesapi?video_id=... until "completed"
    -> download MP4 from url / metadata.url.
    Supports text-to-video, image-to-video (ti2vid) and video-to-video
    (first-frame extraction) up to 60 seconds.
    """
    import requests
    import time

    key = Config.agnes_key()
    if not key:
        raise GenerationError(
            "Agnes AI requires a free key from https://platform.agnes-ai.com "
            "— paste it in Settings → AI Providers (Agnes AI key)."
        )

    model = Config.agnes_video_model()
    host = Config.agnes_host()
    headers = {"Authorization": f"Bearer {key}"}

    if "2.5" in model or model.endswith("-flash"):
        return _generate_agnes_v25(
            prompt, mode, duration, aspect,
            input_image_url=input_image_url, input_video_url=input_video_url,
            model=model, host=host, headers=headers,
        )

    num_frames, fps, width, height = _agnes_frame_plan(duration, aspect)

    payload = {
        "model": model,
        "prompt": prompt,
        "width": width,
        "height": height,
        "num_frames": num_frames,
        "frame_rate": fps,
    }
    if mode == "image" and input_image_url:
        payload["image"] = _reference_data_uri(input_image_url)
        payload["mode"] = "ti2vid"
    elif mode == "video" and input_video_url:
        payload["image"] = _video_first_frame_data_uri(input_video_url)
        payload["mode"] = "ti2vid"

    resp = requests.post(f"{host}/v1/videos", headers=headers, json=payload, timeout=(30, 90))
    if resp.status_code == 429:
        raise GenerationError(f"Agnes AI ({model}): rate limited (20 req/min cap). Wait and retry.")
    if resp.status_code != 200:
        raise GenerationError(f"Agnes AI ({model}): {_api_error(resp)}")

    video_id = (resp.json().get("video_id")
                or resp.json().get("task_id")
                or resp.json().get("id"))
    if not video_id:
        raise GenerationError(f"Agnes AI ({model}): no video_id in response: {resp.text[:200]}")

    # Poll every 20s up to 30 min; use StreamResponse for progress
    # (the classic /api/video/generate endpoint is synchronous so poll threads).
    import threading
    import time
    deadline = time.time() + 1800
    final = None
    while time.time() < deadline:
        time.sleep(20)
        try:
            pr = requests.get(f"{host}/agnesapi?video_id={video_id}", headers=headers, timeout=30)
            if pr.status_code != 200:
                continue
            result = pr.json()
        except Exception:
            continue
        status = (result.get("status") or "").lower()
        if status in ("completed", "success"):
            final = result
            break
        if status in ("failed", "error"):
            detail = result.get("error") or result.get("message") or "unknown error"
            raise GenerationError(f"Agnes AI ({model}): generation failed — {detail}")
    if not final:
        raise GenerationError(f"Agnes AI ({model}): timed out after 30 min polling video {video_id}")

    video_url = (final.get("video_url") or final.get("url"))
    data = final.get("data") or {}
    if isinstance(data, dict):
        video_url = video_url or data.get("video_url") or data.get("url")
    if not video_url:
        raise GenerationError(f"Agnes AI ({model}): no video URL in completed task")

    vr = requests.get(video_url, timeout=300)
    if vr.status_code != 200:
        raise GenerationError(f"Agnes AI ({model}): could not download result ({vr.status_code})")

    d = _video_dir()
    fn = f"vid_{uuid.uuid4().hex[:10]}.mp4"
    (d / fn).write_bytes(vr.content)
    rel = str(Path("generated") / "videos" / fn)
    return {
        "filename": fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "agnes",
        "model": f"Agnes ({model})",
        "container": "video",
        "demo": False,
    }


def _generate_endpoint(prompt, mode, duration, aspect, style, camera, motion_strength,
                       input_image_url, input_video_url):
    """Compatible video model service: POST <endpoint>/generate -> video bytes."""
    import requests

    endpoint = Config.video_endpoint().rstrip("/")
    payload = {
        "prompt": prompt,
        "duration": duration,
        "aspect_ratio": aspect,
        "style": style,
        "camera": camera,
        "motion_strength": motion_strength,
        "mode": mode,
        "input_image_url": input_image_url,
        "input_video_url": input_video_url,
    }
    resp = requests.post(f"{endpoint}/generate", json=payload, timeout=600)
    if resp.status_code != 200:
        raise GenerationError(f"Video endpoint returned {resp.status_code}: {_api_error(resp)}")
    content_type = resp.headers.get("content-type", "")
    if "json" in content_type or (resp.content and resp.content[:1] in (b"{", b"[")):
        try:
            err = resp.json().get("error") or resp.json().get("detail")
            if err:
                raise GenerationError(str(err)[:400])
        except (ValueError, AttributeError):
            pass
    if not resp.content:
        raise GenerationError("Video endpoint returned an empty response.")

    d = _video_dir()
    ext = "mp4"
    if resp.content[:8] == b"GIF87a" or resp.content[:8] == b"GIF89a":
        ext = "gif"
    fn = f"vid_{uuid.uuid4().hex[:10]}.{ext}"
    (d / fn).write_bytes(resp.content)
    rel = str(Path("generated") / "videos" / fn)
    return {
        "filename": fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "mode": "endpoint",
        "model": endpoint,
        "container": "gif" if ext == "gif" else "mp4",
        "demo": False,
    }


def generate_video(
    prompt,
    mode="text",
    duration=5,
    aspect="16:9",
    style="Cinematic",
    camera="Static",
    motion_strength=3,
    input_image=None,
    input_image_url=None,
    input_video_url=None,
    force_demo=False,
):
    """Generate a video.

    Provider order (respecting the video_backend setting):
      agnes       -> Agnes AI only (default free provider)
      pollinations -> Pollinations.ai only
      veo          -> Google Veo (Gemini) only
      auto         -> Agnes -> Pollinations -> Veo -> endpoint
      endpoint     -> compatible endpoint only
    Real provider errors are NEVER silently hidden behind a demo result. In
    auto mode we fall through to the next provider, but if every configured
    provider fails, the LAST error is raised — demo only happens when no
    provider is configured at all or force_demo is set.
    """
    backend = (Config.video_backend() or "auto").lower()
    if backend == "auto":
        candidates = ["agnes", "pollinations", "veo", "endpoint"]
    elif backend in ("agnes", "pollinations", "veo", "endpoint"):
        candidates = [backend]
    else:
        candidates = ["agnes", "pollinations", "veo", "endpoint"]

    errors = []
    configured = False

    if not force_demo:
        for provider in candidates:
            if provider == "agnes" and Config.agnes_key():
                configured = True
                try:
                    return _generate_agnes(
                        prompt, mode, duration, aspect, input_image_url, input_video_url,
                    )
                except GenerationError as exc:
                    errors.append(str(exc))
                except Exception as exc:
                    errors.append(f"Agnes AI failed: {exc}")

            if provider == "pollinations" and Config.pollinations_key():
                configured = True
                try:
                    return _generate_pollinations(
                        prompt, mode, duration, aspect, input_image_url,
                    )
                except GenerationError as exc:
                    errors.append(str(exc))
                except Exception as exc:
                    errors.append(f"Pollinations failed: {exc}")

            if provider == "veo" and Config.gemini_api_key():
                configured = True
                try:
                    return _generate_veo(
                        prompt, mode, duration, aspect, style, camera, motion_strength,
                        input_image_url, input_video_url,
                    )
                except GenerationError as exc:
                    errors.append(str(exc))
                except Exception as exc:
                    errors.append(f"Veo failed: {exc}")

            if provider == "endpoint" and Config.video_endpoint():
                configured = True
                try:
                    return _generate_endpoint(
                        prompt, mode, duration, aspect, style, camera, motion_strength,
                        input_image_url, input_video_url,
                    )
                except GenerationError as exc:
                    errors.append(str(exc))
                except Exception as exc:
                    errors.append(f"Video endpoint failed: {exc}")

    if configured and errors:
        raise GenerationError("\n".join(errors[-2:]))

    # Demo / local procedural generation (only when no provider or force_demo)
    return _generate_demo_video(
        prompt,
        duration=duration,
        aspect=aspect,
        motion_strength=motion_strength,
    )