/**
 * 鉴权领域模型
 *
 * 这些类型在主应用（token 拥有者）与三个子应用之间共享，
 * 保证「token 长什么样、里面装了什么」在所有应用里是同一套定义。
 */

/** 登录用户 —— 来自 JWT payload，避免每次都去解码 token */
export interface AuthUser {
  /** 用户唯一标识 */
  id: string
  /** 展示名 */
  name: string
  /** 角色 */
  role: string
  /** 所属部门 */
  dept: string
}

/**
 * 一次完整的登录会话。
 * 主应用获取后通过 qiankun 全局状态下发，子应用直接消费；独立运行子应用则自己获取。
 */
export interface AuthSession {
  /** 访问令牌（Bearer）。请求时放在 `Authorization: Bearer <accessToken>` 头里 */
  accessToken: string
  /** 刷新令牌。accessToken 临近过期时用它换发新令牌，避免用户重新登录 */
  refreshToken: string
  /** 令牌类型，通常为 'Bearer' */
  tokenType: string
  /** 访问令牌过期时间（毫秒时间戳），用于主动刷新判断 */
  expiresAt: number
  /** 令牌颁发时间（毫秒时间戳） */
  issuedAt: number
  /** 令牌携带的用户声明，UI 直接展示，不必再解码 JWT */
  user: AuthUser
}

/** 登录凭据 —— 生产环境由登录页收集；这里用 mock，传任意非空用户名即可 */
export interface LoginCredentials {
  username: string
  password: string
}
