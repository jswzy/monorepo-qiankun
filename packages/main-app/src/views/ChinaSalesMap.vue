<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { formatMoney } from '@demo/shared-utils'

/**
 * 全国销量分布「数据大屏」组件。
 *
 * 注意：ECharts 5 起官方不再内置中国地图，必须先用 echarts.registerMap 注册一份
 * GeoJSON。这里用本地 public/china.json（来自阿里 DataV，省份名与 ECharts 匹配），
 * 不走运行时 CDN，离线也能渲染。所有省份销量均为 mock。
 */

// 省份销量 mock（key 必须与 china.json 里 feature.properties.name 完全一致）
type ProvinceSales = { sales: number; orders: number }
const SALES: Record<string, ProvinceSales> = {
  广东省: { sales: 12860000, orders: 84210 },
  江苏省: { sales: 10530000, orders: 70120 },
  浙江省: { sales: 9870000, orders: 66840 },
  山东省: { sales: 8120000, orders: 55330 },
  上海市: { sales: 7640000, orders: 41280 },
  北京市: { sales: 7210000, orders: 38950 },
  四川省: { sales: 5980000, orders: 44720 },
  河南省: { sales: 5430000, orders: 47160 },
  湖北省: { sales: 4760000, orders: 33210 },
  福建省: { sales: 4510000, orders: 30580 },
  湖南省: { sales: 4280000, orders: 31890 },
  河北省: { sales: 3960000, orders: 29540 },
  安徽省: { sales: 3740000, orders: 28120 },
  辽宁省: { sales: 3120000, orders: 22470 },
  陕西省: { sales: 2980000, orders: 21030 },
  重庆市: { sales: 2860000, orders: 19980 },
  江西省: { sales: 2640000, orders: 20110 },
  天津市: { sales: 2480000, orders: 15320 },
  广西壮族自治区: { sales: 2310000, orders: 18840 },
  云南省: { sales: 2170000, orders: 17650 },
  山西省: { sales: 1980000, orders: 15430 },
  黑龙江省: { sales: 1760000, orders: 14210 },
  吉林省: { sales: 1620000, orders: 12880 },
  贵州省: { sales: 1540000, orders: 13260 },
  内蒙古自治区: { sales: 1430000, orders: 11020 },
  新疆维吾尔自治区: { sales: 1210000, orders: 9430 },
  甘肃省: { sales: 1080000, orders: 8760 },
  海南省: { sales: 960000, orders: 7420 },
  宁夏回族自治区: { sales: 540000, orders: 4310 },
  青海省: { sales: 430000, orders: 3460 },
  西藏自治区: { sales: 320000, orders: 2510 },
  香港特别行政区: { sales: 890000, orders: 3120 },
  澳门特别行政区: { sales: 210000, orders: 980 },
  台湾省: { sales: 1560000, orders: 11240 }
}

const MAX_SALES = Math.max(...Object.values(SALES).map((v) => v.sales))

const el = ref<HTMLDivElement>()
const chart = shallowRef<echarts.ECharts | null>(null)

async function ensureMap(): Promise<void> {
  // 已经注册过就跳过（HMR / 重复挂载）
  if (echarts.getMap('china')) return
  const res = await fetch('/china.json')
  const geoJson = await res.json()
  echarts.registerMap('china', geoJson)
}

function render(): void {
  if (!el.value) return
  const instance = echarts.init(el.value, undefined, { renderer: 'canvas' })
  chart.value = instance

  const data = Object.entries(SALES).map(([name, v]) => ({ name, value: v.sales }))

  instance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 22, 42, 0.92)',
      borderColor: 'rgba(64, 158, 255, 0.4)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#dcebff', fontSize: 13 },
      formatter: (params: { name?: string }) => {
        const name: string = params.name ?? ''
        const item = SALES[name]
        if (!item) {
          return `<b style="color:#9fb6d6">${name}</b><br/><span style="color:#7d93b3">暂无销量数据</span>`
        }
        return [
          `<b style="color:#ffd166;font-size:14px">${name}</b>`,
          `<span style="color:#9fb6d6">销售额</span> <b style="color:#19d4ff">${formatMoney(item.sales)}</b>`,
          `<span style="color:#9fb6d6">订单数</span> <b style="color:#19d4ff">${item.orders.toLocaleString()} 单</b>`
        ].join('<br/>')
      }
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: MAX_SALES,
      left: 18,
      bottom: 18,
      itemWidth: 14,
      itemHeight: 120,
      text: ['高', '低'],
      calculable: true,
      textStyle: { color: '#9fb6d6' },
      inRange: {
        color: ['#0e2a47', '#15497e', '#1f7fd6', '#19d4ff', '#ffe27a', '#ff7a45']
      }
    },
    series: [
      {
        name: '省份销量',
        type: 'map',
        map: 'china',
        roam: true,
        scaleLimit: { min: 1, max: 6 },
        label: { show: false },
        itemStyle: {
          areaColor: '#0e2a47',
          borderColor: 'rgba(120, 170, 230, 0.35)',
          borderWidth: 0.6
        },
        emphasis: {
          label: { show: true, color: '#ffffff', fontSize: 12 },
          itemStyle: {
            areaColor: '#ffd166',
            borderColor: '#fff',
            borderWidth: 1,
            shadowColor: 'rgba(255, 209, 102, 0.6)',
            shadowBlur: 12
          }
        },
        data
      }
    ]
  })
}

function handleResize(): void {
  chart.value?.resize()
}

onMounted(async () => {
  try {
    await ensureMap()
    render()
    window.addEventListener('resize', handleResize)
  } catch (err) {
    console.error('[ChinaSalesMap] 加载中国地图 GeoJSON 失败：', err)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <section class="screen">
    <header class="screen__head">
      <div class="screen__title">
        <span class="screen__dot" />
        <h3>全国销量分布 · 数据大屏</h3>
      </div>
      <p class="screen__sub">实时销量总览 · 鼠标悬停查看省份明细</p>
    </header>
    <div ref="el" class="screen__map" />
  </section>
</template>

<style scoped>
.screen {
  border: 1px solid rgba(64, 158, 255, 0.22);
  border-radius: var(--demo-radius, 12px);
  background: radial-gradient(120% 140% at 50% 0%, #0a2540 0%, #06182e 60%, #04101f 100%);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.05), 0 18px 48px rgba(3, 16, 31, 0.55);
  overflow: hidden;
}
.screen__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.14);
  background: linear-gradient(180deg, rgba(31, 127, 214, 0.12), transparent);
}
.screen__title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.screen__title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #eaf3ff;
}
.screen__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #19d4ff;
  box-shadow: 0 0 10px 2px rgba(25, 212, 255, 0.7);
}
.screen__sub {
  margin: 0;
  font-size: 12px;
  color: #7d93b3;
}
.screen__map {
  width: 100%;
  height: 540px;
  padding: 6px;
  box-sizing: border-box;
}
</style>
