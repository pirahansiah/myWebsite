#!/usr/bin/env python3
"""
Image to Base64 Converter
Convert images to base64-encoded strings for HTML, CSS, and email templates.

Features:
  - Convert any image to base64
  - Output HTML <img> tag and CSS background-image
  - Compress and resize before encoding
  - Support JPEG, PNG, WebP, GIF, BMP, ICO, TIFF
  - Batch process multiple files
  - Drag-and-drop friendly CLI

Usage:
  python image-to-base64.py image.png
  python image-to-base64.py image.png --width 200 --height 200
  python image-to-base64.py image.png --quality 80 --format webp
  python image-to-base64.py *.png --output result.html
  python image-to-base64.py image.png --css-only
"""

import argparse
import base64
import io
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image


SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".ico", ".tiff", ".tif", ".webp", ".svg"}


def get_mime_type(fmt: str) -> str:
    mime_map = {
        "JPEG": "image/jpeg",
        "PNG": "image/png",
        "WEBP": "image/webp",
        "GIF": "image/gif",
        "BMP": "image/bmp",
        "ICO": "image/x-icon",
        "TIFF": "image/tiff",
        "SVG": "image/svg+xml",
    }
    return mime_map.get(fmt.upper(), "image/png")


def image_to_base64(
    filepath: str,
    width: int = None,
    height: int = None,
    quality: int = 85,
    output_format: str = None,
    compress: bool = False,
) -> tuple[str, str, str, dict]:
    """
    Convert an image file to base64 string.
    Returns (base64_data, mime_type, data_uri, info_dict).
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")

    img = Image.open(path)

    original_size = path.stat().st_size
    original_dims = img.size

    if img.mode == "RGBA" and output_format and output_format.upper() in ("JPEG", "BMP"):
        img = img.convert("RGB")

    if width or height:
        w, h = img.size
        if width and height:
            new_w, new_h = width, height
        elif width:
            ratio = width / w
            new_w, new_h = width, int(h * ratio)
        else:
            ratio = height / h
            new_w, new_h = int(w * ratio), height
        img = img.resize((new_w, new_h), Image.LANCZOS)

    if output_format:
        fmt = output_format.upper()
    elif compress:
        fmt = "WEBP"
    else:
        fmt = img.format or path.suffix.upper().replace(".", "")
        if fmt == "JPG":
            fmt = "JPEG"

    buf = io.BytesIO()

    save_kwargs = {}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    if fmt == "PNG":
        save_kwargs["optimize"] = True

    if fmt == "SVG":
        with open(path, "r") as f:
            svg_data = f.read()
        b64 = base64.b64encode(svg_data.encode("utf-8")).decode("utf-8")
        mime = "image/svg+xml"
        data_uri = f"data:{mime};base64,{b64}"
        info = {
            "original_size": original_size,
            "encoded_size": len(b64),
            "dimensions": original_dims,
            "format": "SVG",
            "compression_ratio": f"{(1 - len(b64) / original_size) * 100:.1f}%" if original_size > 0 else "N/A",
        }
        return b64, mime, data_uri, info

    img.save(buf, format=fmt, **save_kwargs)
    buf.seek(0)

    b64 = base64.b64encode(buf.read()).decode("utf-8")
    mime = get_mime_type(fmt)
    data_uri = f"data:{mime};base64,{b64}"

    info = {
        "original_size": original_size,
        "encoded_size": len(b64),
        "dimensions": original_dims,
        "final_dimensions": img.size,
        "format": fmt,
        "quality": quality if fmt in ("JPEG", "WEBP") else "lossless",
        "compression_ratio": f"{(1 - len(b64) / original_size) * 100:.1f}%" if original_size > 0 else "N/A",
    }

    return b64, mime, data_uri, info


def generate_html_tag(data_uri: str, alt: str = "image", width: int = None, height: int = None) -> str:
    attrs = f'src="{data_uri}" alt="{alt}"'
    if width:
        attrs += f' width="{width}"'
    if height:
        attrs += f' height="{height}"'
    return f"<img {attrs} />"


def generate_css_bg(data_uri: str) -> str:
    return f'background-image: url("{data_uri}");'


def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


def process_file(filepath: str, args) -> dict:
    b64, mime, data_uri, info = image_to_base64(
        filepath,
        width=args.width,
        height=args.height,
        quality=args.quality,
        output_format=args.format,
        compress=args.compress,
    )

    html_tag = generate_html_tag(
        data_uri,
        alt=args.alt or Path(filepath).stem,
        width=args.width,
        height=args.height,
    )
    css_bg = generate_css_bg(data_uri)

    return {
        "file": filepath,
        "b64": b64,
        "mime": mime,
        "data_uri": data_uri,
        "html": html_tag,
        "css": css_bg,
        "info": info,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Convert images to Base64 for HTML, CSS, and email templates",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s image.png                          # Basic conversion
  %(prog)s image.png --width 100 --height 100 # Resize to 100x100
  %(prog)s image.png --quality 80             # Lower quality for smaller size
  %(prog)s image.png --format webp --compress # Convert to WebP
  %(prog)s *.png --output result.html         # Batch convert to HTML file
  %(prog)s image.png --css-only               # Output only CSS
  %(prog)s image.png --html-only              # Output only HTML
        """,
    )
    parser.add_argument("files", nargs="+", help="Image file(s) to convert")
    parser.add_argument("--width", type=int, help="Resize width (px)")
    parser.add_argument("--height", type=int, help="Resize height (px)")
    parser.add_argument("--quality", type=int, default=85, help="Output quality 1-100 (default: 85)")
    parser.add_argument("--format", choices=["jpeg", "png", "webp", "gif", "bmp", "ico"], help="Output format")
    parser.add_argument("--compress", action="store_true", help="Compress to WebP automatically")
    parser.add_argument("--alt", help="Alt text for HTML img tag")
    parser.add_argument("--output", "-o", help="Save results to file (HTML or text)")
    parser.add_argument("--html-only", action="store_true", help="Output only HTML tags")
    parser.add_argument("--css-only", action="store_true", help="Output only CSS background-image")
    parser.add_argument("--b64-only", action="store_true", help="Output only raw base64 string")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress info output")

    args = parser.parse_args()

    results = []
    for filepath in args.files:
        path = Path(filepath)
        if not path.exists():
            print(f"Error: {filepath} not found", file=sys.stderr)
            continue

        if path.suffix.lower() not in SUPPORTED_FORMATS:
            print(f"Warning: {filepath} may not be supported (trying anyway)", file=sys.stderr)

        try:
            result = process_file(filepath, args)
            results.append(result)
        except Exception as e:
            print(f"Error processing {filepath}: {e}", file=sys.stderr)

    if not results:
        print("No files processed successfully", file=sys.stderr)
        sys.exit(1)

    output_lines = []

    for r in results:
        info = r["info"]

        if not args.quiet and not args.b64_only:
            output_lines.append(f"{'=' * 60}")
            output_lines.append(f"File: {r['file']}")
            output_lines.append(f"  Format:     {info['format']}")
            output_lines.append(f"  Original:   {info['dimensions'][0]}x{info['dimensions'][1]} ({format_size(info['original_size'])})")
            if "final_dimensions" in info:
                output_lines.append(f"  Final:      {info['final_dimensions'][0]}x{info['final_dimensions'][1]}")
            output_lines.append(f"  Encoded:    {format_size(info['encoded_size'])}")
            output_lines.append(f"  MIME:       {r['mime']}")
            if "quality" in info:
                output_lines.append(f"  Quality:    {info['quality']}")
            output_lines.append("")

        if args.b64_only:
            output_lines.append(r["b64"])
        elif args.html_only:
            output_lines.append(r["html"])
        elif args.css_only:
            output_lines.append(r["css"])
        else:
            output_lines.append(f"HTML:")
            output_lines.append(r["html"])
            output_lines.append("")
            output_lines.append(f"CSS:")
            output_lines.append(r["css"])
            output_lines.append("")

    output = "\n".join(output_lines)

    if args.output:
        out_path = Path(args.output)
        if out_path.suffix.lower() == ".html":
            html_content = "<!DOCTYPE html>\n<html>\n<head><meta charset='utf-8'><title>Base64 Images</title></head>\n<body>\n"
            for r in results:
                html_content += f'<div style="margin:20px;padding:20px;border:1px solid #ccc;">\n'
                html_content += f'  <h3>{Path(r["file"]).name}</h3>\n'
                html_content += f'  {r["html"]}\n'
                html_content += f'  <pre style="font-size:11px;word-break:break-all;max-height:200px;overflow:auto;">{r["data_uri"][:500]}...</pre>\n'
                html_content += f'</div>\n'
            html_content += "</body>\n</html>"
            out_path.write_text(html_content)
        else:
            out_path.write_text(output)
        print(f"Saved to {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
