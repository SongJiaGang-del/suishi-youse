#!/usr/bin/env python3
"""

注意：现在站点字体由 scripts/build_font.py 生成（自制“岁时宋”），本脚本的 main() 已不再使用；
build_font.py 只借用这里的分包算法 make_tiers_cluster、css_ranges 等函数。
构建期裁字：把网页字体裁成只剩站点实际用到的字，再按页面分包。

为什么要做
  @fontsource 与 lxgw-wenkai-webfont 带的是“按 unicode-range 切好的整套中文字体”：每个字重几十到上百个小文件。
  浏览器只下载页面上出现了字的那几片，但中文用字分散，首页仍要拉到约 70 个文件、2.3 MB。
  这里反过来：先由 src/dev/fontScan.ts 在浏览器里量出每个字体实际渲染过哪些字（scripts/font-chars.json），
  再把原字体里这些字抠出来，合并成每个字重、每个“分包”一个文件，unicode-range 精确到字。

输入
  scripts/font-chars.json      字符扫描结果（`npm run dev` 后，在页面控制台运行 `await __scanFonts()` 生成）
  node_modules 里的字体包       只当“字体源文件”读，最终页面不会引用它们

输出（生成物，随仓库提交；构建时不需要 Python）
  src/assets/fonts/*.woff2     裁好的字体
  src/assets/fonts/fonts.css   对应的 @font-face，main.ts 引入它
  scripts/font-report.txt      每个分包多大，以及每类页面实际会下载多少

依赖：Python 3.9+，`pip install fonttools brotli`

用法
  python scripts/subset_fonts.py            生成
  python scripts/subset_fonts.py --plan     只比较几种分包方案（用估算体积），不写文件

分包规则（同一个字在同一个字体里只属于一个分包，分包的 unicode-range 互不重叠）
  默认按“页面集合聚类”（make_tiers_cluster）：每个字出现在哪些页面，集合相同的先归一类，再按全站总下载量合并。
  core     每天的首页都会出现的字（页头页脚、轮盘、目录……）以及数字 0–9；构建时给它们加 preload
  home-N / page-N / mix-N   只在首页 / 只在节气页 / 几类页面共用
  hover / palette / about   只在悬停与界面、色谱页、关于页
  --legacy 切回旧的按节气分组（home-N、page-N、home-x、page-x、misc）
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import logging
import re
import statistics
import sys
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

from fontTools import merge, subset
from fontTools.ttLib import TTFont

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
logging.getLogger("fontTools").setLevel(logging.ERROR)

ROOT = Path(__file__).resolve().parent.parent
NM = ROOT / "node_modules"
CHARS_JSON = ROOT / "scripts" / "font-chars.json"
TERMS_TS = ROOT / "src" / "data" / "terms.ts"
OUT_DIR = ROOT / "src" / "assets" / "fonts"
REPORT = ROOT / "scripts" / "font-report.txt"
CACHE_DIR = NM / ".cache" / "suishi-fonts"
SCRIPT_VERSION = "2"  # 改了裁剪参数就加一，让缓存失效

# (CSS 里的 font-family, 字重, 字形, 字体包里的 @font-face CSS)
SOURCES = [
    # 网页字体只留“展示字”：题头、标题用的宋体 600/900，和西文数字用的 EB Garamond。
    # 正文、诗、楷体、黑体全部交给系统字体（见 base.css 的字体栈），不再下载。
    ("Noto Serif SC", 600, "normal", "@fontsource/noto-serif-sc/600.css"),
    ("Noto Serif SC", 900, "normal", "@fontsource/noto-serif-sc/900.css"),
    ("EB Garamond", 400, "normal", "@fontsource/eb-garamond/400.css"),
    ("EB Garamond", 400, "italic", "@fontsource/eb-garamond/400-italic.css"),
]

# 日期会变，数字就会变：扫描只可能见过其中一部分。凡是渲染过数字的字体，0–9 一律补全进 core
DIGITS = set(map(ord, "0123456789"))

# 只用在“方案比较”里的体积估算（每个字大约多少字节），真正生成时用实际体积
EST_PER_CHAR = {"Noto Sans SC": 125, "Noto Serif SC": 160, "LXGW WenKai": 200, "EB Garamond": 450}
EST_OVERHEAD = 2000
# 一个字体全部用字的估算体积不到这个数，就不分包，整个放一个文件
SMALL_FACE = 24_000


# ───────────────────────────── 读字体源 ─────────────────────────────


def parse_ranges(text: str) -> list[tuple[int, int]]:
    out = []
    for part in text.split(","):
        m = re.match(r"\s*U\+([0-9a-fA-F?]+)(?:-([0-9a-fA-F]+))?", part)
        if not m:
            continue
        lo = m.group(1)
        if "?" in lo:
            out.append((int(lo.replace("?", "0"), 16), int(lo.replace("?", "F"), 16)))
        else:
            a = int(lo, 16)
            out.append((a, int(m.group(2), 16) if m.group(2) else a))
    return out


@dataclass(eq=False)
class Slice:
    file: Path
    ranges: list[tuple[int, int]]
    cmap: frozenset[int] = frozenset()

    def wants(self, cps: set[int]) -> bool:
        return any(a <= cp <= b for cp in cps for a, b in self.ranges)

    def covers(self, cp: int) -> bool:
        return cp in self.cmap and any(a <= cp <= b for a, b in self.ranges)


@dataclass(eq=False)
class Face:
    family: str
    weight: int
    style: str
    slices: list[Slice]
    coverage: frozenset[int] = frozenset()

    @property
    def key(self) -> str:
        return f"{self.family}|{self.weight}|{self.style}"

    @property
    def slug(self) -> str:
        base = re.sub(r"[^a-z0-9]+", "-", self.family.lower()).strip("-")
        return f"{base}-{self.weight}{'-italic' if self.style == 'italic' else ''}"


def read_slices(css_path: Path) -> list[Slice]:
    text = css_path.read_text(encoding="utf8")
    out = []
    for block in re.findall(r"@font-face\s*\{[^}]*\}", text):
        url = re.search(r"url\(['\"]?([^)'\"]+\.woff2)", block)
        rng = re.search(r"unicode-range:\s*([^;}]+)", block)
        if url and rng:
            out.append(Slice((css_path.parent / url.group(1)).resolve(), parse_ranges(rng.group(1))))
    return out


def load_faces(needed: set[int]) -> dict[tuple[str, int, str], Face]:
    """
    读每个字体源的切片。只打开 unicode-range 里有用到的字的切片，取它们的 cmap
    （woff2 解压不快，所以结果按文件缓存在 node_modules/.cache 下）。
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / "cmaps.json"
    cache: dict[str, list[int]] = json.loads(cache_file.read_text(encoding="utf8")) if cache_file.exists() else {}
    dirty = False
    faces = {}
    for family, weight, style, css in SOURCES:
        css_path = NM / css
        if not css_path.exists():
            sys.exit(f"找不到字体源 {css_path}，先运行 npm install")
        slices = read_slices(css_path)
        if not slices:
            sys.exit(f"{css_path} 里没有解析出 woff2 切片")
        for s in slices:
            if not s.wants(needed):
                continue
            stamp = f"{s.file.relative_to(NM).as_posix()}:{s.file.stat().st_size}"
            if stamp not in cache:
                font = TTFont(s.file, lazy=True)
                cache[stamp] = sorted(font.getBestCmap().keys())
                font.close()
                dirty = True
            s.cmap = frozenset(cache[stamp])
        face = Face(family, weight, style, slices)
        face.coverage = frozenset(cp for s in slices for cp in s.cmap if any(a <= cp <= b for a, b in s.ranges))
        faces[(family, weight, style)] = face
    if dirty:
        cache_file.write_text(json.dumps(cache), encoding="utf8")
    return faces


