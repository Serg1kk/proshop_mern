import React from 'react'
import { Link } from 'react-router-dom'

const GsFooter = () => (
  <footer className='footer'>
    <div className='footer-inner'>
      <div>
        <Link to='/' className='logo-wm' style={{ fontSize: 22 }}>
          <span>good</span>
          <span className='dot1' />
          <span className='dot2' />
          <span className='underscore'>_</span>
          <span>shop</span>
        </Link>
        <p className='trust'>
          Secure checkout · Free returns within 30 days · Verified sellers since 2021.
        </p>
      </div>
      <div>
        <h4>Help</h4>
        <a href='#order-tracking' onClick={(e) => e.preventDefault()}>Order tracking</a>
        <a href='#returns' onClick={(e) => e.preventDefault()}>Returns &amp; refunds</a>
        <a href='#shipping-info' onClick={(e) => e.preventDefault()}>Shipping info</a>
        <a href='#contact' onClick={(e) => e.preventDefault()}>Contact support</a>
      </div>
      <div>
        <h4>Shop</h4>
        <Link to='/'>New arrivals</Link>
        <Link to='/'>Best sellers</Link>
        <Link to='/'>Sale</Link>
        <a href='#gift-cards' onClick={(e) => e.preventDefault()}>Gift cards</a>
      </div>
      <div>
        <h4>Company</h4>
        <a href='#about' onClick={(e) => e.preventDefault()}>About</a>
        <a href='#press' onClick={(e) => e.preventDefault()}>Press</a>
        <a href='#careers' onClick={(e) => e.preventDefault()}>Careers</a>
        <a href='#privacy' onClick={(e) => e.preventDefault()}>Privacy &amp; terms</a>
      </div>
    </div>
  </footer>
)

export default GsFooter
