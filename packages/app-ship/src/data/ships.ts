/**
 * 航运航线数据模型
 *
 * 数据以《航运物流控制塔_Demo/js/data.js》为蓝本（船名 / 航次 / 状态 / 航线 / 货量 / 当前船位），
 * 并补齐了「航线挂靠点序列」—— 每艘船的航次被拆成 6 类节点，用折线依次串起来：
 *   起始装货点 → 二次装货点 → 临时停靠点 → 补给港口 → 卸货点 → 终点港口
 *
 * ⚠️ 边界约束：这是本业务域（航运）的演示数据。若其它业务域要复用，必须走 changeset 发布 npm 包，
 * 禁止跨仓库直接引用源码。
 */

/** 航线上 6 类挂靠点 */
export type RoutePointType =
  | 'load-start' // 起始装货点
  | 'load-second' // 二次装货点
  | 'temp-stop' // 临时停靠点
  | 'bunker' // 补给港口
  | 'discharge' // 卸货点
  | 'final' // 终点港口

export interface RoutePointTypeMeta {
  label: string
  color: string
  /** ECharts symbol 名称 */
  symbol: string
  desc: string
}

/** 6 类挂靠点的展示元数据（颜色 / 形状 / 说明），图表图例与列表共用同一份 */
export const ROUTE_POINT_META: Record<RoutePointType, RoutePointTypeMeta> = {
  'load-start': { label: '起始装货点', color: '#2f7d5f', symbol: 'circle', desc: '首装港，主要货源装船' },
  'load-second': { label: '二次装货点', color: '#6aa84f', symbol: 'circle', desc: '补装港，追加货源' },
  'temp-stop': { label: '临时停靠点', color: '#c98a2b', symbol: 'diamond', desc: '锚地待泊 / 运河待闸 / 临时避风' },
  bunker: { label: '补给港口', color: '#8a63d2', symbol: 'roundRect', desc: '燃油、淡水、物料补给' },
  discharge: { label: '卸货点', color: '#d1495b', symbol: 'triangle', desc: '中途卸货作业港' },
  final: { label: '终点港口', color: '#0b6ea8', symbol: 'pin', desc: '本航次终点港' }
}

/** 图例顺序（即航线推进顺序） */
export const ROUTE_POINT_ORDER: RoutePointType[] = [
  'load-start',
  'load-second',
  'temp-stop',
  'bunker',
  'discharge',
  'final'
]

export interface RoutePoint {
  /** 港口 / 地点名 */
  name: string
  /** 港口代码（可选） */
  code?: string
  type: RoutePointType
  /** 经度 */
  lng: number
  /** 纬度 */
  lat: number
  /** 预计到港 */
  eta: string
  /** 预计离港 */
  etd: string
  /** 在港停留（小时） */
  stayH: number
  /** 作业量（m³），装卸港才有 */
  volume?: number
  note?: string
}

export type ShipStatus = '航行中' | '靠泊中' | '锚泊中'

export interface Ship {
  id: string
  name: string
  imo: string
  shipType: string
  flag: string
  owner: string
  status: ShipStatus
  voyage: string
  /** 航线（贸易区） */
  lane: string
  cargo: string
  /** 当前船位 */
  lat: number
  lng: number
  speed: number
  from: string
  to: string
  eta: string
  etd: string
  /** 船体配色（船卡照片用），0-360 色相 */
  hue: number
  /** 本航次挂靠点序列（按时间先后） */
  route: RoutePoint[]
}

/** 由船体色相生成地图标记 / 侧栏高亮颜色 */
export function shipColor(hue: number): string {
  return `hsl(${hue}, 62%, 46%)`
}

/** 船队状态配色（侧栏 / 图例共用） */
export const SHIP_STATUS_COLOR: Record<ShipStatus, string> = {
  航行中: '#2f7d5f',
  靠泊中: '#2d6cb5',
  锚泊中: '#c98a2b'
}

/* ------------------------------ 船队数据 ------------------------------ */

export const SHIPS: Ship[] = [
  {
    id: 'anji-ansheng',
    name: 'ANJI ANSHENG',
    imo: 'IMO 9XXXXX',
    shipType: '汽车船',
    flag: '中国',
    owner: '自营',
    status: '航行中',
    voyage: 'ANS06',
    lane: '地中海',
    cargo: '48,230 m³',
    lat: 39.5,
    lng: 28.5,
    speed: 15.2,
    from: '苏伊士运河',
    to: 'Civitavecchia',
    eta: '2026-08-19',
    etd: '2026-08-20',
    hue: 205,
    route: [
      { name: '连云港 LYG', code: 'LYG', type: 'load-start', lng: 119.45, lat: 34.75, eta: '2026-06-01 14:00', etd: '2026-06-03 08:00', stayH: 42, volume: 36800, note: '上汽国际 / 安徽航瑞首装' },
      { name: '上海 Shanghai', code: 'SHA', type: 'load-second', lng: 121.8, lat: 31.15, eta: '2026-06-04 09:00', etd: '2026-06-05 20:00', stayH: 35, volume: 11200, note: '比亚迪 / 上汽大通补装' },
      { name: '香港锚地 Hong Kong', code: 'HKG', type: 'temp-stop', lng: 114.17, lat: 22.3, eta: '2026-06-08 06:00', etd: '2026-06-08 22:00', stayH: 16, note: '等泊位 / 补给船靠拢' },
      { name: '新加坡 Singapore', code: 'SIN', type: 'bunker', lng: 103.85, lat: 1.26, eta: '2026-06-10 20:00', etd: '2026-06-12 07:00', stayH: 35, note: 'HSFO 1200t + VLSFO 418t' },
      { name: '苏伊士运河 Suez', code: 'SUZ', type: 'temp-stop', lng: 32.35, lat: 30.42, eta: '2026-08-17 04:00', etd: '2026-08-17 23:00', stayH: 19, note: '运河待闸（预计过河费 $720k）' },
      { name: '奇维塔韦基亚 Civitavecchia', code: 'CIV', type: 'discharge', lng: 11.78, lat: 42.09, eta: '2026-08-19 08:00', etd: '2026-08-20 18:00', stayH: 34, volume: 28900, note: 'MG / CHERY 卸货' },
      { name: '瓦多利古雷 Vado Ligure', code: 'VAD', type: 'final', lng: 8.44, lat: 44.27, eta: '2026-08-22 07:00', etd: '-', stayH: 28, volume: 19100, note: '本航次终点 · 清关交车' }
    ]
  },
  {
    id: 'anji-virtue',
    name: 'ANJI VIRTUE',
    imo: 'IMO 9XXXXX',
    shipType: '汽车船',
    flag: '中国',
    owner: '自营',
    status: '航行中',
    voyage: 'AVT07',
    lane: '地中海',
    cargo: '41,500 m³',
    lat: 8,
    lng: 76,
    speed: 16.1,
    from: '印度洋',
    to: '苏伊士运河',
    eta: '2026-08-27',
    etd: '2026-08-28',
    hue: 172,
    route: [
      { name: '连云港 LYG', code: 'LYG', type: 'load-start', lng: 119.45, lat: 34.75, eta: '2026-07-11 10:00', etd: '2026-07-12 22:00', stayH: 36, volume: 38500, note: 'SMIL 主货源' },
      { name: '厦门 Xiamen', code: 'XMN', type: 'load-second', lng: 118.09, lat: 24.48, eta: '2026-07-14 08:00', etd: '2026-07-15 14:00', stayH: 30, volume: 3800, note: 'H&H 设备补装' },
      { name: '新加坡 Singapore', code: 'SIN', type: 'bunker', lng: 103.85, lat: 1.26, eta: '2026-07-21 05:00', etd: '2026-07-22 16:00', stayH: 35, note: 'VLSFO 450t' },
      { name: '科伦坡 Colombo', code: 'COL', type: 'temp-stop', lng: 79.85, lat: 6.93, eta: '2026-07-26 12:00', etd: '2026-07-27 04:00', stayH: 16, note: '避热带气旋 / 补给淡水' },
      { name: '苏伊士运河 Suez', code: 'SUZ', type: 'temp-stop', lng: 32.35, lat: 30.42, eta: '2026-08-27 09:00', etd: '2026-08-28 02:00', stayH: 17, note: '运河编队待闸' },
      { name: '奇维塔韦基亚 Civitavecchia', code: 'CIV', type: 'discharge', lng: 11.78, lat: 42.09, eta: '2026-08-31 06:00', etd: '2026-09-01 20:00', stayH: 38, volume: 24600, note: 'SMIL / 长城卸货' },
      { name: '瓦多利古雷 Vado Ligure', code: 'VAD', type: 'final', lng: 8.44, lat: 44.27, eta: '2026-09-03 08:00', etd: '-', stayH: 30, volume: 17700, note: '本航次终点' }
    ]
  },
  {
    id: 'anji-23',
    name: 'ANJI 23',
    imo: 'IMO 9XXXXX',
    shipType: '汽车船',
    flag: '中国',
    owner: '自营',
    status: '航行中',
    voyage: '23047',
    lane: '墨西哥',
    cargo: '38,100 m³',
    lat: 22,
    lng: -118,
    speed: 14.8,
    from: '太平洋',
    to: 'Lazaro Cardenas',
    eta: '2026-08-10',
    etd: '2026-08-11',
    hue: 18,
    route: [
      { name: '上海 Shanghai', code: 'SHA', type: 'load-start', lng: 121.8, lat: 31.15, eta: '2026-06-20 08:00', etd: '2026-06-21 19:00', stayH: 35, volume: 10800, note: '比亚迪首装' },
      { name: '宁波舟山 Ningbo', code: 'NGB', type: 'load-second', lng: 121.85, lat: 29.93, eta: '2026-06-22 06:00', etd: '2026-06-23 12:00', stayH: 30, volume: 7200, note: '奇瑞补装' },
      { name: '釜山 Busan', code: 'PUS', type: 'temp-stop', lng: 129.08, lat: 35.1, eta: '2026-06-26 14:00', etd: '2026-06-27 08:00', stayH: 18, note: '临时挂靠 · 船员换班' },
      { name: '洛杉矶 Los Angeles', code: 'LAX', type: 'bunker', lng: -118.26, lat: 33.74, eta: '2026-07-14 10:00', etd: '2026-07-15 06:00', stayH: 20, note: '跨太平洋补给 VLSFO 620t' },
      { name: '拉萨罗卡德纳斯 Lazaro Cardenas', code: 'LZC', type: 'discharge', lng: -102.19, lat: 17.96, eta: '2026-08-10 09:00', etd: '2026-08-11 21:00', stayH: 36, volume: 10800, note: 'ETA 偏离 +32h，关注靠泊窗口' },
      { name: '曼萨尼约 Manzanillo', code: 'ZLO', type: 'final', lng: -104.31, lat: 19.05, eta: '2026-08-13 08:00', etd: '-', stayH: 26, volume: 7200, note: '本航次终点' }
    ]
  },
  {
    id: 'anji-xx',
    name: 'ANJI XX',
    imo: 'IMO 9XXXXX',
    shipType: '汽车船',
    flag: '中国',
    owner: '租船',
    status: '靠泊中',
    voyage: 'XX01',
    lane: '东南亚',
    cargo: '22,800 m³',
    lat: 31.2,
    lng: 121.5,
    speed: 0,
    from: '上海',
    to: '新加坡',
    eta: '-',
    etd: '2026-07-15',
    hue: 264,
    route: [
      { name: '上海 Shanghai', code: 'SHA', type: 'load-start', lng: 121.8, lat: 31.15, eta: '2026-07-13 09:00', etd: '2026-07-14 21:00', stayH: 36, volume: 12500, note: 'SMIL 小车' },
      { name: '厦门 Xiamen', code: 'XMN', type: 'load-second', lng: 118.09, lat: 24.48, eta: '2026-07-16 07:00', etd: '2026-07-17 13:00', stayH: 30, volume: 2100, note: '吉利 H&H' },
      { name: '香港 Hong Kong', code: 'HKG', type: 'temp-stop', lng: 114.17, lat: 22.3, eta: '2026-07-18 16:00', etd: '2026-07-19 10:00', stayH: 18, note: '等潮水 / 单据交接' },
      { name: '新加坡 Singapore', code: 'SIN', type: 'bunker', lng: 103.85, lat: 1.26, eta: '2026-07-24 05:00', etd: '2026-07-25 12:00', stayH: 31, note: 'HSFO 480t' },
      { name: '巴生港 Port Klang', code: 'PKG', type: 'discharge', lng: 101.39, lat: 3.0, eta: '2026-07-26 18:00', etd: '2026-07-28 09:00', stayH: 39, volume: 9800, note: '东南亚中转卸货' },
      { name: '雅加达 Jakarta', code: 'JKT', type: 'final', lng: 106.85, lat: -6.21, eta: '2026-07-30 07:00', etd: '-', stayH: 32, volume: 4800, note: '本航次终点' }
    ]
  },
  {
    id: 'anji-yy',
    name: 'ANJI YY',
    imo: 'IMO 9XXXXX',
    shipType: '汽车船',
    flag: '中国',
    owner: '租船',
    status: '靠泊中',
    voyage: 'YY02',
    lane: '地中海',
    cargo: '15,600 m³',
    lat: 42.1,
    lng: 11.8,
    speed: 0,
    from: 'Civitavecchia',
    to: 'Vado Ligure',
    eta: '-',
    etd: '2026-07-14',
    hue: 340,
    route: [
      { name: '奇维塔韦基亚 Civitavecchia', code: 'CIV', type: 'load-start', lng: 11.78, lat: 42.09, eta: '2026-06-28 08:00', etd: '2026-06-29 22:00', stayH: 38, volume: 5600, note: '欧洲内部调运首装' },
      { name: '那不勒斯 Napoli', code: 'NAP', type: 'load-second', lng: 14.27, lat: 40.85, eta: '2026-06-30 20:00', etd: '2026-07-01 16:00', stayH: 20, volume: 2400, note: '补装 2400 m³' },
      { name: '丹吉尔地中海港 Tanger Med', code: 'TNG', type: 'bunker', lng: -5.5, lat: 35.88, eta: '2026-07-06 11:00', etd: '2026-07-07 09:00', stayH: 22, note: '西地中海主加油港' },
      { name: '巴塞罗那 Barcelona', code: 'BCN', type: 'discharge', lng: 2.17, lat: 41.39, eta: '2026-07-10 07:00', etd: '2026-07-11 15:00', stayH: 32, volume: 4200, note: '西班牙区卸货' },
      { name: '马耳他锚地 Malta', code: 'MLA', type: 'temp-stop', lng: 14.51, lat: 35.9, eta: '2026-07-14 05:00', etd: '2026-07-14 23:00', stayH: 18, note: '等 VAD 泊位指令' },
      { name: '瓦多利古雷 Vado Ligure', code: 'VAD', type: 'final', lng: 8.44, lat: 44.27, eta: '2026-07-17 06:00', etd: '-', stayH: 27, volume: 3800, note: '本航次终点' }
    ]
  },
  {
    id: 'anji-zz',
    name: 'ANJI ZZ',
    imo: 'IMO 9XXXXX',
    shipType: '汽车船',
    flag: '中国',
    owner: '自营',
    status: '锚泊中',
    voyage: 'ZZ01',
    lane: '红海',
    cargo: '29,200 m³',
    lat: 31.3,
    lng: 30.1,
    speed: 0,
    from: 'Abu Qir',
    to: '吉达',
    eta: '-',
    etd: '2026-07-16',
    hue: 42,
    route: [
      { name: '连云港 LYG', code: 'LYG', type: 'load-start', lng: 119.45, lat: 34.75, eta: '2026-06-25 09:00', etd: '2026-06-26 23:00', stayH: 38, volume: 22000, note: '上汽国际首装' },
      { name: '上海 Shanghai', code: 'SHA', type: 'load-second', lng: 121.8, lat: 31.15, eta: '2026-06-28 07:00', etd: '2026-06-29 13:00', stayH: 30, volume: 5800, note: '奇瑞 + 吉利补装' },
      { name: '新加坡 Singapore', code: 'SIN', type: 'bunker', lng: 103.85, lat: 1.26, eta: '2026-07-06 15:00', etd: '2026-07-07 20:00', stayH: 29, note: 'HSFO 1250t' },
      { name: '吉布提 Djibouti', code: 'JIB', type: 'temp-stop', lng: 43.14, lat: 11.59, eta: '2026-07-15 10:00', etd: '2026-07-16 04:00', stayH: 18, note: '亚丁湾护航集结' },
      { name: '苏伊士运河 Suez', code: 'SUZ', type: 'temp-stop', lng: 32.35, lat: 30.42, eta: '2026-07-20 06:00', etd: '2026-07-21 02:00', stayH: 20, note: '过河编队' },
      { name: '阿布基尔 Abu Qir', code: 'ABU', type: 'discharge', lng: 30.06, lat: 31.31, eta: '2026-07-22 09:00', etd: '2026-07-25 18:00', stayH: 81, volume: 22000, note: '锚泊已超时 52h，泊位饱和' },
      { name: '吉达 Jeddah', code: 'JED', type: 'final', lng: 39.19, lat: 21.49, eta: '2026-07-28 08:00', etd: '-', stayH: 34, volume: 5800, note: '本航次终点 · 地缘风险提示' }
    ]
  }
]

/* ------------------------------ 工具函数 ------------------------------ */

export function getShip(id: string): Ship | undefined {
  return SHIPS.find((s) => s.id === id)
}

/** 航线折线坐标序列（ECharts 用 [lng, lat]） */
export function routeCoords(ship: Ship): [number, number][] {
  return ship.route.map((p) => [p.lng, p.lat])
}

/** 航线总里程估算（海里，按大圆距离累加） */
export function routeDistanceNm(ship: Ship): number {
  let total = 0
  for (let i = 1; i < ship.route.length; i++) {
    total += greatCircleNm(ship.route[i - 1], ship.route[i])
  }
  return Math.round(total)
}

function greatCircleNm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3440.065 // 地球半径（海里）
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** 航线上各类挂靠点的数量统计（用于总览页概览条） */
export function countByPointType(ship: Ship): Record<RoutePointType, number> {
  const acc = {} as Record<RoutePointType, number>
  for (const t of ROUTE_POINT_ORDER) acc[t] = 0
  for (const p of ship.route) acc[p.type] += 1
  return acc
}
