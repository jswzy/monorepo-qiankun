<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SUB_APPS, MAIN_APP } from '@demo/build-config/apps'
import { DemoTag, DemoButton } from '@demo/ui-package/vue3'
import { SHARED_UTILS_VERSION } from '@demo/shared-utils'
import { globalState, microStatus, patchGlobalState } from './micro/register'
import { useHostAuth } from './auth/use-host-auth'

const route = useRoute()
const router = useRouter()

const hostMenus = [
  { path: '/', icon: '🏠', title: '工作台', desc: '主应用自有页面' },
  { path: '/architecture', icon: '🧱', title: '架构与规范', desc: 'monorepo 说明' }
]

const isMicroRoute = computed(() => Boolean(route.meta.micro))
const activeMicro = computed(() => SUB_APPS.find((a) => a.key === route.meta.micro))
const pageTitle = computed(() => (route.meta.title as string) || '工作台')

function go(path: string) {
  console.log('主应用导航到', path, route.path)
  if (route.path === path) return
  patchGlobalState({ lastAction: `主应用导航到 ${path}` })
  router.push(path)
}

const statusText: Record<string, string> = {
  idle: '未加载',
  loading: '加载中',
  mounted: '运行中',
  error: '异常'
}

// 主应用自己的登录态（token 权威来源）：展示 token 片段、提供重新登录 / 退出登录
const { session, loggingIn, maskToken, login, logout } = useHostAuth()
</script>

<template>
  <div class="shell" :class="{ 'is-collapsed': globalState.collapsed }">
    <aside class="shell__aside">
      <div class="brand">
        <span class="brand__logo">◈</span>
        <span v-show="!globalState.collapsed" class="brand__text">
          <b>{{ MAIN_APP.title }}</b>
          <em>qiankun monorepo</em>
        </span>
      </div>

      <nav class="menu">
        <p v-show="!globalState.collapsed" class="menu__group">主应用</p>
        <button
          v-for="item in hostMenus"
          :key="item.path"
          class="menu__item"
          :class="{ 'is-active': route.path === item.path }"
          :title="item.title"
          @click="go(item.path)"
        >
          <span class="menu__icon">{{ item.icon }}</span>
          <span v-show="!globalState.collapsed" class="menu__label">{{ item.title }}</span>
        </button>

        <p v-show="!globalState.collapsed" class="menu__group">微应用（独立部署）</p>
        <button
          v-for="app in SUB_APPS"
          :key="app.key"
          class="menu__item"
          :class="{ 'is-active': route.meta.micro === app.key }"
          :title="`${app.title} · ${app.framework}`"
          @click="go(app.activeRule)"
        >
          <span class="menu__icon">{{ app.icon }}</span>
          <span v-show="!globalState.collapsed" class="menu__label">
            {{ app.title }}
            <em class="menu__fw">{{ app.framework }}</em>
          </span>
          <i
            v-show="!globalState.collapsed"
            class="menu__dot"
            :class="`is-${microStatus[app.key]}`"
            :title="statusText[microStatus[app.key]]"
          />
        </button>
      </nav>

      <div class="aside__foot">
        <button class="collapse-btn" @click="patchGlobalState({ collapsed: !globalState.collapsed })">
          {{ globalState.collapsed ? '»' : '« 收起' }}
        </button>
      </div>
    </aside>

    <div class="shell__main">
      <header class="topbar">
        <div class="topbar__left">
          <h1 class="topbar__title">{{ pageTitle }}</h1>
          <DemoTag v-if="activeMicro" tone="primary" dot>
            {{ activeMicro.framework }} · {{ activeMicro.key }}
          </DemoTag>
          <DemoTag v-else tone="neutral" dot>Vue 3 · 基座</DemoTag>
        </div>
        <div class="topbar__right">
          <span class="topbar__hint">shared-utils v{{ SHARED_UTILS_VERSION }}</span>

          <!-- 登录态：主应用是 token 权威来源，这里展示它签发/下发的 token 片段 -->
          <DemoTag :tone="session ? 'primary' : 'neutral'" dot>
            {{ session ? '已登录 · token ' + maskToken(session.accessToken) : '未登录' }}
          </DemoTag>

          <DemoButton size="small" type="ghost" :disabled="loggingIn" @click="login()">
            {{ loggingIn ? '登录中…' : '重新登录' }}
          </DemoButton>
          <DemoButton
            v-if="session"
            size="small"
            type="ghost"
            @click="logout()"
          >
            退出登录
          </DemoButton>

          <DemoButton size="small" type="ghost" @click="patchGlobalState({ todoCount: globalState.todoCount + 1 })">
            待办 {{ globalState.todoCount }}
          </DemoButton>
          <div class="user">
            <span class="user__avatar">{{ globalState.user.name.slice(0, 1) }}</span>
            <span class="user__meta">
              <b>{{ globalState.user.name }}</b>
              <em>{{ globalState.user.role }}</em>
            </span>
          </div>
        </div>
      </header>

      <section class="content">
        <router-view />
        <!-- 微应用挂载点常驻 DOM，仅切换可见性，避免 qiankun mount 时容器不存在 -->
        <div v-show="isMicroRoute" id="micro-app-viewport" class="micro-viewport" />
      </section>

      <footer class="statusbar">
        <span>最近动作：{{ globalState.lastAction }}</span>
        <span class="statusbar__sep">|</span>
        <span>全局状态由 qiankun initGlobalState 下发，主应用与 3 个微应用实时同步</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--demo-bg);
}

