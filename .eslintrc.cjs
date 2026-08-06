/**
 * 全仓唯一的 ESLint 配置。
 * 所有 package 都不再写自己的 .eslintrc，通过 overrides 按目录切换 parser / 规则集。
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  // 构建期由 @demo/build-config 注入的全局量（vite define），ESLint 需显式声明
  globals: {
    __APP_KEY__: 'readonly',
    __APP_TITLE__: 'readonly',
    __APP_FRAMEWORK__: 'readonly',
    __APP_ACTIVE_RULE__: 'readonly',
    __QIANKUN_APP_NAME__: 'readonly',
    __POWERED_BY_QIANKUN__: 'readonly',
    __INJECTED_PUBLIC_PATH_BY_QIANKUN__: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.d.ts'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'warn',
    'no-unused-vars': 'off'
  },
  overrides: [
    /* ---------------- TS / TSX 通用 ---------------- */
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
      parser: '@typescript-eslint/parser',
      parserOptions: { ecmaFeatures: { jsx: true } },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/consistent-type-imports': [
          'warn',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
        ],
        '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-expect-error': 'allow-with-description' }]
      }
    },

    /* ---------------- Vue3：主应用 / app-product / ui-package 的 vue3 组件 ---------------- */
    {
      files: [
        'packages/main-app/**/*.vue',
        'packages/app-product/**/*.vue',
        'packages/ui-package/src/vue3/**/*.vue'
      ],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:vue/vue3-recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        'vue/multi-word-component-names': 'off',
        'vue/require-default-prop': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
      }
    },

    /* ---------------- Vue2：app-order / ui-package 的 vue2 组件 ---------------- */
    {
      files: ['packages/app-order/**/*.vue', 'packages/ui-package/src/vue2/**/*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:vue/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        'vue/multi-word-component-names': 'off',
        'vue/require-default-prop': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
      }
    },

    /* ---------------- React：app-report / ui-package 的 react 组件 ---------------- */
    {
      files: ['packages/app-report/**/*.{ts,tsx}', 'packages/ui-package/src/react/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: { ecmaFeatures: { jsx: true } },
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      extends: [
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:@typescript-eslint/recommended',
        'prettier'
      ],
      settings: { react: { version: 'detect' } },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/prop-types': 'off'
      }
    },

    /* ---------------- 构建脚本 / 配置文件 ---------------- */
    {
      files: ['**/*.config.{js,mjs,cjs,ts}', 'scripts/**/*.mjs', 'packages/build-config/**/*.mjs'],
      env: { node: true },
      rules: {
        'no-console': 'off'
      }
    }
  ]
}
