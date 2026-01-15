import React, { useState, useEffect } from 'react'
import UploadPdf from './UploadPdf'
import ExtractedData from './ExtractedData'
import DataTable from './DataTable'
import './styles.css'

function App() {
  const [contracts, setContracts] = useState([])
  const [selectedContract, setSelectedContract] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:8000/contracts/')
      const data = await response.json()
      setContracts(data)
      if (data.length > 0 && !selectedContract) {
        setSelectedContract(data[0])
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  const handleUploadComplete = (newContract) => {
    setContracts([newContract, ...contracts])
    setSelectedContract(newContract)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Grant Contract Analyzer</h1>
        <p>Upload PDF contracts to extract structured data using AI</p>
      </header>

      <div className="main-container">
        <div className="left-panel">
          <UploadPdf onUploadComplete={handleUploadComplete} setLoading={setLoading} />
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Processing PDF with AI...</p>
            </div>
          )}
        </div>

        <div className="right-panel">
          {selectedContract ? (
            <ExtractedData contract={selectedContract} />
          ) : (
            <div className="no-data">
              <h3>No contract selected</h3>
              <p>Upload a PDF to see extracted data here</p>
            </div>
          )}
        </div>
      </div>

      <div className="data-table-container">
        <h2>All Contracts</h2>
        <DataTable 
          contracts={contracts} 
          onSelectContract={setSelectedContract}
          selectedId={selectedContract?.id}
        />
      </div>
    </div>
  )
}

export default App