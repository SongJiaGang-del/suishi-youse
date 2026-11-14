<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useTerm } from '../composables/useTerm'
import { SEASONS, TERMS, type Term } from '../data/terms'
import { onColor } from '../utils/color'

const { term, todayTerm, isToday, select, backToToday } = useTerm()

/** 悬停或聚焦时临时预览的节气；为空则显示当前选中的节气 */
const hovered = ref<Term | null>(null)
const shown = computed(() => hovered.value ?? term.value)

const R_IN = 232
const R_OUT = 312
const R_LABEL = 362
const STEP = 360 / TERMS.length
const GAP = 1

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [+(r * Math.cos(a)).toFixed(2), +(r * Math.sin(a)).toFixed(2)] as const
}

/** 立春从正上方起，顺时针排列；四个象限恰好是四季 */
const segments = TERMS.map((t, i) => {
  const a0 = -90 + i * STEP + GAP / 2
  const a1 = -90 + (i + 1) * STEP - GAP / 2
  const mid = -90 + (i + 0.5) * STEP
  const [x0, y0] = polar(R_OUT, a0)
  const [x1, y1] = polar(R_OUT, a1)
  const [x2, y2] = polar(R_IN, a1)
  const [x3, y3] = polar(R_IN, a0)
  const [lx, ly] = polar(R_LABEL, mid)
  const [dx, dy] = polar(1, mid)
  const [mx, my] = polar(R_IN - 12, mid)
  return {
    term: t,
    d: `M${x0} ${y0}A${R_OUT} ${R_OUT} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${R_IN} ${R_IN} 0 0 0 ${x3} ${y3}Z`,
    lx,
    ly,
    dx,
    dy,
    mx,
    my,
  }
})

/** 内圈 72 道刻度：每个节气三候 */
const ticks = Array.from({ length: 72 }, (_, i) => {
  const deg = -90 + i * 5
  const major = i % 3 === 0
  const [x1, y1] = polar(major ? 190 : 198, deg)
  const [x2, y2] = polar(206, deg)
  return { x1, y1, x2, y2, major }
})

const seasonMarks = SEASONS.map((s, i) => {
  const [x, y] = polar(166, -45 + i * 90)
  return { char: s.char, x, y }
})

const todaySeg = segments[todayTerm.index - 1]

// 手机端色带：把当前节气滚到中间
const strip = ref<HTMLElement | null>(null)
function centerStrip(smooth: boolean) {
  const el = strip.value
  const active = el?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!el || !active) return
  el.scrollTo({
    left: active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2,
    behavior: smooth ? 'smooth' : 'auto',
  })
}
onMounted(() => centerStrip(false))
watch(term, () => nextTick(() => centerStrip(true)))
</script>

