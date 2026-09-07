#!/usr/bin/env python3
"""Download unique related cover images per model slug into public/models/covers/."""
from __future__ import annotations

import hashlib
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = 40_000_000

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "src/content/models"
OUT = ROOT / "public/models/covers"
OUT.mkdir(parents=True, exist_ok=True)

UA = "BrianBeersWebsite/1.0 (educational cover curation)"
SKIP_SLUGS = {"used-clothing-resale", "kids-clothing-resale"}
CATEGORY_FILES = {
    "home-services", "retail-resale", "auto", "business-services", "real-estate-ops",
    "education", "senior-care", "food-hospitality", "health-wellness", "other",
}

# keyword phrase for search / loremflickr (comma-separated tokens)
KEYWORDS: dict[str, str] = {
    "acai-bowl": "acai,bowl,cafe",
    "adult-day-centers": "senior,community,activity",
    "artificial-turf": "artificial,turf,lawn",
    "auto-detailing": "car,detailing,polish",
    "auto-glass": "car,windshield,glass",
    "auto-repair": "auto,repair,garage",
    "bakery": "bakery,pastry,bread",
    "bio-cleanup": "hazmat,cleaning,protective",
    "blinds-window-coverings": "window,blinds,interior",
    "business-coaching": "business,meeting,office",
    "cabinets-kitchen-refresh": "kitchen,cabinets,modern",
    "carpet-cleaning": "carpet,cleaning,vacuum",
    "catering": "catering,buffet,event",
    "cleaning-for-turns": "hotel,room,cleaning",
    "closets-custom-storage": "closet,organization,storage",
    "clothing-bins": "donation,clothing,bin",
    "coffee-shop": "coffee,shop,cafe",
    "commercial-hood-cleaning": "commercial,kitchen,stainless",
    "commercial-janitorial": "office,cleaning,mop",
    "commercial-painting": "building,painting,exterior",
    "concrete-coatings": "epoxy,garage,floor",
    "consignment-furniture": "furniture,showroom,vintage",
    "cryotherapy": "cryotherapy,wellness,spa",
    "custom-apparel": "screen,printing,tshirt",
    "cybersecurity-consulting": "computer,security,office",
    "dance-studio": "dance,studio,ballet",
    "daycare-preschool": "preschool,classroom,children",
    "drain-cleaning": "plumber,drain,pipe",
    "drug-testing-labs": "laboratory,medical,testing",
    "dumpster-rental": "dumpster,construction,waste",
    "electrical": "electrician,electrical,panel",
    "electronics-buy-sell": "electronics,smartphone,store",
    "escape-rooms": "escape,room,puzzle",
    "estate-sales": "estate,sale,furniture",
    "fence-install": "fence,wood,backyard",
    "fitness-gym": "fitness,gym,workout",
    "flooring-install": "hardwood,flooring,install",
    "furniture-rto": "furniture,sofa,store",
    "garage-door": "garage,door,house",
    "ghost-kitchen": "commercial,kitchen,cooking",
    "gutters": "house,gutters,roof",
    "hair-removal-wax": "spa,waxing,beauty",
    "hair-salon": "hair,salon,barber",
    "handyman": "handyman,tools,repair",
    "hardware-home-retail": "hardware,store,tools",
    "home-care-medical": "nurse,home,care",
    "home-inspection": "home,inspector,house",
    "hvac": "hvac,air,conditioning",
    "ice-cream": "ice,cream,parlor",
    "in-home-non-medical-senior-care": "senior,caregiver,home",
    "it-msp": "information,technology,office",
    "junk-removal": "junk,removal,truck",
    "kids-art": "kids,art,painting",
    "kids-clothing-resale": "kids,clothing,store",
    "kids-fitness": "kids,gym,play",
    "kids-music": "kids,music,piano",
    "lash-brow-studio": "eyelash,beauty,spa",
    "lawn-landscaping": "lawn,landscaping,garden",
    "lawn-treatment": "lawn,green,fertilizer",
    "locksmith": "locksmith,key,lock",
    "massage-studio": "massage,spa,therapy",
    "med-spa": "medical,spa,clinic",
    "mobile-car-wash": "car,wash,outdoor",
    "mobile-food": "food,truck,street",
    "mobile-gaming-trucks": "gaming,video,party",
    "mobile-pet-care": "dog,grooming,pet",
    "mobility-accessibility": "wheelchair,ramp,accessibility",
    "montessori": "montessori,classroom,children",
    "mosquito-control": "mosquito,outdoor,yard",
    "nail-salon": "nail,salon,manicure",
    "packaging-shipping": "shipping,boxes,parcel",
    "parking-lot-striping": "parking,lot,asphalt",
    "party-rentals": "bounce,house,party",
    "pest-control": "pest,control,exterminator",
    "pet-grooming": "dog,grooming,salon",
    "pet-supply-retail": "pet,store,dog",
    "pet-waste-removal": "dog,park,lawn",
    "physical-therapy": "physical,therapy,clinic",
    "pool-service": "swimming,pool,cleaning",
    "pressure-washing": "pressure,washing,house",
    "print-signage": "sign,printing,vinyl",
    "property-management": "apartment,building,rental",
    "public-claims-adjusting": "insurance,inspector,clipboard",
    "qsr-fast-casual": "restaurant,fast,casual",
    "quick-lube": "oil,change,car",
    "real-estate-investment-buy-hold": "suburban,house,exterior",
    "residential-cleaning": "house,cleaning,maid",
    "residential-moving": "moving,truck,boxes",
    "residential-painting": "house,painting,painter",
    "residential-plumbing": "plumber,bathroom,sink",
    "restoration": "water,damage,restoration",
    "roofing": "roofing,house,shingles",
    "salon-suites": "salon,suite,beauty",
    "senior-moving": "moving,boxes,elderly",
    "senior-placement-referral": "senior,living,community",
    "senior-real-estate": "retirement,house,exterior",
    "short-term-rental-management": "vacation,rental,interior",
    "smart-home-security": "smart,home,security",
    "smoothie-juice": "smoothie,juice,bar",
    "spray-tan": "spray,tan,beauty",
    "staffing-recruiting": "interview,office,hiring",
    "tax-preparation": "tax,accountant,office",
    "tire-wheels": "car,tire,wheels",
    "towing": "tow,truck,roadside",
    "transition-downsizing": "packing,boxes,declutter",
    "transmission-specialty": "auto,transmission,mechanic",
    "tree-care": "tree,trimming,arborist",
    "tutoring-learning-center": "tutoring,classroom,student",
    "used-clothing-clothes-bin": "clothing,donation,thrift",
    "used-clothing-resale": "thrift,clothing,racks",
    "used-sporting-goods": "sporting,goods,bike",
    "vending": "vending,machine,snacks",
    "weight-loss": "fitness,coaching,wellness",
    "window-cleaning": "window,cleaning,squeegee",
    "window-glass": "window,glass,house",
    "wine-paint": "painting,canvas,art",
}