/* ---- 侧边栏 ---- */
.shell__aside {
  width: 232px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: #131a2a;
  color: #c6ccd8;
  transition: width 0.2s ease;
}
.is-collapsed .shell__aside {
  width: 60px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.brand__logo {
  font-size: 20px;
  color: #6f9bff;
  flex: none;
}
.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  overflow: hidden;
}
.brand__text b {
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
}
.brand__text em {
  font-style: normal;
  font-size: 11px;
  color: #6b7488;
  white-space: nowrap;
}

.menu {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
}
.menu__group {
  margin: 14px 8px 6px;
  font-size: 11px;
  color: #5c6478;
  letter-spacing: 0.5px;
}
.menu__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  margin-bottom: 2px;
  border: none;
  background: transparent;
  color: #c6ccd8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;
}
.menu__item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
.menu__item.is-active {
  background: #2f5bd8;
  color: #fff;
}
.menu__icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
  flex: none;
}
.menu__label {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  min-width: 0;
}
.menu__fw {
  font-style: normal;
  font-size: 10px;
  opacity: 0.6;
}
.menu__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: #4b5364;
}
.menu__dot.is-loading {
  background: #d5a028;
}
.menu__dot.is-mounted {
  background: #35c07f;
}
.menu__dot.is-error {
  background: #e0564a;
}

.aside__foot {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}
.collapse-btn {
  width: 100%;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: #98a0b0;
  border-radius: 6px;
  padding: 7px;
  font-size: 12px;
  cursor: pointer;
}
.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* ---- 主区 ---- */
.shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.topbar {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--demo-surface);
  border-bottom: 1px solid var(--demo-border);
}
.topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar__title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: var(--demo-text);
}
.topbar__right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.topbar__hint {
  font-size: 11px;
  color: var(--demo-text-muted);
  font-family: var(--demo-font-mono);
}
.user {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--demo-primary-soft);
  color: var(--demo-primary);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
}
.user__meta {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.user__meta b {
  font-size: 12.5px;
  color: var(--demo-text);
}
.user__meta em {
  font-style: normal;
  font-size: 11px;
  color: var(--demo-text-muted);
}

.content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
.micro-viewport {
  min-height: 100%;
}

.statusbar {
  flex: none;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  background: var(--demo-surface);
  border-top: 1px solid var(--demo-border);
  font-size: 11.5px;
  color: var(--demo-text-muted);
}
.statusbar__sep {
  opacity: 0.4;
}
</style>
