import type { OrderItem, ProductItem, ReportMetric, TrendPoint, CurrentUser } from './types'

/** 域内共用的 mock 数据源：三个子应用消费同一份数据，体现「公共包沉淀」的价值 */

export const CURRENT_USER: CurrentUser = {
  id: 'U-1024',
  name: '何文月',
  role: '管理员',
  dept: '数字化供应链中心'
}

export const ORDERS: OrderItem[] = [
  { id: 'SO20260801001', customer: '苏州振华精密', amount: 128600, status: 'paid', createdAt: '2026-08-01 09:12', channel: '直营' },
  { id: 'SO20260801002', customer: '宁波海天机械', amount: 45280.5, status: 'shipped', createdAt: '2026-08-01 11:40', channel: '经销' },
  { id: 'SO20260802003', customer: '深圳比亚迪配套', amount: 936400, status: 'pending', createdAt: '2026-08-02 14:05', channel: '直营' },
  { id: 'SO20260803004', customer: '常州光洋轴承', amount: 20880, status: 'done', createdAt: '2026-08-03 08:31', channel: '电商' },
  { id: 'SO20260804005', customer: '青岛海尔智家', amount: 315200, status: 'paid', createdAt: '2026-08-04 16:22', channel: '直营' },
  { id: 'SO20260805006', customer: '东莞立讯精密', amount: 78990, status: 'closed', createdAt: '2026-08-05 10:08', channel: '电商' }
]

export const PRODUCTS: ProductItem[] = [
  { id: 'P-8801', name: '深沟球轴承 6205-2RS', category: '轴承', price: 18.6, stock: 12400, status: 'on' },
  { id: 'P-8802', name: '气动三联件 AC3000-03', category: '气动元件', price: 126, stock: 860, status: 'on' },
  { id: 'P-8803', name: '不锈钢内六角螺栓 M8×30', category: '紧固件', price: 0.82, stock: 98600, status: 'on' },
  { id: 'P-8804', name: '施耐德接触器 LC1D09', category: '电气', price: 168.5, stock: 0, status: 'off' },
  { id: 'P-8805', name: '防砸安全鞋 S3 级', category: '劳保', price: 239, stock: 320, status: 'draft' }
]

export const METRICS: ReportMetric[] = [
  { id: 'gmv', label: '本月成交额', value: 15253700, unit: '元', delta: 0.128 },
  { id: 'orders', label: '订单量', value: 2841, unit: '单', delta: 0.043 },
  { id: 'rate', label: '履约准时率', value: 96.4, unit: '%', delta: -0.012 },
  { id: 'sku', label: '动销 SKU', value: 5620, unit: '件', delta: 0.076 }
]

export const TRENDS: TrendPoint[] = [
  { date: '07-31', amount: 428000, count: 96 },
  { date: '08-01', amount: 512000, count: 118 },
  { date: '08-02', amount: 386000, count: 87 },
  { date: '08-03', amount: 601000, count: 134 },
  { date: '08-04', amount: 723000, count: 151 },
  { date: '08-05', amount: 664000, count: 142 },
  { date: '08-06', amount: 815000, count: 168 }
]

export const ORDER_STATUS_TEXT: Record<OrderItem['status'], string> = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  done: '已完成',
  closed: '已关闭'
}

export const PRODUCT_STATUS_TEXT: Record<ProductItem['status'], string> = {
  on: '在售',
  off: '已下架',
  draft: '草稿'
}
