import React from 'react'

const Sparkle = ({ size = 20, variant = 'gradient', className = '' }) => {
  const gid = `sparkle-grad-${variant}-${size}`
  const fill =
    variant === 'gradient'
      ? `url(#${gid})`
      : variant === 'white'
      ? '#fff'
      : 'currentColor'
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
      className={className}
    >
      <path
        d='M10 1.5l1.83 5.17L17 8.5l-5.17 1.83L10 15.5l-1.83-5.17L3 8.5l5.17-1.83L10 1.5z'
        fill={fill}
      />
      <path
        d='M16 14l0.6 1.65L18.25 16l-1.65 0.6L16 18.25l-0.6-1.65L13.75 16l1.65-0.6L16 14z'
        fill={fill}
      />
      {variant === 'gradient' && (
        <defs>
          <linearGradient
            id={gid}
            x1='0'
            y1='0'
            x2='20'
            y2='20'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#FF9FCB' />
            <stop offset='0.5' stopColor='#8FC8FF' />
            <stop offset='1' stopColor='#FFD78F' />
          </linearGradient>
        </defs>
      )}
    </svg>
  )
}

export default Sparkle
