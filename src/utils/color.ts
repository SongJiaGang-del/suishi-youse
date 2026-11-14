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

/** 色上文字色：浓墨与亮纸中对比度更高的一个 */
export function onColor(hex: string): string {
  return contrast(hex, ON_DARK) >= contrast(hex, ON_LIGHT) ? ON_DARK : ON_LIGHT
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

export function rgbLabel(hex: string): string {
  return hexToRgb(hex).join(' · ')
}
