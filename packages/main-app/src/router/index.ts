import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { SUB_APPS } from '@demo/build-config/apps'

/**
 * 主应用路由 = 自有页面 + 为每个微应用注册的「占位路由」
 * 占位路由本身只渲染加载态，真正的挂载点 #micro-app-viewport 常驻在 App.vue，
 * 避免 qiankun mount 时容器还没被 Vue 渲染出来。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: '工作台' }
  },
  {
    path: '/architecture',
    name: 'architecture',
    component: () => import('../views/ArchitectureView.vue'),
    meta: { title: '架构与规范' }
  },
  ...SUB_APPS.map<RouteRecordRaw>((app) => ({
    path: `${app.activeRule}/:pathMatch(.*)*`,
    name: `micro-${app.key}`,
    component: () => import('../views/MicroHostView.vue'),
    meta: { title: app.title, micro: app.key }
  })),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面不存在' }
  }
]

export const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || ''
  document.title = title ? `${title} · 域内工作台` : '域内工作台'
})

export default router
