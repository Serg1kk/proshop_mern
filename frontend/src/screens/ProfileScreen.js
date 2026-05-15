import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import FormShell, { FormSection } from '../components/good-shop/FormShell'
import Field from '../components/good-shop/Field'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import DataTable from '../components/good-shop/DataTable'
import Badge from '../components/good-shop/Badge'
import EmptyState from '../components/good-shop/EmptyState'
import PriceLockup from '../components/good-shop/PriceLockup'
import { getUserDetails, updateUserProfile } from '../actions/userActions'
import { listMyOrders } from '../actions/orderActions'
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants'

const ProfileScreen = ({ history }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()
  const userDetails = useSelector((s) => s.userDetails)
  const { loading, error, user } = userDetails

  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  const userUpdateProfile = useSelector((s) => s.userUpdateProfile)
  const { success } = userUpdateProfile

  const orderListMy = useSelector((s) => s.orderListMy)
  const { loading: loadingOrders, error: errorOrders, orders } = orderListMy

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
    } else {
      if (!user || !user.name || success) {
        dispatch({ type: USER_UPDATE_PROFILE_RESET })
        dispatch(getUserDetails('profile'))
        dispatch(listMyOrders())
      } else {
        setName(user.name)
        setEmail(user.email)
      }
    }
  }, [dispatch, history, userInfo, user, success])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password && password !== confirmPassword) {
      setMessage("Passwords don't match yet.")
      return
    }
    setMessage(null)
    dispatch(updateUserProfile({ id: user._id, name, email, password }))
  }

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--foreground-2)' }}>
          #{r._id.slice(-8)}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (r) => (r.createdAt || '').substring(0, 10),
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (r) => <PriceLockup amount={Number(r.totalPrice)} currency='USD' />,
    },
    {
      key: 'paid',
      label: 'Paid',
      render: (r) =>
        r.isPaid ? (
          <Badge variant='success'>{(r.paidAt || '').substring(0, 10)}</Badge>
        ) : (
          <Badge variant='warning'>Pending</Badge>
        ),
    },
    {
      key: 'delivered',
      label: 'Delivered',
      render: (r) =>
        r.isDelivered ? (
          <Badge variant='success'>{(r.deliveredAt || '').substring(0, 10)}</Badge>
        ) : (
          <Badge variant='neutral'>—</Badge>
        ),
    },
    {
      key: 'actions',
      label: '',
      align: 'actions',
      render: (r) => (
        <Button to={`/order/${r._id}`} variant='outline' style={{ height: 32, fontSize: 13 }}>
          View
        </Button>
      ),
    },
  ]

  return (
    <PageShell>
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Profile' }]} />
      <h1 style={{ marginBottom: 'var(--space-1)' }}>{user?.name || 'Your profile'}</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: 'var(--space-5)' }}>
        {user?.email}
      </p>

      <div className='profile-grid'>
        <section>
          <div className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)' }}>
            <FormShell title='Update profile' subtitle='Leave password fields empty to keep your current one.'>
              {message && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <Alert variant='destructive'>{message}</Alert>
                </div>
              )}
              {error && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <Alert variant='destructive'>{error}</Alert>
                </div>
              )}
              {success && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <Alert variant='success'>Profile updated.</Alert>
                </div>
              )}
              {loading ? (
                <div className='gs-loader'>Loading…</div>
              ) : (
                <form onSubmit={submitHandler}>
                  <FormSection title='Identity'>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <Field label='Name' value={name} onChange={(e) => setName(e.target.value)} required />
                      <Field
                        label='Email address'
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </FormSection>
                  <FormSection title='Password'>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <Field
                        label='New password'
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        hint='Leave empty to keep current.'
                        autoComplete='new-password'
                      />
                      <Field
                        label='Confirm new password'
                        type='password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete='new-password'
                      />
                    </div>
                  </FormSection>
                  <Button type='submit' variant='primary' size='lg' block>
                    Save changes
                  </Button>
                </form>
              )}
            </FormShell>
          </div>
        </section>

        <section>
          <div className='section-head'>
            <h2 style={{ fontSize: 24 }}>Order history</h2>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>
              {orders?.length || 0} order{orders?.length === 1 ? '' : 's'}
            </span>
          </div>
          {loadingOrders ? (
            <div className='gs-loader'>Loading orders…</div>
          ) : errorOrders ? (
            <Alert variant='destructive'>{errorOrders}</Alert>
          ) : !orders || orders.length === 0 ? (
            <EmptyState
              title="You haven't ordered yet."
              description='Once you do, your orders show up here.'
              action={<Button to='/' variant='primary'>Browse the home page</Button>}
            />
          ) : (
            <DataTable columns={columns} rows={orders} rowKey={(r) => r._id} caption='Order history' />
          )}
        </section>
      </div>
    </PageShell>
  )
}

export default ProfileScreen
