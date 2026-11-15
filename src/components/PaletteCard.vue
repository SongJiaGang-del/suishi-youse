<script setup lang="ts">
import { computed } from 'vue'
import { useCopy } from '../composables/useCopy'
import { useTerm } from '../composables/useTerm'
import { contentOf } from '../data/content'
import { INK, onColor, PAPER, rgbLabel } from '../utils/color'

const { term, theme } = useTerm()
const { copy } = useCopy()
const note = computed(() => contentOf(term.value).colorNote)

/** 每个节气页都带这四个色彩变量，加上全站固定的宣纸与墨 */
const swatches = computed(() => [
  { role: '浅色', use: '大面积背景', hex: theme.value.wash },
  { role: '深色', use: '标题与强调', hex: theme.value.deep },
  { role: '色上文字', use: '压在主色上的字', hex: theme.value.on.toUpperCase() },
  { role: '宣纸', use: '全站底色', hex: PAPER },
  { role: '墨', use: '正文', hex: INK },
])
</script>

<template>
  <section id="palette" class="palette section" aria-labelledby="palette-title">
    <div class="wrap">
      <header class="palette__head">
        <h2 id="palette-title" v-reveal class="section-title">{{ term.name }}的颜色</h2>
        <p v-reveal="80" class="lede">{{ note }}</p>
      </header>

      <div v-reveal="120" class="palette__grid">
        <button
          class="main pigment"
          type="button"
          :style="{ color: theme.on }"
          :aria-label="`复制${term.name}主色 ${term.color.hex}`"
          @click="copy(term.color.hex)"
        >
          <span class="main__role">{{ term.name }} · 主色</span>
          <span class="main__name">{{ term.color.name }}</span>
          <span class="main__values latin">
            <span>{{ term.color.hex }}</span>
            <span>RGB {{ rgbLabel(term.color.hex) }}</span>
          </span>
          <span class="main__sample" aria-hidden="true">{{ term.imagery[0] }}，{{ term.imagery[1] }}</span>
        </button>

        <ul class="rest">
          <li v-for="s in swatches" :key="s.role">
            <button type="button" :aria-label="`复制${s.role} ${s.hex}`" @click="copy(s.hex)">
              <i :style="{ background: s.hex, color: onColor(s.hex) }" aria-hidden="true">文</i>
              <span class="rest__role">{{ s.role }}</span>
              <span class="rest__use">{{ s.use }}</span>
              <span class="rest__hex latin">{{ s.hex }}</span>
            </button>
          </li>
        </ul>
      </div>

      <p v-reveal class="palette__more">
        主色之外，各配了一组浅色、深色和压在主色上的文字色，这一页用的就是它们。点任意一格可以复制色值。
      </p>
    </div>
  </section>
</template>

<style scoped>
.palette {
  background: var(--c-wash);
}

.palette__head {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: end;
  column-gap: clamp(32px, 6vw, 96px);
  margin-bottom: var(--sp-8);
}

.palette__grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: var(--sp-3);
}

.main {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 440px;
  padding: clamp(24px, 3vw, 40px);
  background: var(--c);
  text-align: left;
  overflow: hidden;
}
.main:focus-visible {
  outline-offset: -8px;
}
.main__role {
  font-size: var(--fs-14);
  letter-spacing: 0.3em;
}
.main__name {
  align-self: center;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(5rem, 11vw, 9.5rem);
  line-height: 1.1;
  letter-spacing: 0.06em;
}
.main__values {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 32px;
  font-size: 1.375rem;
  letter-spacing: 0.08em;
}
.main__sample {
  position: absolute;
  top: clamp(24px, 3vw, 40px);
  right: clamp(24px, 3vw, 40px);
  writing-mode: vertical-rl;
  font-family: var(--font-kai);
  font-size: var(--fs-20);
  letter-spacing: 0.3em;
}

.rest {
  display: grid;
  background: var(--paper-bright);
}
.rest li + li {
  border-top: 1px solid var(--line);
}
.rest button {
  display: grid;
  grid-template-columns: 56px 5em 1fr auto;
  align-items: center;
  column-gap: var(--sp-2);
  width: 100%;
  height: 100%;
  min-height: 80px;
  padding: 12px 20px 12px 12px;
  text-align: left;
  transition: background 0.25s;
}
.rest button:hover {
  background: var(--paper);
}
.rest button:focus-visible {
  outline-offset: -4px;
}
.rest i {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  font-family: var(--font-display);
  font-style: normal;
  font-weight: 600;
  font-size: var(--fs-20);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
}
.rest__role {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: 0.1em;
}
.rest__use {
  font-size: var(--fs-14);
  color: var(--ink-2);
}
.rest__hex {
  font-size: 1.125rem;
  letter-spacing: 0.08em;
}

.palette__more {
  max-width: 46em;
  margin-top: var(--sp-3);
  font-size: var(--fs-14);
  line-height: 1.9;
  color: var(--ink-2);
}

@media (max-width: 860px) {
  .palette__head,
  .palette__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .palette__head {
    row-gap: var(--sp-3);
    margin-bottom: var(--sp-6);
  }
  .main {
    min-height: 340px;
  }
}

@media (max-width: 480px) {
  .rest button {
    grid-template-columns: 48px 1fr auto;
    row-gap: 0;
  }
  .rest i {
    width: 48px;
    height: 48px;
    grid-row: span 2;
  }
  .rest__use {
    grid-column: 2;
    grid-row: 2;
  }
  .rest__hex {
    grid-column: 3;
    grid-row: 1 / span 2;
  }
}
</style>
