export interface MainAppMeta {
  key: string
  name: string
  title: string
  framework: string
  devPort: number
  publicPath: string
}

export interface SubAppMeta {
  /** qiankun 注册名 */
  key: string
  /** npm 包名 */
  name: string
  title: string
  framework: string
  icon: string
  /** 主题色 */
  accent: string
  devPort: number
  /** 主应用中的激活路由前缀 */
  activeRule: string
  /** 生产环境资源前缀 */
  publicPath: string
}

export declare const MAIN_APP: MainAppMeta
export declare const SUB_APPS: SubAppMeta[]
export declare function getSubApp(key: string): SubAppMeta
export declare function getDevEntry(app: SubAppMeta): string
