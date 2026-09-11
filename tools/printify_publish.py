#!/usr/bin/env python3
"""Create products on Printify from merch/products.json.

Runs in GitHub Actions with PRINTIFY_API_TOKEN. For each product it resolves
the blueprint and print provider by name, uploads the artwork from its public
raw.githubusercontent.com URL, creates the product with every matching variant
enabled, prices each variant to the target margin from Printify's own cost,
and optionally publishes it to the store.

Idempotent: product keys already recorded in merch/published.json are skipped
unless FORCE=true, so a re-run never creates duplicates.
"""
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request

API = "https://api.printify.com/v1"
TOKEN = os.environ.get("PRINTIFY_API_TOKEN", "")
SHOP = os.environ.get("PRINTIFY_SHOP_ID", "")
RAW_BASE = os.environ.get("RAW_BASE", "").rstrip("/")
PUBLISH = os.environ.get("PUBLISH", "false").lower() == "true"
FORCE = os.environ.get("FORCE", "false").lower() == "true"
ONLY = [k for k in os.environ.get("ONLY", "").split(",") if k]
RESULTS = "merch/published.json"
# Products to re-upload and rewrite in place; taken from merch/publish.json so
# the workflow file itself never needs to change.
REFRESH = [k for k in os.environ.get("REFRESH", "").split(",") if k] or (
    json.load(open("merch/publish.json")).get("refresh", []) if os.path.exists("merch/publish.json") else [])
# Dry run: resolve blueprint, provider, variants and placement for new products
# and write them to merch/resolved.json without uploading or creating anything.
DRY_RUN = os.environ.get("DRY_RUN", "").lower() == "true" or bool(
    json.load(open("merch/publish.json")).get("dry_run", False) if os.path.exists("merch/publish.json") else False)
