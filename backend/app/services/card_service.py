"""Card generation service.

Builds a beautiful card image (PNG/JPG/SVG) from AI-structured content.
Uses Pillow to rasterize an SVG-style layout. Output supports PNG, JPG,
SVG (native), and PDF (via reportlab if installed, else PNG-based PDF).
"""
import io
import json
import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from app.utils.config import Config

SERVICE_NAME = "CardGenerationService"

TEMPLATES = {
    "Motivation": ("#8b5cf6", "#312e81", "Determination", "Stay focused"),
    "Birthday": ("#f59e0b", "#7c2d12", "Celebration", "Happy birthday"),
    "Love": ("#ec4899", "#831843", "Affection", "With love"),
    "Friendship": ("#10b981", "#064e3b", "Loyalty", "True friends"),
    "Study": ("#0ea5e9", "#082f49", "Knowledge", "Keep learning"),
    "Career": ("#14b8a6", "#042f2e", "Growth", "Build your path"),
    "Startup": ("#a3e635", "#14532d", "Innovation", "Launch bold"),
    "Productivity": ("#facc15", "#422006", "Focus", "Do deep work"),
    "Instagram Post": ("#f472b6", "#500724", "Inspiration", "Share beauty"),
    "Pinterest": ("#ef4444", "#450a0a", "Style", "Pin this"),
    "Quote Card": ("#a78bfa", "#1e1b4b", "Wisdom", "Words that move"),
    "Certificate": ("#d4af37", "#1c1917", "Achievement", "Well done"),
    "Thank You": ("#64748b", "#0f172a", "Gratitude", "You matter"),
}

FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def _find_font(size, bold=False):
    candidates = []
    if bold:
        candidates = ["C:/Windows/Fonts/arialbd.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
    candidates += FONT_PATHS
    for p in candidates:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    try:
        return ImageFont.load_default()
    except Exception:
        return None


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def build_card_image(
    title,
    description,
    quote,
    author,
    template,
    background="#0f0f23",
    accent="#8b5cf6",
    width=1080,
    height=1920,
):
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    # Base background gradient
    c1 = _hex_to_rgb(background)
    c2 = tuple(max(0, c - 55) for c in c1)
    for y in range(height):
        t = y / height
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Radial accent glow in upper area
    glow = Image.new("L", (width, height), 0)
    gd = ImageDraw.Draw(glow)
    cx, cy = width // 2, height // 3
    gr = min(width, height) // 3
    gd.ellipse([cx - gr, cy - gr, cx + gr, cy + gr], fill=180)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=gr // 2))
    accent_rgb = _hex_to_rgb(accent)
    for y in range(0, height, 3):
        for x in range(0, width, 3):
            a = glow.getpixel((x, y))
            if a > 4:
                draw.point(
                    (x, y),
                    fill=(
                        int(accent_rgb[0] * a / 255) + int(c1[0] * (1 - a / 255)),
                        int(accent_rgb[1] * a / 255) + int(c1[1] * (1 - a / 255)),
                        int(accent_rgb[2] * a / 255) + int(c1[2] * (1 - a / 255)),
                    ),
                )

    # Subtle border frame
    draw.rectangle([40, 40, width - 40, height - 40], outline=_hex_to_rgb(accent), width=3)

    # Title
    title_font = _find_font(72, bold=True)
    quote_font = _find_font(64, bold=False)
    text_font = _find_font(36, bold=False)
    tiny_font = _find_font(28, bold=True)

    # Template label
    label_full = TEMPLATES.get(template, ("#8b5cf6", "#312e81", "", ""))
    label = str(label_full[2]).upper()
    if label and tiny_font:
        tw = draw.textlength(label, font=tiny_font)
        draw.text((width // 2 - tw // 2, 110), label, font=tiny_font, fill=(255, 255, 255))

    # Title (word-wrapped)
    _draw_wrapped(draw, title, (width // 2, 240), title_font, width - 160, (255, 255, 255), align="center")

    # Description
    _draw_wrapped(draw, description, (width // 2, 620), text_font, width - 200, (220, 220, 235), align="center")

    # Divider
    draw.line([(width // 2 - 80, 940), (width // 2 + 80, 940)], fill=_hex_to_rgb(accent), width=3)

    # Quote
    _draw_wrapped(draw, f"“{quote}”", (width // 2, 1080), quote_font, width - 200, (255, 255, 255), align="center")

    # Author
    if tiny_font:
        at = f"— {author}" if author else ""
        _draw_wrapped(draw, at, (width // 2, 1640), tiny_font, width - 200, accent_rgb, align="center")

    # Footer
    if tiny_font:
        ft = "CREOVA AI"
        tw = draw.textlength(ft, font=tiny_font)
        draw.text((width // 2 - tw // 2, height - 110), ft, font=tiny_font, fill=(160, 160, 180))

    return img


def _draw_wrapped(draw, text, center, font, max_width, fill, align="center"):
    if not text:
        return
    lines = []
    current = ""
    for word in text.split():
        test = f"{current} {word}".strip()
        try:
            w = draw.textlength(test, font=font)
        except Exception:
            w = len(test) * font.size * 0.6
        if w <= max_width or not current:
            current = test
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)

    line_height = font.size * 1.35
    start_y = center[1] - (len(lines) * line_height) / 2
    x0 = center[0]
    for i, ln in enumerate(lines):
        y = start_y + i * line_height
        try:
            w = draw.textlength(ln, font=font)
        except Exception:
            w = len(ln) * font.size * 0.6
        if align == "center":
            draw.text((x0 - w / 2, y), ln, font=font, fill=fill)
        else:
            draw.text((x0, y), ln, font=font, fill=fill)


def build_card_svg(title, description, quote, author, template, accent="#8b5cf6", width=1080, height=1920):
    """Return SVG string for the card layout."""
    label_full = TEMPLATES.get(template, ("", "", "", ""))
    label = str(label_full[2]).upper()
    safe = {
        "title": title.replace("&", "&amp;").replace("<", "&lt;"),
        "description": description.replace("&", "&amp;").replace("<", "&lt;"),
        "quote": quote.replace("&", "&amp;").replace("<", "&lt;"),
        "author": author.replace("&", "&amp;").replace("<", "&lt;"),
        "accent": accent,
    }
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f0f23"/>
      <stop offset="100%" stop-color="#060610"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.32" r="0.5">
      <stop offset="0%" stop-color="{safe['accent']}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="{safe['accent']}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{width}" height="{height}" fill="url(#bg)"/>
  <rect width="{width}" height="{height}" fill="url(#glow)"/>
  <rect x="40" y="40" width="{width-80}" height="{height-80}" fill="none" stroke="{safe['accent']}" stroke-width="3"/>
  <text x="50%" y="180" font-family="Inter, Arial, sans-serif" font-size="34" fill="#ccc" text-anchor="middle"
    letter-spacing="8">{label}</text>
  <text x="50%" y="330" font-family="Inter, Arial, sans-serif" font-weight="bold" font-size="84" fill="#fff" text-anchor="middle">{safe['title']}</text>
  <text x="50%" y="640" font-family="Inter, Arial, sans-serif" font-size="40" fill="#cdc6e0" text-anchor="middle">{safe['description']}</text>
  <line x1="50%" x2="50%" y1="980" y2="1000" stroke="{safe['accent']}" stroke-width="4"/>
  <text x="50%" y="1160" font-family="Georgia, serif" font-style="italic" font-size="66" fill="#fff" text-anchor="middle">{safe['quote']}</text>
  <text x="50%" y="1680" font-family="Inter, Arial, sans-serif" font-size="32" fill="{safe['accent']}" text-anchor="middle">{safe['author']}</text>
  <text x="50%" y="{height-120}" font-family="Inter, Arial, sans-serif" font-size="24" fill="#666" text-anchor="middle">CREOVA AI</text>
</svg>"""


def save_card_files(title, description, quote, author, template, accent="#8b5cf6",
                    background="#0f0f23", width=1080, height=1920):
    d = Config.GENERATED_DIR / "cards"
    d.mkdir(parents=True, exist_ok=True)
    base = f"card_{uuid.uuid4().hex[:10]}"

    png_path = d / f"{base}.png"
    img = build_card_image(title, description, quote, author, template, background, accent, width, height)
    img.save(png_path, "PNG")

    jpg_path = d / f"{base}.jpg"
    img_rgb = img.convert("RGB")
    img_rgb.save(jpg_path, "JPEG", quality=92)

    svg_path = d / f"{base}.svg"
    svg_path.write_text(build_card_svg(title, description, quote, author, template, accent, width, height), encoding="utf-8")

    files = []
    for suffix, path in (("png", png_path), ("jpg", jpg_path), ("svg", svg_path)):
        rel = str(Path("generated") / "cards" / path.name)
        files.append({"format": suffix, "filename": path.name, "path": rel,
                      "url": f"/{rel.replace('/', '/')}"})

    return base, files


def build_pdf(card_dir, json_data):
    """Build a printable PDF from existing card files (uses PNG)."""
    try:
        from reportlab.pdfgen import canvas  # type: ignore
    except ImportError:
        return None
    png_file = None
    for fn in card_dir.iterdir():
        if fn.suffix == ".png":
            png_file = fn
            break
    if not png_file:
        return None
    pdf_path = card_dir / f"{card_dir.stem}.pdf"
    c = canvas.Canvas(str(pdf_path), pagesize=(1080, 1920))
    from PIL import Image

    im = Image.open(png_file)
    c.drawImage(str(png_file), 0, 0, width=1080, height=1920)
    c.showPage()
    c.save()
    return pdf_path


def generate_card(payload):
    title = payload.get("title", "Untitled")
    description = payload.get("description", "")
    quote = payload.get("quote", "")
    author = payload.get("author", "")
    template_name = payload.get("template", "Motivation")
    accent = payload.get("accent", "#8b5cf6")
    background = payload.get("background", "#0f0f23")
    width = int(payload.get("width", 1080))
    height = int(payload.get("height", 1920))

    base, files = save_card_files(
        title, description, quote, author, template_name, accent, background, width, height
    )
    return {
        "id": base,
        "title": title,
        "quote": quote,
        "template": template_name,
        "files": files,
        "preview": files[0]["url"],
        "mode": "service",
        "model": f"template-{template_name}",
    }