# ───────────────────────────── 浏览器怎么挑字体 ─────────────────────────────


def split_stack(css_family: str) -> list[str]:
    out, cur, quote = [], "", ""
    for ch in css_family:
        if quote:
            if ch == quote:
                quote = ""
            else:
                cur += ch
        elif ch in "\"'":
            quote = ch
        elif ch == ",":
            out.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def match_weight(available: list[int], want: int) -> int:
    """CSS Fonts 4 的字重匹配：有就用，没有就按方向找最近的"""
    if want in available:
        return want
    below = sorted((w for w in available if w < want), reverse=True)
    above = sorted(w for w in available if w > want)
    if want < 400:
        order = below + above
    elif want > 500:
        order = above + below
    else:  # 400–500：先找不超过 500 的更重字重，再往轻找，最后更重
        order = [w for w in above if w <= 500] + below + [w for w in above if w > 500]
    return order[0]


def resolve_face(faces: dict[tuple[str, int, str], Face], family: str, weight: int, style: str) -> Face | None:
    mine = [f for f in faces.values() if f.family == family]
    if not mine:
        return None
    same_style = [f for f in mine if f.style == style] or mine
    w = match_weight(sorted({f.weight for f in same_style}), weight)
    return next(f for f in same_style if f.weight == w)


# ───────────────────────────── 读扫描结果 ─────────────────────────────


