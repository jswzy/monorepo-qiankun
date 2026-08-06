/**
 * qiankun 子应用运行时适配
 *
 * 与 @demo/build-config（内部使用 vite-plugin-qiankun）配套：
 * vite-plugin-qiankun 会把子应用入口的 `<script type="module" src>` 改写成原生
 * `import('...')`，让 ESM 在真实 window 下原生执行（qiankun 沙箱无法 eval ESM，会抛
 * SyntaxError 导致微应用永远卡在 loading）；同时在 HTML 注入一段 classic 脚本，在沙箱
 * window 上挂好「延迟兑现」的生命周期。这里负责把真正的生命周期写到
 * `window.moudleQiankunAppLifeCycles[name]`，由注入脚本的 `.finally` 兑现，打通沙箱 ↔ 真实 window。
 */
import type { GlobalStateChannel } from '../global-state'

export interface QiankunProps extends GlobalStateChannel {
  /** qiankun 注册名 */
  name?: string
  /** 主应用提供的挂载容器 */
  container?: HTMLElement
  /** 主应用下发的自定义 props */
  [key: string]: unknown
}

export interface QiankunLifeCycle<P = QiankunProps> {
  bootstrap?: (props: P) => void | Promise<void>
  mount: (props: P) => void | Promise<void>
  unmount: (props: P) => void | Promise<void>
  update?: (props: P) => void | Promise<void>
}

export type LifeCycleFn<P = QiankunProps> = (props: P) => void | Promise<void>

interface QiankunGlobalWindow {
  __POWERED_BY_QIANKUN__?: boolean
  __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string
  /** vite-plugin-qiankun 注入：当前子应用注册名 */
  qiankunName?: string
  /** vite-plugin-qiankun 注入的沙箱代理（真实 window.proxy） */
  proxy?: QiankunGlobalWindow
  /** 子应用写入的生命周期集合 */
  moudleQiankunAppLifeCycles?: Record<string, QiankunLifeCycle>
  [key: string]: unknown
}

/** 取 qiankun 注入的沙箱代理；独立运行时回退到真实 window */
function getQiankunWindow(): QiankunGlobalWindow {
  const w = typeof window !== 'undefined' ? (window as QiankunGlobalWindow).proxy : undefined
  return (w ?? (typeof window !== 'undefined' ? (window as unknown as QiankunGlobalWindow) : ({} as QiankunGlobalWindow)))
}

/** 当前是否运行在 qiankun 主应用中 */
export function isQiankun(): boolean {
  return Boolean(getQiankunWindow().__POWERED_BY_QIANKUN__)
}

/** qiankun 注入的资源前缀，独立运行时为 '/' */
export function getPublicPath(): string {
  return getQiankunWindow().__INJECTED_PUBLIC_PATH_BY_QIANKUN__ ?? '/'
}

/** 当前子应用的 qiankun 注册名（独立运行 / 主应用中为空串） */
export const QIANKUN_APP_NAME: string =
  typeof window !== 'undefined' ? ((window as QiankunGlobalWindow).proxy?.qiankunName ?? '') : ''

/**
 * 注册子应用生命周期。
 * 在 qiankun 环境下写入 `window.moudleQiankunAppLifeCycles[name]`，由 vite-plugin-qiankun
 * 注入脚本的 `.finally` 兑现延迟生命周期；独立运行时是安全的空操作。
 */
export function renderWithQiankun(lifeCycles: QiankunLifeCycle): void {
  const qiankunWindow = getQiankunWindow()
  if (!qiankunWindow.__POWERED_BY_QIANKUN__) return

  const realWin = window as unknown as QiankunGlobalWindow
  if (!realWin.moudleQiankunAppLifeCycles) {
    realWin.moudleQiankunAppLifeCycles = {}
  }
  const name = qiankunWindow.qiankunName
  if (name) {
    realWin.moudleQiankunAppLifeCycles[name] = lifeCycles
  }
}

/**
 * 解析挂载节点：
 * qiankun 环境下必须在主应用给的 container 内部找，独立运行则退回 document。
 */
export function resolveMountRoot(props: QiankunProps = {}, selector = '#app'): HTMLElement {
  const scope: ParentNode = props.container ?? document
  const el = scope.querySelector<HTMLElement>(selector)
  if (el) return el

  // 兜底：容器里没有约定节点时自己建一个，避免白屏
  const created = document.createElement('div')
  created.id = selector.replace(/^#/, '')
  ;(props.container ?? document.body).appendChild(created)
  return created
}

/** 子应用路由 base：被主应用集成时使用 activeRule，独立运行时用 '/' */
export function resolveRouterBase(activeRule: string): string {
  return isQiankun() ? activeRule : '/'
}
