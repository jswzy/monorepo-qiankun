#!/usr/bin/env node
/**
 * 业务域边界约束校验（`pnpm check:boundaries`）
 *
 * 本仓库的公共包只服务当前业务域，规则：
 *  1. 所有包必须使用 @demo/ 内部命名空间
 *  2. 应用（main-app / app-*）必须 private:true，禁止被 npm 发布
 *  3. 公共包（shared-utils / ui-package / build-config）禁止反向依赖任何应用
 *  4. 域内互相引用必须使用 workspace: 协议（保证吃的是本地源码而不是registry上的同名包）
 *  5. 想让「外部业务域」使用公共包能力 → 只能走 changeset 发布，不能直接跨仓库相对路径引用
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PKG_DIR = join(ROOT, 'packages')
const NS = '@demo/'
const APP_PATTERN = /^@demo\/(main-app|app-.+)$/

const errors = []
const warnings = []

const pkgs = readdirSync(PKG_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(PKG_DIR, d.name, 'package.json')))
  .map((d) => {
    const dir = join(PKG_DIR, d.name)
    return { dir: d.name, json: JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) }
  })

const names = new Set(pkgs.map((p) => p.json.name))
const isApp = (name) => APP_PATTERN.test(name)

for (const { dir, json } of pkgs) {
  const name = json.name

  // 1. 命名空间
  if (!name?.startsWith(NS)) {
    errors.push(`[命名空间] packages/${dir} 的包名 "${name}" 未使用 ${NS} 内部命名空间`)
  }

  // 2. 应用必须 private
  if (isApp(name) && json.private !== true) {
    errors.push(`[发布边界] 应用 ${name} 必须声明 "private": true，应用不允许发布为 npm 包`)
  }

  // 3 & 4. 依赖检查
  const deps = { ...json.dependencies, ...json.devDependencies, ...json.peerDependencies }
  for (const [depName, range] of Object.entries(deps)) {
    if (!depName.startsWith(NS)) continue

    if (!names.has(depName)) {
      errors.push(`[跨域引用] ${name} 依赖了不存在于本仓库的 ${depName}`)
      continue
    }
    if (!String(range).startsWith('workspace:')) {
      errors.push(
        `[协议] ${name} -> ${depName} 必须使用 workspace: 协议，当前为 "${range}"。` +
          `域内引用一律吃本地源码。`
      )
    }
    if (!isApp(name) && isApp(depName)) {
      errors.push(`[方向] 公共包 ${name} 不允许依赖应用 ${depName}（依赖只能从应用指向公共包）`)
    }
  }

  // 5. 公共包应声明 publishConfig，便于 changeset 发布
  if (!isApp(name) && json.private !== true && !json.publishConfig) {
    warnings.push(`[发布] 公共包 ${name} 建议补充 publishConfig（registry / access）`)
  }
}

if (warnings.length) {
  console.warn('\n⚠️  边界警告：')
  warnings.forEach((w) => console.warn('   ' + w))
}

if (errors.length) {
  console.error('\n❌ 业务域边界校验未通过：')
  errors.forEach((e) => console.error('   ' + e))
  console.error(
    '\n提示：若外部业务域需要复用本仓库能力，请执行 `pnpm changeset` 发布 npm 包，' +
      '而不是跨仓库直接引用源码。\n'
  )
  process.exit(1)
}

console.log(`✅ 业务域边界校验通过（共 ${pkgs.length} 个包）`)
