<script setup lang="ts">
import { useRoute } from 'vue-router'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { useCopy } from './composables/useCopy'

const { message } = useCopy()
const route = useRoute()

/** hash 路由下 href="#main" 会被当成路由，所以跳过导航用按钮把焦点直接交给 <main> */
function skipToMain() {
  document.getElementById('main')?.focus()
}
</script>

<template>
  <button type="button" class="skip" @click="skipToMain">跳到正文</button>
  <SiteHeader />
  <main id="main" tabindex="-1">
    <RouterView />
  </main>
  <!-- 页脚只放在首页：详情页、色谱页、关于页各有自己的收尾，页头的导航在每一页都在；
       画作与字体的来源和许可写在关于页，不靠页脚 -->
  <SiteFooter v-if="route.name === 'home'" />

  <div class="toast" role="status" aria-live="polite">
    <Transition name="toast">
      <p v-if="message">{{ message }}</p>
    </Transition>
  </div>
</template>

<style scoped>
/* 平时移出视口，Tab 到它时才出现在左上角 */
.skip {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 200;
  padding: 10px 18px;
  background: var(--ink);
  color: var(--paper);
  font-size: var(--fs-14);
  letter-spacing: 0.1em;
  transform: translateY(-200%);
}
.skip:focus-visible {
  transform: none;
  outline: 2px solid var(--paper);
  outline-offset: -5px;
}
main:focus {
  outline: none;
}
/* 各页面都是懒加载的：内容还没到时 <main> 是空的，页脚会先排在屏幕顶部，内容一到再被推下去（CLS 0.84）。
   先撑出一屏高，页脚就始终在首屏之外 */
main {
  min-height: 100vh;
  min-height: 100svh;
}

.toast {
  position: fixed;
  inset: auto 0 32px 0;
  z-index: 50;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.toast p {
  padding: 10px 22px;
  background: var(--ink);
  color: var(--paper);
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s var(--ease),
    transform 0.3s var(--ease);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
