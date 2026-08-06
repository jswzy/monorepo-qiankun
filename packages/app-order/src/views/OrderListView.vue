<template>
  <div class="demo-stack">
    <div class="demo-grid demo-grid--4">
      <DemoStat label="订单总数" :value="orders.length" unit="单" :delta="0.043" :compact="false" />
      <DemoStat label="订单金额" :value="totalAmount" unit="元" :delta="0.128" />
      <DemoStat label="待处理" :value="pendingCount" unit="单" :delta="-0.021" :compact="false" />
      <DemoStat label="平均客单价" :value="avgAmount" unit="元" :delta="0.017" />
    </div>

    <DemoCard title="订单列表" :subtitle="`共 ${filtered.length} 条`" accent="#e8663d" flush>
      <template #extra>
        <span>数据源：@demo/shared-utils</span>
      </template>

      <div style="padding: 12px 16px; border-bottom: 1px solid var(--demo-border)">
        <div class="toolbar">
          <DemoButton
            v-for="opt in statusOptions"
            :key="opt.value"
            size="small"
            :type="status === opt.value ? 'primary' : 'default'"
            @click="status = opt.value"
          >
            {{ opt.label }}
          </DemoButton>
          <span class="toolbar__spacer" />
          <DemoTag :tone="stateConnected ? 'success' : 'warning'" dot>
            {{ stateConnected ? '已接入基座全局状态' : '本地状态（独立运行）' }}
          </DemoTag>
          <DemoButton size="small" type="primary" @click="syncGlobal">同步一条全局状态</DemoButton>
        </div>
      </div>

      <table class="demo-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>渠道</th>
            <th class="is-num">金额</th>
            <th>状态</th>
            <th>下单时间</th>
            <th style="width: 80px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.id">
            <td>
              <span class="link-cell" @click="openDetail(row.id)">{{ row.id }}</span>
            </td>
            <td>{{ row.customer }}</td>
            <td>{{ row.channel }}</td>
            <td class="is-num">{{ money(row.amount) }}</td>
            <td>
              <DemoTag :tone="toneOf(row.status)">{{ statusText[row.status] }}</DemoTag>
            </td>
            <td class="is-mono">{{ date(row.createdAt) }}</td>
            <td>
              <DemoButton size="small" type="ghost" @click="openDetail(row.id)">详情</DemoButton>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="7" style="text-align: center; color: var(--demo-text-muted)">
              没有符合条件的订单
            </td>
          </tr>
        </tbody>
      </table>
    </DemoCard>

    <DemoCard title="跨应用共享说明" accent="#8a8f99">
      <ul class="tips">
        <li>
          表格里的金额、时间格式化，用的是
          <code>@demo/shared-utils</code> 的 <code>formatMoney / formatDate</code>；
          改公共包里的实现，这里会立即热更新。
        </li>
        <li>
          <code>DemoCard / DemoTag / DemoStat / DemoButton</code> 来自
          <code>@demo/ui-package/vue2</code>，与 Vue3、React 子应用共用同一套 CSS 设计令牌。
        </li>
        <li>「同步一条全局状态」会通过 qiankun 的 globalState 广播给基座与其它微应用。</li>
      </ul>
    </DemoCard>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DemoCard, DemoTag, DemoStat, DemoButton } from '@demo/ui-package/vue2'
import {
  ORDERS,
  ORDER_STATUS_TEXT,
  formatMoney,
  formatDate,
  eventBus,
  type OrderItem
} from '@demo/shared-utils'
import { globalStateMixin } from '../mixins/global-state'
import { globalStore } from '../global-store'

type StatusFilter = OrderItem['status'] | 'all'

export default defineComponent({
  name: 'OrderListView',
  components: { DemoCard, DemoTag, DemoStat, DemoButton },
  mixins: [globalStateMixin],
  data() {
    return {
      orders: ORDERS as OrderItem[],
      status: 'all' as StatusFilter,
      statusText: ORDER_STATUS_TEXT,
      statusOptions: [
        { label: '全部', value: 'all' },
        { label: '待付款', value: 'pending' },
        { label: '已付款', value: 'paid' },
        { label: '已发货', value: 'shipped' },
        { label: '已完成', value: 'done' }
      ]
    }
  },
  computed: {
    filtered(): OrderItem[] {
      const list = this.orders as OrderItem[]
      return this.status === 'all' ? list : list.filter((o) => o.status === this.status)
    },
    totalAmount(): number {
      return (this.orders as OrderItem[]).reduce((sum, o) => sum + o.amount, 0)
    },
    pendingCount(): number {
      return (this.orders as OrderItem[]).filter((o) => o.status === 'pending').length
    },
    avgAmount(): number {
      const list = this.orders as OrderItem[]
      return list.length ? Math.round(this.totalAmount / list.length) : 0
    }
  },
  methods: {
    money(value: number) {
      return formatMoney(value)
    },
    date(value: string) {
      return formatDate(value, 'MM-DD HH:mm')
    },
    toneOf(status: OrderItem['status']) {
      const map: Record<OrderItem['status'], string> = {
        pending: 'warning',
        paid: 'primary',
        shipped: 'primary',
        done: 'success',
        closed: 'neutral'
      }
      return map[status]
    },
    openDetail(id: string) {
      this.$router.push(`/detail/${id}`)
    },
    syncGlobal() {
      const stamp = formatDate(Date.now(), 'HH:mm:ss')
      globalStore().setState({
        lastAction: `订单中心（Vue 2）于 ${stamp} 同步了状态`,
        todoCount: (this.globalState?.todoCount ?? 0) + 1
      })
      eventBus.emit('order:created', { id: `SO-${Date.now()}`, amount: 8888 })
    }
  }
})
</script>

<style scoped>
.tips {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.95;
  color: var(--demo-text-secondary);
}
.tips code {
  font-family: var(--demo-font-mono);
  background: var(--demo-surface-sunken);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
}
</style>
