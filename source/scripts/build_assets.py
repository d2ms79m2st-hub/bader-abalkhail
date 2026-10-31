"""
يبني أصول المعاينة من الملفات الرسمية دون تعديل الأصل:
  - ينسخ الشعار الرسمي كما هو (نسخة بايت ببايت) ويتحقق من البصمة.
  - يستخرج خطوط ثمانية من الحزمة الرسمية.
  - يولّد تسلسل إطارات المشهد الافتتاحي (Scroll-Scrubbing) من صور المتجر الرسمية.
  - يولّد نسخًا مصغّرة WebP من صور المنتجات الرسمية لتحسين الأداء.
  - يولّد ملف بيانات المنتجات من لقطة المتجر الرسمية (بدون أي بيانات مخترعة).

التشغيل من مجلد المشروع:  npm run assets
"""
import hashlib
import json
import os
import shutil
import sys
import zipfile

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.dirname(ROOT)
CATALOG = os.path.join(BRAND, "Store_Catalog")
PUBLIC = os.path.join(ROOT, "public")
MEDIA = os.path.join(PUBLIC, "media")

GREEN = (0x12, 0x37, 0x2A)

# ---------------------------------------------------------------- الشعار والخطوط


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def copy_brand():
    src = os.path.join(BRAND, "نماذج", "assets", "logo", "لوقو المحل.jpg")
    dst_dir = os.path.join(PUBLIC, "brand")
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, "logo-official.jpg")
    shutil.copyfile(src, dst)
    assert sha256(src) == sha256(dst), "بصمة الشعار لا تطابق الأصل"
    print("logo  ok", sha256(dst)[:16])

    fonts = {
        "thmanyah typeface/thmanyahsans/woff2/thmanyahsans-Regular.woff2": "sans-400.woff2",
        "thmanyah typeface/thmanyahsans/woff2/thmanyahsans-Medium.woff2": "sans-500.woff2",
        "thmanyah typeface/thmanyahsans/woff2/thmanyahsans-Bold.woff2": "sans-700.woff2",
        "thmanyah typeface/thmanyahserifdisplay/woff2/thmanyahserifdisplay-Light.woff2": "serif-300.woff2",
        "thmanyah typeface/thmanyahserifdisplay/woff2/thmanyahserifdisplay-Regular.woff2": "serif-400.woff2",
        "thmanyah typeface/thmanyahserifdisplay/woff2/thmanyahserifdisplay-Bold.woff2": "serif-700.woff2",
    }
    fdir = os.path.join(PUBLIC, "fonts")
    os.makedirs(fdir, exist_ok=True)
    with zipfile.ZipFile(os.path.join(BRAND, "Thmanyah-Font-Family (1).zip")) as z:
        for name, out in fonts.items():
            with open(os.path.join(fdir, out), "wb") as f:
                f.write(z.read(name))
    print("fonts ok", len(fonts))


# ---------------------------------------------------------------- تسلسل المشهد الافتتاحي


def img_path(pid, n):
    d = os.path.join(CATALOG, "images", pid)
    for f in os.listdir(d):
        if f.startswith(n):
            return os.path.join(d, f)
    raise FileNotFoundError(pid + "/" + n)


# كل لقطة: صورة رسمية + حركة كاميرا (مركز نسبي، تكبير) من البداية إلى النهاية + نافذة زمنية من التقدم الكلي
SHOTS = [
    {"src": ("1117352417", "01"), "a": (0.50, 0.50, 1.00), "b": (0.50, 0.40, 1.45), "t": (0.00, 0.31)},
    {"src": ("838230676", "02"), "a": (0.50, 0.66, 1.30), "b": (0.44, 0.26, 1.18), "t": (0.25, 0.56)},
    {"src": ("1272344271", "01"), "a": (0.48, 0.58, 1.00), "b": (0.56, 0.64, 1.35), "t": (0.50, 0.81)},
    {"src": ("1331844156", "02"), "a": (0.62, 0.74, 1.15), "b": (0.60, 0.52, 1.12), "t": (0.75, 1.00)},
]
FADE_IN, FADE_OUT = 0.05, 0.93


def smooth(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def lerp(a, b, t):
    return a + (b - a) * t


def frame_of_shot(img, a, b, k, size):
    W, H = size
    aspect = W / H
    iw, ih = img.size
    cx, cy, z = (lerp(a[i], b[i], smooth(k)) for i in range(3))
    if iw / ih > aspect:
        ch = ih
        cw = ch * aspect
    else:
        cw = iw
        ch = cw / aspect
    cw, ch = cw / z, ch / z
    x0 = min(max(cx * iw - cw / 2, 0), iw - cw)
    y0 = min(max(cy * ih - ch / 2, 0), ih - ch)
    return img.resize(size, Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))


def vignette(size):
    W, H = size
    small = Image.new("L", (64, 64))
    px = small.load()
    for y in range(64):
        for x in range(64):
            dx, dy = (x - 31.5) / 31.5, (y - 31.5) / 31.5
            d = (dx * dx + dy * dy) ** 0.5
            px[x, y] = int(255 * smooth((d - 0.55) / 0.75) * 0.55)
    return small.resize(size, Image.BICUBIC)


