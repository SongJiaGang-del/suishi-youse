<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTerm } from '../composables/useTerm'
import {
  closeness,
  HOLDER,
  leafLabel,
  LICENSE,
  paintingImage,
  paintingLabel,
  paintingOfPlate,
  paintingPage,
  type Plate,
} from '../data/paintings'
import { onColor } from '../utils/color'
import { smoothScrollTo } from '../utils/motion'

/**
 * 画里寻色：这个节气配的那幅古画，和画上最接近节气色的一处。
 * 没有配到画的节气不渲染这个组件，由节气页决定。
 */
const props = defineProps<{ plate: Plate }>()
const { term } = useTerm()

const pick = computed(() => props.plate)
const painting = computed(() => paintingOfPlate(pick.value))
const label = computed(() => paintingLabel(painting.value))
/** 右栏小字：册页写第几开，其余写形制 */
const kicker = computed(() => leafLabel(painting.value) || painting.value.format)
const src = computed(() => paintingImage(painting.value))

const status = ref<'loading' | 'ready' | 'error'>('loading')
watch(src, () => {
  status.value = 'loading'
})

const verdict = computed(() => {
  const name = term.value.color.name
  const de = pick.value.de
  const what = pick.value.subject
  if (de <= 3) return `画里的${what}，几乎就是${name}。`
  if (de <= 7) return `画里的${what}，与${name}相近。`
  if (de <= 10) return `画里的${what}，与${name}略有出入。`
  if (de <= 20) return `这幅画是按题材配的。画里最接近${name}的是${what}，也只得其意。`
  return `这幅画是按题材配的，画里并没有${name}。圈出来的${what}，只是最接近的一处，差得还远。`
})

/** 画上的物候标注；点一个，亮出它的名字，能对上三候的就跳到那一候 */
const marks = computed(() => pick.value.marks)
const active = ref<number | null>(null)
watch(pick, () => {
  active.value = null
})
const pentadLabels = ['初候', '二候', '三候']
function pentadName(i: number | undefined) {
  return i === undefined ? '' : `${pentadLabels[i]}“${term.value.pentads[i]}”`
}
function onMark(i: number) {
  active.value = active.value === i ? null : i
  const pe = marks.value[i]?.pentad
  if (pe === undefined) return
  const el = document.getElementById(`pentad-${pe}`)
  if (!el) return
  smoothScrollTo(el)
  el.classList.remove('is-flash')
  void el.offsetWidth
  el.classList.add('is-flash')
  setTimeout(() => el.classList.remove('is-flash'), 2600)
}

/**
 * 画的显示宽度：竖幅按高度封顶，小图最多放大到原图的 1.4 倍，免得发虚。
 * 横幅的册页算出来比栏宽还宽，照旧撑满。
 */
const UPSCALE = 1.4
const mountStyle = computed(() => {
  const { w, h } = painting.value
  return {
    '--leaf-w': `min(${Math.round(w * UPSCALE)}px, calc(min(80vh, 760px) * ${(w / h).toFixed(4)}))`,
  }
})

/**
 * 放大镜：把同一张图放大若干倍，让取色点落在圆心。
 * 大图放大 6 倍；小图少放大一些，放大镜里的像素才不至于太糊。
 */
const zoom = computed(() => Math.min(6, Math.max(3, painting.value.w / 100)))
const loupe = computed(() => {
  const ratio = painting.value.w / painting.value.h
  const kx = zoom.value
  const ky = zoom.value / ratio
  const px = (0.5 - (pick.value.x / 100) * kx) / (1 - kx)
  const py = (0.5 - (pick.value.y / 100) * ky) / (1 - ky)
  return {
    // 图片还没到时只露底色：放大镜和上面的画是同一张图，
    // 不能让它先把图拉一遍（那样懒加载就白做了，节气页首屏平白多下 100–200 KB）
    ...(status.value === 'ready' ? { backgroundImage: `url(${src.value})` } : {}),
    backgroundSize: `${zoom.value * 100}% auto`,
    backgroundPosition: `${(px * 100).toFixed(2)}% ${(py * 100).toFixed(2)}%`,
    // 圆心小圈的大小跟着倍数走，始终约等于取平均色的那一小块
    '--dot': `${(zoom.value * 2.25).toFixed(2)}%`,
  }
})

