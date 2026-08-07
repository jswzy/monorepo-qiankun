/**
 * @demo/shared-utils —— 业务域公共工具包
 *
 * ⚠️ 边界约束：本包只供当前业务域（本仓库）使用。
 * 外部业务域如需复用，必须执行 `pnpm changeset` 走版本发布流程，禁止跨仓库源码引用。
 */

export * from './types'
export * from './format'
export * from './storage'
export * from './event-bus'
export * from './request'
export * from './global-state'
export * from './mock-data'
export * from './auth'

/** 包版本，便于在页面上直观确认子应用吃到的是同一份公共包 */
export const SHARED_UTILS_VERSION = '0.1.0'
