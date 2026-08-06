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
  }
})
</script>
