import { createApp } from 'vue'

// 域内公共样式：三个子应用引用的是同一份 CSS，视觉天然一致
import '@demo/ui-package/styles.css'
import './styles/main.css'

import App from './App.vue'
import { router } from './router'
import { bootstrapMicroApps } from './micro/register'

const app = createApp(App)
app.use(router)
app.mount('#root')

// 等主应用首次路由就绪后再启动 qiankun，确保 #micro-app-viewport 容器已经在 DOM 中
router.isReady().then(() => {
  bootstrapMicroApps()
})
