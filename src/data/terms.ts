export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter'

export interface Term {
  /** 1–24，自立春起算 */
  index: number
  name: string
  pinyin: string
  /** 交节的大致公历日期（用于“今日节气”判断；正式版换成逐年的精确日期表） */
  month: number
  day: number
  /** 交节日期浮动范围，如 “11月7—8日” */
  dateLabel: string
  color: { name: string; pinyin: string; hex: string }
  /** 色彩意象，两句 */
  imagery: [string, string]
  /** 三候 */
  pentads: [string, string, string]
  season: SeasonKey
}

type Row = [
  name: string,
  pinyin: string,
  month: number,
  day: number,
  dateLabel: string,
  colorName: string,
  colorPinyin: string,
  hex: string,
  imagery: string,
  pentads: [string, string, string],
]

const ROWS: Row[] = [
  ['立春', 'lì chūn', 2, 4, '2月3—5日', '松花', 'sōng huā', '#C2D98A', '东风解冻，草木初萌', ['东风解冻', '蛰虫始振', '鱼陟负冰']],
  ['雨水', 'yǔ shuǐ', 2, 19, '2月18—20日', '水绿', 'shuǐ lǜ', '#CFE8DC', '冰雪化水，润物无声', ['獭祭鱼', '候雁北', '草木萌动']],
  ['惊蛰', 'jīng zhé', 3, 5, '3月5—7日', '桃红', 'táo hóng', '#F0888F', '春雷初动，桃始华', ['桃始华', '仓庚鸣', '鹰化为鸠']],
  ['春分', 'chūn fēn', 3, 20, '3月20—22日', '柳绿', 'liǔ lǜ', '#9DBF5A', '杨柳垂丝，昼夜均分', ['玄鸟至', '雷乃发声', '始电']],
  ['清明', 'qīng míng', 4, 5, '4月4—6日', '天青', 'tiān qīng', '#A9CFCB', '气清景明，雨过天青', ['桐始华', '田鼠化为鴽', '虹始见']],
  ['谷雨', 'gǔ yǔ', 4, 20, '4月19—21日', '豆绿', 'dòu lǜ', '#7FA36B', '雨生百谷，新茶初采', ['萍始生', '鸣鸠拂其羽', '戴胜降于桑']],
  ['立夏', 'lì xià', 5, 5, '5月5—7日', '青碧', 'qīng bì', '#4DB7A0', '万物繁茂，草木青碧', ['蝼蝈鸣', '蚯蚓出', '王瓜生']],
  ['小满', 'xiǎo mǎn', 5, 21, '5月20—22日', '缃色', 'xiāng sè', '#E9C75A', '麦穗初齐，将熟未熟', ['苦菜秀', '靡草死', '麦秋至']],
  ['芒种', 'máng zhòng', 6, 5, '6月5—7日', '杏黄', 'xìng huáng', '#F5A742', '梅子黄时，麦收稻种', ['螳螂生', '鵙始鸣', '反舌无声']],
  ['夏至', 'xià zhì', 6, 21, '6月21—22日', '石榴红', 'shí liu hóng', '#C93A40', '榴花照眼，日长之至', ['鹿角解', '蜩始鸣', '半夏生']],
  ['小暑', 'xiǎo shǔ', 7, 7, '7月6—8日', '藕荷', 'ǒu hé', '#DDB8C6', '温风始至，荷风送香', ['温风至', '蟋蟀居壁', '鹰始挚']],
  ['大暑', 'dà shǔ', 7, 23, '7月22—24日', '朱砂', 'zhū shā', '#D9492B', '炎阳如火，一年至热', ['腐草为萤', '土润溽暑', '大雨时行']],
  ['立秋', 'lì qiū', 8, 7, '8月7—9日', '秋香', 'qiū xiāng', '#C8B14A', '凉风初至，草木始黄', ['凉风至', '白露降', '寒蝉鸣']],
  ['处暑', 'chǔ shǔ', 8, 23, '8月22—24日', '枯黄', 'kū huáng', '#D3B17D', '禾乃登，暑气渐收', ['鹰乃祭鸟', '天地始肃', '禾乃登']],
  ['白露', 'bái lù', 9, 7, '9月7—9日', '月白', 'yuè bái', '#D6ECF0', '露凝而白，夜凉如水', ['鸿雁来', '玄鸟归', '群鸟养羞']],
  ['秋分', 'qiū fēn', 9, 23, '9月22—24日', '琥珀', 'hǔ pò', '#CA6924', '桂子飘香，秋色平分', ['雷始收声', '蛰虫坯户', '水始涸']],
  ['寒露', 'hán lù', 10, 8, '10月7—9日', '黛蓝', 'dài lán', '#425066', '露寒夜长，鸿雁来宾', ['鸿雁来宾', '雀入大水为蛤', '菊有黄华']],
  ['霜降', 'shuāng jiàng', 10, 23, '10月23—24日', '茶色', 'chá sè', '#B35C44', '霜叶尽染，草木黄落', ['豺乃祭兽', '草木黄落', '蛰虫咸俯']],
  ['立冬', 'lì dōng', 11, 7, '11月7—8日', '苍色', 'cāng sè', '#75878A', '水始冰，万物收藏', ['水始冰', '地始冻', '雉入大水为蜃']],
  ['小雪', 'xiǎo xuě', 11, 22, '11月22—23日', '荼白', 'tú bái', '#F3F9F1', '初雪未盛，天地微白', ['虹藏不见', '天气上升地气下降', '闭塞而成冬']],
  ['大雪', 'dà xuě', 12, 7, '12月6—8日', '老银', 'lǎo yín', '#BACAC6', '千山暮雪，天地一色', ['鹖鴠不鸣', '虎始交', '荔挺出']],
  ['冬至', 'dōng zhì', 12, 22, '12月21—23日', '玄色', 'xuán sè', '#3B2A2A', '日短之至，一阳来复', ['蚯蚓结', '麋角解', '水泉动']],
  ['小寒', 'xiǎo hán', 1, 5, '1月5—7日', '胭脂', 'yān zhi', '#9D2933', '梅花信至，寒中一点红', ['雁北乡', '鹊始巢', '雉始雊']],
  ['大寒', 'dà hán', 1, 20, '1月20—21日', '鸦青', 'yā qīng', '#424C50', '岁终大寒，静待春归', ['鸡乳', '征鸟厉疾', '水泽腹坚']],
]

