import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Placeholder from '../components/good-shop/Placeholder'
import PriceLockup from '../components/good-shop/PriceLockup'
import Stepper from '../components/good-shop/Stepper'
import Button from '../components/good-shop/Button'
import EmptyState from '../components/good-shop/EmptyState'
import { addToCart, removeFromCart } from '../actions/cartActions'

const tintFor = (key = '') => {
  const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id
  const qty = location.search ? Number(location.search.split('=')[1]) : 1

  const dispatch = useDispatch()
  const cart = useSelector((s) => s.cart)
  const { cartItems = [] } = cart

  useEffect(() => {
    if (productId) {
      dispatch(addToCart(productId, qty))
    }
  }, [dispatch, productId, qty])

  const checkoutHandler = () => history.push('/login?redirect=shipping')

  const itemCount = cartItems.reduce((acc, it) => acc + Number(it.qty || 0), 0)
  const subtotal = cartItems.reduce((acc, it) => acc + Number(it.qty || 0) * Number(it.price || 0), 0)
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 7.99
  const tax = +(subtotal * 0.08).toFixed(2)
  const total = +(subtotal + shipping + tax).toFixed(2)

  return (
    <PageShell>
      <header style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Your bag</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {itemCount === 0 ? 'No items yet.' : `${itemCount} item${itemCount === 1 ? '' : 's'} ready for checkout.`}
          </p>
        </div>
        <Link to='/' className='view-all' style={{ fontSize: 14, fontWeight: 600 }}>
          Continue shopping ›
        </Link>
      </header>

      {cartItems.length === 0 ? (
        <EmptyState
          title='Nothing here yet.'
          description='Add a couple of things from the shop and they show up right here.'
          action={<Button to='/' variant='primary'>Browse the home page</Button>}
        />
      ) : (
        <div className='cart-grid'>
          <section className='cart-list' aria-label='Cart items'>
            {cartItems.map((item) => (
              <article key={item.product} className='cart-row' aria-label={`Cart item: ${item.name}`}>
                <Placeholder
                  tint={tintFor(item.name || item.product)}
                  label={item.name}
                  src={item.image}
                  alt={item.name}
                />
                <div>
                  <Link to={`/product/${item.product}`} className='title-link'>{item.name}</Link>
                  <div className='meta'>
                    {Number(item.countInStock) > 0 ? `${item.countInStock} in stock` : 'Out of stock'}
                  </div>
                </div>
                <Stepper
                  value={Number(item.qty)}
                  onChange={(n) => dispatch(addToCart(item.product, n))}
                  min={1}
                  max={Math.max(1, Number(item.countInStock || 1))}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <PriceLockup amount={Number(item.price) * Number(item.qty)} currency='USD' />
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={() => dispatch(removeFromCart(item.product))}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                      <polyline points='3 6 5 6 21 6' />
                      <path d='M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2' />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className='order-summary'>
              <h3>Order summary</h3>
              <div className='row'>
                <span>Subtotal · {itemCount} item{itemCount === 1 ? '' : 's'}</span>
                <PriceLockup amount={subtotal} currency='USD' />
              </div>
              <div className='row'>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : <PriceLockup amount={shipping} currency='USD' />}</span>
              </div>
              <div className='row'>
                <span>Estimated tax</span>
                <PriceLockup amount={tax} currency='USD' />
              </div>
              <div className='row is-total'>
                <span>Total</span>
                <PriceLockup amount={total} currency='USD' size='lg' />
              </div>
              <span className='hint'>Free shipping on orders over $50.</span>
              <Button
                variant='primary'
                size='lg'
                block
                onClick={checkoutHandler}
                disabled={cartItems.length === 0}
              >
                Proceed to checkout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className='mobile-cta-bar' aria-label='Cart summary'>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{itemCount} item{itemCount === 1 ? '' : 's'}</div>
            <PriceLockup amount={total} currency='USD' />
          </div>
          <Button variant='primary' onClick={checkoutHandler}>Checkout</Button>
        </div>
      )}
    </PageShell>
  )
}

export default CartScreen
