/**
 * TokenManager —— 统一的登录态管理器（与框架无关，三个子应用共用同一份逻辑）
 *
 * 设计目标（贴近生产）：
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 模式                  │ 谁持有 token 权威      │ token 从哪来          │
 * ├──────────────────────┼───────────────────────┼───────────────────────┤
 * │ qiankun-host（主应用）│ 主应用自己             │ 自己模拟/真实登录获取  │
 * │ qiankun-subapp（子应用）│ 主应用               │ 主应用通过 globalState │
 * │                        │ （被下发，不自己签发） │ 下发，订阅即可拿到      │
 * │ standalone（独立启动）  │ 子应用自己             │ 自己找鉴权源获取        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * 关键能力：
 *  - 统一 API：无论哪种模式，`getAccessToken()` / `isAuthenticated()` / `subscribe()` 都一样；
 *  - 持久化：会话写入 localStorage，刷新页面 / 独立重启不丢登录态；
 *  - 主动刷新：accessToken 临近过期时 `ensureFresh()` 用 refreshToken 静默换发；
 *  - 响应式：`subscribe()` 对外广播变更，Vue 用 reactive、React 用 useSyncExternalStore 绑定。
 *
 * 与 qiankun 的关系（桥接模式，避免重复订阅）：
 *  - 主应用是 token 权威，login() 时通过 `setGlobalState({ auth })` 把 token 广播给所有子应用；
 *  - 子应用不各自订阅 onGlobalStateChange（qiankun 只允许「一个」监听，重复订阅会互相覆盖）；
 *    而是统一在 shared-utils 的 connectGlobalState 唯一监听里，把下发的 auth 桥接进 tokenManager；
 *  - 子应用挂载时若错过广播，可 hydrate() 从同域共享的 localStorage 直接还原 token；
 *  - 子应用发起的 logout() 也会广播 `auth: null`，实现「一处登出，处处登出」。
 */
import { createStorage } from '../storage'
import { isQiankun } from '../qiankun'
import type { GlobalStateChannel } from '../global-state'
import { mockLogin, mockRefresh, type AuthSession, type LoginCredentials } from './mock-auth-server'

/** 当前 token 管理所处的模式 */
export type TokenMode = 'qiankun-host' | 'qiankun-subapp' | 'standalone'

/** 离过期不足该时长就主动刷新（演示用 60s；生产可按令牌 TTL 调整） */
const REFRESH_THRESHOLD_MS = 60_000

/** localStorage 命名空间下的键名 */
const STORAGE_KEY = 'session'

/** 独立启动子应用时的兜底演示凭据（生产应跳转 SSO 登录页，而非自动登录） */
const STANDALONE_DEMO_CREDENTIALS: LoginCredentials = { username: 'standalone-app', password: 'local' }

/**
 * 同 window 内「主应用 ↔ 子应用」登录态实时同步事件。
 *
 * 为什么不用 qiankun 的 globalState 传 auth：
 * qiankun 的 globalState 在子应用挂载时会被重置（auth 字段丢失），且全局只允许一个监听、
 * 重复订阅会互相覆盖，用来传 token 既不可靠又易出错。所以这里改用更稳的同 window 事件——
 * 主应用登录 / 刷新 / 登出时派发，子应用挂载后监听即可拿到最新会话（含 null=登出）。
 * 事件只在同一 window 内传播，正好契合 qiankun「主子应用同 window」的部署形态。
 */
export const AUTH_SYNC_EVENT = '@demo:auth:sync'

type SessionListener = (session: AuthSession | null) => void

class TokenManager {
  private session: AuthSession | null = null
  private mode: TokenMode | null = null
  /** qiankun 注入的全局状态通道（主应用/子应用模式下非空） */
  private channel: GlobalStateChannel | null = null
  private listeners = new Set<SessionListener>()
  private storage = createStorage<{ session: AuthSession | null }>('auth')

  /* ----------------------------- 只读访问（供 UI / 请求层） ----------------------------- */

  /** 当前会话（稳定引用；变更时整体替换，便于 React useSyncExternalStore 做引用比较） */
  getSession(): AuthSession | null {
    return this.session
  }

  /** useSyncExternalStore 需要的快照函数 */
  getSnapshot = (): AuthSession | null => this.session

  getMode(): TokenMode | null {
    return this.mode
  }

  /** 设置运行模式（仅用于标识，不订阅/不广播） */
  setMode(mode: TokenMode): void {
    this.mode = mode
  }

