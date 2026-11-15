/**
 * 画里寻色：给节气配一幅题材对得上的古画，再在画里找出最接近节气色的一处。
 *
 * 画：张若霭（1713–1746，清）《花鸟册》，纸本设色，十开。
 * 藏：克利夫兰艺术博物馆（The Cleveland Museum of Art），藏品号 1967.193，
 *     馆方以 Open Access 方式开放，图像为 CC0。
 * 各开的中文题名据馆方英文题名意译，不是画上原题。
 *
 * 配画只看题材：画的是这个节气的花，才配给这个节气；没有合适的画就先空着。
 * 取色点是用程序在那一开上找出来的：把图缩到 300 像素宽，取小块平均色，
 * 与节气色算 CIEDE2000 色差，避开印章与裱边，取最接近的一处。差多少就写多少。
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

export interface Plate {
  /** 节气序号，1–24，自立春起 */
  term: number
  /** 第几开 */
  leaf: number
  /** 为什么是这幅画：题材与节气的关系 */
  why: string
  /** 取色点在画面上的位置，百分比 */
  x: number
  y: number
  /** 画中实取的颜色 */
  hex: string
  /** 与节气色的 CIEDE2000 色差 */
  de: number
  /** 裁成竖幅小图时的焦点，百分比 */
  focus: [number, number]
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

export const PLATES: Plate[] = [
  {
    term: 3,
    leaf: 6,
    why: '古人说“二十四番花信风”，每个节气三候，各有一种花应时而开。惊蛰的三候依次是桃花、棣棠、蔷薇，这一开画的正是蔷薇。',
    x: 31.3,
    y: 15.7,
    hex: '#BD838B',
    de: 10.2,
    focus: [50, 50],
  },
  {
    term: 6,
    leaf: 5,
    why: '牡丹在谷雨前后开，所以又叫“谷雨花”。花信风里，谷雨一候就是牡丹；民间也说“谷雨三朝看牡丹”。',
    x: 57.7,
    y: 22.7,
    hex: '#88915E',
    de: 7.8,
    focus: [50, 50],
  },
  {
    term: 8,
    leaf: 4,
    why: '石竹五六月开花，花期正对着小满。花瓣边缘像用剪刀剪过，一丛里常常开出好几种颜色。',
    x: 57.3,
    y: 58.6,
    hex: '#D0AD6C',
    de: 9.7,
    focus: [50, 50],
  },
  {
    term: 11,
    leaf: 3,
    why: '锦葵是盛夏的花，从入夏一直开到秋初。花色粉里带一点紫，和藕荷是一路颜色。',
    x: 17.3,
    y: 32.7,
    hex: '#D8ADAA',
    de: 7.2,
    focus: [50, 50],
  },
  {
    term: 17,
    leaf: 7,
    why: '这一开配的是颜色，不是时令：画上是攀藤的蓝花，馆方题名只写“蓝花藤蔓”，没有说是什么花。整本册页里，数它的蓝最接近黛蓝。',
    x: 64.8,
    y: 39.6,
    hex: '#3C4E63',
    de: 2.6,
    focus: [50, 50],
  },
  {
    term: 23,
    leaf: 10,
    why: '花信风从小寒数起，第一候就是梅花。一年里最冷的时候，它最先开。',
    x: 77.3,
    y: 40.9,
    hex: '#7D6355',
    de: 20.3,
    focus: [50, 50],
  },
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

/** 这个节气配的画；还没有配到就是 undefined */
export function plateOfTerm(index: number): Plate | undefined {
  return PLATES.find((p) => p.term === index)
}

export function leafOfPlate(plate: Plate): Leaf {
  return LEAVES[plate.leaf - 1]
}

/** 色差的说法：差多少就说多少 */
export function closeness(de: number): string {
  if (de <= 3) return '几乎同色'
  if (de <= 7) return '相近'
  if (de <= 10) return '略有出入'
  return '只得其意'
}

export const LEAF_ORDINALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
