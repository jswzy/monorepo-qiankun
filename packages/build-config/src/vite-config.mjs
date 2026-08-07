/**
 * 共享 Vite 配置工厂
 *
 * 四个应用的 vite.config.ts 只需要声明「自己的框架插件」，
 * 端口 / base / qiankun 适配 / workspace 源码直连 / HMR 回连 等都在这里统一维护。
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { MAIN_APP, getSubApp } from './apps.mjs'
import qiankun from 'vite-plugin-qiankun'

/** monorepo 仓库根目录绝对路径 */
export const WORKSPACE_ROOT = fileURLToPath(new URL('../../../', import.meta.url))

/**
 * 可选的依赖预构建缓存目录（仅当设置 VITE_CACHE_DIR 时生效）。
 * 默认缓存落在各包 node_modules/.vite；在某些受限环境里对该路径的批量删除会被拦截，
 * 此时可用 VITE_CACHE_DIR 把缓存重定向到 node_modules 之外，避免启动失败。
 * 正常开发机可不设置，使用默认行为。
 */
function resolveCacheDir(subdir) {
  return process.env.VITE_CACHE_DIR ? join(process.env.VITE_CACHE_DIR, subdir) : undefined
}

/** 域内公共包：必须走源码直连，才能做到「改公共包 → 子应用热更新实时生效」 */
export const INTERNAL_PACKAGES = ['@demo/shared-utils', '@demo/ui-package', '@demo/build-config']

const isPlainObject = (v) => Object.prototype.toString.call(v) === '[object Object]'

/** 轻量深合并：数组拼接、对象递归、标量后者覆盖 */
export function mergeConfig(base, extra) {
  if (!extra) return base
  const out = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) continue
    const prev = out[key]
    if (Array.isArray(prev) && Array.isArray(value)) out[key] = [...prev, ...value]
    else if (isPlainObject(prev) && isPlainObject(value)) out[key] = mergeConfig(prev, value)
    else out[key] = value
  }
  return out
}

/**
 * 子应用（微应用）Vite 配置
 *
 * @param {object} options
 * @param {string} options.appKey        微应用 key，见 apps.mjs
 * @param {'serve'|'build'} options.command Vite 的 command
 * @param {import('vite').PluginOption[]} [options.plugins] 框架插件，如 vue()/vue2()/react()
 * @param {string[]} [options.dedupe]    需要强制去重的依赖（vue2 与 vue3 共存时必须）
 * @param {import('vite').UserConfig} [options.extra] 追加/覆盖配置
 * @returns {import('vite').UserConfig}
 */
export function createSubAppConfig({ appKey, command, plugins = [], dedupe = [], extra }) {
  const app = getSubApp(appKey)
  const isDev = command === 'serve'

  // 生产环境资源前缀：默认部署到主域名的 /app-xxx/ 子路径；
  // 若独立部署到 CDN/独立域名，构建时传 APP_PUBLIC_PATH=https://cdn.xxx.com/app-order/
  const publicPath = process.env.APP_PUBLIC_PATH || app.publicPath
  // 开发环境必须用绝对地址，否则被主应用加载时会去主应用域名下找资源
  const base = isDev ? `http://localhost:${app.devPort}/` : publicPath

  /** @type {import('vite').UserConfig} */
  const config = {
    base,
    plugins: [...plugins, qiankun(app.key, { useDevMode: true })],
    resolve: {
      // vue2 / vue3 / react 在同一仓库共存，必须锁定从当前应用的 node_modules 解析，
      // 否则公共包里的 .vue 可能解析到隔壁应用的框架版本
      dedupe
    },
    optimizeDeps: {
      // 内部包保持源码形态参与编译 → 天然获得 HMR 与完整 TS 类型
      exclude: INTERNAL_PACKAGES
    },
    server: {
      port: app.devPort,
      strictPort: true,
      // 主应用（8000）需要跨域 fetch 子应用 HTML
      cors: true,
      // 被 qiankun 嵌入后页面地址是主应用域名，HMR 必须显式回连自己
      hmr: { protocol: 'ws', host: 'localhost', port: app.devPort, clientPort: app.devPort },
      fs: { allow: [WORKSPACE_ROOT] }
    },
    preview: {
      port: app.devPort + 1000,
      strictPort: true,
      cors: true
    },
    css: { devSourcemap: true },
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    },
    cacheDir: resolveCacheDir(app.key),
    define: {
      __APP_KEY__: JSON.stringify(app.key),
      __APP_TITLE__: JSON.stringify(app.title),
      __APP_FRAMEWORK__: JSON.stringify(app.framework),
      __APP_ACTIVE_RULE__: JSON.stringify(app.activeRule)
    }
  }

  return mergeConfig(config, extra)
}

/**
 * 主应用（基座）Vite 配置
 * @param {object} options
 * @param {'serve'|'build'} options.command
 * @param {import('vite').PluginOption[]} [options.plugins]
 * @param {string[]} [options.dedupe]
 * @param {import('vite').UserConfig} [options.extra]
 * @returns {import('vite').UserConfig}
 */
export function createMainAppConfig({ command, plugins = [], dedupe = [], extra }) {
  const isDev = command === 'serve'

  /** @type {import('vite').UserConfig} */
  const config = {
    base: process.env.APP_PUBLIC_PATH || MAIN_APP.publicPath,
    plugins,
    resolve: { dedupe },
    optimizeDeps: { exclude: INTERNAL_PACKAGES },
    server: {
      port: MAIN_APP.devPort,
      strictPort: true,
      open: isDev,
      fs: { allow: [WORKSPACE_ROOT] }
    },
    preview: { port: MAIN_APP.devPort + 1000, strictPort: true },
    css: { devSourcemap: true },
    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: false,
      reportCompressedSize: false
    },
    cacheDir: resolveCacheDir('main')
  }

  return mergeConfig(config, extra)
}