  /**
   * 由 qiankun 全局状态桥接进来的 token。
   * 在 connectGlobalState 的「唯一」onGlobalStateChange 监听里调用，因此不会与子应用
   * 的订阅冲突；这里只更新本地会话、不广播，避免「主应用下发→子应用回传→主应用再下发」的回环。
   *
   * 注意：auth 为 null（登出）时只清空「内存会话」、不删除 localStorage。
   * localStorage 由主应用（token 权威）在登出时统一清理（主子应用同域同 window 共享同一份）。
   * 这样可避免 qiankun 的 fireImmediately 回调携带初始 auth:null 时误删共享 token
   * （那会导致子应用 hydrate 不到 token）。
   */
  setFromGlobal(auth: AuthSession | null): void {
    // 幂等：与当前会话完全相同则直接返回，打破「基座下发 → 子应用回传 → 基座再下发」的回环。
    // （qiankun 同 window 多子应用下，auth 来自共享 localStorage / window 事件 / 基座广播三者之一，
    //  内容相同即视为同一登录态，不应再次触发通知或广播。）
    if (this.isSameSession(auth)) return
    this.session = auth
    if (auth) this.persist()
    this.notify()
    // 注意：这里【不再】调用 emitSync()。
    // setFromGlobal 由 qiankun 的 onGlobalStateChange 桥接触发，本就是「收到广播」的结果；
    // 若再 dispatch 一次同 window 的 AUTH_SYNC_EVENT，会让其它子应用的 handleExternalSync 收到后
    // 再次写回 tokenManager，在「下发→回传→再下发」中被放大成无限回环，最终主线程卡死 / OOM。
    // 跨应用实时同步交由主应用 login/refresh/logout 时统一 emitSync（host 权威），
    // 子应用挂载时 hydrate() 从共享 localStorage 兜底即可。
  }

  /**
   * 从本地存储恢复会话。
   * 关键场景：qiankun 主应用与子应用同域同 window，localStorage 共享。
   * 主应用登录后把 token 写进 localStorage，子应用挂载时即使错过了主应用的广播，
   * 也能直接在这里拿到 token，避免因广播时序问题而拿不到登录态。
   */
  hydrate(): void {
    const restored = this.storage.get(STORAGE_KEY)
    if (restored && restored.expiresAt > Date.now()) {
      this.session = restored
      this.notify()
      this.emitSync()
    }
  }

  /** 是否已登录且未过期 */
  isAuthenticated(): boolean {
    return this.session !== null && this.session.expiresAt > Date.now()
  }

  /* ----------------------------- 同 window 实时同步（事件） ----------------------------- */

