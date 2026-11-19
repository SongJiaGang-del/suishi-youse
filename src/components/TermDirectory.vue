<script setup lang="ts">
import { useTerm } from '../composables/useTerm'
import { paintingThumb, paintingOfPlate, plateOfTerm } from '../data/paintings'
import { SEASONS, type Term } from '../data/terms'
import { onColor } from '../utils/color'

/**
 * 二十四节气目录：按四季分四组，每个节气一张“笺”。
 * 配到古画的节气，笺面是画的局部；还没配到的，笺面是节气色加两句意象。
 */
const { today } = useTerm()

const pad = (n: number) => String(n).padStart(2, '0')

function cardOf(term: Term) {
  const plate = plateOfTerm(term.index)
  const painting = plate ? paintingOfPlate(plate) : null
  return {
    term,
    on: onColor(term.color.hex),
    image: painting ? paintingThumb(painting) : null,
    focus: plate ? `${plate.focus[0]}% ${plate.focus[1]}%` : undefined,
    alt: painting ? `古画局部：${painting.artist}《${painting.name}》` : '',
  }
}

const groups = SEASONS.map((s) => ({ ...s, cards: s.terms.map(cardOf) }))
</script>

<template>
  <section id="directory" class="dir section" aria-labelledby="dir-title">
    <div class="wrap">
      <header class="dir__head">
        <h2 id="dir-title" v-reveal class="section-title">二十四节气</h2>
        <p v-reveal="80" class="lede">
          春生、夏长、秋收、冬藏，每季六个节气。每张笺是一个节气的入口，里面有它的物候、习俗、吃食、一首诗和一种颜色。
        </p>
      </header>

      <div v-for="g in groups" :key="g.key" class="season">
        <header v-reveal class="season__head">
          <h3 class="season__name">
            <span class="season__char">{{ g.char }}</span>
            <span class="season__verb">{{ g.verb }}</span>
          </h3>
          <p class="season__range">{{ g.range }}</p>
          <div class="season__strip" aria-hidden="true">
            <i v-for="t in g.terms" :key="t.index" :style="{ background: t.color.hex }"></i>
          </div>
        </header>

        <ul class="season__cards">
          <li v-for="(c, i) in g.cards" :key="c.term.index" v-reveal="i * 50">
            <RouterLink
              class="card"
              :to="{ name: 'term', params: { slug: c.term.slug } }"
              :aria-label="`${c.term.name}，${c.term.dateLabel}，${c.term.color.name}${c.term.index === today.term.index ? '，今日节气' : ''}`"
            >
              <div
                class="card__face"
                :class="{ pigment: !c.image }"
                :style="{ background: c.term.color.hex, color: c.on }"
              >
                <img
                  v-if="c.image"
                  :src="c.image"
                  :alt="c.alt"
                  v-parallax="0.03"
                  :style="{ objectPosition: c.focus }"
                  loading="lazy"
                  decoding="async"
                />
                <p v-else class="card__verse" aria-hidden="true">
                  <span>{{ c.term.imagery[0] }}</span>
                  <span>{{ c.term.imagery[1] }}</span>
                </p>
                <span class="card__no latin" aria-hidden="true">{{ pad(c.term.index) }}</span>
                <span v-if="c.term.index === today.term.index" class="card__today">今日</span>
              </div>

              <div class="card__caption" aria-hidden="true">
                <p class="card__name">{{ c.term.name }}</p>
                <p class="card__date latin">{{ c.term.dateLabel }}</p>
                <p class="card__color">
                  <i :style="{ background: c.term.color.hex }"></i>{{ c.term.color.name }}
                </p>
              </div>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dir {
  background: var(--paper-bright);
  border-top: 1px solid var(--line);
}

.dir__head {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: end;
  column-gap: clamp(32px, 6vw, 96px);
  row-gap: var(--sp-3);
}

.season {
  margin-top: clamp(56px, 7vw, 96px);
}

.season__head {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: baseline;
  column-gap: var(--sp-3);
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--ink);
}
.season__name {
  display: flex;
  align-items: baseline;
  gap: 0.2em;
  font-family: var(--font-text);
  line-height: 1;
}
.season__char {
  font-weight: 900;
  font-size: var(--fs-40);
}
.season__verb {
  font-family: var(--font-kai);
  font-weight: 400;
  font-size: var(--fs-20);
  color: var(--ink-2);
}
.season__range {
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.season__strip {
  justify-self: end;
  align-self: center;
  display: flex;
  width: min(180px, 100%);
  height: 8px;
}
.season__strip i {
  flex: 1;
}

.season__cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--sp-4) var(--sp-3);
  margin-top: var(--sp-4);
}

.card {
  display: block;
  outline-offset: 6px;
}

.card__face {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgb(43 42 40 / 0.1);
  transition:
    transform 0.5s var(--ease),
    box-shadow 0.5s var(--ease);
}
.card__face img {
  position: absolute;
  /* 上下各多出 8%，给视差位移留余量，露不出边 */
  inset: -8% 0;
  width: 100%;
  height: 116%;
  object-fit: cover;
  translate: 0 clamp(-22px, var(--py, 0px), 22px);
  transition: transform 0.9s var(--ease);
}
/* 画上压一条节气色的边，说明这张笺属于哪种颜色 */
.card__face:has(img)::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 8px;
  background: inherit;
}

.card__verse {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  align-items: flex-start;
  gap: 0.5em;
  padding-top: 26%;
  font-family: var(--font-kai);
  font-size: clamp(1rem, 1.5vw, 1.3125rem);
  line-height: 1.35;
  letter-spacing: 0.24em;
}
.card__verse span {
  writing-mode: vertical-rl;
}
.card__verse span + span {
  margin-top: 1.6em;
}

.card__no {
  position: absolute;
  left: 12px;
  bottom: 10px;
  font-size: var(--fs-14);
  letter-spacing: 0.1em;
  opacity: 0.8;
}
.card__face:has(img) .card__no {
  bottom: 16px;
  padding: 1px 7px;
  background: var(--paper);
  color: var(--ink);
  opacity: 1;
}

.card__today {
  position: absolute;
  top: 0;
  right: 12px;
  padding: 10px 5px 8px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-12);
  line-height: 1.2;
  letter-spacing: 0.1em;
  writing-mode: vertical-rl;
}

.card__caption {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  row-gap: 2px;
  padding-top: 12px;
}
.card__name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-20);
  letter-spacing: 0.12em;
}
.card__date {
  font-size: var(--fs-14);
  color: var(--ink-2);
  white-space: nowrap;
}
.card__color {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-14);
  letter-spacing: 0.12em;
  color: var(--ink-2);
}
.card__color i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--line);
}

@media (hover: hover) {
  .card:hover .card__face {
    transform: translateY(-6px);
    box-shadow:
      inset 0 0 0 1px rgb(43 42 40 / 0.1),
      0 18px 28px -18px rgb(43 42 40 / 0.45);
  }
  .card:hover .card__face img {
    transform: scale(1.05);
  }
  .card:hover .card__name {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 6px;
  }
}

@media (max-width: 1000px) {
  .season__cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .card__verse {
    font-size: clamp(1.0625rem, 2.6vw, 1.375rem);
  }
}

@media (max-width: 760px) {
  .dir__head {
    grid-template-columns: minmax(0, 1fr);
  }
  .season__head {
    grid-template-columns: auto 1fr;
  }
  .season__strip {
    display: none;
  }
}

@media (max-width: 560px) {
  .season__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-3) var(--sp-2);
  }
  .card__verse {
    font-size: 1.125rem;
  }
  .card__date {
    font-size: var(--fs-12);
  }
}
</style>
