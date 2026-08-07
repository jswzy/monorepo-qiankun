/**
 * app-report（React 18）的登录态接入
 *
 * 与 Vue 子应用同源（统一用 @demo/shared-utils/auth 的 tokenManager）。
 *  - 被 qiankun 集成：token 由主应用下发，connectGlobalState 已把 auth 桥接进 tokenManager
 *    （请求层用），这里只需把模式标为 qiankun-subapp；
 *  - 独立启动：tokenManager.bootstrapStandalone() 自己获取 token。
 *
 * 组件侧用 useSyncExternalStore 把 tokenManager 接到 React 渲染（见 useAuth）。
 */
import { useSyncExternalStore, useCallback } from 'react'
import { tokenManager, type LoginCredentials } from '@demo/shared-utils/auth'
import { isQiankun } from '@demo/shared-utils/qiankun'
import type { QiankunProps } from '@demo/shared-utils/qiankun'

/** 在应用 mount 时调用：决定 token 从哪来 */
export async function initAuth(props?: QiankunProps): Promise<void> {
  if (isQiankun() && props) {
    // 集成模式：主应用与子应用同域同 window，localStorage 共享，直接 hydrate 出主应用写入的 token；
    // 之后主应用对 token 的刷新 / 登出会通过 window 事件（bindExternalSync）实时同步进 tokenManager。
    tokenManager.setMode('qiankun-subapp')
    tokenManager.hydrate()
    tokenManager.bindExternalSync()
  } else {
    await tokenManager.bootstrapStandalone()
  }
}

/** 子应用卸载时调用：移除 window 登录态事件监听，避免多次挂载后监听器堆积 */
export function destroyAuth(): void {
  tokenManager.destroyExternalSync()
}

/** 组件内读取登录态的 hook；useSyncExternalStore 在 tokenManager 变更时自动重渲染 */
export function useAuth() {
  const session = useSyncExternalStore(
    tokenManager.subscribe,
    tokenManager.getSnapshot,
    tokenManager.getSnapshot
  )

  const maskToken = useCallback((t?: string | null) => {
    if (!t) return '—'
    return t.length > 28 ? `${t.slice(0, 20)}…${t.slice(-6)}` : t
  }, [])

  const login = useCallback((c: LoginCredentials) => tokenManager.login(c), [])
  const logout = useCallback(() => tokenManager.logout(), [])

  return { session, mode: tokenManager.getMode(), maskToken, login, logout }
}
