import { createApp, type App as VueApp } from 'vue'

import '@demo/ui-package/styles.css'
import './styles/app.css'

import AppRoot from './App.vue'
import { createAppRouter } from './router'
import { initGlobalStore, disposeGlobalStore } from './global-store'
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

  app = createApp(AppRoot)
  app.use(createAppRouter(resolveRouterBase(__APP_ACTIVE_RULE__)))
  app.mount(resolveMountRoot(props, '#app-product-root'))
}

function destroy() {
  app?.unmount()
  app = null
  disposeGlobalStore()
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
