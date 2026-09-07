<template>
  <div class="order-detail-page">
    <!-- 被白屏监控的「根节点」：监控器轮询它的子元素数量 / 骨架屏状态 -->
    <section ref="root" class="order-detail-root">
      <template v-if="!simulateEmpty">
        <!-- 骨架屏（data-skeleton 是监控器识别骨架屏的标记） -->
        <div v-if="loading" class="ws-skeleton" data-skeleton>
          <div class="ws-skeleton__title shimmer"></div>
          <div class="ws-skeleton__row"><span class="shimmer"></span><span class="shimmer"></span></div>
          <div class="ws-skeleton__row"><span class="shimmer"></span><span class="shimmer"></span></div>
          <div class="ws-skeleton__row"><span class="shimmer"></span><span class="shimmer"></span></div>
          <div class="ws-skeleton__row"><span class="shimmer"></span><span class="shimmer"></span></div>
          <div class="ws-skeleton__row"><span class="shimmer"></span><span class="shimmer"></span></div>
        </div>

        <!-- 真实内容 -->
        <DemoCard
          v-else
          :title="`订单详情 ${id}`"
          :subtitle="order ? order.customer : '未找到该订单'"
          accent="#e8663d"
        >
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
    </section>

    <!-- 白屏监控面板（放在监控根节点之外，避免干扰 DOM 检测的计数） -->
    <section class="ws-panel">
      <header class="ws-panel__head">
        <b>🛰️ 白屏监控</b>
        <DemoTag :tone="detectedReport ? 'primary' : 'success'" dot>
          {{ detectedReport ? '已触发白屏告警' : '监控中' }}
        </DemoTag>
      </header>

      <p class="ws-panel__hint">
        监控器复用 <code>@demo/shared-utils/white-screen</code>：
        <b>DOM 检测</b>（根节点子元素数长时间为 0）+
        <b>骨架屏超时</b>（MutationObserver 监听骨架屏消失 + 5s 超时判定）。
        命中即<b>实时上报</b>，并把「模拟请求」落盘到浏览器
        <code>localStorage(@demo:monitor:white-screen-queue)</code>。
      </p>

      <div v-if="detectedReport" class="ws-alert">
        <div class="ws-alert__row"><span>策略</span><b>{{ strategyText }}</b></div>
        <div class="ws-alert__row"><span>时间</span><b>{{ timeText }}</b></div>
        <div class="ws-alert__row"><span>路由</span><b class="demo-mono">{{ detectedReport.route }}</b></div>
        <div class="ws-alert__row"><span>根节点子元素</span><b>{{ detectedReport.childCount }}</b></div>
        <div class="ws-alert__row">
          <span>上报结果</span>
          <DemoTag :tone="statusTone">{{ statusText2 }}</DemoTag>
        </div>
      </div>

      <div class="ws-actions">
        <DemoButton size="small" @click="simulateSkeletonHang">模拟骨架屏卡死（5s 后白屏）</DemoButton>
        <DemoButton size="small" @click="simulateEmptyRoot">模拟根节点为空（4s 后白屏）</DemoButton>
        <DemoButton size="small" @click="restore">恢复正常 / 重启监控</DemoButton>
        <DemoButton size="small" @click="clearLocal">清空本地记录</DemoButton>
      </div>

      <div class="ws-queue">
        <div class="ws-queue__head">
          本地 localStorage 模拟请求（{{ queue.length }}）
        </div>
        <ul v-if="queue.length">
          <li v-for="item in queue" :key="item.id">
            <code>{{ item.id }}</code>
            <span class="ws-queue__meta">{{ item.strategy }} · {{ item.status }} · {{ formatTime(item.timestamp) }}</span>
          </li>
        </ul>
        <p v-else class="demo-muted">暂无记录</p>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DemoCard, DemoTag, DemoButton } from '@demo/ui-package/vue2'
import {
  ORDERS,
  ORDER_STATUS_TEXT,
  formatMoney,
  formatDate,
  type OrderItem
} from '@demo/shared-utils'
import {
  createWhiteScreenMonitor,
  getWhiteScreenQueue,
  clearWhiteScreenQueue,
  type WhiteScreenMonitor,
  type WhiteScreenReport
} from '@demo/shared-utils/white-screen'

