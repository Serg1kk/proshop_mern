import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { PayPalButton } from 'react-paypal-button-v2'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Button from '../components/good-shop/Button'
import Badge from '../components/good-shop/Badge'
import Alert from '../components/good-shop/Alert'
import PriceLockup from '../components/good-shop/PriceLockup'
import Placeholder from '../components/good-shop/Placeholder'
import {
  getOrderDetails,
  payOrder,
  deliverOrder,
} from '../actions/orderActions'
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
} from '../constants/orderConstants'

const addDecimals = (num) => (Math.round(num * 100) / 100).toFixed(2)
const tintFor = (key = '') => {
  const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const StatusPills = ({ paid, delivered }) => (
  <div className='status-row'>
    <Badge variant={paid ? 'success' : 'warning'}>{paid ? 'Paid' : 'Awaiting payment'}</Badge>
    <Badge variant={paid ? 'info' : 'neutral'}>Shipped</Badge>
    <Badge variant={delivered ? 'success' : 'neutral'}>{delivered ? 'Delivered' : 'On the way'}</Badge>
  </div>
)

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id
  const [sdkReady, setSdkReady] = useState(false)

  const dispatch = useDispatch()
  const orderDetails = useSelector((s) => s.orderDetails)
  const { order, loading, error } = orderDetails

  const orderPay = useSelector((s) => s.orderPay)
  const { loading: loadingPay, success: successPay } = orderPay

  const orderDeliver = useSelector((s) => s.orderDeliver)
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver

  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  if (!loading && order && order.orderItems) {
    order.itemsPrice = addDecimals(
      order.orderItems.reduce(
        (acc, item) => acc + Number(item.price) * Number(item.qty),
        0
      )
    )
  }

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
      return
    }
    const addPayPalScript = async () => {
      const { data: clientId } = await axios.get('/api/config/paypal')
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`
      script.async = true
      script.onload = () => setSdkReady(true)
      document.body.appendChild(script)
    }
    if (!order || successPay || successDeliver || order._id !== orderId) {
      dispatch({ type: ORDER_PAY_RESET })
      dispatch({ type: ORDER_DELIVER_RESET })
      dispatch(getOrderDetails(orderId))
    } else if (!order.isPaid) {
      if (!window.paypal) addPayPalScript()
      else setSdkReady(true)
    }
    // eslint-disable-next-line
  }, [dispatch, orderId, successPay, successDeliver, order])

  const successPaymentHandler = (paymentResult) => {
    dispatch(payOrder(orderId, paymentResult))
  }

  const deliverHandler = () => dispatch(deliverOrder(order))

  if (loading) {
    return (
      <PageShell>
        <div className='gs-loader'>Loading your order…</div>
      </PageShell>
    )
  }
  if (error) {
    return (
      <PageShell>
        <Alert variant='destructive'>{error}</Alert>
      </PageShell>
    )
  }
  if (!order) return null

  return (
    <PageShell>
      <section className='confirm-hero' aria-labelledby='order-h'>
        <div className='confirm-hero-inner'>
          <h1 id='order-h'>
            {order.isPaid ? (order.isDelivered ? 'Hope you love it.' : 'Thanks — your order is in.') : 'One step left to confirm.'}
          </h1>
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--foreground-2)' }}>
            {order.isPaid
              ? order.isDelivered
                ? 'Tap an item to leave a review.'
                : "We'll email you when it ships."
              : "You'll receive a confirmation email after payment."}
          </p>
          <span className='order-id'>Order #{order._id}</span>
          <StatusPills paid={order.isPaid} delivered={order.isDelivered} />
        </div>
      </section>

      <div className='cart-grid'>
        <section>
          <article className='review-block'>
            <div className='review-block-head'>
              <h4>Shipping to</h4>
            </div>
            <div className='review-body'>
              <strong>{order.user?.name}</strong>{' '}
              · <a href={`mailto:${order.user?.email}`}>{order.user?.email}</a>
              <br />
              {order.shippingAddress.address}, {order.shippingAddress.city}{' '}
              {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              <div style={{ marginTop: 'var(--space-2)' }}>
                {order.isDelivered ? (
                  <Badge variant='success'>Delivered on {(order.deliveredAt || '').substring(0, 10)}</Badge>
                ) : (
                  <Badge variant='neutral'>Not yet delivered</Badge>
                )}
              </div>
            </div>
          </article>

          <article className='review-block'>
            <div className='review-block-head'>
              <h4>Paying with</h4>
            </div>
            <div className='review-body'>
              {order.paymentMethod}
              <div style={{ marginTop: 'var(--space-2)' }}>
                {order.isPaid ? (
                  <Badge variant='success'>Paid on {(order.paidAt || '').substring(0, 10)}</Badge>
                ) : (
                  <Badge variant='warning'>Not yet paid</Badge>
                )}
              </div>
            </div>
          </article>

          <article className='review-block'>
            <div className='review-block-head'>
              <h4>Ordered items · {order.orderItems.length}</h4>
            </div>
            {order.orderItems.length === 0 ? (
              <Alert variant='info'>Order is empty.</Alert>
            ) : (
              <div>
                {order.orderItems.map((item, i) => (
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

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className='order-summary'>
              <h3>Order summary</h3>
              <div className='row'>
                <span>Items</span>
                <PriceLockup amount={Number(order.itemsPrice)} currency='USD' />
              </div>
              <div className='row'>
                <span>Shipping</span>
                <PriceLockup amount={Number(order.shippingPrice)} currency='USD' />
              </div>
              <div className='row'>
                <span>Tax</span>
                <PriceLockup amount={Number(order.taxPrice)} currency='USD' />
              </div>
              <div className='row is-total'>
                <span>Total</span>
                <PriceLockup amount={Number(order.totalPrice)} currency='USD' size='lg' />
              </div>
            </div>
          </div>

          {!order.isPaid && (
            <div role='region' aria-label='Payment options' style={{ background: 'var(--background)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              {loadingPay && <div className='gs-loader'>Processing…</div>}
              {!sdkReady ? (
                <div className='gs-loader'>Loading PayPal…</div>
              ) : (
                <PayPalButton amount={order.totalPrice} onSuccess={successPaymentHandler} />
              )}
            </div>
          )}

          {loadingDeliver && <div className='gs-loader'>Marking delivered…</div>}
          {userInfo &&
            userInfo.isAdmin &&
            order.isPaid &&
            !order.isDelivered && (
              <Button variant='outline' size='lg' block onClick={deliverHandler}>
                Mark as delivered
              </Button>
            )}
        </aside>
      </div>
    </PageShell>
  )
}

export default OrderScreen
