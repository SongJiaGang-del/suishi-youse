"""画里寻色：在画中“主体”（花、叶、果、雪……）上找最接近节气色的一处。

和以前不同：不再在整幅画上找最近的像素（那样常常落在泛黄的绢和纸上），
而是先把每幅画里的主体框出来（SUBJECTS，坐标为画面百分比），
再把“底子”剔掉——底子取整幅画的中位色，与它的 CIEDE2000 色差不足 GROUND_DE 的像素都不算主体——
最后在主体像素占满的小窗口里取平均色，与节气色比 CIEDE2000，取最接近的一处。
水墨画里的雪是留白（allow_ground），这几幅不剔底子。

用法：python scripts/pick_subject.py [--debug 输出目录]   （需要 Pillow、numpy、scikit-image）
输出每个节气的 x、y、hex、de 和主体名，贴进 src/data/paintings.ts。
"""
import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from skimage.color import deltaE_ciede2000, lab2rgb, rgb2lab

ROOT = Path(__file__).resolve().parent.parent
W = 300  # 缩到 300 像素宽再找
GROUND_DE = 9.0  # 与底子色差小于这个数的像素不算主体
FILL = 0.85  # 窗口里主体像素要占到这个比例

# 每个节气：藏品号，几个候选主体（名称，框 [x0,y0,x1,y1]，百分比），窗口边长（占画宽的百分比）
# allow_ground：留白本身就是主体（水墨雪景）
SUBJECTS = {
    1: ("1955.302.4", 2.0, False, [("山坡新绿", [[20, 3, 48, 26]])]),
    2: ("1952.285", 2.0, False, [("汀洲草木", [[40, 78, 100, 98]])]),
    3: ("1967.193.f", 2.0, False, [("蔷薇花瓣", [[13, 10, 47, 52], [66, 28, 87, 66]])]),
    4: ("1974.31", 2.0, False, [("垂柳枝叶", [[2, 0, 25, 32]])]),
    5: ("1975.22.2", 2.0, False, [("雨后远山", [[0, 36, 45, 50]])]),
    6: ("1967.193.e", 2.0, False, [("牡丹叶", [[68, 10, 98, 95]]), ("牡丹花瓣", [[8, 40, 30, 62], [22, 62, 45, 86], [55, 32, 72, 58]])]),
    7: ("1986.49.5", 2.0, False, [("垂柳枝叶", [[22, 42, 52, 68], [40, 62, 75, 92]])]),
    8: ("1967.193.d", 1.6, False, [("石竹花瓣", [[14, 28, 45, 62], [52, 32, 75, 72], [66, 8, 82, 30], [8, 50, 27, 70]])]),
    9: ("1999.6", 2.0, False, [("枇杷果", [[20, 28, 52, 60], [0, 38, 20, 68], [35, 0, 62, 16]])]),
    10: ("1915.116", 1.6, False, [("石榴花", [[30, 38, 45, 50], [62, 28, 100, 42], [58, 58, 95, 70], [45, 15, 70, 25]])]),
    11: ("1967.193.c", 1.6, False, [("锦葵花瓣", [[8, 32, 25, 50], [40, 10, 60, 28], [60, 8, 76, 28], [63, 30, 82, 48]])]),
    12: ("1970.76", 1.6, False, [("树叶", [[65, 38, 100, 62], [88, 70, 100, 85]])]),
    13: ("1975.22.6", 2.0, False, [("柳叶", [[0, 0, 40, 90], [60, 0, 95, 45]])]),
    14: ("1975.22.7", 2.0, False, [("稻叶", [[5, 5, 45, 55], [25, 48, 92, 88]])]),
    15: ("1999.260.f", 2.0, False, [("芦荡水面", [[0, 68, 100, 98]])]),
    16: ("1997.100", 1.6, False, [("桂花", [[0, 0, 85, 100]])]),
    17: ("1967.193.g", 1.6, False, [("蓝花", [[3, 8, 18, 18], [36, 32, 55, 55], [60, 15, 72, 35], [68, 55, 80, 75], [88, 50, 95, 60]])]),
    18: ("1972.42", 2.0, False, [("经霜的红叶", [[12, 58, 75, 82], [0, 38, 40, 60], [78, 50, 100, 70]])]),
    19: ("1997.102", 2.0, False, [("老树枝叶", [[50, 18, 80, 45]])]),
    20: ("1955.37.11", 3.0, True, [("留白的雪地", [[38, 42, 64, 62]])]),
    21: ("1975.22.10", 1.6, False, [("压在竹叶上的雪", [[12, 5, 70, 30]]), ("白鹭", [[28, 52, 42, 72], [46, 50, 60, 72]])]),
    22: ("1974.26", 2.0, False, [("墨梅枝干", [[40, 40, 85, 95]])]),
    23: ("1967.193.j", 1.6, False, [("梅花花瓣", [[20, 12, 48, 48], [52, 35, 100, 72]])]),
    24: ("1975.22.9", 1.4, False, [("寒鸦羽毛", [[38, 18, 56, 40], [52, 5, 72, 22], [15, 10, 30, 22], [22, 28, 30, 36]])]),
}


