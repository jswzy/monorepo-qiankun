import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router'
import ProductListView from '../views/ProductListView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'product-list', component: ProductListView },
  { path: '/detail/:id', name: 'product-detail', component: ProductDetailView, props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

/** base：qiankun 环境下为主应用的 activeRule（/product），独立运行为 '/' */
export function createAppRouter(base: string): Router {
  return createRouter({ history: createWebHistory(base), routes })
}
