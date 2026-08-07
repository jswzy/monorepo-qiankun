/**
 * 主应用（基座）鉴权引导
 *
 * 主应用是 token 的「权威来源」：它模拟一次登录拿到 token，再通过 qiankun 的
 * global state 把 token 下发给所有子应用。子应用无需、也不应该自己签发 token。
 *
 * 流程：
 *   1. attachHost(qiankunActions) —— 把主应用自己的 global-state 通道接进 tokenManager，
 *      这样后续 login() 会通过 setGlobalState 把 token 广播出去；
 *   2. 若本地已有未过期的会话则直接复用（刷新页面不丢登录态），否则模拟登录获取。
 */
import { qiankunActions, patchGlobalState } from '../micro/register'
import { tokenManager, type AuthSession, type LoginCredentials } from '@demo/shared-utils/auth'

/** 演示用登录凭据（真实环境由登录页提交，这里直接灌一个管理员账号） */
const DEMO_CREDENTIALS: LoginCredentials = { username: 'admin', password: 'demo1234' }

/**
 * 主应用启动时的鉴权初始化。在 bootstrapMicroApps() 之前调用，
 * 保证子应用 mount 时全局状态里已经有 token 可下发；即便子应用先 mount，
 * connectGlobalState 的 fireImmediately 也会在订阅瞬间立即把已有 token 补上。
 */
export async function initHostAuth(credentials: LoginCredentials = DEMO_CREDENTIALS): Promise<AuthSession | null> {
  tokenManager.attachHost(qiankunActions)
  let session = tokenManager.getSession()
  if (!session) {
    session = await tokenManager.login(credentials)
  }
  // 把当前（复用或新签发的）token 广播进 qiankun globalState。
  // 关键：主应用「复用」已有会话时（刷新页面不重新登录）不会重新 login，原本就不会把 auth 写进
  // globalState；于是 globalState.auth 一直是默认的 null。子应用 hydrate 出 token 后，主应用任意一次
  // globalState 同步（如 afterMount 的 lastAction）都会把 auth:null 合并进去，把子应用刚还原的登录态
  // 覆盖掉，表现为「切到子应用后始终显示 未获取」。这里显式广播，保证 auth 始终是有效会话。
  patchGlobalState({ auth: session })
  return session
}

/** 重新登录（顶栏「重新登录」按钮用） */
export function hostLogin(credentials: LoginCredentials = DEMO_CREDENTIALS): Promise<AuthSession> {
  return tokenManager.login(credentials)
}

/** 登出（顶栏「退出登录」按钮用）—— 广播 auth:null，子应用同步登出 */
export function hostLogout(): void {
  tokenManager.logout()
}

/** 直接拿到 tokenManager，方便组件读取/展示 */
export function useTokenManager() {
  return tokenManager
}
