/// <reference types="vite/client" />

// Vue 2.7 生态没有 Volar 级别的 SFC 类型推导，这里按惯例做兜底声明
declare module '*.vue' {
  import type Vue from 'vue'
  const component: typeof Vue
  export default component
}

/** 由 @demo/build-config 的 createSubAppConfig 在构建期注入 */
declare const __APP_KEY__: string
declare const __APP_TITLE__: string
declare const __APP_FRAMEWORK__: string
declare const __APP_ACTIVE_RULE__: string
