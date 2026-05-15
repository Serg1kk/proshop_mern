import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import DataTable from '../components/good-shop/DataTable'
import Alert from '../components/good-shop/Alert'
import Badge from '../components/good-shop/Badge'
import EmptyState from '../components/good-shop/EmptyState'

const FeatureFlagListScreen = ({ history }) => {
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        setLoading(true)
        setError('')
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
        const { data } = await axios.get('/api/feature-flags', config)
        setFeatures(data)
      } catch (err) {
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : err.message
        )
      } finally {
        setLoading(false)
      }
    }
    if (userInfo && userInfo.isAdmin) fetchFeatureFlags()
    else history.push('/login')
  }, [history, userInfo])

  const filtered = useMemo(() => {
    if (!filter) return features
    const q = filter.toLowerCase()
    return features.filter(
      (f) =>
        f.key?.toLowerCase().includes(q) ||
        f.name?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q)
    )
  }, [features, filter])

  const statusBadge = (status) => {
    const s = String(status || '').toLowerCase()
    if (s === 'on' || s === 'enabled' || s === 'live')
      return <Badge variant='success'>{status}</Badge>
    if (s === 'testing' || s === 'beta' || s === 'partial')
      return <Badge variant='warning'>{status}</Badge>
    if (s === 'off' || s === 'disabled') return <Badge variant='neutral'>{status}</Badge>
    return <Badge variant='info'>{status}</Badge>
  }

  const columns = [
    {
      key: 'key',
      label: 'Flag',
      render: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--foreground)' }}>
            {r.key || r.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.name}</span>
        </div>
      ),
    },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'State',
      render: (r) => statusBadge(r.status),
    },
    {
      key: 'traffic_percentage',
      label: 'Rollout',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {Number(r.traffic_percentage || 0)}%
          </span>
          <div style={{
            width: 80,
            height: 4,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--card-alt)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              width: `${Math.max(0, Math.min(100, Number(r.traffic_percentage || 0)))}%`,
              background: 'var(--aurora-gradient)',
              backgroundSize: '200% 100%',
            }} />
          </div>
        </div>
      ),
    },
    {
      key: 'depends_on',
      label: 'Depends on',
      render: (r) =>
        r.depends_on && r.depends_on.length ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--foreground-2)' }}>
            {r.depends_on.join(', ')}
          </span>
        ) : (
          <span style={{ color: 'var(--muted-2)' }}>—</span>
        ),
    },
    {
      key: 'last_modified',
      label: 'Updated',
      render: (r) => (r.last_modified || '').substring(0, 10),
    },
  ]

  return (
    <PageShell>
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/productlist' }, { label: 'Feature flags' }]} />
      <header className='admin-header'>
        <h1>Feature flags</h1>
        <span className='count'>{features.length} flag{features.length === 1 ? '' : 's'}</span>
        <span className='spacer' />
        <input
          className='input'
          placeholder='Search flags'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label='Search feature flags'
        />
      </header>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Alert variant='info'>
          Changes to flags apply on next page load for end users. Edit flags through your MCP tools, not directly in the JSON.
        </Alert>
      </div>

      {loading ? (
        <div className='gs-loader'>Loading flags…</div>
      ) : error ? (
        <Alert variant='destructive'>{error}</Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filter ? 'No flags match this search.' : 'No flags defined yet.'}
          description={filter ? 'Try a different keyword.' : 'Flags will appear here once your backend registers them.'}
        />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r.key || r.name} caption='Feature flags' />
      )}
    </PageShell>
  )
}

export default FeatureFlagListScreen
