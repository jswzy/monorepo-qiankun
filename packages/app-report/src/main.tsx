// 必须作为第一个 import：qiankun 子应用里 React Fast Refresh 的引导逻辑，
// 用顶层 await 保证先于所有组件模块安装运行时（见该文件注释）。
import './react-refresh-preamble'

import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import '@demo/ui-package/styles.css'
import './styles/app.css'

import App from './App'
import { initGlobalStore, disposeGlobalStore } from './global-store'
import { initAuth, destroyAuth } from './auth'
import {
  renderWithQiankun,
  isQiankun,
  resolveMountRoot,
  type QiankunProps
} from '@demo/shared-utils/qiankun'

let root: Root | null = null

function render(props: QiankunProps = {}) {
  initGlobalStore(props)
  // 接入登录态：qiankun 模式下订阅主应用下发的 token；独立模式自助获取
  void initAuth(props)

  const container = resolveMountRoot(props, '#app-report-root')
  root = createRoot(container)
  root.render(
    <StrictMode>
      {/* 子应用用内存路由（同 Vue 子应用的 abstract/memory 模式）：qiankun 下基座才是 URL 拥有者，
          子应用各自挂 HTML5 history 的 popstate 监听会在卸载后残留、互相争抢 window.history，
          造成切换后导航错乱。内存路由彻底避免该问题。

          注意：内存路由完全不感知真实地址栏，因此 basename 必须固定为 "/"，不能用 activeRule。
          此前误用 basename="/report"，内存路由初始 location 恒为 "/"，与 basename 不匹配，
          React Router 直接判定「无法匹配」从而整棵子树不渲染 —— 子应用看似挂载成功（qiankun
          容器已建好）却是一片空白，表现为「切到 React 子应用后内容消失 / 卡死」。 */}
      <MemoryRouter basename="/">
        <App />
      </MemoryRouter>
    </StrictMode>
  )
}

function destroy() {
  root?.unmount()
  root = null
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
