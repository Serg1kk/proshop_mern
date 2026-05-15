import React, { useRef } from 'react'

let _fieldCounter = 0

const Field = ({
  id,
  label,
  hint,
  error,
  as = 'input',
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  autoComplete,
  children,
  trailing,
  rows = 4,
  ...rest
}) => {
  const ridRef = useRef(null)
  if (ridRef.current === null) ridRef.current = `gs-field-${++_fieldCounter}`
  const fieldId = id || ridRef.current
  const errorId = error ? `${fieldId}-err` : undefined
  const hintId = hint ? `${fieldId}-hint` : undefined
  const describedBy =
    [errorId, hintId].filter(Boolean).join(' ') || undefined

  const inputCls = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input'

  const sharedProps = {
    id: fieldId,
    name: rest.name || fieldId,
    value: value ?? '',
    onChange,
    placeholder,
    required,
    autoComplete,
    className: inputCls,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    ...rest,
  }

  return (
    <label className={'field' + (trailing ? ' has-icon' : '')} htmlFor={fieldId}>
      {label && <span className='field-label'>{label}</span>}
      {as === 'textarea' ? (
        <textarea {...sharedProps} rows={rows} />
      ) : as === 'select' ? (
        <select {...sharedProps}>{children}</select>
      ) : (
        <input {...sharedProps} type={type} />
      )}
      {trailing && (
        <button
          type='button'
          className='field-icon'
          onClick={trailing.onClick}
          aria-label={trailing.ariaLabel}
          aria-pressed={trailing.pressed}
        >
          {trailing.icon}
        </button>
      )}
      {hint && !error && (
        <span id={hintId} className='field-hint'>{hint}</span>
      )}
      {error && (
        <span id={errorId} className='field-error' role='alert'>{error}</span>
      )}
    </label>
  )
}

export default Field
