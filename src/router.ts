import { createRouter, createWebHashHistory } from 'vue-router'
import { termBySlug } from './data/terms'

/**
 * 两种页面：首页（岁时轮 + 二十四节气目录）与节气详情页。
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
    { path: '/:rest(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // 首页内只换了锚点以外的东西时不动；换页面时回到顶部
    if (to.path === from.path) return
    return { top: 0, behavior: 'instant' }
  },
})

// 每个节气页有自己的标题，收藏、分享、翻历史记录时认得出来
router.afterEach((to) => {
  const term = to.name === 'term' ? termBySlug(String(to.params.slug)) : undefined
  document.title = term ? `${term.name} · ${term.color.name} · 岁时有色` : '岁时有色 · 二十四节气与中国传统色'
})
