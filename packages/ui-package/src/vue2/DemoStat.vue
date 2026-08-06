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

<script>
// 跨框架复用同一套格式化口径：这里吃的就是 @demo/shared-utils 的源码
import { formatPercent, formatCompact } from '@demo/shared-utils'

export default {
  name: 'DemoStat',
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, default: '' },
    delta: { type: Number, default: 0 },
    compact: { type: Boolean, default: true }
  },
  computed: {
    display() {
      return this.compact ? formatCompact(this.value) : this.value.toLocaleString('zh-CN')
    },
    deltaText() {
      return formatPercent(this.delta)
    },
    deltaClass() {
      return this.delta > 0 ? 'is-up' : this.delta < 0 ? 'is-down' : ''
    }
  }
}
</script>
