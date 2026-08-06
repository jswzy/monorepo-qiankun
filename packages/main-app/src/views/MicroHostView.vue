<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SUB_APPS } from '@demo/build-config/apps'
import { microStatus } from '../micro/register'

const route = useRoute()
const app = computed(() => SUB_APPS.find((a) => a.key === route.meta.micro))
const loading = computed(() => app.value && microStatus[app.value.key] !== 'mounted')
</script>

<template>
  <div v-if="loading" class="micro-loading">
    <span class="micro-loading__spinner" />
    <p>
      正在加载微应用 <b>{{ app?.title }}</b>
      <em>{{ app?.framework }}</em>
    </p>
    <small class="demo-muted">
      qiankun 正在拉取
      <code>{{ app?.key }}</code>
      的独立产物并执行其生命周期
    </small>
  </div>
</template>

<style scoped>
.micro-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 80px 0;
  color: var(--demo-text-secondary);
}
.micro-loading p {
  margin: 0;
  font-size: 13.5px;
}
.micro-loading em {
  font-style: normal;
  margin-left: 6px;
  font-size: 12px;
  color: var(--demo-text-muted);
}
.micro-loading code {
  font-family: var(--demo-font-mono);
  background: var(--demo-surface-sunken);
  padding: 1px 5px;
  border-radius: 3px;
}
.micro-loading__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--demo-border-strong);
  border-top-color: var(--demo-primary);
  border-radius: 50%;
  animation: micro-spin 0.7s linear infinite;
}
@keyframes micro-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
