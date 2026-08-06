import { DemoCard, DemoStat } from '@demo/ui-package/react'
import {
  METRICS,
  TRENDS,
  formatMoney,
  formatCompact,
  formatPercent,
  trendColor
} from '@demo/shared-utils'
import { Link } from 'react-router-dom'

export default function ReportListView() {
  const totalAmount = TRENDS.reduce((sum, t) => sum + t.amount, 0)
  const totalCount = TRENDS.reduce((sum, t) => sum + t.count, 0)
  const maxAmount = Math.max(...TRENDS.map((t) => t.amount))

  return (
    <div className="report">
      <section className="report__grid">
        {METRICS.map((m) => (
          <DemoCard key={m.id} title={m.label}>
            <DemoStat
              label="本期"
              value={m.value}
              unit={m.unit}
              delta={m.delta}
              compact={m.unit !== '%'}
            />
            <Link className="report__link" to={`/detail/${m.id}`}>
              查看明细 →
            </Link>
          </DemoCard>
        ))}
      </section>

      <DemoCard title="近 7 日成交趋势">
        <div className="report__summary">
          <span>
            合计 <b>{formatMoney(totalAmount)}</b>
          </span>
          <span>
            订单 <b>{totalCount.toLocaleString('zh-CN')}</b> 单
          </span>
          <span>
            峰值 <b>{formatCompact(maxAmount)}</b>
          </span>
        </div>
        <table className="report__table">
          <thead>
            <tr>
              <th>日期</th>
              <th>成交额</th>
              <th>订单数</th>
              <th>环比</th>
            </tr>
          </thead>
          <tbody>
            {TRENDS.map((t, i) => {
              const prev = TRENDS[i - 1]
              const delta = prev ? (t.amount - prev.amount) / prev.amount : 0
              return (
                <tr key={t.date}>
                  <td>{t.date}</td>
                  <td>{formatMoney(t.amount)}</td>
                  <td>{t.count}</td>
                  <td style={{ color: trendColor(delta) }}>
                    {i === 0 ? '—' : formatPercent(delta)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DemoCard>
    </div>
  )
}
