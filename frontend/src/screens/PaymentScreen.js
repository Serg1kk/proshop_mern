import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import FormShell from '../components/good-shop/FormShell'
import CheckoutProgress from '../components/good-shop/CheckoutProgress'
import RadioCard from '../components/good-shop/RadioCard'
import Button from '../components/good-shop/Button'
import { savePaymentMethod } from '../actions/cartActions'

const PayPalIcon = () => (
  <svg width='28' height='28' viewBox='0 0 24 24' aria-hidden='true'>
    <path
      d='M7 21l1-6h3.5c2.7 0 4.5-1.6 5-4 .3-1.5-.1-2.7-.9-3.4C14.6 6.6 13 6 11 6H6L3 21h4z'
      fill='#003087'
    />
    <path
      d='M17.5 11c-.5 2.4-2.3 4-5 4H9l-1 6h4l.6-3.6h2.3c3 0 5-1.8 5.5-4.6.3-1.6-.2-2.9-1.4-3.7-.6-.4-.4 0-.5 1.9z'
      fill='#009cde'
    />
    <path d='M11 6H6L3 21h2l1-6h3.5c2.7 0 4.5-1.6 5-4 0-.5-.6 1-2.5 1H8L9 7h2z' fill='#012169' opacity='.4' />
  </svg>
)

const CardIcon = () => (
  <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
    <rect x='2' y='5' width='20' height='14' rx='2' />
    <line x1='2' y1='10' x2='22' y2='10' />
  </svg>
)

const PaymentScreen = ({ history }) => {
  const cart = useSelector((s) => s.cart)
  const { shippingAddress = {} } = cart

  useEffect(() => {
    if (!shippingAddress.address) history.push('/shipping')
  }, [history, shippingAddress.address])

  const [paymentMethod, setPaymentMethod] = useState('PayPal')

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(savePaymentMethod(paymentMethod))
    history.push('/placeorder')
  }

  return (
    <PageShell>
      <CheckoutProgress current={3} />
      <FormShell title='How will you pay?' subtitle='Cards and Apple Pay are coming soon.'>
        <form onSubmit={submitHandler}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ position: 'absolute', left: '-9999px' }}>Payment method</legend>
            <div className='radio-card-stack' role='radiogroup' aria-label='Payment method'>
              <RadioCard
                name='paymentMethod'
                value='PayPal'
                checked={paymentMethod === 'PayPal'}
                onChange={setPaymentMethod}
                title='PayPal or Credit Card'
                subtitle="You'll be redirected to PayPal after the next step."
                icon={<PayPalIcon />}
              />
              <RadioCard
                name='paymentMethod'
                value='Card'
                checked={false}
                onChange={() => {}}
                disabled
                title='Card · Coming soon'
                subtitle='Saved cards and Apple Pay are on the way.'
                icon={<CardIcon />}
              />
            </div>
          </fieldset>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button type='submit' variant='primary' size='lg' block>
              Review your order
            </Button>
          </div>
        </form>
      </FormShell>
    </PageShell>
  )
}

export default PaymentScreen
