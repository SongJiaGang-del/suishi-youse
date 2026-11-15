/**
 * 画里寻色：给节气配一幅题材对得上的古画，再在画里找出最接近节气色的一处。
 *
 * 画都来自克利夫兰艺术博物馆（The Cleveland Museum of Art）的开放藏品，
 * 馆方以 Open Access 方式开放，图像为 CC0。一共二十四幅，每个节气一幅：
 * 张若霭《花鸟册》里的六开，加上另外十八幅宋元明清的册页和立轴。
 *
 * 题名：馆方给了中文题名的照录（转成简体），没有的据馆方英文题名意译，都不一定是画上原题。
 * 册页里没有单独题名的几开（张若霭、樊圻、边寿民），小题是据画面内容拟的。
 *
 * 配画只看题材：画的是这个节气的物候、花木或景致，才配给这个节气；颜色对不对得上不作为条件。
 * （寒露是唯一的例外，配的是颜色，那一条里写明了。）
 * 取色点是用程序在画上找出来的：把图缩到 300 像素宽，取小块平均色，
 * 与节气色算 CIEDE2000 色差，避开印章、题跋与裱边，取最接近的一处。差多少就写多少。
 *
 * 网页用图都裁掉了裱边；樊圻册页的几开连对开的题跋一起裁掉了。
 * 标了 detail 的五幅是长立轴，只截了原画的一段。
 */

export type Format = '册页' | '立轴'

export interface Painting {
  /** 馆方藏品号，也是图片文件名 */
  acc: string
  /** 画家；不知名的写“佚名” */
  artist: string
  /** 生卒年 */
  years?: string
  dynasty: string
  /** 创作年代 */
  date: string
  /** 作品名；册页是整本册子的名字 */
  work: string
  /** 册页里的第几开；馆方没有给出次序的不写 */
  leaf?: number
  format: Format
  /** 这一幅的中文题名 */
  name: string
  /** 馆方英文题名 */
  subtitle: string
  medium: string
  /** 网页图只是原画的局部 */
  detail?: boolean
  /** 网页图的像素尺寸，用来预留版面 */
  w: number
  h: number
}

