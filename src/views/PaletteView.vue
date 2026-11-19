<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCopy } from '../composables/useCopy'
import { useTerm } from '../composables/useTerm'
import { SEASONS, TERMS, type SeasonKey, type Term } from '../data/terms'
import { chromaOf, contrast, deltaE, edgeOf, hueOf, isLight, onColor, rgbLabel } from '../utils/color'

/**
 * 色谱页：二十四色一次看全。
 * 可以按季节筛选，也可以按节气顺序或色相排列；点色块复制色值，点节气名回到那一页。
 */
const { today, backToToday } = useTerm()
backToToday()
const { copy } = useCopy()

type SeasonFilter = 'all' | SeasonKey
type Order = 'term' | 'hue'

const seasonOptions: { key: SeasonFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  ...SEASONS.map((s) => ({ key: s.key, label: s.char })),
]
const orderOptions: { key: Order; label: string }[] = [
  { key: 'term', label: '节气顺序' },
  { key: 'hue', label: '色相' },
]

const season = ref<SeasonFilter>('all')
const order = ref<Order>('term')

/**
 * 色相排序：红粉打头，经橙黄绿青到蓝；色相角从 -30° 起算，免得红色被劈在首尾两端。
 * 荼白、月白、老银、苍色、鸦青、玄色这几种素色没有可比的色相，单独排在最后，由浅到深。
 */
const NEUTRAL_CHROMA = 9.5
const HUE_SHIFT = 30
function hueKey(term: Term): number {
  const hex = term.color.hex
  if (chromaOf(hex) < NEUTRAL_CHROMA) return 1000 - contrast(hex, '#000000')
  return (hueOf(hex) + HUE_SHIFT) % 360
}

const visible = computed(() => {
  const list = season.value === 'all' ? [...TERMS] : TERMS.filter((t) => t.season === season.value)
  return order.value === 'hue' ? list.sort((a, b) => hueKey(a) - hueKey(b)) : list
})

const neutralCount = computed(() => visible.value.filter((t) => chromaOf(t.color.hex) < NEUTRAL_CHROMA).length)

/**
 * 相近的颜色：Lab 色差（ΔE）小于 12 的两种，放在一起比较。
 * 约 2 是肉眼刚好分辨，10 以上一眼就能看出是两种颜色，12 以内的单看一块容易认混。
 */
const NEAR_DE = 12
const pairs = (() => {
  const out: { a: Term; b: Term; de: number }[] = []
  for (let i = 0; i < TERMS.length; i++) {
    for (let j = i + 1; j < TERMS.length; j++) {
      const de = deltaE(TERMS[i].color.hex, TERMS[j].color.hex)
      if (de < NEAR_DE) out.push({ a: TERMS[i], b: TERMS[j], de })
    }
  }
  return out.sort((x, y) => x.de - y.de)
})()

/** 每个节气色最像的那一个（已按色差从小到大，先到先得） */
const nearest = new Map<number, Term>()
for (const p of pairs) {
  if (!nearest.has(p.a.index)) nearest.set(p.a.index, p.b)
  if (!nearest.has(p.b.index)) nearest.set(p.b.index, p.a)
}

const pad = (n: number) => String(n).padStart(2, '0')

function chipOf(term: Term) {
  const hex = term.color.hex
  const near = nearest.get(term.index)
  return {
    term,
    hex,
    on: onColor(hex),
    // 浅色节气靠一圈细线和纸分开；深色的线是透明的
    edge: isLight(hex) ? edgeOf(hex) : 'transparent',
    // 每块的刷痕错开一点位置，二十四块排在一起不会是同一张纹理
    shiftX: `${-((term.index * 137) % 780)}px`,
    shiftY: `${-((term.index * 89) % 780)}px`,
    near: near ? { name: near.color.name, hex: near.color.hex } : null,
  }
}
const chips = computed(() => visible.value.map(chipOf))
</script>

