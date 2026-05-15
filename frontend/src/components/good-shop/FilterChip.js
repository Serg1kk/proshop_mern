import React, { useState, useRef, useEffect } from 'react'

const FilterChip = ({ label, options, selected, onChange, multi = true }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClickAway = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [open])

  const active = multi
    ? selected.length > 0
    : selected !== null && selected !== undefined && selected !== ''
  const displayLabel = multi
    ? selected.length === 0
      ? label
      : `${label} · ${selected.length}`
    : selected
    ? `${label}: ${selected}`
    : label

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type='button'
        className={'chip' + (active ? ' is-active' : '')}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup='listbox'
        aria-expanded={open}
      >
        {displayLabel}
        <span className='chev' />
      </button>
      {open && (
        <div className='dd-panel' role='listbox'>
          {!multi && (
            <button
              type='button'
              className={'dd-option' + (!selected ? ' is-on' : '')}
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              <span className='check' /> Any
            </button>
          )}
          {options.map((opt) => {
            const on = multi ? selected.includes(opt) : selected === opt
            return (
              <button
                type='button'
                key={opt}
                className={'dd-option' + (on ? ' is-on' : '')}
                onClick={() => {
                  if (multi) {
                    onChange(on ? selected.filter((x) => x !== opt) : [...selected, opt])
                  } else {
                    onChange(opt)
                    setOpen(false)
                  }
                }}
              >
                <span className='check' /> {opt}
              </button>
            )
          })}
          {multi && selected.length > 0 && (
            <button
              type='button'
              className='dd-option'
              style={{ color: 'var(--primary)', fontWeight: 600 }}
              onClick={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterChip
