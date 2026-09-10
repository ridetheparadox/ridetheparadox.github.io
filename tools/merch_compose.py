#!/usr/bin/env python3
"""Finish a merch print: place the real PARADOX wordmark, optional subtitle,
and (for dark garments) a black knockout so no black ink is laid on black fabric.

    python3 tools/merch_compose.py SRC OUT [--scale 0.42] [--bottom 0.06]
        [--subtitle "SUBJECT 8"] [--knockout] [--thumb PATH]

The wordmark keeps its own alpha, so its brushed-steel bevels survive the
knockout instead of dissolving into the garment.
"""
import argparse
import os

from PIL import Image, ImageChops, ImageDraw, ImageFont

WORDMARK = os.path.join(os.path.dirname(__file__), "..", "paradox-wordmark.png")
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SILVER = (201, 206, 211)


def tracked_text(draw, xy, text, font, fill, tracking):
    """Draw letterspaced capitals centred on xy[0]."""
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = xy[0] - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, xy[1]), ch, font=font, fill=fill)
        x += w + tracking


def compose(src, out, scale, bottom, subtitle, knockout, thumb):
    base = Image.open(src).convert("RGBA")
    W, H = base.size

    wm = Image.open(WORDMARK).convert("RGBA")
    wm_w = int(W * scale)
    wm = wm.resize((wm_w, int(wm.height * wm_w / wm.width)), Image.LANCZOS)
    wm_x = (W - wm_w) // 2
    wm_y = int(H - H * bottom - wm.height)

    # Track where branding lands so the knockout leaves it fully opaque.
    brand_alpha = Image.new("L", (W, H), 0)
    brand_alpha.paste(wm.split()[3], (wm_x, wm_y))
    base.alpha_composite(wm, (wm_x, wm_y))

    if subtitle:
        size = max(12, int(wm.height * 0.62))
        font = ImageFont.truetype(FONT, size)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        tracked_text(d, (W / 2, wm_y + wm.height + int(wm.height * 0.55)),
                     subtitle, font, SILVER + (230,), tracking=size * 0.42)
        brand_alpha = ImageChops.lighter(brand_alpha, layer.split()[3])
        base.alpha_composite(layer)

    if knockout:
        r, g, b, _ = base.split()
        lum = ImageChops.lighter(ImageChops.lighter(r, g), b)
        base.putalpha(ImageChops.lighter(lum, brand_alpha))

    base.save(out, "PNG", optimize=True)
    if thumb:
        t = base.copy()
        if knockout:  # preview on the garment colour so the file reads as printed
            bg = Image.new("RGBA", t.size, (12, 12, 12, 255)); bg.alpha_composite(t); t = bg
        t = t.convert("RGB"); t.thumbnail((640, 640)); t.save(thumb, "JPEG", quality=85)
    print(f"{out}: {W}x{H} wordmark {wm_w}px at y={wm_y}"
          + (f", subtitle '{subtitle}'" if subtitle else "") + (", knockout" if knockout else ""))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--scale", type=float, default=0.42, help="wordmark width as a fraction of the print width")
    ap.add_argument("--bottom", type=float, default=0.06, help="bottom margin as a fraction of the print height")
    ap.add_argument("--subtitle", default="", help="letterspaced line under the wordmark, e.g. SUBJECT 8")
    ap.add_argument("--knockout", action="store_true", help="make black transparent for dark garments")
    ap.add_argument("--thumb", default="", help="write a 640px JPEG preview here")
    a = ap.parse_args()
    compose(a.src, a.out, a.scale, a.bottom, a.subtitle, a.knockout, a.thumb)
