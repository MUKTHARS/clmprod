import React from 'react'
import ComprehensiveView from './ComprehensiveView'

function ExtractedData({ contractData }) {
  if (!contractData) {
    return (
      <div className="no-data">
        <h3>No contract selected</h3>
        <p>Select a contract from the table or upload a new PDF to see extracted data</p>
      </div>
    )
  }

  return <ComprehensiveView contractData={contractData} />
}

export default ExtractedData