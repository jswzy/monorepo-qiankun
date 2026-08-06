import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface DemoButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  type?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  block?: boolean
  disabled?: boolean
  children?: ReactNode
}

export function DemoButton({
  type = 'default',
  size = 'medium',
  block = false,
  disabled = false,
  children,
  className,
  onClick,
  ...rest
}: DemoButtonProps) {
  const classes = [
    'demo-btn',
    type !== 'default' && `demo-btn--${type}`,
    size !== 'medium' && `demo-btn--${size}`,
    block && 'demo-btn--block',
    disabled && 'is-disabled',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...rest}
      type="button"
      className={classes}
      disabled={disabled}
      onClick={(ev) => {
        if (disabled) return
        onClick?.(ev)
      }}
    >
      {children}
    </button>
  )
}

export default DemoButton