def load_scan() -> dict:
    if not CHARS_JSON.exists():
        sys.exit("没有 scripts/font-chars.json：先运行 `npm run dev`，在页面控制台执行 `await __scanFonts()`")
    return restrict_scan(json.loads(CHARS_JSON.read_text(encoding="utf8")))


def display_chars() -> set[str]:
    """节气名和色名：每个节气页的大字，全站固定的 48 个词，必须有网页字体"""
    src = TERMS_TS.read_text(encoding="utf8")
    out: set[str] = set()
    for m in re.finditer(r"^\s*\['([^']+)', '[^']*', \d+, \d+, '[^']*', '([^']+)'", src, re.M):
        out |= set(m.group(1)) | set(m.group(2))
    return out


def restrict_scan(data: dict) -> dict:
    """把扫描结果收窄到“展示字”方案：
    宋体 600/900 只留首页、界面、悬停、色谱、关于页上出现过的字，加上全部节气名和色名；
    节气页自己的诗、习俗、说明（体量最大、各页互不相同）不再走网页字体；
    EB Garamond 只留西文和数字；其余字体栈（黑体、楷体、宋体 400）一概不要。"""
    show = display_chars()
    shared: set[str] = set()
    for scope, by_face in data["scopes"].items():
        if scope.split(":")[0] == "term":
            continue
        for key, chars in by_face.items():
            if key.rsplit("|", 2)[0].lstrip("\"'").startswith("Noto Serif SC"):
                shared |= set(chars)
    allow = shared | show
    scopes: dict = {}
    for scope, by_face in data["scopes"].items():
        kept: dict = {}
        for key, chars in by_face.items():
            css_family, weight, _style = key.rsplit("|", 2)
            first = split_stack(css_family)[0]
            w = int(float(weight))
            if first == "Noto Serif SC" and w in (600, 900):
                chars = "".join(ch for ch in chars if ch in allow)
            elif first == "EB Garamond" and w == 400:
                chars = "".join(ch for ch in chars if ord(ch) < 0x2000)
            else:
                continue
            if chars:
                kept[key] = chars
        scopes[scope] = kept
    return {**data, "scopes": scopes}


def needed_chars(data: dict) -> set[int]:
    return {ord(ch) for by_face in data["scopes"].values() for chars in by_face.values() for ch in chars}


