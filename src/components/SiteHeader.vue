<script setup lang="ts">
import { useTerm } from '../composables/useTerm'

const { now } = useTerm()
const pad = (n: number) => String(n).padStart(2, '0')
const dateText = `${now.getFullYear()} · ${pad(now.getMonth() + 1)} · ${pad(now.getDate())}`
const dateIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
</script>

<template>
  <header class="header">
    <a class="header__brand" href="#top" aria-label="岁时有色 首页">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="1.6 0.62" />
      </svg>
      <span>岁时有色</span>
    </a>

    <nav class="header__nav" aria-label="主导航">
      <a href="#wheel">节气</a>
      <a href="#palette">色谱</a>
      <a href="#about">关于</a>
    </nav>

    <time class="header__date latin" :datetime="dateIso">{{ dateText }}</time>
  </header>
</template>

<style scoped>
.header {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 28px var(--gutter);
  color: var(--on-c);
}

.header__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  justify-self: start;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--fs-20);
  letter-spacing: 0.24em;
}

.header__nav {
  display: flex;
  gap: clamp(24px, 4vw, 56px);
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.3em;
}

.header__nav a {
  position: relative;
  padding: 6px 0 6px 0.3em;
}
.header__nav a::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0.3em;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease);
}
.header__nav a:hover::after,
.header__nav a:focus-visible::after {
  transform: scaleX(1);
}

.header__date {
  justify-self: end;
  font-size: 1.125rem;
  letter-spacing: 0.08em;
}

@media (max-width: 760px) {
  .header {
    grid-template-columns: 1fr auto;
    padding-block: 20px;
  }
  .header__brand {
    font-size: var(--fs-16);
    letter-spacing: 0.18em;
    gap: 8px;
  }
  .header__nav {
    gap: 18px;
    font-size: var(--fs-14);
    letter-spacing: 0.2em;
  }
  .header__date {
    display: none;
  }
}
</style>
