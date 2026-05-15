import React from 'react'

const Icons = {
  info: (
    <svg className='alert-icon' viewBox='0 0 20 20' fill='currentColor'>
      <path d='M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-1 4h2v6h-2v-6z' />
    </svg>
  ),
  success: (
    <svg className='alert-icon' viewBox='0 0 20 20' fill='currentColor'>
      <path d='M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1.2-5.4l5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3z' />
    </svg>
  ),
  warning: (
    <svg className='alert-icon' viewBox='0 0 20 20' fill='currentColor'>
      <path d='M10 1l9 16H1L10 1zm0 6v5h0v-5zm-1 7h2v2H9v-2z' />
    </svg>
  ),
  destructive: (
    <svg className='alert-icon' viewBox='0 0 20 20' fill='currentColor'>
      <path d='M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-9V5h2v4h-2zm0 5v-2h2v2H9z' />
    </svg>
  ),
}

const Alert = ({ variant = 'info', children, role }) => {
  const cls = `alert is-${variant}`
  const r = role || (variant === 'destructive' ? 'alert' : 'status')
  return (
    <div className={cls} role={r}>
      {Icons[variant] || Icons.info}
      <div>{children}</div>
    </div>
  )
}

export default Alert