  /** 主应用变更登录态后派发，子应用监听后同步（支持 qiankun 同 window 场景） */
  private emitSync(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_SYNC_EVENT, { detail: this.session }))
    }
  }

  /**
   * 订阅主应用派发的登录态事件（仅子应用、且为 qiankun 集成模式时调用）。
   * 主应用登录 / 刷新 / 登出都会派发该事件，子应用据此实时同步，无需依赖不可靠的 globalState auth 字段。
   */
  bindExternalSync(): void {
    if (typeof window === 'undefined' || this.externalBound) return
    this.externalBound = true
    window.addEventListener(AUTH_SYNC_EVENT, this.handleExternalSync)
  }

  private externalBound = false

  /**
   * 接收主应用派发的登录态事件。
   * 注意：这里「直接」写入会话并 notify，但【不再】调用 emitSync，
   * 否则会再次 dispatch 同一事件、触发自身监听形成递归（Maximum call stack size exceeded）。
   * 该事件只应由主应用（token 权威）在 login/refresh/logout 时派发。
   */
  private handleExternalSync = (e: Event): void => {
    const detail = (e as CustomEvent<AuthSession | null>).detail
    // 幂等：与当前会话相同则跳过，避免重复通知 / 重复写存储造成的不必要开销
    if (this.isSameSession(detail)) return
    this.session = detail
    if (detail) this.persist()
    this.notify()
  }

  /**
   * 子应用卸载时调用，移除 window 登录态事件监听，避免监听器随多次挂载/卸载而堆积。
   * 仅当本实例确实绑定过时才移除（externalBound 守卫）。
   */
  destroyExternalSync(): void {
    if (this.externalBound) {
      window.removeEventListener(AUTH_SYNC_EVENT, this.handleExternalSync)
      this.externalBound = false
    }
  }

  /** 取一个可用的访问令牌；已过期返回 null */
  getAccessToken(): string | null {
    return this.isAuthenticated() ? this.session!.accessToken : null
  }

  /**
   * 订阅会话变更，返回取消订阅函数。
   * 用箭头函数属性（而非普通方法）以保证 `this` 始终绑定到单例，
   * 这样 React 的 `useSyncExternalStore(tokenManager.subscribe, ...)` 直接传引用也不会丢失 this。
   */
  subscribe = (listener: SessionListener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /* ----------------------------- 初始化：三种模式 ----------------------------- */

  /**
   * 主应用（基座）初始化：它是 token 的权威来源。
   * 把主应用自己的 global-state channel 接进来，这样 login() 时能通过 setGlobalState
   * 把 token 广播给所有子应用。启动时尝试从本地恢复会话（刷新页面不丢登录态）。
   */
  attachHost(channel: GlobalStateChannel): void {
    this.mode = 'qiankun-host'
    this.channel = channel
    const restored = this.storage.get(STORAGE_KEY)
    if (restored && restored.expiresAt > Date.now()) {
      this.session = restored
      this.notify()
    }
  }

  /**
   * 独立启动的子应用初始化：没有基座下发 token，自己变成 token 权威。
   * 先尝试恢复本地会话；没有或已过期则自助登录（演示用 mock；生产应跳转 SSO）。
   *
   * 注：被 qiankun 集成的子应用「不」在此处订阅 onGlobalStateChange——qiankun 只允许一个全局
   * 状态监听，重复订阅会互相覆盖。子应用改为在 connectGlobalState 的唯一监听里把下发的 auth
   * 桥接进来（见 global-state.ts），并额外用 hydrate() 从共享 localStorage 兜底还原。
   */
  async bootstrapStandalone(credentials: LoginCredentials = STANDALONE_DEMO_CREDENTIALS): Promise<AuthSession> {
    this.mode = 'standalone'
    this.channel = null
    const restored = this.storage.get(STORAGE_KEY)
    if (restored && restored.expiresAt > Date.now()) {
      this.session = restored
      this.notify()
      return this.session!
    }
    return this.login(credentials)
  }

  /* ----------------------------- 写操作 ----------------------------- */

  /** 登录：获取会话、持久化、广播、通知订阅者 */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session = await mockLogin(credentials)
    this.session = session
    this.persist()
    this.broadcast()
    this.notify()
    this.emitSync()
    return session
  }

  /** 用 refreshToken 换发新 accessToken */
  async refresh(): Promise<AuthSession | null> {
    if (!this.session) return null
    const next = await mockRefresh(this.session.refreshToken)
    this.session = next
    this.persist()
    this.broadcast()
    this.notify()
    this.emitSync()
    return next
  }

  /** 登出：清空会话、广播 auth:null（一处登出，处处登出） */
  logout(): void {
    this.session = null
    this.storage.remove(STORAGE_KEY)
    this.broadcast()
    this.notify()
    this.emitSync()
  }

  /**
   * 取一个有效令牌；若临近过期则尝试静默刷新。
   * 请求层发起请求前调用，确保带上的是未过期的 token。
   */
  async ensureFresh(): Promise<string | null> {
    if (!this.session) return null
    if (this.session.expiresAt - Date.now() < REFRESH_THRESHOLD_MS) {
      try {
        await this.refresh()
      } catch {
        // 刷新失败：保留原 token，交给请求层去碰 401，由上层决定跳登录
      }
    }
    return this.getAccessToken()
  }

  /* ----------------------------- 内部辅助 ----------------------------- */

  /** 通过 qiankun global state 广播当前会话：
   *  - 主应用 → 下发给所有子应用；
   *  - 子应用 → 回传（如子应用主动登出，主应用也会同步）。
   */
  private broadcast(): void {
    if (this.channel?.setGlobalState) {
      this.channel.setGlobalState({ auth: this.session } as Record<string, unknown>)
    }
  }

  private persist(): void {
    if (this.session) this.storage.set(STORAGE_KEY, this.session)
    else this.storage.remove(STORAGE_KEY)
  }

  /** 防止监听器内「再触发 notify」造成的同步重入死循环（一旦重入立即返回，避免 Maximum call stack / 卡死） */
  private notifying = false

  private notify(): void {
    if (this.notifying) {
      // 重入保护：监听器回调里又调用了 notify（例如又写了会话）。直接忽略本轮，
      // 因为 listeners 集合在通知期间不会改变，当前会话已是最终态；下一轮顶层 notify 会自然反映新值。
      // 这是最后一道防线 —— 正常幂等保护（isSameSession）生效后不应走到这里。
      console.warn('[@demo/shared-utils] token notify 重入，已忽略（登录态回环保护）')
      return
    }
    this.notifying = true
    try {
      this.listeners.forEach((fn) => {
        try {
          fn(this.session)
        } catch (err) {
          console.error('[@demo/shared-utils] token 监听器抛错：', err, '\n监听器：', fn.toString().slice(0, 300), '\n', (err as Error)?.stack)
        }
      })
    } finally {
      this.notifying = false
    }
  }

  /**
   * 判断传入会话与当前会话是否为「同一份登录态」。
   * 用于桥接 / 外部同步的幂等保护：qiankun 同 window 下，auth 可能经由
   * 共享 localStorage、window 事件、基座广播多渠道到达，内容相同即视为同一态，
   * 直接跳过可避免「通知→写回→再通知」的回环。
   */
  private isSameSession(other: AuthSession | null): boolean {
    const cur = this.session
    if (cur === other) return true
    if (!cur || !other) return false
    return (
      cur.accessToken === other.accessToken &&
      cur.refreshToken === other.refreshToken &&
      cur.expiresAt === other.expiresAt &&
      (cur.user?.id ?? null) === (other.user?.id ?? null)
    )
  }
}

/** 全局单例：所有应用、所有组件共享同一份登录态 */
export const tokenManager = new TokenManager()

/** 便捷判断：当前是否运行在 qiankun 环境（决定走下发还是自助获取） */
export function isQiankunContext(): boolean {
  return isQiankun()
}
