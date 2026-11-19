"""由 public/album/*_web.jpg 生成首页笺面用的小图 public/album/thumb/*.webp（高 480px，不放大）。

用法：npm run thumbs   （需要 Pillow）
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "album"
OUT = SRC / "thumb"
H = 480

OUT.mkdir(exist_ok=True)
total_in = total_out = 0
for f in sorted(SRC.glob("*_web.jpg")):
    im = Image.open(f).convert("RGB")
    if im.height > H:
        im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    dst = OUT / (f.name.removesuffix("_web.jpg") + ".webp")
    im.save(dst, "WEBP", quality=78, method=6)
    total_in += f.stat().st_size
    total_out += dst.stat().st_size
    print(f"{dst.name:24} {im.size[0]}x{im.size[1]}  {dst.stat().st_size // 1024} KB")
print(f"原图 {total_in // 1024} KB -> 缩略图 {total_out // 1024} KB")
