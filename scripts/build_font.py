"""
岁时宋（Suishi Song）：本站自用的字体，只含站内用到的字。

    python scripts/build_font.py            生成 src/assets/fonts/suishi-song-*.woff2 和 fonts.css（按页面分包）
    python scripts/build_font.py --ttf DIR  另存一份 .ttf（预览用）

设计：以思源宋体（Noto Serif SC，OFL）为骨架，用脚本统一改造每一笔，取“铅字压印”的墨感：

  1. 骨架取得比目标字重细一档（正文用 300，粗体用 800）；
  2. 积墨：先把轮廓向外扩一圈再收回同样的量（形态学闭运算），笔画相交、转折的内角
     被填成小圆弧，像墨在交接处积起来；
  3. 晕开：再整体向外扩一小圈，所有外凸的角——宋体的三角饰脚、起笔收笔、点的尖——
     都变成同一半径的圆角，笔画略粗，横竖对比被拉近一点；
  4. 汉字字面横向收窄到 96%（字宽不变），字距略松，适合长段的诗和说明；
  5. 西文、数字取同一骨架、同样处理，所以全站只有这一个字族、两个字重。

只要站内文字改了，就重跑本脚本：它会重新扫描 src 下的文字，生成新的子集。
"""

from __future__ import annotations

import argparse
import io
import json
import re
from collections import defaultdict
import sys
from pathlib import Path

import pathops
from fontTools import subset
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.qu2cuPen import Qu2CuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
NM = ROOT / "node_modules" / "@fontsource" / "noto-serif-sc"
OUT_DIR = ROOT / "src" / "assets" / "fonts"
CHARS_JSON = ROOT / "scripts" / "font-chars.json"
FAMILY = "Suishi Song"

# 字重：(CSS 字重, 骨架字重, 晕开半径, 积墨半径, 文件名)
STYLES = [
    (400, 300, 7, 14, "suishi-song-400"),
    (900, 800, 10, 22, "suishi-song-900"),
]
CONIC_TOL = 1.0  # 圆弧转二次曲线的容差（字体单位）
CURVE_ERR = 2.0  # 输出时把一串短曲线重新拟合的容差：越大点越少、文件越小，2 单位在 1000 的字身里看不出
HAN_SQUEEZE = 0.96  # 汉字字面横向收窄

# ───────────────────────────── 站内用字 ─────────────────────────────


def site_chars() -> set[int]:
    files = list((ROOT / "src").rglob("*.ts")) + list((ROOT / "src").rglob("*.vue")) + [ROOT / "index.html"]
    text = ""
    for f in files:
        s = f.read_text(encoding="utf8")
        s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
        s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
        s = re.sub(r"(?m)^\s*//.*$", "", s)
        text += s
    cps = {ord(c) for c in text if ord(c) > 0x7F}
    cps |= set(range(0x20, 0x7F))  # 整段 ASCII：日期、数字、网址
    cps |= {0xA0, 0x2014, 0x2026, 0x3000, 0x3001, 0x3002, 0xFF0C, 0xFF1A, 0xFF1B, 0xFF01, 0xFF1F}
    cps -= {0xFEFF, 0x2060, 0x200B}
    return cps


# ───────────────────────────── 源字形 ─────────────────────────────


def slices_for(weight: int) -> list[tuple[Path, list[tuple[int, int]]]]:
    css = (NM / f"{weight}.css").read_text(encoding="utf8")
    out = []
    for block in re.findall(r"@font-face\s*\{[^}]*\}", css):
        url = re.search(r"url\(['\"]?\./files/([^)'\"]+\.woff2)", block)
        rng = re.search(r"unicode-range:\s*([^;}]+)", block)
        if not (url and rng and "normal" in url.group(1)):
            continue
        ranges = []
        for part in rng.group(1).split(","):
            part = part.strip().upper().removeprefix("U+")
            a, _, b = part.partition("-")
            ranges.append((int(a, 16), int(b or a, 16)))
        out.append((NM / "files" / url.group(1), ranges))
    return out


