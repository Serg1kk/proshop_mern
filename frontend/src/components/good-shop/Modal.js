import React, { useEffect, useRef } from 'react'

const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'sm',
  labelledBy,
}) => {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const node = dialogRef.current
    if (node) {
      const focusable = node.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable || node).focus()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (prev && prev.focus) prev.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className='gs-modal-backdrop'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose && onClose()
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={labelledBy || (title ? 'gs-modal-title' : undefined)}
        className={'gs-modal' + (size === 'lg' ? ' is-lg' : '')}
        tabIndex={-1}
      >
        {title && <h3 id='gs-modal-title'>{title}</h3>}
        {children}
        {actions && <div className='modal-actions'>{actions}</div>}
      </div>
    </div>
  )
}

export default Modal
