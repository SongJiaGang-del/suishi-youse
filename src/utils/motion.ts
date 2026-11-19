import type Lenis from 'lenis'
import type { Directive } from 'vue'

/**
 * 滚动质感：两件事，都只在“允许动效”时开。
 *  1. 平滑滚动（Lenis）：只给有鼠标 / 触控板的设备（hover: hover + 精细指针）；
 *     触屏本来就有系统惯性，不接管。库在首屏之后才加载，不挡渲染。
 *  2. 视差（v-parallax）：元素在视口里移动时，按速度系数多走或少走一点，写进 --py 变量，
 *     由样式决定谁用它（transform / translate），所以不会和悬停缩放打架。
 */
const mq = (q: string) => window.matchMedia(q).matches
const motionOK = () => !mq('(prefers-reduced-motion: reduce)')

let lenis: Lenis | null = null

export function initSmoothScroll() {
  if (!motionOK() || !mq('(hover: hover) and (pointer: fine)')) return
  const start = async () => {
    const { default: Lenis } = await import('lenis')
    lenis = new Lenis({
      lerp: 0.1, // 越小越“沉”，0.1 是跟手但有拖尾的程度
      wheelMultiplier: 0.9,
      autoToggle: true, // 全屏菜单把 html 设成 overflow:hidden 时自动停住
      anchors: false, // 站点用 hash 路由，锚点由 scrollToId 自己处理
    })
    document.documentElement.classList.add('has-lenis')
    const raf = (t: number) => {
      lenis?.raf(t)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }
  // 等首屏画完再装，避免和 LCP 抢主线程
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2000 })
  else setTimeout(start, 800)
}

/** 平滑滚到某个元素；没有启用 Lenis 时退回浏览器自带的 */
export function smoothScrollTo(el: HTMLElement | null) {
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else el.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'start' })
}

export function smoothScrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top: 0, behavior: motionOK() ? 'smooth' : 'auto' })
}

/** 换页时直接回顶，不带动画，并让 Lenis 同步到新位置 */
export function jumpToTop() {
  lenis?.scrollTo(0, { immediate: true, force: true })
}

/* ---------- 视差 ---------- */

const speeds = new Map<HTMLElement, number>()
const visible = new Set<HTMLElement>()
let ticking = false

function update() {
  ticking = false
  const mid = window.innerHeight / 2
  for (const el of visible) {
    const r = el.getBoundingClientRect()
    const off = r.top + r.height / 2 - mid // 元素中心离视口中心多远
    el.style.setProperty('--py', `${(-off * (speeds.get(el) ?? 0)).toFixed(1)}px`)
  }
}
const schedule = () => {
  if (ticking) return
  ticking = true
  requestAnimationFrame(update)
}

let io: IntersectionObserver | null = null
function ensureObserver() {
  if (io) return io
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement
        if (e.isIntersecting) visible.add(el)
        else visible.delete(el)
      }
      schedule()
    },
    { rootMargin: '10% 0px' },
  )
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  return io
}

/** v-parallax="0.08"：系数为正，元素比页面走得慢（像远一点）；负数则更快 */
export const parallax: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (!motionOK()) return
    speeds.set(el, binding.value ?? 0.06)
    ensureObserver().observe(el)
  },
  unmounted(el) {
    speeds.delete(el)
    visible.delete(el)
    io?.unobserve(el)
  },
}
