<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PrefaceSection from '../components/PrefaceSection.vue'
import TermDirectory from '../components/TermDirectory.vue'
import TermWheel from '../components/TermWheel.vue'
import { useTerm } from '../composables/useTerm'
import { contentOf } from '../data/content'
import { ORDINALS, type Term } from '../data/terms'
import { onColor } from '../utils/color'

/**
 * 首页：岁时轮是入口。
 * 鼠标移到某一段上，右边的面板预告那个节气；点下去进入它的页面。
 * 触屏没有悬停，所以第一次点是预告，再点一次（或点面板上的按钮）才进入。
 */
const router = useRouter()
const { now, today, backToToday } = useTerm()
backToToday()

const hovered = ref<Term | null>(null)
const picked = ref<Term | null>(null)
const shown = computed(() => hovered.value ?? picked.value ?? today.term)
const shownIsToday = computed(() => shown.value.index === today.term.index)
const content = computed(() => contentOf(shown.value))
const on = computed(() => onColor(shown.value.color.hex))

/** 今天落在第几候（0–2） */
const todayPentad = Math.min(2, Math.floor((today.dayOfTerm - 1) / 5))
const pentadLabels = ['初候', '二候', '三候']

const dateLine = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`

function enter(term: Term) {
  router.push({ name: 'term', params: { slug: term.slug } })
}

function choose(term: Term, keyboard: boolean) {
  const canHover = window.matchMedia('(hover: hover)').matches
  if (keyboard || canHover || picked.value?.index === term.index) enter(term)
  else picked.value = term
}
</script>

<template>
  <section class="home" aria-labelledby="home-title">
    <div class="wrap home__grid">
      <header class="home__intro">
        <p class="home__eyebrow">二十四节气 · 传统色</p>
        <h1 id="home-title" class="home__title">
          今天是<em>{{ today.term.name }}</em>的<br />第 <span class="latin">{{ today.dayOfTerm }}</span> 天
        </h1>
        <p class="home__sub">
          距{{ today.next.name }}还有 <span class="latin">{{ today.daysToNext }}</span> 天<i aria-hidden="true"></i>{{ dateLine }}
        </p>
      </header>

      <div class="home__wheel">
        <TermWheel :shown="shown" @preview="hovered = $event" @choose="choose" />
      </div>

      <!-- 预告：轮盘指到哪个节气，这里就说哪个 -->
      <aside class="panel" aria-live="polite" aria-label="节气预览">
        <p class="panel__label">
          <span v-if="shownIsToday" class="panel__today">今日</span>
          第{{ ORDINALS[shown.index - 1] }}个节气<i aria-hidden="true"></i><span class="latin">{{ shown.dateLabel }}</span>前后
        </p>
        <p class="panel__name">
          {{ shown.name }}<span class="latin">{{ shown.pinyin }}</span>
        </p>
        <p class="panel__brief">{{ content.brief }}</p>

        <ol class="panel__pentads">
          <li v-for="(p, i) in shown.pentads" :key="i" :class="{ 'is-now': shownIsToday && i === todayPentad }">
            <span>{{ pentadLabels[i] }}</span>{{ p }}
          </li>
        </ol>

        <div class="panel__foot">
          <p class="panel__color">
            <i :style="{ background: shown.color.hex }" aria-hidden="true"></i>
            {{ shown.color.name }}<span class="latin">{{ shown.color.hex }}</span>
          </p>
          <RouterLink
            class="panel__cta"
            :to="{ name: 'term', params: { slug: shown.slug } }"
            :style="{ background: shown.color.hex, color: on }"
          >
            进入{{ shown.name }}<span aria-hidden="true">→</span>
          </RouterLink>
        </div>

        <p class="panel__hint">
          <span class="hint--hover">把鼠标移到色环上预览，点一下进入那个节气。</span>
          <span class="hint--touch">点色环上的任意一段预览，再点一次进入。</span>
        </p>
      </aside>
    </div>
  </section>

  <PrefaceSection />
  <TermDirectory />
</template>

<style scoped>
.home {
  display: grid;
  align-items: center;
  min-height: 100svh;
  padding-block: 104px 48px;
}

.home__grid {
  /* .home 是 grid，.wrap 左右的 auto 外边距会让它缩成内容宽：
     预告文字一长就把整屏撑宽。写明 100%，宽度只跟视口走，也和下面各段左对齐 */
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  grid-template-rows: auto auto;
  grid-template-areas:
    'intro wheel'
    'panel wheel';
  align-content: center;
  column-gap: clamp(32px, 5vw, 80px);
  row-gap: clamp(28px, 4svh, 48px);
}

.home__intro {
  grid-area: intro;
  align-self: end;
}
.home__eyebrow {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-14);
  letter-spacing: 0.3em;
  color: var(--ink-2);
}
.home__title {
  margin-top: var(--sp-2);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.25rem, 4.6vw, 4rem);
  line-height: 1.28;
  letter-spacing: 0.04em;
}
.home__title em {
  font-style: normal;
  color: var(--c-deep);
}
.home__title .latin {
  font-weight: 400;
  font-style: italic;
  font-size: 1.15em;
}
.home__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 0.9em;
  margin-top: var(--sp-2);
  font-size: var(--fs-16);
  letter-spacing: 0.08em;
  color: var(--ink-2);
}
.home__sub .latin {
  font-size: 1.2em;
  color: var(--ink);
}
.home__sub i {
  width: 24px;
  height: 1px;
  background: currentColor;
}

.home__wheel {
  grid-area: wheel;
  align-self: center;
  justify-self: center;
  width: 100%;
  max-width: min(720px, calc(100svh - 170px));
}

/* ── 预告面板 ── */
.panel {
  grid-area: panel;
  align-self: start;
  max-width: 460px;
  padding-top: var(--sp-3);
  border-top: 1px solid var(--ink);
}
.panel__label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 0.8em;
  font-size: var(--fs-14);
  letter-spacing: 0.16em;
  color: var(--ink-2);
}
.panel__label i {
  width: 18px;
  height: 1px;
  background: currentColor;
}
.panel__label .latin {
  margin-right: -0.5em;
  font-size: 1.1em;
  letter-spacing: 0.06em;
}
.panel__today {
  padding: 1px 8px 1px 9px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-12);
  letter-spacing: 0.16em;
}
.panel__name {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-top: 8px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-40);
  line-height: 1.25;
  letter-spacing: 0.1em;
}
.panel__name .latin {
  font-weight: 400;
  font-style: italic;
  font-size: var(--fs-20);
  letter-spacing: 0.02em;
  color: var(--ink-2);
}
.panel__brief {
  /* 留足两行，换节气时下面的内容不跳 */
  min-height: 3.6em;
  margin-top: 8px;
  font-family: var(--font-kai);
  font-size: var(--fs-20);
  line-height: 1.8;
}

.panel__pentads {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--sp-2);
  border-block: 1px solid var(--line);
}
/* 三等分放不下小雪的二候（八个字）：双栏最窄时面板 342px，手机上 350px 上下，一折行面板就长高。
   放不下的那一栏按内容取宽，另外两栏平分剩下的；放得下时仍是三等分。
   360px 以下不这么做：三栏都按内容取宽可能比面板还宽，会撑出横向滚动 */
@media (min-width: 360px) {
  .panel__pentads {
    grid-template-columns: repeat(3, minmax(max-content, 1fr));
  }
}
.panel__pentads li {
  padding: 12px 10px 12px 0;
  font-family: var(--font-text);
  font-size: var(--fs-14);
  line-height: 1.6;
  letter-spacing: 0.06em;
}
.panel__pentads li + li {
  padding-left: 12px;
  border-left: 1px solid var(--line);
}
.panel__pentads span {
  display: block;
  font-family: var(--font-body);
  font-size: var(--fs-12);
  letter-spacing: 0.16em;
  color: var(--ink-2);
}
.panel__pentads li.is-now {
  font-weight: 900;
}
.panel__pentads li.is-now span::after {
  content: ' · 眼下';
  color: var(--ink);
}

.panel__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 24px;
  margin-top: var(--sp-3);
}
/* 双栏最窄时（面板 342px），色名一组最长 161px，加按钮 170px 再加 24px 间距就超了，
   按钮会掉到下一行。两端对齐时这个值只是下限，收小了平时看不出来 */
@media (min-width: 961px) {
  .panel__foot {
    column-gap: 8px;
  }
}
.panel__color {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.16em;
}
.panel__color i {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--line);
  transition: background 0.45s var(--ease);
}
.panel__color .latin {
  font-weight: 400;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}
.panel__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.8em;
  padding: 12px 22px 12px 26px;
  box-shadow: inset 0 0 0 1px rgb(43 42 40 / 0.18);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.125rem;
  letter-spacing: 0.2em;
  transition:
    background 0.45s var(--ease),
    color 0.45s var(--ease);
}
.panel__cta span {
  transition: transform 0.35s var(--ease);
}
.panel__cta:hover span {
  transform: translateX(6px);
}

.panel__hint {
  margin-top: var(--sp-3);
  font-size: var(--fs-12);
  letter-spacing: 0.1em;
  color: var(--ink-2);
}
.hint--touch {
  display: none;
}
@media (hover: none) {
  .hint--hover {
    display: none;
  }
  .hint--touch {
    display: inline;
  }
}

/* 窄屏：先说今天，再给轮盘，最后是预告 */
@media (max-width: 960px) {
  .home {
    min-height: 0;
    padding-block: 96px 56px;
  }
  .home__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'intro'
      'wheel'
      'panel';
    row-gap: var(--sp-4);
  }
  .home__wheel {
    max-width: 560px;
  }
  .panel {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .home {
    padding-top: 84px;
  }
  .home__title {
    font-size: 2rem;
  }
  .panel__name {
    font-size: 2rem;
  }
  .panel__brief {
    font-size: 1.125rem;
  }
  .panel__pentads li {
    font-size: 0.8125rem;
    letter-spacing: 0.02em;
  }
  .panel__cta {
    flex: 1 1 100%;
    justify-content: center;
  }
}
</style>
