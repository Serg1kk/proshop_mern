import React from 'react'
import { Link } from 'react-router-dom'
import Placeholder from './Placeholder'
import Stars from './Stars'
import PriceLockup from './PriceLockup'
import HeartIcon from './HeartIcon'

const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']

const tintFor = (key) => {
  if (!key) return 'slate'
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const ProductCard = ({ product, isLiked, onToggleLike }) => {
  const handleHeart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleLike) onToggleLike(product._id)
  }

  return (
    <Link className='product-card' to={`/product/${product._id}`}>
      <div className='img-frame'>
        <Placeholder
          tint={tintFor(product.category || product.brand || product.name)}
          label={product.name}
          src={product.image}
          alt={product.name}
        />
        {onToggleLike && (
          <button
            type='button'
            className={'heart-btn' + (isLiked ? ' is-on' : '')}
            aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isLiked}
            onClick={handleHeart}
          >
            <HeartIcon filled={isLiked} />
          </button>
        )}
      </div>
      <h3 className='title'>{product.name}</h3>
      <div className='rating-row'>
        <Stars value={product.rating || 0} count={product.numReviews} />
      </div>
      <PriceLockup amount={product.price} currency='USD' />
    </Link>
  )
}

export default ProductCard