def load_models():
    rows = []
    for path in sorted(MODELS.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---", text, re.S)
        if not m:
            continue
        fm = m.group(1)
        def get(key: str):
            mm = re.search(rf"^{key}:\s*(.+)$", fm, re.M)
            return mm.group(1).strip().strip('"').strip("'") if mm else None
        if get("publish") != "true":
            continue
        slug = get("slug") or path.stem
        title = get("title") or slug
        rows.append((slug, title))
    return rows


def kw_for(slug: str, title: str) -> str:
    if slug in KEYWORDS:
        return KEYWORDS[slug]
    words = re.findall(r"[a-z0-9]+", title.lower())
    return ",".join(words[:4]) or "business"


def http_get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def to_cover_jpeg(content: bytes, dest: Path) -> bool:
    try:
        im = Image.open(io.BytesIO(content)).convert("RGB")
        w, h = im.size
        if w < 500 or h < 350:
            return False
        target_ratio = 1200 / 750
        r0 = w / h
        if r0 > target_ratio:
            nw = int(h * target_ratio)
            left = (w - nw) // 2
            im = im.crop((left, 0, left + nw, h))
        else:
            nh = int(w / target_ratio)
            top = (h - nh) // 2
            im = im.crop((0, top, w, top + nh))
        im = im.resize((1200, 750), Image.Resampling.LANCZOS)
        for q in (80, 72, 64, 55):
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=q, optimize=True)
            data = buf.getvalue()
            if len(data) <= 300_000 or q == 55:
                dest.write_bytes(data)
                return True
        return False
    except Exception as e:
        print(f"  process err: {e}")
        return False


