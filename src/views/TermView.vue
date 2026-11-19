<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeroTerm from '../components/HeroTerm.vue'
import PaintingPlate from '../components/PaintingPlate.vue'
import PaletteCard from '../components/PaletteCard.vue'
import { useTerm } from '../composables/useTerm'
import { contentOf } from '../data/content'
import { plateOfTerm } from '../data/paintings'
import { neighbours, ORDINALS, SEASONS, termBySlug } from '../data/terms'
import { blockOf, edgeOf, isLight, onColor } from '../utils/color'

/**
 * 节气页：一个节气一页，有自己的网址。
 * 从上到下：题头 → 这是个什么节气 → 三候 → 习俗与吃食 → 一首诗 → 颜色 → 古画（配到了才有）→ 前后节气。
 */
const route = useRoute()
const router = useRouter()
const { term, today, isToday, select } = useTerm()

// 网址说了算：slug 变了，整页的节气和颜色跟着变
watch(
  () => route.params.slug,
  (slug) => {
    const t = slug ? termBySlug(String(slug)) : undefined
    if (t) select(t.index)
  },
  { immediate: true },
)

// 带锚点进来（如 #palette）要立刻有目标；否则等首屏画完再挂载后面的段落
const rest = ref(Boolean(route.hash))
let restTimer: number | undefined
onMounted(() => {
  if (!rest.value) restTimer = window.setTimeout(() => (rest.value = true), 800)
})
onBeforeUnmount(() => window.clearTimeout(restTimer))

const content = computed(() => contentOf(term.value))
const season = computed(() => SEASONS.find((s) => s.key === term.value.season)!)
const plate = computed(() => plateOfTerm(term.value.index))
const around = computed(() => {
  const { prev, next } = neighbours(term.value)
  // 邻居是浅色节气时，门的边缘加一条细线，不让它融进纸里
  const door = (t: typeof prev, dir: string, cls: string) => ({
    term: t,
    dir,
    cls,
    on: onColor(t.color.hex),
    block: blockOf(t.color.hex),
    edge: isLight(t.color.hex) ? edgeOf(t.color.hex) : 'transparent',
  })
  return [door(prev, '上一个节气', 'pager__link--prev'), door(next, '下一个节气', 'pager__link--next')]
})

/**
 * ← / → 翻到上一个、下一个节气。
 * 不抢别处的按键：带修饰键、在输入框里、已被别处处理、手机菜单开着（#app 被置为 inert）时都不翻。
 */
