<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTerm } from '../composables/useTerm'
import SeasonTerms from './SeasonTerms.vue'
import { smoothScrollToTop } from '../utils/motion'

const route = useRoute()
const { now } = useTerm()
/** 首页的页头压在宣纸上，用墨色；详情页压在节气色上，用色上文字 */
const onPaper = computed(() => route.name !== 'term')

/** 已经在首页时，点“岁时有色”或“岁时轮”回到页面顶部 */
function toTop() {
  if (route.name === 'home') smoothScrollToTop()
}
const pad = (n: number) => String(n).padStart(2, '0')
const dateText = `${now.getFullYear()} · ${pad(now.getMonth() + 1)} · ${pad(now.getDate())}`
const dateIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

/* ── 桌面：「四季」下拉面板 ───────────────────────────────── */
const headerEl = ref<HTMLElement>()
const dropBtn = ref<HTMLButtonElement>()
const dropOpen = ref(false)

function closeDrop(returnFocus = false) {
  if (!dropOpen.value) return
  dropOpen.value = false
  if (returnFocus) dropBtn.value?.focus()
}
/** 点到页头以外的地方收起 */
function onDocPointer(e: PointerEvent) {
  if (dropOpen.value && !headerEl.value?.contains(e.target as Node)) dropOpen.value = false
}
/** Tab 走出页头也收起（relatedTarget 为空是点了不可聚焦的地方，由上面的点击判断处理） */
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (dropOpen.value && next && !headerEl.value?.contains(next)) dropOpen.value = false
}

/* ── 手机：全屏菜单 ───────────────────────────────────── */
const menuOpen = ref(false)
const menuBtn = ref<HTMLButtonElement>()
const sheetEl = ref<HTMLElement>()
const closeBtn = ref<HTMLButtonElement>()

function closeMenu(returnFocus = false) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (returnFocus) nextTick(() => menuBtn.value?.focus())
}

const FOCUSABLE = 'a[href], button:not([disabled])'
/** 菜单打开时：Esc 关闭；Tab 在菜单内循环 */
function onMenuKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeMenu(true)
    return
  }
  if (e.key !== 'Tab' || !sheetEl.value) return
  const items = [...sheetEl.value.querySelectorAll<HTMLElement>(FOCUSABLE)]
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (!sheetEl.value.contains(active)) {
    e.preventDefault()
    first.focus()
  } else if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

let prevOverflow = ''
watch(menuOpen, (open) => {
  const app = document.getElementById('app')
  const root = document.documentElement
  if (open) {
    prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    // 菜单盖住了整页：底下的内容不再能被点到、Tab 到或读到
    app?.setAttribute('inert', '')
    document.addEventListener('keydown', onMenuKey)
    nextTick(() => closeBtn.value?.focus())
  } else {
    root.style.overflow = prevOverflow
    app?.removeAttribute('inert')
    document.removeEventListener('keydown', onMenuKey)
  }
})

/* 换页就收起；窗口拉宽到桌面尺寸时手机菜单没有意义，窗口缩到手机尺寸时下拉面板同理 */
watch(
  () => route.fullPath,
  () => {
    closeDrop()
    closeMenu()
  },
)

const desktop = typeof window !== 'undefined' ? window.matchMedia('(min-width: 761px)') : undefined
function onBreakpoint() {
  if (desktop?.matches) closeMenu()
  else closeDrop()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer)
  desktop?.addEventListener('change', onBreakpoint)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer)
  document.removeEventListener('keydown', onMenuKey)
  desktop?.removeEventListener('change', onBreakpoint)
  if (menuOpen.value) {
    document.documentElement.style.overflow = prevOverflow
    document.getElementById('app')?.removeAttribute('inert')
  }
})
</script>

