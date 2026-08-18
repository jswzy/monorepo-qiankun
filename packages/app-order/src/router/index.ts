import VueRouter, { type RouteConfig } from 'vue-router'
import OrderListView from '../views/OrderListView.vue'
import OrderDetailView from '../views/OrderDetailView.vue'

const routes: RouteConfig[] = [
  { path: '/', name: 'order-list', component: OrderListView },
  { path: '/detail/:id', name: 'order-detail', component: OrderDetailView, props: true },
  // { path: '*', redirect: '/' }
  // 兜底用「具名重定向」而非 redirect:'/'：
  // 历史模式下若命中 catch-all，具名重定向会解析到 order-list（/order/），绝不会把地址栏
  // 重置回基座根 '/'，从而避免 activeRule 失配、子应用被卸载、跳回工作台。
  { path: '*', redirect: { name: 'order-list' } }
]

/**
 * 子应用（Vue 2.7 / Vue Router 3）使用「HTML5 history」模式，base = activeRule（/order）：
 * 地址栏呈现真实的 /order、/order/detail/:id，满足「vue2.7 子应用使用 history 模式」的要求。
 *
 * 防跳工作台要点：
 * 1. base 必须可靠 = /order（见 main.ts 传入 props 让 resolveRouterBase 用 props 判据，
 *    而非会竞态的 isQiankun()），否则首屏会把地址栏 replaceState 回根 '/'，activeRule 失配。
 * 2. 兜底用具名重定向 redirect:{name:'order-list'}（见上），绝不用 redirect:'/'。
 * 3. Vue Router 3 的 popstate 监听由 instance.$destroy() 触发的 history.teardown() 同步移除，
 *    不会泄漏；故历史模式在 qiankun singular 下是安全的。
 */
export function createAppRouter(base: string) {
  return new VueRouter({ mode: 'history', base, routes })
}
