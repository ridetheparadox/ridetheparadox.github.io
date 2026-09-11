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


def refresh_product(prod, existing):
    """Re-upload the artwork and rewrite listing, placement and prices on an
    existing product, keeping its id, blueprint, provider and variants."""
    key, pid = prod["key"], existing["product_id"]
    current = call("GET", f"shops/{SHOP}/products/{pid}.json")
    up = call("POST", "uploads/images.json",
              {"file_name": os.path.basename(prod["image"]), "url": f"{RAW_BASE}/{prod['image']}"})
    print(f"[{key}] re-uploaded {up.get('file_name')} {up.get('width')}x{up.get('height')} -> {up['id']}")
    enabled = [v for v in current.get("variants", []) if v.get("is_enabled")]
    ids = [v["id"] for v in enabled]
    priced = [{"id": v["id"], "price": price_for(v["cost"], prod["margin"], prod.get("min_price", 0)),
               "is_enabled": True} for v in enabled]
    body = {
        "title": prod["title"],
        "description": prod["description"],
        "tags": prod["tags"],
        "variants": priced,
        "print_areas": [{
            "variant_ids": ids,
            "placeholders": [
                {"position": pos, "images": [{"id": up["id"], "x": 0.5, "y": 0.5, "scale": 1, "angle": 0}]}
                for pos in prod["positions"]],
        }],
    }
    call("PUT", f"shops/{SHOP}/products/{pid}.json", body)
    time.sleep(15)  # Printify re-renders mockups after an update
    final = call("GET", f"shops/{SHOP}/products/{pid}.json")
    prices = [p["price"] for p in priced]
    existing.update({
        "title": prod["title"], "variants": len(priced),
        "price_min": min(prices), "price_max": max(prices),
        "mockups": [im.get("src") for im in final.get("images", [])][:8],
    })
    print(f"[{key}] refreshed product {pid}: {len(priced)} variants "
          f"${min(prices)/100:.2f}–${max(prices)/100:.2f} at ≥{prod['margin']:.0%} margin")


def main():
    if not TOKEN:
        sys.exit("error: PRINTIFY_API_TOKEN is not set (add it as a repository secret)")
    if not SHOP or not RAW_BASE:
        sys.exit("error: PRINTIFY_SHOP_ID and RAW_BASE are required")

    manifest = json.load(open("merch/products.json"))
    results = json.load(open(RESULTS)) if os.path.exists(RESULTS) else {}

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
            "print_areas": [{
                "variant_ids": ids,
                "placeholders": [
                    {"position": pos, "images": [{"id": up["id"], "x": 0.5, "y": 0.5, "scale": 1, "angle": 0}]}
                    for pos in prod["positions"]],
            }],
        }
        created = call("POST", f"shops/{SHOP}/products.json", body)
        pid = created["id"]
        print(f"[{key}] created product {pid}")

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

    print(f"done: {len(results)} products recorded in {RESULTS}")


if __name__ == "__main__":
    main()
