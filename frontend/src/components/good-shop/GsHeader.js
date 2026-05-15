import React from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Sparkle from './Sparkle'
import { logout } from '../../actions/userActions'

const CATEGORIES = [
  'Electronics',
  'Fashion',
  "Women's",
  "Kids' Fashion",
  'Health & Beauty',
  'Pharmacy',
  'Groceries',
  'Luxury Item',
]

const GsHeader = ({ query, onQuery, focused, onFocus, logoStyle = 'wordmark' }) => {
  const history = useHistory()
  const dispatch = useDispatch()
  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin || {}
  const cart = useSelector((s) => s.cart)
  const cartCount = (cart?.cartItems || []).reduce((n, it) => n + Number(it.qty || 0), 0)

  const submit = (e) => {
    e.preventDefault()
    const q = (query || '').trim()
    history.push(q ? `/search/${encodeURIComponent(q)}` : '/')
  }

  return (
    <header className='app-header'>
      <div className='header-row'>
        <Link to='/' className='logo-wm' aria-label='Good Shop home'>
          {logoStyle === 'gradient' ? (
            <>
              <span className='ai-text'>good</span>
              <span className='underscore'>_</span>
              <span>shop</span>
            </>
          ) : (
            <>
              <span>good</span>
              <span className='dot1' />
              <span className='dot2' />
              <span className='underscore'>_</span>
              <span>shop</span>
            </>
          )}
        </Link>

        <form className='search-wrap' onSubmit={submit} role='search'>
          <div
            className={'search-input-row' + (focused || query ? ' aurora-border' : '')}
            style={{ borderRadius: 'var(--radius-pill)' }}
          >
            <Sparkle size={20} variant='gradient' />
            <input
              type='search'
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onFocus={() => onFocus && onFocus(true)}
              onBlur={() => onFocus && onFocus(false)}
              placeholder='Search for any product or brand'
              aria-label='Search products'
            />
            {query && (
              <button
                type='button'
                className='clear-btn'
                onClick={() => onQuery('')}
                aria-label='Clear search'
              >
                <svg width='12' height='12' viewBox='0 0 12 12' aria-hidden='true'>
                  <path
                    d='M3 3l6 6M9 3l-6 6'
                    stroke='currentColor'
                    strokeWidth='1.75'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
            )}
          </div>
        </form>

        <div className='header-utility'>
          <button className='country-pill' aria-label='Region: United States'>
            <span className='flag' aria-hidden='true'>🇺🇸</span>
            <span>US</span>
            <span
              className='chev'
              style={{ borderTopColor: 'currentColor', opacity: 0.6 }}
            />
          </button>
          <Link to='/cart' className='utility-link'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <circle cx='9' cy='21' r='1' />
              <circle cx='20' cy='21' r='1' />
              <path d='M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6' />
            </svg>
            Cart
            {cartCount > 0 && <span className='cart-badge'>{cartCount}</span>}
          </Link>
          {userInfo ? (
            <>
              <Link to='/profile' className='utility-link'>
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'
                >
                  <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                  <circle cx='12' cy='7' r='4' />
                </svg>
                {userInfo.name.split(' ')[0]}
              </Link>
              <button
                type='button'
                className='utility-link'
                onClick={() => dispatch(logout())}
                aria-label='Log out'
              >
                Log out
              </button>
              {userInfo.isAdmin && (
                <Link to='/admin/productlist' className='utility-link'>
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link to='/login' className='utility-link'>
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
              >
                <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                <circle cx='12' cy='7' r='4' />
              </svg>
              Sign In
            </Link>
          )}
        </div>
      </div>

      <nav className='subnav-row' aria-label='Categories'>
        <Link to='/' className='subnav-link is-categories'>
          <svg width='14' height='14' viewBox='0 0 14 14' aria-hidden='true'>
            <rect x='0' y='0' width='6' height='6' rx='1' fill='currentColor' />
            <rect x='8' y='0' width='6' height='6' rx='1' fill='currentColor' />
            <rect x='0' y='8' width='6' height='6' rx='1' fill='currentColor' />
            <rect x='8' y='8' width='6' height='6' rx='1' fill='currentColor' />
          </svg>
          All Categories ▾
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            to={`/search/${encodeURIComponent(c)}`}
            className='subnav-link'
          >
            {c}
          </Link>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 'var(--space-4)',
            alignItems: 'center',
          }}
        >
          <span className='subnav-promo is-deals'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <polyline points='20 12 20 22 4 22 4 12' />
              <rect x='2' y='7' width='20' height='5' />
              <line x1='12' y1='22' x2='12' y2='7' />
              <path d='M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z' />
              <path d='M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z' />
            </svg>
            Best Deals
          </span>
          <span className='subnav-promo is-live'>
            good_shop Live <span className='live-dot' aria-hidden='true' />
          </span>
        </div>
      </nav>
    </header>
  )
}

export default GsHeader