def term_colors():
    src = (ROOT / "src" / "data" / "terms.ts").read_text(encoding="utf8")
    return re.findall(r"'#([0-9A-Fa-f]{6})', '[^']*', \[", src)


def lab_of_hex(h):
    rgb = np.array([[[int(h[i : i + 2], 16) for i in (0, 2, 4)]]], dtype=float) / 255
    return rgb2lab(rgb)[0, 0]


def pick(term, hexes, debug):
    acc, win_pct, allow_ground, subjects = SUBJECTS[term]
    im = Image.open(ROOT / "public" / "album" / f"{acc}_web.jpg").convert("RGB")
    H = round(im.height * W / im.width)
    im = im.resize((W, H), Image.LANCZOS)
    rgb = np.asarray(im, dtype=float) / 255
    lab = rgb2lab(rgb)
    target = lab_of_hex(hexes[term - 1])

    ground = np.median(lab.reshape(-1, 3), axis=0)
    de_ground = deltaE_ciede2000(lab, np.broadcast_to(ground, lab.shape))
    is_subject = np.ones((H, W), bool) if allow_ground else de_ground >= GROUND_DE
    de_target = deltaE_ciede2000(lab, np.broadcast_to(target, lab.shape))

    win = max(3, round(W * win_pct / 100))
    half = win // 2
    best = None
    for label, boxes in subjects:
        for x0, y0, x1, y1 in boxes:
            for cy in range(max(half, round(H * y0 / 100)), min(H - half, round(H * y1 / 100)) + 1):
                for cx in range(max(half, round(W * x0 / 100)), min(W - half, round(W * x1 / 100)) + 1):
                    sl = (slice(cy - half, cy - half + win), slice(cx - half, cx - half + win))
                    if is_subject[sl].mean() < FILL:
                        continue
                    m = lab[sl].reshape(-1, 3).mean(axis=0)
                    d = float(deltaE_ciede2000(m[None, None], target[None, None])[0, 0])
                    if best is None or d < best[0]:
                        best = (d, cx, cy, label, rgb[sl].reshape(-1, 3).mean(axis=0))
    if best is None:
        raise SystemExit(f"{term}: 框里找不到主体像素")
    d, cx, cy, label, c = best
    hx = "#" + "".join(f"{round(v * 255):02X}" for v in c)
    if debug:
        d_im = im.copy()
        dr = ImageDraw.Draw(d_im)
        for _, boxes in subjects:
            for x0, y0, x1, y1 in boxes:
                dr.rectangle([W * x0 / 100, H * y0 / 100, W * x1 / 100, H * y1 / 100], outline=(255, 0, 255))
        dr.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], outline=(255, 255, 0), width=2)
        d_im.save(Path(debug) / f"{term:02d}.png")
    return {
        "term": term,
        "subject": label,
        "x": round(cx / W * 100, 1),
        "y": round(cy / H * 100, 1),
        "hex": hx,
        "de": round(d, 1),
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--debug")
    a = ap.parse_args()
    if a.debug:
        Path(a.debug).mkdir(parents=True, exist_ok=True)
    hexes = ["#" + h for h in term_colors()]
    hexes = [h[1:] for h in hexes]
    out = [pick(t, hexes, a.debug) for t in sorted(SUBJECTS)]
    print(json.dumps(out, ensure_ascii=False, indent=1))
