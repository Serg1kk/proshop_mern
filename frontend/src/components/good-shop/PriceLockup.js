import React from 'react'

const PriceLockup = ({ amount, currency = 'USD', size = 'md', prefix = false }) => {
  const cls = ['price-lockup']
  if (size === 'lg') cls.push('is-lg')
  if (prefix) cls.push('is-from')
  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
  return (
    <span className={cls.join(' ')}>
      <span className='price-num'>{formatted}</span>
      <sup className='price-currency'>{currency}</sup>
    </span>
  )
}

export default PriceLockup