const SEASON_ORDER: SeasonKey[] = ['spring', 'summer', 'autumn', 'winter']

export const TERMS: Term[] = ROWS.map((r, i) => {
  const [a, b] = r[8].split('，')
  return {
    index: i + 1,
    name: r[0],
    pinyin: r[1],
    month: r[2],
    day: r[3],
    dateLabel: r[4],
    color: { name: r[5], pinyin: r[6], hex: r[7] },
    imagery: [a, b],
    pentads: r[9],
    season: SEASON_ORDER[Math.floor(i / 6)],
  }
})

export interface Season {
  key: SeasonKey
  char: string
  /** 春生、夏长、秋收、冬藏 */
  verb: string
  range: string
  terms: Term[]
}

const SEASON_META: [SeasonKey, string, string][] = [
  ['spring', '春', '生'],
  ['summer', '夏', '长'],
  ['autumn', '秋', '收'],
  ['winter', '冬', '藏'],
]

export const SEASONS: Season[] = SEASON_META.map(([key, char, verb]) => {
  const terms = TERMS.filter((t) => t.season === key)
  return { key, char, verb, range: `${terms[0].name}至${terms[5].name}`, terms }
})

/** 给定日期所在的节气，以及这是该节气的第几天 */
export function termOfDate(date: Date): { term: Term; dayOfTerm: number } {
  const y = date.getFullYear()
  const today = new Date(y, date.getMonth(), date.getDate()).getTime()
  // 取去年、今年两年的全部交节日，找出不晚于今天的最近一个
  let best: { term: Term; start: number } | null = null
  for (const year of [y - 1, y]) {
    for (const term of TERMS) {
      const start = new Date(year, term.month - 1, term.day).getTime()
      if (start <= today && (!best || start > best.start)) best = { term, start }
    }
  }
  const found = best ?? { term: TERMS[0], start: today }
  return { term: found.term, dayOfTerm: Math.round((today - found.start) / 86_400_000) + 1 }
}

const CN_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

/** 1–31 转中文数字，用于竖排日期 */
export function cnNumber(n: number): string {
  if (n <= 10) return CN_DIGITS[n]
  if (n < 20) return `十${CN_DIGITS[n - 10]}`
  const tens = Math.floor(n / 10)
  return `${CN_DIGITS[tens]}十${CN_DIGITS[n % 10]}`
}

/** “11月7—8日” → “十一月七至八日” */
export function cnDateLabel(label: string): string {
  const m = label.match(/(\d+)月(\d+)—(\d+)日/)
  if (!m) return label
  return `${cnNumber(+m[1])}月${cnNumber(+m[2])}至${cnNumber(+m[3])}日`
}

export const ORDINALS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二',
  '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二', '二十三', '二十四',
]
