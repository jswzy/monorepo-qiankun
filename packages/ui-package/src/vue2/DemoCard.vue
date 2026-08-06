<template>
  <section class="demo-card" :class="{ 'demo-card--flush': flush }">
    <header v-if="title || $slots.extra" class="demo-card__head">
      <div class="demo-card__title-wrap">
        <span class="demo-card__accent" :style="{ background: accent }" />
        <span class="demo-card__title">{{ title }}</span>
        <span v-if="subtitle" class="demo-card__subtitle">{{ subtitle }}</span>
      </div>
      <div v-if="$slots.extra" class="demo-card__extra"><slot name="extra" /></div>
    </header>
    <div class="demo-card__body"><slot /></div>
  </section>
</template>

<script>
export default {
  name: 'DemoCard',
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    accent: { type: String, default: 'var(--demo-primary)' },
    flush: { type: Boolean, default: false }
  }
}
</script>
