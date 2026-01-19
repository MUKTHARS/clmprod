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
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import API_CONFIG, { fetchAPI } from './config';
import './styles/ContractDetailsPage.css';

function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  const [expandedSections, setExpandedSections] = useState({
    contractDetails: false,
    financial: false,
    parties: false,
    deliverables: false,
    terms: false,
    compliance: false,
    executiveSummary: false
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
        month: 'short',
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

  const toggleAllSections = (expand) => {
    setExpandedSections({
      contractDetails: expand,
      financial: expand,
      parties: expand,
      deliverables: expand,
      terms: expand,
      compliance: expand,
      executiveSummary: expand
    });
  };

  const renderDetailRow = (label, value, icon = null, type = 'text') => {
    if (!value && value !== 0 && type !== 'currency') return null;
    
    let displayValue = value;
    if (type === 'date' && value) {
      displayValue = formatDate(value);
    } else if (type === 'currency' && (value || value === 0)) {
      displayValue = formatCurrency(value);
    }
    
    return (
      <div className="detail-row">
        <div className="detail-label">
          {icon && <span className="detail-icon">{icon}</span>}
          <span>{label}</span>
        </div>
        <div className="detail-value">{displayValue}</div>
      </div>
    );
  };

  const renderArrayItems = (items, label) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="array-section">
        <div className="array-label">{label}</div>
        <div className="array-items">
          {items.map((item, idx) => (
            <div key={idx} className="array-item">
              <CheckCircle size={12} />
              <span>{item}</span>
            </div>
          ))}
        </div>
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
    daysRemaining: 180,
    riskLevel: 'Medium'
  };

  return (
    <div className="contract-details-page">
      {/* Header Section */}
      <div className="contract-header">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-icon financial">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{formatCurrency(metrics.totalAmount)}</span>
            <span className="metric-label">Total Value</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon duration">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.duration}</span>
            <span className="metric-label">Duration</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon deliverables">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.deliverablesCount}</span>
            <span className="metric-label">Deliverables</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon installments">
            <FileBarChart size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.installmentsCount}</span>
            <span className="metric-label">Installments</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon timeline">
            <Calendar size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.daysRemaining}d</span>
            <span className="metric-label">Days Remaining</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon risk">
            <AlertCircle size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{metrics.riskLevel}</span>
            <span className="metric-label">Risk Level</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Analysis */}
      <div className="tab-content">
        <div className="section-card">
          <div className="section-header">
            <div className="section-icon">
              <TrendingUp size={20} />
            </div>
            <h3>Contract Details</h3>
            <div className="section-actions">
              <button 
                className="btn-expand-all"
                onClick={() => toggleAllSections(!Object.values(expandedSections).every(v => v))}
              >
                {Object.values(expandedSections).every(v => v) ? 'Collapse All' : 'Expand All'}
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
                {expandedSections.executiveSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <BookOpen size={20} />
              <h4>Executive Summary</h4>
            </div>
            {expandedSections.executiveSummary && summary.executive_summary && (
              <div className="expandable-content">
                <div className="detail-content">
                  <div className="summary-text">{summary.executive_summary}</div>
                </div>
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
                {expandedSections.contractDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <FileText size={20} />
              <h4>Contract Details</h4>
            </div>
            {expandedSections.contractDetails && (
              <div className="expandable-content">
                <div className="detail-content">
                  <div className="detail-grid">
                    {renderDetailRow('Contract Name', contractDetails.grant_name, <FileText size={16} />)}
                    {renderDetailRow('Contract Number', contractDetails.contract_number, <FileText size={16} />)}
                    {renderDetailRow('Grant Reference', contractDetails.grant_reference, <Award size={16} />)}
                    {renderDetailRow('Agreement Type', contractDetails.agreement_type, <FileText size={16} />)}
                    {renderDetailRow('Effective Date', contractDetails.effective_date, <Calendar size={16} />, 'date')}
                    {renderDetailRow('Signature Date', contractDetails.signature_date, <Calendar size={16} />, 'date')}
                    {renderDetailRow('Start Date', contractDetails.start_date, <Calendar size={16} />, 'date')}
                    {renderDetailRow('End Date', contractDetails.end_date, <Calendar size={16} />, 'date')}
                    {renderDetailRow('Duration', contractDetails.duration, <Clock size={16} />)}
                    {renderDetailRow('Purpose', contractDetails.purpose, <Target size={16} />)}
                    {renderDetailRow('Geographic Scope', contractDetails.geographic_scope, <MapPin size={16} />)}
                    {renderDetailRow('Risk Management', contractDetails.risk_management, <AlertCircle size={16} />)}
                  </div>

                  {contractDetails.objectives && contractDetails.objectives.length > 0 && (
                    renderArrayItems(contractDetails.objectives, 'Objectives')
                  )}
                  
                  {contractDetails.scope_of_work && (
                    <div className="scope-section">
                      <div className="scope-label">Scope of Work</div>
                      <div className="scope-text">{contractDetails.scope_of_work}</div>
                    </div>
                  )}
                </div>
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
                {expandedSections.financial ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <DollarSign size={20} />
              <h4>Financial Details</h4>
            </div>
            {expandedSections.financial && (
              <div className="expandable-content">
                <div className="detail-content">
                  <div className="detail-grid">
                    {renderDetailRow('Total Grant Amount', financial?.total_grant_amount, <DollarSign size={16} />, 'currency')}
                    {renderDetailRow('Currency', financial?.currency, <DollarSign size={16} />)}
                    {renderDetailRow('Payment Terms', financial?.payment_terms, <FileText size={16} />)}
                    {renderDetailRow('Financial Reporting Requirements', financial?.financial_reporting_requirements, <FileBarChart size={16} />)}
                  </div>

                  {/* Payment Schedule */}
                  {financial?.payment_schedule?.installments && financial.payment_schedule.installments.length > 0 && (
                    <div className="table-section">
                      <div className="table-label">Payment Schedule</div>
                      <div className="data-table">
                        <table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                              <th>Condition</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financial.payment_schedule.installments.map((inst, idx) => (
                              <tr key={idx}>
                                <td>{inst.installment_number || idx + 1}</td>
                                <td className="amount-cell">{formatCurrency(inst.amount)}</td>
                                <td>{inst.due_date ? formatDate(inst.due_date) : 'Not specified'}</td>
                                <td>{inst.trigger_condition || 'Not specified'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Budget Breakdown */}
                  {financial?.budget_breakdown && Object.keys(financial.budget_breakdown).length > 0 && (
                    <div className="budget-section">
                      <div className="budget-label">Budget Breakdown</div>
                      <div className="budget-items">
                        {Object.entries(financial.budget_breakdown).map(([key, value]) => (
                          value !== null && value !== undefined && (
                            <div key={key} className="budget-item">
                              <div className="budget-category">{key.replace('_', ' ').toUpperCase()}</div>
                              <div className="budget-amount">{formatCurrency(value)}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                {expandedSections.parties ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <Users size={20} />
              <h4>Parties Information</h4>
            </div>
            {expandedSections.parties && (
              <div className="expandable-content">
                <div className="detail-content">
                  <div className="parties-columns">
                    {/* Grantor */}
                    <div className="party-column">
                      <div className="party-title">
                        <Building className="party-icon" />
                        <div>
                          <h5>Grantor</h5>
                          <div className="party-subtitle">Funding Organization</div>
                        </div>
                      </div>
                      <div className="party-details">
                        {renderDetailRow('Organization', parties.grantor?.organization_name, <Building size={14} />)}
                        {renderDetailRow('Address', parties.grantor?.address, <MapPin size={14} />)}
                        {renderDetailRow('Contact Person', parties.grantor?.contact_person, <User size={14} />)}
                        {renderDetailRow('Email', parties.grantor?.email, <Mail size={14} />)}
                        {renderDetailRow('Phone', parties.grantor?.phone, <Phone size={14} />)}
                        {renderDetailRow('Signatory', parties.grantor?.signatory_name, <FileText size={14} />)}
                        {renderDetailRow('Title', parties.grantor?.signatory_title, <User size={14} />)}
                        {renderDetailRow('Signature Date', parties.grantor?.signature_date, <Calendar size={14} />, 'date')}
                      </div>
                    </div>

                    {/* Grantee */}
                    <div className="party-column">
                      <div className="party-title">
                        <Building className="party-icon" />
                        <div>
                          <h5>Grantee</h5>
                          <div className="party-subtitle">Recipient Organization</div>
                        </div>
                      </div>
                      <div className="party-details">
                        {renderDetailRow('Organization', parties.grantee?.organization_name, <Building size={14} />)}
                        {renderDetailRow('Address', parties.grantee?.address, <MapPin size={14} />)}
                        {renderDetailRow('Contact Person', parties.grantee?.contact_person, <User size={14} />)}
                        {renderDetailRow('Email', parties.grantee?.email, <Mail size={14} />)}
                        {renderDetailRow('Phone', parties.grantee?.phone, <Phone size={14} />)}
                        {renderDetailRow('Signatory', parties.grantee?.signatory_name, <FileText size={14} />)}
                        {renderDetailRow('Title', parties.grantee?.signatory_title, <User size={14} />)}
                        {renderDetailRow('Signature Date', parties.grantee?.signature_date, <Calendar size={14} />, 'date')}
                      </div>
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
                {expandedSections.deliverables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <Target size={20} />
              <h4>Deliverables & Reporting</h4>
            </div>
            {expandedSections.deliverables && (
              <div className="expandable-content">
                <div className="detail-content">
                  {deliverables?.items && deliverables.items.length > 0 ? (
                    <>
                      <div className="table-section">
                        <div className="data-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Deliverable</th>
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
                      </div>

                      {deliverables?.reporting_requirements && (
                        <div className="reporting-section">
                          <div className="section-label">Reporting Requirements</div>
                          <div className="detail-grid">
                            {renderDetailRow('Frequency', deliverables.reporting_requirements.frequency, <Calendar size={16} />)}
                            {renderDetailRow('Format', deliverables.reporting_requirements.format_requirements, <FileText size={16} />)}
                            {renderDetailRow('Submission Method', deliverables.reporting_requirements.submission_method, <Upload size={16} />)}
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
                {expandedSections.terms ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <Shield size={20} />
              <h4>Terms & Conditions</h4>
            </div>
            {expandedSections.terms && (
              <div className="expandable-content">
                <div className="detail-content">
                  <div className="detail-grid">
                    {renderDetailRow('Intellectual Property', terms.intellectual_property, <FileText size={16} />)}
                    {renderDetailRow('Confidentiality', terms.confidentiality, <Shield size={16} />)}
                    {renderDetailRow('Liability', terms.liability, <AlertCircle size={16} />)}
                    {renderDetailRow('Termination Clauses', terms.termination_clauses, <FileText size={16} />)}
                    {renderDetailRow('Renewal Options', terms.renewal_options, <Clock size={16} />)}
                    {renderDetailRow('Dispute Resolution', terms.dispute_resolution, <Shield size={16} />)}
                    {renderDetailRow('Governing Law', terms.governing_law, <FileText size={16} />)}
                    {renderDetailRow('Force Majeure', terms.force_majeure, <AlertCircle size={16} />)}
                  </div>

                  {terms.key_obligations && terms.key_obligations.length > 0 && (
                    renderArrayItems(terms.key_obligations, 'Key Obligations')
                  )}
                  
                  {terms.restrictions && terms.restrictions.length > 0 && (
                    renderArrayItems(terms.restrictions, 'Restrictions')
                  )}
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
                {expandedSections.compliance ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <ShieldCheck size={20} />
              <h4>Compliance Requirements</h4>
            </div>
            {expandedSections.compliance && (
              <div className="expandable-content">
                <div className="detail-content">
                  <div className="detail-grid">
                    {renderDetailRow('Audit Requirements', compliance.audit_requirements, <FileCheck size={16} />)}
                    {renderDetailRow('Record Keeping', compliance.record_keeping, <FileText size={16} />)}
                    {renderDetailRow('Regulatory Compliance', compliance.regulatory_compliance, <ShieldCheck size={16} />)}
                    {renderDetailRow('Ethics Requirements', compliance.ethics_requirements, <Users size={16} />)}
                  </div>
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