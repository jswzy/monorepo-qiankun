import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import { createSubAppConfig } from '@demo/build-config'

export default defineConfig(({ command }) =>
  createSubAppConfig({
    appKey: 'app-order',
    command,
    plugins: [vue2()],
    // 仓库里同时存在 Vue2 与 Vue3，必须锁定从本应用解析，避免公共包里的 .vue 串到 Vue3
    dedupe: ['vue', 'vue-router']
  })
)
