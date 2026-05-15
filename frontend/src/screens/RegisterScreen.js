import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import FormShell from '../components/good-shop/FormShell'
import Field from '../components/good-shop/Field'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import { register } from '../actions/userActions'

const RegisterScreen = ({ location, history }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()
  const userRegister = useSelector((s) => s.userRegister)
  const { loading, error, userInfo } = userRegister

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) history.push(redirect)
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password.length < 8) {
      setMessage('Use 8+ characters with letters and numbers.')
      return
    }
    if (password !== confirmPassword) {
      setMessage("Passwords don't match yet.")
      return
    }
    setMessage(null)
    dispatch(register(name, email, password))
  }

  const mismatch = confirmPassword && password !== confirmPassword

  return (
    <PageShell className='auth-bg' headerProps={{ logoStyle: 'gradient' }}>
      <FormShell title='Create your account' subtitle='One bag, every brand.'>
        <div className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {(message || error) && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <Alert variant='destructive'>{message || error}</Alert>
            </div>
          )}

          <form onSubmit={submitHandler}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Field
                label='Full name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete='name'
                required
              />
              <Field
                label='Email address'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete='email'
                required
              />
              <Field
                label='Password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='new-password'
                hint='Use 8+ characters with letters and numbers.'
                required
              />
              <Field
                label='Confirm password'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete='new-password'
                error={mismatch ? "Passwords don't match yet." : undefined}
                required
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 'var(--space-3)' }}>
              By creating an account you agree to our{' '}
              <a href='#terms' onClick={(e) => e.preventDefault()}>Terms</a>{' '}and{' '}
              <a href='#privacy' onClick={(e) => e.preventDefault()}>Privacy policy</a>.
            </p>

            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button
                type='submit'
                variant='primary'
                size='lg'
                block
                loading={loading}
              >
                Create account
              </Button>
            </div>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 'var(--space-4) 0' }} />

          <p style={{ margin: 0, fontSize: 14, color: 'var(--foreground-2)' }}>
            Already have an account?{' '}
            <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} style={{ fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </FormShell>
    </PageShell>
  )
}

export default RegisterScreen
