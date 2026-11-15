import { createApp, type Directive } from 'vue'

import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/600.css'
import '@fontsource/noto-serif-sc/900.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500.css'
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css'

import './styles/base.css'
import App from './App.vue'
import { router } from './router'

/** v-reveal：元素滚入视口时淡入上移一次 */
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-in')
      observer.unobserve(entry.target)
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
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

createApp(App).use(router).directive('reveal', reveal).mount('#app')