<template>
  <section class="pal" aria-labelledby="pal-title">
    <header class="wrap pal__head">
      <p class="pal__eyebrow">色谱</p>
      <h1 id="pal-title" class="pal__title">二十四色</h1>
      <p class="lede">
        每个节气一种颜色，从春的松花到冬末的鸦青。点任意一块复制它的色值，点节气名回到那一页。
      </p>
    </header>

    <div class="wrap">
      <div class="tools">
        <div class="tools__group" role="group" aria-label="按季节筛选">
          <button
            v-for="o in seasonOptions"
            :key="o.key"
            type="button"
            :aria-pressed="season === o.key"
            @click="season = o.key"
          >
            {{ o.label }}
          </button>
        </div>
        <div class="tools__group" role="group" aria-label="排列方式">
          <button
            v-for="o in orderOptions"
            :key="o.key"
            type="button"
            :aria-pressed="order === o.key"
            @click="order = o.key"
          >
            {{ o.label }}
          </button>
        </div>
        <p class="tools__count" role="status">
          共 <span class="latin">{{ visible.length }}</span> 色<template v-if="order === 'hue' && neutralCount"
            >，其中 {{ neutralCount }} 种素色排在最后</template
          >
        </p>
      </div>

      <ul class="grid">
        <li v-for="(c, i) in chips" :key="c.term.index" v-reveal="(i % 6) * 50" class="chip">
          <button
            class="chip__swatch pigment"
            type="button"
            :style="{ '--sw': c.hex, '--edge': c.edge, '--tx': c.shiftX, '--ty': c.shiftY, color: c.on }"
            :aria-label="`复制${c.term.color.name} ${c.hex}`"
            @click="copy(c.hex)"
          >
            <span class="chip__no latin" aria-hidden="true">{{ pad(c.term.index) }}</span>
            <span class="chip__vert" aria-hidden="true">{{ c.term.color.name }}</span>
            <span v-if="c.term.index === today.term.index" class="chip__today" aria-hidden="true">今日</span>
          </button>

          <div class="chip__info">
            <p class="chip__name">
              {{ c.term.color.name }}<span class="latin">{{ c.term.color.pinyin }}</span>
            </p>
            <p class="chip__value latin">{{ c.hex }}</p>
            <p class="chip__value latin">RGB {{ rgbLabel(c.hex) }}</p>
            <RouterLink class="chip__term" :to="{ name: 'term', params: { slug: c.term.slug } }">
              {{ c.term.name }}<span aria-hidden="true"> →</span>
            </RouterLink>
            <p v-if="c.near" class="chip__near">
              <i :style="{ background: c.near.hex }" aria-hidden="true"></i>与{{ c.near.name }}相近
            </p>
          </div>
        </li>
      </ul>
    </div>

    <section class="similar section" aria-labelledby="similar-title">
      <div class="wrap">
        <header class="similar__head">
          <h2 id="similar-title" v-reveal class="section-title">容易认混的几对</h2>
          <p v-reveal="80" class="lede">
            有些颜色在屏幕上挨得很近，单看一块容易认混，并排才看得出差别。色差用 Lab 空间里的距离（ΔE）表示：约 2 是肉眼刚好分辨，10 以上一眼就能看出是两种颜色。这几对都在 12 以内；它们都是通行的传统色名，所以都保留，靠节气和名字区分。
          </p>
        </header>

        <ul class="pairs">
          <li v-for="(p, i) in pairs" :key="`${p.a.index}-${p.b.index}`" v-reveal="(i % 2) * 60" class="pair">
            <span class="pair__swatches" aria-hidden="true">
              <i :style="{ background: p.a.color.hex, '--edge': isLight(p.a.color.hex) ? edgeOf(p.a.color.hex) : 'transparent' }"></i>
              <i :style="{ background: p.b.color.hex, '--edge': isLight(p.b.color.hex) ? edgeOf(p.b.color.hex) : 'transparent' }"></i>
            </span>
            <p class="pair__names">
              <RouterLink :to="{ name: 'term', params: { slug: p.a.slug } }">{{ p.a.color.name }}<small>{{ p.a.name }}</small></RouterLink>
              <span class="pair__vs" aria-hidden="true">与</span>
              <span class="sr-only">与</span>
              <RouterLink :to="{ name: 'term', params: { slug: p.b.slug } }">{{ p.b.color.name }}<small>{{ p.b.name }}</small></RouterLink>
            </p>
            <p class="pair__de latin"><span class="sr-only">色差</span>ΔE {{ p.de.toFixed(1) }}</p>
          </li>
        </ul>

        <p v-reveal class="similar__note">
          色值是为屏幕拟定的近似值：同一个色名在不同典籍与色谱里的取值并不统一，这里取的是看上去最贴合名字的一种。纸面印刷会有出入。
        </p>
      </div>
    </section>
  </section>
</template>

<style scoped>
.pal__head {
  display: grid;
  gap: var(--sp-2);
  padding-block: 168px var(--sp-6);
}
.pal__eyebrow {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.pal__title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.75rem, 7vw, 5.5rem);
  line-height: 1.15;
  letter-spacing: 0.06em;
}