<template>
  <header
    ref="headerEl"
    class="header"
    :class="{ 'header--paper': onPaper }"
    @keydown.esc="closeDrop(true)"
    @focusout="onFocusOut"
  >
    <RouterLink class="header__brand" :to="{ name: 'home' }" aria-label="岁时有色 首页" @click="toTop">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="1.6 0.62" />
      </svg>
      <span>岁时有色</span>
    </RouterLink>

    <nav class="header__nav" aria-label="主导航">
      <RouterLink :to="{ name: 'home' }" @click="toTop">岁时轮</RouterLink>
      <button
        ref="dropBtn"
        type="button"
        class="header__drop"
        :class="{ 'is-current': route.name === 'term' }"
        :aria-expanded="dropOpen"
        aria-controls="season-panel"
        @click="dropOpen = !dropOpen"
      >
        四季
        <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true" :class="{ 'is-open': dropOpen }">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>
      <RouterLink :to="{ name: 'palette' }">色谱</RouterLink>
      <RouterLink :to="{ name: 'about' }">关于</RouterLink>
    </nav>

    <time class="header__date latin" :datetime="dateIso">{{ dateText }}</time>

    <button
      ref="menuBtn"
      type="button"
      class="header__menu"
      :aria-expanded="menuOpen"
      aria-controls="site-menu"
      @click="menuOpen = true"
    >
      菜单
    </button>

    <Transition name="drop">
      <div v-if="dropOpen" id="season-panel" class="drop">
        <SeasonTerms variant="drop" />
      </div>
    </Transition>
  </header>

  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="menuOpen" id="site-menu" ref="sheetEl" class="sheet" role="dialog" aria-modal="true" aria-label="站点菜单">
        <div class="sheet__bar">
          <RouterLink class="sheet__brand" :to="{ name: 'home' }" aria-label="岁时有色 首页" @click="toTop">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="1.6 0.62" />
            </svg>
            <span>岁时有色</span>
          </RouterLink>
          <button ref="closeBtn" type="button" class="sheet__close" @click="closeMenu(true)">关闭</button>
        </div>

        <nav class="sheet__main" aria-label="站点导航">
          <RouterLink :to="{ name: 'home' }" @click="toTop">岁时轮</RouterLink>
          <RouterLink :to="{ name: 'palette' }">色谱</RouterLink>
          <RouterLink :to="{ name: 'about' }">关于</RouterLink>
        </nav>

        <p class="sheet__label">二十四节气</p>
        <SeasonTerms variant="sheet" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.header {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 28px var(--gutter);
  color: var(--on-c);
}
.header--paper {
  color: var(--ink);
}

.header__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  justify-self: start;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-20);
  letter-spacing: 0.24em;
}

.header__nav {
  display: flex;
  gap: clamp(24px, 4vw, 56px);
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.24em;
}

.header__nav :is(a, button) {
  position: relative;
  padding: 6px 0 6px 0.24em;
}
.header__nav :is(a, button)::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0.24em;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease);
}
.header__nav :is(a, button):hover::after,
.header__nav :is(a, button):focus-visible::after,
.header__nav a[aria-current='page']::after,
.header__nav .is-current::after,
.header__nav [aria-expanded='true']::after {
  transform: scaleX(1);
}

.header__drop {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.header__drop svg {
  /* 字距在“四季”后面多留了一份，把箭头往回收一点 */
  margin-left: -0.24em;
  transition: transform 0.3s var(--ease);
}
.header__drop svg.is-open {
  transform: rotate(180deg);
}

.header__date {
  justify-self: end;
  font-size: 1.125rem;
  letter-spacing: 0.08em;
}

.header__menu {
  display: none;
}

/* ── 桌面下拉面板：压在页面上，纸色底，墨字，和页头底色无关 ── */
.drop {
  position: absolute;
  top: calc(100% - 12px);
  inset-inline: var(--gutter);
  max-width: 1184px;
  margin-inline: auto;
  padding: var(--sp-4) var(--sp-4) var(--sp-3);
  background: var(--paper-bright);
  color: var(--ink);
  border: 1px solid var(--ink);
  box-shadow: 0 28px 48px -28px rgb(43 42 40 / 0.4);
}
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.25s var(--ease),
    transform 0.25s var(--ease);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 760px) {
  .header {
    grid-template-columns: 1fr auto;
    padding-block: 12px;
  }
  .header__brand {
    font-size: var(--fs-16);
    letter-spacing: 0.18em;
    gap: 8px;
  }
  .header__nav,
  .header__date,
  .drop {
    display: none;
  }
  .header__menu {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 44px;
    min-height: 44px;
    padding-inline: 4px 0;
    margin-right: -4px;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: var(--fs-14);
    letter-spacing: 0.2em;
  }
}
</style>

<!-- 手机全屏菜单：模板里挂在 body 下，scoped 样式照样生效 -->
<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--gutter) var(--sp-8);
  background: var(--paper-bright);
  color: var(--ink);
}
.sheet__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  border-bottom: 1px solid var(--ink);
}
.sheet__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-16);
  letter-spacing: 0.18em;
}
.sheet__close {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 44px;
  min-height: 44px;
  padding-inline: 4px 0;
  margin-right: -4px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
}

.sheet__main {
  display: grid;
  margin-top: var(--sp-2);
}
.sheet__main a {
  display: flex;
  align-items: center;
  min-height: 60px;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-28);
  letter-spacing: 0.12em;
}
.sheet__main a[aria-current='page'] {
  border-bottom-color: var(--ink);
}

.sheet__label {
  margin-block: var(--sp-4) var(--sp-2);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}

.sheet-enter-active,
.sheet-leave-active {
  transition:
    opacity 0.3s var(--ease),
    transform 0.3s var(--ease);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
