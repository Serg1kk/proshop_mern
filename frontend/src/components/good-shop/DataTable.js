import React from 'react'

const DataTable = ({ columns, rows, rowKey = (r, i) => i, caption, emptyState }) => {
  if (!rows || rows.length === 0) {
    return emptyState || null
  }
  return (
    <div className='gs-table-shell'>
      <table className='gs-table'>
        {caption && (
          <caption style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: 1,
            height: 1,
          }}>{caption}</caption>
        )}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'col-num' : c.align === 'actions' ? 'col-actions' : undefined} style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)}>
              {columns.map((c) => (
                <td key={c.key} className={c.align === 'right' ? 'col-num' : c.align === 'actions' ? 'col-actions' : undefined}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
