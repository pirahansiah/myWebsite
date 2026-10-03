#!/usr/bin/env python3
"""Generate short 2D, motion-graphic, and perspective-3D videos from selected site Markdown pages.

Examples:
  python3 master_motion.py --pages computer-vision.md localAI.md
  python3 master_motion.py --pages atlas --mode 3d --embed
  python3 master_motion.py --all --mode motion

Requires Pillow, NumPy, FontTools (WOFF2 font conversion), and ffmpeg.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import math
import os
import re
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Iterable

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    from fontTools.ttLib import TTFont
except ImportError as exc:
    print(f"Missing Python dependency: {exc}. Install with: python3 -m pip install -r requirements.txt", file=sys.stderr)
    raise SystemExit(2)

W, H = 960, 540
FPS, SECONDS = 24, 6
MODES = ("2d", "motion", "3d")
BG = (24, 15, 25)
ORANGE = (233, 84, 32)
CREAM = (250, 247, 241)
INK = (29, 29, 29)


def find_site_root(start: Path) -> Path:
    for p in (start, *start.parents):
        if (p / "farshid" / "content").is_dir() and (p / "farshid" / "assets").is_dir():
            return p
    raise RuntimeError("Could not find the website root (expected farshid/content and farshid/assets).")


def front_value(text: str, key: str) -> str:
    fm = re.match(r"\A---\s*\n(.*?)\n---\s*(?:\n|$)", text, re.S)
    if not fm:
        return ""
    match = re.search(r"^" + re.escape(key) + r":\s*(.*?)\s*$", fm.group(1), re.M)
    if not match:
        return ""
    return match.group(1).strip().strip("\"'")


def extract_page(path: Path) -> tuple[str, str, list[str]]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    title = front_value(raw, "title")
    body = re.sub(r"\A---\s*\n.*?\n---\s*(?:\n|$)", "", raw, count=1, flags=re.S)
    if not title:
        h = re.search(r"^#\s+(.+?)\s*#*\s*$", body, re.M)
        title = h.group(1) if h else path.stem.replace("-", " ").replace("_", " ").title()
    title = re.sub(r"[*_`~]", "", html.unescape(title)).strip()
    plain = re.sub(r"!\[[^]]*\]\([^)]+\)", " ", body)
    plain = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", plain)
    plain = re.sub(r"<[^>]*>", " ", plain)
    plain = re.sub(r"[`*_>#|]", " ", plain)
    plain = re.sub(r"\s+", " ", html.unescape(plain)).strip()
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9+.#/-]*", plain)
    skip = {"the", "and", "for", "with", "from", "that", "this", "are", "was", "were", "into", "your", "you", "our", "their", "have", "has", "will", "can", "not", "but", "about", "more", "also", "than", "then", "how", "what", "when", "where", "who", "which", "while", "using", "used", "use", "based", "over", "under", "through", "between", "such", "each", "all", "one", "two", "its", "it", "is", "in", "on", "of", "to", "a", "an", "as", "by", "or", "be", "at", "we", "i"}
    tokens, seen = [], set()
    for word in words:
        key = word.lower().strip("./-+#")
        if len(key) > 2 and key not in skip and key not in seen:
            tokens.append(word)
            seen.add(key)
        if len(tokens) == 6:
            break
    if not tokens:
        tokens = ["Ideas", "Research", "Technology"]
    return title, plain, tokens


def resolve_pages(root: Path, names: list[str], all_pages: bool) -> list[Path]:
    folder = root / "farshid" / "content"
    if all_pages:
        return sorted(p for p in folder.glob("*.md") if p.is_file())
    resolved = []
    for name in names:
        candidate = Path(name).expanduser()
        if candidate.is_absolute() and candidate.is_file():
            p = candidate.resolve()
        else:
            leaf = Path(name).name
            if not leaf.endswith(".md"):
                leaf += ".md"
            p = folder / leaf
        if not p.is_file():
            raise FileNotFoundError(f"Markdown page not found: {name} (looked in {folder})")
        if p.parent.resolve() != folder.resolve():
            raise ValueError(f"Only pages in {folder} are supported: {p}")
        if p not in resolved:
            resolved.append(p)
    return resolved


def font_files(root: Path, cache: Path) -> tuple[Path, Path]:
    assets = root / "farshid" / "assets"
    regular = assets / "ubuntu-sans-latin.woff2"
    mono = assets / "ubuntu-sans-mono-latin.woff2"
    if not regular.is_file():
        raise FileNotFoundError(f"Site Ubuntu Sans font is missing: {regular}")
    cache.mkdir(parents=True, exist_ok=True)
    converted = []
    for src in (regular, mono if mono.exists() else regular):
        out = cache / (src.stem + ".ttf")
        if not out.exists() or out.stat().st_mtime < src.stat().st_mtime:
            font = TTFont(str(src))
            font.flavor = None
            font.save(str(out))
        converted.append(out)
    return converted[0], converted[1]


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def fit_title(title: str, regular: Path, max_width: int = 790, max_size: int = 68) -> tuple[list[str], ImageFont.FreeTypeFont]:
    for size in range(max_size, 29, -2):
        f = font(regular, size)
        lines, current = [], ""
        for word in title.split():
            attempt = (current + " " + word).strip()
            if current and f.getlength(attempt) > max_width:
                lines.append(current)
                current = word
            else:
                current = attempt
        if current:
            lines.append(current)
        if len(lines) <= 2 and max(f.getlength(line) for line in lines) <= max_width:
            return lines, f
    f = font(regular, 32)
    return textwrap.wrap(title, width=34)[:3], f


def hex_color(value: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % value


def scene_colors(slug: str) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    digest = hashlib.sha256(slug.encode("utf-8")).digest()
    hue = int.from_bytes(digest[:2], "big") / 65535.0
    rgb = colorsys_hsv(hue, .48, .68)
    accent = (int(rgb[0] * 255), int(rgb[1] * 255), int(rgb[2] * 255))
    return accent, ORANGE


def colorsys_hsv(h: float, s: float, v: float) -> tuple[float, float, float]:
    i = int(h * 6)
    f = h * 6 - i
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    return ((v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q))[i % 6]


def background(t: float, accent: tuple[int, int, int], dark: bool = True) -> Image.Image:
    base = np.array(BG if dark else CREAM, dtype=np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    phase = t * 0.72
    cx = W * (.28 + .42 * (0.5 + 0.5 * math.sin(phase)))
    cy = H * (.38 + .20 * math.cos(phase * .7))
    radius = np.sqrt(((xx - cx) / W) ** 2 + ((yy - cy) / H) ** 2)
    glow = (np.clip(1 - radius * 2.1, 0, 1) ** 2 * (0.18 if dark else 0.10))[..., None]
    color = np.array(accent, dtype=np.float32)
    pixels = np.clip(base + glow * color, 0, 255).astype(np.uint8)
    return Image.fromarray(pixels, "RGB")


def draw_label(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, mono: Path, fg=(232, 226, 230), accent=ORANGE) -> None:
    f = font(mono, 15)
    draw.rounded_rectangle((x, y, x + 13, y + 13), radius=4, fill=accent)
    draw.text((x + 23, y - 2), text.upper(), font=f, fill=fg)


def draw_title(draw: ImageDraw.ImageDraw, title: str, regular: Path, x: int, y: int, color=CREAM, max_width=790) -> int:
    lines, f = fit_title(title, regular, max_width)
    line_h = int(f.size * 1.15)
    for line in lines:
        draw.text((x, y), line, font=f, fill=color, stroke_width=0)
        y += line_h
    return y


def frame_2d(t: float, title: str, tokens: list[str], regular: Path, mono: Path, accent: tuple[int, int, int]) -> Image.Image:
    im = background(t, accent, dark=False)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((44, 42, W - 44, H - 42), radius=23, fill=(255, 255, 255), outline=(226, 222, 218), width=2)
    draw_label(d, "FIELD NOTES  /  " + tokens[0], 82, 82, mono, fg=(91, 82, 87), accent=accent)
    y = draw_title(d, title, regular, 82, 134, color=INK, max_width=700)
    d.rounded_rectangle((82, y + 8, 180, y + 14), radius=3, fill=accent)
    # A simple, legible animated concept map: spine, nodes, and labels.
    center_y = 380
    d.line((122, center_y, W - 138, center_y), fill=(218, 213, 207), width=3)
    n = min(4, len(tokens))
    for i in range(n):
        x = 150 + i * (660 // max(1, n - 1)) if n > 1 else 480
        bob = int(9 * math.sin(t * 2.8 + i * 1.6))
        r = 13 + int(2 * (1 + math.sin(t * 3 + i)))
        d.ellipse((x-r-8, center_y+bob-r-8, x+r+8, center_y+bob+r+8), fill=(255, 243, 235))
        d.ellipse((x-r, center_y+bob-r, x+r, center_y+bob+r), fill=accent)
        f = font(mono, 18)
        label = tokens[i][:20]
        width = d.textbbox((0, 0), label, font=f)[2]
        d.text((x - width // 2, center_y + 42 + bob), label, font=f, fill=(74, 68, 70))
    d.text((82, H - 93), "A page, translated into motion", font=font(regular, 17), fill=(127, 119, 121))
    return im


def frame_motion(t: float, title: str, tokens: list[str], regular: Path, mono: Path, accent: tuple[int, int, int]) -> Image.Image:
    im = background(t, accent, dark=True)
    d = ImageDraw.Draw(im)
    # moving frame marks add an editorial / kinetic feel without visual clutter
    progress = t / SECONDS
    margin = 55
    d.line((margin, 51, margin + 150 + int(310 * progress), 51), fill=accent, width=3)
    d.text((margin, 70), "MOTION STUDY     /     " + tokens[0].upper(), font=font(mono, 15), fill=(194, 181, 190))
    lines, f = fit_title(title, regular, max_width=815, max_size=76)
    y0 = 174 if len(lines) <= 2 else 142
    line_h = int(f.size * 1.22)
    # Bring the title in as a single readable block, with subtle overshoot.
    settle = min(1.0, max(0.0, t / .75))
    ease = 1 - (1 - settle) ** 3
    drift = int((1 - ease) * 46)
    for i, line in enumerate(lines):
        alpha = min(255, int(255 * min(1, max(0, (t - i * .15) / .45))))
        width = int(f.getlength(line))
        x = (W - width) // 2
        col = tuple(int(c * alpha / 255) for c in CREAM)
        d.text((x, y0 + i * line_h + drift), line, font=f, fill=col)
    # Animated underline and three quick, restrained topic labels.
    y = y0 + len(lines) * line_h + 17
    underline_w = int((W - 2 * margin) * min(1, max(0, t / 1.25)))
    d.rounded_rectangle((margin, y, margin + underline_w, y + 4), radius=2, fill=accent)
    start = max(0.0, t - 1.1)
    for i, token in enumerate(tokens[:4]):
        appear = min(1, max(0, (start - i * .3) / .35))
        if appear <= 0:
            continue
        label = token.upper()
        boxfont = font(mono, 14)
        bw = int(boxfont.getlength(label)) + 34
        x = margin + i * 205
        yy = 411 + int((1 - appear) * 14)
        d.rounded_rectangle((x, yy, x + bw, yy + 36), radius=18, fill=(47, 35, 47), outline=(91, 71, 87), width=1)
        d.ellipse((x + 12, yy + 13, x + 20, yy + 21), fill=accent)
        d.text((x + 26, yy + 9), label, font=boxfont, fill=(235, 226, 233))
    d.text((margin, H - 71), "PIRAHANSIAH.COM     /     PAGE IN MOTION", font=font(mono, 13), fill=(141, 126, 139))
    return im


def project_point(x: float, y: float, yaw: float, pitch: float, cx: float, cy: float) -> tuple[float, float]:
    # Perspective projection of a flat card in 3D camera space.
    X, Y, Z = x - W / 2, y - H / 2, 0.0
    X, Z = X * math.cos(yaw) + Z * math.sin(yaw), -X * math.sin(yaw) + Z * math.cos(yaw)
    Y, Z = Y * math.cos(pitch) - Z * math.sin(pitch), Y * math.sin(pitch) + Z * math.cos(pitch)
    Z += 1120
    return cx + 900 * X / Z, cy + 900 * Y / Z


def perspective_coefficients(destination: list[tuple[float, float]], source: list[tuple[float, float]]) -> tuple[float, ...]:
    """Return Pillow's inverse perspective map from output points to source points."""
    rows, values = [], []
    for (x, y), (u, v) in zip(destination, source):
        rows.extend(((x, y, 1, 0, 0, 0, -u * x, -u * y),
                     (0, 0, 0, x, y, 1, -v * x, -v * y)))
        values.extend((u, v))
    return tuple(float(value) for value in np.linalg.solve(np.asarray(rows), np.asarray(values)))


