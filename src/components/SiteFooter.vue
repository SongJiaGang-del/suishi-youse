<script setup lang="ts">
import { useTerm } from '../composables/useTerm'
import { TERMS } from '../data/terms'
import { smoothScrollToTop } from '../utils/motion'

/** 页脚只在首页出现（见 App.vue），所以“岁时轮”这条链接永远是回到本页顶部 */
const { now, todayTerm } = useTerm()
</script>

<template>
  <footer class="footer">
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
          为每个节气配一种传统色，再配上物候、习俗、时令吃食和一首诗。色值是为屏幕拟定的近似值，画作来自博物馆的开放获取藏品。
        </p>
        <p>
          <RouterLink class="footer__more" :to="{ name: 'about' }">色名、画作与日期的来源<span aria-hidden="true">→</span></RouterLink>
        </p>
      </div>

      <nav class="footer__nav" aria-label="页脚导航">
        <RouterLink :to="{ name: 'home' }" @click="smoothScrollToTop">岁时轮</RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#directory' }">二十四节气目录</RouterLink>
        <RouterLink :to="{ name: 'palette' }">二十四色色谱</RouterLink>
        <RouterLink :to="{ name: 'about' }">关于</RouterLink>
        <RouterLink :to="{ name: 'term', params: { slug: todayTerm.slug } }">今日 · {{ todayTerm.name }}</RouterLink>
      </nav>
    </div>

    <div class="wrap footer__legal">
      <p class="latin">© {{ now.getFullYear() }} 岁时有色 · 课程作品</p>
      <p class="footer__credit">
        画作：克利夫兰艺术博物馆（CC0）· 字体：岁时宋（据思源宋体改制，OFL）
      </p>
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
.footer__about p + p {
  margin-top: var(--sp-1);
}
.footer__more {
  display: inline-block;
  padding-block: 8px;
  border-bottom: 1px solid transparent;
  color: var(--paper);
  letter-spacing: 0.1em;
  transition: border-color 0.25s;
}
.footer__more:hover {
  border-color: currentColor;
}
.footer__more span {
  margin-left: 0.4em;
}

.footer__nav {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.2em;
}
.footer__nav a {
  white-space: nowrap;
  padding-block: 2px;
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s;
}
.footer__nav a:hover,
.footer__nav a[aria-current='page'] {
  border-color: currentColor;
}

.footer__legal {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px var(--sp-4);
  padding-block: var(--sp-3);
  border-top: 1px solid rgb(245 240 230 / 0.18);
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  line-height: 1.8;
  color: var(--line);
}
.footer__credit {
  letter-spacing: 0.06em;
}

@media (max-width: 860px) {
  .footer__grid {
    grid-template-columns: minmax(0, 1fr);
    padding-block: var(--sp-8) var(--sp-6);
  }
  /* 三个链接排成一行放不下时整条链接换到下一行，不让一条链接自己折成两行 */
  .footer__nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 24px;
  }
}
</style>
