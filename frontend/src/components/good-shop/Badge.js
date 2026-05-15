import React from 'react'

const Badge = ({ variant = 'neutral', children, ariaLabel }) => (
  <span className={`badge is-${variant}`} aria-label={ariaLabel}>
    {children}
  </span>
)

export default Badge
