import React from 'react'

const Placeholder = ({ tint = 'slate', label, src, alt }) => (
  <div className='ph' data-tint={tint}>
    {src ? (
      <img src={src} alt={alt || label || ''} />
    ) : (
      <span className='ph-label'>{label}</span>
    )}
  </div>
)

export default Placeholder