class Source:
    """按需打开思源宋体的切片，取某个字的字形和竖排替换字形"""

    def __init__(self, weight: int):
        self.slices = slices_for(weight)
        self.fonts: dict[Path, TTFont] = {}
        self.vert: dict[Path, dict[str, str]] = {}

    def _font(self, path: Path) -> TTFont:
        if path not in self.fonts:
            f = TTFont(path)
            self.fonts[path] = f
            m: dict[str, str] = {}
            if "GSUB" in f:
                gsub = f["GSUB"].table
                idx = {i for fr in gsub.FeatureList.FeatureRecord if fr.FeatureTag in ("vert", "vrt2") for i in fr.Feature.LookupListIndex}
                for i in sorted(idx):
                    for st in gsub.LookupList.Lookup[i].SubTable:
                        st = getattr(st, "ExtSubTable", st)
                        if hasattr(st, "mapping"):
                            m.update(st.mapping)
            self.vert[path] = m
        return self.fonts[path]

    def find(self, cp: int):
        for path, ranges in self.slices:
            if any(a <= cp <= b for a, b in ranges):
                f = self._font(path)
                g = f.getBestCmap().get(cp)
                if g:
                    return f, g, self.vert[path].get(g)
        return None


# ───────────────────────────── 改造 ─────────────────────────────


def to_path(glyphset, name: str, squeeze: float, adv: int) -> pathops.Path:
    p = pathops.Path()
    pen = p.getPen()
    if squeeze != 1:
        cx = adv / 2
        pen = TransformPen(pen, (squeeze, 0, 0, 1, cx * (1 - squeeze), 0))
    glyphset[name].draw(pen)
    return p


