<script setup lang="ts">
import HeroTerm from './components/HeroTerm.vue'
import PaintingPlate from './components/PaintingPlate.vue'
import PaletteCard from './components/PaletteCard.vue'
import PrefaceSection from './components/PrefaceSection.vue'
import SeasonBands from './components/SeasonBands.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import TermWheel from './components/TermWheel.vue'
import { useCopy } from './composables/useCopy'

const { message } = useCopy()
</script>

<template>
  <SiteHeader />
  <main>
    <HeroTerm />
    <PrefaceSection />
    <PaintingPlate />
    <TermWheel />
    <SeasonBands />
    <PaletteCard />
  </main>
  <SiteFooter />

  <div class="toast" role="status" aria-live="polite">
    <Transition name="toast">
      <p v-if="message">{{ message }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  inset: auto 0 32px 0;
  z-index: 50;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.toast p {
  padding: 10px 22px;
  background: var(--ink);
  color: var(--paper);
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s var(--ease),
    transform 0.3s var(--ease);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
