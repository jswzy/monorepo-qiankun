import Vue from 'vue'
import VueRouter from 'vue-router'

// 域内公共样式（与主应用、其它微应用同一份）
import '@demo/ui-package/styles.css'
import './styles/app.css'

import App from './App.vue'
import { createAppRouter } from './router'
import { initGlobalStore, globalStore } from './global-store'
import { initAuth, destroyAuth } from './auth'
import {
  renderWithQiankun,
  isQiankun,
  resolveMountRoot,
  resolveRouterBase,
  type QiankunProps
} from '@demo/shared-utils/qiankun'

Vue.use(VueRouter)
Vue.config.productionTip = false

let instance: Vue | null = null

function render(props: QiankunProps = {}) {
  initGlobalStore(props)
  // 接入登录态：qiankun 模式下订阅主应用下发的 token；独立模式自助获取
  void initAuth(props)

  const router = createAppRouter(resolveRouterBase(__APP_ACTIVE_RULE__))
  const root = resolveMountRoot(props, '#app-order-root')

  instance = new Vue({
    router,
    render: (h) => h(App)
  })
  instance.$mount(root)
}

function destroy() {
  globalStore().destroy()
  destroyAuth()
  if (!instance) return
  const el = instance.$el as HTMLElement | undefined
  instance.$destroy()
  el?.parentNode?.removeChild(el)
  instance = null
}

/* ---- qiankun 生命周期：由 @demo/build-config 注入的握手脚本负责与基座对接 ---- */
renderWithQiankun({
  bootstrap() {
    console.info(`[${__APP_KEY__}] bootstrap · ${__APP_FRAMEWORK__}`)
  },
  mount(props) {
    render(props)
  },
  unmount() {
    destroy()
  },
  update(props) {
    console.info(`[${__APP_KEY__}] update`, props)
  }
})

/* ---- 独立启动（pnpm dev:order）：自己挂载，不依赖基座 ---- */
if (!isQiankun()) {
  render()
}
