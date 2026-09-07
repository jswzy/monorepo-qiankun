/**
 * 航线轨迹图的 ECharts option 构建（纯函数，无 DOM 依赖 → 可在 Node 里做 SSR 渲染验证）
 *
 * 结构：
 *  - geo：世界地图（world 需先 registerMap），boundingCoords 把视野聚焦到该船航区
 *  - series.lines（polyline）：折线航线，跨 ±180° 的航段已拆成两段
 *  - 6 个 scatter series：六类挂靠点，各用一种颜色 + 形状，图例即航线推进顺序
 *  - effectScatter：当前船位涟漪标记
 */
import { buildSegments, routeBounding } from '../data/geo'
import {
  ROUTE_POINT_META,
  ROUTE_POINT_ORDER,
  routeCoords,
  type RoutePoint,
  type RoutePointType,
  type Ship
} from '../data/ships'

export interface RoutePointDatum {
  name: string
  value: [number, number]
  pointType: RoutePointType
  eta: string
  etd: string
  stayH: number
  volume: number
  note: string
}

function pointData(ship: Ship, type: RoutePointType): RoutePointDatum[] {
  return ship.route
    .filter((p) => p.type === type)
    .map((p: RoutePoint) => ({
      name: p.name,
      value: [p.lng, p.lat],
      pointType: type,
      eta: p.eta,
      etd: p.etd,
      stayH: p.stayH,
      volume: p.volume ?? 0,
      note: p.note ?? ''
    }))
}

export function buildRouteOption(ship: Ship): Record<string, unknown> {
  const coords = routeCoords(ship)
  const segments = buildSegments(coords)

  const pointSeries = ROUTE_POINT_ORDER.map((type) => {
    const meta = ROUTE_POINT_META[type]
    return {
      name: meta.label,
      type: 'scatter',
      coordinateSystem: 'geo',
      symbol: meta.symbol,
      symbolSize: 13,
      zlevel: 3,
      itemStyle: { color: meta.color, borderColor: '#fff', borderWidth: 1.5 },
      label: {
        show: true,
        formatter: '{b}',
        position: 'right',
        fontSize: 10,
        color: '#2b3d4a',
        textBorderColor: '#fff',
        textBorderWidth: 2
      },
      data: pointData(ship, type)
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
        const p = params as {
          seriesName?: string
          name?: string
          data?: RoutePointDatum
        }
        const d = p.data
        if (d?.pointType) {
          const meta = ROUTE_POINT_META[d.pointType]
          return [
            `<div style="font-weight:700;margin-bottom:4px">${d.name ?? ''}</div>`,
            `<div><span style="color:${meta.color}">●</span> ${meta.label} · ${meta.desc}</div>`,
            `<div>到港：${d.eta ?? '-'}&nbsp;&nbsp;离港：${d.etd ?? '-'}</div>`,
            `<div>停留：${d.stayH ?? 0} h${d.volume ? `&nbsp;&nbsp;作业量：${d.volume.toLocaleString('zh-CN')} m³` : ''}</div>`,
            d.note ? `<div style="opacity:.8">${d.note}</div>` : ''
          ].join('')
        }
        if (p.seriesName === '当前船位') {
          return `<div style="font-weight:700">${p.name ?? ''}</div><div>实时船位 · 航速 ${ship.speed} kn</div>`
        }
        if (p.seriesName === '航线') {
          return `<div style="font-weight:700">${ship.voyage} 计划航线</div><div>折线依次串联 ${ship.route.length} 个挂靠点</div>`
        }
        return ''
      }
    },
    legend: {
      data: [...ROUTE_POINT_ORDER.map((t) => ROUTE_POINT_META[t].label), '当前船位'],
      bottom: 4,
      itemGap: 12,
      textStyle: { fontSize: 11, color: '#4a5b68' }
    },
    geo: {
      map: 'world',
      roam: true,
      boundingCoords: routeBounding(coords),
      itemStyle: { areaColor: '#e9f1f5', borderColor: '#c3d3dd', borderWidth: 0.6 },
      emphasis: { itemStyle: { areaColor: '#d7e7ef' }, label: { show: false } },
      select: { itemStyle: { areaColor: '#d7e7ef' }, label: { show: false } },
      silent: true
    },
    series: [
      {
        name: '航线',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        zlevel: 2,
        lineStyle: { color: '#0b6ea8', width: 2.4, opacity: 0.9, curveness: 0 },
        // 沿航线流动的光点，直观表达航行方向
        effect: {
          show: true,
          period: 7,
          trailLength: 0.35,
          symbol: 'circle',
          symbolSize: 3.5,
          color: '#ffd166'
        },
        data: segments.map((seg) => ({ coords: seg }))
      },
      ...pointSeries,
      {
        name: '当前船位',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 4,
        symbol: 'circle',
        symbolSize: 12,
        rippleEffect: { brushType: 'stroke', scale: 3 },
        itemStyle: { color: '#e8663d', borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          formatter: '当前船位',
          position: 'top',
          fontSize: 10,
          color: '#c1401d',
          textBorderColor: '#fff',
          textBorderWidth: 2
        },
        data: [{ name: `${ship.name}（${ship.status}）`, value: [ship.lng, ship.lat] }]
      }
    ]
  }
}
