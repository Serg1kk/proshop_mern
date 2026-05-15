import React from 'react'
import { Link } from 'react-router-dom'

const Button = React.forwardRef(function Button(
  {
    as,
    variant = 'primary',
    size,
    block,
    loading,
    disabled,
    className = '',
    children,
    to,
    href,
    ...rest
  },
  ref
) {
  const classes = ['btn']
  if (variant === 'primary') classes.push('is-primary')
  if (variant === 'secondary') classes.push('is-ghost')
  if (variant === 'ghost') classes.push('is-ghost')
  if (variant === 'outline') classes.push('is-outline')
  if (variant === 'destructive') classes.push('is-outline', 'is-destructive')
  if (size === 'lg') classes.push('is-lg')
  if (block) classes.push('is-block')
  if (className) classes.push(className)

  const style = block ? { width: '100%' } : undefined
  if (variant === 'destructive') {
    classes.push('btn-destructive')
  }

  if (to) {
    return (
      <Link
        ref={ref}
        to={to}
        className={classes.join(' ')}
        style={{
          ...style,
          ...(variant === 'destructive'
            ? { color: 'var(--destructive)', borderColor: 'var(--destructive)' }
            : null),
        }}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {loading ? <span className='btn-spin' aria-hidden='true' /> : null}
        {children}
      </Link>
    )
  }
  if (href || as === 'a') {
    return (
      <a
        ref={ref}
        href={href || '#'}
        className={classes.join(' ')}
        style={{
          ...style,
          ...(variant === 'destructive'
            ? { color: 'var(--destructive)', borderColor: 'var(--destructive)' }
            : null),
        }}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {loading ? <span className='btn-spin' aria-hidden='true' /> : null}
        {children}
      </a>
    )
  }
  return (
    <button
      ref={ref}
      type={rest.type || 'button'}
      className={classes.join(' ')}
      style={{
        ...style,
        ...(variant === 'destructive'
          ? { color: 'var(--destructive)', borderColor: 'var(--destructive)' }
          : null),
      }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className='btn-spin' aria-hidden='true' /> : null}
      {children}
    </button>
  )
})

export default Button
