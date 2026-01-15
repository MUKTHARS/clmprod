import React, { useState, useEffect } from 'react'
import UploadPdf from './UploadPdf'
import ExtractedData from './ExtractedData'
import DataTable from './DataTable'
import './styles.css'

function App() {
  const [contracts, setContracts] = useState([])
  const [selectedContract, setSelectedContract] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedContractData, setSelectedContractData] = useState(null)

  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:8000/contracts/')
      const data = await response.json()
      setContracts(data)
      if (data.length > 0 && !selectedContract) {
        setSelectedContract(data[0])
        fetchComprehensiveData(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  const fetchComprehensiveData = async (contractId) => {
    try {
      const response = await fetch(`http://localhost:8000/contracts/${contractId}/comprehensive`)
      const data = await response.json()
      setSelectedContractData(data)
    } catch (error) {
      console.error('Error fetching comprehensive data:', error)
      // Fallback to basic contract data
      const contract = contracts.find(c => c.id === contractId)
      setSelectedContractData({
        contract_id: contractId,
        filename: contract.filename,
        comprehensive_data: contract.comprehensive_data || {},
        basic_data: {
          contract_number: contract.contract_number,
          grant_name: contract.grant_name,
          grantor: contract.grantor,
          grantee: contract.grantee,
          total_amount: contract.total_amount,
          start_date: contract.start_date,
          end_date: contract.end_date,
          purpose: contract.purpose
        }
      })
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  const handleUploadComplete = async (newContract) => {
    setContracts([newContract, ...contracts])
    setSelectedContract(newContract)
    await fetchComprehensiveData(newContract.id)
  }

  const handleSelectContract = async (contract) => {
    setSelectedContract(contract)
    await fetchComprehensiveData(contract.id)
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
          {selectedContractData ? (
            <ExtractedData contractData={selectedContractData} />
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
          onSelectContract={handleSelectContract}
          selectedId={selectedContract?.id}
        />
      </div>
    </div>
  )
}

export default App