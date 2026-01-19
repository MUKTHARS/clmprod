import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Calendar,
  Share2,
  Search,
  FileText,
  Download,
  Copy,
  Link,
  BarChart3,
  Bell,
  Archive,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
  Layers,
  Shield,
  Target,
  FileCheck,
  AlertCircle,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  FileBarChart,
  BookOpen,
  ShieldCheck,
  Plus,
  Minus,
  ExternalLink
} from 'lucide-react';
import ComprehensiveView from './ComprehensiveView';
import API_CONFIG, { fetchAPI } from './config';
import './styles/ContractDetailsPage.css';

function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  const [expandedSections, setExpandedSections] = useState({
    contractDetails: true,
    financial: true,
    parties: true,
    deliverables: true,
    terms: true,
    compliance: true,
    executiveSummary: true
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
      
      const comprehensiveUrl = API_CONFIG.ENDPOINTS.COMPREHENSIVE(contractId);
      const response = await fetch(comprehensiveUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data && !data.contract_id) {
          data.contract_id = contractId;
        }
        setContractData(data);
      } else {
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderField = (label, value, icon = null, type = 'text') => {
    if (!value && value !== 0 && type !== 'currency') return null;
    
    let displayValue = value;
    if (type === 'date' && value) {
      displayValue = formatDate(value);
    } else if (type === 'currency' && (value || value === 0)) {
      displayValue = formatCurrency(value);
    } else if (type === 'array' && Array.isArray(value)) {
      if (value.length === 0) return null;
      return (
        <div className="field-card array-field">
          <div className="field-header">
            {icon && <span className="field-icon">{icon}</span>}
            <label className="field-label">{label}</label>
          </div>
          <div className="array-values">
            {value.map((item, idx) => (
              <div key={idx} className="array-item">
                <CheckCircle size={12} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="field-card">
        <div className="field-header">
          {icon && <span className="field-icon">{icon}</span>}
          <label className="field-label">{label}</label>
        </div>
        <span className="field-value">{displayValue}</span>
      </div>
    );
  };

  const renderTable = (title, headers, data, icon = null) => {
    if (!data || data.length === 0) return null;
    
    return (
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
    );
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Loading Contract Details</h3>
          <p>Analyzing comprehensive contract data...</p>
        </div>
      </div>
    );
  }

  if (!id || isNaN(parseInt(id))) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle className="error-icon" />
          <h2>Invalid Contract ID</h2>
          <p>No valid contract ID was provided in the URL.</p>
          {/* <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button> */}
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="error-page">
        <div className="error-content">
          <FileText className="error-icon" />
          <h2>Contract Not Found</h2>
          <p>The contract with ID {id} could not be found.</p>
          {/* <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button> */}
        </div>
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

  // Calculate metrics
  const metrics = {
    totalAmount: financial?.total_grant_amount || 0,
    duration: contractDetails.duration || 'N/A',
    deliverablesCount: deliverables?.items?.length || 0,
    installmentsCount: financial?.payment_schedule?.installments?.length || 0,
    daysRemaining: 180, // Example data
    riskLevel: 'Medium'
  };

  return (
    <div className="contract-details-page">
      {/* Header Section */}
      <div className="contract-header">
        <div className="header-top">
          {/* <button className="btn-back" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button> */}
          
          <div className="header-actions-right">
            <button 
              className="btn-primary"
              onClick={() => navigate('/upload')}
            >
              <Upload size={18} />
              <span>Upload New</span>
            </button>
            
            <div className="quick-actions-mini">
              <button className="action-btn-mini" title="Export PDF">
                <Download size={16} />
              </button>
              <button className="action-btn-mini" title="Copy Details">
                <Copy size={16} />
              </button>
              <button className="action-btn-mini" title="Share">
                <Link size={16} />
              </button>
              <button className="action-btn-mini" title="Analytics">
                <BarChart3 size={16} />
              </button>
              <button className="action-btn-mini" title="Reminder">
                <Bell size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="contract-title-section">
          <div className="title-left">
            <h1>{contractDetails.grant_name || parties.grantor?.organization_name || contractData.filename}</h1>
            <div className="contract-tags">
              {contractData.investment_id && (
                <span className="tag investment-tag">
                  <DollarSign size={12} />
                  INV: {contractData.investment_id}
                </span>
              )}
              {contractData.project_id && (
                <span className="tag project-tag">
                  <Layers size={12} />
                  PRJ: {contractData.project_id}
                </span>
              )}
              {contractData.grant_id && (
                <span className="tag grant-tag">
                  <Award size={12} />
                  GRANT: {contractData.grant_id}
                </span>
              )}
              <span className="tag status-tag active">
                <CheckCircle size={12} />
                Active
              </span>
            </div>
          </div>
          <div className="title-right">
            <div className="contract-value">
              <DollarSign className="value-icon" />
              <div className="value-content">
                <span className="value-label">Total Value</span>
                <span className="value-amount">
                  {formatCurrency(metrics.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-card">
          {/* <div className="metric-icon financial">
            <DollarSign size={24} />
          </div> */}
          <div className="metric-content">
            <span className="metric-value">{formatCurrency(metrics.totalAmount)}</span>
            <span className="metric-label">Total Value</span>
          </div>
        </div>
        <div className="metric-card">
          {/* <div className="metric-icon duration">
            <Clock size={24} />
          </div> */}
          <div className="metric-content">
            <span className="metric-value">{metrics.duration}</span>
            <span className="metric-label">Duration</span>
          </div>
        </div>
        <div className="metric-card">
          {/* <div className="metric-icon deliverables">
            <Target size={24} />
          </div> */}
          <div className="metric-content">
            <span className="metric-value">{metrics.deliverablesCount}</span>
            <span className="metric-label">Deliverables</span>
          </div>
        </div>
        <div className="metric-card">
          {/* <div className="metric-icon installments">
            <FileBarChart size={24} />
          </div> */}
          <div className="metric-content">
            <span className="metric-value">{metrics.installmentsCount}</span>
            <span className="metric-label">Installments</span>
          </div>
        </div>
        <div className="metric-card">
          {/* <div className="metric-icon timeline">
            <Calendar size={24} />
          </div> */}
          <div className="metric-content">
            <span className="metric-value">{metrics.daysRemaining}d</span>
            <span className="metric-label">Days Remaining</span>
          </div>
        </div>
        <div className="metric-card">
          {/* <div className="metric-icon risk">
            <AlertCircle size={24} />
          </div> */}
          <div className="metric-content">
            <span className="metric-value">{metrics.riskLevel}</span>
            <span className="metric-label">Risk Level</span>
          </div>
        </div>
      </div>

      {/* Single Tab: AI Analysis with Expandable Sections */}
      <div className="tab-content">
        {/* Comprehensive AI Analysis Section */}
        <div className="section-card">
          <div className="section-header">
            {/* <div className="section-icon">
              <TrendingUp size={20} />
            </div> */}
            <h3>Comprehensive Analysis</h3>
            <div className="section-actions">
              <button className="btn-expand-all" onClick={() => {
                setExpandedSections({
                  contractDetails: true,
                  financial: true,
                  parties: true,
                  deliverables: true,
                  terms: true,
                  compliance: true,
                  executiveSummary: true
                });
              }}>
                Expand All
              </button>
            </div>
          </div>
          
          {/* Executive Summary */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('executiveSummary')}
            >
              <div className="expand-icon">
                {expandedSections.executiveSummary ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <BookOpen size={20} />
              <h4>Executive Summary</h4>
            </div>
            {expandedSections.executiveSummary && summary.executive_summary && (
              <div className="expandable-content">
                <p className="summary-text">{summary.executive_summary}</p>
              </div>
            )}
          </div>

          {/* Contract Details */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('contractDetails')}
            >
              <div className="expand-icon">
                {expandedSections.contractDetails ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <FileText size={20} />
              <h4>Contract Details</h4>
            </div>
            {expandedSections.contractDetails && (
              <div className="expandable-content">
                <div className="fields-grid">
                  {renderField('Contract Name', contractDetails.grant_name, <FileText size={16} />)}
                  {renderField('Contract Number', contractDetails.contract_number, <FileText size={16} />)}
                  {renderField('Grant Reference', contractDetails.grant_reference, <Award size={16} />)}
                  {renderField('Agreement Type', contractDetails.agreement_type, <FileText size={16} />)}
                  {renderField('Effective Date', contractDetails.effective_date, <Calendar size={16} />, 'date')}
                  {renderField('Signature Date', contractDetails.signature_date, <Calendar size={16} />, 'date')}
                  {renderField('Start Date', contractDetails.start_date, <Calendar size={16} />, 'date')}
                  {renderField('End Date', contractDetails.end_date, <Calendar size={16} />, 'date')}
                  {renderField('Duration', contractDetails.duration, <Clock size={16} />)}
                  {renderField('Purpose', contractDetails.purpose, <Target size={16} />)}
                  {renderField('Geographic Scope', contractDetails.geographic_scope, <MapPin size={16} />)}
                  {renderField('Risk Management', contractDetails.risk_management, <AlertCircle size={16} />)}
                </div>
                
                {contractDetails.objectives && contractDetails.objectives.length > 0 && (
                  <div className="objectives-section">
                    <h4>Objectives</h4>
                    <div className="objectives-list">
                      {contractDetails.objectives.map((obj, idx) => (
                        <div key={idx} className="objective-item">
                          <CheckCircle size={16} />
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {contractDetails.scope_of_work && (
                  <div className="scope-section">
                    <h4>Scope of Work</h4>
                    <div className="scope-content">
                      {contractDetails.scope_of_work}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Financial Details */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('financial')}
            >
              <div className="expand-icon">
                {expandedSections.financial ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <DollarSign size={20} />
              <h4>Financial Details</h4>
            </div>
            {expandedSections.financial && (
              <div className="expandable-content">
                <div className="fields-grid">
                  {renderField('Total Grant Amount', financial?.total_grant_amount, <DollarSign size={16} />, 'currency')}
                  {renderField('Currency', financial?.currency, <DollarSign size={16} />)}
                  {renderField('Payment Terms', financial?.payment_terms, <FileText size={16} />)}
                  {renderField('Financial Reporting Requirements', financial?.financial_reporting_requirements, <FileBarChart size={16} />)}
                </div>

                {/* Payment Schedule */}
                {financial?.payment_schedule?.installments && financial.payment_schedule.installments.length > 0 && (
                  <div className="payment-schedule">
                    <h4>Payment Schedule</h4>
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
                              <td className="amount-cell">{formatCurrency(inst.amount)}</td>
                              <td>{inst.due_date ? formatDate(inst.due_date) : 'Not specified'}</td>
                              <td>{inst.trigger_condition || 'Not specified'}</td>
                              <td>{inst.description || 'Not specified'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Budget Breakdown */}
                {financial?.budget_breakdown && Object.keys(financial.budget_breakdown).length > 0 && (
                  <div className="budget-breakdown">
                    <h4>Budget Breakdown</h4>
                    <div className="budget-items">
                      {Object.entries(financial.budget_breakdown).map(([key, value]) => (
                        value !== null && value !== undefined && (
                          <div key={key} className="budget-item">
                            <div className="budget-label">
                              <DollarSign size={14} />
                              <span>{key.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="budget-amount">
                              {formatCurrency(value)}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parties Information */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('parties')}
            >
              <div className="expand-icon">
                {expandedSections.parties ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <Users size={20} />
              <h4>Parties Information</h4>
            </div>
            {expandedSections.parties && (
              <div className="expandable-content">
                <div className="parties-grid">
                  {/* Grantor */}
                  <div className="party-card">
                    <div className="party-header">
                      <Building className="party-icon" />
                      <div className="party-title">
                        <h4>Grantor</h4>
                        <span className="party-role">Funding Organization</span>
                      </div>
                    </div>
                    <div className="party-details">
                      {renderField('Organization', parties.grantor?.organization_name, <Building size={14} />)}
                      {renderField('Address', parties.grantor?.address, <MapPin size={14} />)}
                      {renderField('Contact Person', parties.grantor?.contact_person, <User size={14} />)}
                      {renderField('Email', parties.grantor?.email, <Mail size={14} />)}
                      {renderField('Phone', parties.grantor?.phone, <Phone size={14} />)}
                      {renderField('Signatory', parties.grantor?.signatory_name, <FileText size={14} />)}
                      {renderField('Signatory Title', parties.grantor?.signatory_title, <User size={14} />)}
                      {renderField('Signature Date', parties.grantor?.signature_date, <Calendar size={14} />, 'date')}
                    </div>
                  </div>

                  {/* Grantee */}
                  <div className="party-card">
                    <div className="party-header">
                      <Building className="party-icon" />
                      <div className="party-title">
                        <h4>Grantee</h4>
                        <span className="party-role">Recipient Organization</span>
                      </div>
                    </div>
                    <div className="party-details">
                      {renderField('Organization', parties.grantee?.organization_name, <Building size={14} />)}
                      {renderField('Address', parties.grantee?.address, <MapPin size={14} />)}
                      {renderField('Contact Person', parties.grantee?.contact_person, <User size={14} />)}
                      {renderField('Email', parties.grantee?.email, <Mail size={14} />)}
                      {renderField('Phone', parties.grantee?.phone, <Phone size={14} />)}
                      {renderField('Signatory', parties.grantee?.signatory_name, <FileText size={14} />)}
                      {renderField('Signatory Title', parties.grantee?.signatory_title, <User size={14} />)}
                      {renderField('Signature Date', parties.grantee?.signature_date, <Calendar size={14} />, 'date')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('deliverables')}
            >
              <div className="expand-icon">
                {expandedSections.deliverables ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <Target size={20} />
              <h4>Deliverables & Reporting</h4>
            </div>
            {expandedSections.deliverables && (
              <div className="expandable-content">
                {deliverables?.items && deliverables.items.length > 0 ? (
                  <>
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
                              <td className="deliverable-name">
                                <Target size={14} />
                                {del.deliverable_name || `Deliverable ${idx + 1}`}
                              </td>
                              <td>{del.description || 'Not specified'}</td>
                              <td>{del.due_date ? formatDate(del.due_date) : 'Not specified'}</td>
                              <td>
                                <span className={`status-badge ${del.status?.toLowerCase() || 'pending'}`}>
                                  {del.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {deliverables?.reporting_requirements && (
                      <div className="reporting-requirements">
                        <h4>Reporting Requirements</h4>
                        <div className="fields-grid">
                          {renderField('Frequency', deliverables.reporting_requirements.frequency, <Calendar size={16} />)}
                          {renderField('Format Requirements', deliverables.reporting_requirements.format_requirements, <FileText size={16} />)}
                          {renderField('Submission Method', deliverables.reporting_requirements.submission_method, <Upload size={16} />)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <Target size={48} />
                    <p>No deliverables specified in this contract</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('terms')}
            >
              <div className="expand-icon">
                {expandedSections.terms ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <Shield size={20} />
              <h4>Terms & Conditions</h4>
            </div>
            {expandedSections.terms && (
              <div className="expandable-content">
                <div className="fields-grid">
                  {renderField('Intellectual Property', terms.intellectual_property, <FileText size={16} />)}
                  {renderField('Confidentiality', terms.confidentiality, <Shield size={16} />)}
                  {renderField('Liability', terms.liability, <AlertCircle size={16} />)}
                  {renderField('Termination Clauses', terms.termination_clauses, <FileText size={16} />)}
                  {renderField('Renewal Options', terms.renewal_options, <Clock size={16} />)}
                  {renderField('Dispute Resolution', terms.dispute_resolution, <Shield size={16} />)}
                  {renderField('Governing Law', terms.governing_law, <FileText size={16} />)}
                  {renderField('Force Majeure', terms.force_majeure, <AlertCircle size={16} />)}
                  {renderField('Key Obligations', terms.key_obligations, <CheckCircle size={16} />, 'array')}
                  {renderField('Restrictions', terms.restrictions, <AlertCircle size={16} />, 'array')}
                </div>
              </div>
            )}
          </div>

          {/* Compliance */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('compliance')}
            >
              <div className="expand-icon">
                {expandedSections.compliance ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <ShieldCheck size={20} />
              <h4>Compliance Requirements</h4>
            </div>
            {expandedSections.compliance && (
              <div className="expandable-content">
                <div className="fields-grid">
                  {renderField('Audit Requirements', compliance.audit_requirements, <FileCheck size={16} />)}
                  {renderField('Record Keeping', compliance.record_keeping, <FileText size={16} />)}
                  {renderField('Regulatory Compliance', compliance.regulatory_compliance, <ShieldCheck size={16} />)}
                  {renderField('Ethics Requirements', compliance.ethics_requirements, <Users size={16} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="quick-actions-footer">
          <h3>Export Options</h3>
          <div className="actions-grid">
            <button className="quick-action-btn">
              <FileText size={20} />
              <span>Export as PDF</span>
            </button>
            <button className="quick-action-btn">
              <FileBarChart size={20} />
              <span>Export Summary</span>
            </button>
            <button className="quick-action-btn">
              <Download size={20} />
              <span>Download Data</span>
            </button>
            <button className="quick-action-btn">
              <ExternalLink size={20} />
              <span>Open Raw Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractDetailsPage;