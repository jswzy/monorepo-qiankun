import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSubAppConfig } from '@demo/build-config'

export default defineConfig(({ command }) =>
  createSubAppConfig({
    appKey: 'app-product',
    command,
    plugins: [vue()],
    dedupe: ['vue', 'vue-router']
  })
)
