/**
 * 白屏监控（框架无关，可被 vue2 / vue3 / react 子应用复用）
 *
 * 两套判定策略：
 *  1) DOM 元素检测（empty）   —— 定时轮询根节点子元素数量，长时间为 0 判定白屏。
 *  2) 骨架屏 + 超时判定（skeleton）—— X 秒内根节点「仍只有骨架屏」判定白屏。
 *     实现 = MutationObserver（骨架屏一旦消失即解除警报）+ setTimeout 超时判定。
 *
 * 上报：实时上报（优先 navigator.sendBeacon，降级 fetch keepalive），同时把该次
 *      「请求」作为模拟记录写入浏览器 localStorage，便于离线排查与联调（无后端时
 *      即视为模拟请求持久化）。
 */

import { createStorage } from '../storage'

/* ----------------------------- 类型 ----------------------------- */

export type WhiteScreenStrategy = 'empty' | 'skeleton'

/** @demo:monitor 命名空间下持久化的白屏上报记录（即「错误模拟请求」） */
export type WhiteScreenReportStatus = 'mock' | 'sent' | 'failed'

export interface WhiteScreenReport {
  /** 命中策略 */
  strategy: WhiteScreenStrategy
  /** 触发时页面完整地址 */
  url: string
  /** 触发时路由（用于聚类，如 /order/detail/123） */
  route: string
  /** 子应用注册 key，如 app-order */
  appKey: string
  /** 框架，如 Vue 2.7 */
  framework: string
  /** 触发时根节点子元素数 */
  childCount: number
  /** 触发时根节点是否仍存在骨架屏 */
  hasSkeleton: boolean
  userAgent: string
  /** 根节点 HTML 快照（脱敏：仅前 200 字符） */
  snapshot: string
  timestamp: number
  id: string
  /** 上报结果：未配置 endpoint → mock；发送成功 → sent；失败 → failed */
  status: WhiteScreenReportStatus
}

export interface WhiteScreenMonitorOptions {
  /** 被监控的根节点（页面级：传组件根元素） */
  root: HTMLElement
  /** 骨架屏选择器，默认 [data-skeleton] */
  skeletonSelector?: string
  /** 根节点为空持续多久判定白屏（DOM 检测），默认 4000ms */
  emptyThresholdMs?: number
  /** 骨架屏持续多久判定白屏（骨架屏 + 超时），默认 5000ms（即需求中的 X 秒） */
  skeletonTimeoutMs?: number
  /** DOM 检测轮询间隔，默认 500ms */
  pollIntervalMs?: number
  /** 应用元信息（用于上报聚类） */
  appKey?: string
  framework?: string
  route?: string
  /** 实时上报地址；留空则仅落盘 localStorage（模拟请求） */
  endpoint?: string
  /** 命中白屏回调（已落盘 + 已尝试实时上报后的完整记录） */
  onWhiteScreen?: (report: WhiteScreenReport) => void
  /** 命中后立即停止监控，默认 true（避免重复触发） */
  autoStop?: boolean
}

export interface WhiteScreenMonitor {
  start(): void
  stop(): void
  isRunning(): boolean
  isDetected(): boolean
}

export interface ReportOptions {
  endpoint?: string
}

/* ------------------------- localStorage 落盘 ------------------------- */

const monitorStorage = createStorage<{ 'white-screen-queue': WhiteScreenReport[] }>('monitor')
const QUEUE_KEY = 'white-screen-queue' as const
const MAX_QUEUE = 50

/** 读取所有已落盘的白屏模拟请求记录 */
export function getWhiteScreenQueue(): WhiteScreenReport[] {
  return monitorStorage.get(QUEUE_KEY, []) ?? []
}

/** 清空本地模拟请求记录 */
export function clearWhiteScreenQueue(): void {
  monitorStorage.remove(QUEUE_KEY)
}

function pushQueue(report: WhiteScreenReport): void {
  const list = getWhiteScreenQueue()
  list.unshift(report)
  if (list.length > MAX_QUEUE) list.length = MAX_QUEUE
  monitorStorage.set(QUEUE_KEY, list)
}

function updateQueueStatus(id: string, status: WhiteScreenReportStatus): void {
  const list = getWhiteScreenQueue().map((r) => (r.id === id ? { ...r, status } : r))
  monitorStorage.set(QUEUE_KEY, list)
}

/* --------------------------- 实时上报 --------------------------- */

function sendBeacon(endpoint: string, body: string): boolean {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      return navigator.sendBeacon(endpoint, blob)
    }
  } catch {
    /* ignore */
  }
  return false
}