RESOLVED = "merch/resolved.json"
# Products to remove from Printify (and from the record); from merch/publish.json.
DELETE = json.load(open("merch/publish.json")).get("delete", []) if os.path.exists("merch/publish.json") else []
PUBLISH_FIELDS = {"title": True, "description": True, "images": True,
                  "variants": True, "tags": True, "keyFeatures": True,
                  "shipping_template": True}


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{API}/{path}", data=data, method=method,
        headers={"Authorization": f"Bearer {TOKEN}",
                 "Content-Type": "application/json",
                 "User-Agent": "paradox-merch-publish/1.0"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                txt = r.read().decode()
                return json.loads(txt) if txt else {}
        except urllib.error.HTTPError as e:
            txt = e.read().decode(errors="replace")
            if e.code in (429, 500, 502, 503) and attempt < 4:
                time.sleep(3 * 2 ** attempt)
                continue
            sys.exit(f"error: {method} /{path} -> {e.code}\n{txt[:800]}")


def norm(s):
    return re.sub(r"[\s\"″”]", "", str(s).lower()).replace("×", "x")


def find_blueprint(spec, blueprints):
    must_not = [m.lower() for m in spec.get("must_not", [])]
    for must in spec["tries"]:
        must = [m.lower() for m in must]
        for b in blueprints:
            hay = f"{b.get('brand','')} {b.get('model','')} {b.get('title','')}".lower()
            if all(m in hay for m in must) and not any(m in hay for m in must_not):
                return b
    return None


def pick_provider(prefs, providers):
    for want in prefs:
        for p in providers:
            if want.lower() in p["title"].lower():
                return p
    return providers[0] if providers else None


def choose_variants(spec, variants):
    colors = [c.lower() for c in (spec.get("colors") or [])]
    sizes = [norm(s) for s in (spec.get("sizes") or [])]
    out = []
    for v in variants:
        opts = v.get("options") or {}
        color = str(opts.get("color", "")).lower()
        size = norm(opts.get("size", ""))
        if colors and color and color not in colors:
            continue
        if sizes and size and size not in sizes:
            continue
        out.append(v)
    return out or variants


def price_for(cost, margin, floor):
    """Smallest $X.99 that clears the target margin and the floor."""
    dollars = math.ceil(cost / (1 - margin) / 100)
    price = dollars * 100 - 1
    if price < cost / (1 - margin):
        price += 100
    return max(price, floor)


def variant_allowed(spec, v):
    """Does a product variant ('Black / S') pass the listing's colour and size filters?"""
    parts = [p.strip() for p in str(v.get("title", "")).split("/")]
    colors = [c.lower() for c in (spec.get("colors") or [])]
    sizes = [norm(s) for s in (spec.get("sizes") or [])]
    if colors and not any(p.lower() in colors for p in parts):
        return False
    if sizes and not any(norm(p) in sizes for p in parts):
        return False
    return True


def image_size(path):
    """Width and height of a local PNG or JPEG, read from the file header."""
    import struct
    with open(path, "rb") as f:
        head = f.read(26)
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return struct.unpack(">II", head[16:24])
        if head[:2] == b"\xff\xd8":
            f.seek(2)
            while True:
                marker = f.read(2)
                if len(marker) < 2 or marker[0] != 0xFF:
                    return None
                if marker[1] in (0xC0, 0xC1, 0xC2):
                    f.read(3)
                    h, w = struct.unpack(">HH", f.read(4))
                    return w, h
                (seglen,) = struct.unpack(">H", f.read(2))
                f.seek(seglen - 2, 1)
    return None


def placeholder_dims(cat_variants, position, pick="first"):
    """Pixel size of a print area. Variants can differ (phone models, canvas
    sizes): 'widest' returns the lowest height/width ratio, which a contain
    fit must respect; 'tallest' the highest, which a cover fit must fill."""
    dims = []
    for v in cat_variants:
        for ph in v.get("placeholders") or []:
            if ph.get("position") == position and ph.get("width") and ph.get("height"):
                d = (ph["width"], ph["height"])
                if pick == "first":
                    return d
                if d not in dims:
                    dims.append(d)
    if not dims:
        return None
    return min(dims, key=lambda d: d[1] / d[0]) if pick == "widest" else max(dims, key=lambda d: d[1] / d[0])


def fit_scale(img_w, img_h, dims):
    """Printify's scale is the image width as a fraction of the placeholder
    width, so a taller image at scale 1 overflows top and bottom. Shrink it
    until the whole image sits inside the print area."""
    if not dims or not img_w or not img_h:
        return 1
    pw, ph = dims
    return round(min(1.0, (ph / pw) * (img_w / img_h)), 4)


def placement(up, cat_variants, positions, fit="contain", align="center"):
    """contain: the whole image sits inside the print area (bands are unprinted).
    cover: the image fills the width, and if the area is taller than the image
    at that width it is enlarged until the height is covered too (the sides
    crop). An image taller than the area is centred, or with align="bottom"
    slid so the bottom edges line up and the crop comes off the top."""
    out = []
    iw, ih = up.get("width"), up.get("height")
    for pos in positions:
        s, y = 1, 0.5
        if fit == "contain":
            dims = placeholder_dims(cat_variants, pos, "widest")
            s = fit_scale(iw, ih, dims)
        else:
            dims = placeholder_dims(cat_variants, pos, "tallest")
            if dims and iw and ih:
                pw, ph = dims
                s = round(max(1.0, (ph / pw) * (iw / ih)), 4)
                scaled_h = ih / iw * pw * s      # image height once placed
                if scaled_h > ph and align == "bottom":
                    y = round(1 - (scaled_h / ph) / 2, 4)
        out.append({"position": pos, "images": [{"id": up["id"], "x": 0.5, "y": y, "scale": s, "angle": 0}]})
        print(f"    {pos}: placeholder {dims}, image {iw}x{ih}, fit {fit}/{align} -> scale {s}, y {y}")
    return out


def refresh_product(prod, existing):
    """Re-upload the artwork and rewrite listing, placement and prices on an
    existing product, keeping its id, blueprint, provider and variants."""
    key, pid = prod["key"], existing["product_id"]
    current = call("GET", f"shops/{SHOP}/products/{pid}.json")
    up = call("POST", "uploads/images.json",
              {"file_name": os.path.basename(prod["image"]), "url": f"{RAW_BASE}/{prod['image']}"})
    print(f"[{key}] re-uploaded {up.get('file_name')} {up.get('width')}x{up.get('height')} -> {up['id']}")
    cat = call("GET", f"catalog/blueprints/{existing['blueprint_id']}/print_providers/{existing['print_provider_id']}/variants.json")
    # Printify validates an update against every variant on the product, so
    # send them all: enabled ones re-priced, disabled ones left as they are.
    all_variants = current.get("variants", [])
    ids = [v["id"] for v in all_variants]
    priced = []
    for v in all_variants:
        on = bool(v.get("is_enabled")) and variant_allowed(prod, v)
        priced.append({"id": v["id"],
                       "price": price_for(v["cost"], prod["margin"], prod.get("min_price", 0)) if on else v["price"],
                       "is_enabled": on})
    print(f"[{key}] enabled: {', '.join(v.get('title', '?') for v, p in zip(all_variants, priced) if p['is_enabled'])}")
    body = {
        "title": prod["title"],
        "description": prod["description"],
        "tags": prod["tags"],
        "variants": priced,
        "print_areas": [{"variant_ids": ids, "placeholders": placement(up, cat.get("variants", []), prod["positions"], prod.get("fit", "contain"), prod.get("align", "center"))}],
    }
    call("PUT", f"shops/{SHOP}/products/{pid}.json", body)
    time.sleep(15)  # Printify re-renders mockups after an update
    final = call("GET", f"shops/{SHOP}/products/{pid}.json")
    prices = [p["price"] for p in priced if p["is_enabled"]]
    existing.update({
        "title": prod["title"], "variants": len(prices),
        "price_min": min(prices), "price_max": max(prices),
        "mockups": [im.get("src") for im in final.get("images", [])][:8],
    })
    print(f"[{key}] refreshed product {pid}: {len(prices)} variants "
          f"${min(prices)/100:.2f}–${max(prices)/100:.2f} at ≥{prod['margin']:.0%} margin")


def main():
    if not TOKEN:
        sys.exit("error: PRINTIFY_API_TOKEN is not set (add it as a repository secret)")
    if not SHOP or not RAW_BASE:
        sys.exit("error: PRINTIFY_SHOP_ID and RAW_BASE are required")

    manifest = json.load(open("merch/products.json"))
    results = json.load(open(RESULTS)) if os.path.exists(RESULTS) else {}
    resolved = {}

    for key in DELETE:
        if key in results:
            pid = results[key]["product_id"]
            call("DELETE", f"shops/{SHOP}/products/{pid}.json")
            del results[key]
            json.dump(results, open(RESULTS, "w"), indent=2)
            print(f"[{key}] deleted product {pid} from Printify and the record")

    print("resolving catalogue…")
    blueprints = call("GET", "catalog/blueprints.json")
    print(f"  {len(blueprints)} blueprints")

    for prod in manifest["products"]:
        key = prod["key"]
        if ONLY and key not in ONLY:
            continue
        if key in results and not FORCE:
            existing = results[key]
            pid = existing["product_id"]
            if key in REFRESH:
                refresh_product(prod, existing)
            if PUBLISH and not existing.get("published"):
                call("POST", f"shops/{SHOP}/products/{pid}/publish.json", PUBLISH_FIELDS)
                existing["published"] = True
                print(f"[{key}] publish requested for product {pid}")
            if key not in REFRESH and not PUBLISH:
                print(f"[{key}] already created as product {pid}; skipping")
            json.dump(results, open(RESULTS, "w"), indent=2)
            continue

        bp = find_blueprint(prod["blueprint"], blueprints)
        if not bp:
            sys.exit(f"[{key}] no blueprint matched {prod['blueprint']}")
        providers = call("GET", f"catalog/blueprints/{bp['id']}/print_providers.json")
        pp = pick_provider(prod.get("providers", []), providers)
        if not pp:
            sys.exit(f"[{key}] blueprint {bp['id']} has no print providers")
        cat = call("GET", f"catalog/blueprints/{bp['id']}/print_providers/{pp['id']}/variants.json")
        chosen = choose_variants(prod, cat.get("variants", []))
        print(f"[{key}] {bp['brand']} {bp['model']} — {bp['title']} (#{bp['id']}) "
              f"via {pp['title']} (#{pp['id']}), {len(chosen)} variants")

        if DRY_RUN:
            all_variants = cat.get("variants", [])
            strict = [v for v in all_variants if variant_allowed(prod, v)]
            size = image_size(prod["image"]) or (None, None)
            places = placement({"id": "dry-run", "width": size[0], "height": size[1]},
                               chosen, prod["positions"], prod.get("fit", "contain"), prod.get("align", "center"))
            resolved[key] = {
                "blueprint": f"{bp['brand']} {bp['model']} — {bp['title']}", "blueprint_id": bp["id"],
                "print_provider": pp["title"], "print_provider_id": pp["id"],
                "providers_available": [p["title"] for p in providers],
                "variants_total": len(all_variants), "variants_matched": len(strict),
                "matched_titles": [v.get("title") for v in strict],
                "colours_available": sorted({str((v.get("options") or {}).get("color", "")) for v in all_variants}),
                "positions_available": sorted({ph.get("position") for v in all_variants
                                               for ph in (v.get("placeholders") or []) if ph.get("position")}),
                "image": {"path": prod["image"], "width": size[0], "height": size[1]},
                "placements": [{"position": pl["position"], "placeholder": placeholder_dims(chosen, pl["position"]),
                                "scale": pl["images"][0]["scale"], "y": pl["images"][0]["y"]} for pl in places],
            }
            if not strict:
                print(f"[{key}] WARNING: no catalogue variant matched colours {prod.get('colors')} / sizes {prod.get('sizes')}")
            print(f"[{key}] dry run: {len(strict)} of {len(all_variants)} variants match; nothing created")
            json.dump(resolved, open(RESOLVED, "w"), indent=2)
            continue

        image_url = f"{RAW_BASE}/{prod['image']}"
        up = call("POST", "uploads/images.json",
                  {"file_name": os.path.basename(prod["image"]), "url": image_url})
        print(f"[{key}] uploaded {up.get('file_name')} {up.get('width')}x{up.get('height')} -> {up['id']}")

        ids = [v["id"] for v in chosen]
        body = {
            "title": prod["title"],
            "description": prod["description"],
            "tags": prod["tags"],
            "blueprint_id": bp["id"],
            "print_provider_id": pp["id"],
            "variants": [{"id": i, "price": 9999, "is_enabled": True} for i in ids],
            "print_areas": [{"variant_ids": ids, "placeholders": placement(up, chosen, prod["positions"], prod.get("fit", "contain"), prod.get("align", "center"))}],
        }
        created = call("POST", f"shops/{SHOP}/products.json", body)
        pid = created["id"]
        print(f"[{key}] created product {pid}")
        # Record the product the moment it exists so a later failure can
        # never leave an unrecorded orphan on Printify.
        results[key] = {
            "product_id": pid, "title": prod["title"],
            "blueprint": f"{bp['brand']} {bp['model']} — {bp['title']}", "blueprint_id": bp["id"],
            "print_provider": pp["title"], "print_provider_id": pp["id"],
            "variants": len(ids), "price_min": None, "price_max": None, "published": False,
            "mockups": [], "url": f"https://printify.com/app/store/{SHOP}/products/{pid}",
        }
        json.dump(results, open(RESULTS, "w"), indent=2)

        # Printify only reveals the per-variant cost on the created product, so
        # price in a second pass from the real numbers.
        priced, lo, hi = [], None, None
        for v in created.get("variants", []):
            if not v.get("is_enabled"):
                continue
            p = price_for(v["cost"], prod["margin"], prod.get("min_price", 0))
            priced.append({"id": v["id"], "price": p, "is_enabled": True})
            lo = p if lo is None else min(lo, p)
            hi = p if hi is None else max(hi, p)
        call("PUT", f"shops/{SHOP}/products/{pid}.json", {"variants": priced})
        print(f"[{key}] priced {len(priced)} variants ${lo/100:.2f}–${hi/100:.2f} "
              f"at ≥{prod['margin']:.0%} margin")

        if PUBLISH:
            call("POST", f"shops/{SHOP}/products/{pid}/publish.json", PUBLISH_FIELDS)
            print(f"[{key}] publish requested")

        final = call("GET", f"shops/{SHOP}/products/{pid}.json")
        results[key] = {
            "product_id": pid,
            "title": prod["title"],
            "blueprint": f"{bp['brand']} {bp['model']} — {bp['title']}",
            "blueprint_id": bp["id"],
            "print_provider": pp["title"],
            "print_provider_id": pp["id"],
            "variants": len(priced),
            "price_min": lo, "price_max": hi,
            "published": PUBLISH,
            "mockups": [im.get("src") for im in final.get("images", [])][:8],
            "url": f"https://printify.com/app/store/{SHOP}/products/{pid}",
        }
        json.dump(results, open(RESULTS, "w"), indent=2)

    if DRY_RUN:
        print(f"dry run: {len(resolved)} products resolved in {RESOLVED}")
    print(f"done: {len(results)} products recorded in {RESULTS}")


if __name__ == "__main__":
    main()
