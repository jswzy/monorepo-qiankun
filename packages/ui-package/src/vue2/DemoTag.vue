<template>
  <span :class="classes">
    <i v-if="dot" class="demo-tag__dot" />
    <slot />
  </span>
</template>

<script>
export default {
  name: 'DemoTag',
  props: {
    /** neutral | primary | success | warning | danger */
    tone: { type: String, default: 'neutral' },
    dot: { type: Boolean, default: false }
  },
  computed: {
    classes() {
      return ['demo-tag', this.tone !== 'neutral' && `demo-tag--${this.tone}`]
    }
  }
}
</script>
