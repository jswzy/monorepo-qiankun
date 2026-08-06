<script setup lang="ts">
import { DemoTag, UI_PACKAGE_VERSION, UI_PACKAGE_FLAVOR } from '@demo/ui-package/vue3'
import { SHARED_UTILS_VERSION } from '@demo/shared-utils'
import { isQiankun } from '@demo/shared-utils/qiankun'

// 构建期注入的常量必须在 script 里取值（模板表达式不参与 define 替换）
const title = __APP_TITLE__
const framework = __APP_FRAMEWORK__
const embedded = isQiankun()
</script>

<template>
  <div class="micro-app micro-app--product">
    <header class="micro-app__banner">
      <div class="micro-app__ident">
        <span class="micro-app__icon">🧩</span>
        <div>
          <b>{{ title }}</b>
          <em>@demo/app-product</em>
        </div>
      </div>
      <div class="micro-app__tags">
        <DemoTag tone="success" dot>{{ framework }}</DemoTag>
        <DemoTag :tone="embedded ? 'primary' : 'success'" dot>
          {{ embedded ? '由 qiankun 基座挂载' : '独立运行模式' }}
        </DemoTag>
        <DemoTag tone="neutral">shared-utils v{{ SHARED_UTILS_VERSION }}</DemoTag>
        <DemoTag tone="neutral">
          ui-package v{{ UI_PACKAGE_VERSION }}（{{ UI_PACKAGE_FLAVOR }}）
        </DemoTag>
      </div>
    </header>

    <router-view />
  </div>
</template>
