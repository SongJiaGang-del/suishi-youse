<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTerm } from '../composables/useTerm'
import {
  ALBUM,
  closeness,
  LEAF_ORDINALS,
  leafImage,
  leafPage,
  LEAVES,
  pickOfTerm,
  picksOnLeaf,
} from '../data/paintings'
import { TERMS } from '../data/terms'
import { onColor } from '../utils/color'

const { term, select } = useTerm()

const pick = computed(() => pickOfTerm(term.value.index))
const leaf = computed(() => LEAVES[pick.value.leaf - 1])
const ordinal = computed(() => LEAF_ORDINALS[leaf.value.order - 1])
const src = computed(() => leafImage(leaf.value))

/** 同一开上找到的其他节气色 */
const others = computed(() =>
  picksOnLeaf(leaf.value.order)
    .filter((p) => p.term !== term.value.index)
    .map((p) => ({ ...p, t: TERMS[p.term - 1] })),
)

/** 册页目录：十开，每开列出落在上面的节气 */
const index = LEAVES.map((l) => ({
  leaf: l,
  ordinal: LEAF_ORDINALS[l.order - 1],
  terms: picksOnLeaf(l.order).map((p) => TERMS[p.term - 1]),
}))

const status = ref<'loading' | 'ready' | 'error'>('loading')
watch(src, () => {
  status.value = 'loading'
})

const verdict = computed(() => {
  const name = term.value.color.name
  const de = pick.value.de
  if (de <= 3) return `画上这一处，几乎就是${name}。`
  if (de <= 7) return `画上这一处，与${name}相近。`
  if (de <= 10) return `画上这一处，与${name}略有出入。`
  return `这本册页里找不到更近的${name}，这一处只得其意。`
})

/** 放大镜：把同一张图放大 ZOOM 倍，让取色点落在圆心 */
const ZOOM = 6
const loupe = computed(() => {
  const ratio = leaf.value.w / leaf.value.h
  const kx = ZOOM
  const ky = ZOOM / ratio
  const px = (0.5 - (pick.value.x / 100) * kx) / (1 - kx)
  const py = (0.5 - (pick.value.y / 100) * ky) / (1 - ky)
  return {
    backgroundImage: `url(${src.value})`,
    backgroundSize: `${ZOOM * 100}% auto`,
    backgroundPosition: `${(px * 100).toFixed(2)}% ${(py * 100).toFixed(2)}%`,
  }
})

const alt = computed(
  () =>
    `${ALBUM.artist}《${ALBUM.title}》第${ordinal.value}开，馆方题名 ${leaf.value.subtitle}。` +
    `${term.value.name}的取色点在画面左起 ${Math.round(pick.value.x)}%、上起 ${Math.round(pick.value.y)}% 处。`,
)
</script>

<template>
  <section id="painting" class="plate section" aria-labelledby="plate-title">
    <div class="wrap">
      <header class="plate__head">
        <h2 id="plate-title" v-reveal class="section-title">画里寻色</h2>
        <p v-reveal="80" class="lede">
          清人张若霭画过一本花鸟册，一共十开。拿二十四个节气色到画里去找，每一色都在某一开上找到了落脚的地方。有的几乎同色，有的只得其意，差多少都写在旁边。
        </p>
      </header>

      <div v-reveal="120" class="plate__grid">
        <figure class="mount">
          <div class="leaf" :style="{ aspectRatio: `${leaf.w} / ${leaf.h}` }">
            <img
              :key="src"
              :class="{ 'is-ready': status === 'ready' }"
              :src="src"
              :width="leaf.w"
              :height="leaf.h"
              :alt="alt"
              decoding="async"
              referrerpolicy="no-referrer"
              @load="status = 'ready'"
              @error="status = 'error'"
            />

            <p v-if="status === 'error'" class="leaf__error">
              这一开的图片没有载入。刷新页面试试，或者
              <a :href="leafPage(leaf)" target="_blank" rel="noopener noreferrer">到馆方页面看原作</a>。
            </p>

            <template v-if="status === 'ready'">
              <button
                v-for="p in others"
                :key="p.term"
                class="dot"
                type="button"
                :style="{ left: `${p.x}%`, top: `${p.y}%` }"
                :aria-label="`${p.t.name}的${p.t.color.name}也在这一开上，切换到${p.t.name}`"
                @click="select(p.term)"
              >
                <span class="dot__tag" aria-hidden="true">{{ p.t.name }} · {{ p.t.color.name }}</span>
              </button>

              <span
                class="mark"
                :class="{ 'mark--left': pick.x > 62 }"
                :style="{ left: `${pick.x}%`, top: `${pick.y}%` }"
                aria-hidden="true"
              >
                <span class="mark__tag">{{ term.name }} · {{ term.color.name }}</span>
              </span>
            </template>
          </div>

          <figcaption class="mount__caption">
            <span>{{ ALBUM.artist }}《{{ ALBUM.title }}》第{{ ordinal }}开</span>
            <span class="latin">{{ leaf.subtitle }}</span>
          </figcaption>
        </figure>

        <div class="found">
          <p class="found__leaf">第{{ ordinal }}开<span>{{ leaf.name }}</span></p>
          <h3 class="found__title">{{ term.name }}的{{ term.color.name }}</h3>
          <p class="found__verdict">{{ verdict }}</p>

          <div class="found__proof">
            <div v-if="status !== 'error'" class="loupe" :style="loupe" aria-hidden="true"><i></i></div>
            <dl class="pair">
              <div :style="{ background: pick.hex, color: onColor(pick.hex) }">
                <dt>画中取色</dt>
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

          <div v-if="others.length" class="found__also">
            <p>这一开上还有</p>
            <ul>
              <li v-for="p in others" :key="p.term">
                <button type="button" @click="select(p.term)">
                  <i :style="{ background: p.t.color.hex }" aria-hidden="true"></i>{{ p.t.name }} · {{ p.t.color.name }}
                </button>
              </li>
            </ul>
          </div>

          <p class="found__credit">
            {{ ALBUM.artist }}（{{ ALBUM.years }}）《{{ ALBUM.title }}》，{{ ALBUM.dynasty }}，{{ ALBUM.date }}，{{ ALBUM.medium }}。{{ ALBUM.holder }}藏，开放图像（{{ ALBUM.license }}）。
          </p>
          <a class="link found__link" :href="leafPage(leaf)" target="_blank" rel="noopener noreferrer">
            到馆方页面看原作<span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div v-reveal class="album">
        <h3 class="album__title">册页十开</h3>
        <ol class="album__list">
          <li v-for="it in index" :key="it.leaf.order" :class="{ 'is-current': it.leaf.order === leaf.order }">
            <p class="album__no">第{{ it.ordinal }}开</p>
            <p class="album__name">{{ it.leaf.name }}</p>
            <ul class="album__terms">
              <li v-for="t in it.terms" :key="t.index">
                <button
                  type="button"
                  :style="{ background: t.color.hex }"
                  :title="`${t.name} · ${t.color.name}`"
                  :aria-label="`${t.name} · ${t.color.name}`"
                  :aria-pressed="t.index === term.index"
                  @click="select(t.index)"
                ></button>
              </li>
            </ul>
          </li>
        </ol>
        <p class="album__note">
          各开的中文题名据馆方英文题名意译，不是画上原题。色差按 CIEDE2000 计算，数值越小越接近；取色是该点附近一小块的平均色，取点时避开了印章与裱边。
        </p>
      </div>
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
  padding: clamp(12px, 1.8vw, 26px);
  padding-bottom: 0;
  background: var(--paper-bright);
  box-shadow:
    0 0 0 1px var(--line),
    0 40px 70px -48px rgb(43 42 40 / 0.55);
}
.leaf {
  position: relative;
  background: #e8e0d0;
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
  font-family: var(--font-display);
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
.mark,
.dot {
  position: absolute;
  border-radius: 50%;
}
.mark {
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
  white-space: nowrap;
}
.mark--left .mark__tag {
  left: auto;
  right: calc(100% + 14px);
}

.dot {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin: -15px 0 0 -15px;
}
.dot::before {
  content: '';
  width: 13px;
  height: 13px;
  border: 1.5px solid var(--paper-bright);
  border-radius: 50%;
  box-shadow:
    0 0 0 1px rgb(26 25 23 / 0.6),
    inset 0 0 0 1px rgb(26 25 23 / 0.45);
  transition: transform 0.3s var(--ease);
}
.dot:hover::before,
.dot:focus-visible::before {
  transform: scale(1.6);
}
.dot:focus-visible {
  outline: 2px solid var(--paper-bright);
  outline-offset: 0;
  box-shadow: 0 0 0 4px rgb(26 25 23 / 0.6);
}
.dot__tag {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 4px);
  transform: translate(-50%, 4px);
  padding: 3px 10px;
  background: var(--ink);
  color: var(--paper);
  font-size: var(--fs-12);
  letter-spacing: 0.12em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.25s,
    transform 0.25s var(--ease);
}
.dot:hover .dot__tag,
.dot:focus-visible .dot__tag {
  opacity: 1;
  transform: translate(-50%, 0);
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

/* ── 右栏：找到了什么 ── */
.found__leaf {
  font-size: var(--fs-14);
  letter-spacing: 0.3em;
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
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
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
  letter-spacing: 0.2em;
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

.found__also {
  margin-top: var(--sp-4);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--line);
}
.found__also p {
  font-size: var(--fs-12);
  letter-spacing: 0.3em;
  color: var(--ink-2);
}
.found__also ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.found__also button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  border: 1px solid var(--line);
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  transition: border-color 0.25s;
}
.found__also button:hover {
  border-color: var(--ink);
}
.found__also i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
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

