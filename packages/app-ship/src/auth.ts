/**
 * app-ship（Vue 3）的登录态接入
 *
 * 与 app-product 同一套约定：视图读 connectGlobalState 维护的响应式全局状态 globalState.auth。
 * token 来源：
 *  - 集成模式：同域共享 localStorage，hydrate 出主应用 token 后写进 globalState（不广播，避免回环）；
 *  - 独立模式：自己获取 token，并订阅 tokenManager 同步进 globalState。
 */
import { tokenManager, type AuthSession } from '@demo/shared-utils/auth'
import { isQiankun } from '@demo/shared-utils/qiankun'
import type { QiankunProps } from '@demo/shared-utils/qiankun'
import { patchGlobalState } from './global-store'

function pushToView(session: AuthSession | null): void {
  // qiankun 模式下子应用不是 token 权威：写进本地 globalState 仅用于展示，
  // 绝不能经 setGlobalState 广播回基座（会引发无限回环）。
  patchGlobalState({ auth: session }, { broadcast: false })
}

let unsubAuth: (() => void) | null = null

export async function initAuth(props?: QiankunProps): Promise<void> {
  if (isQiankun() && props) {
    tokenManager.setMode('qiankun-subapp')
    tokenManager.hydrate()
    pushToView(tokenManager.getSession())
    tokenManager.bindExternalSync()
    unsubAuth = tokenManager.subscribe(pushToView)
  } else {
    await tokenManager.bootstrapStandalone()
    pushToView(tokenManager.getSession())
    tokenManager.subscribe(pushToView)
  }
}

export function destroyAuth(): void {
  unsubAuth?.()
  unsubAuth = null
  tokenManager.destroyExternalSync()
}