def frame_3d(t: float, title: str, tokens: list[str], regular: Path, mono: Path, accent: tuple[int, int, int]) -> Image.Image:
    base = background(t, accent, dark=True)
    card = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, 16, H), fill=accent)
    draw_label(d, "VOLUME 01     /     " + tokens[0], 78, 68, mono, fg=(95, 82, 89), accent=accent)
    y = draw_title(d, title, regular, 78, 144, color=INK, max_width=720)
    d.rounded_rectangle((78, y + 13, 213, y + 19), radius=3, fill=accent)
    d.text((78, 418), "A 3D PERSPECTIVE STUDY", font=font(mono, 15), fill=(100, 91, 95))
    d.text((78, 449), "  /  ".join(x.upper() for x in tokens[:3]), font=font(mono, 14), fill=(126, 112, 120))
    # Gentle turn with a shallow pitch; avoid edge-on states so the page stays readable.
    yaw = math.sin((t / SECONDS) * math.tau + .6) * .25
    pitch = math.sin((t / SECONDS) * math.tau + 1.1) * .045
    # Pillow's perspective transform samples the source at output coordinates,
    # so solve the inverse map from the projected destination quad to the card.
    quad = [project_point(x, y, yaw, pitch, W / 2, H / 2)
            for x, y in ((0, 0), (W, 0), (W, H), (0, H))]
    source = [(0.0, 0.0), (float(W), 0.0), (float(W), float(H)), (0.0, float(H))]
    coeffs = perspective_coefficients(quad, source)

    # A soft, offset polygon shadow sits behind the actual projected card.
    shadow_quad = [(x + 13, y + 17) for x, y in quad]
    shadow_mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow_mask).polygon(shadow_quad, fill=150)
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(15))
    shadow = Image.new("RGB", (W, H), (17, 10, 18))
    base = Image.composite(shadow, base, shadow_mask)

    warped = card.transform((W, H), Image.Transform.PERSPECTIVE, coeffs,
        resample=Image.Resampling.BICUBIC, fillcolor=BG)
    mask_src = Image.new("L", (W, H), 255)
    mask = mask_src.transform((W, H), Image.Transform.PERSPECTIVE, coeffs,
        resample=Image.Resampling.BILINEAR, fillcolor=0)
    base.paste(warped, (0, 0), mask)
    return base


