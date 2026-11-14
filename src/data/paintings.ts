/**
 * 画里寻色：一本册页十开，二十四色。
 *
 * 画：张若霭（1713–1746，清）《花鸟册》，纸本设色，十开。
 * 藏：克利夫兰艺术博物馆（The Cleveland Museum of Art），藏品号 1967.193，
 *     馆方以 Open Access 方式开放，图像为 CC0。
 * 各开的中文题名据馆方英文题名意译，不是画上原题。
 *
 * 取色点是用程序在每一开上找出来的：把图缩到 300 像素宽，取小块平均色，
 * 与节气色算 CIEDE2000 色差，避开印章与裱边，取最接近的一处。
 */

export interface Leaf {
  /** 第几开，1–10 */
  order: number
  /** 馆方藏品号 */
  acc: string
  /** 中文题名（意译） */
  name: string
  /** 馆方英文题名 */
  subtitle: string
  /** 网页图的像素尺寸，用来预留版面 */
  w: number
  h: number
}

export interface Pick {
  /** 节气序号，1–24，自立春起 */
  term: number
  /** 落在第几开 */
  leaf: number
  /** 取色点在画面上的位置，百分比 */
  x: number
  y: number
  /** 画中实取的颜色 */
  hex: string
  /** 与节气色的 CIEDE2000 色差 */
  de: number
}

export const ALBUM = {
  artist: '张若霭',
  years: '1713–1746',
  dynasty: '清',
  date: '18 世纪',
  title: '花鸟册',
  medium: '纸本设色',
  holder: '克利夫兰艺术博物馆',
  license: 'CC0',
  acc: '1967.193',
} as const

export const LEAVES: Leaf[] = [
  { order: 1, acc: '1967.193.a', name: '蝙蝠山石 其一', subtitle: 'Bats, rocks, flowers oval calligraphy', w: 900, h: 658 },
  { order: 2, acc: '1967.193.b', name: '蝙蝠山石 其二', subtitle: 'Bats, rocks, flowers circular calligraphy', w: 900, h: 652 },
  { order: 3, acc: '1967.193.c', name: '锦葵', subtitle: 'mallow flowers', w: 900, h: 651 },
  { order: 4, acc: '1967.193.d', name: '石竹', subtitle: 'Pinks', w: 900, h: 646 },
  { order: 5, acc: '1967.193.e', name: '牡丹', subtitle: 'Peony', w: 900, h: 649 },
  { order: 6, acc: '1967.193.f', name: '蔷薇', subtitle: 'Rose', w: 900, h: 651 },
  { order: 7, acc: '1967.193.g', name: '蓝花藤蔓', subtitle: 'Climbing Blue Flowers', w: 900, h: 647 },
  { order: 8, acc: '1967.193.h', name: '理羽', subtitle: 'Preening Bird', w: 900, h: 649 },
  { order: 9, acc: '1967.193.i', name: '雀语', subtitle: 'Gossiping Sparrows', w: 900, h: 645 },
  { order: 10, acc: '1967.193.j', name: '梅禽', subtitle: 'Bird with Plum Blossoms', w: 900, h: 645 },
]

export const PICKS: Pick[] = [
  { term: 1, leaf: 8, x: 24.2, y: 80.8, hex: '#C9C394', de: 10.0 },
  { term: 2, leaf: 1, x: 76.5, y: 13.5, hex: '#B7BEAE', de: 11.4 },
  { term: 3, leaf: 3, x: 69.5, y: 27.0, hex: '#C98C8E', de: 7.7 },
  { term: 4, leaf: 3, x: 58.8, y: 45.4, hex: '#9AA459', de: 8.6 },
  { term: 5, leaf: 1, x: 60.8, y: 23.5, hex: '#ADB8B4', de: 9.6 },
  { term: 6, leaf: 8, x: 83.5, y: 54.4, hex: '#8A985F', de: 6.0 },
  { term: 7, leaf: 10, x: 39.5, y: 21.6, hex: '#699581', de: 11.9 },
  { term: 8, leaf: 1, x: 29.5, y: 25.3, hex: '#E3C476', de: 4.7 },
  { term: 9, leaf: 2, x: 39.2, y: 38.0, hex: '#E7A035', de: 3.1 },
  { term: 10, leaf: 4, x: 70.2, y: 50.5, hex: '#B0483A', de: 6.2 },
  { term: 11, leaf: 10, x: 29.5, y: 44.0, hex: '#C8A8A3', de: 9.6 },
  { term: 12, leaf: 2, x: 47.8, y: 47.7, hex: '#BA6546', de: 8.2 },
  { term: 13, leaf: 6, x: 73.8, y: 69.4, hex: '#ABA146', de: 6.7 },
  { term: 14, leaf: 7, x: 51.5, y: 81.3, hex: '#CFB286', de: 2.2 },
  { term: 15, leaf: 4, x: 19.2, y: 47.2, hex: '#BABCB2', de: 14.1 },
  { term: 16, leaf: 2, x: 74.8, y: 43.5, hex: '#BD7142', de: 4.9 },
  { term: 17, leaf: 7, x: 64.8, y: 39.6, hex: '#3C4E63', de: 2.6 },
  { term: 18, leaf: 5, x: 14.2, y: 56.3, hex: '#AE604D', de: 2.3 },
  { term: 19, leaf: 2, x: 33.2, y: 41.7, hex: '#748687', de: 1.4 },
  { term: 20, leaf: 8, x: 17.8, y: 73.8, hex: '#E5DBCB', de: 9.4 },
  { term: 21, leaf: 4, x: 23.2, y: 36.5, hex: '#B8BEB7', de: 4.9 },
  { term: 22, leaf: 9, x: 11.8, y: 28.6, hex: '#48403B', de: 9.0 },
  { term: 23, leaf: 5, x: 22.5, y: 56.3, hex: '#954541', de: 6.2 },
  { term: 24, leaf: 10, x: 45.8, y: 17.9, hex: '#404E52', de: 1.5 },
]

/**
 * 图片地址。十张图已存在 public/album/，断网也能显示。
 * 原始来源：https://openaccess-cdn.clevelandart.org/{藏品号}/{藏品号}_web.jpg
 */
export function leafImage(leaf: Leaf): string {
  return `${import.meta.env.BASE_URL}album/${leaf.acc}_web.jpg`
}

/** 馆方的藏品页 */
export function leafPage(leaf: Leaf): string {
  return `https://clevelandart.org/art/${leaf.acc}`
}

export function pickOfTerm(index: number): Pick {
  return PICKS[index - 1]
}

export function picksOnLeaf(order: number): Pick[] {
  return PICKS.filter((p) => p.leaf === order)
}

/** 色差的说法：差多少就说多少 */
export function closeness(de: number): string {
  if (de <= 3) return '几乎同色'
  if (de <= 7) return '相近'
  if (de <= 10) return '略有出入'
  return '只得其意'
}

export const LEAF_ORDINALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
