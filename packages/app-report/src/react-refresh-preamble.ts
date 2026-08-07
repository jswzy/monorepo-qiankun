/**
 * React Fast Refresh 引导（qiankun 子应用专用）。
 *
 * 为什么需要它：@vitejs/plugin-react 默认把 Refresh 引导脚本注入到 index.html 的 <head>，形如
 *   `<script type="module">import { injectIntoGlobalHook } from "/@react-refresh"; ...</script>`。
 * 在 qiankun 主应用里，子应用 HTML 由 import-html-entry 拉取并把内联脚本当「经典脚本」eval，
 * 静态 import 会直接语法报错；即便改写成动态 import()，经典脚本也无法保证在入口模块图之前执行，
 * 组件模块的 Refresh 自检 `if (!window.$RefreshReg$) throw "can't detect preamble"` 会先一步抛错
 * → 微应用卡在 loading。
 *
 * 做法（见 vite.config.ts 已把 HTML 里的那段引导脚本移除）：
 * 1. 本文件作为 main.tsx 的【第一个 import】，由 ES Module 求值顺序保证它先于所有组件模块执行；
 * 2. 先把 `window.$RefreshReg$` / `$RefreshSig$` 同步置为占位函数——组件模块只检查这两个值是否为真，
 *    只要存在就不会抛错，从而微应用能正常挂载；
 * 3. 再异步安装真正的 Refresh 运行时（支持 HMR），失败也不影响挂载。
 *
 * 生产构建：`import.meta.env.DEV` 为 false，整段被 Rollup 摇树删除，不会引用仅 dev 存在的 /@react-refresh。
 */
const w = window as unknown as Record<string, unknown>

if (import.meta.env.DEV) {
  if (typeof w.$RefreshReg$ !== 'function') {
    w.$RefreshReg$ = () => {}
  }
  if (typeof w.$RefreshSig$ !== 'function') {
    w.$RefreshSig$ = () => (type: unknown) => type
  }

  // 异步安装真正的 Refresh 运行时，使 React 组件热更新可用；失败仅影响 HMR，不影响挂载。
  // @ts-expect-error '/@react-refresh' 是 Vite 仅开发态注入的虚拟模块，tsc 无法解析其类型；
  // 生产构建中整段会被 Rollup 摇树移除，不会引用该模块。
  import('/@react-refresh')
    .then((m: { default: { injectIntoGlobalHook: (g: unknown) => void } }) => {
      m.default.injectIntoGlobalHook(window as unknown as Window & typeof globalThis)
    })
    .catch(() => {})
}

export {}
