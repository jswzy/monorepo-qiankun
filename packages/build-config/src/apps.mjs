/**
 * 微应用注册表 —— 全仓唯一数据源（Single Source of Truth）
 *
 * 主应用的 registerMicroApps、各子应用的 vite.config、生产预览服务器、导航菜单
 * 全部从这里读取，杜绝端口 / 路由前缀在多处硬编码后不一致。
 */

/** 主应用 */
export const MAIN_APP = {
  key: 'main-app',
  name: '@demo/main-app',
  title: '域内工作台',
  framework: 'Vue 3',
  devPort: 8000,
  publicPath: '/'
}

/** 三个子应用（微应用） */
export const SUB_APPS = [
  {
    /** qiankun 注册名，同时是 window 上生命周期的挂载 key */
    key: 'app-order',
    name: '@demo/app-order',
    title: '订单中心',
    framework: 'Vue 2.7',
    icon: '📦',
    accent: '#e8663d',
    devPort: 8001,
    /** 主应用中的激活路由前缀 */
    activeRule: '/order',
    /** 生产环境独立部署时的资源前缀，可用环境变量 APP_PUBLIC_PATH 覆盖为 CDN 绝对地址 */
    publicPath: '/app-order/'
  },
  {
    key: 'app-product',
    name: '@demo/app-product',
    title: '商品中心',
    framework: 'Vue 3',
    icon: '🧩',
    accent: '#2f7d5f',
    devPort: 8002,
    activeRule: '/product',
    publicPath: '/app-product/'
  },
  {
    key: 'app-report',
    name: '@demo/app-report',
    title: '数据报表',
    framework: 'React 18',
    icon: '📈',
    accent: '#2d6cb5',
    devPort: 8003,
    activeRule: '/report',
    publicPath: '/app-report/'
  }
]

/** 按 key 取子应用配置 */
export function getSubApp(key) {
  const app = SUB_APPS.find((a) => a.key === key)
  if (!app) {
    throw new Error(
      `[@demo/build-config] 未注册的微应用 "${key}"，可选：${SUB_APPS.map((a) => a.key).join(', ')}`
    )
  }
  return app
}

/** 开发态子应用 entry（qiankun 用），生产态由部署路径决定 */
export function getDevEntry(app) {
  return `//localhost:${app.devPort}`
}
