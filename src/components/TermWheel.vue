<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTerm } from '../composables/useTerm'
import { SEASONS, TERMS, type Term } from '../data/terms'
import { onColor } from '../utils/color'

/**
 * 岁时轮：首页的入口。二十四段色弧是二十四扇门，
 * 中心色盘预告指到的那个节气，墨线标出这一年已经走到哪里。
 */
const props = defineProps<{
  /** 中心色盘正在预告的节气 */
  shown: Term
}>()

const emit = defineEmits<{
  /** 鼠标或键盘焦点移到某一段上；移开时为 null */
  preview: [term: Term | null]
  /** 点了某一段。keyboard 为真表示是用回车触发的 */
  choose: [term: Term, keyboard: boolean]
}>()

const router = useRouter()
const { today } = useTerm()

const R_IN = 232
const R_OUT = 312
const R_LABEL = 362
const R_YEAR = 219
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
  return {
    term: t,
    href: router.resolve({ name: 'term', params: { slug: t.slug } }).href,
    d: `M${x0} ${y0}A${R_OUT} ${R_OUT} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${R_IN} ${R_IN} 0 0 0 ${x3} ${y3}Z`,
    lx,
    ly,
    dx,
    dy,
  }
})

/** 今天在环上的精确角度：节气的起点加上已经过去的天数 */
const todayDeg = -90 + (today.term.index - 1 + (today.dayOfTerm - 0.5) / today.length) * STEP
/** 今天落在第几候（0–2） */
const todayPentad = Math.min(2, Math.floor((today.dayOfTerm - 1) / 5))

/** 内圈 72 道刻度：每个节气三候。今天所在的那一候加重 */
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

/** 从立春到今天已经走过的弧 */
const yearArc = (() => {
  const [sx, sy] = polar(R_YEAR, -90)
  const [ex, ey] = polar(R_YEAR, todayDeg)
  const large = todayDeg + 90 > 180 ? 1 : 0
  return { d: `M${sx} ${sy}A${R_YEAR} ${R_YEAR} 0 ${large} 1 ${ex} ${ey}`, ex, ey }
})()

/** 今天所在的那一候，在刻度圈上描一小段 */
const pentadArc = (() => {
  const a0 = -90 + (today.term.index - 1) * STEP + todayPentad * 5
  const [sx, sy] = polar(202, a0)
  const [ex, ey] = polar(202, a0 + 5)
  return `M${sx} ${sy}A202 202 0 0 1 ${ex} ${ey}`
})()

const onShown = computed(() => onColor(props.shown.color.hex))

/** 窄屏不画外圈的节气名，圆环可以更大 */
const narrow = ref(false)
let mq: MediaQueryList | undefined
const sync = () => (narrow.value = !!mq?.matches)
onMounted(() => {
  mq = window.matchMedia('(max-width: 760px)')
  sync()
  mq.addEventListener('change', sync)
})
onBeforeUnmount(() => mq?.removeEventListener('change', sync))

const viewBox = computed(() => (narrow.value ? '-328 -328 656 656' : '-400 -400 800 800'))

function onPointer(e: PointerEvent, term: Term | null) {
  // 触屏的“悬停”不算数，否则手指抬起后预览会粘住
  if (e.pointerType === 'mouse') emit('preview', term)
}
</script>

