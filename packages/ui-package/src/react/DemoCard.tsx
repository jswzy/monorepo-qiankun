import type { ReactNode } from 'react'

export interface DemoCardProps {
  title?: string
  subtitle?: string
  /** 标题前的强调条颜色 */
  accent?: string
  /** 内容区去掉内边距（放表格时用） */
  flush?: boolean
  extra?: ReactNode
  children?: ReactNode
}

export function DemoCard({
  title = '',
  subtitle = '',
  accent = 'var(--demo-primary)',
  flush = false,
  extra,
  children
}: DemoCardProps) {
  return (
    <section className={`demo-card${flush ? ' demo-card--flush' : ''}`}>
      {(title || extra) && (
        <header className="demo-card__head">
          <div className="demo-card__title-wrap">
            <span className="demo-card__accent" style={{ background: accent }} />
            <span className="demo-card__title">{title}</span>
            {subtitle && <span className="demo-card__subtitle">{subtitle}</span>}
          </div>
          {extra && <div className="demo-card__extra">{extra}</div>}
        </header>
      )}
      <div className="demo-card__body">{children}</div>
    </section>
  )
}

export default DemoCard
