import { useEffect, useState } from 'react'
import {
  connectGlobalState,
  DEFAULT_GLOBAL_STATE,
  type GlobalState,
  type GlobalStoreHandle
} from '@demo/shared-utils'
import type { QiankunProps } from '@demo/shared-utils/qiankun'

let handle: GlobalStoreHandle = connectGlobalState()

export function initGlobalStore(props?: QiankunProps) {
  handle.destroy()
  handle = connectGlobalState(props)
  return handle
}

export function disposeGlobalStore() {
  handle.destroy()
  handle = connectGlobalState()
}

export function patchGlobalState(patch: Partial<GlobalState>, opts?: { broadcast?: boolean }) {
  handle.setState(patch, opts)
}

export function isStateConnected() {
  return handle.connected
}

/** React 侧订阅全局状态的 hook */
export function useGlobalState(): GlobalState {
  const [state, setState] = useState<GlobalState>({ ...DEFAULT_GLOBAL_STATE, ...handle.getState() })

  useEffect(() => {
    setState({ ...handle.getState() })
    return handle.subscribe((next) => setState({ ...next }))
  }, [])

  return state
}
