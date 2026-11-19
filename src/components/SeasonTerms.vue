<script setup lang="ts">
import { SEASONS } from '../data/terms'
import { edgeOf, isLight } from '../utils/color'

/**
 * 按四季分组的二十四节气入口，页头的下拉面板（drop）与手机的全屏菜单（sheet）共用。
 * 当前所在的节气页由 RouterLink 自带的 aria-current 标出。
 */
defineProps<{ variant: 'drop' | 'sheet' }>()

const dot = (hex: string) => ({ background: hex, '--edge': isLight(hex) ? edgeOf(hex) : 'transparent' })
</script>

<template>
  <div class="seasons" :class="`seasons--${variant}`">
    <div v-for="s in SEASONS" :key="s.key" class="season" role="group" :aria-labelledby="`${variant}-${s.key}`">
      <p :id="`${variant}-${s.key}`" class="season__head">
        <span class="season__char">{{ s.char }}</span>
        <span class="season__range">{{ s.verb }} · {{ s.range }}</span>
      </p>
      <ul class="season__list">
        <li v-for="t in s.terms" :key="t.index">
          <RouterLink class="term" :to="{ name: 'term', params: { slug: t.slug } }">
            <i :style="dot(t.color.hex)" aria-hidden="true"></i>
            <span class="term__name">{{ t.name }}</span>
            <span class="term__color">{{ t.color.name }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.seasons {
  display: grid;
}

.season__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ink);
}
.season__char {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-28);
  line-height: 1.3;
}
.season__range {
  font-size: var(--fs-14);
  letter-spacing: 0.1em;
  color: var(--ink-2);
}

.term {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 10px;
  min-height: 44px;
  transition: background 0.25s;
}
.term i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--edge);
}
.term__name {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.1em;
}
.term__color {
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  color: var(--ink-2);
}
.term[aria-current='page'] .term__name {
  border-bottom: 1px solid currentColor;
}

/* ── 桌面下拉：四列并排 ── */
.seasons--drop {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-4) clamp(24px, 3vw, 48px);
}
.seasons--drop .term {
  margin-inline: -8px;
  padding-inline: 8px;
}
.seasons--drop .term:hover {
  background: var(--paper);
}

/* ── 手机全屏菜单：四季上下排，每季 3 × 2 ── */
.seasons--sheet {
  gap: var(--sp-4);
}
.seasons--sheet .season__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: var(--sp-1);
}
.seasons--sheet .term {
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto;
  row-gap: 0;
  min-height: 56px;
  padding-block: 6px;
}
.seasons--sheet .term i {
  grid-row: 1 / span 2;
}
.seasons--sheet .term__name {
  align-self: end;
  line-height: 1.4;
}
.seasons--sheet .term__color {
  align-self: start;
  grid-column: 2;
  line-height: 1.4;
}

@media (max-width: 1000px) {
  .seasons--drop {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
