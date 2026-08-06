import type { GlobalState } from './types'
import { CURRENT_USER } from './mock-data'

/**
 * 跨应用全局状态桥
 *
 * - 在 qiankun 环境：走主应用通过 props 下发的 onGlobalStateChange / setGlobalState 通道；
 * - 独立启动子应用时：自动降级为进程内状态，保证 `pnpm dev:order` 单独跑也不报错。
 */

export const DEFAULT_GLOBAL_STATE: GlobalState = {
  user: CURRENT_USER,
  theme: 'light',
  collapsed: false,
  lastAction: '应用启动',
  todoCount: 3
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
  setState(patch: Partial<GlobalState>): void
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
      notify(prev)
    }, true)
  }

  return {
    get connected() {
      return connected
    },
    getState: () => state,
    setState(patch) {
      const prev = state
      state = { ...state, ...patch }
      if (connected && channel?.setGlobalState) {
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
