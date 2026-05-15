import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import GsHeader from '../components/good-shop/GsHeader'
import GsFooter from '../components/good-shop/GsFooter'
import HeroBanner from '../components/good-shop/HeroBanner'
import FilterChip from '../components/good-shop/FilterChip'
import BrandCard from '../components/good-shop/BrandCard'
import ProductCard from '../components/good-shop/ProductCard'
import Meta from '../components/Meta'
import { listProducts } from '../actions/productActions'

const PRICE_BUCKETS = ['Under 50', '50–200', '200–1000', '1000+']
const RATING_BUCKETS = ['4★ & up', '3★ & up', '2★ & up']
const SORTS = ['Featured', 'Price: low to high', 'Price: high to low', 'Top rated']

const priceBucket = (price) => {
  const p = Number(price)
  if (p < 50) return 'Under 50'
  if (p < 200) return '50–200'
  if (p < 1000) return '200–1000'
  return '1000+'
}
const ratingMatchesBucket = (rating, bucket) => {
  const r = Number(rating || 0)
  if (bucket === '4★ & up') return r >= 4
  if (bucket === '3★ & up') return r >= 3
  if (bucket === '2★ & up') return r >= 2
  return true
}

const HomeScreen = ({ match }) => {
  const keyword = match?.params?.keyword
  const pageNumber = match?.params?.pageNumber || 1

  const dispatch = useDispatch()
  const productList = useSelector((s) => s.productList)
  const { loading, error, products = [], page, pages } = productList

  const [query, setQuery] = useState(keyword || '')
  const [searchFocused, setSearchFocused] = useState(false)
  const [filters, setFilters] = useState({
    category: [],
    rating: [],
    brand: [],
    price: [],
  })
  const [sort, setSort] = useState('Featured')
  const [liked, setLiked] = useState(new Set())

  useEffect(() => {
    document.documentElement.dataset.accent = 'royal'
    document.documentElement.dataset.density = 'comfortable'
  }, [])

  useEffect(() => {
    dispatch(listProducts(keyword || '', pageNumber))
  }, [dispatch, keyword, pageNumber])

  useEffect(() => {
    setQuery(keyword || '')
  }, [keyword])

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products]
  )
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  )
  const brandProductCount = useMemo(() => {
    const map = {}
    products.forEach((p) => {
      if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1
    })
    return map
  }, [products])

  const filtered = useMemo(() => {
    let out = products.filter((p) => {
      if (filters.category.length && !filters.category.includes(p.category))
        return false
      if (filters.brand.length && !filters.brand.includes(p.brand)) return false
      if (filters.price.length && !filters.price.includes(priceBucket(p.price)))
        return false
      if (
        filters.rating.length &&
        !filters.rating.some((b) => ratingMatchesBucket(p.rating, b))
      )
        return false
      return true
    })
    switch (sort) {
      case 'Price: low to high':
        out = [...out].sort((a, b) => Number(a.price) - Number(b.price))
        break
      case 'Price: high to low':
        out = [...out].sort((a, b) => Number(b.price) - Number(a.price))
        break
      case 'Top rated':
        out = [...out].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        break
      default:
        break
    }
    return out
  }, [products, filters, sort])

  const totalActiveFilters = Object.values(filters).reduce((n, arr) => n + arr.length, 0)

  const clearAll = () =>
    setFilters({ category: [], rating: [], brand: [], price: [] })

  const toggleLike = (id) =>
    setLiked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className='gs-root'>
      <Meta />
      <a className='gs-skip-link' href='#gs-main'>Skip to content</a>

      <GsHeader
        query={query}
        onQuery={setQuery}
        focused={searchFocused}
        onFocus={setSearchFocused}
      />

      <main id='gs-main' className='page'>
        <HeroBanner />

        <div className='filter-bar' role='toolbar' aria-label='Product filters'>
          <FilterChip
            label='Category'
            options={categories}
            selected={filters.category}
            onChange={(v) => setFilters({ ...filters, category: v })}
          />
          <FilterChip
            label='Brand'
            options={brands}
            selected={filters.brand}
            onChange={(v) => setFilters({ ...filters, brand: v })}
          />
          <FilterChip
            label='Rating'
            options={RATING_BUCKETS}
            selected={filters.rating}
            onChange={(v) => setFilters({ ...filters, rating: v })}
          />
          <FilterChip
            label='Price'
            options={PRICE_BUCKETS}
            selected={filters.price}
            onChange={(v) => setFilters({ ...filters, price: v })}
          />
          <FilterChip
            label='Sort by'
            options={SORTS}
            selected={sort}
            onChange={(v) => setSort(v || 'Featured')}
            multi={false}
          />
          {totalActiveFilters > 0 && (
            <button
              type='button'
              className='chip'
              onClick={clearAll}
              style={{ color: 'var(--destructive)' }}
            >
              Clear all ({totalActiveFilters})
            </button>
          )}
        </div>

        {brands.length > 0 && (
          <section className='section'>
            <div className='section-head'>
              <h3>Stores</h3>
              <button type='button' className='view-all'>
                View All <span aria-hidden='true'>›</span>
              </button>
            </div>
            <div className='brand-strip'>
              {brands.map((b) => (
                <BrandCard
                  key={b}
                  name={b}
                  productCount={brandProductCount[b]}
                  onSelect={() => setFilters({ ...filters, brand: [b] })}
                />
              ))}
            </div>
          </section>
        )}

        <section className='section'>
          <div className='section-head'>
            <h3>{keyword ? `Results for "${keyword}"` : 'Latest products'}</h3>
            {keyword && (
              <Link to='/' className='view-all'>
                Go back <span aria-hidden='true'>›</span>
              </Link>
            )}
          </div>

          {loading ? (
            <div className='gs-loader'>Loading products…</div>
          ) : error ? (
            <div className='gs-error'>{error}</div>
          ) : (
            <>
              <div className='result-meta'>
                <span className='count'>
                  Showing <strong>{filtered.length}</strong> of {products.length}
                  {totalActiveFilters > 0 &&
                    ` · ${totalActiveFilters} filter${
                      totalActiveFilters > 1 ? 's' : ''
                    } applied`}
                </span>
                <span className='count'>
                  Sort: <strong style={{ color: 'var(--foreground)' }}>{sort}</strong>
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className='product-grid'>
                  <div className='empty-state'>
                    <h3>No products match these filters</h3>
                    <p>Try removing a filter or browsing a different category.</p>
                    <button type='button' className='btn is-primary' onClick={clearAll}>
                      Clear all filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className='product-grid'>
                  {filtered.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      isLiked={liked.has(p._id)}
                      onToggleLike={toggleLike}
                    />
                  ))}
                </div>
              )}

              {pages > 1 && (
                <nav className='gs-pagination' aria-label='Pagination'>
                  {[...Array(pages).keys()].map((x) => {
                    const n = x + 1
                    const to = keyword
                      ? `/search/${keyword}/page/${n}`
                      : `/page/${n}`
                    return (
                      <Link
                        key={n}
                        to={to}
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
        </section>
      </main>

      <GsFooter />
    </div>
  )
}

export default HomeScreen
