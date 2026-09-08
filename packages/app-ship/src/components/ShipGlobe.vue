<script setup lang="ts">
/**
 * 地球仪航线图（echarts-gl globe）
 *
 *  - 初始：全球自转，scatter3D（辉光）标出全部货轮「当前船位」。
 *  - 点击任意船位（地图 / 边栏） → 叠加该船的 lines3D 大圆弧航线 + 六类挂靠点 + 当前船位。
 *  - 地球连续旋转（viewControl.autoRotate），停手 3s 后自动恢复；大气辉光 + 泛光营造科技感。
 *  - world 地图走本地 public/world.json（离线），路径用 getPublicPath() 适配 qiankun 挂载。
 */
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import { getPublicPath } from '@demo/shared-utils/qiankun'
import { buildGlobeBase, buildFleetSeries, buildRouteSeries } from '../chart/globeOption'
import { ROUTE_POINT_META } from '../data/ships'
import type { Ship } from '../data/ships'

const props = defineProps<{ ships: Ship[]; selected: Ship | null; height?: string }>()
const emit = defineEmits<{ (e: 'select', ship: Ship): void }>()

const el = ref<HTMLDivElement>()
const root = ref<HTMLDivElement>()
const chart = shallowRef<echarts.ECharts | null>(null)
const isFullscreen = ref(false)

/** 全屏切换：点击进入/退出全屏，画布自动撑满并 resize */
function toggleFullscreen(): void {
  const node = root.value
  if (!node) return
  if (!document.fullscreenElement) {
    node.requestFullscreen?.().catch(() => {})
  } else {
    document.exitFullscreen?.().catch(() => {})
  }
}
function onFullscreenChange(): void {
  isFullscreen.value = !!document.fullscreenElement
  // 全屏过渡后重绘，使画布尺寸自适应新视口
  window.setTimeout(() => chart.value?.resize(), 280)
}
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMsg = ref('')
let observer: ResizeObserver | null = null
let mapReady = false
/** 世界地图贴图（2D 地图渲染到 canvas，作为 globe baseTexture），保证大陆轮廓清晰可见 */
let worldTexture: echarts.ECharts | null = null

/** world 地图只注册一次（HMR / 重复挂载跳过） */
async function ensureWorldMap(): Promise<void> {
  if (mapReady && echarts.getMap('world')) return
  const base = getPublicPath() || '/'
  const url = base.endsWith('/') ? `${base}world.json` : `${base}/world.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载世界地图失败（${res.status} ${url}）`)
  const geo = await res.json()
  echarts.registerMap('world', geo)
  // 用 2D 世界地图渲染一张等距圆柱投影贴图，包到地球表面。
  // 比 globe.map 矢量描边更可控：大陆配色 / 海岸线清晰，且自动与 globe 经纬度对齐。
  // 给每个国家分配全色相鲜亮色相（高饱和、海洋压暗、白海岸线），国家轮廓与海陆对比一眼可辨。
  const names = (geo.features || [])
    .map((f: { properties?: { name?: string } }) => f?.properties?.name)
    .filter((n: string): n is string => !!n)
  // 重点标注的国家（国名常驻显示在地图上，不靠悬浮）
  const IMPORTANT = new Set<string>([
    'China', 'United States', 'Russia', 'Brazil', 'Australia', 'India', 'Canada', 'Germany',
    'France', 'United Kingdom', 'Japan', 'Korea', 'Italy', 'Spain', 'Mexico', 'Indonesia',
    'Argentina', 'South Africa', 'Egypt', 'Saudi Arabia', 'Turkey', 'Thailand', 'Vietnam',
    'New Zealand', 'Norway', 'Sweden', 'Poland', 'Ukraine', 'Nigeria', 'Kenya', 'Chile', 'Peru',
    'Colombia', 'Iran', 'Iraq', 'Kazakhstan', 'Pakistan', 'Bangladesh', 'Philippines'
  ])
  const countryData = names.map((name: string, i: number) => {
    // 全色相 + 137.5° 黄金角分布：每个国家都鲜亮且互不相同，一眼可辨
    const hue = (i * 137.508) % 360
    const important = IMPORTANT.has(name)
    return {
      name,
      // 居中主题：降饱和降亮（55%/52%），国色分明但不刺眼、不花哨
      itemStyle: { areaColor: `hsl(${hue.toFixed(1)}, 55%, 52%)` },
      // 重点国家直接把国名画在地图上（常驻显示，不需要悬浮）
      label: important ? { show: true } : { show: false }
    }
  })
  // 贴图分辨率翻倍（4096）：国名在球面上更锐利、不发虚；字号同步翻倍以保持原 1/4 视觉大小
  const canvas = document.createElement('canvas')
  const mapChart = echarts.init(canvas, null, { renderer: 'canvas', width: 4096, height: 2048 })
  mapChart.setOption({
    // 居中主题：海洋中蓝，介于夜深与昼浅之间
    backgroundColor: '#1f4e79',
    series: [
      {
        type: 'map',
        map: 'world',
        roam: false,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        boundingCoords: [
          [-180, 90],
          [180, -90]
        ],
        itemStyle: {
          areaColor: '#1b6fb0',
          borderColor: '#7fb4dd',
          borderWidth: 2.2
        },
        emphasis: {
          itemStyle: { areaColor: '#ffd166' },
          label: { show: false }
        },
        // 国名样式：居中主题用白字（中蓝底上清晰）+ 深色柔影，无硬描边，字号翻倍(16)配 4096 贴图保持原 1/4 视觉大小
        label: {
          show: false,
          formatter: '{b}',
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold' as const,
          textShadowColor: 'rgba(0,0,0,0.9)',
          textShadowBlur: 4
        },
        data: countryData
      }
    ]
  })
  worldTexture = mapChart
  mapReady = true
}

