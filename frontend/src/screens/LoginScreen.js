import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import FormShell from '../components/good-shop/FormShell'
import Field from '../components/good-shop/Field'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import { login } from '../actions/userActions'

const Eye = ({ open }) => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    {open ? (
      <>
        <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
        <circle cx='12' cy='12' r='3' />
      </>
    ) : (
      <>
        <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
        <line x1='1' y1='1' x2='23' y2='23' />
      </>
    )}
  </svg>
)

const LoginScreen = ({ location, history }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const dispatch = useDispatch()
  const userLogin = useSelector((s) => s.userLogin)
  const { loading, error, userInfo } = userLogin

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) history.push(redirect)
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(login(email, password))
  }

  return (
    <PageShell className='auth-bg' headerProps={{ logoStyle: 'gradient' }}>
      <FormShell title='Welcome back' subtitle='Sign in to continue shopping.'>
        <div className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {error && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <Alert variant='destructive'>{error}</Alert>
            </div>
          )}
          <form onSubmit={submitHandler}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='current-password'
                hint='Use 8+ characters with letters and numbers.'
                required
                trailing={{
                  icon: <Eye open={showPwd} />,
                  ariaLabel: showPwd ? 'Hide password' : 'Show password',
                  pressed: showPwd,
                  onClick: () => setShowPwd((v) => !v),
                }}
              />
            </div>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button type='submit' variant='primary' size='lg' block loading={loading}>
                Sign in
              </Button>
            </div>
          </form>

          <p style={{ marginTop: 'var(--space-4)', fontSize: 14, color: 'var(--muted)' }}>
            <a href='#forgot' onClick={(e) => e.preventDefault()}>Forgot your password?</a>
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 'var(--space-4) 0' }} />

          <p style={{ margin: 0, fontSize: 14, color: 'var(--foreground-2)' }}>
            New here?{' '}
            <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} style={{ fontWeight: 600 }}>
              Create an account
            </Link>
          </p>
        </div>
      </FormShell>
    </PageShell>
  )
}

export default LoginScreen