/* ── 筛选 ── */
.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2) var(--sp-4);
  padding-block: var(--sp-2);
  border-block: 1px solid var(--ink);
}
.tools__group {
  display: flex;
}
.tools__group button {
  min-width: 3.25em;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  margin-left: -1px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-14);
  letter-spacing: 0.12em;
  transition:
    background 0.25s,
    color 0.25s;
}
.tools__group button:first-child {
  margin-left: 0;
}
.tools__group button:hover {
  background: var(--paper-bright);
}
.tools__group button[aria-pressed='true'] {
  position: relative;
  z-index: 1;
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}
.tools__count {
  margin-left: auto;
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  color: var(--ink-2);
}

/* ── 色块 ── */
.grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--sp-6) var(--sp-3);
  padding-block: var(--sp-6) clamp(72px, 11vw, 152px);
}

.chip__swatch {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: var(--sw);
  box-shadow: inset 0 0 0 1px var(--edge);
  text-align: left;
  transition:
    transform 0.5s var(--ease),
    box-shadow 0.5s var(--ease);
}
/* 每块的刷痕错开位置 */
.chip__swatch.pigment::before {
  background-position: var(--tx) var(--ty);
}
.chip__swatch:focus-visible {
  outline-offset: -8px;
}
.chip__no {
  position: absolute;
  left: 12px;
  bottom: 10px;
  font-size: var(--fs-14);
  letter-spacing: 0.1em;
  opacity: 0.85;
}
.chip__vert {
  position: absolute;
  top: 16px;
  right: 14px;
  writing-mode: vertical-rl;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  letter-spacing: 0.2em;
}
.chip__today {
  position: absolute;
  left: 12px;
  top: 12px;
  padding: 2px 8px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-12);
  letter-spacing: 0.1em;
}

.chip__info {
  display: grid;
  gap: 2px;
  padding-top: 12px;
}
.chip__name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.6em;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-20);
  letter-spacing: 0.1em;
}
.chip__name .latin {
  font-weight: 400;
  font-size: var(--fs-14);
  letter-spacing: 0.04em;
  color: var(--ink-2);
}
.chip__value {
  font-size: var(--fs-14);
  letter-spacing: 0.06em;
  color: var(--ink-2);
}
.chip__term {
  justify-self: start;
  margin-top: 6px;
  padding-block: 4px;
  border-bottom: 1px solid transparent;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.12em;
  transition: border-color 0.25s;
}
.chip__term:hover {
  border-color: currentColor;
}
.chip__near {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  color: var(--ink-2);
}
.chip__near i {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--line);
}

@media (hover: hover) {
  .chip__swatch:hover {
    transform: translateY(-6px);
    box-shadow:
      inset 0 0 0 1px var(--edge),
      0 18px 28px -18px rgb(43 42 40 / 0.45);
  }
}

/* ── 相近的颜色 ── */
.similar {
  background: var(--paper-bright);
  border-top: 1px solid var(--line);
}
.similar__head {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: end;
  column-gap: clamp(32px, 6vw, 96px);
  row-gap: var(--sp-3);
  margin-bottom: var(--sp-8);
}
.similar__head .lede {
  max-width: 34em;
  font-size: var(--fs-14);
  line-height: 1.9;
}

.pairs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 clamp(32px, 6vw, 96px);
}
.pair {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--sp-3);
  padding-block: var(--sp-2);
  border-top: 1px solid var(--line);
}
.pair__swatches {
  display: flex;
}
.pair__swatches i {
  width: 56px;
  height: 56px;
  box-shadow: inset 0 0 0 1px var(--edge);
}
.pair__swatches i + i {
  margin-left: -1px;
}
.pair__names {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 0.6em;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-20);
  letter-spacing: 0.1em;
}
.pair__names a {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4em;
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s;
}
.pair__names a:hover {
  border-color: currentColor;
}
.pair__names small {
  font-weight: 400;
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  color: var(--ink-2);
}
.pair__vs {
  font-weight: 400;
  font-size: var(--fs-14);
  color: var(--ink-2);
}
.pair__de {
  font-size: 1.125rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.similar__note {
  max-width: 46em;
  margin-top: var(--sp-6);
  font-size: var(--fs-14);
  line-height: 1.9;
  color: var(--ink-2);
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .similar__head,
  .pairs {
    grid-template-columns: minmax(0, 1fr);
  }
  .similar__head {
    margin-bottom: var(--sp-6);
  }
  .pair:last-child {
    border-bottom: 1px solid var(--line);
  }
}

@media (max-width: 760px) {
  .pal__head {
    padding-top: 128px;
  }
  .tools__count {
    margin-left: 0;
    flex-basis: 100%;
  }
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-4) var(--sp-2);
  }
  .chip__vert {
    font-size: 1.5rem;
  }
}

@media (min-width: 561px) and (max-width: 760px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
