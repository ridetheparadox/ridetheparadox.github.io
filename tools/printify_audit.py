#!/usr/bin/env python3
"""Audit a Printify shop: margins, listing quality, catalogue shape.

Two ways in, because the API is not always reachable:

    # live, needs network access to api.printify.com
    PRINTIFY_API_TOKEN=... python3 tools/printify_audit.py --dump raw/

    # offline, from JSON pulled elsewhere (see --help for the two curl calls)
    python3 tools/printify_audit.py --from-json raw/products.json

Read-only. Nothing here writes to the shop.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict

API = "https://api.printify.com/v1"

# Etsy allows 13 tags; Printify passes them straight through. Titles over
# ~140 chars get truncated in most channel UIs.
MAX_TAGS = 13
TITLE_MAX = 140
TITLE_MIN = 15
DESC_MIN = 200
THIN_MARGIN = 0.30


def api_get(path, token):
    req = urllib.request.Request(
        f"{API}/{path}",
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "paradox-printify-audit/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:300]
        sys.exit(f"error: GET /{path} returned {e.code}\n{body}")
    except urllib.error.URLError as e:
        sys.exit(
            f"error: cannot reach api.printify.com ({e.reason}).\n"
            "If this is a sandbox, the egress proxy is probably blocking the "
            "domain. Pull the JSON elsewhere and use --from-json."
        )


def fetch_products(token, shop_id):
    """Walk the paginated product list."""
    out, page = [], 1
    while True:
        payload = api_get(f"shops/{shop_id}/products.json?limit=50&page={page}", token)
        batch = payload.get("data", payload) if isinstance(payload, dict) else payload
        if not batch:
            break
        out.extend(batch)
        last = payload.get("last_page", page) if isinstance(payload, dict) else page
        if page >= last:
            break
        page += 1
    return out


def money(cents):
    return f"${cents / 100:,.2f}"


def variant_rows(product):
    """Enabled variants only — disabled ones aren't purchasable, so they
    shouldn't drag the margin numbers around."""
    rows = []
    for v in product.get("variants") or []:
        if not v.get("is_enabled", True):
            continue
        price, cost = v.get("price"), v.get("cost")
        if not isinstance(price, int) or not isinstance(cost, int) or price <= 0:
            continue
        rows.append({
            "title": v.get("title", "?"),
            "price": price,
            "cost": cost,
            "profit": price - cost,
            "margin": (price - cost) / price,
        })
    return rows


def analyse(products):
    findings = defaultdict(list)
    per_product = []

    for p in products:
        title = (p.get("title") or "").strip()
        desc = (p.get("description") or "").strip()
        tags = p.get("tags") or []
        variants = p.get("variants") or []
        enabled = variant_rows(p)
        pid = p.get("id", "?")
        label = title or f"(untitled {pid})"

        margins = [v["margin"] for v in enabled]
        stats = {
            "id": pid,
            "title": label,
            "visible": p.get("visible", False),
            "locked": p.get("is_locked", False),
            "blueprint": p.get("blueprint_id"),
            "provider": p.get("print_provider_id"),
            "variants_total": len(variants),
            "variants_enabled": len(enabled),
            "tags": len(tags),
            "title_len": len(title),
            "desc_len": len(desc),
            "margin_min": min(margins) if margins else None,
            "margin_max": max(margins) if margins else None,
            "margin_avg": sum(margins) / len(margins) if margins else None,
            "price_min": min(v["price"] for v in enabled) if enabled else None,
            "price_max": max(v["price"] for v in enabled) if enabled else None,
        }
        per_product.append(stats)

        # --- flags, worst first -------------------------------------------
        losing = [v for v in enabled if v["profit"] <= 0]
        if losing:
            findings["loss"].append(
                f"**{label}** — {len(losing)} of {len(enabled)} live variants sell at or "
                f"below cost (worst: {losing[0]['title']} at {money(losing[0]['price'])} "
                f"against {money(losing[0]['cost'])} cost)"
            )
        thin = [v for v in enabled if 0 < v["margin"] < THIN_MARGIN]
        if thin and not losing:
            findings["thin"].append(
                f"**{label}** — {len(thin)} variant(s) under "
                f"{THIN_MARGIN:.0%} margin (thinnest {min(v['margin'] for v in thin):.0%})"
            )
        if enabled and stats["margin_max"] - stats["margin_min"] > 0.25:
            findings["uneven"].append(
                f"**{label}** — margin swings {stats['margin_min']:.0%} to "
                f"{stats['margin_max']:.0%} across variants; pricing is set per-variant "
                f"rather than to a target margin"
            )
        if not enabled and variants:
            findings["dead"].append(f"**{label}** — every variant is disabled")
        if not p.get("visible", False):
            findings["hidden"].append(f"**{label}** — not published to the storefront")
        if not tags:
            findings["notags"].append(f"**{label}** — no tags at all")
        elif len(tags) < 8:
            findings["fewtags"].append(f"**{label}** — only {len(tags)} tags (room for {MAX_TAGS})")
        if len(tags) > MAX_TAGS:
            findings["manytags"].append(
                f"**{label}** — {len(tags)} tags; channels that cap at {MAX_TAGS} will drop the rest"
            )
        if len(desc) < DESC_MIN:
            findings["thindesc"].append(
                f"**{label}** — description is {len(desc)} chars"
                + (" (empty)" if not desc else "")
            )
        if len(title) > TITLE_MAX:
            findings["longtitle"].append(f"**{label[:60]}…** — title is {len(title)} chars")
        elif len(title) < TITLE_MIN:
            findings["shorttitle"].append(f"**{label}** — title is only {len(title)} chars")
        if not (p.get("images") or []):
            findings["noimg"].append(f"**{label}** — no mockup images")

    return per_product, findings


