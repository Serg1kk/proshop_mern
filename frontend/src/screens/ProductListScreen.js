import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import DataTable from '../components/good-shop/DataTable'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import Badge from '../components/good-shop/Badge'
import EmptyState from '../components/good-shop/EmptyState'
import Placeholder from '../components/good-shop/Placeholder'
import PriceLockup from '../components/good-shop/PriceLockup'
import Modal from '../components/good-shop/Modal'
import {
  listProducts,
  deleteProduct,
  createProduct,
} from '../actions/productActions'
import { PRODUCT_CREATE_RESET } from '../constants/productConstants'

const tintFor = (key = '') => {
  const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const ProductListScreen = ({ history, match }) => {
  const pageNumber = match.params.pageNumber || 1
  const dispatch = useDispatch()
  const productList = useSelector((s) => s.productList)
  const { loading, error, products = [], page, pages } = productList
  const productDelete = useSelector((s) => s.productDelete)
  const {
    loading: loadingDelete,
    error: errorDelete,
    success: successDelete,
  } = productDelete
  const productCreate = useSelector((s) => s.productCreate)
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
    product: createdProduct,
  } = productCreate
  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  const [filter, setFilter] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET })
    if (!userInfo || !userInfo.isAdmin) {
      history.push('/login')
      return
    }
    if (successCreate) {
      history.push(`/admin/product/${createdProduct._id}/edit`)
    } else {
      dispatch(listProducts('', pageNumber))
    }
  }, [
    dispatch,
    history,
    userInfo,
    successDelete,
    successCreate,
    createdProduct,
    pageNumber,
  ])

  const filtered = useMemo(() => {
    if (!filter) return products
    const q = filter.toLowerCase()
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    )
  }, [products, filter])

  const columns = [
    {
      key: 'image',
      label: '',
      width: 60,
      render: (r) => (
        <div style={{ width: 48, height: 48 }}>
          <Placeholder
            tint={tintFor(r.name || '')}
            label={r.name}
            src={r.image}
            alt={r.name}
          />
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Product',
      render: (r) => (
        <Link to={`/product/${r._id}`} className='row-link'>
          {r.name}
        </Link>
      ),
    },
    { key: 'brand', label: 'Brand' },
    { key: 'category', label: 'Category' },
    {
      key: 'price',
      label: 'Price',
      align: 'right',
      render: (r) => <PriceLockup amount={Number(r.price)} currency='USD' />,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (r) => {
        const n = Number(r.countInStock)
        if (n === 0) return <Badge variant='destructive'>Sold out</Badge>
        if (n < 10) return <Badge variant='warning'>{n} left</Badge>
        return <Badge variant='success'>{n} in stock</Badge>
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'actions',
      render: (r) => (
        <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
          <Button
            to={`/admin/product/${r._id}/edit`}
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
      <Breadcrumb items={[{ label: 'Admin', to: '/admin/productlist' }, { label: 'Products' }]} />
      <header className='admin-header'>
        <h1>Products</h1>
        <span className='count'>{products.length} product{products.length === 1 ? '' : 's'}</span>
        <span className='spacer' />
        <input
          className='input'
          placeholder='Search by name, brand or category'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label='Search products'
        />
        <Button
          variant='primary'
          onClick={() => dispatch(createProduct())}
          loading={loadingCreate}
        >
          + Create product
        </Button>
      </header>

      {errorDelete && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Alert variant='destructive'>{errorDelete}</Alert>
        </div>
      )}
      {errorCreate && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Alert variant='destructive'>{errorCreate}</Alert>
        </div>
      )}
      {(loadingDelete) && <div className='gs-loader'>Deleting…</div>}

      {loading ? (
        <div className='gs-loader'>Loading products…</div>
      ) : error ? (
        <Alert variant='destructive'>{error}</Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filter ? 'No products match this search.' : 'No products yet.'}
          description={filter ? 'Try a different keyword.' : 'Create your first product to get started.'}
          action={filter ? <Button onClick={() => setFilter('')}>Clear search</Button> : null}
        />
      ) : (
        <>
          <DataTable columns={columns} rows={filtered} rowKey={(r) => r._id} caption='Products' />
          {pages > 1 && (
            <nav className='gs-pagination' aria-label='Pagination'>
              {[...Array(pages).keys()].map((x) => {
                const n = x + 1
                return (
                  <Link
                    key={n}
                    to={`/admin/productlist/${n}`}
                    className={n === page ? 'is-active' : ''}
                  >
                    {n}
                  </Link>
                )
              })}
            </nav>
          )}
        </>
      )}

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title='Delete this product?'
        actions={
          <>
            <Button variant='ghost' onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button
              variant='destructive'
              onClick={() => {
                dispatch(deleteProduct(pendingDelete._id))
                setPendingDelete(null)
              }}
            >
              Delete product
            </Button>
          </>
        }
      >
        <p>
          <strong>{pendingDelete?.name}</strong> will be removed from the catalog.
          This can't be undone.
        </p>
      </Modal>
    </PageShell>
  )
}

export default ProductListScreen
