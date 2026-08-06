/**
 * 仅供 ui-package 自身 tsc 类型检查使用。
 * 消费方（app-product / main-app）用 vue-tsc 时会直接解析 .vue 源码，
 * 拿到的是精确的 props 类型，而不是这里的兜底声明。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '*.css' {
  const css: string
  export default css
}
