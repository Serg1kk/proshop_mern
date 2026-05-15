import React from 'react'

const Stars = ({ value = 5, count = null }) => {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <span className='stars' role='img' aria-label={`${value} of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const isFull = i < full
        const isHalf = !isFull && i === full && half
        const gradId = `star-half-${i}-${Math.random().toString(36).slice(2, 8)}`
        return (
          <svg key={i} width='14' height='14' viewBox='0 0 16 16'>
            <defs>
              <linearGradient id={gradId}>
                <stop offset='50%' stopColor='currentColor' />
                <stop offset='50%' stopColor='var(--gray-300)' />
              </linearGradient>
            </defs>
            <path
              d='M8 1.5l1.94 4.27 4.66.51-3.5 3.14.97 4.58L8 11.78l-4.07 2.22.97-4.58-3.5-3.14 4.66-.51L8 1.5z'
              fill={
                isFull
                  ? 'currentColor'
                  : isHalf
                  ? `url(#${gradId})`
                  : 'var(--gray-300)'
              }
            />
          </svg>
        )
      })}
      {count !== null && <span className='count'>({count})</span>}
    </span>
  )
}

export default Stars
