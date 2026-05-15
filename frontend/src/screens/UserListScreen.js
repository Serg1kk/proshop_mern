import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import DataTable from '../components/good-shop/DataTable'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import Badge from '../components/good-shop/Badge'
import EmptyState from '../components/good-shop/EmptyState'
import Avatar from '../components/good-shop/Avatar'
import Modal from '../components/good-shop/Modal'
import { listUsers, deleteUser } from '../actions/userActions'

const UserListScreen = ({ history }) => {
  const dispatch = useDispatch()
  const userList = useSelector((s) => s.userList)
  const { loading, error, users = [] } = userList
  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin
  const userDelete = useSelector((s) => s.userDelete)
  const { success: successDelete } = userDelete

  const [filter, setFilter] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listUsers())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, successDelete, userInfo])

  const filtered = useMemo(() => {
    if (!filter) return users
    const q = filter.toLowerCase()
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }, [users, filter])

  const columns = [
    {
      key: 'avatar',
      label: '',
      width: 60,
      render: (r) => <Avatar name={r.name} />,
    },
    {
      key: 'name',
      label: 'Name',
      render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (r) => (
        <a href={`mailto:${r.email}`} style={{ color: 'var(--foreground-2)' }}>
          {r.email}
        </a>
      ),
    },
    {
      key: 'isAdmin',
      label: 'Role',
      render: (r) =>
        r.isAdmin ? (
          <Badge variant='aurora' ariaLabel='Administrator'>Admin</Badge>
        ) : (
          <Badge variant='neutral'>Member</Badge>
        ),
    },
    {
      key: 'actions',
      label: '',
      align: 'actions',
      render: (r) => (
        <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
          <Button
            to={`/admin/user/${r._id}/edit`}
            variant='outline'
            style={{ height: 32, fontSize: 13 }}
          >
            Edit
          </Button>
          <Button
            variant='destructive'
            style={{ height: 32, fontSize: 13 }}
            onClick={() => setPendingDelete(r)}
          >
            Delete
          </Button>
        </span>
      ),
    },
  ]

  return (
    <PageShell>
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/productlist' }, { label: 'Users' }]} />
      <header className='admin-header'>
        <h1>Users</h1>
        <span className='count'>{users.length} user{users.length === 1 ? '' : 's'}</span>
        <span className='spacer' />
        <input
          className='input'
          placeholder='Search users by name or email'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label='Search users'
        />
      </header>

      {loading ? (
        <div className='gs-loader'>Loading users…</div>
      ) : error ? (
        <Alert variant='destructive'>{error}</Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filter ? 'No users match this search.' : 'No users yet.'}
          description={filter ? 'Try a different name or email.' : 'Users show up here when they register.'}
          action={filter && <Button onClick={() => setFilter('')}>Clear search</Button>}
        />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r._id} caption='All users' />
      )}

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title='Delete this user?'
        actions={
          <>
            <Button variant='ghost' onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                dispatch(deleteUser(pendingDelete._id))
                setPendingDelete(null)
              }}
            >
              Delete user
            </Button>
          </>
        }
      >
        <p>
          <strong>{pendingDelete?.name}</strong> will lose access immediately.
          This can't be undone.
        </p>
      </Modal>
    </PageShell>
  )
}

export default UserListScreen