def build_usage(data: dict, faces: dict[tuple[str, int, str], Face]):
    """usage[face][码点] = 用到它的范围集合；system[CSS 字体栈] = 没有任何网页字体能显示的字（交给系统字体）"""
    usage: dict[Face, dict[int, set[str]]] = defaultdict(lambda: defaultdict(set))
    system: dict[str, set[int]] = defaultdict(set)
    for scope, by_face in data["scopes"].items():
        for key, chars in by_face.items():
            css_family, weight, style = key.rsplit("|", 2)
            stack = split_stack(css_family)
            for ch in chars:
                cp = ord(ch)
                for fam in stack:
                    face = resolve_face(faces, fam, int(float(weight)), style)
                    if face and cp in face.coverage:
                        usage[face][cp].add(scope)
                        break
                else:
                    system[css_family].add(cp)
    # 带数字的字体把 0–9 补全
    for face, use in usage.items():
        if any(cp in DIGITS for cp in use):
            for cp in DIGITS & face.coverage:
                use.setdefault(cp, set())
    return usage, system


def slug_of(pinyin: str) -> str:
    return re.sub(r"[^a-z]", "", unicodedata.normalize("NFD", pinyin))


def term_order() -> dict[str, int]:
    """节气页的网址名 → 1–24，顺序和写法与 src/data/terms.ts 一致"""
    text = TERMS_TS.read_text(encoding="utf8")
    rows = re.findall(r"^\s*\['([^']+)', '([^']+)', \d+, \d+,", text, re.M)
    if len(rows) != 24:
        sys.exit(f"从 terms.ts 里读到 {len(rows)} 个节气，应为 24；解析规则需要跟着改")
    return {slug_of(py): i + 1 for i, (_, py) in enumerate(rows)}


# ───────────────────────────── 分包 ─────────────────────────────


@dataclass
class Params:
    home_group: int  # 首页“当天专属”的字，每几个节气归一包
    page_group: int  # 节气页专属的字，每几个节气归一包


class Scoper:
    def __init__(self, p: Params, terms: dict[str, int]):
        self.p, self.terms = p, terms

    def label(self, scope: str) -> str:
        kind, _, rest = scope.partition(":")
        if kind == "home":
            return f"h{(int(rest) - 1) // self.p.home_group}"
        if kind == "term":
            return f"t{(self.terms[rest] - 1) // self.p.page_group}"
        if kind in ("hover", "ui"):
            return "v"
        return {"palette": "p", "about": "a"}.get(kind, "x")


def tier_of(cp: int, scopes: set[str], sc: Scoper, n_home: int) -> str:
    if cp in DIGITS:
        return "core"
    homes = [s for s in scopes if s.startswith("home:")]
    if len(homes) == n_home:
        return "core"
    if homes:
        groups = {sc.label(s) for s in homes}
        return f"home-{next(iter(groups))[1:]}" if len(groups) == 1 else "home-x"
    labels = {sc.label(s) for s in scopes}
    if "v" in labels:
        return "hover"
    ts = {lb for lb in labels if lb[0] == "t"}
    if ts:
        return f"page-{next(iter(ts))[1:]}" if labels == ts and len(ts) == 1 else "page-x"
    if labels == {"p"}:
        return "palette"
    if labels == {"a"}:
        return "about"
    return "misc"


def est_bytes(face: Face, n: int) -> int:
    return EST_OVERHEAD + n * EST_PER_CHAR[face.family]


def make_tiers(usage, sc: Scoper, n_home: int) -> dict[Face, dict[int, str]]:
    out: dict[Face, dict[int, str]] = {}
    for face, use in usage.items():
        if est_bytes(face, len(use)) <= SMALL_FACE:
            out[face] = {cp: "all" for cp in use}
        else:
            out[face] = {cp: tier_of(cp, scopes, sc, n_home) for cp, scopes in use.items()}
    return out


HOVER_WEIGHT = 0.5  # 悬停/弹层里才出现的页面，权重比整页低
HOME_WEIGHT = 3.0  # 首页是入口，访问量远大于单个节气页；24 个“某天的首页”每个按这个权重算