def _ring(p: pathops.Path, r: float) -> pathops.Path:
    ring = pathops.Path()
    p.draw(ring.getPen())
    ring.stroke(r * 2, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    ring.convertConicsToQuads(CONIC_TOL)
    return ring


def grow(p: pathops.Path, r: float) -> pathops.Path:
    out = pathops.op(p, _ring(p, r), pathops.PathOp.UNION, fix_winding=True, clockwise=False)
    out.convertConicsToQuads(CONIC_TOL)
    return out


def shrink(p: pathops.Path, r: float) -> pathops.Path:
    out = pathops.op(p, _ring(p, r), pathops.PathOp.DIFFERENCE, fix_winding=True, clockwise=False)
    out.convertConicsToQuads(CONIC_TOL)
    return out


def ink(p: pathops.Path, radius: float, pool: float = 0) -> pathops.Path:
    """
    pool：先晕开再收回同样的量（形态学“闭运算”），笔画相交的内角被填成圆弧，像墨在交接处积起来；
    radius：再整体晕开，外凸的角变圆、笔画加粗。
    """
    base = pathops.simplify(p, fix_winding=True, clockwise=False)
    if not list(base.segments):
        return base

    # Skia 的布尔运算偶尔会在个别字形上失败：把半径挪动一点点再试，仍不行就跳过这一步
    def safe(fn, q, r):
        for k in (1, 1.013, 0.987, 1.031):
            try:
                return fn(q, r * k)
            except pathops.PathOpsError:
                continue
        return q

    if pool > 0:
        grown = safe(grow, base, pool)
        if grown is not base:
            base = safe(shrink, grown, pool)
    if radius > 0:
        base = safe(grow, base, radius)
    return base


def to_glyph(p: pathops.Path):
    # 圆角是由许多段很短的二次曲线拼成的：先合并重拟合成三次曲线，再转回二次，点数少三成左右
    tt = TTGlyphPen(None)
    try:
        p.draw(Qu2CuPen(Cu2QuPen(tt, max_err=CURVE_ERR, reverse_direction=True), max_err=CURVE_ERR * 0.75, all_cubic=True))
    except NotImplementedError:  # 没有落在线上的点的闭合曲线（如句号的小圈）不能重拟合，原样输出
        tt = TTGlyphPen(None)
        p.draw(Cu2QuPen(tt, max_err=CURVE_ERR, reverse_direction=True))
    return tt.glyph(dropImpliedOnCurves=True)


def is_han(cp: int) -> bool:
    return 0x2E80 <= cp <= 0x9FFF or 0xF900 <= cp <= 0xFAFF or 0x20000 <= cp


def gname(cp: int) -> str:
    return f"uni{cp:04X}" if cp <= 0xFFFF else f"u{cp:05X}"


def build(cps: set[int], css_weight: int, src_weight: int, radius: float, pool: float, slug: str, ttf_dir: Path | None):
    src = Source(src_weight)
    order = [".notdef"]
    cmap: dict[int, str] = {}
    glyphs, hmtx, vmtx = {}, {}, {}
    vert_rules = []
    missing = []
    ref = None
    for cp in sorted(cps):
        hit = src.find(cp)
        if not hit:
            missing.append(chr(cp))
            continue
        f, g, valt = hit
        ref = ref or f
        gs = f.getGlyphSet()
        adv = f["hmtx"][g][0]
        vadv, vtsb = f["vmtx"][g] if "vmtx" in f else (1000, 0)
        squeeze = HAN_SQUEEZE if is_han(cp) else 1
        name = gname(cp)
        for nm, srcname in [(name, g)] + ([(name + ".vert", valt)] if valt else []):
            glyph = to_glyph(ink(to_path(gs, srcname, squeeze, adv), radius, pool))
            glyphs[nm] = glyph
            order.append(nm)
            glyph.recalcBounds(None) if hasattr(glyph, "coordinates") else None
            lsb = getattr(glyph, "xMin", 0)
            hmtx[nm] = (f["hmtx"][srcname][0], lsb)
            top = getattr(glyph, "yMax", 0)
            vmtx[nm] = (vadv, vtsb)
        cmap[cp] = name
        if valt:
            vert_rules.append(f"sub {name} by {name}.vert;")

    glyphs[".notdef"] = TTGlyphPen(None).glyph()
    hmtx[".notdef"] = (500, 0)
    vmtx[".notdef"] = (1000, 0)

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(hmtx)
    hh, os2 = ref["hhea"], ref["OS/2"]
    fb.setupHorizontalHeader(ascent=hh.ascent, descent=hh.descent, lineGap=hh.lineGap)
    fb.setupVerticalHeader(ascent=500, descent=-500)
    fb.setupVerticalMetrics(vmtx)
    style = "Regular" if css_weight == 400 else "Heavy"
    fb.setupNameTable({
        "copyright": "Copyright 2017 Adobe Systems Incorporated (Noto Serif SC). Modified for 岁时有色.",
        "familyName": FAMILY,
        "styleName": style,
        "uniqueFontIdentifier": f"SuishiSong-{style}",
        "fullName": f"{FAMILY} {style}",
        "psName": f"SuishiSong-{style}",
        "version": "Version 1.000",
        "licenseDescription": "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
        "licenseInfoURL": "https://openfontlicense.org",
    })
    fb.setupOS2(
        usWeightClass=css_weight,
        sTypoAscender=os2.sTypoAscender, sTypoDescender=os2.sTypoDescender, sTypoLineGap=os2.sTypoLineGap,
        usWinAscent=os2.usWinAscent, usWinDescent=os2.usWinDescent,
        fsType=0, achVendID="SSYS",
    )
    fb.setupPost()
    if vert_rules:
        fea = "languagesystem DFLT dflt;\nlanguagesystem hani dflt;\nfeature vert {\n" + "\n".join(vert_rules) + "\n} vert;\n"
        addOpenTypeFeaturesFromString(fb.font, fea)

    font = fb.font
    if ttf_dir:
        ttf_dir.mkdir(parents=True, exist_ok=True)
        font.save(ttf_dir / f"{slug}.ttf")
    buf = io.BytesIO()
    font.save(buf)
    return buf.getvalue(), len(cmap), missing


# ───────────────────────────── 分包 ─────────────────────────────


def plan_tiers(cps: set[int], weight: int, per_char: int, file_cost: int) -> dict[int, str]:
    """
    把一个字重的字分进几个文件（unicode-range 互不重叠，浏览器只下载页面上出现了字的那几个）。
    哪个字出现在哪些页面，取自 scripts/font-chars.json（浏览器里实测的扫描结果），
    分法沿用 subset_fonts.make_tiers_cluster：每天的首页都出现的字归 core（构建时预加载），
    其余按“出现在哪些页面”聚类，使全站总下载量最小。
    扫描里没见过的字（新加的文字）归 rest；ASCII 一律归 core。
    """
    import subset_fonts as sf

    scopes = json.loads(CHARS_JSON.read_text(encoding="utf8"))["scopes"]
    use: dict[int, set[str]] = defaultdict(set)
    for scope, by_face in scopes.items():
        for key, chars in by_face.items():
            w = int(float(key.rsplit("|", 2)[1]))
            if (900 if w >= 600 else 400) != weight:
                continue
            for ch in chars:
                if ord(ch) in cps:
                    use[ord(ch)].add(scope)
    face = sf.Face(FAMILY, weight, "normal", [])
    sf.EST_PER_CHAR[FAMILY] = per_char
    tiers = sf.make_tiers_cluster({face: use}, list(scopes), file_cost)[face]
    for cp in range(0x20, 0x7F):
        tiers[cp] = "core"
    for cp in cps - tiers.keys():
        tiers[cp] = "rest"
    return tiers


def subset_woff2(ttf: bytes, cps: set[int]) -> bytes:
    opts = subset.Options()
    opts.layout_features = ["vert", "vrt2"]
    opts.flavor = "woff2"
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = False
    font = TTFont(io.BytesIO(ttf))
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=cps)
    sub.subset(font)
    out = io.BytesIO()
    font.flavor = "woff2"
    font.save(out)
    return out.getvalue()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ttf", type=Path, help="另存 .ttf 到这个目录（预览用）")
    ap.add_argument("--out", type=Path, help="输出目录（默认 src/assets/fonts）")
    ap.add_argument("--chars", help="只生成这些字（试样用，不分包）")
    ap.add_argument("--file-cost", type=int, default=30000, help="分包时每多一个文件折算的字节数（越大文件越少）")
    args = ap.parse_args()

    global OUT_DIR
    if args.out:
        OUT_DIR = args.out
    cps = {ord(c) for c in args.chars} if args.chars else site_chars()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.woff2"):
        old.unlink()
    from subset_fonts import css_ranges

    css = ["/* 由 scripts/build_font.py 生成，不要手改 */"]
    for css_weight, src_weight, radius, pool, slug in STYLES:
        ttf, n, missing = build(cps, css_weight, src_weight, radius, pool, slug, args.ttf)
        have = set(TTFont(io.BytesIO(ttf)).getBestCmap())
        per_char = len(subset_woff2(ttf, have)) // max(1, len(have))
        print(f"{slug}: {n} 字，整套 {per_char * len(have) / 1024:.0f} KB")
        if missing:
            print("  思源宋体里没有、交给系统字体的字：", "".join(missing))
        tiers = plan_tiers(have, css_weight, per_char, args.file_cost) if not args.chars else {cp: "all" for cp in have}
        groups: dict[str, set[int]] = defaultdict(set)
        for cp, t in tiers.items():
            groups[t].add(cp)
        rank = {"core": 0, "rest": 99}
        for t in sorted(groups, key=lambda t: (rank.get(t, 1), t)):
            data = subset_woff2(ttf, groups[t])
            name = f"{slug}-{t}.woff2"
            (OUT_DIR / name).write_bytes(data)
            print(f"  {name:36} {len(groups[t]):5} 字 {len(data) / 1024:6.1f} KB")
            css += [
                "@font-face {",
                f"  font-family: '{FAMILY}';",
                "  font-style: normal;",
                f"  font-weight: {css_weight};",
                "  font-display: swap;",
                f"  src: url('./{name}') format('woff2');",
                f"  unicode-range: {css_ranges(groups[t])};",
                "}",
            ]
    (OUT_DIR / "fonts.css").write_text(chr(10).join(css) + chr(10), encoding="utf8")


if __name__ == "__main__":
    sys.exit(main())
