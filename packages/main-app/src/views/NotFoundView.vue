<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DemoCard, DemoButton } from '@demo/ui-package/vue3'

const router = useRouter()
</script>

<template>
  <DemoCard title="404" subtitle="没有匹配到主应用路由，也不属于任何微应用的激活规则">
    <p class="demo-muted" style="margin-top: 0">
      微应用的激活规则形如 <code>/order</code>、<code>/product</code>、<code>/report</code>。
    </p>
    <DemoButton type="primary" size="small" @click="router.push('/')">返回工作台</DemoButton>
  </DemoCard>
</template>