def make_poster(frame: Image.Image, path: Path) -> None:
    frame.save(path, format="JPEG", quality=88, optimize=True)


def render_video(page: Path, title: str, tokens: list[str], mode: str, root: Path, ffmpeg: str, regular: Path, mono: Path) -> tuple[Path, Path]:
    slug = page.stem
    accent, _ = scene_colors(slug)
    output_dir = root / "farshid" / "assets" / "motion" / slug
    output_dir.mkdir(parents=True, exist_ok=True)
    video = output_dir / f"{mode}.mp4"
    poster = output_dir / f"{mode}.jpg"
    functions = {"2d": frame_2d, "motion": frame_motion, "3d": frame_3d}
    total = FPS * SECONDS
    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-metadata", f"title={title[:200]}", str(video)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for frame_no in range(total):
            t = frame_no / FPS
            image = functions[mode](t, title, tokens, regular, mono, accent)
            if frame_no == 0:
                make_poster(image, poster)
            assert proc.stdin is not None
            proc.stdin.write(image.tobytes())
        assert proc.stdin is not None
        proc.stdin.close()
        stderr = proc.stderr.read() if proc.stderr else b""
        code = proc.wait()
    except Exception:
        proc.kill()
        proc.wait()
        raise
    if code:
        raise RuntimeError(f"ffmpeg failed for {video}: {stderr.decode('utf-8', 'replace')[-1200:]}")
    if not video.is_file() or video.stat().st_size < 1024:
        raise RuntimeError(f"ffmpeg produced a missing or unexpectedly small video: {video}")
    return video, poster