function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  const el = e.target instanceof HTMLElement ? e.target : null
  if (el?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return
  if (document.getElementById('app')?.hasAttribute('inert')) return
  const { prev, next } = neighbours(term.value)
  const to = e.key === 'ArrowLeft' ? prev : next
  router.push({ name: 'term', params: { slug: to.slug } })
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

const pentadLabels = ['初候', '二候', '三候']
const pentadDays = ['第 1–5 天', '第 6–10 天', '第 11 天起']
/** 今天落在第几候（0–2）；只有看的正是今天的节气时才用得上 */
const todayPentad = Math.min(2, Math.floor((today.dayOfTerm - 1) / 5))
</script>

<template>
  <!-- 以节气为 key：换节气时整页重新入场，不留上一页的状态 -->
  <article :key="term.index" class="term">
    <HeroTerm />

    <section id="read" class="read section" aria-labelledby="read-title">
      <div class="wrap read__grid">
        <div class="read__side">
          <h2 id="read-title" v-reveal class="section-title">时令</h2>
          <dl v-reveal="80" class="facts">
            <div>
              <dt>次序</dt>
              <dd>二十四节气之第{{ ORDINALS[term.index - 1] }}</dd>
            </div>
            <div>
              <dt>季节</dt>
              <dd>{{ season.char }}，{{ season.range }}</dd>
            </div>
            <div>
              <dt>交节</dt>
              <dd>每年 <span class="latin">{{ term.dateLabel }}</span> 前后</dd>
            </div>
            <div>
              <dt>太阳黄经</dt>
              <dd><span class="latin">{{ term.longitude }}°</span></dd>
            </div>
          </dl>
        </div>

        <div class="read__body">
          <p v-reveal class="read__brief">{{ content.brief }}</p>
          <p v-reveal="80">{{ content.intro[0] }}</p>
          <p v-reveal="140">{{ content.intro[1] }}</p>
          <p v-if="isToday" v-reveal="200" class="read__now">
            今天是{{ term.name }}的第 <span class="latin">{{ today.dayOfTerm }}</span> 天，眼下是{{
              pentadLabels[todayPentad]
            }}“{{ term.pentads[todayPentad] }}”。距{{ today.next.name }}还有
            <span class="latin">{{ today.daysToNext }}</span> 天。
          </p>
        </div>
      </div>
    </section>

    <!-- 首屏之外的各段等首屏画完再挂载：它们用到的字体分包也就晚于首屏下载，不和题头抢带宽 -->
    <template v-if="rest">
    <section class="pentads section defer" aria-labelledby="pentads-title">
      <div class="wrap">
        <header class="head">
          <h2 id="pentads-title" v-reveal class="section-title">三候</h2>
          <p v-reveal="80" class="lede">
            古人把一个节气再分成三候，五天一候，每一候记一件这时节看得见的事：哪种花开了，哪种鸟来了，水和土有什么变化。
          </p>
        </header>

        <ol class="pentads__list">
          <li
            v-for="(p, i) in term.pentads"
            :id="`pentad-${i}`"
            :key="i"
            v-reveal="i * 90"
            :class="{ 'is-now': isToday && i === todayPentad }"
          >
            <p class="pentads__no">
              <span>{{ pentadLabels[i] }}</span>
              <span class="pentads__days">{{ pentadDays[i] }}</span>
              <em v-if="isToday && i === todayPentad">眼下</em>
            </p>
            <h3 class="pentads__name">{{ p }}</h3>
            <p class="pentads__text">{{ content.pentads[i] }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="life section defer" aria-label="习俗与时食">
      <div class="wrap life__grid">
        <div>
          <h2 v-reveal class="section-title">习俗</h2>
          <ul class="entries">
            <li v-for="(c, i) in content.customs" :key="c.name" v-reveal="i * 80">
              <h3>{{ c.name }}</h3>
              <p>{{ c.text }}</p>
            </li>
          </ul>
        </div>
        <div>
          <h2 v-reveal class="section-title">时食</h2>
          <ul class="entries">
            <li v-for="(f, i) in content.foods" :key="f.name" v-reveal="i * 80">
              <h3>{{ f.name }}</h3>
              <p>{{ f.text }}</p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="poem pigment defer" aria-labelledby="poem-title">
      <div class="wrap poem__inner">
        <p v-reveal class="poem__label">一首诗</p>
        <div v-reveal="80" class="poem__lines">
          <p v-for="line in content.poem.lines" :key="line">{{ line }}</p>
        </div>
        <div v-reveal="160" class="poem__by">
          <h2 id="poem-title" class="poem__title">
            《{{ content.poem.title }}》<span v-if="content.poem.excerpt">节选</span>
          </h2>
          <p>{{ content.poem.dynasty }} · {{ content.poem.author }}</p>
        </div>
      </div>
    </section>

    <PaletteCard class="defer" />

    <PaintingPlate v-if="plate" class="defer" :plate="plate" />

    <nav class="pager defer" aria-label="前后节气">
      <RouterLink
        v-for="a in around"
        :key="a.term.index"
        class="pager__link pigment"
        :class="a.cls"
        :to="{ name: 'term', params: { slug: a.term.slug } }"
        :style="{ background: a.block, color: a.on, '--edge': a.edge }"
      >
        <span class="pager__dir">{{ a.dir }}</span>
        <span class="pager__main">
          <span class="pager__name">{{ a.term.name }}</span>
          <span class="pager__meta">
            {{ a.term.color.name }}<i aria-hidden="true"></i><span class="latin">{{ a.term.dateLabel }}</span>
          </span>
        </span>
      </RouterLink>

      <div class="pager__foot">
        <p class="pager__home">
          <RouterLink class="link" :to="{ name: 'home' }">回到岁时轮</RouterLink>
          <RouterLink class="link" :to="{ name: 'home', hash: '#directory' }">看全部二十四节气</RouterLink>
          <RouterLink class="link" :to="{ name: 'palette' }">二十四色色谱</RouterLink>
        </p>
        <p class="pager__keys" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd> 翻页</p>
      </div>
    </nav>
    </template>
    <div v-else class="rest-hold" aria-hidden="true"></div>
  </article>
</template>

<style scoped>
/* 首屏（题头）之后的各段先不排版、不绘制，滚到跟前才算：
   省掉首屏的排版时间，也不会为了屏幕外的字去下载字体分包。
   尺寸写 auto：渲染过一次就记住真实高度，在此之前先用这个估值占位，免得滚动条乱跳 */
.rest-hold {
  /* 占住后面各段的位置，挂载时页脚不会往下跳 */
  min-height: 400svh;
}
.defer {
  content-visibility: auto;
  contain-intrinsic-size: auto 720px;
}

/* 各段共用的题头：左边大标题，右边一段说明 */
.head {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: end;
  column-gap: clamp(32px, 6vw, 96px);
  row-gap: var(--sp-3);
  margin-bottom: var(--sp-8);
}
.head .lede {
  max-width: 32em;
}

/* ── 时令：这是个什么节气 ── */
.read__grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  column-gap: clamp(32px, 6vw, 96px);
  row-gap: var(--sp-6);
}
.facts {
  margin-top: var(--sp-4);
  max-width: 340px;
  border-top: 1px solid var(--ink);
}
.facts div {
  display: grid;
  grid-template-columns: 6em 1fr;
  align-items: baseline;
  padding-block: 12px;
  border-bottom: 1px solid var(--line);
}
.facts dt {
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.facts dd {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.06em;
}
.facts .latin {
  font-size: 1.15em;
  font-weight: 400;
}

.read__body {
  max-width: 36em;
}
.read__body p + p {
  margin-top: 1.4em;
}
.read__body p {
  font-size: 1.125rem;
  line-height: 2.05;
  text-wrap: pretty;
}
.read__body .read__brief {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(1.625rem, 2.8vw, 2.25rem);
  line-height: 1.55;
  letter-spacing: 0.04em;
  color: var(--c-deep);
}
.read__body .read__now {
  margin-top: var(--sp-4);
  padding: 14px 18px;
  background: var(--c-wash);
  border-left: 3px solid var(--c-deep);
  font-size: var(--fs-16);
  line-height: 1.9;
}
.read__now .latin {
  font-size: 1.2em;
}

/* ── 三候 ── */
.pentads {
  background: var(--paper-bright);
  border-block: 1px solid var(--line);
}
.pentads__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: var(--sp-4);
  row-gap: var(--sp-6);
}
.pentads__list li {
  position: relative;
  padding-top: var(--sp-3);
  border-top: 1px solid var(--ink);
}
/* 从画上的物候标注跳过来时，把这一候亮一下 */
.pentads__list li.is-flash {
  animation: flash 2.4s var(--ease);
}
@keyframes flash {
  0%,
  60% {
    background: color-mix(in srgb, var(--c-deep) 14%, transparent);
  }
  100% {
    background: transparent;
  }
}
.pentads__list li.is-now::before {
  content: '';
  position: absolute;
  inset: -1px 0 auto 0;
  height: 6px;
  background: var(--c-deep);
}
.pentads__no {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.pentads__days {
  letter-spacing: 0.08em;
}
.pentads__no em {
  margin-left: auto;
  padding: 1px 8px 1px 10px;
  background: var(--c-deep);
  color: var(--paper-bright);
  font-family: var(--font-display);
  font-style: normal;
  font-weight: 600;
  font-size: var(--fs-12);
  letter-spacing: 0.2em;
}
.pentads__name {
  margin-top: var(--sp-2);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(var(--fs-28), 3vw, var(--fs-40));
  line-height: 1.3;
  letter-spacing: 0.08em;
}
.pentads__text {
  margin-top: var(--sp-2);
  max-width: 22em;
  line-height: 1.95;
  color: var(--ink);
}

/* ── 习俗与时食 ── */
.life__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(32px, 6vw, 96px);
  row-gap: var(--sp-8);
}
.entries {
  margin-top: var(--sp-4);
  border-top: 1px solid var(--ink);
}
.entries li {
  display: grid;
  grid-template-columns: minmax(0, 7em) minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--sp-3);
  padding-block: var(--sp-3);
  border-bottom: 1px solid var(--line);
}
.entries h3 {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-20);
  line-height: 1.5;
  letter-spacing: 0.1em;
  color: var(--c-deep);
}
.entries p {
  line-height: 1.95;
  text-wrap: pretty;
}

