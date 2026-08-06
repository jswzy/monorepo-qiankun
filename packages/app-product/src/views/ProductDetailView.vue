<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DemoCard, DemoTag, DemoButton } from '@demo/ui-package/vue3'
import { PRODUCTS, PRODUCT_STATUS_TEXT, formatMoney, type ProductItem } from '@demo/shared-utils'

const props = defineProps<{ id: string }>()
const router = useRouter()

const product = computed<ProductItem | undefined>(() => PRODUCTS.find((p) => p.id === props.id))
</script>

<template>
  <DemoCard
    :title="`商品详情 ${id}`"
    :subtitle="product ? product.name : '未找到该商品'"
    accent="#2f7d5f"
  >
    <template #extra>
      <DemoButton size="small" @click="router.push('/')">返回列表</DemoButton>
    </template>

    <div v-if="product" class="detail-grid">
      <div><span>商品编码</span><b class="demo-mono">{{ product.id }}</b></div>
      <div><span>商品名称</span><b>{{ product.name }}</b></div>
      <div><span>品类</span><b>{{ product.category }}</b></div>
      <div><span>单价</span><b>{{ formatMoney(product.price) }}</b></div>
      <div><span>库存</span><b>{{ product.stock.toLocaleString('zh-CN') }}</b></div>
      <div>
        <span>状态</span>
        <b><DemoTag :tone="product.status === 'on' ? 'success' : 'neutral'">{{ PRODUCT_STATUS_TEXT[product.status] }}</DemoTag></b>
      </div>
    </div>
    <p v-else class="demo-muted">该商品不存在。</p>
  </DemoCard>
</template>
