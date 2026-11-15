<script setup lang="ts">
import { computed } from 'vue'
import { useCopy } from '../composables/useCopy'
import { useTerm } from '../composables/useTerm'
import { cnDateLabel, ORDINALS } from '../data/terms'
import { rgbLabel } from '../utils/color'
import { scrollToId } from '../utils/scroll'

const { term, isToday, dayOfTerm, now } = useTerm()
const { copy } = useCopy()

const metaLine = computed(() =>
  isToday.value
    ? `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${term.value.name}第 ${dayOfTerm} 日`
    : `${term.value.dateLabel.replace('月', ' 月 ').replace('日', ' 日')}前后交节`,
)
const pentadLabels = ['初候', '二候', '三候']
</script>

<template>
  <section id="top" class="hero pigment" aria-labelledby="hero-title">
    <!-- 以节气为 key：切换节气时整组内容重新入场 -->
    <div :key="term.index" class="hero__inner">
      <div class="hero__meta">
        <p class="hero__eyebrow">{{ isToday ? '今日节气' : '二十四节气' }}</p>
        <p class="hero__date">{{ metaLine }}</p>
        <p class="hero__index latin" :aria-label="`二十四节气之第${ORDINALS[term.index - 1]}`">
          <span>{{ String(term.index).padStart(2, '0') }}</span><i>/ 24</i>
        </p>
      </div>

      <div class="hero__side">
        <aside class="chip" aria-label="本节气主色">
          <p class="chip__label">本节气主色</p>
          <p class="chip__name">
            {{ term.color.name }}<span class="latin">{{ term.color.pinyin }}</span>
          </p>
          <dl class="chip__values latin">
            <div>
              <dt>HEX</dt>
              <dd>{{ term.color.hex }}</dd>
            </div>
            <div>
              <dt>RGB</dt>
              <dd>{{ rgbLabel(term.color.hex) }}</dd>
            </div>
          </dl>
          <button class="chip__copy" type="button" @click="copy(term.color.hex)">复制色值</button>
        </aside>

        <div class="hero__actions">
          <button class="link" type="button" @click="scrollToId('read')">
            往下读{{ term.name }}<span aria-hidden="true">↓</span>
          </button>
          <RouterLink class="link" :to="{ name: 'home' }"><span aria-hidden="true">←</span>回到岁时轮</RouterLink>
        </div>
      </div>

      <!-- 竖排栏：自右向左读，仿古籍界栏 -->
      <div class="hero__cols">
        <p class="col col--verse">
          <span>{{ term.imagery[0] }}</span>
          <span>{{ term.imagery[1] }}</span>
        </p>
        <p v-for="(p, i) in term.pentads" :key="i" class="col col--pentad">
          <span class="col__label">{{ pentadLabels[i] }}</span>{{ p }}
        </p>
        <p class="col col--date"><span class="col__label">交节</span>{{ cnDateLabel(term.dateLabel) }}</p>
      </div>

      <h1 id="hero-title" class="hero__title" :aria-label="term.name">
        <span v-for="(ch, i) in term.name" :key="i" aria-hidden="true" :style="{ '--i': i }">{{ ch }}</span>
      </h1>

      <ul class="hero__pentads-m" aria-label="三候">
        <li v-for="(p, i) in term.pentads" :key="i">
          <span>{{ pentadLabels[i] }}</span>{{ p }}
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.hero {
  --title-size: min(38svh, 27vw);
  --rule: color-mix(in srgb, var(--on-c) 30%, transparent);
  position: relative;
  display: grid;
  min-height: 100svh;
  padding: 112px var(--gutter) 48px;
  background: var(--c);
  color: var(--on-c);
  overflow: hidden;
}

.hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 340px) 1fr auto auto;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'meta . cols title'
    'side . cols title';
  column-gap: clamp(24px, 3vw, 48px);
}

/* ── 左上：日期与序号 ── */
.hero__meta {
  grid-area: meta;
  animation: rise 0.9s var(--ease) 0.5s both;
}
.hero__eyebrow {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.4em;
}
.hero__date {
  margin-top: 4px;
  font-size: var(--fs-14);
  letter-spacing: 0.06em;
}
.hero__index {
  margin-top: var(--sp-4);
  line-height: 1;
  white-space: nowrap;
}
.hero__index span {
  font-size: clamp(4rem, 8vw, 7.5rem);
  font-style: italic;
  letter-spacing: -0.02em;
}
.hero__index i {
  margin-left: 0.5em;
  font-size: var(--fs-20);
  letter-spacing: 0.1em;
}

/* ── 左下：色卡 ── */
.hero__side {
  grid-area: side;
  align-self: end;
  animation: rise 0.9s var(--ease) 0.65s both;
}
.chip {
  position: relative;
  max-width: 320px;
  padding: 22px 24px 20px;
  background: var(--paper-bright);
  color: var(--ink);
  box-shadow: 0 18px 40px -24px rgb(0 0 0 / 0.45);
}
.chip__label {
  font-size: var(--fs-12);
  letter-spacing: 0.3em;
  color: var(--ink-2);
}
.chip__name {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-top: 6px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-40);
  line-height: 1.2;
  letter-spacing: 0.08em;
}
.chip__name span {
  font-weight: 400;
  font-style: italic;
  font-size: var(--fs-20);
  letter-spacing: 0.02em;
  color: var(--ink-2);
}
.chip__values {
  display: grid;
  gap: 2px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 1.125rem;
}
.chip__values div {
  display: flex;
  gap: 16px;
}
.chip__values dt {
  width: 2.6em;
  font-size: var(--fs-14);
  letter-spacing: 0.14em;
  color: var(--ink-2);
  align-self: center;
}
.chip__values dd {
  letter-spacing: 0.06em;
}
.chip__copy {
  position: absolute;
  /* 放在右上角：下面那行 RGB 值在窄卡片里会顶到右边 */
  right: 20px;
  top: 16px;
  padding: 4px 12px;
  border: 1px solid var(--ink);
  font-size: var(--fs-14);
  transition:
    background 0.25s,
    color 0.25s;
}
.chip__copy:hover {
  background: var(--ink);
  color: var(--paper-bright);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  margin-top: var(--sp-3);
}