export default defineComponent({
  name: 'OrderDetailView',
  components: { DemoCard, DemoTag, DemoButton },
  props: {
    id: { type: String, required: true }
  },
  data() {
    return {
      statusText: ORDER_STATUS_TEXT,
      /** 是否处于加载态（展示骨架屏） */
      loading: true,
      /** 演示：强制骨架屏卡死 */
      simulateHang: false,
      /** 演示：强制根节点为空（无任何子元素） */
      simulateEmpty: false,
      /** 最近一次白屏上报记录 */
      detectedReport: null as WhiteScreenReport | null,
      /** 从 localStorage 读取的模拟请求列表 */
      queue: [] as WhiteScreenReport[],
      monitor: null as WhiteScreenMonitor | null,
      loadTimer: undefined as number | undefined
    }
  },
  computed: {
    order(): OrderItem | undefined {
      return (ORDERS as OrderItem[]).find((o) => o.id === this.id)
    },
    strategyText(): string {
      return this.detectedReport?.strategy === 'skeleton' ? '骨架屏超时（X 秒内仍只有骨架屏）' : 'DOM 空节点（根节点长时间无子元素）'
    },
    timeText(): string {
      return this.detectedReport ? this.formatTime(this.detectedReport.timestamp) : ''
    },
    statusText2(): string {
      const s = this.detectedReport?.status
      return s === 'sent' ? '已实时上报' : s === 'failed' ? '上报失败（已落盘）' : '模拟请求已落盘'
    },
    statusTone(): 'success' | 'primary' | 'neutral' {
      const s = this.detectedReport?.status
      return s === 'sent' ? 'success' : s === 'failed' ? 'primary' : 'neutral'
    }
  },
  mounted() {
    // 模拟一次异步加载：约 700ms 后骨架屏消失、渲染真实内容
    this.loading = true
    this.loadTimer = window.setTimeout(() => {
      if (!this.simulateHang) this.loading = false
    }, 700)

    this.refreshQueue()
    this.startMonitor()
  },
  beforeDestroy() {
    if (this.loadTimer) clearTimeout(this.loadTimer)
    this.stopMonitor()
  },
  methods: {
    /** 启动白屏监控（在监控根节点挂载完成后调用） */
    startMonitor() {
      const root = this.$refs.root as unknown as HTMLElement | undefined
      if (!root) return
      this.monitor = createWhiteScreenMonitor({
        root,
        appKey: __APP_KEY__,
        framework: __APP_FRAMEWORK__,
        route: `/order/detail/${this.id}`,
        emptyThresholdMs: 4000,
        skeletonTimeoutMs: 5000,
        onWhiteScreen: (report) => {
          this.detectedReport = report
          this.refreshQueue()
        }
      })
      this.monitor.start()
    },
    stopMonitor() {
      this.monitor?.stop()
      this.monitor = null
    },
    refreshQueue() {
      this.queue = getWhiteScreenQueue()
    },
    /** 演示：让骨架屏一直挂着 → 5s 超时判定白屏 */
    simulateSkeletonHang() {
      this.simulateEmpty = false
      this.simulateHang = true
      this.loading = true
    },
    /** 演示：让根节点一个子元素都没有 → 4s DOM 空检测判定白屏 */
    simulateEmptyRoot() {
      this.simulateHang = false
      this.loading = false
      this.simulateEmpty = true
    },
    /** 恢复正常并重启监控，便于反复演示 */
    restore() {
      this.simulateHang = false
      this.simulateEmpty = false
      this.loading = false
      this.detectedReport = null
      this.stopMonitor()
      this.startMonitor()
    },
    /** 清空浏览器 localStorage 中的模拟请求记录 */
    clearLocal() {
      clearWhiteScreenQueue()
      this.refreshQueue()
    },
    formatTime(ts: number): string {
      return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false })
    },
    money(value: number) {
      return formatMoney(value)
    },
    date(value: string) {
      return formatDate(value)
    }
  }
})
</script>

<style scoped>
.order-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-detail-root:empty::after {
  content: '（根节点当前无任何子元素 —— 触发 DOM 空检测）';
  display: block;
  padding: 24px;
  color: #b06a4f;
  font-size: 13px;
  text-align: center;
}

/* ---- 骨架屏 ---- */
.ws-skeleton {
  padding: 20px;
  border: 1px solid #f0e2dc;
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ws-skeleton__title {
  height: 22px;
  width: 40%;
  border-radius: 6px;
}
.ws-skeleton__row {
  display: flex;
  gap: 12px;
}
.ws-skeleton__row .shimmer {
  height: 14px;
  border-radius: 6px;
}
.ws-skeleton__row .shimmer:first-child {
  width: 40%;
}
.ws-skeleton__row .shimmer:last-child {
  flex: 1;
}
.shimmer {
  background: linear-gradient(90deg, #f3ece9 25%, #e9dcd6 37%, #f3ece9 63%);
  background-size: 400% 100%;
  animation: ws-shimmer 1.3s ease infinite;
}
@keyframes ws-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

/* ---- 监控面板 ---- */
.ws-panel {
  border: 1px dashed #d8c4bc;
  border-radius: 12px;
  padding: 16px;
  background: #fffaf8;
}
.ws-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.ws-panel__hint {
  font-size: 12.5px;
  line-height: 1.7;
  color: #6b5b54;
  margin: 0 0 12px;
}
.ws-panel__hint code {
  background: #f3e7e1;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
}
.ws-alert {
  border: 1px solid #f3c9b8;
  background: #fff1ea;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ws-alert__row {
  display: flex;
  gap: 10px;
  font-size: 13px;
}
.ws-alert__row span {
  width: 96px;
  color: #9a7b70;
}
.ws-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.ws-queue {
  border-top: 1px solid #efe2dc;
  padding-top: 10px;
}
.ws-queue__head {
  font-size: 12.5px;
  color: #9a7b70;
  margin-bottom: 6px;
}
.ws-queue ul {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 180px;
  overflow: auto;
}
.ws-queue li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed #f0e6e1;
  font-size: 12px;
}
.ws-queue li code {
  color: #c0563a;
}
.ws-queue__meta {
  color: #9a7b70;
  white-space: nowrap;
}
</style>
