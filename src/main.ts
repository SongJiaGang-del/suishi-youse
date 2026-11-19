import { createApp, type Directive } from 'vue'

// 站点实际用到的字，由 scripts/subset_fonts.py 从字体包里裁出（见 README“字体”一节）
import './assets/fonts/fonts.css'

import './styles/base.css'
import App from './App.vue'
import { router } from './router'
import { initSmoothScroll, parallax } from './utils/motion'

/**
 * v-reveal：元素滚入视口时淡入；完全滚出后收回，下次再进来重新播（重复）。
 * 收回时按它离开的方向摆好起点：从上边出去的停在上方，滚回来时是自上而下落进来（逆向），
 * 从下边出去的停在下方，向下滚时自下而上升起。
 */
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const el = entry.target
      if (entry.isIntersecting) {
        if (entry.intersectionRatio >= 0.15) el.classList.add('is-in')
      } else {
        el.classList.toggle('reveal--above', entry.boundingClientRect.top < 0)
        el.classList.remove('is-in')
      }
    }
  },
  { threshold: [0, 0.15], rootMargin: '0px 0px -8% 0px' },
)

const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value) el.style.transitionDelay = `${binding.value}ms`
    observer.observe(el)
  },
  unmounted(el) {
    observer.unobserve(el)
  },
}

/*
 * 页面颜色靠 :root 上的变量过渡来换（见 base.css），初始值是苍色。
 * 首次进入时若不关掉过渡，样式表先到、脚本后到的那几十毫秒里页面是苍色，
 * 脚本写入当前节气的颜色后会从苍色渐变过去（今天恰好是立冬、苍色时看不出来，换个节气就有）。
 * 所以启动期间关闭过渡，首屏路由就绪、颜色落定后再放开，之后换节气仍然是渐变。
 */
const root = document.documentElement
root.classList.add('theme-boot')
createApp(App).use(router).directive('reveal', reveal).directive('parallax', parallax).mount('#app')
initSmoothScroll()
const release = () => {
  let done = false
  const off = () => {
    if (done) return
    done = true
    root.classList.remove('theme-boot')
  }
  // 正常是等颜色落定的两帧之后放开；后台标签页不跑 rAF，所以再加一个定时兜底
  requestAnimationFrame(() => requestAnimationFrame(off))
  setTimeout(off, 400)
}
router.isReady().then(release, release)

// 开发期的字符扫描（生产构建里这一行连同 dev/ 目录一起被摇掉）
if (import.meta.env.DEV) void import('./dev/fontScan')
