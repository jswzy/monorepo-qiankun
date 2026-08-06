<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DemoCard, DemoTag, DemoStat, DemoButton } from '@demo/ui-package/vue3'
import {
  PRODUCTS,
  PRODUCT_STATUS_TEXT,
  formatMoney,
  formatDate,
  eventBus,
  type ProductItem
} from '@demo/shared-utils'
import { globalState, patchGlobalState, isStateConnected } from '../global-store'

const router = useRouter()
const products = ref<ProductItem[]>(PRODUCTS.map((p) => ({ ...p })))
const keyword = ref('')

const filtered = computed(() =>
  products.value.filter(
    (p) => !keyword.value || p.name.includes(keyword.value) || p.category.includes(keyword.value)
  )
)
const onSaleCount = computed(() => products.value.filter((p) => p.status === 'on').length)
const stockTotal = computed(() => products.value.reduce((s, p) => s + p.stock, 0))
const stockValue = computed(() => products.value.reduce((s, p) => s + p.stock * p.price, 0))

const toneOf = (status: ProductItem['status']) =>
  ({ on: 'success', off: 'danger', draft: 'neutral' })[status] as 'success' | 'danger' | 'neutral'

function toggleStatus(item: ProductItem) {
  item.status = item.status === 'on' ? 'off' : 'on'
  eventBus.emit('product:updated', { id: item.id, name: item.name })
  patchGlobalState({
    lastAction: `商品中心（Vue 3）${item.status === 'on' ? '上架' : '下架'}了 ${item.name}`
  })
}

function syncGlobal() {
  patchGlobalState({
    lastAction: `商品中心（Vue 3）于 ${formatDate(Date.now(), 'HH:mm:ss')} 同步了状态`,
    todoCount: globalState.todoCount + 1
  })
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-grid demo-grid--4">
      <DemoStat label="在售 SKU" :value="onSaleCount" unit="件" :delta="0.076" :compact="false" />
      <DemoStat label="库存总量" :value="stockTotal" unit="件" :delta="0.031" />
      <DemoStat label="库存货值" :value="stockValue" unit="元" :delta="-0.008" />
      <DemoStat label="品类数" :value="new Set(products.map((p) => p.category)).size" unit="件" :delta="0" :compact="false" />
    </div>

    <DemoCard title="商品列表" :subtitle="`共 ${filtered.length} 条`" accent="#2f7d5f" flush>
      <template #extra>
        <span>数据源：@demo/shared-utils</span>
      </template>

      <div style="padding: 12px 16px; border-bottom: 1px solid var(--demo-border)">
        <div class="toolbar">
          <input v-model="keyword" class="search" placeholder="搜索商品名 / 品类" />
          <span class="toolbar__spacer" />
          <DemoTag :tone="isStateConnected() ? 'success' : 'warning'" dot>
            {{ isStateConnected() ? '已接入基座全局状态' : '本地状态（独立运行）' }}
          </DemoTag>
          <DemoButton size="small" type="primary" @click="syncGlobal">同步一条全局状态</DemoButton>
        </div>
      </div>

      <table class="demo-table">
        <thead>
          <tr>
            <th>编码</th>
            <th>商品名称</th>
            <th>品类</th>
            <th class="is-num">单价</th>
            <th class="is-num">库存</th>
            <th>状态</th>
            <th style="width: 150px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.id">
            <td>
              <span class="link-cell" @click="router.push(`/detail/${row.id}`)">{{ row.id }}</span>
            </td>
            <td>{{ row.name }}</td>
            <td>{{ row.category }}</td>
            <td class="is-num">{{ formatMoney(row.price) }}</td>
            <td class="is-num">{{ row.stock.toLocaleString('zh-CN') }}</td>
            <td><DemoTag :tone="toneOf(row.status)">{{ PRODUCT_STATUS_TEXT[row.status] }}</DemoTag></td>
            <td>
              <div class="demo-row">
                <DemoButton size="small" type="ghost" @click="router.push(`/detail/${row.id}`)">
                  详情
                </DemoButton>
                <DemoButton size="small" @click="toggleStatus(row)">
                  {{ row.status === 'on' ? '下架' : '上架' }}
                </DemoButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </DemoCard>

    <DemoCard title="同构验证" subtitle="与 Vue2 / React 子应用共用同一套公共包" accent="#8a8f99">
      <ul class="tips">
        <li>
          本页组件来自 <code>@demo/ui-package/vue3</code>，订单中心用的是同一个包的
          <code>/vue2</code> 子路径，数据报表用 <code>/react</code> —— 三套实现共享同一份 CSS 令牌。
        </li>
        <li>修改 <code>packages/ui-package/src/styles/index.css</code>，三个子应用会同时热更新。</li>
        <li>
          修改 <code>packages/shared-utils/src/format.ts</code> 里的
          <code>formatMoney</code>，本页金额展示立即变化，无需重新 build 公共包。
        </li>
      </ul>
    </DemoCard>
  </div>
</template>

<style scoped>
.search {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--demo-border-strong);
  border-radius: var(--demo-radius-sm);
  font-size: 13px;
  outline: none;
  width: 220px;
  font-family: var(--demo-font);
}
.search:focus {
  border-color: var(--demo-primary);
}
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
