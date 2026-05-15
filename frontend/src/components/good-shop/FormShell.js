import React from 'react'

const FormShell = ({ width = 'narrow', title, subtitle, children, footer, className = '' }) => {
  const cls = ['form-shell']
  if (width === 'wide') cls.push('is-wide')
  if (className) cls.push(className)
  return (
    <section className={cls.join(' ')} aria-labelledby={title ? 'fs-h' : undefined}>
      {(title || subtitle) && (
        <header>
          {title && <h1 id='fs-h'>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      {children}
      {footer}
    </section>
  )
}

export const FormSection = ({ title, children }) => (
  <div className='form-section'>
    {title && <h3>{title}</h3>}
    {children}
  </div>
)

export default FormShell
