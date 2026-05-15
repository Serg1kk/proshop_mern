import React from 'react'

const Toggle = ({ checked, onChange, label, hint, id }) => {
  const handleClick = () => onChange && onChange(!checked)
  return (
    <div className='toggle-row'>
      <div className='toggle-info'>
        {label && <div className='toggle-label'>{label}</div>}
        {hint && <div className='toggle-hint'>{hint}</div>}
      </div>
      <button
        type='button'
        id={id}
        role='switch'
        aria-checked={checked ? 'true' : 'false'}
        className='toggle'
        onClick={handleClick}
        aria-label={label}
      />
    </div>
  )
}

export default Toggle
