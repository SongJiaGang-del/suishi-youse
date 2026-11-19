import { computed, ref, watchEffect } from 'vue'
import { TERMS, termOfDate, type Term } from '../data/terms'
import { blockOf, deepOf, edgeOf, isLight, onColor, washOf } from '../utils/color'

const now = new Date()
const today = termOfDate(now)

/** 当前页面主色所属的节气：首页是今天所在的节气，详情页由网址决定 */
const selectedIndex = ref(today.term.index)

const term = computed<Term>(() => TERMS[selectedIndex.value - 1])
const isToday = computed(() => selectedIndex.value === today.term.index)

const theme = computed(() => {
  const hex = term.value.color.hex
  return {
    main: hex,
    on: onColor(hex),
    deep: deepOf(hex),
    wash: washOf(hex),
    // 大色块铺底的颜色与浅色节气的边线；深色节气的边线是透明的，换节气时淡入淡出
    block: blockOf(hex),
    edge: isLight(hex) ? edgeOf(hex) : 'transparent',
  }
})

let bound = false
function bindTheme() {
  if (bound) return
  bound = true
  watchEffect(() => {
    const s = document.documentElement.style
    s.setProperty('--c', theme.value.main)
    s.setProperty('--on-c', theme.value.on)
    s.setProperty('--c-deep', theme.value.deep)
    s.setProperty('--c-wash', theme.value.wash)
    s.setProperty('--c-block', theme.value.block)
    s.setProperty('--c-edge', theme.value.edge)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.value.main)
  })
}

export function useTerm() {
  bindTheme()
  return {
    now,
    today,
    todayTerm: today.term,
    dayOfTerm: today.dayOfTerm,
    term,
    theme,
    isToday,
    select(index: number) {
      selectedIndex.value = index
    },
    backToToday() {
      selectedIndex.value = today.term.index
    },
  }
}
