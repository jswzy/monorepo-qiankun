<script setup lang="ts">
import { computed } from 'vue'

export interface DemoButtonProps {
  type?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  block?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<DemoButtonProps>(), {
  type: 'default',
  size: 'medium',
  block: false,
  disabled: false
})

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

const classes = computed(() => [
  'demo-btn',
  props.type !== 'default' && `demo-btn--${props.type}`,
  props.size !== 'medium' && `demo-btn--${props.size}`,
  props.block && 'demo-btn--block',
  props.disabled && 'is-disabled'
])

function onClick(ev: MouseEvent) {
  if (props.disabled) return
  emit('click', ev)
}
</script>

<template>
  <button :class="classes" type="button" :disabled="disabled" @click="onClick">
    <slot />
  </button>
</template>
