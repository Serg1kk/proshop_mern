import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import FormShell from '../components/good-shop/FormShell'
import Field from '../components/good-shop/Field'
import Toggle from '../components/good-shop/Toggle'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import { getUserDetails, updateUser } from '../actions/userActions'
import { USER_UPDATE_RESET } from '../constants/userConstants'

const UserEditScreen = ({ match, history }) => {
  const userId = match.params.id

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const dispatch = useDispatch()
  const userDetails = useSelector((s) => s.userDetails)
  const { loading, error, user } = userDetails
  const userUpdate = useSelector((s) => s.userUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = userUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: USER_UPDATE_RESET })
      history.push('/admin/userlist')
    } else {
      if (!user.name || user._id !== userId) {
        dispatch(getUserDetails(userId))
      } else {
        setName(user.name)
        setEmail(user.email)
        setIsAdmin(user.isAdmin)
      }
    }
  }, [dispatch, history, userId, user, successUpdate])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(updateUser({ _id: userId, name, email, isAdmin }))
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Admin', to: '/admin/productlist' },
          { label: 'Users', to: '/admin/userlist' },
          { label: user?.name || 'Edit user' },
        ]}
      />
      <FormShell title='Edit user' subtitle={user?.email}>
        <div className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {(error || errorUpdate) && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <Alert variant='destructive'>{error || errorUpdate}</Alert>
            </div>
          )}
          {loading ? (
            <div className='gs-loader'>Loading…</div>
          ) : (
            <form onSubmit={submitHandler}>
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
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <Toggle
                  checked={isAdmin}
                  onChange={setIsAdmin}
                  label='Administrator privileges'
                  hint='Can manage products, orders and other users.'
                />
              </div>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <Button to='/admin/userlist' variant='ghost'>Cancel</Button>
                <Button type='submit' variant='primary' loading={loadingUpdate}>Save changes</Button>
              </div>
            </form>
          )}
        </div>
      </FormShell>
    </PageShell>
  )
}

export default UserEditScreen
