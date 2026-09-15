"""Image generation service adapter.

Supports (in priority order):
  1. Local model (torch + diffusers) if installed and enabled.
  2. Hugging Face Inference API (free tier, requires HUGGINGFACE_TOKEN).
  3. Compatible local endpoint (AUTOMATIC1111 SD WebUI / ComfyUI txt2img API).
  4. Demo mode: procedurally generates a sample image, clearly labeled as a demo.
"""
import io
import os
import random
import uuid
from pathlib import Path

from app.utils.config import Config

SERVICE_NAME = "ImageGenerationService"


class GenerationError(Exception):
    """Raised when a real model cannot complete generation."""


def _demo_mode_status(model_id=None):
    return {
        "service": SERVICE_NAME,
        "mode": "demo",
        "label": "Demo Mode — connect a local/open-source model to enable live generation.",
        "model": model_id or "procedural-demo",
    }


def _ensure_image_dir():
    d = Config.GENERATED_DIR / "images"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _save_image(img, prefix="img"):
    """Save a PIL image to disk and return relative path + filename."""
    d = _ensure_image_dir()
    filename = f"{prefix}_{uuid.uuid4().hex[:12]}.png"
    path = d / filename
    img.save(path, "PNG")
    return str(Path("generated") / "images" / filename), filename


