<script setup lang="ts">
export interface DemoCardProps {
  title?: string
  subtitle?: string
  /** 标题前的强调条颜色 */
  accent?: string
  /** 内容区去掉内边距（放表格时用） */
  flush?: boolean
}

withDefaults(defineProps<DemoCardProps>(), {
  title: '',
  subtitle: '',
  accent: 'var(--demo-primary)',
  flush: false
})
</script>

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
