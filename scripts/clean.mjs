#!/usr/bin/env node
/** 清理所有包的构建产物与缓存（不动 node_modules） */
import { rmSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PKG_DIR = join(ROOT, 'packages')

const targets = ['dist', 'node_modules/.vite', '.eslintcache', 'tsconfig.tsbuildinfo']

for (const pkg of readdirSync(PKG_DIR)) {
  for (const t of targets) {
    const p = join(PKG_DIR, pkg, t)
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true })
      console.log('removed', `packages/${pkg}/${t}`)
    }
  }
}
for (const t of ['node_modules/.cache', '.eslintcache']) {
  const p = join(ROOT, t)
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true })
    console.log('removed', t)
  }
}
console.log('✅ clean done')
