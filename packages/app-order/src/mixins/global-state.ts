import { globalStore, type GlobalState } from '../global-store'

/** Vue 2 混入：把跨应用全局状态接进组件的响应式系统 */
export const globalStateMixin = {
  data() {
    return {
      globalState: { ...globalStore().getState() } as GlobalState,
      /** 是否接上了主应用下发的状态通道 */
      stateConnected: globalStore().connected
    }
  },
  created(this: Record<string, unknown> & { globalState: GlobalState }) {
    const self = this as unknown as {
      globalState: GlobalState
      __unsubscribe__?: () => void
    }
    self.__unsubscribe__ = globalStore().subscribe((next) => {
      self.globalState = { ...next }
    })
  },
  beforeDestroy(this: unknown) {
    const self = this as { __unsubscribe__?: () => void }
    self.__unsubscribe__?.()
  }
}
