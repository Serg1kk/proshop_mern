import React from 'react'
import { Link } from 'react-router-dom'

const STEPS = [
  { id: 1, label: 'Sign in', to: '/login' },
  { id: 2, label: 'Shipping', to: '/shipping' },
  { id: 3, label: 'Payment', to: '/payment' },
  { id: 4, label: 'Place order', to: '/placeorder' },
]

const CheckoutProgress = ({ current = 1, allowBack = true }) => (
  <nav className='checkout-progress' aria-label='Checkout progress'>
    {STEPS.map((step, i) => {
      const state = step.id < current ? 'is-done' : step.id === current ? 'is-current' : ''
      const dotContent = step.id < current ? '✓' : step.id
      const aria = step.id === current ? { 'aria-current': 'step' } : null
      const stepNode = (
        <span className={`step ${state}`} {...aria}>
          <span className='step-dot'>{dotContent}</span>
          <span>{step.label}</span>
        </span>
      )
      return (
        <React.Fragment key={step.id}>
          {allowBack && step.id < current ? (
            <Link to={step.to} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {stepNode}
            </Link>
          ) : (
            stepNode
          )}
          {i < STEPS.length - 1 && (
            <span
              className={'step-line' + (step.id < current ? ' is-done' : '')}
              aria-hidden='true'
            />
          )}
        </React.Fragment>
      )
    })}
  </nav>
)

export default CheckoutProgress
