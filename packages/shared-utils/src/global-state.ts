import type { GlobalState } from './types'
import { CURRENT_USER } from './mock-data'

/**
 * 跨应用全局状态桥
 *
 * - 在 qiankun 环境：走主应用通过 props 下发的 onGlobalStateChange / setGlobalState 通道；
 * - 独立启动子应用时：自动降级为进程内状态，保证 `pnpm dev:order` 单独跑也不报错。
 */

import { tokenManager } from './auth'

export const DEFAULT_GLOBAL_STATE: GlobalState = {
  user: CURRENT_USER,
  theme: 'light',
  collapsed: false,
  lastAction: '应用启动',
  todoCount: 3,
  // 登录态初始为空；主应用启动后模拟登录并下发，子应用据此拿到共享 token。
  // 独立启动的子应用此处为 null，由子应用自己获取。
  auth: null
}

/** qiankun 通过 props 注入的状态通道（只声明用到的部分，避免子应用强依赖 qiankun 包） */
export interface GlobalStateChannel {
  onGlobalStateChange?: (
    callback: (state: Record<string, unknown>, prev: Record<string, unknown>) => void,
    fireImmediately?: boolean
  ) => void
  setGlobalState?: (state: Record<string, unknown>) => boolean
  offGlobalStateChange?: () => boolean
}

export type GlobalStateListener = (state: GlobalState, prev: GlobalState) => void

export interface GlobalStoreHandle {
  /** 是否成功接上主应用下发的通道 */
  readonly connected: boolean
  getState(): GlobalState
  /**
   * 更新本地状态并（可选地）广播给主应用 / 其它子应用。
   * @param opts.broadcast 是否经 qiankun setGlobalState 广播。默认 true（主应用 / 普通字段使用）；
   *   子应用（qiankun-subapp）写 auth 时必须传 false，否则会把 auth 回传基座形成「下发→回传→再下发」回环。
   */
  setState(patch: Partial<GlobalState>, opts?: { broadcast?: boolean }): void
  subscribe(listener: GlobalStateListener): () => void
  destroy(): void
}

export function connectGlobalState(
  channel?: GlobalStateChannel,
  initial: Partial<GlobalState> = {}
): GlobalStoreHandle {
  let state: GlobalState = { ...DEFAULT_GLOBAL_STATE, ...initial }
  const listeners = new Set<GlobalStateListener>()
  const connected = typeof channel?.onGlobalStateChange === 'function'

  const notify = (prev: GlobalState) => {
    listeners.forEach((fn) => {
      try {
        fn(state, prev)
      } catch (err) {
        console.error('[@demo/shared-utils] 全局状态监听器抛错：', err)
      }
    })
  }

  if (connected) {
    channel!.onGlobalStateChange!((next) => {
      const prev = state
      state = { ...state, ...(next as Partial<GlobalState>) }
      // 登录态不再依赖 qiankun globalState 的 auth 字段（子应用挂载时该字段会被 qiankun 重置、
      // 且全局仅允许一个监听，重复订阅会互相覆盖）。登录态的同步改由 tokenManager 自带的
      // 「共享 localStorage（hydrate 兜底）+ window 事件（bindExternalSync 实时）」负责。
      // 这里只在 auth 为「有效会话对象」时顺带桥接一次，绝不会因为 auth:null 而清空子应用
      // 已经 hydrate 出来的 token。
      const auth = (next as Partial<GlobalState>).auth
      if (auth) tokenManager.setFromGlobal(auth)
      notify(prev)
    }, true)
  }

  return {
    get connected() {
      return connected
    },
    getState: () => state,
    setState(patch, opts = {}) {
      const prev = state
      state = { ...state, ...patch }
      // 默认广播；子应用（qiankun-subapp）在 pushToView 时传 { broadcast: false }，
      // 因为子应用不是 token 权威，把 auth 经 setGlobalState 回传基座会形成「下发→回传→再下发」回环。
      if (connected && channel?.setGlobalState && opts.broadcast !== false) {
        // 交给主应用广播，主应用会再通过 onGlobalStateChange 回灌，这里先本地乐观更新
        channel.setGlobalState(patch as Record<string, unknown>)
      }
      notify(prev)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy() {
      listeners.clear()
      channel?.offGlobalStateChange?.()
    }
  }
}
