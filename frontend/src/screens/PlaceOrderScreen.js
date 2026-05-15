import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import CheckoutProgress from '../components/good-shop/CheckoutProgress'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import EmptyState from '../components/good-shop/EmptyState'
import PriceLockup from '../components/good-shop/PriceLockup'
import Placeholder from '../components/good-shop/Placeholder'
import { createOrder } from '../actions/orderActions'
import { ORDER_CREATE_RESET } from '../constants/orderConstants'
import { USER_DETAILS_RESET } from '../constants/userConstants'

const addDecimals = (num) => (Math.round(num * 100) / 100).toFixed(2)

const tintFor = (key = '') => {
  const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const PlaceOrderScreen = ({ history }) => {
  const dispatch = useDispatch()
  const cart = useSelector((s) => s.cart)

  useEffect(() => {
    if (!cart.shippingAddress?.address) history.push('/shipping')
    else if (!cart.paymentMethod) history.push('/payment')
  }, [history, cart.shippingAddress, cart.paymentMethod])

  const itemsPrice = addDecimals(
    cart.cartItems.reduce((acc, it) => acc + Number(it.price) * Number(it.qty), 0)
  )
  const shippingPrice = addDecimals(Number(itemsPrice) > 100 ? 0 : 100)
  const taxPrice = addDecimals(Number((0.15 * Number(itemsPrice)).toFixed(2)))
  const totalPrice = (
    Number(itemsPrice) + Number(shippingPrice) + Number(taxPrice)
  ).toFixed(2)

  cart.itemsPrice = itemsPrice
  cart.shippingPrice = shippingPrice
  cart.taxPrice = taxPrice
  cart.totalPrice = totalPrice

  const orderCreate = useSelector((s) => s.orderCreate)
  const { order, success, error, loading } = orderCreate

  useEffect(() => {
    if (success && order) {
      history.push(`/order/${order._id}`)
      dispatch({ type: USER_DETAILS_RESET })
      dispatch({ type: ORDER_CREATE_RESET })
    }
    // eslint-disable-next-line
  }, [history, success])

  const placeOrderHandler = () => {
    dispatch(
      createOrder({
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      })
    )
  }

  return (
    <PageShell>
      <CheckoutProgress current={4} />

      <div className='cart-grid'>
        <section>
          <article className='review-block'>
            <div className='review-block-head'>
              <h4>Shipping to</h4>
              <Link to='/shipping' className='edit-link'>Change</Link>
            </div>
            <div className='review-body'>
              <strong>{cart.shippingAddress.address}</strong>, {cart.shippingAddress.city}{' '}
              {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}
            </div>
          </article>

          <article className='review-block'>
            <div className='review-block-head'>
              <h4>Paying with</h4>
              <Link to='/payment' className='edit-link'>Change</Link>
            </div>
            <div className='review-body'>{cart.paymentMethod}</div>
          </article>

          <article className='review-block'>
            <div className='review-block-head'>
              <h4>You're ordering · {cart.cartItems.length} item{cart.cartItems.length === 1 ? '' : 's'}</h4>
              <Link to='/cart' className='edit-link'>Edit cart</Link>
            </div>
            {cart.cartItems.length === 0 ? (
              <EmptyState title='Your cart is empty.' />
            ) : (
              <div>
                {cart.cartItems.map((item, i) => (
                  <div key={i} className='item-line'>
                    <Placeholder
                      tint={tintFor(item.name || item.product)}
                      label={item.name}
                      src={item.image}
                      alt={item.name}
                    />
                    <div>
                      <Link to={`/product/${item.product}`} className='title-link'>{item.name}</Link>
                      <div className='qty'>{item.qty} × <PriceLockup amount={Number(item.price)} currency='USD' /></div>
                    </div>
                    <PriceLockup amount={Number(item.qty) * Number(item.price)} currency='USD' />
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <aside className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className='order-summary'>
            <h3>Order summary</h3>
            <div className='row'>
              <span>Items</span>
              <PriceLockup amount={Number(itemsPrice)} currency='USD' />
            </div>
            <div className='row'>
              <span>Shipping</span>
              <span>
                {Number(shippingPrice) === 0 ? 'Free' : <PriceLockup amount={Number(shippingPrice)} currency='USD' />}
              </span>
            </div>
            <div className='row'>
              <span>Tax</span>
              <PriceLockup amount={Number(taxPrice)} currency='USD' />
            </div>
            <div className='row is-total'>
              <span>Total</span>
              <PriceLockup amount={Number(totalPrice)} currency='USD' size='lg' />
            </div>

            {error && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Alert variant='destructive'>{error}</Alert>
              </div>
            )}

            <Button
              variant='primary'
              size='lg'
              block
              disabled={cart.cartItems.length === 0}
              loading={loading}
              onClick={placeOrderHandler}
            >
              Place order
            </Button>
            <span className='hint'>Shipping and taxes are estimated.</span>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}

export default PlaceOrderScreen