def make_tiers_cluster(usage, all_scopes: list[str], file_cost: int) -> dict[Face, dict[int, str]]:
    """
    按“每个字出现在哪些页面”聚类分包（取代按节气分组的做法）。

    每个字有一个“页面集合”（首页的每一天、24 个节气页、色谱、关于，以及悬停/界面）。
    页面集合相同的字先放一类；然后反复合并“合并后全站总下载量增加最少”的两类，
    直到再合并只会让总量变大为止。总量 = 每个页面要下载的所有文件的（文件固定开销 + 字数 × 单字体积）之和，
    其中文件固定开销 = EST_OVERHEAD + file_cost（file_cost 折算每多一个请求的代价）。
    每天的首页都出现的字固定归 core（预加载用）；数字 0–9 一律进 core。
    """
    import heapq

    bit = {s: 1 << i for i, s in enumerate(all_scopes)}
    soft = [s for s in all_scopes if s.startswith("hover:") or s == "ui"]
    soft_mask = sum(bit[s] for s in soft)
    main_all = sum(bit[s] for s in all_scopes if s not in soft)
    home_mask = sum(bit[s] for s in all_scopes if s.startswith("home:"))

    def pw(mask: int) -> float:
        return (
            (mask & main_all & ~home_mask).bit_count()
            + HOME_WEIGHT * (mask & home_mask).bit_count()
            + HOVER_WEIGHT * (mask & soft_mask).bit_count()
        )

    out: dict[Face, dict[int, str]] = {}
    for face, use in usage.items():
        if est_bytes(face, len(use)) <= SMALL_FACE:
            out[face] = {cp: "all" for cp in use}
            continue
        per_char = EST_PER_CHAR[face.family]
        fixed = EST_OVERHEAD + file_cost
        groups: dict[int, list[int]] = defaultdict(list)
        for cp, scopes in use.items():
            m = main_all if cp in DIGITS else sum(bit[s] for s in scopes)
            groups[m].append(cp)
        # core = 每天的首页都出现的字（含数字）。每个页面几乎都会用到它们，构建时给它们加 preload
        core_cps = [cp for m in [m for m in groups if m & home_mask == home_mask] for cp in groups.pop(m)]
        classes: dict[int, tuple[int, list[int]]] = {i: (m, cps) for i, (m, cps) in enumerate(groups.items())}

        def delta(a, b):
            ma, ca = classes[a]
            mb, cb = classes[b]
            return (
                pw(ma | mb) * (fixed + (len(ca) + len(cb)) * per_char)
                - pw(ma) * (fixed + len(ca) * per_char)
                - pw(mb) * (fixed + len(cb) * per_char)
            )

        ver = {i: 0 for i in classes}
        heap = [(delta(a, b), a, b, 0, 0) for a in classes for b in classes if a < b]
        heapq.heapify(heap)
        nxt = len(classes)
        while heap:
            d, a, b, va, vb = heapq.heappop(heap)
            if a not in classes or b not in classes or ver[a] != va or ver[b] != vb:
                continue
            if d >= 0:
                break
            ma, ca = classes.pop(a)
            mb, cb = classes.pop(b)
            ver.pop(a)
            ver.pop(b)
            classes[nxt] = (ma | mb, ca + cb)
            ver[nxt] = 0
            for o in classes:
                if o != nxt:
                    heapq.heappush(heap, (delta(o, nxt), o, nxt, ver[o], 0))
            nxt += 1

        names: dict[int, str] = {}
        kinds: dict[str, int] = defaultdict(int)
        homes = sum(bit[s] for s in all_scopes if s.startswith("home:"))
        terms = sum(bit[s] for s in all_scopes if s.startswith("term:"))
        for i, (m, cps) in sorted(classes.items(), key=lambda kv: -len(kv[1][1])):
            m_main = m & main_all
            if not m_main:
                kind = "hover"
            elif m_main == bit.get("palette", 0):
                kind = "palette"
            elif m_main == bit.get("about", 0):
                kind = "about"
            elif m_main & ~homes == 0:
                kind = "home"
            elif m_main & ~terms == 0:
                kind = "page"
            else:
                kind = "mix"
            kinds[kind] += 1
            names[i] = kind if kind in ("hover", "palette", "about") and kinds[kind] == 1 else f"{kind}-{kinds[kind] - 1}"
        tmap = {cp: "core" for cp in core_cps}
        for i, (m, cps) in classes.items():
            for cp in cps:
                tmap[cp] = names[i]
        out[face] = tmap
    return out


