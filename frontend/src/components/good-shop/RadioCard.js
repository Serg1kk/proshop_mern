import React from 'react'

const RadioCard = ({ checked, onChange, disabled, title, subtitle, icon, value, name }) => {
  const handleClick = () => {
    if (disabled) return
    onChange && onChange(value)
  }
  return (
    <label
      className={
        'radio-card' +
        (checked ? ' is-checked' : '') +
        (disabled ? ' is-disabled' : '')
      }
      onClick={handleClick}
    >
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={handleClick}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      <span className='rc-circle' aria-hidden='true' />
      <span className='rc-body'>
        <span className='rc-title'>{title}</span>
        {subtitle && <span className='rc-sub'>{subtitle}</span>}
      </span>
      {icon && <span aria-hidden='true'>{icon}</span>}
    </label>
  )
}

export default RadioCard
