import React from 'react'

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const Avatar = ({ name, size = 36 }) => (
  <span
    className='avatar'
    style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    aria-hidden='true'
  >
    {initials(name)}
  </span>
)

export default Avatar