/* ── 一首诗：整幅铺主色 ── */
.poem {
  padding-block: clamp(80px, 12vw, 168px);
  background: var(--c-block);
  color: var(--on-c);
  /* 浅色节气上下各一条细线，托住色块；深色节气这条线是透明的 */
  border-block: 1px solid var(--c-edge);
}
.poem__inner {
  display: grid;
  justify-items: center;
  text-align: center;
}
.poem__label {
  font-size: var(--fs-14);
  letter-spacing: 0.3em;
  text-indent: 0.3em;
}
.poem__lines {
  margin-top: var(--sp-6);
  font-family: var(--font-kai);
  font-size: clamp(1.375rem, 3.2vw, 2.5rem);
  line-height: 2;
  letter-spacing: 0.14em;
}
.poem__by {
  margin-top: var(--sp-6);
  padding-top: var(--sp-3);
  border-top: 1px solid color-mix(in srgb, var(--on-c) 40%, transparent);
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
}
.poem__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-20);
  letter-spacing: 0.12em;
}
.poem__title span {
  margin-left: 0.2em;
  font-family: var(--font-body);
  font-weight: 400;
  font-size: var(--fs-12);
  letter-spacing: 0.2em;
}

/* ── 前后节气：一条矮矮的收尾栏，左右各是各的颜色 ──
   这是翻页用的，不是一段内容：高度压在 ~80px，字号只比正文标题大一点，
   免得几百像素高的两块饱和色压过刚读完的那首诗和那幅画 */
.pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--line);
  /* 覆盖 .defer 的 720px 估值：这一段只有 ~130px 高，估大了页尾会多出一片空白 */
  contain-intrinsic-size: auto 130px;
}
.pager__link {
  display: grid;
  align-content: center;
  gap: 0;
  min-height: clamp(76px, 6.5vw, 88px);
  padding: var(--sp-2) var(--gutter);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--edge, transparent);
}
.pager__link--next {
  justify-items: end;
  text-align: right;
}
.pager__link:focus-visible {
  outline-offset: -6px;
}
.pager__dir {
  font-size: var(--fs-12);
  letter-spacing: 0.2em;
}
.pager__link--prev .pager__dir::before {
  content: '← ';
}
.pager__link--next .pager__dir::after {
  content: ' →';
}
/* 节气名和「色名 — 日期」排在同一行；放不下时色名与日期整段落到下一行 */
.pager__main {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 1em;
}
.pager__link--next .pager__main {
  justify-content: flex-end;
}
.pager__name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(1.375rem, 2.2vw, 1.75rem);
  line-height: 1.25;
  letter-spacing: 0.08em;
  transition: transform 0.5s var(--ease);
}
.pager__link--prev:hover .pager__name {
  transform: translateX(-6px);
}
.pager__link--next:hover .pager__name {
  transform: translateX(6px);
}
.pager__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.8em;
  font-family: var(--font-text);
  font-size: var(--fs-14);
  letter-spacing: 0.12em;
}
.pager__meta i {
  width: 14px;
  height: 1px;
  background: currentColor;
}
.pager__meta .latin {
  letter-spacing: 0.06em;
}
/* 下面一行：回到别处的文字链接，加上键盘翻页的提示 */
.pager__foot {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px var(--sp-4);
  padding: var(--sp-2) var(--gutter);
  background: var(--paper);
}
.pager__home {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px var(--sp-4);
  font-size: var(--fs-14);
}
/* 键盘翻页的提示：只在有键盘的大屏上显示；读屏用户用不着，所以 aria-hidden */
.pager__keys {
  display: none;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.pager__keys kbd {
  display: inline-grid;
  place-items: center;
  min-width: 28px;
  height: 28px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--paper-bright);
  font-family: var(--font-latin);
  font-size: var(--fs-14);
  letter-spacing: 0;
  color: var(--ink);
}
@media (min-width: 1025px) and (hover: hover) and (pointer: fine) {
  .pager__keys {
    display: flex;
  }
}

@media (max-width: 860px) {
  .head,
  .read__grid,
  .life__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .head {
    margin-bottom: var(--sp-6);
  }
  .facts {
    max-width: none;
  }
  .pentads__list {
    grid-template-columns: minmax(0, 1fr);
  }
  .pentads__text {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .read__body p {
    font-size: 1rem;
  }
  .entries li {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 4px;
  }
  .poem__lines {
    letter-spacing: 0.06em;
  }
  .pager__link {
    min-height: 88px;
    padding-inline: 16px;
  }
  .pager__dir {
    letter-spacing: 0.14em;
  }
  /* 半屏宽放不下「节气名 + 色名 — 日期」一行：色名与日期单独占一行，上下排开，去掉中间那道线 */
  .pager__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    letter-spacing: 0.1em;
    white-space: nowrap;
  }
  .pager__link--next .pager__meta {
    align-items: flex-end;
  }
  .pager__meta i {
    display: none;
  }
}
</style>
