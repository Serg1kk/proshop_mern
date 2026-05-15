import React from 'react'

const EmptyState = ({ title, description, action, icon }) => (
  <div className='empty-shell'>
    {icon && <div style={{ marginBottom: 'var(--space-3)' }}>{icon}</div>}
    {title && <h3>{title}</h3>}
    {description && <p>{description}</p>}
    {action}
  </div>
)

export default EmptyState
