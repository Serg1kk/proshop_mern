import React from 'react'

const Stepper = ({ value, onChange, min = 1, max = 99, label = 'Quantity' }) => {
  const v = Number(value || min)
  const dec = () => onChange(Math.max(min, v - 1))
  const inc = () => onChange(Math.min(max, v + 1))
  return (
    <div
      className='stepper'
      role='group'
      aria-label={label}
    >
      <button
        type='button'
        onClick={dec}
        disabled={v <= min}
        aria-label='Decrease quantity'
      >
        −
      </button>
      <span
        className='stepper-value'
        role='spinbutton'
        aria-valuenow={v}
        aria-valuemin={min}
        aria-valuemax={max}
      >
        {v}
      </span>
      <button
        type='button'
        onClick={inc}
        disabled={v >= max}
        aria-label='Increase quantity'
      >
        +
      </button>
    </div>
  )
}

export default Stepper
