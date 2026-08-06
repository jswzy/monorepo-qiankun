<!--
  Vue 2.7 实现。
  注意：这里刻意不 import 'vue'，避免在 monorepo 中被解析到隔壁 Vue3 应用的框架版本；
  组件用 Options API 纯对象声明，由消费方（app-order）的 Vue 2 运行时接管。
-->
<template>
  <button :class="classes" type="button" :disabled="disabled" @click="onClick">
    <slot />
  </button>
</template>

<script>
export default {
  name: 'DemoButton',
  props: {
    /** default | primary | ghost | danger */
    type: { type: String, default: 'default' },
    /** small | medium | large */
    size: { type: String, default: 'medium' },
    block: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  computed: {
    classes() {
      return [
        'demo-btn',
        this.type !== 'default' && `demo-btn--${this.type}`,
        this.size !== 'medium' && `demo-btn--${this.size}`,
        this.block && 'demo-btn--block',
        this.disabled && 'is-disabled'
      ]
    }
  },
  methods: {
    onClick(ev) {
      if (this.disabled) return
      this.$emit('click', ev)
    }
  }
}
</script>
