import type { PageResult } from './types'

/**
 * 统一请求层（示例实现）
 * 真实项目里这里会是 axios/fetch 封装 + 统一鉴权 + 错误码约定，
 * 所有微应用共用一套，避免每个应用重复造轮子。
 */

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  baseURL?: string
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
  timeout?: number
}

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string
  ) {
    super(message)
    this.name = 'RequestError'
  }
}

let defaultBaseURL = '/api'
/** 由主应用在启动时统一设置一次 */
export function setBaseURL(url: string) {
  defaultBaseURL = url
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { baseURL = defaultBaseURL, params, body, timeout = 15000, headers, ...rest } = options

  const query = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''

  const fullUrl = /^https?:/.test(url) ? url + query : `${baseURL}${url}${query}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(fullUrl, {
      ...rest,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    if (!res.ok) throw new RequestError(`请求失败 ${res.status}`, res.status, fullUrl)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

/** 演示用：把本地数据包装成带延迟的分页响应，模拟真实接口 */
export function mockPage<T>(list: T[], page = 1, pageSize = 10, delay = 260): Promise<PageResult<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        list: list.slice((page - 1) * pageSize, page * pageSize),
        total: list.length,
        page,
        pageSize
      })
    }, delay)
  })
}
