import { reactive } from 'vue'
import {
  registerMicroApps,
  start,
  initGlobalState,
  addGlobalUncaughtErrorHandler,
  type RegistrableApp
} from 'qiankun'
import { SUB_APPS, getDevEntry, type SubAppMeta } from '@demo/build-config/apps'
import { DEFAULT_GLOBAL_STATE, type GlobalState } from '@demo/shared-utils'

export type MicroStatus = 'idle' | 'loading' | 'mounted' | 'error'

/** 各微应用的运行时状态，供 UI 展示加载态 */
export const microStatus = reactive<Record<string, MicroStatus>>(
  Object.fromEntries(SUB_APPS.map((app) => [app.key, 'idle' as MicroStatus]))
)

/** 主应用侧的全局状态镜像（响应式），与 qiankun globalState 双向同步 */
export const globalState = reactive<GlobalState>({ ...DEFAULT_GLOBAL_STATE })

const actions = initGlobalState({ ...DEFAULT_GLOBAL_STATE })

actions.onGlobalStateChange((state) => {
  Object.assign(globalState, state as Partial<GlobalState>)
}, true)

/** 主应用修改全局状态 → qiankun 广播给所有微应用 */
export function patchGlobalState(patch: Partial<GlobalState>) {
  Object.assign(globalState, patch)
  actions.setGlobalState(patch as Record<string, unknown>)
}

/**
 * 子应用 entry：
 * - 开发态指向各自的 dev server（跨域由子应用 server.cors 放行）
 * - 生产态指向独立部署的静态资源目录（同域子路径，见 scripts/serve-dist.mjs 的部署拓扑）
 */
function resolveEntry(app: SubAppMeta) {
  return import.meta.env.DEV ? getDevEntry(app) : app.publicPath
}

let started = false

export function bootstrapMicroApps() {
  if (started) return
  started = true

  const apps: RegistrableApp<Record<string, unknown>>[] = SUB_APPS.map((app) => ({
    name: app.key,
    entry: resolveEntry(app),
    container: '#micro-app-viewport',
    activeRule: app.activeRule,
    props: {
      // 主应用下发的自定义 props；onGlobalStateChange / setGlobalState 由 qiankun 自动注入
      meta: app,
      hostName: '@demo/main-app'
    }
  }))

  registerMicroApps(apps, {
    beforeLoad: [
      async (app) => {
        microStatus[app.name] = 'loading'
      }
    ],
    afterMount: [
      async (app) => {
        microStatus[app.name] = 'mounted'
        patchGlobalState({ lastAction: `挂载微应用 ${app.name}` })
      }
    ],
    afterUnmount: [
      async (app) => {
        microStatus[app.name] = 'idle'
      }
    ]
  })

  addGlobalUncaughtErrorHandler((event) => {
    console.error('[qiankun] 微应用运行异常：', event)
  })

  start({
    // 样式隔离：给子应用注入的样式加上容器属性选择器前缀
    sandbox: { experimentalStyleIsolation: true },
    // 预加载全部子应用静态资源，切换更顺滑
    prefetch: 'all',
    singular: true
  })
}
