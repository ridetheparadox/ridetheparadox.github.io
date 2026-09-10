#!/usr/bin/env python3
"""Fetch rendered merch artwork into the repo and make small review thumbnails.

Runs inside GitHub Actions, where the runner has open internet. Reads a JSON
object {filename: url} from $MANIFEST, saves each file under merch/print/,
writes a 640px JPEG thumbnail under merch/thumbs/, and records dimensions in
merch/thumbs/index.json so the pipeline can check print resolution.
"""
import json
import os
import sys
import urllib.request

from PIL import Image

manifest = json.loads(os.environ["MANIFEST"])
os.makedirs("merch/print", exist_ok=True)
os.makedirs("merch/thumbs", exist_ok=True)

index = {}
if os.path.exists("merch/thumbs/index.json"):
    index = json.load(open("merch/thumbs/index.json"))

for name, url in manifest.items():
    dest = os.path.join("merch/print", name)
    req = urllib.request.Request(url, headers={"User-Agent": "paradox-merch-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        f.write(r.read())
    im = Image.open(dest)
    w, h = im.size
    thumb = im.convert("RGB")
    thumb.thumbnail((640, 640))
    tpath = os.path.join("merch/thumbs", os.path.splitext(name)[0] + ".jpg")
    thumb.save(tpath, "JPEG", quality=82, optimize=True)
    index[name] = {"width": w, "height": h, "mode": im.mode,
                   "bytes": os.path.getsize(dest), "thumb": tpath}
    print(f"{name}: {w}x{h} {im.mode} {os.path.getsize(dest)/1e6:.1f}MB -> {tpath}")

json.dump(index, open("merch/thumbs/index.json", "w"), indent=2)
print(f"indexed {len(index)} files", file=sys.stderr)
