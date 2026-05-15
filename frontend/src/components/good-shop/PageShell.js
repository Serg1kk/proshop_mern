import React, { useEffect, useState } from 'react'
import GsHeader from './GsHeader'
import GsFooter from './GsFooter'

const PageShell = ({ children, hideHeader = false, hideFooter = false, headerProps = {}, className = '' }) => {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.accent = 'royal'
  }, [])

  return (
    <div className={'gs-root ' + className}>
      <a className='gs-skip-link' href='#gs-main'>Skip to content</a>
      {!hideHeader && (
        <GsHeader
          query={query}
          onQuery={setQuery}
          focused={focused}
          onFocus={setFocused}
          {...headerProps}
        />
      )}
      <main id='gs-main' className='page'>
        {children}
      </main>
      {!hideFooter && <GsFooter />}
    </div>
  )
}

export default PageShell
