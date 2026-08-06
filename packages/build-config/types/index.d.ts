import type { Plugin, PluginOption, UserConfig } from 'vite'

export * from './apps'

/** qiankun × Vite 子应用适配：内部基于 vite-plugin-qiankun 注入入口改写与延迟生命周期 */
export type QiankunPlugin = PluginOption

export interface CreateSubAppConfigOptions {
  appKey: string
  command: 'serve' | 'build'
  plugins?: PluginOption[]
  dedupe?: string[]
  extra?: UserConfig
}

export interface CreateMainAppConfigOptions {
  command: 'serve' | 'build'
  plugins?: PluginOption[]
  dedupe?: string[]
  extra?: UserConfig
}

export declare function createSubAppConfig(options: CreateSubAppConfigOptions): UserConfig
export declare function createMainAppConfig(options: CreateMainAppConfigOptions): UserConfig
export declare function mergeConfig<T extends object>(base: T, extra?: Partial<T>): T
export declare const WORKSPACE_ROOT: string
export declare const INTERNAL_PACKAGES: string[]
