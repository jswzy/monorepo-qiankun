/// <reference types="vite/client" />

// 说明：这里刻意不声明 `declare module '*.vue'`。
// vue-tsc 会直接解析 .vue 源码得到精确的 props / emits 类型，
// 包括从 @demo/ui-package/vue3 引入的组件——这正是「公共包导出完整类型」的体现。