async function sendFetch(endpoint: string, body: string): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 实时上报一次白屏事件。
 * - 无论成败，先把该次「请求」作为模拟记录写入 localStorage（满足离线排查 / 联调）。
 * - 若配置了 endpoint，再尝试 sendBeacon / fetch 实时送达，并回写该记录的状态。
 */
export async function reportWhiteScreen(
  report: WhiteScreenReport,
  options: ReportOptions = {}
): Promise<WhiteScreenReport> {
  const full: WhiteScreenReport = { ...report, status: report.status ?? 'mock' }

  // 1) 先落盘（模拟请求持久化到浏览器 localStorage）
  pushQueue(full)

  // 2) 再尝试实时上报
  const endpoint = options.endpoint ?? ''
  if (endpoint) {
    try {
      const body = JSON.stringify(full)
      const ok = sendBeacon(endpoint, body) || (await sendFetch(endpoint, body))
      full.status = ok ? 'sent' : 'failed'
    } catch {
      full.status = 'failed'
    }
    updateQueueStatus(full.id, full.status)
  }

  return full
}

/* ----------------------------- 监控器 ----------------------------- */

function genId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createWhiteScreenMonitor(options: WhiteScreenMonitorOptions): WhiteScreenMonitor {
  const {
    root,
    skeletonSelector = '[data-skeleton]',
    emptyThresholdMs = 4000,
    skeletonTimeoutMs = 5000,
    pollIntervalMs = 500,
    appKey = '',
    framework = '',
    route = '',
    endpoint,
    onWhiteScreen,
    autoStop = true
  } = options

  let running = false
  let detected = false
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let skeletonTimer: ReturnType<typeof setTimeout> | null = null
  let observer: MutationObserver | null = null
  let emptySince: number | null = null

  const childCount = (): number => (root ? root.children.length : 0)

  const hasSkeleton = (): boolean => {
    try {
      return !!root.querySelector(skeletonSelector)
    } catch {
      return false
    }
  }

  const snapshot = (): string => {
    try {
      return (root.innerHTML || '').slice(0, 200)
    } catch {
      return ''
    }
  }

  const currentUrl = (): string => {
    try {
      return typeof location !== 'undefined' ? location.href : ''
    } catch {
      return ''
    }
  }

  const armSkeletonTimeout = (): void => {
    if (skeletonTimer != null) return
    skeletonTimer = setTimeout(() => {
      skeletonTimer = null
      // 超时到点仍只有骨架屏 → 判定白屏
      if (hasSkeleton()) fire('skeleton')
    }, skeletonTimeoutMs)
  }

  const fire = (strategy: WhiteScreenStrategy): void => {
    if (detected) return
    detected = true
    const report: WhiteScreenReport = {
      strategy,
      url: currentUrl(),
      route,
      appKey,
      framework,
      childCount: childCount(),
      hasSkeleton: hasSkeleton(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      snapshot: snapshot(),
      timestamp: Date.now(),
      id: genId(),
      status: 'mock'
    }
    // 实时上报 + 落盘 localStorage（reportWhiteScreen 内部完成两步）
    void reportWhiteScreen(report, { endpoint }).then((full) => onWhiteScreen?.(full))
    if (autoStop) stop()
  }

  // 综合判定：DOM 检测 + 骨架屏超时判定
  const evaluate = (): void => {
    const count = childCount()
    if (count === 0) {
      if (emptySince == null) emptySince = Date.now()
      if (Date.now() - emptySince >= emptyThresholdMs) {
        fire('empty')
        return
      }
    } else {
      emptySince = null
    }

    // 骨架屏策略：存在骨架屏则（重新）挂起超时判定；骨架屏消失则解除
    if (hasSkeleton()) {
      armSkeletonTimeout()
    } else if (skeletonTimer != null) {
      clearTimeout(skeletonTimer)
      skeletonTimer = null
    }
  }

  const start = (): void => {
    if (running) return
    running = true
    detected = false
    emptySince = null
    // DOM 检测：定时轮询根节点子元素数量
    pollTimer = setInterval(evaluate, pollIntervalMs)
    // 骨架屏策略：MutationObserver 监听骨架屏何时消失（立即解除警报）
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => evaluate())
      observer.observe(root, { childList: true, subtree: true, attributes: true })
    }
    // 立即探一次
    evaluate()
  }

  const stop = (): void => {
    running = false
    if (pollTimer != null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (skeletonTimer != null) {
      clearTimeout(skeletonTimer)
      skeletonTimer = null
    }
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  return {
    start,
    stop,
    isRunning: () => running,
    isDetected: () => detected
  }
}
