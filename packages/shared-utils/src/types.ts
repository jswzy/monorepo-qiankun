/** 业务域公共领域模型 —— 主应用与三个子应用共用同一套类型定义 */

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'done' | 'closed'

export interface OrderItem {
  id: string
  customer: string
  amount: number
  status: OrderStatus
  createdAt: string
  channel: '直营' | '经销' | '电商'
}

export type ProductStatus = 'on' | 'off' | 'draft'

export interface ProductItem {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: ProductStatus
}

export interface ReportMetric {
  id: string
  label: string
  value: number
  unit: '元' | '单' | '%' | '件'
  /** 环比，正数为涨 */
  delta: number
}

export interface TrendPoint {
  date: string
  amount: number
  count: number
}

/** 登录用户 —— 由主应用下发给所有微应用 */
export interface CurrentUser {
  id: string
  name: string
  role: '管理员' | '运营' | '访客'
  dept: string
}

/** 跨应用共享的全局状态 */
export interface GlobalState {
  user: CurrentUser
  theme: 'light' | 'dark'
  /** 主应用侧边栏折叠态 */
  collapsed: boolean
  /** 最近一次跨应用动作，用于演示状态联动 */
  lastAction: string
  /** 待办角标 */
  todoCount: number
}

/** 统一分页响应 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
