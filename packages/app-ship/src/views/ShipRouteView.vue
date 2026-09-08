<script setup lang="ts">
/**
 * 单船航线轨迹页（点击货轮照片后进入）
 *
 * 上：船舶档案 + 本航次指标；中：ECharts 航线轨迹图（折线 + 六类挂靠点）；
 * 下：挂靠点时间轴（与图上点位一一对应）。
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DemoCard, DemoTag, DemoButton } from '@demo/ui-package/vue3'
import ShipPhoto from '../components/ShipPhoto.vue'
import ShipGlobe from '../components/ShipGlobe.vue'
import {
  getShip,
  routeDistanceNm,
  countByPointType,
  ROUTE_POINT_META,
  ROUTE_POINT_ORDER,
  type ShipStatus
} from '../data/ships'

const props = defineProps<{ id: string }>()
const router = useRouter()

const ship = computed(() => getShip(props.id))

const STATUS_TONE: Record<ShipStatus, 'success' | 'primary' | 'warning'> = {
  航行中: 'success',
  靠泊中: 'primary',
  锚泊中: 'warning'
}

const typeCount = computed(() => (ship.value ? countByPointType(ship.value) : null))

function back(): void {
  router.push({ name: 'ship-tower' })
}
</script>

<template>
  <div class="route">
    <template v-if="ship">
      <div class="toolbar">
        <DemoButton size="small" @click="back">← 返回船队</DemoButton>
        <span class="toolbar__spacer" />
        <DemoTag :tone="STATUS_TONE[ship.status]" dot>{{ ship.status }}</DemoTag>
        <DemoTag tone="neutral">{{ ship.lane }}航线</DemoTag>
        <DemoTag tone="neutral">{{ ship.flag }} · {{ ship.owner }}</DemoTag>
      </div>

      <!-- 船舶档案 -->
      <DemoCard :title="ship.name" :subtitle="`${ship.imo} · ${ship.shipType}`" accent="#0b6ea8">
        <template #extra>
          <span class="demo-mono route__voyage">航次 {{ ship.voyage }}</span>
        </template>

        <div class="route__top">
          <div class="route__photo">
            <ShipPhoto :hue="ship.hue" :name="ship.name" :status="ship.status" />
          </div>

          <div class="route__facts">
            <div class="detail-grid">
              <div><span>货量</span><b>{{ ship.cargo }}</b></div>
              <div><span>航速</span><b>{{ ship.speed }} kn</b></div>
              <div><span>当前船位</span><b class="demo-mono">{{ ship.lat.toFixed(1) }}, {{ ship.lng.toFixed(1) }}</b></div>
              <div><span>起讫</span><b>{{ ship.from }} → {{ ship.to }}</b></div>
              <div><span>ETA</span><b class="demo-mono">{{ ship.eta }}</b></div>
              <div><span>ETD</span><b class="demo-mono">{{ ship.etd }}</b></div>
            </div>

            <div class="route__metrics">
              <div class="route__metric">
                <span>航线里程</span>
                <b>{{ routeDistanceNm(ship).toLocaleString('zh-CN') }} <em>nm</em></b>
              </div>
              <div class="route__metric">
                <span>挂靠点</span>
                <b>{{ ship.route.length }} <em>个</em></b>
              </div>
              <div
                v-for="t in ROUTE_POINT_ORDER"
                :key="t"
                class="route__metric"
                :style="{ borderColor: ROUTE_POINT_META[t].color }"
              >
                <span>{{ ROUTE_POINT_META[t].label }}</span>
                <b :style="{ color: ROUTE_POINT_META[t].color }">{{ typeCount?.[t] ?? 0 }} <em>个</em></b>
              </div>
            </div>
          </div>
        </div>
      </DemoCard>

      <!-- 航线轨迹图（地球仪） -->
      <DemoCard
        title="航线轨迹图"
        :subtitle="`大圆弧航线串联 ${ship.route.length} 个挂靠点 · 地球自动旋转 / 拖拽 / 滚轮缩放`"
        accent="#0b6ea8"
      >
        <ShipGlobe :ships="ship ? [ship] : []" :selected="ship" :height="'520px'" />
      </DemoCard>

      <!-- 挂靠点时间轴 -->
      <DemoCard title="挂靠点时间轴" subtitle="与图上点位一一对应" accent="#0b6ea8">
        <ol class="timeline">
          <li v-for="(p, i) in ship.route" :key="p.name" class="timeline__item">
            <span class="timeline__dot" :style="{ background: ROUTE_POINT_META[p.type].color }">
              {{ i + 1 }}
            </span>
            <div class="timeline__body">
              <div class="timeline__head">
                <b>{{ p.name }}</b>
                <span class="timeline__type" :style="{ color: ROUTE_POINT_META[p.type].color }">
                  {{ ROUTE_POINT_META[p.type].label }}
                </span>
                <span v-if="p.code" class="timeline__code">{{ p.code }}</span>
              </div>
              <div class="timeline__meta">
                <span>到港 <b class="demo-mono">{{ p.eta }}</b></span>
                <span>离港 <b class="demo-mono">{{ p.etd }}</b></span>
                <span>停留 <b>{{ p.stayH }} h</b></span>
                <span v-if="p.volume">
                  作业量 <b>{{ p.volume.toLocaleString('zh-CN') }} m³</b>
                </span>
              </div>
              <p v-if="p.note" class="timeline__note">{{ p.note }}</p>
            </div>
          </li>
        </ol>
      </DemoCard>
    </template>

    <DemoCard v-else title="未找到该货轮" :subtitle="`id: ${id}`" accent="#d1495b">
      <p class="demo-muted">该货轮不存在或已退出船队。</p>
      <DemoButton type="primary" size="small" @click="back">返回船队</DemoButton>
    </DemoCard>
  </div>
</template>

<style scoped>
.route {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.route__voyage {
  font-size: 12px;
  color: var(--demo-text-muted);
}

.route__top {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 18px;
}
@media (max-width: 860px) {
  .route__top {
    grid-template-columns: 1fr;
  }
}
.route__photo {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--demo-border, #e6ebef);
}
.route__facts {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.route__metrics {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.route__metric {
  min-width: 88px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--demo-border, #e6ebef);
  border-left-width: 3px;
  background: #fbfdfe;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.route__metric span {
  font-size: 11px;
  color: var(--demo-text-muted);
}
.route__metric b {
  font-size: 15px;
  font-weight: 700;
}
.route__metric em {
  font-style: normal;
  font-size: 11px;
  font-weight: 500;
  color: var(--demo-text-muted);
}

/* ---- 时间轴 ---- */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.timeline__item {
  display: flex;
  gap: 12px;
  padding: 0 0 16px 0;
  position: relative;
}
.timeline__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 22px;
  bottom: 0;
  width: 2px;
  background: repeating-linear-gradient(
    to bottom,
    #dbe4ea 0,
    #dbe4ea 4px,
    transparent 4px,
    transparent 8px
  );
}
.timeline__dot {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  z-index: 1;
}
.timeline__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 1px;
}
.timeline__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.timeline__head b {
  font-size: 13.5px;
}
.timeline__type {
  font-size: 11.5px;
  font-weight: 600;
}
.timeline__code {
  font-family: var(--demo-font-mono);
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f8;
  color: var(--demo-text-muted);
}
.timeline__meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: var(--demo-text-muted);
}
.timeline__meta b {
  font-weight: 600;
  color: var(--demo-text);
}
.timeline__note {
  margin: 0;
  font-size: 11.5px;
  color: var(--demo-text-muted);
}
</style>
