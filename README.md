# 域内工作台 · qiankun 微前端 Monorepo

基于 **qiankun** 的微前端单体仓库（monorepo）：一个 **Vue 3 基座** 管理三个技术栈各异的微应用，并沉淀可复用的域内公共包。

| 角色 | 包名 | 框架 | 端口 | activeRule |
| --- | --- | --- | --- | --- |
| 基座（主应用） | `@demo/main-app` | Vue 3 | 8000 | — |
| 微应用 | `@demo/app-order` | Vue 2.7 | 8001 | `/order` |
| 微应用 | `@demo/app-product` | Vue 3 | 8002 | `/product` |
| 微应用 | `@demo/app-report` | React 18 | 8003 | `/report` |
| 公共包 | `@demo/shared-utils` | — | — | 业务域公共工具 / 类型 / mock 数据 |
| 公共包 | `@demo/ui-package` | 跨框架 | — | 跨技术栈 UI 组件（含设计令牌） |
| 构建包 | `@demo/build-config` | — | — | 共享 Vite 配置 / qiankun 适配 / 应用注册表 |

---

## 一、开箱即用的验收能力

### ✅ 基础能力

| 能力 | 做法 | 验证 |
| --- | --- | --- |
| 根目录一键装包 | `pnpm install` 走 workspace，自动链接所有包 | `pnpm install` |
| 子应用引用域内公共包 | 子应用 `package.json` 里 `workspace:*` 指向 `@demo/shared-utils`、`@demo/ui-package` | 改公共包 → 子应用 **HMR 实时生效** |
| 修改公共组件 / 工具热更新 | `vite.config` 中 `optimizeDeps.exclude` 让内部包保持**源码形态**参与编译 | 改 `ui-package` 的 `DemoButton`，三个子应用同步热更 |
| 单独启动单个应用 | `pnpm dev:order` 等（仅启动目标子应用的 dev server） | `pnpm dev:order` |
| 单独打包单个应用 | `pnpm build:order` 等（仅构建目标子应用，产物可独立部署） | `pnpm build:order` |
| 一键启动全部 | `pnpm dev`（基座 + 三个微应用并行） | `pnpm dev` |

### ✅ TS 能力

- 公共包 `src/index.ts` 直接作为入口（`package.json` `exports` 指向 `./src`），无需预构建即可导出**完整类型**。
- 子应用通过 `workspace:*` 链接到源码，**自动获得 TS 提示与跳转**。
- 所有 `packages/*/tsconfig.json` 继承根目录 `tsconfig.base.json`，**无重复配置**。

### ✅ 工程规范

- 统一 `eslint` / `prettier`：`packages/*` 复用根 `.eslintrc.cjs` / `.prettierrc.json`。
- 包命名统一为 `@demo/xxx` 内部命名空间（由 `pnpm check:boundaries` 强约束）。

### ✅ 区分关键特征

- `packages` 下每个 app **可独立打包、独立部署**（生产产物为各自静态资源）。
- 运行时是多个独立应用（qiankun 微应用）；开发时统一在 monorepo 管理。
- 应用注册表 `packages/build-config/src/apps.mjs` 为**唯一数据源**：端口、路由前缀、部署路径全从这里读，杜绝多处硬编码。

### ✅ 边界约束

> 本仓库公共包只供当前业务域使用。
> 若外部其他业务域需要复用本仓库能力，**必须执行 changeset 发布 npm 包**，禁止跨仓库源码引用。

对应约束由 `pnpm check:boundaries` 自动校验：

1. 所有包必须使用 `@demo/` 命名空间；
2. 应用（`main-app` / `app-*`）必须 `private: true`，禁止发布；
3. 公共包禁止反向依赖任何应用；
4. 域内互相引用必须使用 `workspace:` 协议（确保吃的是本地源码）；
5. 公共包需声明 `publishConfig`，以便 changeset 发布。

---

## 二、目录结构

```
monorepo-qiankun/
├── pnpm-workspace.yaml        # workspace + 版本 catalog（vue2 / 通用 两档）
├── tsconfig.base.json         # 全仓 TS 基座（strict）
├── .eslintrc.cjs / .prettierrc.json
├── .changeset/               # changeset 发布配置（公共包可发布、应用被忽略）
├── scripts/
│   ├── check-boundaries.mjs  # 业务域边界约束校验
│   ├── serve-dist.mjs        # 生产预览：模拟真实部署拓扑（基座在 /，子应用在 /app-xxx/）
│   └── clean.mjs
└── packages/
    ├── build-config/         # ESM 共享构建包：createSubAppConfig / createMainAppConfig / qiankunSubApp / apps
    ├── shared-utils/         # 公共工具 + 类型 + mock 数据（src 直连）
    ├── ui-package/           # 跨框架组件（./styles.css、./vue3、./vue2、./react 子路径导出）
    ├── main-app/             # Vue 3 基座
    ├── app-order/            # Vue 2.7 微应用
    ├── app-product/          # Vue 3 微应用
    └── app-report/           # React 18 微应用
```

---

## 三、快速开始

```bash
# 1. 安装（Node >= 18.18，pnpm >= 9）
pnpm install

# 2. 一键启动全部（基座 8000 + 三个微应用并行）
pnpm dev
#   浏览器打开 http://localhost:8000，左侧菜单切换微应用

# 3. 仅启动 / 构建某个微应用
pnpm dev:order      # 订单中心（Vue2.7）独立 dev
pnpm dev:report     # 数据报表（React18）独立 dev
pnpm build:order    # 仅打包订单中心，产物在 packages/app-order/dist
```

---

## 四、常用脚本（根目录）

