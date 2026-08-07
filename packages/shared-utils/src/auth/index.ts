/**
 * 鉴权模块统一出口
 *
 * 使用：
 *   import { tokenManager } from '@demo/shared-utils/auth'
 *   import type { AuthSession, LoginCredentials } from '@demo/shared-utils/auth'
 */
export * from './types'
export * from './mock-auth-server'
export * from './token-manager'
