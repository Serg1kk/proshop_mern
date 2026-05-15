import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

const ToastContext = createContext(null)

let nextId = 1

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (msg, opts = {}) => {
      const id = nextId++
      const t = { id, msg, variant: opts.variant || 'info', timeout: opts.timeout ?? 3500 }
      setToasts((list) => [...list, t])
      if (t.timeout > 0) {
        timers.current[id] = setTimeout(() => remove(id), t.timeout)
      }
      return id
    },
    [remove]
  )

  const value = useMemo(() => ({ push, remove }), [push, remove])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className='gs-toast-region' role='region' aria-live='polite' aria-label='Notifications'>
        {toasts.map((t) => (
          <div key={t.id} className={`gs-toast is-${t.variant}`}>
            <div style={{ flex: 1 }}>{t.msg}</div>
            <button
              type='button'
              onClick={() => remove(t.id)}
              aria-label='Dismiss notification'
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  return ctx || { push: () => {}, remove: () => {} }
}

export default ToastProvider