def build_sequence(name, size, count, quality):
    out = os.path.join(MEDIA, "hero", name)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    sources = [Image.open(img_path(*s["src"])).convert("RGB") for s in SHOTS]
    green = Image.new("RGB", size, GREEN)
    vig = vignette(size)
    blur_max = size[0] / 110
    total = 0
    for i in range(count):
        p = i / (count - 1)
        frame = None
        for s, src in zip(SHOTS, sources):
            t0, t1 = s["t"]
            if not (t0 <= p <= t1):
                continue
            k = (p - t0) / (t1 - t0)
            layer = frame_of_shot(src, s["a"], s["b"], k, size)
            if frame is None:
                frame = layer
                continue
            # انتقال: اللقطة السابقة تذوب في ضبابية، والتالية تتضح تدريجيًا
            mix = smooth((p - t0) / (SHOTS[0]["t"][1] - SHOTS[1]["t"][0]))
            out_blur = frame.filter(ImageFilter.GaussianBlur(blur_max * mix))
            in_blur = layer.filter(ImageFilter.GaussianBlur(blur_max * (1 - mix)))
            frame = Image.blend(out_blur, in_blur, mix)
        if p < FADE_IN:
            # الإطار الأول يُظهر المباخر خافتة خلف العنوان، ثم تتضح
            frame = Image.blend(green, frame, 0.5 + 0.5 * smooth(p / FADE_IN))
        if p > FADE_OUT:
            frame = Image.blend(frame, green, smooth((p - FADE_OUT) / (1 - FADE_OUT)))
        frame = Image.composite(green, frame, vig)
        path = os.path.join(out, f"{i:03d}.webp")
        frame.save(path, "WEBP", quality=quality, method=5)
        total += os.path.getsize(path)
    manifest = {"count": count, "width": size[0], "height": size[1], "ext": "webp",
                "source": "صور المتجر الرسمية " + ", ".join("/".join(s["src"]) for s in SHOTS)}
    with open(os.path.join(out, "manifest.json"), "w", encoding="utf8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"seq   {name}: {count} frames, {total / 1e6:.1f} MB")


# ---------------------------------------------------------------- المنتجات

SELECTION = {
    "perfumes": ["1574729488", "765548647", "699589635", "1579430015"],
    "oud": ["1069583167", "1183796095", "1455876701", "1628684262", "567968617",
            "890425990", "1303750681", "693271276", "1916604951"],
    "oils": ["838230676", "2038105664", "1042858508", "844513955", "1272344271",
             "223401136", "2010171668", "868406002", "126224165"],
    "burners": ["1117352417", "416619431", "1891390176", "1331844156", "1974134306", "1765948923"],
    "incense": ["119104930", "1110325575"],
    "boxes": ["862720503", "1420213500", "1885928190", "1595301873"],
}

# صور المشاهد السينمائية (بدقة أعلى)
SCENES = [("838230676", "01"), ("2038105664", "01"), ("844513955", "01"),
          ("1117352417", "02"), ("416619431", "01"), ("416619431", "02"), ("416619431", "04"),
          ("1891390176", "01"), ("1331844156", "06"), ("1331844156", "01")]


def web_image(src, rel, max_side, quality=74):
    dst = os.path.join(MEDIA, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src)
    has_alpha = im.mode in ("RGBA", "LA", "P")
    im = im.convert("RGBA" if has_alpha else "RGB")
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst, "WEBP", quality=quality, method=5)
    return "/media/" + rel.replace(os.sep, "/"), im.size


def build_products():
    data = json.load(open(os.path.join(CATALOG, "products.json"), encoding="utf8"))
    by_id = {p["id"]: p for p in data["products"]}
    out = {"captured_at": data["meta"]["captured_at"], "source": data["meta"]["source"], "groups": {}}
    for group, ids in SELECTION.items():
        items = []
        for pid in ids:
            p = by_id[pid]
            imgs = []
            for rel in p["images"]:
                n = os.path.splitext(os.path.basename(rel))[0]
                url, size = web_image(os.path.join(CATALOG, rel), os.path.join("products", pid, n + ".webp"), 1100)
                imgs.append({"src": url, "w": size[0], "h": size[1]})
            options = []
            for o in p["options"]:
                options.append({"name": o["name"], "values": [
                    {"name": v["name"], "price": v.get("price"), "regular": v.get("regular_price")
                     if v.get("has_sale_price") else None, "out": v.get("is_out", False)} for v in o["values"]]})
            items.append({
                "id": pid, "name": p["name"], "category": p["listing_category"],
                "price": p["price"], "regular": p["regular_price"] if p["is_on_sale"] else None,
                "available": p["is_available"], "description": p["description"].strip(),
                "options": options, "images": imgs,
            })
        out["groups"][group] = items
    scenes = {}
    for pid, n in SCENES:
        url, size = web_image(img_path(pid, n), os.path.join("scenes", f"{pid}-{n}.webp"), 1800, 72)
        scenes[f"{pid}-{n}"] = {"src": url, "w": size[0], "h": size[1]}
    out["scenes"] = scenes
    dst = os.path.join(ROOT, "src", "data", "catalog.json")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, "w", encoding="utf8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("data  ok", sum(len(v) for v in out["groups"].values()), "products,", len(scenes), "scenes")


if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else "all"
    if only in ("all", "brand"):
        copy_brand()
    if only in ("all", "products"):
        build_products()
    if only in ("all", "seq"):
        build_sequence("desktop", (1280, 720), 160, 68)
        build_sequence("mobile", (720, 1280), 160, 66)
