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
  Loader2,
  RefreshCw,
  MessageSquare,
  XCircle
} from 'lucide-react';
import ComprehensiveView from './ComprehensiveView';
import API_CONFIG from './config';
import ProjectManagerActions from './components/workflow/ProjectManagerActions';
import './styles/ContractDetailsPage.css';

function ContractDetailsPage({ user = null }) {
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
  
  // State for comments section
  const [pmComments, setPmComments] = useState([]);
  const [pmCommentsLoading, setPmCommentsLoading] = useState(false);
  
  useEffect(() => {
    console.log('ContractDetailsPage mounted with id:', id);
    
    // Check if id exists and is valid
    if (id) {
      const contractId = parseInt(id);
      console.log('Parsed contract ID:', contractId);
      
      if (!isNaN(contractId) && contractId > 0) {
        fetchContractData(contractId);
      } else {
        console.error('Invalid contract ID format:', id);
        setLoading(false);
        setContractData(null);
      }
    } else {
      console.error('No contract ID provided');
      setLoading(false);
      setContractData(null);
    }
  }, [id]);

  useEffect(() => {
    // Automatically fetch comments when contract data is loaded and user is project manager
    if (contractData && user?.role === "project_manager") {
      fetchReviewComments();
    }
  }, [contractData, user]);

  const fetchContractData = async (contractId) => {
  console.log('Fetching contract data for ID:', contractId);
  
  try {
    setLoading(true);
    
    // Get the authentication token
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // First try the comprehensive endpoint
    const comprehensiveUrl = `${API_CONFIG.BASE_URL}/api/contracts/${contractId}/comprehensive`;
    console.log('Trying comprehensive endpoint:', comprehensiveUrl);
    
    let response = await fetch(comprehensiveUrl, { headers });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Comprehensive data fetched:', data);
      
      // Check if we got valid data
      if (!data || (data.error && data.error.includes('not found'))) {
        console.log('Contract not found in comprehensive endpoint, trying basic');
        await fetchBasicContractData(contractId);
        return;
      }
      
      // Normalize the data
      const normalizedData = normalizeContractData(data);
      if (normalizedData) {
        setContractData(normalizedData);
      } else {
        console.log('Normalized data is null, trying basic endpoint');
        await fetchBasicContractData(contractId);
      }
    } else if (response.status === 404) {
      console.log('Contract not found (404), trying basic endpoint');
      await fetchBasicContractData(contractId);
    } else {
      console.log('Comprehensive endpoint failed:', response.status);
      await fetchBasicContractData(contractId);
    }
  } catch (error) {
    console.error('Error fetching comprehensive data:', error);
    await fetchBasicContractData(contractId);
  } finally {
    setLoading(false);
  }
};

const normalizeContractData = (apiResponse) => {
  if (!apiResponse) {
    console.error('API response is null or undefined');
    return null;
  }
  
  console.log('Normalizing API response:', apiResponse);
  
  // The API might return different structures
  let contractId = apiResponse.contract_id || apiResponse.id;
  let basicData = apiResponse.basic_data || {};
  let compData = apiResponse.comprehensive_data || apiResponse;
  let filename = apiResponse.filename || 'Unknown';
  
  // If the response is directly a contract object
  if (apiResponse.id && !apiResponse.contract_id && !apiResponse.basic_data) {
    contractId = apiResponse.id;
    filename = apiResponse.filename || 'Unknown';
    basicData = apiResponse;
    compData = apiResponse.comprehensive_data || {};
  }
  
  // Extract from comprehensive_data if available
  if (compData && typeof compData === 'object') {
    console.log('Extracting from comprehensive_data:', Object.keys(compData));
    
    const contractDetails = compData.contract_details || {};
    const parties = compData.parties || {};
    const financial = compData.financial_details || {};
    const deliverables = compData.deliverables || {};
    const terms = compData.terms_conditions || {};
    const compliance = compData.compliance || {};
    const summary = compData.summary || {};
    
    // Check if this is a reviewed contract with program_manager_review
    const programManagerReview = compData.program_manager_review || {};
    
    // Merge with basic data
    const normalized = {
      ...basicData,
      contract_id: contractId,
      filename: filename,
      grant_name: contractDetails.grant_name || basicData.grant_name || filename,
      contract_number: contractDetails.contract_number || basicData.contract_number,
      grantor: parties.grantor?.organization_name || basicData.grantor || 'Unknown Grantor',
      grantee: parties.grantee?.organization_name || basicData.grantee || 'Unknown Grantee',
      total_amount: financial?.total_grant_amount || basicData.total_amount || 0,
      start_date: contractDetails.start_date || basicData.start_date,
      end_date: contractDetails.end_date || basicData.end_date,
      purpose: contractDetails.purpose || basicData.purpose,
      status: basicData.status || programManagerReview.overall_recommendation || 'processed',
      investment_id: basicData.investment_id,
      project_id: basicData.project_id,
      grant_id: basicData.grant_id,
      comprehensive_data: {
        contract_details: contractDetails,
        parties: parties,
        financial_details: financial,
        deliverables: deliverables,
        terms_conditions: terms,
        compliance: compliance,
        summary: summary,
        program_manager_review: programManagerReview,
        extended_data: compData.extended_data || {}
      }
    };
    
    console.log('Normalized contract data:', normalized);
    return normalized;
  }
  
  // Return basic data if no comprehensive_data
  const normalizedBasic = {
    ...basicData,
    contract_id: contractId,
    filename: filename,
    grant_name: basicData.grant_name || filename,
    grantor: basicData.grantor || 'Unknown Grantor',
    grantee: basicData.grantee || 'Unknown Grantee',
    total_amount: basicData.total_amount || 0,
    status: basicData.status || 'processed',
    comprehensive_data: {}
  };
  
  console.log('Returning basic normalized data:', normalizedBasic);
  return normalizedBasic;
};

  const fetchBasicContractData = async (contractId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Try the basic contract endpoint
      const basicUrl = `${API_CONFIG.BASE_URL}/api/contracts/${contractId}`;
      console.log('Trying basic endpoint:', basicUrl);
      
      const response = await fetch(basicUrl, { headers });
      
      if (response.ok) {
        const basicData = await response.json();
        console.log('Basic data fetched:', basicData);
        
        const normalizedData = normalizeContractData(basicData);
        setContractData(normalizedData);
      } else {
        console.log('Basic endpoint failed:', response.status);
        
        // Try to fetch from all contracts list
        await fetchFromAllContracts(contractId);
      }
    } catch (error) {
      console.error('Fallback fetch failed:', error);
      await fetchFromAllContracts(contractId);
    }
  };
