import type { ReactNode } from 'react'
import { formatPercent, formatCompact } from '@demo/shared-utils'

export interface DemoStatProps {
  label: string
  value: number
  unit?: string
  /** 环比，正数为涨（红），负数为跌（绿） */
  delta?: number
  /** 大数字是否缩写为「万/亿」 */
  compact?: boolean
  labelExtra?: ReactNode
}

export function DemoStat({
  label,
  value,
  unit = '',
  delta = 0,
  compact = true,
  labelExtra
}: DemoStatProps) {
  const display = compact ? formatCompact(value) : value.toLocaleString('zh-CN')
  const deltaClass = delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''

  return (
    <div className="demo-stat">
      <div className="demo-stat__label">
        {label}
        {labelExtra}
      </div>
      <div className="demo-stat__value">
        {display}
        {unit && <span className="demo-stat__unit">{unit}</span>}
      </div>
      <div className={`demo-stat__delta ${deltaClass}`}>环比 {formatPercent(delta)}</div>
    </div>
  )
}

export default DemoStat
