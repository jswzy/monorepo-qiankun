import { Routes, Route, Link } from 'react-router-dom'
import { DemoTag, UI_PACKAGE_VERSION, UI_PACKAGE_FLAVOR } from '@demo/ui-package/react'
import { SHARED_UTILS_VERSION } from '@demo/shared-utils'
import { isQiankun } from '@demo/shared-utils/qiankun'
import { useGlobalState } from './global-store'
import { useAuth } from './auth'
import ReportListView from './views/ReportListView'
import ReportDetailView from './views/ReportDetailView'

const title = __APP_TITLE__
const framework = __APP_FRAMEWORK__
const embedded = isQiankun()

export default function App() {
  const state = useGlobalState()
  const { session, maskToken } = useAuth()

  return (
    <div className="micro-app micro-app--report">
      <header className="micro-app__banner">
        <div className="micro-app__ident">
          <span className="micro-app__icon">📈</span>
          <div>
            <b>{title}</b>
            <em>@demo/app-report</em>
          </div>
        </div>
        <div className="micro-app__tags">
          <DemoTag tone="primary" dot>
            {framework}
          </DemoTag>
          <DemoTag tone={embedded ? 'primary' : 'success'} dot>
            {embedded ? '由 qiankun 基座挂载' : '独立运行模式'}
          </DemoTag>
          <DemoTag tone="neutral">shared-utils v{SHARED_UTILS_VERSION}</DemoTag>
          <DemoTag tone="neutral">
            ui-package v{UI_PACKAGE_VERSION}（{UI_PACKAGE_FLAVOR}）
          </DemoTag>
        </div>
      </header>

      <nav className="micro-app__nav">
        <Link to="/">概览</Link>
        <Link to="/detail/gmv">成交额明细</Link>
        <Link to="/detail/orders">订单量明细</Link>
      </nav>

      <div className="micro-app__state">
        当前登录：<b>{state.user.name}</b>（{state.user.role}） · 部门 {state.user.dept}
        <span className="micro-app__token">
          共享 token：
          <code>{session ? maskToken(session.accessToken) : '未获取'}</code>
        </span>
      </div>

      <Routes>
        <Route path="/" element={<ReportListView />} />
        <Route path="/detail/:id" element={<ReportDetailView />} />
        <Route path="*" element={<ReportListView />} />
      </Routes>
    </div>
  )
}