<template>
  <figure class="wheel">
    <svg :viewBox="viewBox" role="group" aria-label="岁时轮：二十四节气色环，每一段通往一个节气">
      <!-- 中心色盘：预告指到的节气 -->
      <circle class="disc" r="150" :fill="shown.color.hex" />
      <g class="disc__text" :fill="onShown" aria-hidden="true">
        <text class="disc__date latin" y="-94">{{ shown.dateLabel }}</text>
        <text class="disc__name" y="-30">{{ shown.name }}</text>
        <text class="disc__verse" y="18">{{ shown.imagery[0] }}</text>
        <text class="disc__verse" y="48">{{ shown.imagery[1] }}</text>
        <text class="disc__color" y="98">
          {{ shown.color.name }}
          <tspan class="latin" dx="6">{{ shown.color.hex }}</tspan>
        </text>
      </g>

      <g class="ticks" aria-hidden="true">
        <line v-for="(t, i) in ticks" :key="i" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" :class="{ major: t.major }" />
        <path class="ticks__now" :d="pentadArc" />
      </g>
      <g class="seasons" aria-hidden="true">
        <text v-for="s in seasonMarks" :key="s.char" :x="s.x" :y="s.y">{{ s.char }}</text>
      </g>

      <!-- 今年走到哪里了 -->
      <g class="year" aria-hidden="true">
        <circle class="year__track" :r="R_YEAR" />
        <path class="year__done" :d="yearArc.d" />
        <circle class="year__now" :cx="yearArc.ex" :cy="yearArc.ey" r="6" />
      </g>

      <a
        v-for="s in segments"
        :key="s.term.index"
        class="seg"
        :class="{ 'is-shown': s.term.index === shown.index, 'is-today': s.term.index === today.term.index }"
        :href="s.href"
        :aria-label="`${s.term.name}，${s.term.color.name}，${s.term.dateLabel}${s.term.index === today.term.index ? '，今日节气' : ''}`"
        :aria-current="s.term.index === today.term.index ? 'date' : undefined"
        :style="{ '--dx': s.dx, '--dy': s.dy }"
        @pointerenter="onPointer($event, s.term)"
        @pointerleave="onPointer($event, null)"
        @focus="emit('preview', s.term)"
        @blur="emit('preview', null)"
        @click.prevent="emit('choose', s.term, $event.detail === 0)"
      >
        <path class="seg__arc" :d="s.d" :fill="s.term.color.hex" />
        <text v-if="!narrow" class="seg__label" :x="s.lx" :y="s.ly">{{ s.term.name }}</text>
      </a>
    </svg>

    <figcaption class="wheel__legend">
      <span><i class="wheel__key wheel__key--line" aria-hidden="true"></i>墨线：立春以来走过的日子</span>
      <span><i class="wheel__key wheel__key--dot" aria-hidden="true"></i>今天，{{ today.term.name }}第 {{ today.dayOfTerm }} 天</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.wheel {
  width: 100%;
}
.wheel svg {
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
  font-size: 18px;
  letter-spacing: 0.08em;
}
.disc__name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 62px;
  letter-spacing: 0.06em;
}
.disc__verse {
  font-family: var(--font-kai);
  font-size: 21px;
  letter-spacing: 0.22em;
}
.disc__color {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: 0.2em;
}
.disc__color .latin {
  font-weight: 400;
  letter-spacing: 0.08em;
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
.ticks__now {
  fill: none;
  stroke: var(--ink);
  stroke-width: 9;
}
.seasons text {
  text-anchor: middle;
  dominant-baseline: central;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  fill: var(--ink-2);
}

.year__track {
  fill: none;
  stroke: var(--line);
  stroke-width: 1;
}
.year__done {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2.5;
  stroke-linecap: round;
}
.year__now {
  fill: var(--ink);
  stroke: var(--paper);
  stroke-width: 2;
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
.seg.is-today .seg__arc {
  stroke: var(--ink);
  stroke-width: 2;
}
.seg.is-today .seg__label {
  fill: var(--ink);
  font-weight: 900;
}
.seg.is-shown .seg__arc {
  transform: translate(calc(var(--dx) * 14px), calc(var(--dy) * 14px));
  stroke: var(--ink);
}
.seg.is-shown .seg__label {
  transform: translate(calc(var(--dx) * 8px), calc(var(--dy) * 8px));
  fill: var(--ink);
}
.seg:focus-visible .seg__arc {
  stroke: var(--ink);
  stroke-width: 3;
}

.wheel__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 28px;
  margin-top: var(--sp-2);
  font-size: var(--fs-12);
  letter-spacing: 0.1em;
  color: var(--ink-2);
}
.wheel__legend span {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.wheel__key--line {
  width: 22px;
  height: 2px;
  background: var(--ink);
}
.wheel__key--dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ink);
}

@media (max-width: 760px) {
  .wheel__legend {
    margin-top: var(--sp-3);
  }
}
</style>
