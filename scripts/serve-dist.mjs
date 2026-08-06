#!/usr/bin/env node
/**
 * 生产产物一体化预览（`pnpm preview`）
 *
 * 模拟真实部署拓扑：主应用部署在域名根路径，三个子应用各自独立部署到
 * /app-order/、/app-product/、/app-report/ 子路径。
 * 这正是「独立打包 + 独立部署 + 运行时由 qiankun 组合」的最小验证环境。
 */
import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, extname, dirname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SUB_APPS, MAIN_APP } from '../packages/build-config/src/apps.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT || 9000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8'
}

/** 挂载表：URL 前缀 -> dist 目录 */
const mounts = [
  ...SUB_APPS.map((app) => ({
    prefix: app.publicPath,
    dir: join(ROOT, 'packages', app.key, 'dist'),
    label: `${app.title}（${app.framework}）`
  })),
  { prefix: '/', dir: join(ROOT, 'packages', 'main-app', 'dist'), label: '主应用（Vue 3）' }
]

const missing = mounts.filter((m) => !existsSync(join(m.dir, 'index.html')))
if (missing.length) {
  console.error('❌ 以下应用尚未构建，请先执行 pnpm build：')
  missing.forEach((m) => console.error('   - ' + m.label + ' → ' + m.dir))
  process.exit(1)
}

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/\\/g, '/')
  for (const mount of mounts) {
    if (mount.prefix !== '/' && !clean.startsWith(mount.prefix)) continue
    const rel = mount.prefix === '/' ? clean.slice(1) : clean.slice(mount.prefix.length)
    const candidate = join(mount.dir, rel)
    if (candidate.startsWith(mount.dir) && existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate
    }
    // SPA fallback
    return join(mount.dir, 'index.html')
  }
  return join(mounts.at(-1).dir, 'index.html')
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url || '/')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream')
    createReadStream(file)
      .on('error', () => {
        res.statusCode = 404
        res.end('Not Found')
      })
      .pipe(res)
  })
  .listen(PORT, () => {
    console.log('\n🚀 生产产物预览已启动: http://localhost:' + PORT + '\n')
    console.log('   /                     → 主应用 ' + MAIN_APP.title + '（Vue 3 基座）')
    SUB_APPS.forEach((a) => {
      console.log(
        `   ${a.publicPath.padEnd(22)}→ ${a.title}（${a.framework}）独立产物，路由前缀 ${a.activeRule}`
      )
    })
    console.log('')
  })