def scenario_costs(usage, tiers, size_of, n_home: int):
    """每一类页面会下载哪些分包、共多少字节。浏览器按页面上出现的字下载，所以这里按范围反推"""
    need: dict[str, set[tuple[Face, str]]] = defaultdict(set)
    for face, use in usage.items():
        for cp, scopes in use.items():
            for s in scopes:
                need[s].add((face, tiers[face][cp]))

    def cost(names: list[str]) -> int:
        packs: set[tuple[Face, str]] = set()
        for n in names:
            packs |= need.get(n, set())
        return sum(size_of(f, t) for f, t in packs)

    interactive = [s for s in need if s.startswith("hover:") or s == "ui"]
    homes = [cost([f"home:{k}"]) for k in range(1, n_home + 1) if f"home:{k}" in need]
    homes_all = [cost([f"home:{k}", *interactive]) for k in range(1, n_home + 1) if f"home:{k}" in need]
    terms = [cost([s]) for s in need if s.startswith("term:")]
    return {
        "home": homes,
        "home_all": homes_all,
        "terms": terms,
        "palette": cost(["palette"]),
        "about": cost(["about"]),
        "site": sum(size_of(f, t) for f, t in {pair for s in need.values() for pair in s}),
    }


def fmt_kb(n: float) -> str:
    return f"{n / 1024:.0f}"


def scenario_line(c: dict) -> str:
    h, ha, t = c["home"], c["home_all"], c["terms"]
    return (
        f"首页 {fmt_kb(min(h))}/{fmt_kb(statistics.median(h))}/{fmt_kb(max(h))}"
        f"  悬停全部+菜单 最多{fmt_kb(max(ha))}"
        f"  节气页 {fmt_kb(min(t))}/{fmt_kb(statistics.median(t))}/{fmt_kb(max(t))}"
        f"  色谱 {fmt_kb(c['palette'])}  关于 {fmt_kb(c['about'])}  全站 {fmt_kb(c['site'])}   (KB)"
    )


# ───────────────────────────── 裁剪 ─────────────────────────────


def subset_tier(face: Face, chars: set[int]) -> bytes:
    parts = []
    remaining = set(chars)
    for s in face.slices:
        want = {cp for cp in remaining if s.covers(cp)}
        if not want:
            continue
        remaining -= want
        font = TTFont(s.file)
        opts = subset.Options()
        opts.layout_features = ["*"]  # 竖排标点靠 GSUB 的 vert，别丢
        opts.hinting = False
        opts.notdef_outline = True
        # 0 版权、13 许可说明、14 许可网址：OFL 要求再分发时带上版权声明，放在字体元数据里就行，每个文件只多几十字节
        opts.name_IDs = [0, 1, 2, 3, 4, 6, 13, 14]
        opts.glyph_names = False
        opts.drop_tables += ["DSIG"]
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=want)
        sub.subset(font)
        font.flavor = None
        buf = io.BytesIO()
        font.save(buf)
        buf.seek(0)
        parts.append(buf)
    if remaining:
        raise RuntimeError(f"{face.key}: 这些字在字体里找不到 {[chr(c) for c in sorted(remaining)[:10]]}")
    merged = merge.Merger().merge(parts) if len(parts) > 1 else TTFont(parts[0])
    merged.flavor = "woff2"
    out = io.BytesIO()
    merged.save(out)
    return out.getvalue()


def css_ranges(cps: set[int]) -> str:
    runs: list[tuple[int, int]] = []
    start = prev = None
    for cp in sorted(cps):
        if start is None:
            start = prev = cp
        elif cp == prev + 1:
            prev = cp
        else:
            runs.append((start, prev))
            start = prev = cp
    if start is not None:
        runs.append((start, prev))
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in runs)