def search_openverse(query: str) -> list[dict]:
    # spaces for openverse
    q = query.replace(",", " ")
    params = urllib.parse.urlencode({
        "q": q,
        "page_size": 15,
        "license_type": "commercial",
        "category": "photograph",
    })
    url = f"https://api.openverse.org/v1/images/?{params}"
    try:
        data = json.loads(http_get(url, timeout=20).decode())
        out = []
        for r in data.get("results") or []:
            w = int(r.get("width") or 0)
            h = int(r.get("height") or 0)
            if w and h and (w * h > 25_000_000 or w > 6000 or h > 6000):
                continue
            if w and h and (w < 800 or h < 500):
                continue
            url0 = r.get("url")
            rid = str(r.get("id") or url0)
            if url0:
                out.append({"id": rid, "url": url0, "w": w, "h": h})
        return out
    except Exception as e:
        print(f"  openverse err '{query}': {e}")
        return []


def download_loremflickr(slug: str, kw: str, dest: Path) -> bool:
    lock = int(hashlib.md5(slug.encode()).hexdigest()[:8], 16) % 100000
    # all = creative commons-ish pool on loremflickr
    url = f"https://loremflickr.com/1200/750/{urllib.parse.quote(kw)}/all?lock={lock}"
    try:
        content = http_get(url, timeout=40)
        return to_cover_jpeg(content, dest)
    except Exception as e:
        print(f"  loremflickr fail {slug}: {e}")
        # try without /all
        try:
            url2 = f"https://loremflickr.com/1200/750/{urllib.parse.quote(kw)}?lock={lock}"
            content = http_get(url2, timeout=40)
            return to_cover_jpeg(content, dest)
        except Exception as e2:
            print(f"  loremflickr fail2 {slug}: {e2}")
            return False


def fetch_one(slug: str, title: str, used_ids: set, lock) -> tuple[str, str]:
    """Returns (slug, status) status in ok|exists|skip|fail"""
    if slug in SKIP_SLUGS:
        return slug, "skip"
    dest = OUT / f"{slug}.jpg"
    if dest.exists() and slug not in CATEGORY_FILES:
        return slug, "exists"

    kw = kw_for(slug, title)

    # Fast path: unique related Flickr stock via loremflickr lock
    if download_loremflickr(slug, kw, dest):
        print(f"OK {slug} ({dest.stat().st_size//1024}KB)", flush=True)
        return slug, "ok"

    broad = ",".join(kw.split(",")[:2])
    if broad != kw and download_loremflickr(slug, broad, dest):
        print(f"OK broad {slug}", flush=True)
        return slug, "ok"

    # Openverse last resort
    try:
        cands = search_openverse(kw)
        cands.sort(key=lambda c: (1 if c["w"] >= c["h"] else 0, c["w"] * c["h"]), reverse=True)
        for c in cands[:5]:
            with lock:
                if c["id"] in used_ids:
                    continue
            try:
                content = http_get(c["url"], timeout=25)
                if len(content) > 8_000_000:
                    continue
                if to_cover_jpeg(content, dest):
                    with lock:
                        used_ids.add(c["id"])
                    print(f"OK openverse {slug}", flush=True)
                    return slug, "ok"
            except Exception:
                continue
    except Exception as e:
        print(f"  openverse path err {slug}: {e}", flush=True)

    print(f"FAIL {slug}", flush=True)
    return slug, "fail"


def main():
    import threading
    models = load_models()
    print(f"Published models: {len(models)}", flush=True)
    used_ids: set[str] = set()
    lock = threading.Lock()
    stats = {"ok": 0, "exists": 0, "skip": 0, "fail": 0}
    failed = []

    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(fetch_one, slug, title, used_ids, lock) for slug, title in models]
        for fut in as_completed(futs):
            slug, status = fut.result()
            stats[status] = stats.get(status, 0) + 1
            if status == "fail":
                failed.append(slug)

    print("---", flush=True)
    print(json.dumps({"stats": stats, "failed": failed}), flush=True)


if __name__ == "__main__":
    main()
