import { createRouter, createWebHashHistory, START_LOCATION } from 'vue-router'
import { termBySlug } from './data/terms'
import { contentOf } from './data/content'
import { jumpToTop } from './utils/motion'

/**
 * 四种页面：首页（岁时轮 + 二十四节气目录）、节气详情页、色谱页与关于页。
 * 用 hash 路由，放到任何静态空间都能直接打开，不需要服务器配置回退。
 */
export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
    {
      path: '/term/:slug',
      name: 'term',
      component: () => import('./views/TermView.vue'),
      // 网址里的节气不存在，就回首页
      beforeEnter: (to) => (termBySlug(String(to.params.slug)) ? true : { name: 'home' }),
    },
    { path: '/palette', name: 'palette', component: () => import('./views/PaletteView.vue') },
    { path: '/about', name: 'about', component: () => import('./views/AboutView.vue') },
    { path: '/:rest(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (to.path !== from.path) jumpToTop()
    // 第一次进入：页面本来就在顶部，再 scrollTo 一次只会强制浏览器同步排一遍版
    if (from === START_LOCATION) return
    // 首页内只换了锚点以外的东西时不动；换页面时回到顶部
    if (to.path === from.path) return
    return { top: 0, behavior: 'instant' }
  },
})

// 每个节气页有自己的标题，收藏、分享、翻历史记录时认得出来
const PAGE_TITLES: Record<string, string> = {
  palette: '色谱 · 二十四色 · 岁时有色',
  about: '关于 · 岁时有色',
}
const SITE_DESC = '一个节气，一种颜色，一年读作二十四色。每个节气配一幅古画、三候、习俗、时令吃食和一首诗。'
const PAGE_DESCS: Record<string, string> = {
  palette: '二十四节气对应的二十四种传统色，按季节筛选、按色相排序，点一下就能复制色值。',
  about: '岁时有色的说明：色名与色值怎么定、画作与字体的出处、日期怎么校验，以及已知的局限。',
}

function setMeta(selector: string, content: string) {
  document.head.querySelector(selector)?.setAttribute('content', content)
}

router.afterEach((to) => {
  const term = to.name === 'term' ? termBySlug(String(to.params.slug)) : undefined
  const title = term
    ? `${term.name} · ${term.color.name} · 岁时有色`
    : (PAGE_TITLES[String(to.name)] ?? '岁时有色 · 二十四节气与中国传统色')
  const desc = term
    ? `${term.name}（${term.color.name} ${term.color.hex}）：${contentOf(term).brief}`
    : (PAGE_DESCS[String(to.name)] ?? SITE_DESC)
  document.title = title
  // 描述与分享信息随页面更新；执行脚本的爬虫和浏览器能读到，不执行脚本的分享爬虫仍只看到总封面
  setMeta('meta[name="description"]', desc)
  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', desc)
  setMeta('meta[name="twitter:title"]', title)
  setMeta('meta[name="twitter:description"]', desc)
})