export interface Plate {
  /** 节气序号，1–24，自立春起 */
  term: number
  /** 配的是哪幅画（藏品号） */
  acc: string
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

export const HOLDER = '克利夫兰艺术博物馆'
export const LICENSE = 'CC0'

/** 张若霭《花鸟册》的一开 */
function zhang(leaf: number, letter: string, name: string, subtitle: string, h: number): Painting {
  return {
    acc: `1967.193.${letter}`,
    artist: '张若霭',
    years: '1713–1746',
    dynasty: '清',
    date: '18 世纪',
    work: '花鸟册',
    leaf,
    format: '册页',
    name,
    subtitle,
    medium: '纸本设色',
    w: 900,
    h,
  }
}

/** 樊圻《山水花鸟图册》的一开 */
function fan(leaf: number, name: string, w: number, h: number): Painting {
  return {
    acc: `1975.22.${leaf}`,
    artist: '樊圻',
    years: '1616–1694 以后',
    dynasty: '清',
    date: '1650 年代初',
    work: '山水花鸟图册',
    leaf,
    format: '册页',
    name,
    subtitle: `Album of Miscellaneous Subjects, Leaf ${leaf}`,
    medium: '绢本设色',
    w,
    h,
  }
}

export const PAINTINGS: Painting[] = [
  zhang(3, 'c', '锦葵', 'mallow flowers', 651),
  zhang(4, 'd', '石竹', 'Pinks', 646),
  zhang(5, 'e', '牡丹', 'Peony', 649),
  zhang(6, 'f', '蔷薇', 'Rose', 651),
  zhang(7, 'g', '蓝花藤蔓', 'Climbing Blue Flowers', 647),
  zhang(10, 'j', '梅禽', 'Bird with Plum Blossoms', 645),

  fan(2, '江村酒旗', 708, 504),
  fan(6, '月柳鸣蝉', 505, 361),
  fan(7, '稻叶秋虫', 499, 361),
  fan(9, '古木寒鸦', 499, 364),
  fan(10, '雪竹白鹭', 714, 509),

  {
    acc: '1955.302.4',
    artist: '萧云从',
    years: '1596–1673',
    dynasty: '清',
    date: '1668 年',
    work: '山水图册',
    format: '册页',
    name: '春景',
    subtitle: 'Album of Seasonal Landscapes: Spring Landscape',
    medium: '纸本淡设色',
    w: 621,
    h: 841,
  },
  {
    acc: '1952.285',
    artist: '马麟',
    years: '约 1185–1260 以后',
    dynasty: '南宋',
    date: '13 世纪中叶',
    work: '飞雁山水',
    format: '册页',
    name: '飞雁山水',
    subtitle: 'Landscape with Flying Geese',
    medium: '绢本淡设色',
    w: 560,
    h: 548,
  },
  {
    acc: '1974.31',
    artist: '殷宏',
    years: '约 1430–约 1500',
    dynasty: '明',
    date: '15 世纪末至 16 世纪初',
    work: '春柳聚禽图',
    format: '立轴',
    name: '春柳聚禽图',
    subtitle: 'Birds Gather under the Spring Willow',
    medium: '绢本设色',
    w: 704,
    h: 893,
  },
  {
    acc: '1986.49.5',
    artist: '翟大坤',
    years: '？–1804',
    dynasty: '清',
    date: '1775 年',
    work: '盛夏江村',
    format: '册页',
    name: '盛夏江村',
    subtitle: 'River Village in High Summer',
    medium: '绢本设色',
    w: 665,
    h: 867,
  },
  {
    acc: '1999.6',
    artist: '虚谷',
    years: '1823–1896',
    dynasty: '清',
    date: '约 1888–1889 年',
    work: '枇杷图',
    format: '立轴',
    name: '枇杷图',
    subtitle: 'Pipa (Loquats)',
    medium: '纸本设色',
    detail: true,
    w: 415,
    h: 451,
  },
  {
    acc: '1915.116',
    artist: '佚名',
    dynasty: '明',
    date: '1368–1644 年',
    work: '花石图',
    format: '立轴',
    name: '花石图',
    subtitle: 'Flowers and Rocks',
    medium: '绢本设色',
    detail: true,
    w: 261,
    h: 504,
  },
  {
    acc: '1999.260.f',
    artist: '边寿民',
    years: '1684–1752',
    dynasty: '清',
    date: '18 世纪上半叶',
    work: '书画册',
    format: '册页',
    name: '芦雁',
    subtitle: 'Album of Calligraphy and Paintings',
    medium: '纸本设色',
    w: 900,
    h: 608,
  },
  {
    acc: '1972.42',
    artist: '黎简',
    years: '活动于 18 世纪后半叶',
    dynasty: '清',
    date: '1788 年',
    work: '白云红树图',
    format: '立轴',
    name: '白云红树图',
    subtitle: 'White Clouds and Red Trees',
    medium: '绢本设色',
    detail: true,
    w: 368,
    h: 500,
  },
  {
    acc: '1997.102',
    artist: '文徵明',
    years: '1470–1559',
    dynasty: '明',
    date: '1551 年',
    work: '古木寒泉图',
    format: '立轴',
    name: '古木寒泉图',
    subtitle: 'Old Trees by a Wintry Brook',
    medium: '纸本淡设色',
    detail: true,
    w: 342,
    h: 491,
  },
  {
    acc: '1955.37.11',
    artist: '查士标',
    years: '1615–1698',
    dynasty: '清',
    date: '1684 年',
    work: '四季山水图册',
    format: '册页',
    name: '雪景',
    subtitle: 'Landscape Album in Various Styles: Snowy Landscape',
    medium: '纸本淡设色',
    w: 900,
    h: 704,
  },
  {
    acc: '1974.26',
    artist: '王冕',
    years: '1287–1359',
    dynasty: '元',
    date: '14 世纪',
    work: '月下梅花',
    format: '立轴',
    name: '月下梅花',
    subtitle: 'A Prunus in the Moonlight',
    medium: '绢本水墨',
    w: 500,
    h: 867,
  },
  {
    acc: '1970.76',
    artist: '吕文英',
    years: '活动于 15 世纪末至 16 世纪初',
    dynasty: '明',
    date: '约 1480–1507 年',
    work: '江村风雨图',
    format: '立轴',
    name: '江村风雨图',
    subtitle: 'River Village in a Rainstorm',
    medium: '绢本淡设色',
    w: 529,
    h: 880,
  },
  {
    acc: '1997.100',
    artist: '沈周',
    years: '1427–1509',
    dynasty: '明',
    date: '1468 年',
    work: '黄菊丹桂图',
    format: '立轴',
    name: '黄菊丹桂图',
    subtitle: 'Yellow Chrysanthemums and Red Osmanthus in the Style of Wang Yuan',
    // 馆方著录的材质是“ink on paper”，但图上的花叶明明有颜色，这里照画面写
    medium: '纸本设色',
    detail: true,
    w: 324,
    h: 450,
  },
]

export const PLATES: Plate[] = [
  {
    term: 1,
    acc: '1955.302.4',
    why: '立春是春天的第一个节气。这一开是萧云从四季山水里的春景：山坡刚泛出青绿，溪边的梅树开着白花。馆方的说明也提到，是画上的梅花点明了早春。',
    x: 27.5,
    y: 75.0,
    hex: '#C6C09D',
    de: 12.6,
    focus: [50, 50],
  },
  {
    term: 2,
    acc: '1952.285',
    why: '雨水三候：獭祭鱼，候雁北，草木萌动。第二候说的是大雁往北飞回去。这一开的远山上空正有一行雁，馆方说它画的是江南的春天。',
    x: 41.2,
    y: 21.3,
    hex: '#988057',
    de: 33.5,
    focus: [100, 50],
  },
  {
    term: 3,
    acc: '1967.193.f',
    why: '古人说“二十四番花信风”，每个节气三候，各有一种花应时而开。惊蛰的三候依次是桃花、棣棠、蔷薇，这一开画的正是蔷薇。',
    x: 31.3,
    y: 15.7,
    hex: '#BD838B',
    de: 10.2,
    focus: [50, 50],
  },
  {
    term: 4,
    acc: '1974.31',
    why: '春分前后，柳条抽青，花开了，鸟也多起来。这幅画题为“春柳聚禽”：一株垂柳底下，孔雀、喜鹊和各种小鸟聚在一处，所以它又叫“百鸟朝孔雀”。',
    x: 85.2,
    y: 45.0,
    hex: '#AA9C75',
    de: 17.7,
    focus: [50, 50],
  },
  {
    term: 5,
    acc: '1975.22.2',
    why: '杜牧写清明：“借问酒家何处有，牧童遥指杏花村。”馆方推测，这一开画的可能就是这两句诗：水边的竹林上头，挑出一面酒旗。',
    x: 16.2,
    y: 6.8,
    hex: '#BDA687',
    de: 24.5,
    focus: [40, 50],
  },
  {
    term: 6,
    acc: '1967.193.e',
    why: '牡丹在谷雨前后开，所以又叫“谷雨花”。花信风里，谷雨一候就是牡丹；民间也说“谷雨三朝看牡丹”。',
    x: 57.7,
    y: 22.7,
    hex: '#88915E',
    de: 7.8,
    focus: [50, 50],
  },
  {
    term: 7,
    acc: '1986.49.5',
    why: '立夏是夏天的开始。这一开画的是水边的村子，柳树已经长得很密。馆方题名说的是“盛夏”，时令比立夏晚一些；配在这里，取的是它夏木成荫的样子。',
    x: 40.2,
    y: 23.4,
    hex: '#8E7958',
    de: 31.5,
    focus: [50, 50],
  },
  {
    term: 8,
    acc: '1967.193.d',
    why: '石竹五六月开花，花期正对着小满。花瓣边缘像用剪刀剪过，一丛里常常开出好几种颜色。',
    x: 57.3,
    y: 58.6,
    hex: '#D0AD6C',
    de: 9.7,
    focus: [50, 50],
  },
  {
    term: 9,
    acc: '1999.6',
    why: '枇杷秋天开花，初夏结果，果子由青转黄，江南一带正好在芒种前后上市。虚谷画的是一树熟了的枇杷。',
    x: 34.5,
    y: 36.0,
    hex: '#DCB18B',
    de: 12.3,
    focus: [0, 50],
  },
  {
    term: 10,
    acc: '1915.116',
    why: '石榴在农历五月开花，古人把五月叫作“榴月”，夏至就在这个月里。画上最高的一枝是开着红花的石榴；馆方说，这幅画画的是初夏。',
    x: 76.8,
    y: 62.8,
    hex: '#823E2B',
    de: 15.4,
    focus: [50, 20],
  },
  {
    term: 11,
    acc: '1967.193.c',
    why: '锦葵是盛夏的花，从入夏一直开到秋初。花色粉里带一点紫，和藕荷是一路颜色。',
    x: 17.3,
    y: 32.7,
    hex: '#D8ADAA',
    de: 7.2,
    focus: [50, 50],
  },
  {
    term: 12,
    acc: '1970.76',
    why: '大暑三候：腐草为萤，土润溽暑，大雨时行。最后一候说的是这时节常有又急又大的雷雨。这幅画画的正是一场暴雨：斜风急雨打在江边的村子上，树都吹弯了，两个人顶着雨赶路。馆方说，窗里还有个孩子在往外看。',
    x: 44.8,
    y: 75.1,
    hex: '#806649',
    de: 23.3,
    focus: [65, 72],
  },
  {
    term: 13,
    acc: '1975.22.6',
    why: '立秋三候：凉风至，白露降，寒蝉鸣。这一开画的是月下柳枝上的一只蝉，旁边飞着两只蜂。馆方说，对开的题跋写的也是秋天到了。',
    x: 30.8,
    y: 8.6,
    hex: '#C5AF71',
    de: 6.7,
    focus: [20, 50],
  },
  {
    term: 14,
    acc: '1975.22.7',
    why: '处暑三候的最后一候是“禾乃登”，说的是谷子熟了。这一开画的是快熟的稻子，叶子已经发黄，上面停着一只秋虫。',
    x: 29.5,
    y: 50.0,
    hex: '#D3B17D',
    de: 0.0,
    focus: [45, 50],
  },
  {
    term: 15,
    acc: '1999.260.f',
    why: '白露三候：鸿雁来，玄鸟归，群鸟养羞。头一候就是大雁南来。边寿民以画芦雁出名，这一开画的正是芦苇丛里的几只雁。',
    x: 22.8,
    y: 30.3,
    hex: '#EEDFCE',
    de: 16.1,
    focus: [60, 50],
  },
  {
    term: 16,
    acc: '1997.100',
    why: '秋分前后桂花开，所以农历八月又叫“桂月”。这幅画上半是一株丹桂，枝上停着两只鸟，下半是石边的黄菊。馆方说，菊花和丹桂都在秋天开，丹桂的花是深橙色的，有甜香。网页上只截了上半的桂树。',
    x: 67.2,
    y: 75.2,
    hex: '#A68979',
    de: 17.8,
    focus: [50, 35],
  },
  {
    term: 17,
    acc: '1967.193.g',
    why: '这一开配的是颜色，不是时令：画上是攀藤的蓝花，馆方题名只写“蓝花藤蔓”，没有说是什么花。整本册页里，数它的蓝最接近黛蓝。',
    x: 64.8,
    y: 39.6,
    hex: '#3C4E63',
    de: 2.6,
    focus: [50, 50],
  },
  {
    term: 18,
    acc: '1972.42',
    why: '霜降前后，树叶经霜变红。这幅画题为“白云红树”：白云绕着青绿的山，山脚下是一片红树，正是深秋。',
    x: 19.2,
    y: 72.4,
    hex: '#A65F4A',
    de: 3.2,
    focus: [50, 50],
  },
  {
    term: 19,
    acc: '1997.102',
    why: '立冬，水始冰，地始冻。这幅画题为“古木寒泉”：几株老树，一道溪水从石间流过。要说明的是，画上的题款写的是五月，它并不是在冬天画的；配在这里，取的是画题里的那个“寒”字。',
    x: 67.5,
    y: 40.0,
    hex: '#837F76',
    de: 10.8,
    focus: [50, 30],
  },
  {
    term: 20,
    acc: '1955.37.11',
    why: '小雪是一年里头一个以雪为名的节气。这一开是查士标四季山水里的雪景：几株枯树，一面山石，一个人站在雪地里。',
    x: 58.8,
    y: 58.5,
    hex: '#D5CDB7',
    de: 12.1,
    focus: [45, 50],
  },
  {
    term: 21,
    acc: '1975.22.10',
    why: '到了大雪，雪下得大了，也积得住了。这一开画的是压着雪的竹子，南天竹的红果裹在冰凌里，底下站着两只白鹭。',
    x: 42.8,
    y: 68.9,
    hex: '#BBAF9C',
    de: 14.2,
    focus: [35, 50],
  },
  {
    term: 22,
    acc: '1974.26',
    why: '从冬至起“数九”。旧时有“九九消寒图”：画一枝素梅，八十一个花瓣，每天染一瓣，染完就出了九，春天也到了。王冕以画墨梅出名，这是他的一幅月下梅花。',
    x: 50.5,
    y: 86.6,
    hex: '#433D36',
    de: 10.0,
    focus: [50, 30],
  },
  {
    term: 23,
    acc: '1967.193.j',
    why: '花信风从小寒数起，第一候就是梅花。一年里最冷的时候，它最先开。',
    x: 77.3,
    y: 40.9,
    hex: '#7D6355',
    de: 20.3,
    focus: [50, 50],
  },
  {
    term: 24,
    acc: '1975.22.9',
    why: '大寒的节气色叫鸦青，就是乌鸦羽毛的颜色。这一开画的正是黄昏时落在老树上的寒鸦，冬天的山野已是一片赭黄。',
    x: 47.2,
    y: 24.4,
    hex: '#575044',
    de: 11.6,
    focus: [35, 50],
  },
]

/**
 * 图片地址。图都存在 public/album/，断网也能显示。
 * 原始来源：https://openaccess-cdn.clevelandart.org/{藏品号}/{藏品号}_web.jpg
 */
export function paintingImage(p: Painting): string {
  return `${import.meta.env.BASE_URL}album/${p.acc}_web.jpg`
}

/** 馆方的藏品页 */
export function paintingPage(p: Painting): string {
  return `https://clevelandart.org/art/${p.acc}`
}

/** 这个节气配的画；还没有配到就是 undefined */
export function plateOfTerm(index: number): Plate | undefined {
  return PLATES.find((p) => p.term === index)
}

const BY_ACC = new Map(PAINTINGS.map((p) => [p.acc, p]))

export function paintingOfPlate(plate: Plate): Painting {
  const p = BY_ACC.get(plate.acc)
  if (!p) throw new Error(`没有藏品号为 ${plate.acc} 的画`)
  return p
}

const ORDINALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

/** “第六开”；馆方没有给出次序的册页和立轴返回空串 */
export function leafLabel(p: Painting): string {
  return p.leaf ? `第${ORDINALS[p.leaf - 1]}开` : ''
}

/** 一行说清是哪幅画：樊圻《山水花鸟图册》第六开 / 萧云从《山水图册·春景》 / 虚谷《枇杷图》（局部） */
export function paintingLabel(p: Painting): string {
  const title = p.leaf || p.name === p.work ? `《${p.work}》${leafLabel(p)}` : `《${p.work}·${p.name}》`
  return `${p.artist}${title}${p.detail ? '（局部）' : ''}`
}

/** 色差的说法：差多少就说多少 */
export function closeness(de: number): string {
  if (de <= 3) return '几乎同色'
  if (de <= 7) return '相近'
  if (de <= 10) return '略有出入'
  if (de <= 20) return '只得其意'
  return '相去甚远'
}
