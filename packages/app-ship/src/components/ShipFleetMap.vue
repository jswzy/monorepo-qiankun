<script setup lang="ts">
/**
 * 全船实时位置地图（控制塔初始视图）
 *
 * 在 ECharts geo 世界地图上用 effectScatter 标出每艘货轮的「当前船位」（按船体色相着色），
 * 点击任意船位标记 → emit('select', ship)，由上层控制塔切换到该船的航线轨迹图。
 * 只展示位置、不展示完整航线，保持初始视图清爽；航线在选中后再单独绘制。
 */
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { getPublicPath } from '@demo/shared-utils/qiankun'
import { shipColor, type Ship } from '../data/ships'

const props = defineProps<{ ships: Ship[]; activeId?: string }>()
const emit = defineEmits<{ (e: 'select', ship: Ship): void }>()

const el = ref<HTMLDivElement>()
const chart = shallowRef<echarts.ECharts | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMsg = ref('')
let observer: ResizeObserver | null = null

async function ensureWorldMap(): Promise<void> {
  if (echarts.getMap('world')) return
  const base = getPublicPath() || '/'
  const url = base.endsWith('/') ? `${base}world.json` : `${base}/world.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载世界地图失败（${res.status} ${url}）`)
  echarts.registerMap('world', await res.json())
}

function buildOption(): echarts.EChartsCoreOption {
  const data = props.ships.map((s) => {
    const active = s.id === props.activeId
    return {
      id: s.id,
      name: s.name,
      value: [s.lng, s.lat],
      status: s.status,
      lane: s.lane,
      cargo: s.cargo,
      voyage: s.voyage,
      itemStyle: { color: shipColor(s.hue) },
      symbolSize: active ? 20 : 13,
      label: {
        show: true,
        formatter: (p: unknown) => (p as { name: string }).name,
        position: 'right',
        fontSize: 11,
        color: '#2b3d4a',
        textBorderColor: '#fff',
        textBorderWidth: 2
      }
    }
  })

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 32, 54, 0.92)',
      borderColor: 'rgba(64, 158, 255, 0.35)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#eaf4fb', fontSize: 12 },
      formatter: (params: unknown): string => {
        const p = params as { data?: Record<string, unknown>; name?: string }
        const d = p.data
        if (!d) return ''
        const value = d.value as [number, number] | undefined
        const pos = value
          ? `${value[1].toFixed(1)}, ${value[0].toFixed(1)}`
          : '-'
        return [
          `<div style="font-weight:700;margin-bottom:4px">${d.name}</div>`,
          `<div>状态：<b>${d.status}</b> · 航次 ${d.voyage}</div>`,
          `<div>航线：${d.lane} · 货量 ${d.cargo}</div>`,
          `<div class="demo-mono">船位：${pos}</div>`,
          `<div style="opacity:.7;margin-top:4px">点击查看航线轨迹 →</div>`
        ].join('')
      }
    },
    geo: {
      map: 'world',
      roam: true,
      // 初始展示全球视野
      boundingCoords: [
        [-180, 80],
        [180, -58]
      ],
      itemStyle: { areaColor: '#e9f1f5', borderColor: '#c3d3dd', borderWidth: 0.6 },
      emphasis: { itemStyle: { areaColor: '#d7e7ef' }, label: { show: false } },
      select: { itemStyle: { areaColor: '#d7e7ef' }, label: { show: false } },
      silent: true
    },
    series: [
      {
        name: '船位',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 4,
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 3 },
        symbol: 'circle',
        data
      }
    ]
  }
}

async function render(): Promise<void> {
  if (!el.value) return
  try {
    status.value = 'loading'
    await ensureWorldMap()
    if (!chart.value) {
      chart.value = echarts.init(el.value, undefined, { renderer: 'canvas' })
      chart.value.on('click', (params: unknown) => {
        const id = (params as { data?: { id?: string } }).data?.id
        if (!id) return
        const ship = props.ships.find((s) => s.id === id)
        if (ship) emit('select', ship)
      })
    }
    chart.value.setOption(buildOption(), true)
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

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div class="fleet-map">
    <div ref="el" class="fleet-map__canvas" />
    <div v-if="status === 'loading'" class="fleet-map__mask">全船位置加载中…</div>
    <div v-else-if="status === 'error'" class="fleet-map__mask fleet-map__mask--error">
      地图加载失败：{{ errorMsg }}
    </div>
    <div class="fleet-map__hint">点击任意船位标记查看该货轮航线轨迹 · 滚轮缩放 / 拖拽平移</div>
  </div>
</template>

<style scoped>
.fleet-map {
  position: relative;
  width: 100%;
}
.fleet-map__canvas {
  width: 100%;
  height: 540px;
}
.fleet-map__mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--demo-text-muted);
  background: rgba(255, 255, 255, 0.7);
}
.fleet-map__mask--error {
  color: #c0392b;
}
.fleet-map__hint {
  position: absolute;
  left: 12px;
  bottom: 10px;
  font-size: 11.5px;
  color: var(--demo-text-muted);
  background: rgba(255, 255, 255, 0.78);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--demo-border, #e6ebef);
}
</style>
