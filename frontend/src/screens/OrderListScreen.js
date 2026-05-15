import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import DataTable from '../components/good-shop/DataTable'
import FilterChip from '../components/good-shop/FilterChip'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import Badge from '../components/good-shop/Badge'
import EmptyState from '../components/good-shop/EmptyState'
import PriceLockup from '../components/good-shop/PriceLockup'
import Avatar from '../components/good-shop/Avatar'
import { listOrders } from '../actions/orderActions'

const STATUS_OPTIONS = ['Paid', 'Unpaid', 'Delivered']
const DATE_OPTIONS = ['Today', 'Last 7 days', 'Last 30 days', 'All time']

const dayDiff = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))

const OrderListScreen = ({ history }) => {
  const dispatch = useDispatch()
  const orderList = useSelector((s) => s.orderList)
  const { loading, error, orders = [] } = orderList
  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  const [statusFilter, setStatusFilter] = useState([])
  const [dateFilter, setDateFilter] = useState('All time')

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listOrders())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, userInfo])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter.length) {
        const ok = statusFilter.some((s) => {
          if (s === 'Paid') return o.isPaid
          if (s === 'Unpaid') return !o.isPaid
          if (s === 'Delivered') return o.isDelivered
          return true
        })
        if (!ok) return false
      }
      if (dateFilter !== 'All time') {
        const d = dayDiff(o.createdAt)
        if (dateFilter === 'Today' && d > 0) return false
        if (dateFilter === 'Last 7 days' && d > 7) return false
        if (dateFilter === 'Last 30 days' && d > 30) return false
      }
      return true
    })
  }, [orders, statusFilter, dateFilter])

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
      key: 'user',
      label: 'Customer',
      render: (r) => (
        <span style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Avatar name={r.user?.name || '?'} size={28} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{r.user?.name || 'Guest'}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.user?.email}</span>
          </span>
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
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span style={{ display: 'inline-flex', gap: 4 }}>
          <Badge variant={r.isPaid ? 'success' : 'warning'}>
            {r.isPaid ? 'Paid' : 'Unpaid'}
          </Badge>
          {r.isDelivered && <Badge variant='info'>Delivered</Badge>}
        </span>
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
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/productlist' }, { label: 'Orders' }]} />
      <header className='admin-header'>
        <h1>Orders</h1>
        <span className='count'>{filtered.length} of {orders.length}</span>
      </header>

      <div className='filter-bar' role='toolbar' aria-label='Filter orders' style={{ marginBottom: 'var(--space-4)' }}>
        <FilterChip
          label='Status'
          options={STATUS_OPTIONS}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterChip
          label='Date range'
          options={DATE_OPTIONS}
          selected={dateFilter}
          onChange={(v) => setDateFilter(v || 'All time')}
          multi={false}
        />
      </div>

      {loading ? (
        <div className='gs-loader'>Loading orders…</div>
      ) : error ? (
        <Alert variant='destructive'>{error}</Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No orders match these filters.'
          description='Adjust the filters above to widen the search.'
          action={
            <Button
              onClick={() => {
                setStatusFilter([])
                setDateFilter('All time')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r._id} caption='All orders' />
      )}
    </PageShell>
  )
}

export default OrderListScreen
