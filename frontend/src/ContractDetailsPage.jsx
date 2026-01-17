import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComprehensiveView from './ComprehensiveView';
import API_CONFIG, { fetchAPI } from './config';
import './styles/ContractDetailsPage.css';

function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    contractDetails: true,
    partiesInfo: false,
    financialDetails: false,
    deliverables: false,
    terms: false,
    compliance: false
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
  const financial = compData.financial_details || {};
  const deliverables = compData.deliverables || {};
  const terms = compData.terms_conditions || {};
  const compliance = compData.compliance || {};

  return (
    <div className="contract-details-page">
      <div className="page-header">
        <div className="header-left">
          {/* <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button> */}
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
              {!contractData.investment_id && !contractData.project_id && !contractData.grant_id && (
                <span className="contract-id">DB ID: #{contractData.contract_id}</span>
              )}
            </div>
          </div>
          
          <div className="contract-stats">
            <div className="stat">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">
                {formatCurrency(financial?.total_grant_amount)}
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

      {/* Action Buttons Bar */}
      <div className="actions-bar">
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

      {/* Summary Card */}
      {compData.summary?.executive_summary && (
        <div className="summary-card">
          <h3>Executive Summary</h3>
          <p>{compData.summary.executive_summary}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="key-metrics">
        <div className="metric-card">
          <div className="metric-value">
            {formatCurrency(financial?.total_grant_amount)}
          </div>
          <div className="metric-label">Total Value</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {contractDetails.duration || 'N/A'}
          </div>
          <div className="metric-label">Duration</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {deliverables?.items?.length || 0}
          </div>
          <div className="metric-label">Deliverables</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {financial?.payment_schedule?.installments?.length || 0}
          </div>
          <div className="metric-label">Installments</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="details-tabs">
        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Contract Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            Financial
          </button>
          <button 
            className={`tab-btn ${activeTab === 'comprehensive' ? 'active' : ''}`}
            onClick={() => setActiveTab('comprehensive')}
          >
            Comprehensive View
          </button>
        </div>
        
        <div className="tabs-content">
          {activeTab === 'overview' && (
            <div className="collapsible-sections-container">
              
              {/* Contract Details Section */}
              <div className={`collapsible-section ${expandedSections.contractDetails ? 'open' : ''}`}>
                <div 
                  className="collapsible-header"
                  onClick={() => toggleSection('contractDetails')}
                >
                  <div className="collapsible-header-content">
                    <div className="collapsible-icon">📋</div>
                    <h3 className="collapsible-title">Contract Details</h3>
                  </div>
                  <button className="collapsible-trigger">
                    {expandedSections.contractDetails ? '−' : '+'}
                  </button>
                </div>
                
                <div className="collapsible-content">
                  <div className="structured-details">
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
                  </div>
                </div>
              </div>
              
              {/* Parties Information Section */}
              <div className={`collapsible-section ${expandedSections.partiesInfo ? 'open' : ''}`}>
                <div 
                  className="collapsible-header"
                  onClick={() => toggleSection('partiesInfo')}
                >
                  <div className="collapsible-header-content">
                    <div className="collapsible-icon">👥</div>
                    <h3 className="collapsible-title">Parties Information</h3>
                  </div>
                  <button className="collapsible-trigger">
                    {expandedSections.partiesInfo ? '−' : '+'}
                  </button>
                </div>
                
                <div className="collapsible-content">
                  <div className="structured-details">
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
                </div>
              </div>
              
              {/* Financial Details Section */}
              <div className={`collapsible-section ${expandedSections.financialDetails ? 'open' : ''}`}>
                <div 
                  className="collapsible-header"
                  onClick={() => toggleSection('financialDetails')}
                >
                  <div className="collapsible-header-content">
                    <div className="collapsible-icon">💰</div>
                    <h3 className="collapsible-title">Financial Details</h3>
                  </div>
                  <button className="collapsible-trigger">
                    {expandedSections.financialDetails ? '−' : '+'}
                  </button>
                </div>
                
                <div className="collapsible-content">
                  <div className="structured-details">
                    {renderField('Total Grant Amount', financial?.total_grant_amount, 'currency')}
                    {renderField('Currency', financial?.currency)}
                    {renderField('Payment Terms', financial?.payment_terms)}
                    {renderField('Financial Reporting Requirements', financial?.financial_reporting_requirements)}
                    
                    {financial?.budget_breakdown && Object.keys(financial.budget_breakdown).length > 0 && (
                      <div className="array-field">
                        <label className="field-label">Budget Breakdown:</label>
                        <div className="array-values">
                          {Object.entries(financial.budget_breakdown).map(([key, value]) => (
                            value !== null && value !== undefined && (
                              <div key={key} className="array-item">
                                <strong>{key.replace('_', ' ').toUpperCase()}:</strong> {formatCurrency(value)}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="collapsible-sections-container">
              {/* Additional contract details can be added here */}
              <div className="structured-details">
                {renderField('Risk Management', contractDetails.risk_management)}
                {renderField('Quality Requirements', contractDetails.quality_requirements)}
                {renderField('Monitoring & Evaluation', contractDetails.monitoring_evaluation)}
                {renderField('Change Management', contractDetails.change_management)}
              </div>
            </div>
          )}
          
          {activeTab === 'financial' && (
            <div className="structured-details">
              {financial?.payment_schedule && (
                <>
                  <div className="field-label">Payment Schedule</div>
                  <div className="field-value">
                    {financial.payment_schedule.schedule_type || 'Not specified'}
                  </div>
                  
                  {financial.payment_schedule.installments && financial.payment_schedule.installments.length > 0 && (
                    <div className="array-field" style={{marginTop: '20px'}}>
                      <label className="field-label">Installments:</label>
                      <div className="array-values">
                        {financial.payment_schedule.installments.map((inst, idx) => (
                          <div key={idx} className="array-item">
                            <div><strong>Installment #{inst.installment_number || idx + 1}:</strong></div>
                            <div>Amount: {formatCurrency(inst.amount)}</div>
                            <div>Due Date: {inst.due_date || 'Not specified'}</div>
                            <div>Condition: {inst.trigger_condition || 'Not specified'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === 'comprehensive' && (
            <ComprehensiveView contractData={contractData} />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="contract-quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <span className="quick-action-icon">📥</span>
            Export PDF
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📋</span>
            Copy Details
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">🔗</span>
            Share Link
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📊</span>
            Analytics
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="status-indicators">
        <div className="status-indicator">
          <span className="status-dot active"></span>
          <span>Contract Active</span>
        </div>
        <div className="status-indicator">
          <span className="status-dot pending"></span>
          <span>Reports Due: 5 days</span>
        </div>
        <div className="status-indicator">
          <span className="status-dot pending"></span>
          <span>Next Payment: 15 days</span>
        </div>
      </div>
    </div>
  );
}

export default ContractDetailsPage;