<template>
  <section id="wheel" class="wheel section" aria-labelledby="wheel-title">
    <div class="wrap wheel__grid">
      <div class="wheel__text">
        <h2 id="wheel-title" v-reveal class="section-title">岁时轮</h2>
        <p v-reveal="80" class="lede">
          二十四段色弧首尾相接，就是一年。从正上方的立春起，顺时针走过春、夏、秋、冬。点选任意一段，整个页面换成那个节气的颜色。
        </p>

        <dl v-reveal="160" class="wheel__detail">
          <div>
            <dt>节气</dt>
            <dd>
              <strong>{{ term.name }}</strong>
              <span class="latin wheel__pinyin">{{ term.pinyin }}</span>
            </dd>
          </div>
          <div>
            <dt>交节</dt>
            <dd>{{ term.dateLabel.replace('月', ' 月 ').replace('日', ' 日') }}</dd>
          </div>
          <div>
            <dt>主色</dt>
            <dd>
              <i class="wheel__dot" aria-hidden="true"></i>{{ term.color.name }}
              <span class="latin">{{ term.color.hex }}</span>
            </dd>
          </div>
          <div>
            <dt>三候</dt>
            <dd class="wheel__pentads">
              <span v-for="p in term.pentads" :key="p">{{ p }}</span>
            </dd>
          </div>
        </dl>

        <div v-reveal="220" class="wheel__actions">
          <a class="link" href="#top">回到顶部看{{ term.name }}<span aria-hidden="true">↑</span></a>
          <button v-if="!isToday" class="link" type="button" @click="backToToday">回到今日节气</button>
        </div>
      </div>

      <!-- 桌面端：圆环 -->
      <div v-reveal="120" class="wheel__figure">
        <svg viewBox="-400 -400 800 800" role="group" aria-label="岁时轮：二十四节气色环">
          <!-- 中心色盘：显示悬停或选中的节气 -->
          <circle class="disc" r="150" :fill="shown.color.hex" />
          <g class="disc__text" :fill="onColor(shown.color.hex)" aria-hidden="true">
            <text class="disc__date latin" y="-80">{{ shown.dateLabel }}</text>
            <text class="disc__name" y="12">{{ shown.name }}</text>
            <text class="disc__color" y="62">{{ shown.color.name }}</text>
            <text class="disc__hex latin" y="92">{{ shown.color.hex }}</text>
          </g>

          <g class="ticks" aria-hidden="true">
            <line v-for="(t, i) in ticks" :key="i" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" :class="{ major: t.major }" />
          </g>
          <g class="seasons" aria-hidden="true">
            <text v-for="s in seasonMarks" :key="s.char" :x="s.x" :y="s.y">{{ s.char }}</text>
          </g>

          <circle class="today" :cx="todaySeg.mx" :cy="todaySeg.my" r="4.5" aria-hidden="true" />

          <g
            v-for="s in segments"
            :key="s.term.index"
            class="seg"
            :class="{ 'is-active': s.term.index === term.index }"
            role="button"
            tabindex="0"
            :aria-pressed="s.term.index === term.index"
            :aria-label="`${s.term.name}，${s.term.color.name}，${s.term.dateLabel}`"
            :style="{ '--dx': s.dx, '--dy': s.dy }"
            @mouseenter="hovered = s.term"
            @mouseleave="hovered = null"
            @focus="hovered = s.term"
            @blur="hovered = null"
            @click="select(s.term.index)"
            @keydown.enter.prevent="select(s.term.index)"
            @keydown.space.prevent="select(s.term.index)"
          >
            <path class="seg__arc" :d="s.d" :fill="s.term.color.hex" />
            <text class="seg__label" :x="s.lx" :y="s.ly">{{ s.term.name }}</text>
          </g>
        </svg>
        <p class="wheel__legend"><i aria-hidden="true"></i>圆点标出今天所在的节气</p>
      </div>

      <!-- 手机端：可横向滑动的色带 -->
      <div ref="strip" class="wheel__strip" role="group" aria-label="二十四节气色带">
        <button
          v-for="t in TERMS"
          :key="t.index"
          type="button"
          class="swatch"
          :aria-pressed="t.index === term.index"
          :aria-label="`${t.name}，${t.color.name}`"
          :style="{ background: t.color.hex, color: onColor(t.color.hex) }"
          @click="select(t.index)"
        >
          <span class="swatch__name">{{ t.name }}</span>
          <span class="swatch__color">{{ t.color.name }}</span>
          <span v-if="t.index === todayTerm.index" class="swatch__today">今</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wheel__grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: center;
  column-gap: clamp(32px, 6vw, 96px);
}

.lede {
  margin-top: var(--sp-3);
}

.wheel__detail {
  margin-top: var(--sp-6);
  border-top: 1px solid var(--ink);
}
.wheel__detail div {
  display: grid;
  grid-template-columns: 4.5em 1fr;
  align-items: baseline;
  padding-block: 14px;
  border-bottom: 1px solid var(--line);
}
.wheel__detail dt {
  font-size: var(--fs-14);
  letter-spacing: 0.3em;
  color: var(--ink-2);
}
.wheel__detail dd {
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: 0.06em;
}
.wheel__pentads {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 1.2em;
}
.wheel__pentads span {
  white-space: nowrap;
}
.wheel__detail strong {
  font-weight: 900;
  font-size: var(--fs-28);
  letter-spacing: 0.1em;
  color: var(--c-deep);
}
.wheel__detail .latin {
  margin-left: 12px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.wheel__pinyin {
  font-style: italic;
}
.wheel__dot {
  display: inline-block;
  width: 0.8em;
  height: 0.8em;
  margin-right: 10px;
  border-radius: 50%;
  background: var(--c);
  box-shadow: 0 0 0 1px var(--line);
  vertical-align: -0.05em;
}

.wheel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  margin-top: var(--sp-4);
  color: var(--c-deep);
}