const getContractStatus = (contract) => {
  if (!contract) return 'unknown';
  
  // First try to get status from basic data
  if (contract.status) {
    return contract.status;
  }
  
  // Check if there's a program manager review
  if (contract.comprehensive_data?.program_manager_review?.overall_recommendation) {
    const recommendation = contract.comprehensive_data.program_manager_review.overall_recommendation;
    if (recommendation === 'approve') return 'reviewed';
    if (recommendation === 'reject') return 'rejected';
    if (recommendation === 'modify') return 'rejected';
  }
  
  // Default status
  return 'processed';
};

  const fetchFromAllContracts = async (contractId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch all contracts and find the specific one
    const allContractsUrl = `${API_CONFIG.BASE_URL}/api/contracts/`;
    console.log('Trying all contracts endpoint:', allContractsUrl);
    
    const response = await fetch(allContractsUrl, { headers });
    
    if (response.ok) {
      const allContracts = await response.json();
      console.log('All contracts fetched:', allContracts.length);
      
      // Find the contract with matching ID
      const foundContract = allContracts.find(contract => {
        if (!contract) return false;
        const contractIdNum = parseInt(contractId);
        return contract.id === contractIdNum;
      });
      
      if (foundContract) {
        console.log('Contract found in all contracts list:', foundContract);
        const normalizedData = normalizeContractData(foundContract);
        if (normalizedData) {
          setContractData(normalizedData);
        } else {
          console.log('Failed to normalize contract data');
          setContractData(null);
        }
      } else {
        console.log('Contract not found in all contracts list');
        setContractData(null);
      }
    } else {
      console.log('All contracts endpoint failed:', response.status);
      setContractData(null);
    }
  } catch (error) {
    console.error('Error fetching from all contracts:', error);
    setContractData(null);
  }
};

  // Function to fetch Project Manager comments
  const fetchReviewComments = async () => {
    if (!contractData?.contract_id) return;
    
    try {
      setPmCommentsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractData.contract_id}/all-review-comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to show only Project Manager's comments
        const pmComments = data.comments?.filter(comment => 
          comment.user_role === "project_manager"
        ) || [];
        setPmComments(pmComments);
      }
    } catch (error) {
      console.error('Failed to fetch review comments:', error);
    } finally {
      setPmCommentsLoading(false);
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

  const formatCurrencyWithDecimals = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    try {
      const today = new Date();
      const end = new Date(endDate);
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  };

  // Helper function for comment status icons
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={14} className="text-yellow-600" />;
      case 'resolved':
        return <CheckCircle size={14} className="text-green-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const expandAllSections = () => {
    setExpandedSections({
      contractDetails: true,
      financial: true,
      parties: true,
      deliverables: true,
      terms: true,
      compliance: true,
      executiveSummary: true
    });
  };

  const collapseAllSections = () => {
    setExpandedSections({
      contractDetails: false,
      financial: false,
      parties: false,
      deliverables: false,
      terms: false,
      compliance: false,
      executiveSummary: false
    });
  };

  const renderField = (label, value, icon = null, type = 'text') => {
    if (!value && value !== 0 && type !== 'currency') return null;
    
    let displayValue = value;
    if (type === 'date' && value) {
      displayValue = formatDate(value);
    } else if (type === 'currency' && (value || value === 0)) {
      displayValue = formatCurrencyWithDecimals(value);
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

  const getContractDisplayId = (contract) => {
    if (!contract) return 'Unknown';
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.contract_id || contract.id || 'Unknown'}`;
  };

if (loading) {
  return (
    <div className="contract-details-page">
      <div className="loading-state" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        width: '100%'
      }}>
        <RefreshCw className="spinner" style={{ 
          width: '32px', 
          height: '32px', 
          color: '#475569', 
          animation: 'spin 1s linear infinite',
          marginBottom: '12px'
        }} />
        <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Loading contract details...</p>
      </div>
    </div>
  );
}

  // Check if id is undefined or invalid
  if (!id) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle className="error-icon" size={48} />
          <h2>Contract ID Missing</h2>
          <p>No contract ID was provided in the URL.</p>
          <button className="btn-primary" onClick={() => navigate('/contracts')}>
            <ArrowLeft size={16} />
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  const contractId = parseInt(id);
  if (isNaN(contractId) || contractId <= 0) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle className="error-icon" size={48} />
          <h2>Invalid Contract ID</h2>
          <p>The contract ID "{id}" is not valid.</p>
          <button className="btn-primary" onClick={() => navigate('/contracts')}>
            <ArrowLeft size={16} />
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="error-page">
        <div className="error-content">
          <FileText className="error-icon" size={48} />
          <h2>Contract Not Found</h2>
          <p>The contract with ID {contractId} could not be found.</p>
          <div className="error-actions">
            <button className="btn-primary" onClick={() => navigate('/contracts')}>
              <ArrowLeft size={16} />
              Back to Contracts
            </button>
            <button className="btn-secondary" onClick={() => fetchContractData(contractId)}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract comprehensive data
  const compData = contractData.comprehensive_data || {};
  const contractDetails = compData.contract_details || {};
  const parties = compData.parties || {};
  const financial = compData.financial_details || {};
  const deliverables = compData.deliverables || {};
  const terms = compData.terms_conditions || {};
  const compliance = compData.compliance || {};
  const summary = compData.summary || {};

  // Calculate metrics
  const totalAmount = contractData.total_amount || financial?.total_grant_amount || 0;
  const daysRemaining = getDaysRemaining(contractDetails.end_date || contractData.end_date);
  const installmentsCount = financial?.payment_schedule?.installments?.length || 0;
  const deliverablesCount = deliverables?.items?.length || 0;
  const duration = contractDetails.duration || 'N/A';
  
  // Determine risk level based on days remaining
  let riskLevel = 'Low';
  if (daysRemaining <= 30) riskLevel = 'Medium';
  if (daysRemaining <= 7) riskLevel = 'High';
  
  const metrics = {
    totalAmount: totalAmount,
    duration: duration,
    deliverablesCount: deliverablesCount,
    installmentsCount: installmentsCount,
    daysRemaining: daysRemaining,
    riskLevel: riskLevel
  };

  return (
    <div className="contract-details-page">
      {/* Header Section */}
      <div className="contract-header">
        <div className="header-top">
          <button className="btn-back" onClick={() => navigate('/contracts')}>
            <ArrowLeft size={20} />
            <span>Back to Contracts</span>
          </button>
          
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
    <h1>{contractData.grant_name || contractData.filename}</h1>
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
    <div className="contract-value-summary">
      <div className="contract-value">
        <DollarSign className="value-icon" />
        <div className="value-content">
          <span className="value-label">Total Value</span>
          <span className="value-amount">
            {formatCurrency(metrics.totalAmount)}
          </span>
        </div>
      </div>
      <div className="contract-value">
        <Clock className="value-icon"/>
        <div className="value-content">
          <span className="value-label">Duration</span>
          <span className="value-amount">{metrics.duration}</span>
        </div>
      </div>
      <div className="contract-value">
        <Target className="value-icon"  />
        <div className="value-content">
          <span className="value-label">Deliverables</span>
          <span className="value-amount">{metrics.deliverablesCount}</span>
        </div>
      </div>
      <div className="contract-value">
        <FileText className="value-icon"  />
        <div className="value-content">
          <span className="value-label">Installments</span>
          <span className="value-amount">{metrics.installmentsCount}</span>
        </div>
      </div>
      <div className="contract-value">
        <Calendar className="value-icon"  />
        <div className="value-content">
          <span className="value-label">Days Left</span>
          <span className="value-amount">{metrics.daysRemaining}d</span>
        </div>
      </div>
        {/* <div className="contract-value">
          <AlertCircle className="value-icon"  />
          <div className="value-content">
            <span className="value-label">Risk Level</span>
            <span className="value-amount">{metrics.riskLevel}</span>
          </div>
        </div> */}
    </div>
  </div>
</div>  
      </div>


      {/* Single Tab: AI Analysis with Expandable Sections */}
      <div className="tab-content">
        {/* Comprehensive AI Analysis Section */}
        <div className="section-card">
          <div className="section-header">
            <h3>Comprehensive Analysis</h3>
            <div className="section-actions">
              <button className="btn-expand-all" onClick={expandAllSections}>
                Expand All
              </button>
              <button className="btn-collapse-all" onClick={collapseAllSections}>
                Collapse All
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
                  {renderField('Contract Name', contractData.grant_name, <FileText size={16} />)}
                  {renderField('Contract Number', contractData.contract_number, <FileText size={16} />)}
                  {renderField('Grant Reference', contractDetails.grant_reference, <Award size={16} />)}
                  {renderField('Agreement Type', contractDetails.agreement_type, <FileText size={16} />)}
                  {renderField('Effective Date', contractDetails.effective_date, <Calendar size={16} />, 'date')}
                  {renderField('Signature Date', contractDetails.signature_date, <Calendar size={16} />, 'date')}
                  {renderField('Start Date', contractDetails.start_date || contractData.start_date, <Calendar size={16} />, 'date')}
                  {renderField('End Date', contractDetails.end_date || contractData.end_date, <Calendar size={16} />, 'date')}
                  {renderField('Duration', contractDetails.duration, <Clock size={16} />)}
                  {renderField('Purpose', contractDetails.purpose || contractData.purpose, <Target size={16} />)}
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
                  {renderField('Total Grant Amount', totalAmount, <DollarSign size={16} />, 'currency')}
                  {renderField('Currency', financial.currency, <DollarSign size={16} />)}
                  {renderField('Payment Terms', financial.payment_terms, <FileText size={16} />)}
                  {renderField('Financial Reporting Requirements', financial.financial_reporting_requirements, <FileBarChart size={16} />)}
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
         {/* Project Manager Actions Section */}
      {user && user.role === "project_manager" && contractData && (
        <div className="workflow-section">
          <ProjectManagerActions 
            contract={contractData}
            user={user}
            onActionComplete={() => {
              fetchContractData(contractId);
              fetchReviewComments();
            }}
          />
        </div>
      )}  
        {/* Project Manager Comments Section - ALWAYS VISIBLE */}
        {user && user.role === "project_manager" && contractData && (
          <div className="section-card">
            <div className="section-header">
              <h3>
                {/* <MessageSquare size={20} /> */}
                Comments({pmComments.length})

              </h3>
            </div>
            
            <div className="comments-section">
              <div className="comments-list-container">
                {pmCommentsLoading ? (
                  <div className="loading-comments">
                    <Loader2 className="spinner" size={20} />
                    <span>Loading comments...</span>
                  </div>
                ) : pmComments.length === 0 ? (
                  <div className="empty-comments">
                    <FileText size={32} />
                    <p>No comments found. Add notes above for Program Managers to see.</p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {pmComments.map((comment, index) => {
                      const isSubmission = comment.comment_type === "project_manager_submission";
                      const isResponse = comment.comment_type === "project_manager_response";
                      
                      return (
                        <div key={comment.id || index} className={`pm-comment-card ${comment.status}`}>
                          <div className="comment-header">
                            <div className="comment-meta">
                              <span className="comment-type">
                                {isSubmission ? 'Submission Note' : 
                                 isResponse ? 'Response to Reviewer' : 
                                 'Note for Reviewers'}
                              </span>
                              <span className="comment-date">
                                {formatDate(comment.created_at)}
                              </span>
                              {/* <span className={`comment-status ${comment.status}`}>
                                {getStatusIcon(comment.status)}
                                {comment.status}
                              </span> */}
                            </div>
                          
                          </div>
                          
                          <div className="comment-body">
                            <p className="comment-text">{comment.comment}</p>
                            
                            {comment.flagged_risk && (
                              <div className="comment-tag risk">
                                <AlertCircle size={12} />
                                Flagged as Risk
                              </div>
                            )}
                            
                            {comment.flagged_issue && (
                              <div className="comment-tag issue">
                                <AlertCircle size={12} />
                                Flagged as Issue
                              </div>
                            )}
                            
                            {comment.recommendation && (
                              <div className={`comment-tag recommendation ${comment.recommendation}`}>
                                {comment.recommendation === 'approve' && <CheckCircle size={12} />}
                                {comment.recommendation === 'reject' && <XCircle size={12} />}
                                {comment.recommendation === 'modify' && <RefreshCw size={12} />}
                                <span>Recommendation: {comment.recommendation}</span>
                              </div>
                            )}
                            
                            {comment.resolution_response && (
                              <div className="resolution-note">
                                <strong>Your Response:</strong> {comment.resolution_response}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
     
    </div>
  );
}

export default ContractDetailsPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   ArrowLeft,
//   Upload,
//   Calendar,
//   Share2,
//   Search,
//   FileText,
//   Download,
//   Copy,
//   Link,
//   BarChart3,
//   Bell,
//   Archive,
//   DollarSign,
//   Users,
//   Clock,
//   CheckCircle,
//   ChevronRight,
//   Layers,
//   Shield,
//   Target,
//   FileCheck,
//   AlertCircle,
//   Building,
//   User,
//   Mail,
//   Phone,
//   MapPin,
//   Award,
//   TrendingUp,
//   FileBarChart,
//   BookOpen,
//   ShieldCheck,
//   Plus,
//   Minus,
//   ExternalLink,
//   Loader2,
//   RefreshCw 
// } from 'lucide-react';
// import ComprehensiveView from './ComprehensiveView';
// import API_CONFIG from './config';
// import ProjectManagerActions from './components/workflow/ProjectManagerActions';
// import './styles/ContractDetailsPage.css';

// function ContractDetailsPage({ user = null }) {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [contractData, setContractData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('analysis');
//   const [expandedSections, setExpandedSections] = useState({
//     contractDetails: true,
//     financial: true,
//     parties: true,
//     deliverables: true,
//     terms: true,
//     compliance: true,
//     executiveSummary: true
//   });
  
//   useEffect(() => {
//     console.log('ContractDetailsPage mounted with id:', id);
    
//     // Check if id exists and is valid
//     if (id) {
//       const contractId = parseInt(id);
//       console.log('Parsed contract ID:', contractId);
      
//       if (!isNaN(contractId) && contractId > 0) {
//         fetchContractData(contractId);
//       } else {
//         console.error('Invalid contract ID format:', id);
//         setLoading(false);
//         setContractData(null);
//       }
//     } else {
//       console.error('No contract ID provided');
//       setLoading(false);
//       setContractData(null);
//     }
//   }, [id]);

//   const fetchContractData = async (contractId) => {
//   console.log('Fetching contract data for ID:', contractId);
  
//   try {
//     setLoading(true);
    
//     // Get the authentication token
//     const token = localStorage.getItem('token');
//     const headers = {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json'
//     };
    
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }
    
//     // First try the comprehensive endpoint
//     const comprehensiveUrl = `${API_CONFIG.BASE_URL}/api/contracts/${contractId}/comprehensive`;
//     console.log('Trying comprehensive endpoint:', comprehensiveUrl);
    
//     let response = await fetch(comprehensiveUrl, { headers });
    
//     if (response.ok) {
//       const data = await response.json();
//       console.log('Comprehensive data fetched:', data);
      
//       // Check if we got valid data
//       if (!data || (data.error && data.error.includes('not found'))) {
//         console.log('Contract not found in comprehensive endpoint, trying basic');
//         await fetchBasicContractData(contractId);
//         return;
//       }
      
//       // Normalize the data
//       const normalizedData = normalizeContractData(data);
//       if (normalizedData) {
//         setContractData(normalizedData);
//       } else {
//         console.log('Normalized data is null, trying basic endpoint');
//         await fetchBasicContractData(contractId);
//       }
//     } else if (response.status === 404) {
//       console.log('Contract not found (404), trying basic endpoint');
//       await fetchBasicContractData(contractId);
//     } else {
//       console.log('Comprehensive endpoint failed:', response.status);
//       await fetchBasicContractData(contractId);
//     }
//   } catch (error) {
//     console.error('Error fetching comprehensive data:', error);
//     await fetchBasicContractData(contractId);
//   } finally {
//     setLoading(false);
//   }
// };

// const normalizeContractData = (apiResponse) => {
//   if (!apiResponse) {
//     console.error('API response is null or undefined');
//     return null;
//   }
  
//   console.log('Normalizing API response:', apiResponse);
  
//   // The API might return different structures
//   let contractId = apiResponse.contract_id || apiResponse.id;
//   let basicData = apiResponse.basic_data || {};
//   let compData = apiResponse.comprehensive_data || apiResponse;
//   let filename = apiResponse.filename || 'Unknown';
  
//   // If the response is directly a contract object
//   if (apiResponse.id && !apiResponse.contract_id && !apiResponse.basic_data) {
//     contractId = apiResponse.id;
//     filename = apiResponse.filename || 'Unknown';
//     basicData = apiResponse;
//     compData = apiResponse.comprehensive_data || {};
//   }
  
//   // Extract from comprehensive_data if available
//   if (compData && typeof compData === 'object') {
//     console.log('Extracting from comprehensive_data:', Object.keys(compData));
    
//     const contractDetails = compData.contract_details || {};
//     const parties = compData.parties || {};
//     const financial = compData.financial_details || {};
//     const deliverables = compData.deliverables || {};
//     const terms = compData.terms_conditions || {};
//     const compliance = compData.compliance || {};
//     const summary = compData.summary || {};
    
//     // Check if this is a reviewed contract with program_manager_review
//     const programManagerReview = compData.program_manager_review || {};
    
//     // Merge with basic data
//     const normalized = {
//       ...basicData,
//       contract_id: contractId,
//       filename: filename,
//       grant_name: contractDetails.grant_name || basicData.grant_name || filename,
//       contract_number: contractDetails.contract_number || basicData.contract_number,
//       grantor: parties.grantor?.organization_name || basicData.grantor || 'Unknown Grantor',
//       grantee: parties.grantee?.organization_name || basicData.grantee || 'Unknown Grantee',
//       total_amount: financial?.total_grant_amount || basicData.total_amount || 0,
//       start_date: contractDetails.start_date || basicData.start_date,
//       end_date: contractDetails.end_date || basicData.end_date,
//       purpose: contractDetails.purpose || basicData.purpose,
//       status: basicData.status || programManagerReview.overall_recommendation || 'processed',
//       investment_id: basicData.investment_id,
//       project_id: basicData.project_id,
//       grant_id: basicData.grant_id,
//       comprehensive_data: {
//         contract_details: contractDetails,
//         parties: parties,
//         financial_details: financial,
//         deliverables: deliverables,
//         terms_conditions: terms,
//         compliance: compliance,
//         summary: summary,
//         program_manager_review: programManagerReview,
//         extended_data: compData.extended_data || {}
//       }
//     };
    
//     console.log('Normalized contract data:', normalized);
//     return normalized;
//   }
  
//   // Return basic data if no comprehensive_data
//   const normalizedBasic = {
//     ...basicData,
//     contract_id: contractId,
//     filename: filename,
//     grant_name: basicData.grant_name || filename,
//     grantor: basicData.grantor || 'Unknown Grantor',
//     grantee: basicData.grantee || 'Unknown Grantee',
//     total_amount: basicData.total_amount || 0,
//     status: basicData.status || 'processed',
//     comprehensive_data: {}
//   };
  
//   console.log('Returning basic normalized data:', normalizedBasic);
//   return normalizedBasic;
// };

//   const fetchBasicContractData = async (contractId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const headers = {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       };
      
//       if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//       }
      
//       // Try the basic contract endpoint
//       const basicUrl = `${API_CONFIG.BASE_URL}/api/contracts/${contractId}`;
//       console.log('Trying basic endpoint:', basicUrl);
      
//       const response = await fetch(basicUrl, { headers });
      
//       if (response.ok) {
//         const basicData = await response.json();
//         console.log('Basic data fetched:', basicData);
        
//         const normalizedData = normalizeContractData(basicData);
//         setContractData(normalizedData);
//       } else {
//         console.log('Basic endpoint failed:', response.status);
        
//         // Try to fetch from all contracts list
//         await fetchFromAllContracts(contractId);
//       }
//     } catch (error) {
//       console.error('Fallback fetch failed:', error);
//       await fetchFromAllContracts(contractId);
//     }
//   };
// const getContractStatus = (contract) => {
//   if (!contract) return 'unknown';
  
//   // First try to get status from basic data
//   if (contract.status) {
//     return contract.status;
//   }
  
//   // Check if there's a program manager review
//   if (contract.comprehensive_data?.program_manager_review?.overall_recommendation) {
//     const recommendation = contract.comprehensive_data.program_manager_review.overall_recommendation;
//     if (recommendation === 'approve') return 'reviewed';
//     if (recommendation === 'reject') return 'rejected';
//     if (recommendation === 'modify') return 'rejected';
//   }
  
//   // Default status
//   return 'processed';
// };
//   const fetchFromAllContracts = async (contractId) => {
//   try {
//     const token = localStorage.getItem('token');
//     const headers = {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json'
//     };
    
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }
    
//     // Fetch all contracts and find the specific one
//     const allContractsUrl = `${API_CONFIG.BASE_URL}/api/contracts/`;
//     console.log('Trying all contracts endpoint:', allContractsUrl);
    
//     const response = await fetch(allContractsUrl, { headers });
    
//     if (response.ok) {
//       const allContracts = await response.json();
//       console.log('All contracts fetched:', allContracts.length);
      
//       // Find the contract with matching ID
//       const foundContract = allContracts.find(contract => {
//         if (!contract) return false;
//         const contractIdNum = parseInt(contractId);
//         return contract.id === contractIdNum;
//       });
      
//       if (foundContract) {
//         console.log('Contract found in all contracts list:', foundContract);
//         const normalizedData = normalizeContractData(foundContract);
//         if (normalizedData) {
//           setContractData(normalizedData);
//         } else {
//           console.log('Failed to normalize contract data');
//           setContractData(null);
//         }
//       } else {
//         console.log('Contract not found in all contracts list');
//         setContractData(null);
//       }
//     } else {
//       console.log('All contracts endpoint failed:', response.status);
//       setContractData(null);
//     }
//   } catch (error) {
//     console.error('Error fetching from all contracts:', error);
//     setContractData(null);
//   }
// };

//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return '-';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const formatCurrencyWithDecimals = (amount) => {
//     if (!amount && amount !== 0) return '-';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(amount);
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not specified';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch (e) {
//       return dateString;
//     }
//   };

//   const getDaysRemaining = (endDate) => {
//     if (!endDate) return 0;
//     try {
//       const today = new Date();
//       const end = new Date(endDate);
//       const diffTime = end - today;
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return diffDays > 0 ? diffDays : 0;
//     } catch (e) {
//       return 0;
//     }
//   };

//   const toggleSection = (section) => {
//     setExpandedSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }));
//   };

//   const expandAllSections = () => {
//     setExpandedSections({
//       contractDetails: true,
//       financial: true,
//       parties: true,
//       deliverables: true,
//       terms: true,
//       compliance: true,
//       executiveSummary: true
//     });
//   };

//   const collapseAllSections = () => {
//     setExpandedSections({
//       contractDetails: false,
//       financial: false,
//       parties: false,
//       deliverables: false,
//       terms: false,
//       compliance: false,
//       executiveSummary: false
//     });
//   };

//   const renderField = (label, value, icon = null, type = 'text') => {
//     if (!value && value !== 0 && type !== 'currency') return null;
    
//     let displayValue = value;
//     if (type === 'date' && value) {
//       displayValue = formatDate(value);
//     } else if (type === 'currency' && (value || value === 0)) {
//       displayValue = formatCurrencyWithDecimals(value);
//     } else if (type === 'array' && Array.isArray(value)) {
//       if (value.length === 0) return null;
//       return (
//         <div className="field-card array-field">
//           <div className="field-header">
//             {icon && <span className="field-icon">{icon}</span>}
//             <label className="field-label">{label}</label>
//           </div>
//           <div className="array-values">
//             {value.map((item, idx) => (
//               <div key={idx} className="array-item">
//                 <CheckCircle size={12} />
//                 <span>{item}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//     }
    
//     return (
//       <div className="field-card">
//         <div className="field-header">
//           {icon && <span className="field-icon">{icon}</span>}
//           <label className="field-label">{label}</label>
//         </div>
//         <span className="field-value">{displayValue}</span>
//       </div>
//     );
//   };

//   const getContractDisplayId = (contract) => {
//     if (!contract) return 'Unknown';
//     if (contract.investment_id) return `INV-${contract.investment_id}`;
//     if (contract.project_id) return `PRJ-${contract.project_id}`;
//     if (contract.grant_id) return `GRANT-${contract.grant_id}`;
//     return `CONT-${contract.contract_id || contract.id || 'Unknown'}`;
//   };

// if (loading) {
//   return (
//     <div className="contract-details-page">
//       <div className="loading-state" style={{ 
//         display: 'flex', 
//         flexDirection: 'column', 
//         alignItems: 'center', 
//         justifyContent: 'center', 
//         minHeight: '60vh',
//         width: '100%'
//       }}>
//         <RefreshCw className="spinner" style={{ 
//           width: '32px', 
//           height: '32px', 
//           color: '#475569', 
//           animation: 'spin 1s linear infinite',
//           marginBottom: '12px'
//         }} />
//         <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Loading contract details...</p>
//       </div>
//     </div>
//   );
// }

//   // Check if id is undefined or invalid
//   if (!id) {
//     return (
//       <div className="error-page">
//         <div className="error-content">
//           <AlertCircle className="error-icon" size={48} />
//           <h2>Contract ID Missing</h2>
//           <p>No contract ID was provided in the URL.</p>
//           <button className="btn-primary" onClick={() => navigate('/contracts')}>
//             <ArrowLeft size={16} />
//             Back to Contracts
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const contractId = parseInt(id);
//   if (isNaN(contractId) || contractId <= 0) {
//     return (
//       <div className="error-page">
//         <div className="error-content">
//           <AlertCircle className="error-icon" size={48} />
//           <h2>Invalid Contract ID</h2>
//           <p>The contract ID "{id}" is not valid.</p>
//           <button className="btn-primary" onClick={() => navigate('/contracts')}>
//             <ArrowLeft size={16} />
//             Back to Contracts
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!contractData) {
//     return (
//       <div className="error-page">
//         <div className="error-content">
//           <FileText className="error-icon" size={48} />
//           <h2>Contract Not Found</h2>
//           <p>The contract with ID {contractId} could not be found.</p>
//           <div className="error-actions">
//             <button className="btn-primary" onClick={() => navigate('/contracts')}>
//               <ArrowLeft size={16} />
//               Back to Contracts
//             </button>
//             <button className="btn-secondary" onClick={() => fetchContractData(contractId)}>
//               <RefreshCw size={16} />
//               Try Again
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Extract comprehensive data
//   const compData = contractData.comprehensive_data || {};
//   const contractDetails = compData.contract_details || {};
//   const parties = compData.parties || {};
//   const financial = compData.financial_details || {};
//   const deliverables = compData.deliverables || {};
//   const terms = compData.terms_conditions || {};
//   const compliance = compData.compliance || {};
//   const summary = compData.summary || {};

//   // Calculate metrics
//   const totalAmount = contractData.total_amount || financial?.total_grant_amount || 0;
//   const daysRemaining = getDaysRemaining(contractDetails.end_date || contractData.end_date);
//   const installmentsCount = financial?.payment_schedule?.installments?.length || 0;
//   const deliverablesCount = deliverables?.items?.length || 0;
//   const duration = contractDetails.duration || 'N/A';
  
//   // Determine risk level based on days remaining
//   let riskLevel = 'Low';
//   if (daysRemaining <= 30) riskLevel = 'Medium';
//   if (daysRemaining <= 7) riskLevel = 'High';
  
//   const metrics = {
//     totalAmount: totalAmount,
//     duration: duration,
//     deliverablesCount: deliverablesCount,
//     installmentsCount: installmentsCount,
//     daysRemaining: daysRemaining,
//     riskLevel: riskLevel
//   };

//   return (
//     <div className="contract-details-page">
//       {/* Header Section */}
//       <div className="contract-header">
//         <div className="header-top">
//           <button className="btn-back" onClick={() => navigate('/contracts')}>
//             <ArrowLeft size={20} />
//             <span>Back to Contracts</span>
//           </button>
          
//           <div className="header-actions-right">
//             <button 
//               className="btn-primary"
//               onClick={() => navigate('/upload')}
//             >
//               <Upload size={18} />
//               <span>Upload New</span>
//             </button>
            
//             <div className="quick-actions-mini">
//               <button className="action-btn-mini" title="Export PDF">
//                 <Download size={16} />
//               </button>
//               <button className="action-btn-mini" title="Copy Details">
//                 <Copy size={16} />
//               </button>
//               <button className="action-btn-mini" title="Share">
//                 <Link size={16} />
//               </button>
//               <button className="action-btn-mini" title="Analytics">
//                 <BarChart3 size={16} />
//               </button>
//               <button className="action-btn-mini" title="Reminder">
//                 <Bell size={16} />
//               </button>
//             </div>
//           </div>
//         </div>

// <div className="contract-title-section">
//   <div className="title-left">
//     <h1>{contractData.grant_name || contractData.filename}</h1>
//     <div className="contract-tags">
//       {contractData.investment_id && (
//         <span className="tag investment-tag">
//           <DollarSign size={12} />
//           INV: {contractData.investment_id}
//         </span>
//       )}
//       {contractData.project_id && (
//         <span className="tag project-tag">
//           <Layers size={12} />
//           PRJ: {contractData.project_id}
//         </span>
//       )}
//       {contractData.grant_id && (
//         <span className="tag grant-tag">
//           <Award size={12} />
//           GRANT: {contractData.grant_id}
//         </span>
//       )}
//       <span className="tag status-tag active">
//         <CheckCircle size={12} />
//         Active
//       </span>
//     </div>
//   </div>
//   <div className="title-right">
//     <div className="contract-value-summary">
//       <div className="contract-value">
//         <DollarSign className="value-icon" />
//         <div className="value-content">
//           <span className="value-label">Total Value</span>
//           <span className="value-amount">
//             {formatCurrency(metrics.totalAmount)}
//           </span>
//         </div>
//       </div>
//       <div className="contract-value">
//         <Clock className="value-icon"/>
//         <div className="value-content">
//           <span className="value-label">Duration</span>
//           <span className="value-amount">{metrics.duration}</span>
//         </div>
//       </div>
//       <div className="contract-value">
//         <Target className="value-icon"  />
//         <div className="value-content">
//           <span className="value-label">Deliverables</span>
//           <span className="value-amount">{metrics.deliverablesCount}</span>
//         </div>
//       </div>
//       <div className="contract-value">
//         <FileText className="value-icon"  />
//         <div className="value-content">
//           <span className="value-label">Installments</span>
//           <span className="value-amount">{metrics.installmentsCount}</span>
//         </div>
//       </div>
//       <div className="contract-value">
//         <Calendar className="value-icon"  />
//         <div className="value-content">
//           <span className="value-label">Days Left</span>
//           <span className="value-amount">{metrics.daysRemaining}d</span>
//         </div>
//       </div>
//         {/* <div className="contract-value">
//           <AlertCircle className="value-icon"  />
//           <div className="value-content">
//             <span className="value-label">Risk Level</span>
//             <span className="value-amount">{metrics.riskLevel}</span>
//           </div>
//         </div> */}
//     </div>
//   </div>
// </div>  
//       </div>


//       {/* Single Tab: AI Analysis with Expandable Sections */}
//       <div className="tab-content">
//         {/* Comprehensive AI Analysis Section */}
//         <div className="section-card">
//           <div className="section-header">
//             <h3>Comprehensive Analysis</h3>
//             <div className="section-actions">
//               <button className="btn-expand-all" onClick={expandAllSections}>
//                 Expand All
//               </button>
//               <button className="btn-collapse-all" onClick={collapseAllSections}>
//                 Collapse All
//               </button>
//             </div>
//           </div>
          
//           {/* Executive Summary */}
//           <div className="expandable-section">
//             <div 
//               className="section-title expandable-header"
//               onClick={() => toggleSection('executiveSummary')}
//             >
//               <div className="expand-icon">
//                 {expandedSections.executiveSummary ? <Minus size={18} /> : <Plus size={18} />}
//               </div>
//               <BookOpen size={20} />
//               <h4>Executive Summary</h4>
//             </div>
//             {expandedSections.executiveSummary && summary.executive_summary && (
//               <div className="expandable-content">
//                 <p className="summary-text">{summary.executive_summary}</p>
//               </div>
//             )}
//           </div>

//           {/* Contract Details */}
//           <div className="expandable-section">
//             <div 
//               className="section-title expandable-header"
//               onClick={() => toggleSection('contractDetails')}
//             >
//               <div className="expand-icon">
//                 {expandedSections.contractDetails ? <Minus size={18} /> : <Plus size={18} />}
//               </div>
//               <FileText size={20} />
//               <h4>Contract Details</h4>
//             </div>
//             {expandedSections.contractDetails && (
//               <div className="expandable-content">
//                 <div className="fields-grid">
//                   {renderField('Contract Name', contractData.grant_name, <FileText size={16} />)}
//                   {renderField('Contract Number', contractData.contract_number, <FileText size={16} />)}
//                   {renderField('Grant Reference', contractDetails.grant_reference, <Award size={16} />)}
//                   {renderField('Agreement Type', contractDetails.agreement_type, <FileText size={16} />)}
//                   {renderField('Effective Date', contractDetails.effective_date, <Calendar size={16} />, 'date')}
//                   {renderField('Signature Date', contractDetails.signature_date, <Calendar size={16} />, 'date')}
//                   {renderField('Start Date', contractDetails.start_date || contractData.start_date, <Calendar size={16} />, 'date')}
//                   {renderField('End Date', contractDetails.end_date || contractData.end_date, <Calendar size={16} />, 'date')}
//                   {renderField('Duration', contractDetails.duration, <Clock size={16} />)}
//                   {renderField('Purpose', contractDetails.purpose || contractData.purpose, <Target size={16} />)}
//                   {renderField('Geographic Scope', contractDetails.geographic_scope, <MapPin size={16} />)}
//                   {renderField('Risk Management', contractDetails.risk_management, <AlertCircle size={16} />)}
//                 </div>
                
//                 {contractDetails.objectives && contractDetails.objectives.length > 0 && (
//                   <div className="objectives-section">
//                     <h4>Objectives</h4>
//                     <div className="objectives-list">
//                       {contractDetails.objectives.map((obj, idx) => (
//                         <div key={idx} className="objective-item">
//                           <CheckCircle size={16} />
//                           <span>{obj}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
                
//                 {contractDetails.scope_of_work && (
//                   <div className="scope-section">
//                     <h4>Scope of Work</h4>
//                     <div className="scope-content">
//                       {contractDetails.scope_of_work}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Financial Details */}
//           <div className="expandable-section">
//             <div 
//               className="section-title expandable-header"
//               onClick={() => toggleSection('financial')}
//             >
//               <div className="expand-icon">
//                 {expandedSections.financial ? <Minus size={18} /> : <Plus size={18} />}
//               </div>
//               <DollarSign size={20} />
//               <h4>Financial Details</h4>
//             </div>
//             {expandedSections.financial && (
//               <div className="expandable-content">
//                 <div className="fields-grid">
//                   {renderField('Total Grant Amount', totalAmount, <DollarSign size={16} />, 'currency')}
//                   {renderField('Currency', financial.currency, <DollarSign size={16} />)}
//                   {renderField('Payment Terms', financial.payment_terms, <FileText size={16} />)}
//                   {renderField('Financial Reporting Requirements', financial.financial_reporting_requirements, <FileBarChart size={16} />)}
//                 </div>

//                 {/* Payment Schedule */}
//                 {financial?.payment_schedule?.installments && financial.payment_schedule.installments.length > 0 && (
//                   <div className="payment-schedule">
//                     <h4>Payment Schedule</h4>
//                     <div className="data-table">
//                       <table>
//                         <thead>
//                           <tr>
//                             <th>#</th>
//                             <th>Amount</th>
//                             <th>Due Date</th>
//                             <th>Condition</th>
//                             <th>Description</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {financial.payment_schedule.installments.map((inst, idx) => (
//                             <tr key={idx}>
//                               <td>{inst.installment_number || idx + 1}</td>
//                               <td className="amount-cell">{formatCurrency(inst.amount)}</td>
//                               <td>{inst.due_date ? formatDate(inst.due_date) : 'Not specified'}</td>
//                               <td>{inst.trigger_condition || 'Not specified'}</td>
//                               <td>{inst.description || 'Not specified'}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )}

//                 {/* Budget Breakdown */}
//                 {financial?.budget_breakdown && Object.keys(financial.budget_breakdown).length > 0 && (
//                   <div className="budget-breakdown">
//                     <h4>Budget Breakdown</h4>
//                     <div className="budget-items">
//                       {Object.entries(financial.budget_breakdown).map(([key, value]) => (
//                         value !== null && value !== undefined && (
//                           <div key={key} className="budget-item">
//                             <div className="budget-label">
//                               <DollarSign size={14} />
//                               <span>{key.replace('_', ' ').toUpperCase()}</span>
//                             </div>
//                             <div className="budget-amount">
//                               {formatCurrency(value)}
//                             </div>
//                           </div>
//                         )
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Parties Information */}
//           <div className="expandable-section">
//             <div 
//               className="section-title expandable-header"
//               onClick={() => toggleSection('parties')}
//             >
//               <div className="expand-icon">
//                 {expandedSections.parties ? <Minus size={18} /> : <Plus size={18} />}
//               </div>
//               <Users size={20} />
//               <h4>Parties Information</h4>
//             </div>
//             {expandedSections.parties && (
//               <div className="expandable-content">
//                 <div className="parties-grid">
//                   {/* Grantor */}
//                   <div className="party-card">
//                     <div className="party-header">
//                       <Building className="party-icon" />
//                       <div className="party-title">
//                         <h4>Grantor</h4>
//                         <span className="party-role">Funding Organization</span>
//                       </div>
//                     </div>
//                     <div className="party-details">
//                       {renderField('Organization', parties.grantor?.organization_name, <Building size={14} />)}
//                       {renderField('Address', parties.grantor?.address, <MapPin size={14} />)}
//                       {renderField('Contact Person', parties.grantor?.contact_person, <User size={14} />)}
//                       {renderField('Email', parties.grantor?.email, <Mail size={14} />)}
//                       {renderField('Phone', parties.grantor?.phone, <Phone size={14} />)}
//                       {renderField('Signatory', parties.grantor?.signatory_name, <FileText size={14} />)}
//                       {renderField('Signatory Title', parties.grantor?.signatory_title, <User size={14} />)}
//                       {renderField('Signature Date', parties.grantor?.signature_date, <Calendar size={14} />, 'date')}
//                     </div>
//                   </div>

//                   {/* Grantee */}
//                   <div className="party-card">
//                     <div className="party-header">
//                       <Building className="party-icon" />
//                       <div className="party-title">
//                         <h4>Grantee</h4>
//                         <span className="party-role">Recipient Organization</span>
//                       </div>
//                     </div>
//                     <div className="party-details">
//                       {renderField('Organization', parties.grantee?.organization_name, <Building size={14} />)}
//                       {renderField('Address', parties.grantee?.address, <MapPin size={14} />)}
//                       {renderField('Contact Person', parties.grantee?.contact_person, <User size={14} />)}
//                       {renderField('Email', parties.grantee?.email, <Mail size={14} />)}
//                       {renderField('Phone', parties.grantee?.phone, <Phone size={14} />)}
//                       {renderField('Signatory', parties.grantee?.signatory_name, <FileText size={14} />)}
//                       {renderField('Signatory Title', parties.grantee?.signatory_title, <User size={14} />)}
//                       {renderField('Signature Date', parties.grantee?.signature_date, <Calendar size={14} />, 'date')}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Deliverables */}
//           <div className="expandable-section">
//             <div 
//               className="section-title expandable-header"
//               onClick={() => toggleSection('deliverables')}
//             >
//               <div className="expand-icon">
//                 {expandedSections.deliverables ? <Minus size={18} /> : <Plus size={18} />}
//               </div>
//               <Target size={20} />
//               <h4>Deliverables & Reporting</h4>
//             </div>
//             {expandedSections.deliverables && (
//               <div className="expandable-content">
//                 {deliverables?.items && deliverables.items.length > 0 ? (
//                   <>
//                     <div className="data-table">
//                       <table>
//                         <thead>
//                           <tr>
//                             <th>Deliverable</th>
//                             <th>Description</th>
//                             <th>Due Date</th>
//                             <th>Status</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {deliverables.items.map((del, idx) => (
//                             <tr key={idx}>
//                               <td className="deliverable-name">
//                                 <Target size={14} />
//                                 {del.deliverable_name || `Deliverable ${idx + 1}`}
//                               </td>
//                               <td>{del.description || 'Not specified'}</td>
//                               <td>{del.due_date ? formatDate(del.due_date) : 'Not specified'}</td>
//                               <td>
//                                 <span className={`status-badge ${del.status?.toLowerCase() || 'pending'}`}>
//                                   {del.status || 'Pending'}
//                                 </span>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>

//                     {deliverables?.reporting_requirements && (
//                       <div className="reporting-requirements">
//                         <h4>Reporting Requirements</h4>
//                         <div className="fields-grid">
//                           {renderField('Frequency', deliverables.reporting_requirements.frequency, <Calendar size={16} />)}
//                           {renderField('Format Requirements', deliverables.reporting_requirements.format_requirements, <FileText size={16} />)}
//                           {renderField('Submission Method', deliverables.reporting_requirements.submission_method, <Upload size={16} />)}
//                         </div>
//                       </div>
//                     )}
//                   </>
//                 ) : (
//                   <div className="empty-state">
//                     <Target size={48} />
//                     <p>No deliverables specified in this contract</p>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Terms & Conditions */}
//           <div className="expandable-section">
//             <div 
//               className="section-title expandable-header"
//               onClick={() => toggleSection('terms')}
//             >
//               <div className="expand-icon">
//                 {expandedSections.terms ? <Minus size={18} /> : <Plus size={18} />}
//               </div>
//               <Shield size={20} />
//               <h4>Terms & Conditions</h4>
//             </div>
//             {expandedSections.terms && (
//               <div className="expandable-content">
//                 <div className="fields-grid">
//                   {renderField('Intellectual Property', terms.intellectual_property, <FileText size={16} />)}
//                   {renderField('Confidentiality', terms.confidentiality, <Shield size={16} />)}
//                   {renderField('Liability', terms.liability, <AlertCircle size={16} />)}
//                   {renderField('Termination Clauses', terms.termination_clauses, <FileText size={16} />)}
//                   {renderField('Renewal Options', terms.renewal_options, <Clock size={16} />)}
//                   {renderField('Dispute Resolution', terms.dispute_resolution, <Shield size={16} />)}
//                   {renderField('Governing Law', terms.governing_law, <FileText size={16} />)}
//                   {renderField('Force Majeure', terms.force_majeure, <AlertCircle size={16} />)}
//                   {renderField('Key Obligations', terms.key_obligations, <CheckCircle size={16} />, 'array')}
//                   {renderField('Restrictions', terms.restrictions, <AlertCircle size={16} />, 'array')}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Compliance */}
//           <div className="expandable-section">
//             <div 
//               className="section-title expandable-header"
//               onClick={() => toggleSection('compliance')}
//             >
//               <div className="expand-icon">
//                 {expandedSections.compliance ? <Minus size={18} /> : <Plus size={18} />}
//               </div>
//               <ShieldCheck size={20} />
//               <h4>Compliance Requirements</h4>
//             </div>
//             {expandedSections.compliance && (
//               <div className="expandable-content">
//                 <div className="fields-grid">
//                   {renderField('Audit Requirements', compliance.audit_requirements, <FileCheck size={16} />)}
//                   {renderField('Record Keeping', compliance.record_keeping, <FileText size={16} />)}
//                   {renderField('Regulatory Compliance', compliance.regulatory_compliance, <ShieldCheck size={16} />)}
//                   {renderField('Ethics Requirements', compliance.ethics_requirements, <Users size={16} />)}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

        
//       </div>
      
//       {/* Project Manager Actions Section */}
//       {user && user.role === "project_manager" && contractData && (
//         <div className="workflow-section">
//           <ProjectManagerActions 
//             contract={contractData}
//             user={user}
//             onActionComplete={() => fetchContractData(contractId)}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// export default ContractDetailsPage;