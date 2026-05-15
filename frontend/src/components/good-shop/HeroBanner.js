import React from 'react'

const HeroBanner = () => (
  <section className='hero' aria-labelledby='hero-h'>
    <div className='hero-inner'>
      <h2 id='hero-h'>
        Spring drop, <span className='ai-text'>fresh hues.</span>
      </h2>
      <p>
        Tech, fashion and home essentials from independent makers — curated,
        transparently priced, shipped to your door.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button type='button' className='btn is-primary'>
          Shop new arrivals
        </button>
        <button type='button' className='btn is-outline'>
          Browse brands
        </button>
      </div>
    </div>
  </section>
)

export default HeroBanner