@dataclass(eq=False)
class Pack:
    face: Face
    tier: str
    chars: set[int]
    blob: bytes = b""

    @property
    def file(self) -> str:
        return f"{self.face.slug}-{self.tier}.woff2"


def cached_blob(pack: Pack) -> bytes:
    cache_dir = CACHE_DIR / "packs"
    cache_dir.mkdir(parents=True, exist_ok=True)
    src = [(s.file.name, s.file.stat().st_size) for s in pack.face.slices if s.cmap & pack.chars]
    sig = hashlib.sha1(json.dumps([SCRIPT_VERSION, pack.face.key, sorted(pack.chars), src]).encode()).hexdigest()[:20]
    cached = cache_dir / f"{sig}.woff2"
    if cached.exists():
        return cached.read_bytes()
    blob = subset_tier(pack.face, pack.chars)
    cached.write_bytes(blob)
    return blob


def write_css(packs: list[Pack]) -> str:
    lines = [
        "/*",
        " * 由 scripts/subset_fonts.py 生成，不要手改（改了下次生成会被覆盖）。",
        " * 每个 @font-face 只带站点实际用到的字；说明与重新生成的办法见 README“字体”一节。",
        " */",
    ]
    for p in packs:
        lines += [
            "@font-face {",
            f"  font-family: '{p.face.family}';",
            f"  font-style: {p.face.style};",
            f"  font-weight: {p.face.weight};",
            "  font-display: swap;",
            f"  src: url('./{p.file}') format('woff2');",
            f"  unicode-range: {css_ranges(p.chars)};",
            "}",
        ]
    return "\n".join(lines) + "\n"


# ───────────────────────────── 主流程 ─────────────────────────────

