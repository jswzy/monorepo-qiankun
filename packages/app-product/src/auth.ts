/**
 * app-product（Vue 3）的登录态接入
 *
 * 视图读 connectGlobalState 维护的响应式全局状态 globalState.auth（与 user/theme 同源，稳定可靠）。
 * token 来源：
 *  - 集成模式：同域共享 localStorage，hydrate 出主应用 token 后一次性写进 globalState（不订阅，避免广播回环）；
 *    之后主应用刷新/登出由 window 事件（bindExternalSync）实时驱动 tokenManager，视图再随 globalState 更新。
 *  - 独立模式：自己获取 token，并订阅 tokenManager 同步进 globalState（connected=false，不广播，无回环）。
 */
import { tokenManager, type AuthSession } from '@demo/shared-utils/auth'
import { isQiankun } from '@demo/shared-utils/qiankun'
import type { QiankunProps } from '@demo/shared-utils/qiankun'
import { patchGlobalState } from './global-store'

function pushToView(session: AuthSession | null): void {
  // qiankun 模式下子应用不是 token 权威：把 auth 写进本地 globalState 仅用于展示，
  // 绝不能经 setGlobalState 广播回基座 —— 否则会触发「基座下发→子应用回传→基座再下发」的
  // 无限回环，导致主线程死循环 / 卡死 / OOM。其它字段（theme/collapsed 等）仍按需广播。
  patchGlobalState({ auth: session }, { broadcast: false })
}

/** qiankun 模式下订阅 tokenManager 的取消函数（用于卸载时清理，避免监听器堆积） */
let unsubAuth: (() => void) | null = null

export async function initAuth(props?: QiankunProps): Promise<void> {
  if (isQiankun() && props) {
    tokenManager.setMode('qiankun-subapp')
    tokenManager.hydrate()
    pushToView(tokenManager.getSession())
    // 订阅主应用派发的登录态事件，拿到刷新 / 登出等实时变更
    tokenManager.bindExternalSync()
    // 关键：把视图写入订阅到 tokenManager。hydrate / 主应用下发(setFromGlobal) / 实时事件(handleExternalSync)
    // 任一来源更新会话后都会 notify → pushToView → 视图刷新。否则若本应用挂载时恰好错过高频登录态
    // 广播（时序竞争），首屏拿到的是空会话，之后到达的 token 也到不了视图，永久显示「未获取」。
    unsubAuth = tokenManager.subscribe(pushToView)
  } else {
    await tokenManager.bootstrapStandalone()
    pushToView(tokenManager.getSession())
    tokenManager.subscribe(pushToView)
  }
}

/** 子应用卸载时调用：移除 window 登录态事件监听与视图订阅，避免多次挂载后监听器堆积 */
export function destroyAuth(): void {
  unsubAuth?.()
  unsubAuth = null
  tokenManager.destroyExternalSync()
}
