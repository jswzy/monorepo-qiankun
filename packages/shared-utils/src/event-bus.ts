/**
 * 类型安全的跨应用事件总线。
 * 挂在真实 window 上，主应用与所有微应用共用同一个实例。
 */

export interface DemoEventMap {
  'order:created': { id: string; amount: number }
  'product:updated': { id: string; name: string }
  'app:navigate': { to: string; from: string }
  'theme:change': { theme: 'light' | 'dark' }
}

type Handler<K extends keyof DemoEventMap> = (payload: DemoEventMap[K]) => void

export interface EventBus {
  on<K extends keyof DemoEventMap>(type: K, handler: Handler<K>): () => void
  once<K extends keyof DemoEventMap>(type: K, handler: Handler<K>): () => void
  off<K extends keyof DemoEventMap>(type: K, handler: Handler<K>): void
  emit<K extends keyof DemoEventMap>(type: K, payload: DemoEventMap[K]): void
  clear(): void
}

const BUS_KEY = '__DEMO_EVENT_BUS__'

function createBus(): EventBus {
  const map = new Map<string, Set<(p: never) => void>>()

  const bus: EventBus = {
    on(type, handler) {
      const set = map.get(type as string) ?? new Set()
      set.add(handler as (p: never) => void)
      map.set(type as string, set)
      return () => bus.off(type, handler)
    },
    once(type, handler) {
      const wrapped = ((payload: DemoEventMap[typeof type]) => {
        bus.off(type, wrapped)
        handler(payload)
      }) as typeof handler
      return bus.on(type, wrapped)
    },
    off(type, handler) {
      map.get(type as string)?.delete(handler as (p: never) => void)
    },
    emit(type, payload) {
      map.get(type as string)?.forEach((fn) => {
        try {
          ;(fn as (p: DemoEventMap[typeof type]) => void)(payload)
        } catch (err) {
          console.error(`[@demo/shared-utils] 事件 ${String(type)} 的监听器抛错：`, err)
        }
      })
    },
    clear() {
      map.clear()
    }
  }
  return bus
}

/** 全局单例（跨微应用共享） */
export const eventBus: EventBus = (() => {
  const host = globalThis as unknown as Record<string, EventBus | undefined>
  if (!host[BUS_KEY]) host[BUS_KEY] = createBus()
  return host[BUS_KEY] as EventBus
})()
