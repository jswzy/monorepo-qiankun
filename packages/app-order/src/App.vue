<template>
  <div class="micro-app micro-app--order">
    <header class="micro-app__banner">
      <div class="micro-app__ident">
        <span class="micro-app__icon">📦</span>
        <div>
          <b>{{ title }}</b>
          <em>@demo/app-order</em>
        </div>
      </div>
      <div class="micro-app__tags">
        <DemoTag tone="warning" dot>{{ framework }}</DemoTag>
        <DemoTag :tone="embedded ? 'primary' : 'success'" dot>
          {{ embedded ? '由 qiankun 基座挂载' : '独立运行模式' }}
        </DemoTag>
        <DemoTag tone="neutral">shared-utils v{{ sharedVersion }}</DemoTag>
        <DemoTag tone="neutral">ui-package v{{ uiVersion }}（{{ uiFlavor }}）</DemoTag>
        <DemoTag :tone="authTokenMask === '未获取' ? 'neutral' : 'primary'" dot>
          共享 token：{{ authTokenMask }}
        </DemoTag>
      </div>
    </header>

    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DemoTag, UI_PACKAGE_VERSION, UI_PACKAGE_FLAVOR } from '@demo/ui-package/vue2'
import { SHARED_UTILS_VERSION } from '@demo/shared-utils'
import { isQiankun } from '@demo/shared-utils/qiankun'
import { globalStateMixin } from './mixins/global-state'

export default defineComponent({
  name: 'AppOrder',
  components: { DemoTag },
  mixins: [globalStateMixin],
  data() {
    return {
      title: __APP_TITLE__,
      framework: __APP_FRAMEWORK__,
      embedded: isQiankun(),
      sharedVersion: SHARED_UTILS_VERSION,
      uiVersion: UI_PACKAGE_VERSION,
      uiFlavor: UI_PACKAGE_FLAVOR
    }
  },
  computed: {
    // 展示主应用下发的（或独立启动时自己获取的）token 片段，证明登录态已共享。
    // auth 来自响应式全局状态 globalState（由 connectGlobalState 桥接主应用下发 / 独立模式由 initAuth 写入）。
    authTokenMask(): string {
      const t = this.globalState?.auth?.accessToken
      return t ? `${t.slice(0, 20)}…${t.slice(-6)}` : '未获取'
    }
  }
})
</script>
