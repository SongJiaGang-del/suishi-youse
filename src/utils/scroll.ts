import { smoothScrollTo } from './motion'

/**
 * 页内跳转。站点用 hash 路由，普通的 href="#xx" 会被当成网址，所以页内锚点一律走这里。
 * 启用了平滑滚动（Lenis）时由它接管，否则用浏览器自带的。
 */
export function scrollToId(id: string) {
  smoothScrollTo(document.getElementById(id))
}