const alt = computed(
  () =>
    `${label.value}，馆方题名 ${painting.value.subtitle}。` +
    `${term.value.name}的取色点取的是${pick.value.subject}，在画面左起 ${Math.round(pick.value.x)}%、上起 ${Math.round(pick.value.y)}% 处。` +
    (marks.value.length ? `画上标出了${marks.value.map((m) => m.label).join('、')}。` : ''),
)

const credit = computed(() => {
  const p = painting.value
  const who = p.years ? `${p.artist}（${p.years}）` : p.artist
  return `${who}《${p.work}》，${p.dynasty}，${p.date}，${p.format}，${p.medium}。${HOLDER}藏，开放图像（${LICENSE}）。`
})
</script>

<template>
  <section id="painting" class="plate section" aria-labelledby="plate-title">
    <div class="wrap">
      <header class="plate__head">
        <h2 id="plate-title" v-reveal class="section-title">画里寻色</h2>
        <p v-reveal="80" class="lede">{{ pick.why }}</p>
      </header>

      <div v-reveal="120" class="plate__grid">
        <figure class="mount" :style="mountStyle">
          <div class="leaf" :style="{ aspectRatio: `${painting.w} / ${painting.h}` }">
            <img
              :key="src"
              :class="{ 'is-ready': status === 'ready' }"
              :src="src"
              :width="painting.w"
              :height="painting.h"
              :alt="alt"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
              @load="status = 'ready'"
              @error="status = 'error'"
            />

            <p v-if="status === 'error'" class="leaf__error">
              这幅画的图片没有载入。刷新页面试试，或者
              <a :href="paintingPage(painting)" target="_blank" rel="noopener noreferrer">到馆方页面看原作</a>。
            </p>

            <span
              v-if="status === 'ready'"
              class="mark"
              :class="{ 'mark--left': pick.x > 62 }"
              :style="{ left: `${pick.x}%`, top: `${pick.y}%`, '--x': pick.x }"
              aria-hidden="true"
            >
              <span class="mark__tag"><span>{{ pick.subject }} ·</span> <span>取色</span></span>
            </span>

            <template v-if="status === 'ready'">
              <button
                v-for="(m, i) in marks"
                :key="i"
                type="button"
                class="dot"
                :class="{ 'is-on': active === i, 'dot--left': m.x > 62, 'dot--link': m.pentad !== undefined }"
                :style="{ left: `${m.x}%`, top: `${m.y}%`, '--x': m.x }"
                :aria-label="`${m.label}${m.pentad !== undefined ? '，对应' + pentadName(m.pentad) : ''}`"
                @click="onMark(i)"
              >
                <span aria-hidden="true">{{ i + 1 }}</span>
                <span class="dot__tag" aria-hidden="true">{{ m.label }}</span>
              </button>
            </template>
          </div>

          <figcaption class="mount__caption">
            <span>{{ label }}</span>
            <span class="latin">{{ painting.subtitle }}</span>
          </figcaption>

          <ol v-if="marks.length" class="legend" aria-label="画上的物候">
            <li v-for="(m, i) in marks" :key="i">
              <button type="button" :class="{ 'is-on': active === i }" @click="onMark(i)">
                <b aria-hidden="true">{{ i + 1 }}</b>
                <span class="legend__what">{{ m.label }}</span>
                <span v-if="m.note" class="legend__note">{{ m.note }}</span>
                <span v-if="m.pentad !== undefined" class="legend__go">{{ pentadName(m.pentad) }} ↑</span>
              </button>
            </li>
          </ol>
        </figure>

        <div class="found">
          <p class="found__leaf">{{ kicker }}<span>{{ painting.name }}</span></p>
          <h3 class="found__title">到画里找{{ term.color.name }}</h3>
          <p class="found__verdict">{{ verdict }}</p>

          <div class="found__proof">
            <div v-if="status !== 'error'" class="loupe" :style="loupe" aria-hidden="true"><i></i></div>
            <dl class="pair">
              <div :style="{ background: pick.hex, color: onColor(pick.hex) }">
                <dt>画中取色 · {{ pick.subject }}</dt>
                <dd class="latin">{{ pick.hex }}</dd>
              </div>
              <div :style="{ background: term.color.hex, color: onColor(term.color.hex) }">
                <dt>节气色 · {{ term.color.name }}</dt>
                <dd class="latin">{{ term.color.hex }}</dd>
              </div>
            </dl>
          </div>

          <p class="found__de">
            色差 <span class="latin">ΔE {{ pick.de.toFixed(1) }}</span><i aria-hidden="true"></i>{{ closeness(pick.de) }}
          </p>

          <p class="found__credit">
            {{ credit }}<template v-if="painting.detail">这里只截了原画的一段。</template>
          </p>
          <a class="link found__link" :href="paintingPage(painting)" target="_blank" rel="noopener noreferrer">
            到馆方页面看原作<span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <p v-reveal class="plate__note">
        画是按题材配的：画的是这个节气的物候、花木或景致，才配给这个节气，颜色对不对得上不作为条件。画上圈出来的，是用程序在画里的主体（花、叶、果、雪）上找到的最接近节气色的一处，绢和纸的底子、印章、题跋与裱边都不算；色差按
        CIEDE2000 计算，数值越小越接近，取的是那一点附近一小块的平均色。带数字的小圆点标的是画里对得上这个节气的物候，能对上三候的，点一下就跳到那一候；画里没有画到的候，不硬配。网页用图裁去了裱边，标“局部”的只截了原画的一段。中文题名有馆方中文名的照录，没有的据英文题名意译，都不一定是画上原题。
      </p>
    </div>
  </section>
