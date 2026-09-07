import { createRouter, createMemoryHistory, type RouteRecordRaw, type Router } from 'vue-router'
import ShipControlTower from '../views/ShipControlTower.vue'
import ShipRouteView from '../views/ShipRouteView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'ship-tower', component: ShipControlTower },
  { path: '/route/:id', name: 'ship-route', component: ShipRouteView, props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

/**
 * 与 app-product 一致：子应用使用「内存历史」而非 HTML5 history。
 * qiankun 中基座才是 URL 拥有者，子应用内路由（船队总览 → 单船航线）完全在内存中解析，
 * 不触碰 window.history，与基座和其它子应用彻底解耦，反复挂载/卸载都不会污染导航。
 */
export function createAppRouter(base: string): Router {
  return createRouter({ history: createMemoryHistory(base), routes })
}