def _generate_demo_image(prompt, negative_prompt="", width=768, height=768, seed=None):
    """Procedural demo image generator (no ML)."""
    from PIL import Image, ImageDraw, ImageFilter

    seed = seed or random.randint(0, 2**32 - 1)
    rng = random.Random(seed)

    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    # Dark cinematic base gradient
    bottom = (24, 8, 48)
    top = (8, 8, 20)
    for y in range(height):
        t = y / height
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Gradient orb
    orb_x = rng.randint(int(width * 0.2), int(width * 0.8))
    orb_y = rng.randint(int(height * 0.2), int(height * 0.6))
    orb_r = rng.randint(int(min(width, height) * 0.15), int(min(width, height) * 0.35))
    orb = Image.new("L", (width, height), 0)
    od = ImageDraw.Draw(orb)
    od.ellipse(
        [orb_x - orb_r, orb_y - orb_r, orb_x + orb_r, orb_y + orb_r], fill=255
    )
    orb = orb.filter(ImageFilter.GaussianBlur(radius=orb_r // 2))
    for y in range(height):
        for x in range(0, width, 2):
            a = orb.getpixel((x, y))
            if a > 0:
                rr = int(139 + (70 * a / 255))
                gg = int(92 + (60 * a / 255))
                bb = int(246 + (10 * a / 255))
                draw.point((x, y), fill=(rr, gg, bb))

    # Stars / particles
    for _ in range(rng.randint(60, 120)):
        x, y = rng.randint(0, width), rng.randint(0, height // 2)
        s = rng.choice([1, 1, 1, 2])
        draw.ellipse([x, y, x + s, y + s], fill=(200, 190, 255))

    # Skyline silhouette
    base_y = int(height * 0.7)
    for i in range(0, width, rng.randint(18, 42)):
        bh = rng.randint(30, 110)
        bw = rng.randint(20, 50)
        draw.rectangle(
            [i + 4, base_y - bh, i + 4 + bw, base_y],
            fill=(10, 8, 24),
        )
        # windows
        for wx in range(i + 8, i + bw, 8):
            for wy in range(base_y - bh + 8, base_y - 4, 10):
                if rng.random() < 0.45:
                    draw.rectangle([wx, wy, wx + 3, wy + 4], fill=(255, 200, 120))

    # Fog band
    fog = Image.new("L", (width, height), 0)
    fd = ImageDraw.Draw(fog)
    fy = base_y + rng.randint(0, 10)
    fd.ellipse([-width // 3, fy, width + width // 3, fy + 90], fill=90)
    fog = fog.filter(ImageFilter.GaussianBlur(radius=40))
    for y in range(fy, min(height, fy + 90)):
        for x in range(0, width, 2):
            a = fog.getpixel((x, y))
            if a > 8:
                rr = int(18 + (18 * a / 90))
                gg = int(14 + (16 * a / 90))
                bb = int(40 + (26 * a / 90))
                draw.point((x, y), fill=(rr, gg, bb))

    return img


def generate_image(
    prompt,
    negative_prompt="",
    style="Cinematic",
    aspect_ratio="1:1",
    resolution=768,
    num_images=1,
    seed=None,
    guidance_scale=7.5,
    steps=30,
):
    """Generate image(s). Returns list of result dicts."""
    width, height = _ratio_dims(aspect_ratio, resolution)
    results = []

    # 1) Local model via diffusers (if deps installed + env allows)
    try:
        import torch
        from diffusers import AutoPipelineForText2Image  # type: ignore

        pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16"
        )
        pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")
        for i in range(num_images):
            img = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt or None,
                width=width,
                height=height,
                num_inference_steps=steps,
                guidance_scale=guidance_scale,
                seed=seed or random.randint(0, 2**32 - 1) + i,
            ).images[0]
            rel, fn = _save_image(img)
            results.append(
                {
                    "filename": fn,
                    "path": rel,
                    "url": f"/{rel.replace(os.sep, '/')}",
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "seed": (seed or 0) + i,
                    "mode": "local",
                    "model": "stabilityai/sdxl-turbo",
                }
            )
        if results:
            return results
    except ImportError:
        pass
    except Exception as exc:
        print(f"[{SERVICE_NAME}] local model failed: {exc}")

    # 2) Hugging Face Inference API
    if Config.hf_token():
        try:
            import requests

            model = Config.hf_image_model()
            headers = {"Authorization": f"Bearer {Config.hf_token()}"}
            payload = {
                "inputs": prompt,
                "parameters": {
                    "negative_prompt": negative_prompt,
                    "width": width,
                    "height": height,
                    "guidance_scale": guidance_scale,
                    "num_inference_steps": steps,
                },
            }
            for i in range(num_images):
                resp = requests.post(
                    f"https://router.huggingface.co/hf-inference/models/{model}/txt2img",
                    headers=headers,
                    json=payload,
                    timeout=120,
                )
                if resp.status_code != 200:
                    raise GenerationError(
                        f"Hugging Face returned {resp.status_code}: {resp.text[:200]}"
                    )
                from PIL import Image as PILImage

                img = PILImage.open(io.BytesIO(resp.content)).convert("RGB")
                rel, fn = _save_image(img)
                results.append(
                    {
                        "filename": fn,
                        "path": rel,
                        "url": f"/{rel.replace(os.sep, '/')}",
                        "prompt": prompt,
                        "negative_prompt": negative_prompt,
                        "seed": (seed or 0) + i,
                        "mode": "huggingface",
                        "model": model,
                    }
                )
            if results:
                return results
        except Exception as exc:
            print(f"[{SERVICE_NAME}] Hugging Face failed: {exc}")

    # 3) Agnes AI images (genuinely free, no HF token needed)
    if Config.agnes_key():
        try:
            import requests

            model = Config.agnes_image_model()
            for i in range(num_images):
                resp = requests.post(
                    f"{Config.agnes_host()}/v1/images/generations",
                    headers={"Authorization": f"Bearer {Config.agnes_key()}"},
                    json={
                        "model": model,
                        "prompt": prompt,
                        "size": f"{width}x{height}",
                        "n": 1,
                    },
                    timeout=180,
                )
                if resp.status_code != 200:
                    raise GenerationError(f"Agnes AI returned {resp.status_code}: {resp.text[:200]}")
                data = resp.json()["data"][0]
                img_url = data.get("url")
                if not img_url:
                    raise GenerationError("Agnes AI returned no image URL")
                img_bytes = requests.get(img_url, timeout=120).content
                from PIL import Image as PILImage

                img = PILImage.open(io.BytesIO(img_bytes)).convert("RGB")
                rel, fn = _save_image(img)
                results.append(
                    {
                        "filename": fn,
                        "path": rel,
                        "url": f"/{rel.replace(os.sep, '/')}",
                        "prompt": prompt,
                        "negative_prompt": negative_prompt,
                        "seed": (seed or 0) + i,
                        "mode": "agnes",
                        "model": model,
                    }
                )
            if results:
                return results
        except Exception as exc:
            print(f"[{SERVICE_NAME}] Agnes AI failed: {exc}")

    # 4) Compatible local endpoint
    if Config.img_local_endpoint():
        try:
            import requests

            endpoint = Config.img_local_endpoint().rstrip("/")
            for i in range(num_images):
                payload = {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "width": width,
                    "height": height,
                    "cfg_scale": guidance_scale,
                    "steps": steps,
                    "seed": (seed or -1) + i,
                    "batch_size": 1,
                }
                resp = requests.post(f"{endpoint}/sdapi/v1/txt2img", json=payload, timeout=300)
                if resp.status_code != 200:
                    raise GenerationError(
                        f"Local endpoint returned {resp.status_code}: {resp.text[:200]}"
                    )
                import base64

                data = resp.json()
                b64 = data["images"][0]
                img_bytes = base64.b64decode(b64.split(",", 1)[-1])
                from PIL import Image as PILImage

                img = PILImage.open(io.BytesIO(img_bytes)).convert("RGB")
                rel, fn = _save_image(img)
                results.append(
                    {
                        "filename": fn,
                        "path": rel,
                        "url": f"/{rel.replace(os.sep, '/')}",
                        "prompt": prompt,
                        "seed": (seed or 0) + i,
                        "mode": "local-endpoint",
                        "model": endpoint,
                    }
                )
            if results:
                return results
        except Exception as exc:
            print(f"[{SERVICE_NAME}] local endpoint failed: {exc}")

    # 5) Demo mode
    for i in range(num_images):
        img = _generate_demo_image(
            prompt, negative_prompt, width=width, height=height, seed=seed
        )
        rel, fn = _save_image(img)
        results.append(
            {
                "filename": fn,
                "path": rel,
                "url": f"/{rel.replace(os.sep, '/')}",
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "seed": seed or 0,
                "mode": "demo",
                "model": "procedural-demo",
                "demo": True,
            }
        )
    return results


def upscale_image(filename):
    """Simple 2x upscale using Lanczos. Returns new file info or None."""
    img_path = Config.GENERATED_DIR / "images" / filename
    if not img_path.exists():
        return None
    from PIL import Image

    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    img = img.resize((w * 2, h * 2), Image.LANCZOS)
    d = _ensure_image_dir()
    new_fn = f"up_{filename.replace('.png', '')}_{uuid.uuid4().hex[:8]}.png"
    img.save(d / new_fn, "PNG")
    rel = str(Path("generated") / "images" / new_fn)
    return {"filename": new_fn, "path": rel, "url": f"/{rel.replace(os.sep, '/')}"}


def convert_image(filename, fmt):
    """Convert an existing generated image to PNG/JPG. Returns new file info."""
    img_path = Config.GENERATED_DIR / "images" / filename
    if not img_path.exists():
        # also try original (no ./generated/images prefix variations)
        alt = Path(Config.GENERATED_DIR) / filename
        img_path = alt if alt.exists() else img_path
    if not img_path.exists():
        return None
    from PIL import Image

    fmt = (fmt or "jpg").lower()
    if fmt not in ("png", "jpg"):
        fmt = "jpg"
    rgb = Image.open(img_path).convert("RGB")
    d = _ensure_image_dir()
    ext = "png" if fmt == "png" else "jpg"
    pil_fmt = "PNG" if fmt == "png" else "JPEG"
    new_fn = f"conv_{uuid.uuid4().hex[:10]}.{ext}"
    save_kwargs = {"quality": 92, "optimize": True} if fmt == "jpg" else {}
    rgb.save(d / new_fn, pil_fmt, **save_kwargs)
    rel = str(Path("generated") / "images" / new_fn)
    return {
        "filename": new_fn,
        "path": rel,
        "url": f"/{rel.replace(os.sep, '/')}",
        "format": ext,
    }


def _ratio_dims(aspect_ratio, resolution):
    ratios = {
        "1:1": (1, 1),
        "16:9": (16, 9),
        "9:16": (9, 16),
        "4:3": (4, 3),
        "3:4": (3, 4),
    }
    w, h = ratios.get(aspect_ratio, (1, 1))
    if w >= h:
        return int(resolution * (w / h)), resolution
    return resolution, int(resolution * (h / w))