def report(shop, products, per_product, findings):
    L = []
    w = L.append
    name = shop.get("title", "shop") if shop else "shop"

    w(f"# Printify audit — {name}\n")
    w(f"{len(products)} products, "
      f"{sum(s['variants_enabled'] for s in per_product)} live variants "
      f"({sum(s['variants_total'] for s in per_product)} configured).\n")

    live = [s for s in per_product if s["visible"]]
    w(f"- Published: **{len(live)}** / {len(per_product)}")

    priced = [s for s in per_product if s["margin_avg"] is not None]
    if priced:
        avg = sum(s["margin_avg"] for s in priced) / len(priced)
        w(f"- Average margin across products: **{avg:.0%}**")
        lo = min(priced, key=lambda s: s["margin_avg"])
        hi = max(priced, key=lambda s: s["margin_avg"])
        w(f"- Thinnest: {lo['title']} at {lo['margin_avg']:.0%} · "
          f"Fattest: {hi['title']} at {hi['margin_avg']:.0%}")
        prices = [s["price_min"] for s in priced if s["price_min"]]
        if prices:
            w(f"- Entry price range: {money(min(prices))} – {money(max(prices))}")

    bp = Counter(s["blueprint"] for s in per_product)
    if bp:
        w(f"- Blueprints in use: **{len(bp)}** "
          f"({', '.join(f'#{k}×{v}' for k, v in bp.most_common(6))})")
    pv = Counter(s["provider"] for s in per_product)
    if pv:
        w(f"- Print providers: **{len(pv)}** "
          f"({', '.join(f'#{k}×{v}' for k, v in pv.most_common(6))})")
        if len(pv) > 2:
            w(f"  - More providers means more separate shipments per multi-item "
              f"order, and more shipping charged to the buyer.")
    w("")

    sections = [
        ("loss", "Selling at or below cost", "Fix before anything else."),
        ("dead", "Products with nothing buyable", "Live listings that cannot convert."),
        ("thin", "Thin margins", f"Under {THIN_MARGIN:.0%} leaves nothing for ads or returns."),
        ("uneven", "Inconsistent margin across variants", "Usually a flat price on variants with different costs."),
        ("noimg", "No mockups", ""),
        ("hidden", "Unpublished", "Built but never pushed to the storefront."),
        ("notags", "No tags", "Invisible to search on every channel."),
        ("thindesc", "Thin descriptions", f"Under {DESC_MIN} chars."),
        ("manytags", "Too many tags", ""),
        ("fewtags", "Unused tag slots", ""),
        ("longtitle", "Titles that will truncate", ""),
        ("shorttitle", "Very short titles", ""),
    ]
    any_found = False
    for key, heading, note in sections:
        items = findings.get(key)
        if not items:
            continue
        any_found = True
        w(f"## {heading} ({len(items)})\n")
        if note:
            w(f"_{note}_\n")
        for line in items[:25]:
            w(f"- {line}")
        if len(items) > 25:
            w(f"- …and {len(items) - 25} more")
        w("")

    if not any_found:
        w("## No issues flagged\n")
        w("Margins, tags, descriptions and publish state all pass the checks.\n")

    w("## Per-product table\n")
    w("| Product | Live | Variants | Margin | Price from | Tags | Desc |")
    w("|---|---|---|---|---|---|---|")
    for s in sorted(per_product, key=lambda s: s["margin_avg"] if s["margin_avg"] is not None else 9):
        m = f"{s['margin_avg']:.0%}" if s["margin_avg"] is not None else "—"
        pr = money(s["price_min"]) if s["price_min"] else "—"
        t = s["title"][:44] + ("…" if len(s["title"]) > 44 else "")
        w(f"| {t} | {'yes' if s['visible'] else 'no'} | "
          f"{s['variants_enabled']}/{s['variants_total']} | {m} | {pr} | "
          f"{s['tags']} | {s['desc_len']} |")
    w("")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
