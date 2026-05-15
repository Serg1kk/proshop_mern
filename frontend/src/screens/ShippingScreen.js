import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import FormShell from '../components/good-shop/FormShell'
import CheckoutProgress from '../components/good-shop/CheckoutProgress'
import Field from '../components/good-shop/Field'
import Button from '../components/good-shop/Button'
import { saveShippingAddress } from '../actions/cartActions'

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Sweden',
  'Australia',
]

const ShippingScreen = ({ history }) => {
  const cart = useSelector((s) => s.cart)
  const { shippingAddress = {} } = cart

  const [address, setAddress] = useState(shippingAddress.address || '')
  const [city, setCity] = useState(shippingAddress.city || '')
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '')
  const [country, setCountry] = useState(shippingAddress.country || 'United States')

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(saveShippingAddress({ address, city, postalCode, country }))
    history.push('/payment')
  }

  return (
    <PageShell>
      <CheckoutProgress current={2} />
      <FormShell title='Where should we send it?' subtitle='We deliver to physical addresses only.'>
        <form onSubmit={submitHandler}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field
              label='Street address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='123 Main St, Apt 4B'
              autoComplete='street-address'
              required
            />
            <div className='form-grid is-3col'>
              <Field
                label='City'
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete='address-level2'
                required
              />
              <Field
                label='Postal code'
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                autoComplete='postal-code'
                required
              />
              <Field
                as='select'
                label='Country'
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete='country-name'
                required
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Field>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button type='submit' variant='primary' size='lg' block>
              Continue to payment
            </Button>
          </div>
        </form>
      </FormShell>
    </PageShell>
  )
}

export default ShippingScreen