/* ── 册页目录 ── */
.album {
  margin-top: clamp(56px, 7vw, 96px);
}
.album__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-20);
  letter-spacing: 0.3em;
}
.album__list {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  margin-top: var(--sp-3);
  border-top: 1px solid var(--ink);
}
.album__list > li {
  position: relative;
  padding: 16px 10px 18px 0;
}
.album__list > li + li {
  padding-left: 12px;
  border-left: 1px solid var(--line);
}
/* 当前这一开：顶上压一道主色 */
.album__list > li.is-current::before {
  content: '';
  position: absolute;
  inset: -1px 0 auto 0;
  height: 5px;
  background: var(--c-deep);
}
.album__no {
  font-size: var(--fs-12);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.album__name {
  margin-top: 2px;
  min-height: 3.2em;
  word-break: keep-all;
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: 0.08em;
}
.album__terms {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.album__terms button {
  display: block;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
  transition: transform 0.3s var(--ease);
}
.album__terms button:hover {
  transform: scale(1.15);
}
.album__terms button[aria-pressed='true'] {
  outline: 1.5px solid var(--ink);
  outline-offset: 3px;
}
.album__note {
  max-width: 46em;
  margin-top: var(--sp-3);
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
  .found__de,
  .found__also {
    grid-column: 2;
  }
  .found__proof {
    grid-row: 1 / span 3;
    margin-top: 0;
  }
  .found__de {
    grid-row: 4;
  }
  .found__also {
    grid-row: 5 / span 2;
  }
  .album__list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .album__list > li:nth-child(6) {
    padding-left: 0;
    border-left: 0;
  }
  .album__list > li:nth-child(n + 6) {
    border-top: 1px solid var(--line);
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

@media (max-width: 620px) {
  .album__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .album__list > li,
  .album__list > li + li {
    padding: 14px 10px 16px 0;
    border-left: 0;
    border-top: 1px solid var(--line);
  }
  .album__list > li:nth-child(-n + 2) {
    border-top: 0;
  }
  .album__list > li:nth-child(even) {
    padding-left: 14px;
    border-left: 1px solid var(--line);
  }
  .album__name {
    min-height: 0;
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
