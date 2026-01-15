import React from 'react'

function DataTable({ contracts, onSelectContract, selectedId }) {
  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Filename</th>
            <th>Grant Name</th>
            <th>Grantor</th>
            <th>Grantee</th>
            <th>Amount</th>
            <th>Upload Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr 
              key={contract.id} 
              onClick={() => onSelectContract(contract)}
              className={`table-row ${selectedId === contract.id ? 'selected' : ''}`}
            >
              <td>{contract.id}</td>
              <td className="filename-cell">{contract.filename}</td>
              <td>{contract.grant_name || '-'}</td>
              <td>{contract.grantor || '-'}</td>
              <td>{contract.grantee || '-'}</td>
              <td className="amount-cell">{formatCurrency(contract.total_amount)}</td>
              <td>{new Date(contract.uploaded_at).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge ${contract.status}`}>
                  {contract.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {contracts.length === 0 && (
        <div className="empty-table">
          <p>No contracts uploaded yet. Upload a PDF to get started.</p>
        </div>
      )}
    </div>
  )
}

export default DataTable