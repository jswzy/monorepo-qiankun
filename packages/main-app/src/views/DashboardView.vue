<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DemoCard, DemoStat, DemoTag, DemoButton } from '@demo/ui-package/vue3'
import {
  METRICS,
  ORDERS,
  ORDER_STATUS_TEXT,
  formatMoney,
  formatDate,
  eventBus,
  type OrderItem
} from '@demo/shared-utils'
import { SUB_APPS } from '@demo/build-config/apps'
import { microStatus, globalState, patchGlobalState } from '../micro/register'
import ChinaSalesMap from './ChinaSalesMap.vue'

const router = useRouter()
const recent = ref<OrderItem[]>(ORDERS.slice(0, 5))

const toneOf = (status: OrderItem['status']) =>
  ({ pending: 'warning', paid: 'primary', shipped: 'primary', done: 'success', closed: 'neutral' })[
    status
  ] as 'warning' | 'primary' | 'success' | 'neutral'

const total = computed(() => recent.value.reduce((sum, o) => sum + o.amount, 0))

function openMicro(rule: string) {
  router.push(rule)
}

function broadcast() {
  eventBus.emit('app:navigate', { to: '/order', from: '/' })
  patchGlobalState({ lastAction: `主应用广播了一次事件 @ ${formatDate(Date.now(), 'HH:mm:ss')}` })
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-grid demo-grid--4">
      <DemoStat
        v-for="m in METRICS"
        :key="m.id"
        :label="m.label"
        :value="m.value"
        :unit="m.unit"
        :delta="m.delta"
      />
    </div>

    <ChinaSalesMap />

    <DemoCard title="微应用总览" subtitle="运行时独立 · 开发时同仓" accent="#2f5bd8">
      <template #extra>
        <span>qiankun 注册 {{ SUB_APPS.length }} 个微应用</span>
      </template>
      <div class="demo-grid demo-grid--2">
        <div v-for="app in SUB_APPS" :key="app.key" class="app-card">
          <div class="app-card__head">
            <span class="app-card__icon" :style="{ background: app.accent + '1a', color: app.accent }">
              {{ app.icon }}
            </span>
            <div class="app-card__title">
              <b>{{ app.title }}</b>
              <em>{{ app.name }}</em>
            </div>
            <DemoTag
              :tone="microStatus[app.key] === 'mounted' ? 'success' : microStatus[app.key] === 'loading' ? 'warning' : 'neutral'"
              dot
            >
              {{ microStatus[app.key] === 'mounted' ? '运行中' : microStatus[app.key] === 'loading' ? '加载中' : '未加载' }}
            </DemoTag>
          </div>
          <dl class="app-card__meta">
            <div><dt>技术栈</dt><dd>{{ app.framework }}</dd></div>
            <div><dt>激活路由</dt><dd class="demo-mono">{{ app.activeRule }}</dd></div>
            <div><dt>开发端口</dt><dd class="demo-mono">{{ app.devPort }}</dd></div>
            <div><dt>部署路径</dt><dd class="demo-mono">{{ app.publicPath }}</dd></div>
          </dl>
          <DemoButton type="primary" size="small" block @click="openMicro(app.activeRule)">
            进入 {{ app.title }}
          </DemoButton>
        </div>
      </div>
    </DemoCard>

    <DemoCard title="最近订单" :subtitle="`合计 ${formatMoney(total)}`" accent="#e8663d" flush>
      <template #extra>
        <DemoButton size="small" type="ghost" @click="broadcast">广播一次全局事件</DemoButton>
        <span>数据来自 @demo/shared-utils 的共享 mock</span>
      </template>
      <table class="demo-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>渠道</th>
            <th class="is-num">金额</th>
            <th>状态</th>
            <th>下单时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in recent" :key="o.id">
            <td class="is-mono">{{ o.id }}</td>
            <td>{{ o.customer }}</td>
            <td>{{ o.channel }}</td>
            <td class="is-num">{{ formatMoney(o.amount) }}</td>
            <td><DemoTag :tone="toneOf(o.status)">{{ ORDER_STATUS_TEXT[o.status] }}</DemoTag></td>
            <td class="is-mono">{{ formatDate(o.createdAt, 'MM-DD HH:mm') }}</td>
          </tr>
        </tbody>
      </table>
    </DemoCard>

    <DemoCard title="全局状态（qiankun initGlobalState）" accent="#2f7d5f">
      <div class="state-grid">
        <div><span>当前用户</span><b>{{ globalState.user.name }} · {{ globalState.user.role }}</b></div>
        <div><span>所属部门</span><b>{{ globalState.user.dept }}</b></div>
        <div><span>待办数量</span><b>{{ globalState.todoCount }}</b></div>
        <div><span>最近动作</span><b>{{ globalState.lastAction }}</b></div>
      </div>
      <p class="demo-muted" style="margin: 12px 0 0">
        在任意子应用里点击「同步一条全局状态」，这里会实时变化 —— 状态由主应用统一下发，跨技术栈共享。
      </p>
    </DemoCard>
  </div>
</template>

<style scoped>
.app-card {
  border: 1px solid var(--demo-border);
  border-radius: var(--demo-radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fcfcfd;
}
.app-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.app-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 15px;
  flex: none;
}
.app-card__title {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  min-width: 0;
}
.app-card__title b {
  font-size: 13.5px;
}
.app-card__title em {
  font-style: normal;
  font-size: 11px;
  color: var(--demo-text-muted);
  font-family: var(--demo-font-mono);
}
.app-card__meta {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}
.app-card__meta div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.app-card__meta dt {
  font-size: 11px;
  color: var(--demo-text-muted);
}
.app-card__meta dd {
  margin: 0;
  font-size: 12.5px;
  color: var(--demo-text);
}
.state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.state-grid div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.state-grid span {
  font-size: 11.5px;
  color: var(--demo-text-muted);
}
.state-grid b {
  font-size: 13px;
  font-weight: 600;
}
</style>
