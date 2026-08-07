/**
 * qiankun 子应用运行时适配
 *
 * 与 @demo/build-config（内部使用 vite-plugin-qiankun）配套：
 * vite-plugin-qiankun 会把子应用入口的 `<script type="module" src>` 改写成原生
 * `import('...')`，让 ESM 在真实 window 下原生执行（qiankun 沙箱无法 eval ESM，会抛
 * SyntaxError 导致微应用永远卡在 loading）；同时在 HTML 注入一段 classic 脚本，在沙箱
 * window 上挂好「延迟兑现」的生命周期。这里负责把真正的生命周期写到
 * `window.moudleQiankunAppLifeCycles[name]`，由注入脚本的 `.finally` 兑现，打通沙箱 ↔ 真实 window。
 *
 * 生命周期必须写到「真实 window」而非沙箱代理：qiankun 的预加载（prefetch）会在真实 window
 * 下提前执行入口模块并缓存，而沙箱代理在卸载时会被销毁；若生命周期只挂在沙箱代理上，重新挂载
 * 时入口模块已被浏览器缓存、不再执行，生命周期就丢失，微应用会永远卡在 loading。
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
  const w = typeof window !== 'undefined' ? (window as unknown as QiankunGlobalWindow).proxy : undefined
  return (w ?? (typeof window !== 'undefined' ? (window as unknown as QiankunGlobalWindow) : ({} as QiankunGlobalWindow)))
}

/**
 * 取「真实 window」。
 *
 * qiankun 的 proxy 沙箱里 `window` 是代理，但同域下 `window.top` 指向真实 window；
 * 关闭沙箱（`sandbox: false`）时 `window.top === window` 仍是真实 window。
 * 生命周期写到真实 window 才能不受沙箱销毁、模块缓存影响。
 */
function getRealWindow(): QiankunGlobalWindow {
  if (typeof window === 'undefined') return {} as QiankunGlobalWindow
  const w = window as unknown as QiankunGlobalWindow & { top?: unknown }
  try {
    if (w.top && w.top !== w) return w.top as unknown as QiankunGlobalWindow
  } catch {
    /* ignore */
  }
  return w
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
  typeof window !== 'undefined' ? ((window as unknown as QiankunGlobalWindow).proxy?.qiankunName ?? '') : ''

/**
 * 注册子应用生命周期。
 *
 * 关键：仅在「真正运行于 qiankun 基座下」时登记。
 * - 判据用 `window.__POWERED_BY_QIANKUN__`（qiankun 注入），而不是 `qiankunName`：
 *   vite-plugin-qiankun 注入的 createQiankunHelper 会「无条件」把 window.qiankunName 设为子应用名，
 *   即便独立运行也如此；若仅凭 qiankunName 判断，独立运行时会误登记生命周期，进而触发插件在
 *   .finally 里执行 `window.proxy.vitemount(...)`——而独立运行没有 qiankun 沙箱，`window.proxy`
 *   为 undefined，直接抛 `Cannot read properties of undefined (reading 'vitemount')`。
 * - 写入真实 window：沙箱代理卸载销毁、模块被浏览器缓存都不会丢失，任何一次挂载的 `.finally`
 *   都能读到，从而兑现延迟生命周期。
 *
 * 说明：本仓库 qiankun 启动已关闭 prefetch（见 register.ts），所以不存在「prefetch 在真实 window
 * 下提前执行入口却未登记」导致的永久 loading 问题，可以放心用 __POWERED_BY_QIANKUN__ 守卫。
 */
export function renderWithQiankun(lifeCycles: QiankunLifeCycle): void {
  const w = getQiankunWindow()
  if (!w.__POWERED_BY_QIANKUN__) return

  const name = w.qiankunName
  if (!name) return

  const realWin = getRealWindow()
  if (!realWin.moudleQiankunAppLifeCycles) {
    realWin.moudleQiankunAppLifeCycles = {}
  }
  realWin.moudleQiankunAppLifeCycles[name] = lifeCycles
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
