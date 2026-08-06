import { useParams, Link } from 'react-router-dom'
import { DemoCard, DemoStat } from '@demo/ui-package/react'
import { METRICS, TRENDS, formatMoney, formatPercent, trendColor } from '@demo/shared-utils'

export default function ReportDetailView() {
  const { id } = useParams<{ id: string }>()
  const metric = METRICS.find((m) => m.id === id)

  if (!metric) {
    return (
      <DemoCard title="未找到指标">
        <p>
          没有匹配的指标 ID：<code>{id}</code>
        </p>
        <Link className="report__link" to="/">
          ← 返回概览
        </Link>
      </DemoCard>
    )
  }

  // 用近 7 日成交额按总量比例切分，做一份「按日拆分」的示意数据
  const series = TRENDS.map((t) => ({
    date: t.date,
    value: Math.round((t.amount / 100000) * (metric.value / 100))
  }))
  const peak = series.reduce((a, b) => (b.value > a.value ? b : a), series[0])

  return (
    <div className="report">
      <Link className="report__link" to="/">
        ← 返回概览
      </Link>

      <DemoCard title={`${metric.label} · 本期`}>
        <DemoStat
          label="本期值"
          value={metric.value}
          unit={metric.unit}
          delta={metric.delta}
          compact={metric.unit !== '%'}
        />
      </DemoCard>

      <DemoCard title="按日拆分（示意）">
        <table className="report__table">
          <thead>
            <tr>
              <th>日期</th>
              <th>{metric.label}</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const ratio = metric.value ? s.value / metric.value : 0
              const isPeak = s.date === peak.date
              return (
                <tr key={s.date}>
                  <td>{s.date}</td>
                  <td>{formatMoney(s.value)}</td>
                  <td style={{ color: trendColor(isPeak ? 1 : 0) }}>
                    {(ratio * 100).toFixed(2)}%
                    {isPeak ? ' · 峰值' : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="demo-muted" style={{ marginTop: 12 }}>
          环比 {formatPercent(metric.delta)}
        </p>
      </DemoCard>
    </div>
  )
}