</template>

<style scoped>
.plate__head {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: end;
  column-gap: clamp(32px, 6vw, 96px);
  margin-bottom: var(--sp-8);
}
.plate__head .lede {
  max-width: 32em;
}

.plate__grid {
  display: grid;
  grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
  align-items: center;
  column-gap: clamp(32px, 5vw, 72px);
}

/* ── 画心与裱边 ── */
.mount {
  --pad: clamp(12px, 1.8vw, 26px);
  box-sizing: border-box;
  justify-self: center;
  width: 100%;
  max-width: calc(var(--leaf-w) + 2 * var(--pad));
  padding: var(--pad);
  padding-bottom: 0;
  background: var(--paper-bright);
  box-shadow:
    0 0 0 1px var(--line),
    0 40px 70px -48px rgb(43 42 40 / 0.55);
}
.leaf {
  position: relative;
  /* 取色点的标签要按画面宽度算还剩多少地方（cqw），免得压到版心之外 */
  container-type: inline-size;
  background: #e8e0d0;
  /* 取色点入场时从 1.8 倍缩小落下，标签跟着放大；不裁掉的话窄屏上这 0.7 秒会把页面撑宽、出现横向滚动 */
  overflow: hidden;
  overflow: clip;
}
.leaf img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.7s var(--ease);
}
.leaf img.is-ready {
  opacity: 1;
}
.leaf__error {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  padding: var(--sp-4);
  font-size: var(--fs-14);
  text-align: center;
  color: var(--ink-2);
}
.leaf__error a {
  border-bottom: 1px solid currentColor;
  color: var(--ink);
}

.mount__caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 2px 24px;
  padding-block: 12px 14px;
  font-family: var(--font-text);
  font-size: var(--fs-14);
  letter-spacing: 0.14em;
}
.mount__caption .latin {
  font-style: italic;
  font-size: 1rem;
  letter-spacing: 0.02em;
  color: var(--ink-2);
}

