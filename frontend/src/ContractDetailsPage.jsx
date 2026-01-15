import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComprehensiveView from './ComprehensiveView';

function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarContracts, setSimilarContracts] = useState([]);

  useEffect(() => {
    fetchContractData();
    fetchSimilarContracts();
  }, [id]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/contracts/${id}/comprehensive`);
      const data = await response.json();
      setContractData(data);
    } catch (error) {
      console.error('Error fetching contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarContracts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/contracts/${id}/similar?n_results=3`);
      const data = await response.json();
      setSimilarContracts(data.similar_contracts || []);
    } catch (error) {
      console.error('Error fetching similar contracts:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        await fetch(`http://localhost:8000/contracts/${id}`, {
          method: 'DELETE'
        });
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting contract:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading contract details...</p>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="error-page">
        <h2>Contract not found</h2>
        <p>The requested contract could not be found.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="contract-details-page">
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Contract Details</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/upload')}
          >
            Upload New
          </button>
          <button 
            className="btn-danger"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="contract-header-card">
        <div className="contract-basic-info">
          <div className="contract-title">
            <h2>{contractData.filename}</h2>
            <span className="contract-id">ID: #{contractData.contract_id}</span>
          </div>
          
          <div className="contract-stats">
            <div className="stat">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">
                {formatCurrency(contractData.basic_data?.total_amount)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Grantor</span>
              <span className="stat-value">{contractData.basic_data?.grantor || 'N/A'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Start Date</span>
              <span className="stat-value">{contractData.basic_data?.start_date || 'N/A'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">End Date</span>
              <span className="stat-value">{contractData.basic_data?.end_date || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="details-layout">
        <div className="main-content">
          <ComprehensiveView contractData={contractData} />
        </div>
        
        {similarContracts.length > 0 && (
          <div className="sidebar">
            <div className="similar-contracts">
              <h3>Similar Contracts</h3>
              {similarContracts.map((item, index) => (
                <div key={index} className="similar-contract">
                  <div className="similar-header">
                    <h4>{item.contract.grant_name || 'Unnamed Grant'}</h4>
                    <span className="similarity-score">
                      {(item.similarity_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p><strong>Amount:</strong> {formatCurrency(item.contract.total_amount)}</p>
                  <p><strong>Grantor:</strong> {item.contract.grantor || 'N/A'}</p>
                  <button 
                    className="btn-small"
                    onClick={() => navigate(`/contracts/${item.contract.id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
            
            <div className="contract-actions-panel">
              <h3>Actions</h3>
              <button className="btn-action">
                📊 Generate Report
              </button>
              <button className="btn-action">
                📅 Add to Calendar
              </button>
              <button className="btn-action">
                📧 Share Contract
              </button>
              <button className="btn-action">
                🔍 Search Similar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractDetailsPage;