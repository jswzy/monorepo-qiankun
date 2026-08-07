import { createApp } from 'vue'

// 域内公共样式：三个子应用引用的是同一份 CSS，视觉天然一致
import '@demo/ui-package/styles.css'
import './styles/main.css'

import App from './App.vue'
import { router } from './router'
import { bootstrapMicroApps } from './micro/register'
import { initHostAuth } from './auth/host-auth'

const app = createApp(App)
app.use(router)
app.mount('#root')

// 主应用先模拟登录拿到 token，并通过 qiankun 全局状态下发给子应用。
// 失败仅记录，不影响基座自身运行（生产环境应跳登录页）。
initHostAuth().catch((err) => console.error('[主应用] 初始化登录态失败：', err))

// 等主应用首次路由就绪后再启动 qiankun，确保 #micro-app-viewport 容器已经在 DOM 中
router.isReady().then(() => {
  bootstrapMicroApps()
})
