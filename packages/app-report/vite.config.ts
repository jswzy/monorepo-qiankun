import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { createSubAppConfig } from '@demo/build-config'

/**
 * qiankun 兼容性修复：移除 @vitejs/plugin-react 注入到 HTML 的 Refresh 引导脚本。
 *
 * 问题：plugin-react 会在 HTML 的 <head> 注入一段
 *   <script type="module">import { injectIntoGlobalHook } from "/@react-refresh"; ...</script>
 * qiankun 用 import-html-entry 拉取子应用 HTML 时，会把所有内联脚本当作「经典脚本」用 eval 执行，
 * 而这里面是「静态 import 语句」→ 抛 `Cannot use import statement outside a module`，引导脚本从未执行；
 * 即便改写成动态 import()，经典脚本也无法保证在入口模块图之前执行，组件模块的 Refresh 自检
 * `@vitejs/plugin-react can't detect preamble` 仍会先一步抛错 → 微应用永久卡在 loading。
 *
 * 修复：把 Refresh 引导逻辑搬进「入口模块的第一个依赖」（见 src/react-refresh-preamble.ts），
 * 用 ES Module 求值顺序 + 顶层 await 保证它先于所有组件模块完成，从而彻底解决顺序与语法问题。
 * 这里只需把 HTML 里那段会出错的引导脚本删掉即可；浏览器直连（独立启动）同样走入口模块里的引导逻辑。
 */
function removeReactRefreshPreambleForQiankun(): Plugin {
  return {
    name: 'remove-react-refresh-preamble-for-qiankun',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/<script type="module">([\s\S]*?)<\/script>/gi, (full, code: string) => {
        // 仅移除 @react-refresh 引导脚本，其余脚本原样保留
        if (!code.includes('@react-refresh')) return full
        return '<!-- react-refresh preamble moved into entry module for qiankun compatibility -->'
      })
    }
  }
}

export default defineConfig(({ command }) =>
  createSubAppConfig({
    appKey: 'app-report',
    command,
    plugins: [react(), removeReactRefreshPreambleForQiankun()],
    dedupe: ['react', 'react-dom']
  })
)
