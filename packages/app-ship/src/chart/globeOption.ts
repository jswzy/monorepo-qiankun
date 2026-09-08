/**
 * 地球仪（echarts-gl globe）航线图的 option 构建（纯函数，无 DOM 依赖）
 *
 * 主题与要点：
 *  - globe.viewControl.autoRotate：地球连续自转，停手 3s 后恢复旋转
 *  - 居中（暮蓝）主题：environment 中蓝(#173a5e) + 海洋中蓝(#1f4e79) + 国色降饱和(55%/52%) + 白字国名 + 居中光照
 *  - 大气辉光(atmosphere)与泛光(bloom)均已关闭：避免亮色贴图被晕成“白雾”
 *  - globe.shading='lambert' 让陆面有明暗体积感；SSAO 关闭，保证贴图清晰不发灰
 *  - 船位 / 挂靠点用 scatter3D（辉光 + bloom，3D 下无 effectScatter3D 涟漪），航线用 lines3D 大圆弧（非 polyline，
 *    自动沿地球曲面绘制，带流动箭头表达航向）
 *
 * 注意：globe / 3D 系列需要 WebGL，无法在 Node 里 SSR 验证，本模块仅做类型与数据结构保障。
 */
import { shipColor, ROUTE_POINT_META, ROUTE_POINT_ORDER, routeCoords } from '../data/ships'
import type { RoutePoint, RoutePointType, Ship } from '../data/ships'

/** 居中（暮蓝）主题：中等深度蓝底 + 中蓝海洋，介于黑夜与白天之间 */
const MID_SKY = '#173a5e'
const MID_OCEAN = '#1f4e79'

/**
 * 货轮图标（SVG 汽车船侧视），按船体色相着色，返回 echarts 图片符号 dataURL。
 * scatter3D 支持 `symbol:'image://...'`，用图标取代 3D 圆点，辨识度更高。
 */
export function shipIconDataURL(color: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>` +
    `<g stroke='#ffffff' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'>` +
    `<path d='M10 40 L44 40 L60 48 L50 53 L14 53 Z' fill='${color}'/>` +
    `<rect x='12' y='24' width='8' height='16' rx='1' fill='${color}'/>` +
    `<rect x='14' y='30' width='6' height='8' fill='#ffffff'/>` +
    `<rect x='22' y='30' width='6' height='8' fill='#ffffff'/>` +
    `<rect x='30' y='30' width='6' height='8' fill='#ffffff'/>` +
    `<rect x='38' y='30' width='5' height='8' fill='#ffffff'/>` +
    `</g></svg>`
  return `image://data:image/svg+xml,${encodeURIComponent(svg)}`
}

export interface GlobeFleetDatum {
  id: string
  name: string
  value: [number, number]
  hue: number
  status: string
  voyage: string
  lane: string
  cargo: string
}

export interface GlobeWaypointDatum {
  name: string
  value: [number, number]
  pointType: RoutePointType
  eta: string
  etd: string
  stayH: number
  volume: number
  note: string
}

/** 地球仪基础配置（自转 + 辉光 + 泛光）
 * @param focus 选中某船时传入其经纬度，地球会停转并把该船居中显示；不传则全球自转 */
export function buildGlobeBase(focus?: { lng: number; lat: number } | null): Record<string, unknown> {
  const viewControl: Record<string, unknown> = {
    autoRotate: !focus,
    autoRotateSpeed: 6,
    autoRotateAfterStill: 3,
    autoRotateDirection: 'cw',
    distance: focus ? 150 : 185,
    minDistance: 95,
    maxDistance: 320,
    alpha: 18,
    beta: 0,
    damping: 0.9,
    rotateSensitivity: 1,
    zoomSensitivity: 1
  }
  if (focus) {
    // 选中货轮：相机聚焦到该船经纬度（居中），不再自转
    viewControl.targetCoord = [focus.lng, focus.lat]
  }
  return {
    globe: {
      map: 'world',
      shading: 'lambert',
      environment: MID_SKY,
      baseColor: MID_OCEAN,
      // 陆面：深蓝科技色 + 高亮海岸线
      itemStyle: {
        color: '#0f2f4d',
        borderColor: '#2f7bd6',
        borderWidth: 0.7,
        opacity: 1
      },
      // 关掉大气辉光：之前的蓝色边缘 halo 在亮贴图上被看成“白雾”
      atmosphere: { show: false },
      light: {
        // 居中光照：介于夜(弱)与昼(强)之间
        main: { intensity: 1.1, shadow: false, alpha: 38, beta: 28 },
        ambient: { intensity: 0.55 }
      },
      postEffect: {
        enable: true,
        // 彻底关闭 bloom，避免亮色贴图被泛白晕开
        bloom: { enable: false },
        // 关闭 SSAO，消除暗部蒙灰
        SSAO: { enable: false },
        FXAA: { enable: true }
      },
      viewControl,
      silent: false
    }
  }
}

