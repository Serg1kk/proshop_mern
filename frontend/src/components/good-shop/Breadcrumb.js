import React from 'react'
import { Link } from 'react-router-dom'

const Breadcrumb = ({ items = [] }) => (
  <nav className='breadcrumb' aria-label='Breadcrumb'>
    {items.map((item, i) => {
      const isLast = i === items.length - 1
      return (
        <React.Fragment key={i}>
          {isLast ? (
            <span aria-current='page'>{item.label}</span>
          ) : item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
          {!isLast && <span className='crumb-sep' aria-hidden='true'>›</span>}
        </React.Fragment>
      )
    })}
  </nav>
)

export default Breadcrumb