To pull the JSON from a machine that can reach Printify:

  TOKEN=your_personal_access_token
  curl -H "Authorization: Bearer $TOKEN" \\
       https://api.printify.com/v1/shops.json > shops.json
  curl -H "Authorization: Bearer $TOKEN" \\
       "https://api.printify.com/v1/shops/<SHOP_ID>/products.json?limit=50" \\
       > products.json

then run:  python3 tools/printify_audit.py --from-json products.json
""",
    )
    ap.add_argument("--token", default=os.environ.get("PRINTIFY_API_TOKEN"),
                    help="Printify personal access token (or $PRINTIFY_API_TOKEN)")
    ap.add_argument("--shop-id", help="skip shop lookup and audit this shop")
    ap.add_argument("--from-json", metavar="FILE",
                    help="read products from a saved API response instead of the network")
    ap.add_argument("--dump", metavar="DIR", help="save raw API responses here")
    ap.add_argument("-o", "--out", metavar="FILE", help="write the report to a file")
    args = ap.parse_args()

    shop = None
    if args.from_json:
        with open(args.from_json) as f:
            payload = json.load(f)
        products = payload.get("data", payload) if isinstance(payload, dict) else payload
        if not isinstance(products, list):
            sys.exit("error: expected a product array, or an object with a 'data' array")
    else:
        if not args.token:
            sys.exit(
                "error: no token. Set PRINTIFY_API_TOKEN or pass --token.\n"
                "Printify → My Profile → Connections → Personal Access Tokens.\n"
                "Read-only scopes (shops.read, products.read) are enough.\n"
                "No network access? Use --from-json; see --help."
            )
        shops = api_get("shops.json", args.token)
        if not shops:
            sys.exit("error: this token can see no shops.")
        shop = next((s for s in shops if str(s.get("id")) == str(args.shop_id)), shops[0]) \
            if args.shop_id else shops[0]
        if len(shops) > 1 and not args.shop_id:
            print(f"note: {len(shops)} shops found, auditing "
                  f"{shop.get('title')} (id {shop.get('id')}). "
                  f"Use --shop-id to pick another.", file=sys.stderr)
        products = fetch_products(args.token, shop["id"])
        if args.dump:
            os.makedirs(args.dump, exist_ok=True)
            with open(os.path.join(args.dump, "shops.json"), "w") as f:
                json.dump(shops, f, indent=2)
            with open(os.path.join(args.dump, "products.json"), "w") as f:
                json.dump(products, f, indent=2)

    if not products:
        sys.exit("error: no products returned.")

    per_product, findings = analyse(products)
    text = report(shop, products, per_product, findings)
    if args.out:
        with open(args.out, "w") as f:
            f.write(text)
        print(f"wrote {args.out} ({len(products)} products)", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
