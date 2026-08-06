<script setup lang="ts">
import { computed } from 'vue'

export interface DemoTagProps {
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  dot?: boolean
}

const props = withDefaults(defineProps<DemoTagProps>(), { tone: 'neutral', dot: false })

const classes = computed(() => ['demo-tag', props.tone !== 'neutral' && `demo-tag--${props.tone}`])
</script>

<template>
  <span :class="classes">
    <i v-if="dot" class="demo-tag__dot" />
    <slot />
  </span>
</template>
