"""
يحوّل أي فيديو رسمي تزوّده إلى تسلسل إطارات للمشهد الافتتاحي (يستبدل الإطارات الحالية).

الاستخدام من مجلد المشروع:
  npm run frames -- "C:/path/to/video.mp4"
  npm run frames -- "C:/path/to/video.mp4" --count 180

يُنتج نسختين: desktop (1280x720) وmobile (720x1280، قصّ من الوسط)، بصيغة WebP،
مع manifest.json يقرؤه الموقع تلقائيًا. الفيديو الأصلي لا يُعدّل.
يستخدم ffmpeg المضمّن في حزمة imageio-ffmpeg.
"""
import argparse
import json
import os
import subprocess
import sys

import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = imageio_ffmpeg.get_ffmpeg_exe()


def duration(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True, encoding="utf8", errors="ignore").stderr
    for line in out.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError("تعذر قراءة مدة الفيديو")


def extract(src, name, w, h, count, quality):
    out = os.path.join(ROOT, "public", "media", "hero", name)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    fps = count / duration(src)
    vf = f"fps={fps:.5f},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-vf", vf,
                    "-frames:v", str(count), "-c:v", "libwebp", "-quality", str(quality),
                    "-start_number", "0", os.path.join(out, "%03d.webp")], check=True)
    n = len([f for f in os.listdir(out) if f.endswith(".webp")])
    with open(os.path.join(out, "manifest.json"), "w", encoding="utf8") as f:
        json.dump({"count": n, "width": w, "height": h, "ext": "webp", "source": os.path.basename(src)},
                  f, ensure_ascii=False, indent=2)
    size = sum(os.path.getsize(os.path.join(out, x)) for x in os.listdir(out)) / 1e6
    print(f"{name}: {n} frames, {size:.1f} MB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--count", type=int, default=160)
    a = ap.parse_args()
    if not os.path.isfile(a.video):
        sys.exit("الملف غير موجود: " + a.video)
    extract(a.video, "desktop", 1280, 720, a.count, 70)
    extract(a.video, "mobile", 720, 1280, a.count, 68)
