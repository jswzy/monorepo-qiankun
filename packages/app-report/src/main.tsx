import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import '@demo/ui-package/styles.css'
import './styles/app.css'

import App from './App'
import { initGlobalStore, disposeGlobalStore } from './global-store'
import {
  renderWithQiankun,
  isQiankun,
  resolveMountRoot,
  resolveRouterBase,
  type QiankunProps
} from '@demo/shared-utils/qiankun'

let root: Root | null = null

function render(props: QiankunProps = {}) {
  initGlobalStore(props)

  const container = resolveMountRoot(props, '#app-report-root')
  root = createRoot(container)
  root.render(
    <StrictMode>
      <BrowserRouter basename={resolveRouterBase(__APP_ACTIVE_RULE__)}>
        <App />
      </BrowserRouter>
    </StrictMode>
  )
}

function destroy() {
  root?.unmount()
  root = null
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
