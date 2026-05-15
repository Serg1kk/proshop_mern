import React from 'react'

const Skeleton = ({ variant = 'text', width, height, style }) => {
  const cls = ['skeleton', `is-${variant}`]
  const s = { ...style }
  if (width) s.width = typeof width === 'number' ? `${width}px` : width
  if (height) s.height = typeof height === 'number' ? `${height}px` : height
  return <span className={cls.join(' ')} style={s} aria-hidden='true' />
}

export default Skeleton
