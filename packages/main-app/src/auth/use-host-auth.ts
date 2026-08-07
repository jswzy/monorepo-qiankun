/**
 * 主应用顶栏用的鉴权组合式函数。
 * 把 tokenManager 的会话状态接进 Vue 的响应式系统，并提供「重新登录 / 退出登录」动作。
 */
import { ref, onUnmounted } from 'vue'
import { tokenManager, type LoginCredentials } from '@demo/shared-utils/auth'

const DEMO_CREDENTIALS: LoginCredentials = { username: 'admin', password: 'demo1234' }

export function useHostAuth() {
  const session = ref(tokenManager.getSession())
  const mode = ref(tokenManager.getMode())
  const loggingIn = ref(false)

  const unsub = tokenManager.subscribe((s) => {
    session.value = s
    mode.value = tokenManager.getMode()
  })
  onUnmounted(unsub)

  /** 把长 token 截断展示，避免顶栏被撑爆（生产环境也不会把完整 JWT 暴露到 UI） */
  function maskToken(token?: string | null): string {
    if (!token) return '—'
    return token.length > 28 ? `${token.slice(0, 20)}…${token.slice(-6)}` : token
  }

  async function login(credentials: LoginCredentials = DEMO_CREDENTIALS) {
    loggingIn.value = true
    try {
      await tokenManager.login(credentials)
    } finally {
      loggingIn.value = false
    }
  }

  function logout() {
    tokenManager.logout()
  }

  return { session, mode, loggingIn, maskToken, login, logout }
}
