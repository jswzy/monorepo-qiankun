import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createMainAppConfig } from '@demo/build-config'

// 主应用只声明「自己的框架插件」，其余（端口 / base / 源码直连 / fs.allow）由域内共享配置统一提供
export default defineConfig(({ command }) =>
  createMainAppConfig({
    command,
    plugins: [vue()],
    dedupe: ['vue', 'vue-router']
  })
)