/* ── 中：竖排界栏 ── */
.hero__cols {
  grid-area: cols;
  writing-mode: vertical-rl;
  height: calc(var(--title-size) * 2);
  border-right: 1px solid var(--rule);
}
.col {
  padding: 4px 20px 0;
  border-left: 1px solid var(--rule);
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.28em;
  line-height: 1.5;
  animation: unroll 0.9s var(--ease) both;
  animation-delay: calc(0.45s + var(--n, 0) * 0.09s);
}
.col:nth-child(2) { --n: 1; }
.col:nth-child(3) { --n: 2; }
.col:nth-child(4) { --n: 3; }
.col:nth-child(5) { --n: 4; }

.col__label {
  display: inline-block;
  margin-bottom: 1.4em;
  font-family: var(--font-body);
  font-size: var(--fs-12);
  letter-spacing: 0.3em;
}
.col--verse {
  padding-inline: 26px;
  font-family: var(--font-kai);
  font-size: clamp(1.75rem, 2.6vw, 2.375rem);
  letter-spacing: 0.22em;
  line-height: 1.6;
}
.col--verse span {
  display: block;
}
.col--verse span + span {
  padding-top: 2.2em;
}

/* ── 右：节气名 ── */
.hero__title {
  grid-area: title;
  writing-mode: vertical-rl;
  margin-top: -0.06em;
  margin-right: -0.04em;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--title-size);
  line-height: 1;
  white-space: nowrap;
}
.hero__title span {
  display: inline-block;
  animation: brush 1s var(--ease) both;
  animation-delay: calc(0.1s + var(--i) * 0.16s);
}

.hero__pentads-m {
  display: none;
}

@keyframes brush {
  from {
    clip-path: inset(0 0 100% 0);
    transform: translateY(-4%);
  }
  to {
    clip-path: inset(0 0 0 0);
    transform: none;
  }
}
@keyframes unroll {
  from {
    opacity: 0;
    clip-path: inset(0 0 100% 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 中等宽度：收起交节栏，给留白让位 */
@media (max-width: 1180px) {
  .col--date {
    display: none;
  }
  .hero__inner {
    grid-template-columns: minmax(0, 1fr) 0 auto auto;
    column-gap: clamp(12px, 1.6vw, 24px);
  }
}

/* 手机：节气名与诗句并排在上，三候改横排，色卡通栏 */
@media (max-width: 1000px) {
  .hero {
    --title-size: min(30svh, 40vw);
    padding: 88px var(--gutter) 32px;
  }
  .hero__inner {
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      'meta cols title'
      'pent pent pent'
      'side side side';
    column-gap: 0;
    row-gap: var(--sp-3);
    align-content: space-between;
  }
  .hero__index {
    margin-top: var(--sp-2);
  }
  .hero__date {
    max-width: 9em;
  }
  .col--pentad,
  .col--date {
    display: none;
  }
  .hero__cols {
    margin-right: 14px;
  }
  .col--verse {
    padding-inline: 14px;
    font-size: 1.375rem;
  }
  .hero__pentads-m {
    grid-area: pent;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding-block: 14px;
    border-block: 1px solid var(--rule);
    font-family: var(--font-display);
    font-size: var(--fs-14);
    letter-spacing: 0.1em;
    line-height: 1.5;
  }
  .hero__pentads-m span {
    display: block;
    font-family: var(--font-body);
    font-size: var(--fs-12);
    letter-spacing: 0.24em;
  }
  .chip {
    max-width: 420px;
  }
}

@media (max-width: 760px) {
  .chip {
    max-width: none;
  }
}

/* 窄屏：三栏都按视口宽度收一档，保证节气名不出界 */
@media (max-width: 480px) {
  .hero {
    --title-size: min(30svh, 36vw);
  }
  .hero__eyebrow {
    letter-spacing: 0.2em;
    white-space: nowrap;
  }
  .hero__index span {
    font-size: min(4rem, 13vw);
  }
  .hero__index i {
    margin-left: 0.4em;
    font-size: var(--fs-14);
  }
  .hero__cols {
    margin-right: 12px;
  }
  .col--verse {
    padding-inline: 10px;
    font-size: min(1.375rem, 5.6vw);
  }
  .hero__pentads-m {
    gap: 8px;
    letter-spacing: 0.04em;
  }
}

/* 最窄的手机：复制按钮落到色值下方，不与 RGB 抢位置 */
@media (max-width: 360px) {
  .hero__date {
    font-size: var(--fs-12);
  }
  .chip__copy {
    position: static;
    width: 100%;
    margin-top: 14px;
  }
}
</style>
