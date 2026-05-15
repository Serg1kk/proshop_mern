import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageShell from '../components/good-shop/PageShell'
import Breadcrumb from '../components/good-shop/Breadcrumb'
import FormShell, { FormSection } from '../components/good-shop/FormShell'
import Field from '../components/good-shop/Field'
import Button from '../components/good-shop/Button'
import Alert from '../components/good-shop/Alert'
import Placeholder from '../components/good-shop/Placeholder'
import Stars from '../components/good-shop/Stars'
import PriceLockup from '../components/good-shop/PriceLockup'
import { listProductDetails, updateProduct } from '../actions/productActions'
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants'
import store from '../store'

const tintFor = (key = '') => {
  const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const ProductEditScreen = ({ match, history }) => {
  const productId = match.params.id

  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [image, setImage] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [countInStock, setCountInStock] = useState(0)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const dispatch = useDispatch()
  const productDetails = useSelector((s) => s.productDetails)
  const { loading, error, product } = productDetails
  const productUpdate = useSelector((s) => s.productUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET })
      history.push('/admin/productlist')
    } else {
      if (!product.name || product._id !== productId) {
        dispatch(listProductDetails(productId))
      } else {
        setName(product.name)
        setPrice(product.price)
        setImage(product.image)
        setBrand(product.brand)
        setCategory(product.category)
        setCountInStock(product.countInStock)
        setDescription(product.description)
      }
    }
  }, [dispatch, history, productId, product, successUpdate])

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)
    setUploading(true)
    try {
      const { userLogin: { userInfo } } = store.getState()
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: userInfo ? `Bearer ${userInfo.token}` : undefined,
        },
      }
      const { data } = await axios.post('/api/upload', formData, config)
      setImage(data)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        image,
        brand,
        category,
        description,
        countInStock,
      })
    )
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Admin', to: '/admin/productlist' },
          { label: 'Products', to: '/admin/productlist' },
          { label: name || 'Edit product' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)', gap: 'var(--space-5)', alignItems: 'flex-start' }} className='product-edit-grid'>
        <section>
          {(error || errorUpdate) && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <Alert variant='destructive'>{error || errorUpdate}</Alert>
            </div>
          )}
          {loading ? (
            <div className='gs-loader'>Loading…</div>
          ) : (
            <FormShell title={name ? `Editing ${name}` : 'Edit product'} subtitle='Changes apply immediately after saving.' width='wide'>
              <form onSubmit={submitHandler}>
                <FormSection title='Identity'>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Field label='Name' value={name} onChange={(e) => setName(e.target.value)} required />
                    <div className='form-grid is-2col'>
                      <Field label='Brand' value={brand} onChange={(e) => setBrand(e.target.value)} />
                      <Field label='Category' value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                  </div>
                </FormSection>

                <FormSection title='Pricing &amp; stock'>
                  <div className='form-grid is-2col'>
                    <Field
                      label='Price (USD)'
                      type='number'
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step='0.01'
                      min='0'
                    />
                    <Field
                      label='Count in stock'
                      type='number'
                      value={countInStock}
                      onChange={(e) => setCountInStock(e.target.value)}
                      min='0'
                    />
                  </div>
                </FormSection>

                <FormSection title='Media'>
                  <Field
                    label='Image URL'
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    hint='Or upload a file below.'
                  />
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <label className='btn is-outline' style={{ cursor: 'pointer' }}>
                      {uploading ? 'Uploading…' : 'Choose image file'}
                      <input
                        type='file'
                        onChange={uploadFileHandler}
                        accept='image/*'
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
                      />
                    </label>
                  </div>
                </FormSection>

                <FormSection title='Description'>
                  <Field
                    as='textarea'
                    label='Description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                  />
                </FormSection>

                <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                  <Button to='/admin/productlist' variant='ghost'>Cancel</Button>
                  <Button type='submit' variant='primary' loading={loadingUpdate}>Save changes</Button>
                </div>
              </form>
            </FormShell>
          )}
        </section>

        <aside style={{ position: 'sticky', top: 120 }}>
          <h3 style={{ fontSize: 16, marginBottom: 'var(--space-3)' }}>Live preview</h3>
          <article className='product-card' style={{ pointerEvents: 'none' }}>
            <div className='img-frame'>
              <Placeholder
                tint={tintFor(category || brand || name)}
                label={name || 'Product preview'}
                src={image}
                alt={name}
              />
            </div>
            <h3 className='title'>{name || '—'}</h3>
            <div className='rating-row'>
              <Stars value={Number(product?.rating || 0)} count={product?.numReviews} />
            </div>
            <PriceLockup amount={Number(price || 0)} currency='USD' />
          </article>
          <p style={{ marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--muted)' }}>
            This is how your product appears on the home page.
          </p>
        </aside>
      </div>
    </PageShell>
  )
}

export default ProductEditScreen
