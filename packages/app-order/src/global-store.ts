import { connectGlobalState, type GlobalStoreHandle, type GlobalState } from '@demo/shared-utils'
import type { QiankunProps } from '@demo/shared-utils/qiankun'

/**
 * 本应用持有的全局状态句柄。
 * - 被主应用集成时：由 qiankun 下发的 props 建立通道，与基座实时同步；
 * - 独立启动时：自动降级为本地状态，`pnpm dev:order` 照常可用。
 */
let handle: GlobalStoreHandle = connectGlobalState()

export function initGlobalStore(props?: QiankunProps): GlobalStoreHandle {
  handle.destroy()
  handle = connectGlobalState(props)
  return handle
}

export function globalStore(): GlobalStoreHandle {
  return handle
}

export type { GlobalState, GlobalStoreHandle }
