/**
 * 开发期字符扫描：找出站点实际渲染过哪些字、各用的哪一种字体，写到 scripts/font-chars.json。
 * 构建前的 scripts/subset_fonts.py 按这份清单把网页字体裁到只剩这些字（见 README“字体”一节）。
 *
 * 只在 `npm run dev` 里存在（main.ts 用 import.meta.env.DEV 才加载它，生产构建里不会带上）。
 * 在开发服务器的页面里打开控制台，运行 `await __scanFonts()`，约十几秒。
 *
 * 扫的内容：
 * - 首页、24 个节气页、色谱页、关于页；
 * - 首页岁时轮 24 段逐个悬停（右侧说明和中心色盘会换成那个节气的字）；
 * - 页头的手机菜单、四季下拉、复制成功 / 失败的提示条；
 * - 色谱页的筛选与排序按钮、节气页画作的“载入成功 / 载入失败”两种状态；
 * - 把“今天”依次挪到 24 个节气里各走一遍：首页“今天是……第 N 天”、“今日”标记、
 *   节气页“眼下是……”这些只在当天出现的字，换一天字就不同。
 *
 * 记录方式：遍历所有文本节点和 ::before / ::after 的 content，按每个元素“算出来的”
 * font-family / font-weight / font-style 归档。哪个字落在哪个字体文件里，由 Python 脚本对着
 * 字体的 cmap 去判断，这里不猜。
 */
import { nextTick } from 'vue'
import { copiedText, copyFailedText, useCopy } from '../composables/useCopy'
import { useTerm } from '../composables/useTerm'
import { solarTermStart, termOfDate, TERMS } from '../data/terms'
import { router } from '../router'

/** 范围名 → 字体键 → 字集。范围是页面或页面里的一种状态，Python 脚本据此决定哪些字放进首屏要用的包 */
type Scopes = Map<string, Map<string, Set<string>>>

const DAY = 86_400_000

const settle = async (ms = 40) => {
  await nextTick()
  await new Promise((r) => setTimeout(r, ms))
}

function record(faces: Map<string, Set<string>>, el: Element, text: string) {
  if (!text) return
  const cs = getComputedStyle(el)
  const key = `${cs.fontFamily}|${cs.fontWeight}|${cs.fontStyle}`
  let set = faces.get(key)
  if (!set) faces.set(key, (set = new Set()))
  // 换行、制表符这类空白不画字形，普通空格留着（拉丁字体里要有）
  for (const ch of text) if (ch === ' ' || !/\s/.test(ch)) set.add(ch)
}

/** CSS 里 content: "……" 算出来是带引号的字符串；attr() / counter() 之类不在这里处理 */
function pseudoText(content: string): string {
  if (!content || content === 'none' || content === 'normal') return ''
  const m = content.match(/^"((?:[^"\\]|\\.)*)"$/)
  return m ? m[1].replace(/\\(.)/g, '$1') : ''
}

/** 把当前页面上所有文字归到 scope 名下；同一个 scope 多次收集会合并 */
function collect(scopes: Scopes, scope: string) {
  let faces = scopes.get(scope)
  if (!faces) scopes.set(scope, (faces = new Map()))
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement
    if (!parent || parent.closest('script, style, noscript')) continue
    record(faces, parent, n.nodeValue ?? '')
  }
  for (const el of document.body.querySelectorAll('*')) {
    for (const pseudo of ['::before', '::after'] as const) {
      record(faces, el, pseudoText(getComputedStyle(el, pseudo).content))
    }
  }
}

async function visit(scopes: Scopes, path: string, scope: string) {
  // 已经在这一页就先绕开，否则 push 同一个地址是空操作，页面不会重新挂载
  if (router.currentRoute.value.fullPath === path) await router.push('/about')
  await router.push(path)
  await settle(60)
  collect(scopes, scope)
}

/** 首页：24 段逐个悬停（每段单独一个范围），再开手机菜单、四季下拉，再出两种提示条（合成 ui 范围） */
async function interactHome(scopes: Scopes) {
  const segs = [...document.querySelectorAll<SVGAElement>('a.seg')]
  for (const [i, seg] of segs.entries()) {
    seg.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    await settle(15)
    collect(scopes, `hover:${i + 1}`)
    seg.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
  }
  await settle()

  const esc = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

  // 点按钮要用真实的 click()；桌面宽度下手机菜单按钮是 display:none，程序里照样点得动
  document.querySelector<HTMLElement>('.header__menu')?.click()
  await settle()
  collect(scopes, 'ui')
  esc()
  await settle()

  document.querySelector<HTMLElement>('.header__drop')?.click()
  await settle()
  collect(scopes, 'ui')
  document.querySelector<HTMLElement>('.header__drop')?.click()
  await settle()

  const { notify } = useCopy()
  notify(copiedText('#aabbcc'))
  await settle()
  collect(scopes, 'ui')
  notify(copyFailedText('#aabbcc'))
  await settle()
  collect(scopes, 'ui')
  notify('')
}

/** 色谱页：每个筛选、排序按钮点一遍（“按色相排序”会多出一句素色说明） */
async function interactPalette(scopes: Scopes) {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.tools__group button')]
  for (const b of buttons) {
    b.click()
    await settle(15)
    collect(scopes, 'palette')
  }
  // 点回“全部”和“节气顺序”，免得下一次进来是上次的状态
  buttons[0]?.click()
  buttons.find((b) => b.textContent?.trim() === '节气顺序')?.click()
  await settle()
}

/** 节气页：画作图片的“载入成功 / 载入失败”会各出现一段文字；这里直接给 <img> 发事件，不依赖网络 */
async function interactPlate(scopes: Scopes, scope: string) {
  const img = document.querySelector<HTMLImageElement>('.leaf img')
  if (!img) return
  img.dispatchEvent(new Event('error'))
  await settle(15)
  collect(scopes, scope)
  img.dispatchEvent(new Event('load'))
  await settle(15)
  collect(scopes, scope)
}

export async function scanFonts() {
  const scopes: Scopes = new Map()
  const { now, today, select } = useTerm()
  const realTime = now.getTime()
  const realToday = { ...today }
  let visits = 0
  const go = async (path: string, scope: string) => {
    await visit(scopes, path, scope)
    visits++
  }

  try {
    await go('/', `home:${today.term.index}`)
    await interactHome(scopes)

    await go('/palette', 'palette')
    await interactPalette(scopes)
    await go('/about', 'about')

    for (const t of TERMS) {
      await go(`/term/${t.slug}`, `term:${t.slug}`)
      await interactPlate(scopes, `term:${t.slug}`)
    }

    // 把“今天”挪到每个节气的第 N 天各走一遍。偏移取 1~13 之间的不同值，让日期里的数字也多换几种
    const year = new Date(realTime).getFullYear()
    for (const t of TERMS) {
      const date = new Date(solarTermStart(t, year) + (((t.index * 7) % 13) + 1) * DAY)
      now.setTime(date.getTime())
      Object.assign(today, termOfDate(now))
      select(1) // 让依赖“今天”的计算属性失效，下一页重新算
      select(today.term.index)

      await go('/palette', 'palette')
      await go(`/term/${today.term.slug}`, `term:${today.term.slug}`)
      await interactPlate(scopes, `term:${today.term.slug}`)
      await go('/', `home:${today.term.index}`)
    }
  } finally {
    now.setTime(realTime)
    Object.assign(today, realToday)
    select(today.term.index)
  }

  const out: Record<string, Record<string, string>> = {}
  for (const [scope, faces] of [...scopes].sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }))) {
    const one: Record<string, string> = {}
    for (const [key, set] of [...faces].sort((a, b) => a[0].localeCompare(b[0]))) {
      one[key] = [...set].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!).join('')
    }
    out[scope] = one
  }
  const res = await fetch('/__font-chars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visits, scopes: out }),
  })
  console.info('[fontScan]', res.ok ? '已写入 scripts/font-chars.json' : `写入失败 ${res.status}`, { visits })
  return { ok: res.ok, visits, scopes: Object.keys(out).length }
}

declare global {
  interface Window {
    __scanFonts?: typeof scanFonts
  }
}
window.__scanFonts = scanFonts
