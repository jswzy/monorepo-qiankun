/** 带命名空间与类型约束的本地存储，防止多个微应用互相覆盖 key */

export interface TypedStorage<T extends Record<string, unknown>> {
  get<K extends keyof T>(key: K, fallback?: T[K]): T[K] | undefined
  set<K extends keyof T>(key: K, value: T[K]): void
  remove<K extends keyof T>(key: K): void
  clear(): void
  keys(): string[]
}

export function createStorage<T extends Record<string, unknown>>(
  namespace: string,
  driver: Storage = globalThis.localStorage
): TypedStorage<T> {
  const prefix = `@demo:${namespace}:`
  const full = (key: PropertyKey) => `${prefix}${String(key)}`

  return {
    get<K extends keyof T>(key: K, fallback?: T[K]): T[K] | undefined {
      try {
        const raw = driver?.getItem(full(key))
        return raw === null || raw === undefined ? fallback : (JSON.parse(raw) as T[K])
      } catch {
        return fallback
      }
    },
    set(key, value) {
      try {
        driver?.setItem(full(key), JSON.stringify(value))
      } catch {
        /* 隐私模式下 setItem 会抛错，静默降级 */
      }
    },
    remove(key) {
      driver?.removeItem(full(key))
    },
    clear() {
      if (!driver) return
      Object.keys(driver)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => driver.removeItem(k))
    },
    keys() {
      if (!driver) return []
      return Object.keys(driver)
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length))
    }
  }
}
