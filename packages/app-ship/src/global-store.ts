import { reactive } from 'vue'
import {
  connectGlobalState,
  DEFAULT_GLOBAL_STATE,
  type GlobalState,
  type GlobalStoreHandle
} from '@demo/shared-utils'
import type { QiankunProps } from '@demo/shared-utils/qiankun'

/** 响应式镜像，供组件直接使用 */
export const globalState = reactive<GlobalState>({ ...DEFAULT_GLOBAL_STATE })

let handle: GlobalStoreHandle | null = null
let unsubscribe: (() => void) | null = null

export function initGlobalStore(props?: QiankunProps) {
  disposeGlobalStore()
  handle = connectGlobalState(props)
  Object.assign(globalState, handle.getState())
  unsubscribe = handle.subscribe((next) => Object.assign(globalState, next))
  return handle
}

export function patchGlobalState(patch: Partial<GlobalState>, opts?: { broadcast?: boolean }) {
  if (handle) handle.setState(patch, opts)
  else Object.assign(globalState, patch)
}

export function disposeGlobalStore() {
  unsubscribe?.()
  unsubscribe = null
  handle?.destroy()
  handle = null
}
