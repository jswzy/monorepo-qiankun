<script setup lang="ts">
import { computed } from 'vue'
import { formatPercent, formatCompact } from '@demo/shared-utils'

export interface DemoStatProps {
  label: string
  value: number
  unit?: string
  /** 环比，正数为涨（红），负数为跌（绿） */
  delta?: number
  /** 大数字是否缩写为「万/亿」 */
  compact?: boolean
}

const props = withDefaults(defineProps<DemoStatProps>(), { unit: '', delta: 0, compact: true })

const display = computed(() =>
  props.compact ? formatCompact(props.value) : props.value.toLocaleString('zh-CN')
)
const deltaText = computed(() => formatPercent(props.delta))
const deltaClass = computed(() => (props.delta > 0 ? 'is-up' : props.delta < 0 ? 'is-down' : ''))
</script>

<template>
  <div class="demo-stat">
    <div class="demo-stat__label">
      {{ label }}
      <slot name="label-extra" />
    </div>
    <div class="demo-stat__value">
      {{ display }}
      <span v-if="unit" class="demo-stat__unit">{{ unit }}</span>
    </div>
    <div class="demo-stat__delta" :class="deltaClass">环比 {{ deltaText }}</div>
  </div>
</template>
