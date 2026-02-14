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
  ShieldCheck,
  X,
  Archive,
  CheckSquare
} from 'lucide-react';
import API_CONFIG from '../../config';
import './DirectorApproval.css';

function DirectorApproval() {
  const [contracts, setContracts] = useState([]);
  const [approvedContracts, setApprovedContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [completeInfo, setCompleteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [lockContract, setLockContract] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [businessSignOff, setBusinessSignOff] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllContracts();
  }, []);

  const fetchAllContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/director/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Separate contracts by status
        const pendingContracts = data.filter(contract => 
          contract.status === "reviewed"
        );
        
        const approvedContractsList = data.filter(contract => 
          contract.status === "approved"
        );
        
        setContracts(pendingContracts);
        setApprovedContracts(approvedContractsList);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompleteContractInfo = async (contractId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/director/view-complete`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompleteInfo(data);
      } else {
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
    // Only allow review of pending contracts
    if (contract.status !== "reviewed") return;
    
    setSelectedContract(contract);
    setDecision('');
    setComments('');
    setLockContract(false);
    setRiskAccepted(false);
    setBusinessSignOff(false);
    setCompleteInfo(null);
    
    await fetchCompleteContractInfo(contract.id);
    setShowApprovalModal(true);
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedContract(null);
    setCompleteInfo(null);
    setDecision('');
    setComments('');
    setLockContract(false);
    setRiskAccepted(false);
    setBusinessSignOff(false);
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
        
        // Refresh all contracts
        await fetchAllContracts();
        
        closeApprovalModal();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#16a34a';
      case 'reviewed': return '#3b82f6';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Filter contracts based on active tab
  const getFilteredContracts = () => {
    let contractsToFilter = activeTab === 'pending' ? contracts : approvedContracts;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      contractsToFilter = contractsToFilter.filter(contract => {
        return (
          (contract.grant_name && contract.grant_name.toLowerCase().includes(searchLower)) ||
          (contract.grantor && contract.grantor.toLowerCase().includes(searchLower)) ||
          (contract.contract_number && contract.contract_number.toLowerCase().includes(searchLower)) ||
          (contract.forwarded_by && contract.forwarded_by.toLowerCase().includes(searchLower))
        );
      });
    }

    if (filter === 'high_priority' && activeTab === 'pending') {
      return contractsToFilter.filter(contract => getPriorityLevel(contract) === 'high');
    } else if (filter === 'new' && activeTab === 'pending') {
      return contractsToFilter.filter(contract => {
        const daysSince = calculateDaysSince(contract.forwarded_at);
        return daysSince && daysSince <= 1;
      });
    } else if (filter === 'large_amount') {
      return contractsToFilter.filter(contract => (contract.total_amount || 0) > 500000);
    }

    return contractsToFilter;
  };

  const filteredContracts = getFilteredContracts();

  const stats = {
    pending: contracts.length,
    approved: approvedContracts.length,
    highPriority: contracts.filter(c => getPriorityLevel(c) === 'high').length,
    newToday: contracts.filter(c => {
      const daysSince = calculateDaysSince(c.forwarded_at);
      return daysSince && daysSince <= 1;
    }).length,
    totalValue: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0) +
                approvedContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0)
  };

  const renderContractCard = (contract, isApproved = false) => {
    const priority = getPriorityLevel(contract);
    const daysSince = calculateDaysSince(contract.forwarded_at);
    const priorityColor = getPriorityColor(priority);
    
    return (
      <div 
        key={contract.id} 
        className={`da-contract-card ${selectedContract?.id === contract.id ? 'da-selected' : ''} ${isApproved ? 'da-approved' : ''}`}
        onClick={() => !isApproved ? handleContractSelect(contract) : null}
        style={{ cursor: isApproved ? 'default' : 'pointer' }}
      >
        <div className="da-card-header">
          <div className="da-contract-status">
            <div className="da-status-indicator" style={{ 
              backgroundColor: isApproved ? '#16a34a' : getRecommendationColor(contract.review_recommendation) 
            }} />
            <span className="da-status-text">
              {isApproved ? 'approved' : (contract.review_recommendation || 'pending')}
            </span>
          </div>
          {!isApproved && (
            <div className="da-priority-badge" style={{ backgroundColor: priorityColor }}>
              {priority.toUpperCase()}
            </div>
          )}
          {isApproved && (
            <div className="da-approved-badge" style={{ backgroundColor: '#16a34a', color: 'white' }}>
              APPROVED
            </div>
          )}
        </div>

        <div className="da-card-content">
          <div className="da-contract-icon">
            {isApproved ? <CheckSquare size={20} color="#16a34a" /> : <FileText size={20} />}
          </div>
          <h3 className="da-contract-name">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </h3>
          
          <div className="da-contract-meta">
            <div className="da-meta-item">
              <Building size={12} />
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="da-meta-item">
              <User size={12} />
              <span>Forwarded by: {contract.forwarded_by || 'Unknown'}</span>
            </div>
            {daysSince && !isApproved && (
              <div className="da-meta-item">
                <Clock size={12} />
                <span>Waiting: {daysSince} day(s)</span>
              </div>
            )}
            {isApproved && contract.director_decision_comments && (
              <div className="da-meta-item">
                <MessageSquare size={12} />
                <span>Approval notes</span>
              </div>
            )}
          </div>

          <div className="da-financial-info">
            <div className="da-amount-display">
              <DollarSign size={14} />
              <span>{formatCurrency(contract.total_amount)}</span>
            </div>
          </div>

          <div className="da-review-summary">
            {contract.program_manager_review?.review_summary ? (
              <p className="da-summary-text">
                {contract.program_manager_review.review_summary.substring(0, 100)}...
              </p>
            ) : (
              <p className="da-no-summary">No review summary provided</p>
            )}
          </div>
        </div>

        <div className="da-card-footer">
          <button 
            className="da-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/contracts/${contract.id}`);
            }}
          >
            <Eye size={14} />
            View Details
          </button>
          {!isApproved && (
            <button className="da-review-btn">
              Review
            </button>
          )}
          {isApproved && (
            <button className="da-approved-btn" style={{ backgroundColor: '#16a34a' }}>
              <CheckCircle size={14} />
              Approved
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading && !selectedContract) {
    return (
      <div className="da-loading">
        <div className="da-loading-content">
          <Loader2 size={48} className="da-spinning" />
          <h3>Loading Contracts</h3>
          <p>Fetching your assigned contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="da-container">
      {/* Header */}
      <div className="da-header">
        <div className="da-header-left">
          {/* <h1>Director Dashboard</h1>
          <p className="da-subtitle">
            Manage contracts assigned to you for review and approval
          </p> */}
        </div>
        <div className="da-header-actions">
         
        </div>
      </div>

      {/* Stats Overview */}
      <div className="da-stats">
        <div className="da-stat-card">
          <div className="da-stat-content">
            <span className="da-stat-value">{stats.pending}</span>
            <span className="da-stat-label">Pending Approval</span>
          </div>
        </div>
        <div className="da-stat-card">
          <div className="da-stat-content">
            <span className="da-stat-value">{stats.approved}</span>
            <span className="da-stat-label">Approved</span>
          </div>
        </div>
        <div className="da-stat-card">
          <div className="da-stat-content">
            <span className="da-stat-value">{stats.highPriority}</span>
            <span className="da-stat-label">High Priority</span>
          </div>
        </div>
        <div className="da-stat-card">
          <div className="da-stat-content">
            <span className="da-stat-value">{formatCurrency(stats.totalValue)}</span>
            <span className="da-stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {/* Tabs for Pending vs Approved */}
      <div className="da-tabs">
        <button 
          className={`da-tab ${activeTab === 'pending' ? 'da-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval ({contracts.length})
        </button>
        <button 
          className={`da-tab ${activeTab === 'approved' ? 'da-active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({approvedContracts.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="da-search-filters">
        <div className="da-section-controls">
          <div className="da-search-container">
            <Search className="da-search-icon" />
            <input
              type="text"
              placeholder={`Search ${activeTab} contracts...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="da-search-input"
            />
          </div>

          <div className="da-controls">
            {activeTab === 'pending' && (
              <button 
                className="da-filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                <span>Filters</span>
                <ChevronDown size={14} className={showFilters ? 'da-rotate' : ''} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters (only for pending) */}
      {showFilters && activeTab === 'pending' && (
        <div className="da-advanced-filters">
          <div className="da-filter-group">
            <label className="da-filter-label">
              <Filter size={16} />
              Filter by
            </label>
            <div className="da-filter-options">
              <button
                className={`da-filter-option ${filter === 'all' ? 'da-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Contracts
              </button>
              <button
                className={`da-filter-option ${filter === 'high_priority' ? 'da-active' : ''}`}
                onClick={() => setFilter('high_priority')}
              >
                High Priority
              </button>
              <button
                className={`da-filter-option ${filter === 'new' ? 'da-active' : ''}`}
                onClick={() => setFilter('new')}
              >
                New Today
              </button>
              <button
                className={`da-filter-option ${filter === 'large_amount' ? 'da-active' : ''}`}
                onClick={() => setFilter('large_amount')}
              >
                Large Amount ('$500K)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div className="da-contracts-section">
        <div className="da-section-header">
          <h2>
            {activeTab === 'pending' ? 'Contracts Pending Final Approval' : 'Approved Contracts'} 
            ({filteredContracts.length})
          </h2>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="da-empty-state">
            {activeTab === 'pending' ? (
              <>
                <CheckCircle size={48} />
                <h3>No contracts pending approval</h3>
                <p>All assigned contracts have been processed</p>
              </>
            ) : (
              <>
                <Archive size={48} />
                <h3>No approved contracts yet</h3>
                <p>Approved contracts will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="da-contracts-grid">
            {filteredContracts.map(contract => 
              renderContractCard(contract, activeTab === 'approved')
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedContract && completeInfo && (
        <div className="da-modal-overlay">
          <div className="da-modal-container">
            <div className="da-modal">
              {/* Modal Header */}
              <div className="da-modal-header">
                <div className="da-modal-title-section">
                  <h2>Final Approval</h2>
                  <div className="da-contract-title">
                    <FileText size={18} />
                    <span>{selectedContract.grant_name || selectedContract.filename}</span>
                  </div>
                </div>
                <button 
                  className="da-modal-close"
                  onClick={closeApprovalModal}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="da-modal-content">
                <div className="da-modal-body">
                  <div className="da-review-decision">
                    {/* Decision Options */}
                    <div className="da-decision-section">
                      <h3 className="da-decision-title">
                        <ShieldCheck size={20} />
                        Final Decision
                      </h3>
                      
                      <div className="da-decision-options">
                        <div className="da-options-grid">
                          <label className={`da-decision-option ${decision === 'approve' ? 'da-selected' : ''}`}>
                            <input
                              type="radio"
                              name="decision"
                              value="approve"
                              checked={decision === 'approve'}
                              onChange={(e) => setDecision(e.target.value)}
                              className="da-radio-input"
                            />
                            <div className="da-option-content">
                              <div className="da-option-icon">
                                <CheckCircle size={24} />
                              </div>
                              <div className="da-option-text">
                                <span className="da-option-title">Approve</span>
                                <span className="da-option-desc">Approve this contract for execution</span>
                              </div>
                            </div>
                          </label>
                          
                          <label className={`da-decision-option ${decision === 'reject' ? 'da-selected' : ''}`}>
                            <input
                              type="radio"
                              name="decision"
                              value="reject"
                              checked={decision === 'reject'}
                              onChange={(e) => setDecision(e.target.value)}
                              className="da-radio-input"
                            />
                            <div className="da-option-content">
                              <div className="da-option-icon">
                                <XCircle size={24} />
                              </div>
                              <div className="da-option-text">
                                <span className="da-option-title">Reject</span>
                                <span className="da-option-desc">Reject this contract</span>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="da-comments-section">
                        <label className="da-comments-label">
                          <MessageSquare size={16} />
                          Comments 
                        </label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Provide detailed comments for your decision. This will be visible to the Program Manager and Project Manager."
                          rows={5}
                          className="da-decision-comments"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="da-modal-actions">
                        <button
                          className="da-btn-secondary"
                          onClick={closeApprovalModal}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          className="da-btn-primary"
                          onClick={handleFinalApproval}
                          disabled={!decision || !comments || submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 size={16} className="da-spinning" />
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectorApproval;