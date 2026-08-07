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
 *
 * 注意：子应用用 abstract（内存）模式而非 history（HTML5）模式。
 * 原因同 app-product：qiankun 下基座才是 URL 拥有者，子应用各自挂 popstate 监听会在卸载后残留、
 * 互相争抢 window.history，造成切换后导航错乱。内存模式彻底避免该问题。
 */
export function createAppRouter(base: string) {
  // return new VueRouter({ mode: 'history', base, routes })
  return new VueRouter({ mode: 'abstract', base, routes })
}
