import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createSubAppConfig } from '@demo/build-config'

export default defineConfig(({ command }) =>
  createSubAppConfig({
    appKey: 'app-report',
    command,
    plugins: [react()],
    dedupe: ['react', 'react-dom']
  })
)
