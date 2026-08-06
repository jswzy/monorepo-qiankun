# Changesets

本仓库的**边界约束**落地在这里。

## 什么时候需要 changeset

| 场景                                                  | 是否需要 changeset |
| ----------------------------------------------------- | ------------------ |
| 本业务域内的应用引用 `@demo/shared-utils` / `@demo/ui-package` | ❌ 不需要，直接 `workspace:*` 引用源码 |
| 域内公共包改动，只影响本仓库的四个应用                 | ❌ 不需要           |
| **外部业务域**（其他仓库）需要引用本仓库的公共包能力    | ✅ **必须** 走 changeset 发布 npm 包 |

## 发布流程

```bash
pnpm changeset          # 1. 选择要发布的包 + 变更等级(major/minor/patch) + 写变更说明
pnpm version-packages   # 2. 消费 changeset，写入版本号与 CHANGELOG.md
pnpm release            # 3. 构建公共包产物并 changeset publish
```

> `@demo/main-app`、`@demo/app-order`、`@demo/app-product`、`@demo/app-report` 已在 `config.json`
> 的 `ignore` 中排除——它们是独立部署的运行时应用，不是可复用的 npm 包。
