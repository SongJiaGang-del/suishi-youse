<script setup lang="ts">
import { useTerm } from '../composables/useTerm'

const { todayTerm, dayOfTerm } = useTerm()
</script>

<template>
  <section class="preface section" aria-labelledby="preface-title">
    <div class="wrap preface__grid">
      <h2 id="preface-title" v-reveal class="preface__mark">序</h2>

      <p v-reveal="80" class="preface__statement">
        节气是古人为时间刻下的二十四道刻度，传统色是他们给万物起的名字。这里把两者对在一起：<em>一个节气，一种颜色</em>，一年读作二十四色。
      </p>

      <p v-reveal="160" class="preface__note">
        今天是{{ todayTerm.name }}第 {{ dayOfTerm }} 日，页面用的是{{ todayTerm.color.name }}。往下转动岁时轮，可以把整页换成任何一个节气的颜色。
      </p>
    </div>
  </section>
</template>

<style scoped>
.preface {
  background: var(--c-wash);
}

.preface__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--sp-3);
  row-gap: var(--sp-6);
}

.preface__mark {
  grid-column: 1 / span 2;
  align-self: start;
  width: 1.6em;
  height: 1.6em;
  display: grid;
  place-items: center;
  border: 1px solid var(--c-deep);
  color: var(--c-deep);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-28);
}

.preface__statement {
  grid-column: 3 / span 9;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 3.1vw, 2.5rem);
  line-height: 1.7;
  letter-spacing: 0.04em;
  text-wrap: pretty;
}
.preface__statement em {
  font-style: normal;
  font-weight: 900;
  color: var(--c-deep);
}

.preface__note {
  grid-column: 8 / span 4;
  color: var(--ink);
  font-size: var(--fs-14);
  line-height: 2;
  padding-top: var(--sp-2);
  border-top: 1px solid var(--c-deep);
}

@media (max-width: 760px) {
  .preface__mark,
  .preface__statement,
  .preface__note {
    grid-column: 1 / -1;
  }
  .preface__grid {
    row-gap: var(--sp-4);
  }
}
</style>
