import React from 'react'

function ExtractedData({ contract }) {
  if (!contract) return null

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return dateStr
  }

  const renderJson = (data) => {
    if (!data) return 'N/A'
    return (
      <pre className="json-display">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  const fields = [
    { label: 'Contract Number', value: contract.contract_number || 'N/A', icon: '🔢' },
    { label: 'Grant Name', value: contract.grant_name || 'N/A', icon: '📋' },
    { label: 'Grantor', value: contract.grantor || 'N/A', icon: '🏢' },
    { label: 'Grantee', value: contract.grantee || 'N/A', icon: '👥' },
    { label: 'Total Amount', value: formatCurrency(contract.total_amount), icon: '💰' },
    { label: 'Start Date', value: formatDate(contract.start_date), icon: '📅' },
    { label: 'End Date', value: formatDate(contract.end_date), icon: '📅' },
    { label: 'Purpose', value: contract.purpose || 'N/A', icon: '🎯' },
  ]

  return (
    <div className="extracted-data">
      <div className="data-header">
        <h2>Extracted Contract Data</h2>
        <div className="file-info">
          <span className="filename">{contract.filename}</span>
          <span className="upload-date">
            Uploaded: {new Date(contract.uploaded_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="data-grid">
        {fields.map((field, index) => (
          <div key={index} className="data-card">
            <div className="data-icon">{field.icon}</div>
            <div className="data-content">
              <label>{field.label}</label>
              <div className="data-value">{field.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="json-sections">
        <div className="json-section">
          <h3>Payment Schedule</h3>
          {renderJson(contract.payment_schedule)}
        </div>
        <div className="json-section">
          <h3>Terms & Conditions</h3>
          {renderJson(contract.terms_conditions)}
        </div>
      </div>
    </div>
  )
}

export default ExtractedData