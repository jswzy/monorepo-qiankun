import { createRouter, createMemoryHistory, type RouteRecordRaw, type Router } from 'vue-router'
import ProductListView from '../views/ProductListView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'product-list', component: ProductListView },
  { path: '/detail/:id', name: 'product-detail', component: ProductDetailView, props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

/**
 * 子应用使用「内存历史」而非 HTML5 history：
 * qiankun 中主应用（基座）才是 URL 的拥有者，子应用只是挂在 /product、/order、/report 下的“页面”。
 * 若子应用各自 new 一个 createWebHistory，会往 window 上挂 popstate 监听，卸载时清理不干净，
 * 多次切换后多个历史实例争抢 window.history，导致「切到 Vue3 子应用后地址栏跳回 /、子应用挂载失败」
 * 这类诡异问题。改用内存历史后，子应用内部路由（如商品详情）完全在内存中解析，不再触碰 window.history，
 * 与基座、与其它子应用彻底解耦，反复挂载/卸载都不会再污染导航。
 * base 仍用 activeRule，仅用于子应用内部路由前缀对齐。
 */
export function createAppRouter(base: string): Router {
  return createRouter({ history: createMemoryHistory(base), routes })
}
