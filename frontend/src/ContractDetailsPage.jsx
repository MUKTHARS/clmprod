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

  const renderTable = (title, headers, data) => {
    if (!data || data.length === 0) return null;
    
    return (
      <div className="section-card">
        <h3>{title}</h3>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {headers.map((header, colIdx) => (
                    <td key={colIdx}>
                      {row[header.toLowerCase().replace(/\s+/g, '_')] || row[colIdx] || 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const summary = compData.summary || {};

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
          {/* <button 
            className="btn-secondary"
            onClick={() => navigate('/upload')}
          >
            Upload New
          </button> */}
          {/* <button 
            className="btn-danger"
            onClick={handleDelete}
          >
            Delete
          </button> */}
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

      {/* Executive Summary */}
      {summary.executive_summary && (
        <div className="executive-summary-card">
          <h3>Executive Summary</h3>
          <p>{summary.executive_summary}</p>
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

      <div className="details-sections-container">
        {/* Contract Details Section */}
        <div className="section-header">
          {/* <div className="section-header-icon">📋</div> */}
          <h2>Contract Details</h2>
        </div>
        
        <div className="section-card">
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

        {/* Parties Information Section */}
        <div className="section-header">
          <div className="section-header-icon">👥</div>
          <h2>Parties Information</h2>
        </div>
        
        <div className="section-card">
          {/* Grantor Information */}
          <div className="party-section">
            <h3 className="party-title">Grantor</h3>
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
            <h3 className="party-title">Grantee</h3>
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
              <h3 className="party-title">Other Parties</h3>
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

        {/* Financial Details Section */}
        <div className="section-header">
          {/* <div className="section-header-icon">💰</div> */}
          <h2>Financial Details</h2>
        </div>
        
        <div className="section-card">
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
          
          {/* Payment Schedule */}
          {financial?.payment_schedule?.installments && financial.payment_schedule.installments.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Payment Schedule</h3>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Condition</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financial.payment_schedule.installments.map((inst, idx) => (
                      <tr key={idx}>
                        <td>{inst.installment_number || idx + 1}</td>
                        <td>{formatCurrency(inst.amount)}</td>
                        <td>{inst.due_date || 'Not specified'}</td>
                        <td>{inst.trigger_condition || 'Not specified'}</td>
                        <td>{inst.description || 'Not specified'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Deliverables Section */}
        <div className="section-header">
          {/* <div className="section-header-icon">📑</div> */}
          <h2>Deliverables & Reporting</h2>
        </div>
        
        <div className="section-card">
          {deliverables?.items && deliverables.items.length > 0 ? (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Deliverable</th>
                    <th>Description</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deliverables.items.map((del, idx) => (
                    <tr key={idx}>
                      <td>{del.deliverable_name || `Deliverable ${idx + 1}`}</td>
                      <td>{del.description || 'Not specified'}</td>
                      <td>{del.due_date || 'Not specified'}</td>
                      <td>{del.status || 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No deliverables specified</p>
          )}
          
          {deliverables?.reporting_requirements && (
            <div style={{ marginTop: '30px' }}>
              <h3>Reporting Requirements</h3>
              <div className="structured-details">
                {renderField('Frequency', deliverables.reporting_requirements.frequency)}
                {renderField('Format Requirements', deliverables.reporting_requirements.format_requirements)}
                {renderField('Submission Method', deliverables.reporting_requirements.submission_method)}
              </div>
            </div>
          )}
        </div>

        {/* Terms & Conditions Section */}
        <div className="section-header">
          {/* <div className="section-header-icon">⚖️</div> */}
          <h2>Terms & Conditions</h2>
        </div>
        
        <div className="section-card">
          <div className="structured-details">
            {renderField('Intellectual Property', terms.intellectual_property)}
            {renderField('Confidentiality', terms.confidentiality)}
            {renderField('Liability', terms.liability)}
            {renderField('Termination Clauses', terms.termination_clauses)}
            {renderField('Renewal Options', terms.renewal_options)}
            {renderField('Dispute Resolution', terms.dispute_resolution)}
            {renderField('Governing Law', terms.governing_law)}
            {renderField('Force Majeure', terms.force_majeure)}
            {renderField('Key Obligations', terms.key_obligations, 'array')}
            {renderField('Restrictions', terms.restrictions, 'array')}
          </div>
        </div>

        {/* Compliance Section */}
        <div className="section-header">
          {/* <div className="section-header-icon">🛡️</div> */}
          <h2>Compliance Requirements</h2>
        </div>
        
        <div className="section-card">
          <div className="structured-details">
            {renderField('Audit Requirements', compliance.audit_requirements)}
            {renderField('Record Keeping', compliance.record_keeping)}
            {renderField('Regulatory Compliance', compliance.regulatory_compliance)}
            {renderField('Ethics Requirements', compliance.ethics_requirements)}
          </div>
        </div>

        {/* Comprehensive View Link */}
        <div className="section-header">
          {/* <div className="section-header-icon">🔍</div> */}
          <h2>Detailed Analysis</h2>
        </div>
        
        <div className="section-card">
          <ComprehensiveView contractData={contractData} />
        </div>
      </div>

      {/* Status Indicators */}
      {/* <div className="status-indicators">
        <div className="status-indicator">
          <span className="status-dot active"></span>
          <span>Contract Status: Active</span>
        </div>
        <div className="status-indicator">
          <span className="status-dot pending"></span>
          <span>Reports Due: 5 days remaining</span>
        </div>
        <div className="status-indicator">
          <span className="status-dot pending"></span>
          <span>Next Payment: 15 days remaining</span>
        </div>
        <div className="status-indicator">
          <span className="status-dot completed"></span>
          <span>Milestones Completed: 3/5</span>
        </div>
      </div> */}

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
          <button className="quick-action-btn">
            <span className="quick-action-icon">🔔</span>
            Set Reminder
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📁</span>
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContractDetailsPage;