/**
 * 页内跳转。站点用 hash 路由，普通的 href="#xx" 会被当成网址，所以页内锚点一律走这里。
 */
export function scrollToId(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
