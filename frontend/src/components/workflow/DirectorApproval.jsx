import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Lock,
  Shield,
  AlertCircle,
  FileText,
  Eye,
  Download,
  Send,
  History,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Calendar,
  User,
  Building,
  DollarSign,
  Loader2,
  Filter,
  Search,
  RefreshCw,
  Clock,
  Flag,
  ChevronDown,
  MoreVertical,
  ShieldCheck
} from 'lucide-react';
import API_CONFIG from '../../config';
import './DirectorApproval.css';

function DirectorApproval() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [completeInfo, setCompleteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [lockContract, setLockContract] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [businessSignOff, setBusinessSignOff] = useState(false);
  const [activeTab, setActiveTab] = useState('review');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContractsForApproval();
  }, []);

const fetchContractsForApproval = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Use Director's specific endpoint
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/director/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // FIX: Show contracts with status "reviewed" OR "approved" for Director approval section
      const contractsForApproval = data.filter(contract => 
        contract.status === "reviewed" || contract.status === "approved"
      );
      
      setContracts(contractsForApproval);
    }
  } catch (error) {
    console.error('Failed to fetch contracts for approval:', error);
  } finally {
    setLoading(false);
  }
};

  const fetchCompleteContractInfo = async (contractId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Try the director-specific endpoint first
      let response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/director/view-complete`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompleteInfo(data);
      } else {
        // Fallback to regular contract endpoint
        const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setCompleteInfo({
            contract_id: contractId,
            basic_info: fallbackData,
            comprehensive_data: fallbackData.comprehensive_data || {}
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch complete contract info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContractSelect = async (contract) => {
    setSelectedContract(contract);
    setDecision('');
    setComments('');
    setLockContract(false);
    setRiskAccepted(false);
    setBusinessSignOff(false);
    setCompleteInfo(null);
    setActiveTab('review');
    
    // Fetch complete information
    await fetchCompleteContractInfo(contract.id);
  };

  const handleFinalApproval = async () => {
    if (!selectedContract || !decision || !comments) {
      alert('Please select a decision, provide comments, and complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${selectedContract.id}/director/final-approval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: decision,
          comments: comments,
          lock_contract: lockContract,
          risk_accepted: riskAccepted,
          business_sign_off: businessSignOff
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        // Refresh the list
        fetchContractsForApproval();
        // Reset form
        setSelectedContract(null);
        setCompleteInfo(null);
        setDecision('');
        setComments('');
        setLockContract(false);
        setRiskAccepted(false);
        setBusinessSignOff(false);
      } else {
        const error = await response.json();
        alert(`Failed to submit decision: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit decision:', error);
      alert('Failed to submit decision');
    } finally {
      setSubmitting(false);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const calculateDaysSince = (dateString) => {
    if (!dateString) return null;
    try {
      const reviewDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - reviewDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  };

  const getPriorityLevel = (contract) => {
    const daysSince = calculateDaysSince(contract.forwarded_at);
    const amount = contract.total_amount || 0;
    
    if (daysSince && daysSince > 5) return 'high';
    if (amount > 1000000) return 'high';
    if (contract.review_recommendation === 'approve' && contract.flagged_issues) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'approve': return '#16a34a';
      case 'reject': return '#dc2626';
      case 'modify': return '#d97706';
      default: return '#6b7280';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (contract.grant_name && contract.grant_name.toLowerCase().includes(searchLower)) ||
        (contract.grantor && contract.grantor.toLowerCase().includes(searchLower)) ||
        (contract.contract_number && contract.contract_number.toLowerCase().includes(searchLower)) ||
        (contract.forwarded_by && contract.forwarded_by.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Apply status filter
    if (filter === 'high_priority') {
      return getPriorityLevel(contract) === 'high';
    } else if (filter === 'new') {
      const daysSince = calculateDaysSince(contract.forwarded_at);
      return daysSince && daysSince <= 1;
    } else if (filter === 'large_amount') {
      return (contract.total_amount || 0) > 500000;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: contracts.length,
    highPriority: contracts.filter(c => getPriorityLevel(c) === 'high').length,
    newToday: contracts.filter(c => {
      const daysSince = calculateDaysSince(c.forwarded_at);
      return daysSince && daysSince <= 1;
    }).length,
    totalValue: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0)
  };

  if (loading && !selectedContract) {
    return (
      <div className="director-loading-page">
        <div className="loading-content">
          <Loader2 size={48} className="spinning" />
          <h3>Loading Contracts for Approval</h3>
          <p>Fetching contracts that require final approval...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="director-approval-page">
      {/* Header */}
      <div className="approval-header">
        <div className="header-left">
          <h1>Director Approval Dashboard</h1>
          <p className="page-subtitle">
            Review and provide final approval for contracts forwarded by Program Managers
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={fetchContractsForApproval}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          {/* <div className="stat-icon">
            <FileText size={24} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Pending Approval</span>
          </div>
        </div>
        <div className="stat-card">
          {/* <div className="stat-icon">
            <AlertCircle size={24} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{stats.highPriority}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
        <div className="stat-card">
          {/* <div className="stat-icon">
            <Clock size={24} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{stats.newToday}</span>
            <span className="stat-label">New Today</span>
          </div>
        </div>
        <div className="stat-card">
          {/* <div className="stat-icon">
            <DollarSign size={24} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="section-controls">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search contracts by name, grantor, or forwarded by..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="controls-container">
            <button 
              className="btn-filter"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filters</span>
              <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={16} />
              Filter by
            </label>
            <div className="filter-options">
              <button
                className={`filter-option ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Contracts
              </button>
              <button
                className={`filter-option ${filter === 'high_priority' ? 'active' : ''}`}
                onClick={() => setFilter('high_priority')}
              >
                High Priority
              </button>
              <button
                className={`filter-option ${filter === 'new' ? 'active' : ''}`}
                onClick={() => setFilter('new')}
              >
                New Today
              </button>
              <button
                className={`filter-option ${filter === 'large_amount' ? 'active' : ''}`}
                onClick={() => setFilter('large_amount')}
              >
                Large Amount ('$500K')
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="approval-content">
        {/* Contracts List */}
        <div className="contracts-list-section">
          <div className="section-header">
            <h2>Contracts Pending Final Approval ({filteredContracts.length})</h2>
            <div className="section-actions">
              <span className="sort-label">Sorted by: Forwarded Date</span>
            </div>
          </div>

          {filteredContracts.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} />
              <h3>No contracts pending approval</h3>
              <p>{searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'All contracts have been processed or are awaiting Program Manager review'}
              </p>
            </div>
          ) : (
            <div className="contracts-grid">
              {filteredContracts.map(contract => {
                const priority = getPriorityLevel(contract);
                const daysSince = calculateDaysSince(contract.forwarded_at);
                const priorityColor = getPriorityColor(priority);
                
                return (
                  <div 
                    key={contract.id} 
                    className={`contract-card ${selectedContract?.id === contract.id ? 'selected' : ''}`}
                    onClick={() => handleContractSelect(contract)}
                  >
                    <div className="card-header">
                      <div className="contract-status">
                        <div className="status-indicator" style={{ backgroundColor: getRecommendationColor(contract.review_recommendation) }} />
                        <span className="status-text">{contract.review_recommendation || 'pending'}</span>
                      </div>
                      <div className="priority-badge" style={{ backgroundColor: priorityColor }}>
                        {priority.toUpperCase()}
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="contract-icon">
                        <FileText size={20} />
                      </div>
                      <h3 className="contract-name">
                        {contract.grant_name || contract.filename || 'Unnamed Contract'}
                      </h3>
                      
                      <div className="contract-meta">
                        <div className="meta-item">
                          <Building size={12} />
                          <span>{contract.grantor || 'No grantor'}</span>
                        </div>
                        <div className="meta-item">
                          <User size={12} />
                          <span>Forwarded by: {contract.forwarded_by || 'Unknown'}</span>
                        </div>
                        {daysSince && (
                          <div className="meta-item">
                            <Clock size={12} />
                            <span>Waiting: {daysSince} day(s)</span>
                          </div>
                        )}
                      </div>

                      <div className="financial-info">
                        <div className="amount-display">
                          <DollarSign size={14} />
                          <span>{formatCurrency(contract.total_amount)}</span>
                        </div>
                      </div>

                      <div className="review-summary">
                        {contract.program_manager_review?.review_summary ? (
                          <p className="summary-text">
                            {contract.program_manager_review.review_summary.substring(0, 100)}...
                          </p>
                        ) : (
                          <p className="no-summary">No review summary provided</p>
                        )}
                      </div>
                    </div>

                    <div className="card-footer">
                      <button 
                        className="btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/contracts/${contract.id}`);
                        }}
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                      <button className="btn-menu">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Approval Panel */}
        {selectedContract && completeInfo && (
          <div className="approval-panel">
            <div className="approval-panel-header">
              <div className="panel-header-left">
                <h2>Final Approval</h2>
                <div className="contract-title">
                  <FileText size={18} />
                  <span>{selectedContract.grant_name || selectedContract.filename}</span>
                </div>
              </div>
              <div className="panel-header-right">
                <button 
                  className="btn-close"
                  onClick={() => {
                    setSelectedContract(null);
                    setCompleteInfo(null);
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="approval-tabs">
              <button 
                className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => setActiveTab('review')}
              >
                <MessageSquare size={16} />
                <span>Review & Decision</span>
              </button>
              {/* <button 
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <FileText size={16} />
                <span>Contract Details</span>
              </button> */}
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} />
                <span>Complete History</span>
              </button>
            </div>

            <div className="approval-panel-body">
              {/* Review & Decision Tab */}
              {activeTab === 'review' && (
                <div className="review-decision-tab">
                  {/* Program Manager Review Summary */}
                  <div className="pm-review-section">
                    <h3>
                      <Shield size={18} />
                      Program Manager Review
                    </h3>
                    
                    {completeInfo.program_manager_review ? (
                      <div className="pm-review-card">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <User size={14} />
                            <span className="reviewer-name">
                              {completeInfo.program_manager_review.reviewed_by_name || 'Unknown'}
                            </span>
                            <span className="reviewer-role">Program Manager</span>
                          </div>
                          <div className="review-date">
                            <Calendar size={14} />
                            <span>{formatDate(completeInfo.program_manager_review.reviewed_at)}</span>
                          </div>
                        </div>
                        
                        <div className="review-content">
                          <div className="recommendation-section">
                            <strong>Recommendation:</strong>
                            <div className={`recommendation-badge ${completeInfo.program_manager_review.overall_recommendation}`}>
                              {completeInfo.program_manager_review.overall_recommendation || 'No recommendation'}
                            </div>
                          </div>
                          
                          {completeInfo.program_manager_review.review_summary && (
                            <div className="summary-section">
                              <strong>Review Summary:</strong>
                              <p className="summary-text">
                                {completeInfo.program_manager_review.review_summary}
                              </p>
                            </div>
                          )}
                          
                          {completeInfo.program_manager_review.key_issues && 
                           completeInfo.program_manager_review.key_issues.length > 0 && (
                            <div className="key-issues-section">
                              <strong>Key Issues Identified:</strong>
                              <ul className="key-issues-list">
                                {completeInfo.program_manager_review.key_issues.map((issue, idx) => (
                                  <li key={idx}>
                                    <AlertCircle size={12} />
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="no-review">
                        <AlertCircle size={24} />
                        <p>No program manager review available</p>
                      </div>
                    )}
                  </div>

                  {/* Director's Decision Section */}
                  <div className="decision-section">
                    <h3>
                      <ShieldCheck size={18} />
                      Final Decision
                    </h3>
                    
                    {/* Decision Options */}
                    <div className="decision-options">
                      <div className="options-grid">
                        <label className={`decision-option ${decision === 'approve' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="decision"
                            value="approve"
                            checked={decision === 'approve'}
                            onChange={(e) => setDecision(e.target.value)}
                          />
                          <div className="option-content">
                            <div className="option-icon">
                              <CheckCircle size={24} />
                            </div>
                            <div className="option-text">
                              <span className="option-title">Approve</span>
                              <span className="option-description">Approve this contract for execution</span>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`decision-option ${decision === 'reject' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="decision"
                            value="reject"
                            checked={decision === 'reject'}
                            onChange={(e) => setDecision(e.target.value)}
                          />
                          <div className="option-content">
                            <div className="option-icon">
                              <XCircle size={24} />
                            </div>
                            <div className="option-text">
                              <span className="option-title">Reject</span>
                              <span className="option-description">Reject this contract</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Additional Requirements */}
                    <div className="additional-requirements">
                      <h4>Additional Requirements</h4>
                      <div className="requirements-grid">
                        <label className="requirement-checkbox">
                          <input
                            type="checkbox"
                            checked={riskAccepted}
                            onChange={(e) => setRiskAccepted(e.target.checked)}
                          />
                          <div className="checkbox-content">
                            <Shield size={18} />
                            <div>
                              <span className="requirement-title">Risk Acceptance</span>
                              <span className="requirement-description">Accept identified risks</span>
                            </div>
                          </div>
                        </label>
                        
                        <label className="requirement-checkbox">
                          <input
                            type="checkbox"
                            checked={businessSignOff}
                            onChange={(e) => setBusinessSignOff(e.target.checked)}
                          />
                          <div className="checkbox-content">
                            <TrendingUp size={18} />
                            <div>
                              <span className="requirement-title">Business Sign-off</span>
                              <span className="requirement-description">Business unit approval</span>
                            </div>
                          </div>
                        </label>
                        
                        <label className="requirement-checkbox">
                          <input
                            type="checkbox"
                            checked={lockContract}
                            onChange={(e) => setLockContract(e.target.checked)}
                          />
                          <div className="checkbox-content">
                            <Lock size={18} />
                            <div>
                              <span className="requirement-title">Lock Contract</span>
                              <span className="requirement-description">Prevent further changes</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="comments-section">
                      <label>
                        <MessageSquare size={16} />
                        Decision Comments *
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide detailed comments for your decision. This will be visible to the Program Manager and Project Manager."
                        rows={5}
                        className="decision-comments"
                      />
                      <div className="comments-help">
                        <AlertCircle size={14} />
                        <span>These comments will be included in the final approval notification</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedContract(null);
                          setCompleteInfo(null);
                          setDecision('');
                          setComments('');
                          setLockContract(false);
                          setRiskAccepted(false);
                          setBusinessSignOff(false);
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        onClick={handleFinalApproval}
                        disabled={!decision || !comments || submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={16} className="spinning" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Submit Final Decision
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Details Tab */}
              {activeTab === 'details' && completeInfo && (
                <div className="contract-details-tab">
                  <h3>Complete Contract Information</h3>
                  
                  {/* Basic Information */}
                  <div className="basic-info-section">
                    <h4>
                      <FileText size={16} />
                      Basic Information
                    </h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Contract Name</span>
                        <span className="info-value">{completeInfo.basic_info?.grant_name || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Contract ID</span>
                        <span className="info-value">{completeInfo.contract_id}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Grantor</span>
                        <span className="info-value">{completeInfo.basic_info?.grantor || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Grantee</span>
                        <span className="info-value">{completeInfo.basic_info?.grantee || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Total Amount</span>
                        <span className="info-value amount">
                          {formatCurrency(completeInfo.basic_info?.total_amount)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status</span>
                        <span className={`info-value status ${completeInfo.basic_info?.status}`}>
                          {completeInfo.basic_info?.status || 'unknown'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Start Date</span>
                        <span className="info-value">{formatDate(completeInfo.basic_info?.start_date)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">End Date</span>
                        <span className="info-value">{formatDate(completeInfo.basic_info?.end_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Data */}
                  {completeInfo.comprehensive_data && (
                    <div className="comprehensive-section">
                      <h4>
                        <BarChart3 size={16} />
                        Comprehensive Data
                      </h4>
                      <div className="comprehensive-view">
                        <pre className="json-view">
                          {JSON.stringify(completeInfo.comprehensive_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Complete History Tab */}
              {activeTab === 'history' && completeInfo && (
                <div className="complete-history-tab">
                  <h3>Complete Contract History</h3>
                  
                  {/* Activity Timeline */}
                  <div className="activity-timeline">
                    <h4>
                      <History size={16} />
                      Activity Timeline
                    </h4>
                    
                    {completeInfo.activity_logs && completeInfo.activity_logs.length > 0 ? (
                      <div className="timeline">
                        {completeInfo.activity_logs.map((activity, index) => (
                          <div key={activity.id} className="timeline-item">
                            <div className="timeline-marker" />
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span className="activity-type">{activity.activity_type}</span>
                                <span className="activity-date">{formatDateTime(activity.created_at)}</span>
                              </div>
                              <div className="timeline-body">
                                <div className="activity-user">
                                  <User size={12} />
                                  <span>{activity.user_name} ({activity.user_role})</span>
                                </div>
                                {activity.details && (
                                  <div className="activity-details">
                                    <pre>{JSON.stringify(activity.details, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-activity">
                        <History size={24} />
                        <p>No activity history available</p>
                      </div>
                    )}
                  </div>

                  {/* Review Comments */}
                  {completeInfo.review_comments && completeInfo.review_comments.length > 0 && (
                    <div className="review-comments-section">
                      <h4>
                        <MessageSquare size={16} />
                        Review Comments ({completeInfo.review_comments.length})
                      </h4>
                      <div className="comments-list">
                        {completeInfo.review_comments.map(comment => (
                          <div key={comment.id} className="comment-card">
                            <div className="comment-header">
                              <div className="commenter">
                                <User size={12} />
                                <span>{comment.user_name} ({comment.user_role})</span>
                              </div>
                              <div className="comment-date">
                                <Calendar size={12} />
                                <span>{formatDateTime(comment.created_at)}</span>
                              </div>
                            </div>
                            <div className="comment-body">
                              <p>{comment.comment}</p>
                              <div className="comment-tags">
                                {comment.flagged_risk && (
                                  <span className="tag risk">
                                    <AlertCircle size={10} />
                                    Risk
                                  </span>
                                )}
                                {comment.flagged_issue && (
                                  <span className="tag issue">
                                    <Flag size={10} />
                                    Issue
                                  </span>
                                )}
                                {comment.recommendation && (
                                  <span className={`tag recommendation ${comment.recommendation}`}>
                                    {comment.recommendation}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DirectorApproval;