/* ── 取色点：空心圈，圈里看得见画上的原色 ── */
.mark {
  position: absolute;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin: -18px 0 0 -18px;
  border: 2px solid var(--paper-bright);
  box-shadow:
    0 0 0 1px rgb(26 25 23 / 0.7),
    inset 0 0 0 1px rgb(26 25 23 / 0.7);
  pointer-events: none;
  transition:
    left 0.8s var(--ease),
    top 0.8s var(--ease);
  animation: land 0.7s var(--ease) both;
}
.mark::after {
  content: '';
  position: absolute;
  inset: -9px;
  border: 1px solid var(--paper-bright);
  border-radius: 50%;
  animation: ripple 2.8s ease-out infinite;
}
.mark__tag {
  position: absolute;
  left: calc(100% + 14px);
  top: 50%;
  transform: translateY(-50%);
  padding: 5px 12px;
  background: var(--paper-bright);
  box-shadow: 0 0 0 1px rgb(26 25 23 / 0.2);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-14);
  letter-spacing: 0.14em;
  line-height: 1.5;
  /* 宽度按内容取；放不下时只在“节气名 ·”与“色名”之间折行，最宽不超过取色点到画边的距离 */
  width: max-content;
  max-width: calc((100 - var(--x, 50)) * 1cqw - var(--tag-off, 36px));
}
.mark__tag > span {
  white-space: nowrap;
}
.mark--left .mark__tag {
  left: auto;
  right: calc(100% + 14px);
  max-width: calc(var(--x, 50) * 1cqw - var(--tag-off, 36px));
}

@keyframes land {
  from {
    opacity: 0;
    scale: 1.8;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}
@keyframes ripple {
  0% {
    opacity: 0.9;
    transform: scale(0.8);
  }
  70%,
  100% {
    opacity: 0;
    transform: scale(1.7);
  }
}

/* ── 物候标注 ── */
.dot {
  position: absolute;
  width: 26px;
  height: 26px;
  margin: -13px 0 0 -13px;
  padding: 0;
  border-radius: 50%;
  background: rgb(26 25 23 / 0.78);
  color: var(--paper-bright);
  border: 1.5px solid var(--paper-bright);
  font-size: var(--fs-12);
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: scale 0.25s var(--ease), background 0.25s;
}
/* 点击区比圆点大，手机上好按 */
.dot::before {
  content: '';
  position: absolute;
  inset: -9px;
}
.dot:hover,
.dot.is-on {
  scale: 1.2;
  background: var(--c-deep);
  z-index: 2;
}
.dot:focus-visible {
  outline: 2px solid var(--paper-bright);
  outline-offset: 3px;
}
.dot__tag {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  padding: 3px 9px;
  background: var(--paper-bright);
  color: var(--ink);
  box-shadow: 0 0 0 1px rgb(26 25 23 / 0.2);
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.12em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.dot--left .dot__tag {
  left: auto;
  right: calc(100% + 8px);
}
.dot:hover .dot__tag,
.dot.is-on .dot__tag,
.dot:focus-visible .dot__tag {
  opacity: 1;
}

.legend {
  display: grid;
  gap: 2px;
  padding-block: 0 var(--sp-2);
  border-top: 1px solid var(--line);
  margin-top: 0;
}
.legend button {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 12px;
  width: 100%;
  padding: 8px 4px;
  text-align: left;
  font-size: var(--fs-14);
  line-height: 1.7;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background 0.2s;
}
.legend button:hover,
.legend button.is-on {
  background: color-mix(in srgb, var(--c-deep) 8%, transparent);
}
.legend b {
  flex: 0 0 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper-bright);
  font-size: 0.75rem;
  font-weight: 400;
}
.legend__what {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.12em;
}
.legend__note {
  flex: 1 1 14em;
  color: var(--ink-2);
}
.legend__go {
  margin-left: auto;
  color: var(--c-deep);
  letter-spacing: 0.1em;
  white-space: nowrap;
}

/* ── 右栏：找到了什么 ── */
.found__leaf {
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.found__leaf span {
  margin-left: 1em;
  letter-spacing: 0.14em;
}
.found__title {
  margin-top: 10px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(var(--fs-28), 3vw, var(--fs-40));
  line-height: 1.25;
  letter-spacing: 0.06em;
}
.found__verdict {
  margin-top: 12px;
  font-family: var(--font-kai);
  font-size: var(--fs-20);
  line-height: 1.7;
}

.found__proof {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: stretch;
  gap: 18px;
  margin-top: var(--sp-4);
}
.loupe {
  position: relative;
  width: 148px;
  aspect-ratio: 1;
  border-radius: 50%;
  background-color: #e8e0d0;
  background-repeat: no-repeat;
  box-shadow:
    0 0 0 1px var(--ink),
    0 0 0 6px var(--paper-bright),
    0 0 0 7px var(--line),
    0 18px 30px -18px rgb(43 42 40 / 0.6);
  transition: background-position 0.8s var(--ease);
}
/* 圆心的小圈，大小约等于实际取平均色的那一小块 */
.loupe i {
  position: absolute;
  inset: 50% auto auto 50%;
  width: var(--dot, 13.5%);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 1.5px solid var(--paper-bright);
  border-radius: 50%;
  box-shadow:
    0 0 0 1px rgb(26 25 23 / 0.65),
    inset 0 0 0 1px rgb(26 25 23 / 0.5);
}

.pair {
  display: grid;
  grid-template-rows: 1fr 1fr;
}
.pair div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 10px 16px;
  transition: background 0.6s var(--ease);
}
.pair dt {
  font-size: var(--fs-12);
  letter-spacing: 0.12em;
  white-space: nowrap;
}
.pair dd {
  font-size: 1.25rem;
  letter-spacing: 0.08em;
  line-height: 1.2;
}

.found__de {
  display: flex;
  align-items: center;
  gap: 0.6em;
  margin-top: 14px;
  font-size: var(--fs-14);
  letter-spacing: 0.1em;
}
.found__de .latin {
  font-size: 1.125rem;
  letter-spacing: 0.04em;
}
.found__de i {
  flex: 0 0 28px;
  height: 1px;
  background: currentColor;
}

.found__credit {
  margin-top: var(--sp-4);
  font-size: var(--fs-12);
  line-height: 1.9;
  color: var(--ink-2);
}
.found__link {
  margin-top: 10px;
  font-size: var(--fs-14);
  color: var(--c-deep);
}

.plate__note {
  max-width: 52em;
  margin-top: clamp(40px, 5vw, 64px);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--line);
  font-size: var(--fs-12);
  line-height: 1.9;
  color: var(--ink-2);
}