/* ── 圆环 ── */
.wheel__figure {
  position: relative;
  max-width: 720px;
  width: 100%;
  justify-self: end;
}
.wheel__figure svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.disc {
  transition: fill 0.45s var(--ease);
}
.disc__text {
  text-anchor: middle;
  transition: fill 0.45s var(--ease);
}
.disc__date {
  font-size: 19px;
  letter-spacing: 0.08em;
}
.disc__name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 76px;
  letter-spacing: 0.06em;
}
.disc__color {
  font-family: var(--font-kai);
  font-size: 25px;
  letter-spacing: 0.3em;
}
.disc__hex {
  font-size: 17px;
  letter-spacing: 0.12em;
}

.ticks line {
  stroke: var(--ink-2);
  stroke-width: 1;
  opacity: 0.45;
}
.ticks line.major {
  stroke: var(--ink);
  opacity: 1;
}
.seasons text {
  text-anchor: middle;
  dominant-baseline: central;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  fill: var(--ink-2);
}
.today {
  fill: var(--ink);
}

.seg {
  cursor: pointer;
  outline: none;
}
.seg__arc {
  stroke: var(--line);
  stroke-width: 1;
  transition:
    transform 0.45s var(--ease),
    stroke 0.3s;
}
.seg__label {
  text-anchor: middle;
  dominant-baseline: central;
  font-family: var(--font-display);
  font-size: 17px;
  fill: var(--ink-2);
  transition:
    transform 0.45s var(--ease),
    fill 0.3s;
}
.seg:hover .seg__arc,
.seg:focus-visible .seg__arc {
  transform: translate(calc(var(--dx) * 8px), calc(var(--dy) * 8px));
}
.seg.is-active .seg__arc {
  transform: translate(calc(var(--dx) * 18px), calc(var(--dy) * 18px));
  stroke: var(--ink);
}
.seg:hover .seg__label,
.seg:focus-visible .seg__label {
  fill: var(--ink);
}
.seg.is-active .seg__label {
  transform: translate(calc(var(--dx) * 10px), calc(var(--dy) * 10px));
  fill: var(--ink);
  font-weight: 900;
}
.seg:focus-visible .seg__arc {
  stroke: var(--ink);
  stroke-width: 3;
}

.wheel__legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: var(--sp-2);
  font-size: var(--fs-12);
  letter-spacing: 0.1em;
  color: var(--ink-2);
}
.wheel__legend i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ink);
}

.wheel__strip {
  display: none;
}

/* ── 手机 ── */
@media (max-width: 860px) {
  .wheel__grid {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--sp-6);
  }
  .wheel__figure {
    justify-self: center;
  }
}

@media (max-width: 760px) {
  .wheel__figure {
    display: none;
  }
  .wheel__strip {
    order: -1;
    display: flex;
    gap: 6px;
    margin-inline: calc(var(--gutter) * -1);
    padding: 4px var(--gutter) 12px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }
  .wheel__strip::-webkit-scrollbar {
    display: none;
  }
  .wheel__text {
    display: contents;
  }
  .wheel__text > .section-title {
    order: -3;
  }
  .wheel__text > .lede {
    order: -2;
    margin-top: calc(var(--sp-3) * -1);
  }
  .swatch {
    position: relative;
    flex: 0 0 64px;
    height: 176px;
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    scroll-snap-align: center;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
    transition: flex-basis 0.4s var(--ease);
  }
  .swatch[aria-pressed='true'] {
    flex-basis: 104px;
    box-shadow: inset 0 0 0 2px var(--ink);
  }
  .swatch__name {
    writing-mode: vertical-rl;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: var(--fs-20);
    letter-spacing: 0.2em;
  }
  .swatch__color {
    font-size: var(--fs-12);
    letter-spacing: 0.1em;
  }
  .swatch__today {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: var(--fs-12);
    line-height: 1;
  }
  .wheel__detail {
    margin-top: 0;
  }
  .wheel__actions {
    margin-top: 0;
  }
}
</style>
