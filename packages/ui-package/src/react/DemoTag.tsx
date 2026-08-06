import type { ReactNode } from 'react'

export interface DemoTagProps {
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  dot?: boolean
  children?: ReactNode
}

export function DemoTag({ tone = 'neutral', dot = false, children }: DemoTagProps) {
  const classes = ['demo-tag', tone !== 'neutral' && `demo-tag--${tone}`].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {dot && <i className="demo-tag__dot" />}
      {children}
    </span>
  )
}

export default DemoTag
