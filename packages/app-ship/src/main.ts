import { createApp, type App as VueApp } from 'vue'

import '@demo/ui-package/styles.css'
import './styles/app.css'

import AppRoot from './App.vue'
import { createAppRouter } from './router'
import { initGlobalStore, disposeGlobalStore } from './global-store'
import { initAuth, destroyAuth } from './auth'
import {
  renderWithQiankun,
  isQiankun,
  resolveMountRoot,
  resolveRouterBase,
  type QiankunProps
} from '@demo/shared-utils/qiankun'

let app: VueApp<Element> | null = null

function render(props: QiankunProps = {}) {
  initGlobalStore(props)
  // 接入登录态：qiankun 模式下订阅主应用下发的 token；独立模式自助获取
  void initAuth(props)

  app = createApp(AppRoot)
  // 透传 props 让 resolveRouterBase 用 props 判据，避免 isQiankun() 竞态
  app.use(createAppRouter(resolveRouterBase(__APP_ACTIVE_RULE__, props)))
  app.mount(resolveMountRoot(props, '#app-ship-root'))
}

function destroy() {
  app?.unmount()
  app = null
  disposeGlobalStore()
  destroyAuth()
}

renderWithQiankun({
  bootstrap() {
    console.info(`[${__APP_KEY__}] bootstrap · ${__APP_FRAMEWORK__}`)
  },
  mount(props) {
    render(props)
  },
  unmount() {
    destroy()
  }
})

if (!isQiankun()) {
  render()
}
