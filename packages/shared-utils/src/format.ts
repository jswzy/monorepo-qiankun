/** 格式化工具 —— 全域统一口径，避免各应用各写一套 */

/** 金额：分位符 + 人民币符号 */
export function formatMoney(value: number, options: { symbol?: boolean; digits?: number } = {}) {
  const { symbol = true, digits = 2 } = options
  if (!Number.isFinite(value)) return symbol ? '¥0.00' : '0.00'
  const text = value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
  return symbol ? `¥${text}` : text
}

/** 大数字缩写：12345 → 1.23万 */
export function formatCompact(value: number) {
  if (!Number.isFinite(value)) return '0'
  if (Math.abs(value) >= 1e8) return `${(value / 1e8).toFixed(2)}亿`
  if (Math.abs(value) >= 1e4) return `${(value / 1e4).toFixed(2)}万`
  return String(value)
}

/** 百分比，带正负号（涨跌用） */
export function formatPercent(value: number, digits = 1) {
  if (!Number.isFinite(value)) return '0.0%'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(digits)}%`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 日期：默认 YYYY-MM-DD HH:mm */
export function formatDate(input: string | number | Date, pattern = 'YYYY-MM-DD HH:mm') {
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '-'
  return pattern
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()))
}

/** 手机号脱敏 */
export function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

/** 涨跌语义色（A 股习惯：涨红跌绿） */
export function trendColor(delta: number) {
  if (delta > 0) return 'var(--demo-up, #c0392b)'
  if (delta < 0) return 'var(--demo-down, #1e8449)'
  return 'var(--demo-text-muted, #8a8f99)'
}