/* 中等宽度：画在上，说明在下排成两栏 */
@media (max-width: 1000px) {
  .plate__grid {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--sp-6);
  }
  .found {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: var(--sp-6);
    align-items: start;
  }
  .found > * {
    grid-column: 1;
  }
  .found__proof,
  .found__de {
    grid-column: 2;
  }
  .found__proof {
    grid-row: 1 / span 3;
    margin-top: 0;
  }
  .found__de {
    grid-row: 4;
  }
}

@media (max-width: 860px) {
  .plate__head {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--sp-3);
    margin-bottom: var(--sp-6);
  }
}

/* 手机：全部单栏 */
@media (max-width: 760px) {
  .found {
    display: block;
  }
  .found__proof {
    margin-top: var(--sp-3);
  }
  .mount__caption .latin {
    font-size: var(--fs-14);
  }
  .mark {
    --tag-off: 28px;
    width: 30px;
    height: 30px;
    margin: -15px 0 0 -15px;
  }
  .mark__tag {
    left: calc(100% + 10px);
    padding: 3px 8px;
    font-size: var(--fs-12);
  }
  .mark--left .mark__tag {
    right: calc(100% + 10px);
  }
}

@media (max-width: 480px) {
  .loupe {
    width: 116px;
  }
  .found__proof {
    gap: 14px;
  }
  .pair div {
    padding: 8px 12px;
  }
  .pair dd {
    font-size: 1.125rem;
  }
}
</style>
