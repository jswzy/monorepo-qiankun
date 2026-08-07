/**
 * 模拟鉴权后端（Mock Auth Server）
 *
 * ⚠️ 这是「假」的鉴权服务，仅用于演示「主应用获取 token / 子应用自主获取 token」的过程。
 * 生产环境里这里应替换为真实的 SSO / OAuth2 / 内部网关登录接口：
 *   - POST   /api/auth/login  →  返回 accessToken / refreshToken / 用户信息
 *   - POST   /api/auth/refresh →  用 refreshToken 换发新的 accessToken
 *   - 真实令牌是后端用私钥签名的 JWT，前端无法伪造。
 *
 * 为了贴近真实，这里用 base64url 拼出形如 `header.payload.signature` 的假 JWT，
 * 并带上了 iat / exp 这类标准声明，方便子应用解码、调试与展示。
 */
import type { AuthSession, AuthUser, LoginCredentials } from './types'

// 把类型从 ./types 再导出，方便 token-manager 等消费者统一从本模块引用鉴权相关类型。
export type { AuthSession, AuthUser, LoginCredentials } from './types'

/** 访问令牌有效期：演示用 2 分钟（短一点方便观察刷新）；生产通常为 15~30 分钟 */
const ACCESS_TOKEN_TTL_MS = 2 * 60 * 1000
/** 刷新令牌有效期：演示用 30 分钟 */
const REFRESH_TOKEN_TTL_MS = 30 * 60 * 1000

/** base64url 编码（JWT 标准：去掉填充、+→-、/→_） */
function base64url(input: unknown): string {
  const json = typeof input === 'string' ? input : JSON.stringify(input)
  // btoa 在浏览器环境可用；这里仅在前端运行时调用
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 伪造签名段：真实 JWT 由后端私钥签名，前端无法伪造，这里只放一段随机串当占位 */
function fakeSignature(): string {
  return base64url(Math.random().toString(36).slice(2) + Date.now().toString(36))
}

/** 由用户名稳定派生一个 id，便于演示 */
function deriveUserId(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0
  return 'U-' + hash.toString(36).toUpperCase()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 构造一份登录会话（token + 用户信息），在 login / refresh 共用 */
function buildSession(credentials: LoginCredentials, now = Date.now()): AuthSession {
  const user: AuthUser = {
    id: deriveUserId(credentials.username),
    name: credentials.username,
    role: '管理员',
    dept: '数字化供应链中心'
  }
  const expiresAt = now + ACCESS_TOKEN_TTL_MS
  const issuedAt = now
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    // JWT 标准声明用「秒」；我们内部用毫秒，这里分别填
    iat: Math.floor(issuedAt / 1000),
    exp: Math.floor(expiresAt / 1000)
  }
  const accessToken = `${base64url(header)}.${base64url(payload)}.${fakeSignature()}`
  const refreshToken = `${base64url({ sub: user.id, typ: 'refresh', jti: Math.random().toString(36).slice(2) })}.${fakeSignature()}`
  return { accessToken, refreshToken, tokenType: 'Bearer', expiresAt, issuedAt, user }
}

/**
 * 模拟登录：校验凭据 → 模拟网络往返 → 返回登录会话。
 * 失败路径（用户名为空）演示了「鉴权失败要能抛错并被上层捕获」。
 */
export async function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  if (!credentials?.username?.trim()) {
    throw new Error('用户名不能为空')
  }
  // 模拟一次网络请求往返（真实环境是 fetch('/api/auth/login')）
  await delay(600)
  return buildSession(credentials)
}

/**
 * 模拟刷新：用 refreshToken 换发新的 accessToken。
 * 真实环境 refreshToken 过期 / 失效时应抛错，上层据此跳登录页。
 */
export async function mockRefresh(refreshToken: string): Promise<AuthSession> {
  if (!refreshToken) {
    throw new Error('refreshToken 缺失，无法刷新')
  }
  await delay(400)
  // 刷新时用户名为占位：真实环境后端会从 refreshToken 还原用户，这里用一段随机用户名
  return buildSession({ username: 'refreshed-user', password: '' })
}

/** 解码 JWT payload（仅用于展示，不用于鉴权；鉴权以 expiresAt 为准） */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const json = decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS }
