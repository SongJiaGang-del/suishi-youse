<script setup lang="ts">
import { useTerm } from '../composables/useTerm'
import { TERMS } from '../data/terms'

const { now } = useTerm()
</script>

<template>
  <footer id="about" class="footer">
    <div class="footer__strip" aria-hidden="true">
      <i v-for="t in TERMS" :key="t.index" :style="{ background: t.color.hex }"></i>
    </div>

    <div class="wrap footer__grid">
      <div>
        <p class="footer__brand">岁时有色</p>
        <p class="footer__line">二十四节气与中国传统色</p>
      </div>

      <div class="footer__about">
        <h2>关于这个网站</h2>
        <p>
          岁时有色是一个文化专题网站，为每个节气配一种传统色。色名取自通行的中国传统色名，色值是为屏幕拟定的近似值；交节日期每年略有浮动，以当年天文年历为准。
        </p>
      </div>

      <nav class="footer__nav" aria-label="页脚导航">
        <a href="#top">首页</a>
        <a href="#wheel">节气</a>
        <a href="#seasons">四季</a>
        <a href="#palette">色谱</a>
      </nav>
    </div>

    <div class="wrap">
      <p class="footer__legal latin">© {{ now.getFullYear() }} 岁时有色 · 课程作品</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--ink);
  color: var(--paper);
}

.footer__strip {
  display: flex;
  height: 10px;
}
.footer__strip i {
  flex: 1;
}

.footer__grid {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 5fr) minmax(0, 3fr);
  column-gap: clamp(32px, 6vw, 96px);
  row-gap: var(--sp-6);
  padding-block: var(--sp-12) var(--sp-8);
}

.footer__brand {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-40);
  letter-spacing: 0.24em;
  line-height: 1.2;
}
.footer__line {
  margin-top: var(--sp-1);
  font-family: var(--font-kai);
  font-size: 1.125rem;
  letter-spacing: 0.2em;
  color: var(--line);
}

.footer__about h2 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-16);
  letter-spacing: 0.2em;
}
.footer__about p {
  margin-top: var(--sp-2);
  font-size: var(--fs-14);
  line-height: 2;
  color: var(--line);
}

.footer__nav {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.3em;
}
.footer__nav a {
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s;
}
.footer__nav a:hover {
  border-color: currentColor;
}

.footer__legal {
  padding-block: var(--sp-3);
  border-top: 1px solid rgb(245 240 230 / 0.18);
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  color: var(--line);
}

@media (max-width: 860px) {
  .footer__grid {
    grid-template-columns: minmax(0, 1fr);
    padding-block: var(--sp-8) var(--sp-6);
  }
  .footer__nav {
    grid-auto-flow: column;
    justify-content: start;
    gap: 24px;
  }
}
</style>
