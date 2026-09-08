<script setup lang="ts">
/**
 * 航运控制塔（微应用首页 / 初始视图）
 *
 * 布局：左侧主区 + 右侧可折叠货轮边栏。
 *  - 初始：主区渲染地球仪（ShipGlobe），连续自转，展示全部货轮「当前船位」。
 *  - 点击船位标记 / 边栏货轮 → 选中该船，地球仪叠加该船的大圆弧航线 + 六类挂靠点。
 *  - 边栏可折叠隐藏，最大化地图区域；选中态与地图联动高亮。
 *  - 「完整详情」进入 /route/:id 单船详情页（挂靠点时间轴等）。
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DemoTag, DemoButton } from '@demo/ui-package/vue3'
import ShipGlobe from '../components/ShipGlobe.vue'
import ShipSidebar from '../components/ShipSidebar.vue'
import {
  SHIPS,
  getShip,
  ROUTE_POINT_META,
  ROUTE_POINT_ORDER,
  routeDistanceNm,
  countByPointType,
  type Ship,
  type ShipStatus
} from '../data/ships'

const router = useRouter()

const selectedId = ref<string | null>(null)
const selected = computed<Ship | null>(() =>
  selectedId.value ? getShip(selectedId.value) ?? null : null
)
const sidebarOpen = ref(true)

const STATUS_TONE: Record<ShipStatus, 'success' | 'primary' | 'warning'> = {
  航行中: 'success',
  靠泊中: 'primary',
  锚泊中: 'warning'
}

/** 船队状态概览（顶部统计条用） */
const summary = computed(() => {
  const byStatus: Record<ShipStatus, number> = { 航行中: 0, 靠泊中: 0, 锚泊中: 0 }
  for (const s of SHIPS) byStatus[s.status] += 1
  return { total: SHIPS.length, byStatus }
})

const typeCount = computed(() => (selected.value ? countByPointType(selected.value) : null))

function select(ship: Ship): void {
  selectedId.value = ship.id
}
function clearSelection(): void {
  selectedId.value = null
}
function openDetail(): void {
  if (selected.value) router.push({ name: 'ship-route', params: { id: selected.value.id } })
}
</script>

<template>
  <div class="tower">
    <!-- 主区：全船位置 / 选中船航线 -->
    <section class="tower__main">
      <div class="tower__bar">
        <div class="tower__bar-left">
          <b class="tower__title">{{ selected ? selected.name : '全球船队实时位置' }}</b>
          <template v-if="!selected">
            <DemoTag tone="neutral">{{ summary.total }} 艘在航</DemoTag>
            <DemoTag tone="success" dot>航行中 {{ summary.byStatus['航行中'] }}</DemoTag>
            <DemoTag tone="primary" dot>靠泊中 {{ summary.byStatus['靠泊中'] }}</DemoTag>
            <DemoTag tone="warning" dot>锚泊中 {{ summary.byStatus['锚泊中'] }}</DemoTag>
          </template>
          <template v-else>
            <DemoTag :tone="STATUS_TONE[selected.status]" dot>{{ selected.status }}</DemoTag>
            <DemoTag tone="neutral">{{ selected.lane }}航线</DemoTag>
            <DemoTag tone="neutral">{{ selected.voyage }}</DemoTag>
          </template>
        </div>
        <div class="tower__bar-right">
          <DemoButton v-if="selected" size="small" @click="openDetail">完整详情 →</DemoButton>
          <DemoButton v-if="selected" type="primary" size="small" @click="clearSelection">
            ← 全部货轮
          </DemoButton>
        </div>
      </div>

      <div class="tower__canvas">
        <ShipGlobe :ships="SHIPS" :selected="selected" :height="'560px'" @select="select" />
        <div v-if="selected" class="tower__route-meta">
            <span>航线里程 <b>{{ routeDistanceNm(selected).toLocaleString('zh-CN') }} nm</b></span>
            <span>挂靠点 <b>{{ selected.route.length }}</b></span>
            <span
              v-for="t in ROUTE_POINT_ORDER"
              :key="t"
              class="tower__route-pill"
              :style="{ color: ROUTE_POINT_META[t].color, borderColor: ROUTE_POINT_META[t].color }"
            >
              {{ ROUTE_POINT_META[t].label }} {{ typeCount?.[t] ?? 0 }}
            </span>
          </div>
      </div>
    </section>

    <!-- 右侧可折叠货轮切换边栏 -->
    <ShipSidebar
      :ships="SHIPS"
      :active-id="selectedId"
      :open="sidebarOpen"
      @select="select"
      @toggle="sidebarOpen = !sidebarOpen"
    />
  </div>
</template>

<style scoped>
.tower {
  display: flex;
  gap: 16px;
  align-items: stretch;
}
.tower__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tower__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tower__bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tower__title {
  font-size: 16px;
  font-weight: 700;
}
.tower__bar-right {
  display: flex;
  gap: 8px;
}
.tower__canvas {
  border: 1px solid var(--demo-border, #e6ebef);
  border-radius: 12px;
  background: #fff;
  padding: 8px;
}
.tower__route-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 6px 10px 2px;
  font-size: 12px;
  color: var(--demo-text-muted);
}
.tower__route-meta b {
  color: var(--demo-text);
  font-weight: 700;
}
.tower__route-pill {
  padding: 2px 9px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
</style>