GRID = [(24, 24), (12, 12), (6, 6), (3, 6), (3, 3), (2, 2), (1, 6), (1, 1)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true", help="只比较几种分包方案（估算体积），不写文件")
    ap.add_argument("--file-cost", type=int, default=30000, help="聚类分包：每多一个文件折合多少字节（越大文件越少、每页多下的无用字越多）")
    ap.add_argument("--legacy", action="store_true", help="用旧的“按节气分组”分包（--home-group / --page-group 才有效）")
    ap.add_argument("--home-group", type=int, default=6, help="首页当天专属的字，每几个节气一包")
    ap.add_argument("--page-group", type=int, default=6, help="节气页专属的字，每几个节气一包")
    args = ap.parse_args()

    data = load_scan()
    faces = load_faces(needed_chars(data))
    usage, system = build_usage(data, faces)
    terms = term_order()
    n_home = sum(1 for s in data["scopes"] if s.startswith("home:"))

    if args.plan:
        print(f"字体数 {len(usage)}，各字体用字：")
        for face in sorted(usage, key=lambda f: f.key):
            print(f"  {face.key:36s} {len(usage[face]):5d} 字")
        print("\n聚类分包（--file-cost 每多一个文件折合多少字节）：")
        all_scopes = sorted(data["scopes"])
        for fc in (0, 4000, 8000, 16000, 32000):
            tiers = make_tiers_cluster(usage, all_scopes, fc)
            counts = defaultdict(int)
            for face, tmap in tiers.items():
                for t in tmap.values():
                    counts[(face, t)] += 1
            costs = scenario_costs(usage, tiers, lambda f, t, c=counts: est_bytes(f, c[(f, t)]), n_home)
            print(f"  file-cost {fc:<6d} {len(counts):3d}个文件  {scenario_line(costs)}")
        print("\n估算（首页/节气页为 最小/中位/最大）：")
        for hg, pg in GRID:
            sc = Scoper(Params(hg, pg), terms)
            tiers = make_tiers(usage, sc, n_home)
            counts: dict[tuple[Face, str], int] = defaultdict(int)
            for face, tmap in tiers.items():
                for t in tmap.values():
                    counts[(face, t)] += 1
            costs = scenario_costs(usage, tiers, lambda f, t, c=counts: est_bytes(f, c[(f, t)]), n_home)
            print(f"  home/{hg:<2d} page/{pg:<2d} {len(counts):3d}个文件  {scenario_line(costs)}")
        return

    sc = Scoper(Params(args.home_group, args.page_group), terms)
    if args.legacy:
        tiers = make_tiers(usage, sc, n_home)
    else:
        tiers = make_tiers_cluster(usage, sorted(data["scopes"]), args.file_cost)
    by_pack: dict[tuple[Face, str], set[int]] = defaultdict(set)
    for face, tmap in tiers.items():
        for cp, t in tmap.items():
            by_pack[(face, t)].add(cp)

    order = {t: i for i, t in enumerate(["all", "core", "hover"])}
    packs = [
        Pack(face, t, chars)
        for (face, t), chars in sorted(
            by_pack.items(),
            key=lambda kv: (kv[0][0].family, kv[0][0].weight, kv[0][0].style, order.get(kv[0][1], 9), kv[0][1]),
        )
    ]
    print(f"{len(packs)} 个分包，裁剪中……（第一次较慢，之后按内容缓存）")
    for i, p in enumerate(packs, 1):
        p.blob = cached_blob(p)
        print(f"  [{i:2d}/{len(packs)}] {p.file:48s} {len(p.chars):5d} 字 {len(p.blob) / 1024:7.1f} KB", flush=True)

    sizes = {(p.face, p.tier): len(p.blob) for p in packs}
    costs = scenario_costs(usage, tiers, lambda f, t: sizes[(f, t)], n_home)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    keep = {p.file for p in packs}
    for old in OUT_DIR.glob("*.woff2"):
        if old.name not in keep:
            old.unlink()
    for p in packs:
        (OUT_DIR / p.file).write_bytes(p.blob)
    css = write_css(packs)
    (OUT_DIR / "fonts.css").write_text(css, encoding="utf8")

    lines = ["字体裁剪报告（scripts/subset_fonts.py 生成）", ""]
    if args.legacy:
        lines.append(f"分包参数（旧）：首页每 {args.home_group} 个节气一包，节气页每 {args.page_group} 个节气一包")
    else:
        lines.append(f"分包参数（按页面集合聚类）：每多一个文件折合 {args.file_cost} 字节")
    lines.append(f"共 {len(packs)} 个 woff2，合计 {sum(len(p.blob) for p in packs) / 1024:.0f} KB；fonts.css {len(css) / 1024:.1f} KB")
    lines.append("")
    lines.append("各分包：")
    for p in packs:
        lines.append(f"  {p.file:48s} {len(p.chars):5d} 字 {len(p.blob) / 1024:7.1f} KB")
    lines.append("")
    lines.append("各类页面实际会下载的字体体积（KB；首页与节气页为 最小/中位/最大）：")
    h, ha, t = costs["home"], costs["home_all"], costs["terms"]
    lines += [
        f"  首页（一年里 {len(h)} 种“今天”）  {fmt_kb(min(h))} / {fmt_kb(statistics.median(h))} / {fmt_kb(max(h))}",
        f"  首页 + 悬停遍 24 段 + 开菜单 + 弹提示   最多 {fmt_kb(max(ha))}",
        f"  节气页（24 页）                {fmt_kb(min(t))} / {fmt_kb(statistics.median(t))} / {fmt_kb(max(t))}",
        f"  色谱页 {fmt_kb(costs['palette'])}   关于页 {fmt_kb(costs['about'])}   全站所有字体 {fmt_kb(costs['site'])}",
    ]
    if system:
        lines.append("")
        lines.append("没有任何网页字体能显示、交给系统字体的字（裁剪前也是如此）：")
        for fam, cps in system.items():
            lines.append(f"  {fam}: {''.join(chr(c) for c in sorted(cps))}")
    report = "\n".join(lines) + "\n"
    REPORT.write_text(report, encoding="utf8")
    print()
    print(report)


if __name__ == "__main__":
    main()
