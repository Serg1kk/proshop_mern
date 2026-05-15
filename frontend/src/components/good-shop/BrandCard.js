import React from 'react'
import Placeholder from './Placeholder'
import Stars from './Stars'

const TINTS = ['rose', 'violet', 'sky', 'mint', 'amber', 'slate', 'indigo', 'coral']
const tintFor = (key) => {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

const BrandCard = ({ name, productCount, onSelect }) => (
  <button
    type='button'
    className='brand-card'
    onClick={onSelect}
    aria-label={`Browse ${name}`}
  >
    <div className='b-thumb'>
      <Placeholder tint={tintFor(name)} label='logo' />
    </div>
    <div className='b-info'>
      <div className='b-name'>{name}</div>
      <div className='b-meta'>
        <Stars value={5} count={productCount ? `${productCount}` : null} />
        <span className='visit-shop'>Visit shop</span>
      </div>
    </div>
  </button>
)

export default BrandCard