/** 全船当前船位（可点击选中） */
export function buildFleetSeries(ships: Ship[]): Record<string, unknown> {
  const data: GlobeFleetDatum[] = ships.map((s) => ({
    id: s.id,
    name: s.name,
    value: [s.lng, s.lat],
    hue: s.hue,
    status: s.status,
    voyage: s.voyage,
    lane: s.lane,
    cargo: s.cargo
  }))
  return {
    name: 'fleet',
    type: 'scatter3D',
    coordinateSystem: 'globe',
    blendMode: 'lighter',
    symbolSize: 26,
    itemStyle: { opacity: 1 },
    label: {
      show: true,
      formatter: '{b}',
      position: 'right',
      fontSize: 11,
      color: '#cfe8ff',
      textBorderColor: '#04101e',
      textBorderWidth: 3
    },
    emphasis: { label: { show: true } },
    // 用货轮图标（按船体色相着色）代替 3D 圆点，辨识度更高
    data: data.map((d) => ({
      ...d,
      symbol: shipIconDataURL(shipColor(d.hue))
    }))
  }
}

/** 单船航线：大圆弧 lines3D + 六类挂靠点 scatter3D（辉光）+ 当前船位 */
export function buildRouteSeries(ship: Ship): Record<string, unknown>[] {
  const coords = routeCoords(ship)
  // 逐段大圆弧（非 polyline），echarts 自动沿地球曲面绘制，比直线段更像真实航线
  const segData = coords.slice(1).map((c, i) => ({ coords: [coords[i], c] }))

  const lineSeries: Record<string, unknown> = {
    name: '航线',
    type: 'lines3D',
    coordinateSystem: 'globe',
    blendMode: 'lighter',
    effect: {
      show: true,
      period: 4,
      trailLength: 0.28,
      color: '#ffd166',
      symbol: 'arrow',
      symbolSize: 5
    },
    lineStyle: { color: '#36c5ff', width: 2.4, opacity: 0.92 },
    data: segData
  }

  const pointSeries: Record<string, unknown>[] = ROUTE_POINT_ORDER.map((type) => {
    const meta = ROUTE_POINT_META[type]
    const data: GlobeWaypointDatum[] = ship.route
      .filter((p: RoutePoint) => p.type === type)
      .map((p) => ({
        name: p.name,
        value: [p.lng, p.lat],
        pointType: type,
        eta: p.eta,
        etd: p.etd,
        stayH: p.stayH,
        volume: p.volume ?? 0,
        note: p.note ?? ''
      }))
    return {
      name: meta.label,
      type: 'scatter3D',
      coordinateSystem: 'globe',
      blendMode: 'lighter',
      symbolSize: 12,
      itemStyle: {
        color: meta.color,
        borderColor: '#ffffff',
        borderWidth: 1,
        shadowBlur: 10,
        shadowColor: meta.color,
        opacity: 0.95
      },
      label: {
        show: true,
        formatter: '{b}',
        position: 'right',
        fontSize: 10,
        color: '#eaf4fb',
        textBorderColor: '#04101e',
        textBorderWidth: 3
      },
      data
    }
  })

  const current: Record<string, unknown> = {
    name: '当前船位',
    type: 'scatter3D',
    coordinateSystem: 'globe',
    symbolSize: 30,
    itemStyle: { opacity: 1 },
    label: {
      show: true,
      formatter: '当前船位',
      position: 'top',
      fontSize: 10,
      color: '#ffb199',
      textBorderColor: '#04101e',
      textBorderWidth: 3
    },
    // 当前船位也用货轮图标（船体色相），放大以示强调
    data: [
      {
        name: `${ship.name}（${ship.status}）`,
        value: [ship.lng, ship.lat],
        symbol: shipIconDataURL(shipColor(ship.hue))
      }
    ]
  }

  return [lineSeries, ...pointSeries, current]
}