function buildOption(): Record<string, unknown> {
  // 选中某船 → 地球聚焦该船（居中、停转）；未选中 → 全球自转
  const focus = props.selected ? { lng: props.selected.lng, lat: props.selected.lat } : null
  const base = buildGlobeBase(focus) as Record<string, Record<string, unknown>>
  const globe = { ...(base.globe || {}) }
  if (worldTexture) {
    // 用贴图接管地球表面绘制；baseTexture 与 globe 经纬度自动对齐
    globe.baseTexture = worldTexture
    delete globe.map
  }
  const series: Record<string, unknown>[] = [buildFleetSeries(props.ships)]
  if (props.selected) series.push(...buildRouteSeries(props.selected))
  return {
    ...base,
    globe,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(6, 22, 40, 0.92)',
      borderColor: 'rgba(64, 158, 255, 0.35)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#eaf4fb', fontSize: 12 },
      formatter: (params: unknown): string => {
        const p = params as {
          seriesName?: string
          name?: string
          data?: Record<string, unknown>
        }
        const d = p.data
        if (!d) return ''
        if (p.seriesName === 'fleet') {
          return [
            `<div style="font-weight:700;margin-bottom:4px">${d.name}</div>`,
            `<div>状态：<b>${d.status}</b> · 航次 ${d.voyage}</div>`,
            `<div>航线：${d.lane} · 货量 ${d.cargo}</div>`,
            `<div class="demo-mono">船位：${Number((d.value as number[])?.[1]).toFixed(1)}, ${Number((d.value as number[])?.[0]).toFixed(1)}</div>`,
            `<div style="opacity:.7;margin-top:4px">点击查看航线轨迹 →</div>`
          ].join('')
        }
        const pointType = d.pointType as keyof typeof ROUTE_POINT_META | undefined
        if (pointType && ROUTE_POINT_META[pointType]) {
          const meta = ROUTE_POINT_META[pointType]
          return [
            `<div style="font-weight:700;margin-bottom:4px">${d.name ?? ''}</div>`,
            `<div><span style="color:${meta.color}">●</span> ${meta.label} · ${meta.desc}</div>`,
            `<div>到港：${String(d.eta ?? '-')}&nbsp;&nbsp;离港：${String(d.etd ?? '-')}</div>`,
            `<div>停留：${Number(d.stayH ?? 0)} h${Number(d.volume) ? `&nbsp;&nbsp;作业量：${Number(d.volume).toLocaleString('zh-CN')} m³` : ''}</div>`,
            d.note ? `<div style="opacity:.8">${String(d.note)}</div>` : ''
          ].join('')
        }
        if (p.seriesName === '当前船位') {
          return `<div style="font-weight:700">${d.name ?? ''}</div><div>实时船位 · 航速 ${props.selected?.speed ?? ''} kn</div>`
        }
        if (p.seriesName === '航线') {
          return `<div style="font-weight:700">${props.selected?.voyage ?? ''} 计划航线</div><div>大圆弧串联 ${props.selected?.route.length ?? 0} 个挂靠点</div>`
        }
        return ''
      }
    },
    series
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
        const p = params as { seriesName?: string; data?: { id?: string } }
        if (p.seriesName === 'fleet' && p.data?.id) {
          const ship = props.ships.find((s) => s.id === p.data?.id)
          if (ship) emit('select', ship)
        }
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
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

// 切换选中船 → 重绘（复用同一地图注册）
watch(
  () => props.selected?.id,
  () => render()
)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  worldTexture?.dispose()
  worldTexture = null
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div ref="root" class="globe">
    <div
      ref="el"
      class="globe__canvas"
      :style="{ height: height || '520px' }"
    />
    <button
      class="globe__fs"
      type="button"
      :title="isFullscreen ? '退出全屏' : '全屏'"
      aria-label="全屏切换"
      @click="toggleFullscreen"
    >
      <svg
        v-if="!isFullscreen"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      </svg>
    </button>
    <div v-if="status === 'loading'" class="globe__mask">地球仪加载中…</div>
    <div v-else-if="status === 'error'" class="globe__mask globe__mask--error">
      地球仪加载失败：{{ errorMsg }}
    </div>
    <div class="globe__hint">
      <template v-if="selected">📍 已聚焦「{{ selected.name }}」· 拖拽手动查看 · 滚轮缩放</template>
      <template v-else>🌍 地球自动旋转中 · 拖拽可手动查看 · 滚轮缩放</template>
    </div>
  </div>
</template>

<style scoped>
.globe {
  position: relative;
  width: 100%;
}
.globe:fullscreen {
  width: 100vw;
  height: 100vh;
  background: #02060d;
  display: flex;
}
.globe:fullscreen .globe__canvas {
  height: 100% !important;
  border-radius: 0;
}
.globe__canvas {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #0a2238 0%, #02060d 70%);
}
.globe__fs {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #cfe8ff;
  background: rgba(4, 16, 30, 0.6);
  border: 1px solid rgba(64, 158, 255, 0.35);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.globe__fs:hover {
  color: #ffffff;
  background: rgba(64, 158, 255, 0.18);
  border-color: rgba(64, 158, 255, 0.7);
}
.globe__fs:active {
  transform: scale(0.94);
}
.globe__mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: #9fc6e8;
  background: rgba(2, 6, 13, 0.7);
}
.globe__mask--error {
  color: #ff9b8a;
}
.globe__hint {
  position: absolute;
  left: 12px;
  bottom: 10px;
  font-size: 11px;
  color: #8fb8da;
  background: rgba(4, 16, 30, 0.55);
  padding: 3px 10px;
  border-radius: 999px;
  pointer-events: none;
}
</style>