| 命令 | 说明 |
| --- | --- |
| `pnpm install` | 安装全部 workspace 依赖（一键） |
| `pnpm dev` | 并行启动基座 + 全部微应用 |
| `pnpm dev:main` / `dev:order` / `dev:product` / `dev:report` | 单独启动某个应用 |
| `pnpm build` | 全量构建（每个 app 各自产物） |
| `pnpm build:main` / `build:order` / `build:product` / `build:report` | 单独构建某个应用 |
| `pnpm build:packages` | 仅构建公共包（shared-utils / ui-package），用于发布 |
| `pnpm preview` | 启动 `serve-dist.mjs`，用生产产物模拟真实部署拓扑 |
| `pnpm lint` / `pnpm lint:fix` | 统一 ESLint 检查 / 自动修复 |
| `pnpm format` / `format:check` | Prettier 格式化 / 校验 |
| `pnpm typecheck` | 全部包 `tsc --noEmit` 类型检查 |
| `pnpm check:boundaries` | 业务域边界约束校验 |
| `pnpm verify` | 一键：`check:boundaries` → `lint` → `typecheck` → `build` |
| `pnpm changeset` | 新增「待发布变更」记录 |
| `pnpm version-packages` | 按 changeset 计算并改写版本号 |
| `pnpm release` | 构建公共包并 `changeset publish` 发布到 npm |

---

## 五、关键机制说明（写给想深究的人）

### 1. qiankun × Vite 5 生命周期适配

Vite 产物是 `<script type="module">`，qiankun 无法直接读取其 ESM `export`，且 ESM 不在 qiankun 沙箱内、读不到 `__POWERED_BY_QIANKUN__`。

解决方式：`@demo/build-config` 的 `qiankunSubApp` 插件在 HTML `<head>` 最前面注入一段 **classic script**（运行在沙箱内）：

- 从沙箱 `window` 读出 qiankun 握手变量；
- 经 `document.defaultView` 把上下文写入**真实 window**，供随后原生执行的 ESM 入口读取；
- 先把「Promise 延迟兑现」的生命周期挂到 `window[appName]`，等子应用 ESM 入口调用 `renderWithQiankun()` 时再兑现，解决**时序问题**。

子应用侧配套 API 在 `@demo/shared-utils/qiankun`：`renderWithQiankun` / `isQiankun` / `resolveMountRoot` / `resolveRouterBase`。

### 2. 改公共包 → 子应用热更新

`@demo/shared-utils`、`@demo/ui-package` 的 `package.json` 直接把入口指向 `src/`，且 `vite.config` 里 `optimizeDeps.exclude` 排除它们。于是 Vite 把这些包当作**源码**编译，编辑即触发 HMR，类型也实时同步。

### 3. Vue 2.7 与 Vue 3 共存

- `pnpm-workspace.yaml` 用 `catalog`（通用）与 `catalogs.vue2`（Vue2 技术栈）两档版本；
- 子应用 `vite.config` 通过 `resolve.dedupe: ['vue', 'vue-router', 'react', 'react-dom']` 强制各应用锁定自己的框架版本。

### 4. 独立部署 vs 基座集成

- 基座 `registerMicroApps` 用 `activeRule: '/order' | '/product' | '/report'`；
- 子应用路由 `base`：被集成时用 `activeRule`，独立运行时退回 `/`（见 `resolveRouterBase`）；
- 生产资源前缀：`/app-order/`、`/app-product/`、`/app-report/`（可用环境变量 `APP_PUBLIC_PATH` 覆盖为 CDN 绝对地址）；
- `scripts/serve-dist.mjs` 以「基座在 `/`、子应用在 `/app-xxx/`」的拓扑启动预览，最接近真实部署。

### 5. 跨框架 UI 组件

`@demo/ui-package` 同一份设计令牌（`src/styles/index.css`）被 Vue3 / Vue2 / React 三套组件复用，保证视觉一致：

```ts
// React
import { DemoButton, DemoCard, DemoTag, DemoStat } from '@demo/ui-package/react'
// Vue 3
import { DemoButton, DemoCard } from '@demo/ui-package/vue3'
// Vue 2.7
import { DemoButton, DemoCard } from '@demo/ui-package/vue2'
// 设计令牌 + 基础样式（任意框架）
import '@demo/ui-package/styles.css'
```

---

## 六、跨应用全局状态

主应用用 `qiankun.initGlobalState` 下发全局状态；三个微应用通过 `@demo/shared-utils` 的 `connectGlobalState` 订阅 / 改写（非 qiankun 环境下自动回退为本地状态），实现「主应用改一下，所有微应用实时同步」。

```ts
// 任意子应用
import { connectGlobalState, DEFAULT_GLOBAL_STATE } from '@demo/shared-utils'
const store = connectGlobalState(props) // props 由 qiankun 注入
store.subscribe((next) => console.log('全局状态变了', next))
store.setState({ todoCount: 1 })
```

React 侧额外封装了 `useGlobalState()` hook（见 `packages/app-report/src/global-store.ts`）。

---

## 七、发布公共包（边界约束的出口）

当外部业务域需要复用 `@demo/shared-utils` / `@demo/ui-package` 时，**不要跨仓库引用源码**，而是走 changeset：

```bash
pnpm changeset          # 选择要发布的包 + 版本 bump 类型，写入 .changeset/*.md
pnpm version-packages   # 改写版本号、更新 CHANGELOG
pnpm release            # 构建公共包并 publish 到 npm registry
```

应用（`main-app` / `app-*`）已在 `.changeset/config.json` 的 `ignore` 列表中被排除，不会被发布。

---

## 八、环境要求

- Node `>= 18.18.0`
- pnpm `>= 9`（本仓库 `package.json` 已用 `packageManager` 锁定 `pnpm@10.32.1`）
- 包管理统一使用 pnpm（`.npmrc` 已开启 workspace 链接）