def embed_block(slug: str, modes: Iterable[str]) -> str:
    lines = [f"<!-- motion-graphic:{slug} -->"]
    for mode in modes:
        title = {"2d": "2D visual summary", "motion": "Motion graphic", "3d": "3D perspective study"}[mode]
        base = f"/farshid/assets/motion/{slug}/{mode}"
        lines.extend([
            '<figure class="md-motion">',
            f'  <video controls playsinline preload="metadata" poster="{base}.jpg" aria-label="{html.escape(title)} for this page">',
            f'    <source src="{base}.mp4" type="video/mp4">',
            '    Video playback is not supported by this browser.',
            '  </video>',
            f'  <figcaption>{title}</figcaption>',
            '</figure>',
        ])
    lines.append(f"<!-- /motion-graphic:{slug} -->")
    return "\n".join(lines)


def add_embeddings(page: Path, slug: str, modes: list[str]) -> None:
    text = page.read_text(encoding="utf-8")
    block = embed_block(slug, modes)
    pattern = re.compile(r"<!-- motion-graphic:" + re.escape(slug) + r" -->.*?<!-- /motion-graphic:" + re.escape(slug) + r" -->", re.S)
    if pattern.search(text):
        updated = pattern.sub(lambda _: block, text, count=1)
    else:
        updated = text.rstrip() + "\n\n" + block + "\n"
    page.write_text(updated, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Turn selected website Markdown pages into 2D, kinetic, and perspective-3D MP4s.")
    parser.add_argument("--pages", nargs="+", metavar="PAGE", help="Page filenames/slugs in farshid/content (e.g. computer-vision.md localAI)")
    parser.add_argument("--all", action="store_true", help="Generate for every Markdown page in farshid/content")
    parser.add_argument("--mode", choices=(*MODES, "all"), default="all", help="Style to generate (default: all three)")
    parser.add_argument("--embed", action="store_true", help="Insert or refresh playable video blocks in each selected Markdown page")
    parser.add_argument("--root", type=Path, help="Website root (auto-detected from this script by default)")
    parser.add_argument("--ffmpeg", default=os.environ.get("FFMPEG") or shutil.which("ffmpeg"), help="ffmpeg executable (default: PATH or FFMPEG environment variable)")
    args = parser.parse_args()
    try:
        root = (args.root.expanduser().resolve() if args.root else find_site_root(Path(__file__).resolve().parent))
        names = args.pages or []
        if not args.all and not names:
            print("Enter page filenames or slugs (comma-separated), or type all:")
            entered = input("> ").strip()
            if entered.lower() == "all":
                args.all = True
            else:
                names = [x.strip() for x in entered.split(",") if x.strip()]
        pages = resolve_pages(root, names, args.all)
        if not pages:
            raise ValueError("No Markdown pages selected.")
        if not args.ffmpeg or not (shutil.which(args.ffmpeg) or Path(args.ffmpeg).is_file()):
            raise FileNotFoundError("ffmpeg was not found. Install ffmpeg or pass --ffmpeg /path/to/ffmpeg.")
        modes: list[str] = list(MODES) if args.mode == "all" else [args.mode]
        regular, mono = font_files(root, Path(__file__).resolve().parent / ".font-cache")
        print(f"Website: {root}\nSelected pages: {len(pages)} | styles: {', '.join(modes)} | {W}x{H}, {FPS} fps, {SECONDS}s")
        made = 0
        for page in pages:
            title, _body, tokens = extract_page(page)
            print(f"\n[{page.name}] {title}")
            for mode in modes:
                video, poster = render_video(page, title, tokens, mode, root, args.ffmpeg, regular, mono)
                print(f"  {mode:6} {video.relative_to(root)} ({video.stat().st_size:,} bytes); poster {poster.relative_to(root)}")
                made += 1
            if args.embed:
                add_embeddings(page, page.stem, modes)
                print("  embedded player blocks in Markdown")
        print(f"\nDone: generated {made} MP4 video(s) for {len(pages)} page(s).")
        return 0
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
