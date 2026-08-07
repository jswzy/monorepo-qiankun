/**
 * app-order（Vue 2.7）的登录态接入
 *
 * 视图直接读 connectGlobalState 维护的响应式全局状态 globalState.auth（user/theme 已用同一套机制，
 * 稳定可靠），不自己造响应式容器，避免与 Vue 2 的响应式边界打交道。
 *
 * token 来源：
 *  - 集成模式：主应用与子应用同域同 window，localStorage 共享。这里 hydrate 出主应用写入的 token，
 *    一次性写进 globalState（不订阅，订阅会经 setState→setGlobalState 广播回基座形成回环）；
 *    之后主应用刷新/登出由 window 事件（bindExternalSync）实时驱动 tokenManager，视图再随 globalState 更新。
 *  - 独立模式：自己获取（生产应跳转 SSO；演示用 mock 自助登录），并订阅 tokenManager 同步进 globalState。
 */
import { tokenManager, type AuthSession } from '@demo/shared-utils/auth'
import { isQiankun } from '@demo/shared-utils/qiankun'
import type { QiankunProps } from '@demo/shared-utils/qiankun'
import { globalStore } from './global-store'

function pushToView(session: AuthSession | null): void {
  // 与 app-product 一致：qiankun 子应用不是 token 权威，写 auth 仅本地展示，禁止回传基座形成回环。
  globalStore()?.setState({ auth: session }, { broadcast: false })
}

/** qiankun 模式下订阅 tokenManager 的取消函数（用于卸载时清理，避免监听器堆积） */
let unsubAuth: (() => void) | null = null

export async function initAuth(props?: QiankunProps): Promise<void> {
  if (isQiankun() && props) {
    // 集成模式：从共享 localStorage 即时拿到主应用下发的 token
    tokenManager.setMode('qiankun-subapp')
    tokenManager.hydrate()
    // 一次性写进视图层（不订阅，避免广播回环）
    pushToView(tokenManager.getSession())
    // 订阅主应用派发的登录态事件，拿到刷新 / 登出等实时变更
    tokenManager.bindExternalSync()
    // 关键：把视图写入订阅到 tokenManager。hydrate / 主应用下发(setFromGlobal) / 实时事件(handleExternalSync)
    // 任一来源更新会话后都会 notify → pushToView → 视图刷新。否则若本应用挂载时恰好错过高频登录态
    // 广播（时序竞争），首屏拿到的是空会话，之后到达的 token 也到不了视图，永久显示「未获取」。
    unsubAuth = tokenManager.subscribe(pushToView)
  } else {
    // 独立模式：自己获取 token
    await tokenManager.bootstrapStandalone()
    pushToView(tokenManager.getSession())
    // connected=false，setState 不广播，订阅不会形成回环
    tokenManager.subscribe(pushToView)
  }
}

/** 子应用卸载时调用：移除 window 登录态事件监听与视图订阅，避免多次挂载后监听器堆积 */
export function destroyAuth(): void {
  unsubAuth?.()
  unsubAuth = null
  tokenManager.destroyExternalSync()
}
