<template>
  <DemoCard :title="`订单详情 ${id}`" :subtitle="order ? order.customer : '未找到该订单'" accent="#e8663d">
    <template #extra>
      <DemoButton size="small" @click="$router.push('/')">返回列表</DemoButton>
    </template>

    <div v-if="order" class="detail-grid">
      <div><span>订单号</span><b class="demo-mono">{{ order.id }}</b></div>
      <div><span>客户</span><b>{{ order.customer }}</b></div>
      <div><span>渠道</span><b>{{ order.channel }}</b></div>
      <div><span>金额</span><b>{{ money(order.amount) }}</b></div>
      <div>
        <span>状态</span>
        <b><DemoTag :tone="order.status === 'done' ? 'success' : 'primary'">{{ statusText[order.status] }}</DemoTag></b>
      </div>
      <div><span>下单时间</span><b class="demo-mono">{{ date(order.createdAt) }}</b></div>
    </div>
    <p v-else class="demo-muted">该订单不存在，可能已被关闭。</p>
  </DemoCard>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DemoCard, DemoTag, DemoButton } from '@demo/ui-package/vue2'
import { ORDERS, ORDER_STATUS_TEXT, formatMoney, formatDate, type OrderItem } from '@demo/shared-utils'

export default defineComponent({
  name: 'OrderDetailView',
  components: { DemoCard, DemoTag, DemoButton },
  props: {
    id: { type: String, required: true }
  },
  data() {
    return { statusText: ORDER_STATUS_TEXT }
  },
  computed: {
    order(): OrderItem | undefined {
      return (ORDERS as OrderItem[]).find((o) => o.id === this.id)
    }
  },
  methods: {
    money(value: number) {
      return formatMoney(value)
    },
    date(value: string) {
      return formatDate(value)
    }
  }
})
</script>
