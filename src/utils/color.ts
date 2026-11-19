export type RGB = [number, number, number]

export const PAPER = '#F5F0E6'
export const INK = '#2B2A28'
/** 压在主色上的两种文字色：浓墨与亮纸 */
export const ON_DARK = '#1A1917'
export const ON_LIGHT = '#FBF8F1'

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB
}

export function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** a 与 b 按 t 混合（t=0 得 a，t=1 得 b） */
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t) as RGB)
}

/**
 * 色上文字色：浓墨与亮纸中对比度更高的一个。
 * 朱砂、茶色这类中间亮度的色，两个固定色都不到 4.5:1（约 4.1–4.4），
 * 这时把胜出的一端继续推向纯黑或纯白，直到够 4.5:1；只推到够为止，肉眼上仍是同一支墨。
 */
export function onColor(hex: string): string {
  const best = contrast(hex, ON_DARK) >= contrast(hex, ON_LIGHT) ? ON_DARK : ON_LIGHT
  if (contrast(hex, best) >= 4.5) return best
  const end = best === ON_DARK ? '#000000' : '#ffffff'
  for (let t = 0.1; t <= 1; t += 0.1) {
    const m = mix(best, end, t)
    if (contrast(hex, m) >= 4.5) return m
  }
  return end
}

/** 深色：把主色逐步压向墨色，直到在宣纸底上达到 4.5:1，可用作标题与强调文字 */
export function deepOf(hex: string): string {
  for (let t = 0; t <= 1; t += 0.05) {
    const m = mix(hex, INK, t)
    if (contrast(m, PAPER) >= 4.5) return m
  }
  return INK
}

/** 浅色：主色淡化，用作大面积背景 */
export function washOf(hex: string): string {
  return mix(hex, PAPER, 0.82)
}

/** sRGB → CIE Lab（D65），算色差用 */
function toLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
  const fx = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047)
  const fy = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b)
  const fz = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** 两个颜色在 Lab 空间里的距离（ΔE76）：约 2 是肉眼刚能分辨，10 以上一眼能看出是两种颜色 */
export function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = toLab(a)
  const [l2, a2, b2] = toLab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

/**
 * 浅色节气：和宣纸底的色差不够大，整屏色块会融进纸里，需要一条边线托住。
 * 不用亮度对比度判断：立春这类饱和的浅色，亮度对比很低，但色相差得很明显，会被误判成“太浅”。
 */
const LIGHT_DE = 25
export function isLight(hex: string): boolean {
  return deltaE(hex, PAPER) < LIGHT_DE
}

/** 浅色节气的边线色：把主色向墨色压一点，落在纸上刚好看得见 */
export function edgeOf(hex: string): string {
  return mix(hex, INK, 0.3)
}

/**
 * 大色块实际铺的颜色。绝大多数节气就是主色本身；
 * 只有极浅的（小雪，和纸只差 ΔE 4.7）才向深色压一点，让它在纸上读得出是一整块颜色。
 * 目标 ΔE 7：配合一条边线已经分得开，再深就压成灰色，丢了“白”的感觉（10 时已经发灰）。
 * 色卡与色值仍然标主色原值，这里只影响大面积铺底。
 */
const BLOCK_MIN_DE = 7
export function blockOf(hex: string): string {
  if (deltaE(hex, PAPER) >= BLOCK_MIN_DE) return hex
  const deep = deepOf(hex)
  for (let t = 0.02; t <= 0.4; t += 0.02) {
    const m = mix(hex, deep, t)
    if (deltaE(m, PAPER) >= BLOCK_MIN_DE) return m
  }
  return mix(hex, deep, 0.4)
}

/** Lab 彩度 C*：越小越接近灰白。色谱页用它把素色（灰、白、玄）单独排在一起，因为这几种颜色的色相角没有意义 */
export function chromaOf(hex: string): number {
  const [, a, b] = toLab(hex)
  return Math.hypot(a, b)
}

/** 色相角（0–360°，红 0、黄 60、绿 120、青 180、蓝 240）；灰色没有色相，返回 0。色谱页按色相排序用 */
export function hueOf(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

export function rgbLabel(hex: string): string {
  return hexToRgb(hex).join(' · ')
}
