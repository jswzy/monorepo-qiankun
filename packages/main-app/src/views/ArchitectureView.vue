<script setup lang="ts">
import { DemoCard, DemoTag } from '@demo/ui-package/vue3'
import { SUB_APPS, MAIN_APP } from '@demo/build-config/apps'

const commands = [
  { cmd: 'pnpm install', desc: '根目录一键安装所有包依赖（workspace + catalog 统一版本）' },
  { cmd: 'pnpm dev', desc: '并行启动主应用 + 三个微应用' },
  { cmd: 'pnpm dev:order', desc: '只启动订单中心（Vue 2），独立运行不依赖基座' },
  { cmd: 'pnpm dev:product / dev:report / dev:main', desc: '同理，单独启动任一应用' },
  { cmd: 'pnpm build:order', desc: '只打包订单中心，产出可独立部署的 dist' },
  { cmd: 'pnpm build', desc: '全量打包（拓扑序，先公共包后应用）' },
  { cmd: 'pnpm preview', desc: '按真实部署拓扑预览生产产物（9000 端口）' },
  { cmd: 'pnpm lint / format / typecheck', desc: '全仓统一 ESLint / Prettier / TS 检查' },
  { cmd: 'pnpm check:boundaries', desc: '业务域边界校验（命名空间、依赖方向、workspace 协议）' },
  { cmd: 'pnpm changeset', desc: '公共包对外发布 npm 包的唯一入口' }
]

const packages = [
  { name: '@demo/shared-utils', type: '公共包', desc: '格式化 / 存储 / 请求 / 事件总线 / 全局状态 / qiankun 运行时适配', pub: true },
  { name: '@demo/ui-package', type: '公共包', desc: '一套设计令牌 + Vue3 / Vue2 / React 三套组件实现', pub: true },
  { name: '@demo/build-config', type: '公共包', desc: '微应用注册表 + qiankun Vite 插件 + Vite 配置工厂', pub: true },
  { name: '@demo/main-app', type: '应用', desc: 'Vue 3 基座，负责路由分发、状态下发、样式隔离', pub: false },
  { name: '@demo/app-order', type: '应用', desc: 'Vue 2.7 微应用', pub: false },
  { name: '@demo/app-product', type: '应用', desc: 'Vue 3 微应用', pub: false },
  { name: '@demo/app-report', type: '应用', desc: 'React 18 微应用', pub: false }
]
</script>

<template>
  <div class="demo-stack">
    <DemoCard title="仓库定位" subtitle="开发时同仓管理，运行时多应用独立" accent="#2f5bd8">
      <div class="split">
        <div class="split__col">
          <h4>✅ 开发时（monorepo）</h4>
          <ul>
            <li>一次 <code>pnpm install</code> 装齐全部依赖</li>
            <li>公共包以 <b>源码</b> 形式被引用，改动即时 HMR</li>
            <li>ESLint / Prettier / tsconfig 全仓复用根配置</li>
            <li>统一 <code>@demo/*</code> 命名空间</li>
          </ul>
        </div>
        <div class="split__col">
          <h4>🚀 运行时（微前端）</h4>
          <ul>
            <li>每个应用单独 build、单独部署</li>
            <li>基座通过 qiankun 在浏览器里组合它们</li>
            <li>JS 沙箱 + <code>experimentalStyleIsolation</code> 样式隔离</li>
            <li>任一微应用挂了，不影响其它应用</li>
          </ul>
        </div>
      </div>
    </DemoCard>

    <DemoCard title="包拓扑" subtitle="依赖只能从应用指向公共包，禁止反向" accent="#2f7d5f" flush>
      <table class="demo-table">
        <thead>
          <tr>
            <th style="width: 210px">包名</th>
            <th style="width: 92px">类型</th>
            <th>职责</th>
            <th style="width: 132px">对外发布</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in packages" :key="p.name">
            <td class="is-mono">{{ p.name }}</td>
            <td>
              <DemoTag :tone="p.type === '应用' ? 'primary' : 'success'">{{ p.type }}</DemoTag>
            </td>
            <td>{{ p.desc }}</td>
            <td>
              <span v-if="p.pub" class="demo-muted">需 changeset 发布</span>
              <span v-else class="demo-muted">private，永不发布</span>
            </td>
          </tr>
        </tbody>
      </table>
    </DemoCard>

    <DemoCard title="微应用路由与端口" accent="#e8663d" flush>
      <table class="demo-table">
        <thead>
          <tr>
            <th>应用</th>
            <th>技术栈</th>
            <th>激活规则</th>
            <th>开发端口</th>
            <th>生产资源前缀</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ MAIN_APP.title }}（基座）</td>
            <td>{{ MAIN_APP.framework }}</td>
            <td class="is-mono">—</td>
            <td class="is-mono">{{ MAIN_APP.devPort }}</td>
            <td class="is-mono">{{ MAIN_APP.publicPath }}</td>
          </tr>
          <tr v-for="a in SUB_APPS" :key="a.key">
            <td>{{ a.icon }} {{ a.title }}</td>
            <td>{{ a.framework }}</td>
            <td class="is-mono">{{ a.activeRule }}</td>
            <td class="is-mono">{{ a.devPort }}</td>
            <td class="is-mono">{{ a.publicPath }}</td>
          </tr>
        </tbody>
      </table>
    </DemoCard>

    <DemoCard title="常用命令" accent="#2d6cb5" flush>
      <table class="demo-table">
        <thead>
          <tr>
            <th style="width: 300px">命令</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in commands" :key="c.cmd">
            <td class="is-mono">{{ c.cmd }}</td>
            <td>{{ c.desc }}</td>
          </tr>
        </tbody>
      </table>
    </DemoCard>

    <DemoCard title="边界约束" subtitle="本仓库公共包只服务当前业务域" accent="#c0392b">
      <ol class="rules">
        <li>域内应用引用公共包，一律使用 <code>workspace:*</code> 协议，吃本地源码。</li>
        <li>公共包不得依赖任何应用包，依赖方向单向。</li>
        <li>四个应用均为 <code>private: true</code>，永不发布 npm。</li>
        <li>
          <b>外部业务域</b> 需要复用本仓库能力时，必须执行
          <code>pnpm changeset</code> → <code>pnpm version-packages</code> →
          <code>pnpm release</code>，以 npm 包形式对外供给；禁止跨仓库直接引用源码或相对路径。
        </li>
        <li>以上规则由 <code>pnpm check:boundaries</code> 在 CI 中强制校验。</li>
      </ol>
    </DemoCard>
  </div>
</template>

<style scoped>
.split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
.split__col h4 {
  margin: 0 0 8px;
  font-size: 13px;
}
.split__col ul {
  margin: 0;
  padding-left: 18px;
  color: var(--demo-text-secondary);
  font-size: 13px;
  line-height: 1.9;
}
.rules {
  margin: 0;
  padding-left: 18px;
  color: var(--demo-text-secondary);
  font-size: 13px;
  line-height: 1.95;
}
code {
  font-family: var(--demo-font-mono);
  background: var(--demo-surface-sunken);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
}
</style>
