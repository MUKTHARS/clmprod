import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComprehensiveView from './ComprehensiveView';
import API_CONFIG, { fetchAPI } from './config';

function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    contractDetails: false,
    partiesInfo: false
  });
  
  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      fetchContractData();
    } else {
      console.error('Invalid contract ID:', id);
      setLoading(false);
    }
  }, [id]);

  const fetchContractData = async () => {
    const contractId = parseInt(id);
    if (!contractId || isNaN(contractId)) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Try comprehensive endpoint first
      const comprehensiveUrl = API_CONFIG.ENDPOINTS.COMPREHENSIVE(contractId);
      const response = await fetch(comprehensiveUrl);
      
      if (response.ok) {
        const data = await response.json();
        // Ensure contract_id is properly set
        if (data && !data.contract_id) {
          data.contract_id = contractId;
        }
        setContractData(data);
      } else {
        // Fallback to basic endpoint
        await fetchBasicContractData(contractId);
      }
    } catch (error) {
      console.error('Error fetching contract data:', error);
      await fetchBasicContractData(contractId);
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicContractData = async (contractId) => {
    try {
      const basicUrl = API_CONFIG.ENDPOINTS.CONTRACT_BY_ID(contractId);
      const response = await fetch(basicUrl);
      
      if (response.ok) {
        const basicData = await response.json();
        setContractData({
          contract_id: contractId,
          filename: basicData.filename || 'Unknown',
          basic_data: basicData,
          comprehensive_data: basicData.comprehensive_data || {}
        });
      }
    } catch (error) {
      console.error('Fallback fetch failed:', error);
      setContractData(null);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contract?')) {
      return;
    }
    
    try {
      const contractId = parseInt(id);
      const response = await fetch(API_CONFIG.ENDPOINTS.CONTRACT_BY_ID(contractId), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to delete contract');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Error deleting contract');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to render structured field with label and value
  const renderField = (label, value, type = 'text') => {
    if (!value && value !== 0) return null;
    
    let displayValue = value;
    if (type === 'date' && value) {
      try {
        displayValue = new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        displayValue = value;
      }
    } else if (type === 'currency' && (value || value === 0)) {
      displayValue = formatCurrency(value);
    } else if (type === 'array' && Array.isArray(value)) {
      if (value.length === 0) return null;
      return (
        <div className="structured-field array-field">
          <label className="field-label">{label}:</label>
          <div className="array-values">
            {value.map((item, idx) => (
              <div key={idx} className="array-item">
                {item}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="structured-field">
        <label className="field-label">{label}:</label>
        <span className="field-value">{displayValue}</span>
      </div>
    );
  };

  // Add loading state
  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading contract details...</p>
        {!id && <p style={{color: 'red'}}>Error: No contract ID provided</p>}
      </div>
    );
  }

  if (!id || isNaN(parseInt(id))) {
    return (
      <div className="error-page">
        <h2>Invalid Contract ID</h2>
        <p>No valid contract ID was provided in the URL.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="error-page">
        <h2>Contract Not Found</h2>
        <p>The contract with ID {id} could not be found.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Extract comprehensive data
  const compData = contractData.comprehensive_data || contractData;
  const contractDetails = compData.contract_details || {};
  const parties = compData.parties || {};

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
  <h2>{parties.grantor?.organization_name || contractData.filename}</h2>
  <div className="contract-ids">
    {/* Display the most relevant ID */}
    {contractData.investment_id && (
      <span className="contract-id-badge investment-id">
        INV: {contractData.investment_id}
      </span>
    )}
    {contractData.project_id && (
      <span className="contract-id-badge project-id">
        PRJ: {contractData.project_id}
      </span>
    )}
    {contractData.grant_id && (
      <span className="contract-id-badge grant-id">
        GRANT: {contractData.grant_id}
      </span>
    )}
    {/* Fallback to database ID if no reference IDs found */}
    {!contractData.investment_id && !contractData.project_id && !contractData.grant_id && (
      <span className="contract-id">DB ID: #{contractData.contract_id}</span>
    )}
  </div>
</div>
          
          <div className="contract-stats">
            <div className="stat">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">
                {formatCurrency(compData.financial_details?.total_grant_amount)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Grantor</span>
              <span className="stat-value">{parties.grantor?.organization_name || 'N/A'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Grantee</span>
              <span className="stat-value">{parties.grantee?.organization_name || 'N/A'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Status</span>
              <span className="stat-value status-active">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="details-layout">
        <div className="main-content">
          <ComprehensiveView contractData={contractData} />
        </div>
        
        <div className="sidebar">
          {/* Collapsible Contract Details Section */}
          <div className="collapsible-section">
            <div 
              className="section-header collapsible-header"
              onClick={() => toggleSection('contractDetails')}
            >
              <h3 className="collapsible-title">
                Contract Details
              </h3>
              <span className="collapsible-icon">
                {expandedSections.contractDetails ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.contractDetails && (
              <div className="collapsible-content structured-details">
                {renderField('Contract Name', contractDetails.grant_name)}
                {renderField('Contract Number', contractDetails.contract_number)}
                {renderField('Grant Reference', contractDetails.grant_reference)}
                {renderField('Agreement Type', contractDetails.agreement_type)}
                {renderField('Effective Date', contractDetails.effective_date, 'date')}
                {renderField('Signature Date', contractDetails.signature_date, 'date')}
                {renderField('Start Date', contractDetails.start_date, 'date')}
                {renderField('End Date', contractDetails.end_date, 'date')}
                {renderField('Duration', contractDetails.duration)}
                {renderField('Purpose', contractDetails.purpose)}
                {renderField('Geographic Scope', contractDetails.geographic_scope)}
                {renderField('Objectives', contractDetails.objectives, 'array')}
                
                {contractDetails.scope_of_work && (
                  <div className="structured-field text-field">
                    <label className="field-label">Scope of Work:</label>
                    <div className="field-value text-content">
                      {contractDetails.scope_of_work}
                    </div>
                  </div>
                )}
                
                {contractDetails.risk_management && (
                  <div className="structured-field text-field">
                    <label className="field-label">Risk Management:</label>
                    <div className="field-value text-content">
                      {contractDetails.risk_management}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Collapsible Parties Information Section */}
          <div className="collapsible-section">
            <div 
              className="section-header collapsible-header"
              onClick={() => toggleSection('partiesInfo')}
            >
              <h3 className="collapsible-title">
                Parties Information
              </h3>
              <span className="collapsible-icon">
                {expandedSections.partiesInfo ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.partiesInfo && (
              <div className="collapsible-content structured-details">
                {/* Grantor Information */}
                <div className="party-section">
                  <h4 className="party-title">Grantor</h4>
                  <div className="party-details">
                    {renderField('Organization', parties.grantor?.organization_name)}
                    {renderField('Address', parties.grantor?.address)}
                    {renderField('Contact Person', parties.grantor?.contact_person)}
                    {renderField('Email', parties.grantor?.email)}
                    {renderField('Phone', parties.grantor?.phone)}
                    {renderField('Signatory', parties.grantor?.signatory_name)}
                    {renderField('Signatory Title', parties.grantor?.signatory_title)}
                    {renderField('Signature Date', parties.grantor?.signature_date, 'date')}
                  </div>
                </div>
                
                {/* Grantee Information */}
                <div className="party-section">
                  <h4 className="party-title">Grantee</h4>
                  <div className="party-details">
                    {renderField('Organization', parties.grantee?.organization_name)}
                    {renderField('Address', parties.grantee?.address)}
                    {renderField('Contact Person', parties.grantee?.contact_person)}
                    {renderField('Email', parties.grantee?.email)}
                    {renderField('Phone', parties.grantee?.phone)}
                    {renderField('Signatory', parties.grantee?.signatory_name)}
                    {renderField('Signatory Title', parties.grantee?.signatory_title)}
                    {renderField('Signature Date', parties.grantee?.signature_date, 'date')}
                  </div>
                </div>
                
                {/* Other Parties */}
                {parties.other_parties && parties.other_parties.length > 0 && (
                  <div className="party-section">
                    <h4 className="party-title">Other Parties</h4>
                    {parties.other_parties.map((party, index) => (
                      <div key={index} className="other-party">
                        {renderField('Role', party.role)}
                        {renderField('Name', party.name)}
                        {renderField('Details', party.details)}
                        {renderField('Signatory', party.signatory_name)}
                        {renderField('Signature Date', party.signature_date, 'date')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Contract Actions Panel - Keep this as is */}
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
      </div>
    </div>
  );
}

export default ContractDetailsPage;