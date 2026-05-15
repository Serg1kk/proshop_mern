import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import Placeholder from '../components/good-shop/Placeholder'
import Stars from '../components/good-shop/Stars'
import PriceLockup from '../components/good-shop/PriceLockup'
import Stepper from '../components/good-shop/Stepper'
import Button from '../components/good-shop/Button'
import Badge from '../components/good-shop/Badge'
import Alert from '../components/good-shop/Alert'
import EmptyState from '../components/good-shop/EmptyState'
import Field from '../components/good-shop/Field'
import Meta from '../components/Meta'
import {
  listProductDetails,
  createProductReview,
} from '../actions/productActions'
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants'

const tintFor = (key = '') => {
  const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')

  const dispatch = useDispatch()

  const productDetails = useSelector((s) => s.productDetails)
  const { loading, error, product } = productDetails

  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin

  const productReviewCreate = useSelector((s) => s.productReviewCreate)
  const {
    success: successProductReview,
    loading: loadingProductReview,
    error: errorProductReview,
  } = productReviewCreate

  useEffect(() => {
    if (successProductReview) {
      setRating('')
      setComment('')
    }
    if (!product._id || product._id !== match.params.id) {
      dispatch(listProductDetails(match.params.id))
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, match, successProductReview])

  const addToCartHandler = () => {
    history.push(`/cart/${match.params.id}?qty=${qty}`)
  }

  const submitHandler = (e) => {
    e.preventDefault()
    if (!rating) return
    dispatch(
      createProductReview(match.params.id, {
        rating: Number(rating),
        comment,
      })
    )
  }

  const inStock = product && Number(product.countInStock) > 0
  const lowStock = inStock && Number(product.countInStock) <= 5

  return (
    <PageShell>
      <Meta title={product?.name || 'Product'} />

      {loading ? (
        <div className='gs-loader'>Loading product…</div>
      ) : error ? (
        <Alert variant='destructive'>{error}</Alert>
      ) : !product?._id ? (
        <EmptyState
          title='Product not found'
          description='It may have been removed or the link is wrong.'
          action={<Button to='/'>Browse all products</Button>}
        />
      ) : (
        <>
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: product.category || 'Catalog', to: `/search/${encodeURIComponent(product.category || '')}` },
              { label: product.brand || 'Brand' },
              { label: product.name },
            ]}
          />

          <div className='pdp-grid'>
            <section>
              <div className='pdp-gallery'>
                <Placeholder
                  tint={tintFor(product.category || product.brand || product.name)}
                  label={product.name}
                  src={product.image}
                  alt={product.name}
                />
              </div>

              <div style={{ marginTop: 'var(--space-5)' }}>
                <h2 style={{ marginBottom: 'var(--space-3)' }}>About this product</h2>
                <p className='pdp-desc'>{product.description || 'No description provided yet.'}</p>
              </div>

              <div style={{ marginTop: 'var(--space-6)' }}>
                <div className='section-head'>
                  <h2 style={{ fontSize: 24 }}>Reviews</h2>
                  <span className='count' style={{ color: 'var(--muted)', fontSize: 14 }}>
                    {product.reviews?.length || 0} total · {Number(product.rating || 0).toFixed(1)} ★ average
                  </span>
                </div>

                {product.reviews && product.reviews.length > 0 ? (
                  <div className='review-grid'>
                    {product.reviews.map((review) => (
                      <article key={review._id} className='review-card'>
                        <div className='rc-head'>
                          <span className='rc-name'>{review.name}</span>
                          <Stars value={Number(review.rating || 0)} />
                        </div>
                        <span className='rc-date'>{(review.createdAt || '').substring(0, 10)}</span>
                        <p className='rc-comment'>{review.comment}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Alert variant='info'>No reviews yet. Be the first to leave one.</Alert>
                )}

                <div style={{ marginTop: 'var(--space-5)' }}>
                  <h3 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Write a review</h3>
                  {successProductReview && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <Alert variant='success'>Thanks — your review is live.</Alert>
                    </div>
                  )}
                  {errorProductReview && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <Alert variant='destructive'>{errorProductReview}</Alert>
                    </div>
                  )}
                  {userInfo ? (
                    <form onSubmit={submitHandler}>
                      <div className='form-grid is-2col' style={{ marginBottom: 'var(--space-3)' }}>
                        <Field
                          as='select'
                          label='Rating'
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          required
                        >
                          <option value=''>Select…</option>
                          <option value='1'>1 — Poor</option>
                          <option value='2'>2 — Fair</option>
                          <option value='3'>3 — Good</option>
                          <option value='4'>4 — Very good</option>
                          <option value='5'>5 — Excellent</option>
                        </Field>
                      </div>
                      <Field
                        as='textarea'
                        label='Comment'
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder='What did you think of the fabric, fit and shipping?'
                      />
                      <div style={{ marginTop: 'var(--space-3)' }}>
                        <Button
                          type='submit'
                          variant='primary'
                          size='lg'
                          loading={loadingProductReview}
                          disabled={!rating}
                        >
                          Post review
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Alert variant='info'>
                      <Link to='/login'>Sign in</Link> to leave a review.
                    </Alert>
                  )}
                </div>
              </div>
            </section>

            <aside className='aurora-border is-subtle' style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className='purchase-card'>
                <div>
                  <div className='pdp-brand'>{product.brand || 'Good Shop'}</div>
                  <h1 className='pdp-title'>{product.name}</h1>
                  <div className='pdp-meta-row'>
                    <Stars value={Number(product.rating || 0)} count={product.numReviews} />
                    {inStock ? (
                      lowStock ? (
                        <Badge variant='warning'>Only {product.countInStock} left</Badge>
                      ) : (
                        <Badge variant='success'>In stock</Badge>
                      )
                    ) : (
                      <Badge variant='destructive'>Sold out</Badge>
                    )}
                  </div>
                  <div style={{ margin: 'var(--space-3) 0' }}>
                    <PriceLockup amount={product.price} currency='USD' size='lg' />
                  </div>
                </div>

                {inStock && (
                  <div className='pc-row'>
                    <span>Quantity</span>
                    <Stepper
                      value={qty}
                      onChange={setQty}
                      min={1}
                      max={Number(product.countInStock)}
                    />
                  </div>
                )}

                <Button
                  variant='primary'
                  size='lg'
                  block
                  disabled={!inStock}
                  onClick={addToCartHandler}
                >
                  {inStock ? 'Add to cart' : 'Sold out'}
                </Button>

                <p className='pc-row' style={{ fontSize: 12, color: 'var(--muted)' }}>
                  <span>Free returns within 30 days</span>
                  <span>·</span>
                  <span>Ships from Good Shop</span>
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </PageShell>
  )
}

export default ProductScreen
