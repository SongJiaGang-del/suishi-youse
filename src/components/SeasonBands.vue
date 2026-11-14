<script setup lang="ts">
import { useTerm } from '../composables/useTerm'
import { SEASONS } from '../data/terms'
import { onColor } from '../utils/color'

const { term, select } = useTerm()
</script>

<template>
  <section id="seasons" class="seasons section" aria-labelledby="seasons-title">
    <div class="wrap">
      <header class="seasons__head">
        <h2 id="seasons-title" v-reveal class="section-title">四季</h2>
        <p v-reveal="80" class="lede">春生，夏长，秋收，冬藏。每季六个节气、六种颜色，排在一起能看出一季的冷暖走向。</p>
      </header>

      <div class="seasons__rows">
        <article v-for="(s, i) in SEASONS" :key="s.key" v-reveal="i * 70" class="row">
          <header class="row__head">
            <h3 class="row__char">{{ s.char }}</h3>
            <p class="row__meta">
              <strong>{{ s.verb }}</strong>
              <span>{{ s.range }}</span>
            </p>
          </header>

          <ul class="row__bars">
            <li v-for="t in s.terms" :key="t.index" :class="{ 'is-active': t.index === term.index }">
              <button
                type="button"
                :aria-pressed="t.index === term.index"
                :aria-label="`${t.name}，${t.color.name} ${t.color.hex}，设为页面主色`"
                :style="{ background: t.color.hex, color: onColor(t.color.hex) }"
                @click="select(t.index)"
              >
                <span class="bar__name">{{ t.name }}</span>
                <span class="bar__color">
                  {{ t.color.name }}
                  <span class="latin">{{ t.color.hex }}</span>
                </span>
              </button>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.seasons {
  padding-top: 0;
}

.seasons__head {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: end;
  column-gap: clamp(32px, 6vw, 96px);
  margin-bottom: var(--sp-8);
}

.row {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  align-items: stretch;
  border-top: 1px solid var(--ink);
  padding-block: var(--sp-2);
}
.row:last-child {
  border-bottom: 1px solid var(--ink);
}

.row__head {
  display: flex;
  align-items: center;
  gap: 20px;
}
.row__char {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 5.5rem;
  line-height: 1;
}
.row__meta {
  display: grid;
  gap: 4px;
  font-size: var(--fs-12);
  letter-spacing: 0.12em;
  color: var(--ink-2);
}
.row__meta strong {
  font-family: var(--font-kai);
  font-weight: 400;
  font-size: var(--fs-28);
  line-height: 1;
  color: var(--ink);
}
.row__meta span {
  writing-mode: vertical-rl;
  letter-spacing: 0.2em;
  height: 6.4em;
}

.row__bars {
  display: flex;
  gap: 4px;
  height: 152px;
}
.row__bars li {
  flex: 1 1 0;
  min-width: 0;
  transition: flex-grow 0.5s var(--ease);
}
.row__bars li:hover,
.row__bars li:focus-within,
.row__bars li.is-active {
  flex-grow: 2.4;
}
.row__bars button {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  text-align: left;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.07);
}
.row__bars li.is-active button {
  box-shadow: inset 0 0 0 2px var(--ink);
}
.row__bars button:focus-visible {
  outline-offset: -5px;
}

.bar__name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-20);
  letter-spacing: 0.16em;
  white-space: nowrap;
}
.bar__color {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: var(--fs-14);
  letter-spacing: 0.1em;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.35s var(--ease),
    transform 0.35s var(--ease);
}
.bar__color .latin {
  font-size: var(--fs-16);
  letter-spacing: 0.06em;
}
.row__bars li:hover .bar__color,
.row__bars li:focus-within .bar__color,
.row__bars li.is-active .bar__color {
  opacity: 1;
  transform: none;
  transition-delay: 0.12s;
}

@media (max-width: 860px) {
  .seasons__head {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--sp-3);
    margin-bottom: var(--sp-6);
  }
  .row {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--sp-2);
  }
  .row__char {
    font-size: var(--fs-64);
  }
  .row__meta {
    grid-auto-flow: column;
    align-items: baseline;
    gap: 12px;
  }
  .row__meta span {
    writing-mode: horizontal-tb;
    height: auto;
  }
}

@media (max-width: 760px) {
  .row__bars {
    height: 132px;
    gap: 3px;
  }
  .row__bars button {
    padding: 10px 0;
    align-items: center;
  }
  .row__bars li:hover,
  .row__bars li:focus-within,
  .row__bars li.is-active {
    flex-grow: 1.6;
  }
  .bar__name {
    writing-mode: vertical-rl;
    font-size: var(--fs-16);
  }
  .bar__color {
    flex-direction: column;
    align-items: center;
    gap: 0;
    font-size: var(--fs-12);
  }
  .bar__color .latin {
    display: none;
  }
}
</style>
