import VueRouter, { type RouteConfig } from 'vue-router'
import OrderListView from '../views/OrderListView.vue'
import OrderDetailView from '../views/OrderDetailView.vue'

const routes: RouteConfig[] = [
  { path: '/', name: 'order-list', component: OrderListView },
  { path: '/detail/:id', name: 'order-detail', component: OrderDetailView, props: true },
  { path: '*', redirect: '/' }
]

/**
 * base 由运行环境决定：
 * - qiankun 环境：使用主应用的 activeRule（/order），路由前缀与基座对齐
 * - 独立运行：'/'
 */
export function createAppRouter(base: string) {
  return new VueRouter({ mode: 'history', base, routes })
}
