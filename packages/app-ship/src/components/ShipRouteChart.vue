<script setup lang="ts">
/**
 * 单船航线轨迹图（ECharts）
 *
 * 渲染要点：
 * 1. geo 世界地图：ECharts 5 不再内置地图，先 registerMap('world') 注册本地 public/world.json
 *    （离线可用），路径用 getPublicPath() 拼接，保证被 qiankun 基座挂载时也能取到子应用自己的资源。
 * 2. 折线航线：series.lines（polyline: true）+ 逐段 coords。跨 180° 经线的航段会被拆成两段，
 *    避免等距圆柱投影下出现「横穿欧亚」的错误连线（太平洋航线的常见坑）。
 * 3. 六类挂靠点：每类一个 scatter series（不同颜色 / 形状），图例即航线推进顺序。
 * 4. 当前船位：effectScatter 涟漪标记。
 */
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import { getPublicPath } from '@demo/shared-utils/qiankun'
import { buildRouteOption } from '../chart/routeOption'
import type { Ship } from '../data/ships'

const props = defineProps<{ ship: Ship }>()

const el = ref<HTMLDivElement>()
const chart = shallowRef<echarts.ECharts | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMsg = ref('')
let observer: ResizeObserver | null = null

/** 世界地图只注册一次（HMR / 重复挂载时跳过） */
async function ensureWorldMap(): Promise<void> {
  if (echarts.getMap('world')) return
  const base = getPublicPath() || '/'
  const url = base.endsWith('/') ? `${base}world.json` : `${base}/world.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载世界地图失败（${res.status} ${url}）`)
  echarts.registerMap('world', await res.json())
}

async function render(): Promise<void> {
  if (!el.value) return
  try {
    status.value = 'loading'
    await ensureWorldMap()
    if (!chart.value) {
      chart.value = echarts.init(el.value, undefined, { renderer: 'canvas' })
    }
    chart.value.setOption(buildRouteOption(props.ship), true)
    status.value = 'ready'
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err)
    status.value = 'error'
  }
}

onMounted(async () => {
  await render()
  if (el.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => chart.value?.resize())
    observer.observe(el.value)
  }
})

// 切换船舶时重绘（复用同一个地图注册）
watch(
  () => props.ship.id,
  () => render()
)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div class="route-chart">
    <div ref="el" class="route-chart__canvas" />
    <div v-if="status === 'loading'" class="route-chart__mask">航线图加载中…</div>
    <div v-else-if="status === 'error'" class="route-chart__mask route-chart__mask--error">
      航线图加载失败：{{ errorMsg }}
    </div>
  </div>
</template>

<style scoped>
.route-chart {
  position: relative;
  width: 100%;
}
.route-chart__canvas {
  width: 100%;
  height: 460px;
}
.route-chart__mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--demo-text-muted);
  background: rgba(255, 255, 255, 0.7);
}
.route-chart__mask--error {
  color: #c0392b;
}
</style>
