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
  X
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
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContractsForApproval();
  }, []);

  const fetchContractsForApproval = async () => {
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
    setSelectedContract(contract);
    setDecision('');
    setComments('');
    setLockContract(false);
    setRiskAccepted(false);
    setBusinessSignOff(false);
    setCompleteInfo(null);
    setActiveTab('review');
    
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
        fetchContractsForApproval();
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

  const filteredContracts = contracts.filter(contract => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (contract.grant_name && contract.grant_name.toLowerCase().includes(searchLower)) ||
        (contract.grantor && contract.grantor.toLowerCase().includes(searchLower)) ||
        (contract.contract_number && contract.contract_number.toLowerCase().includes(searchLower)) ||
        (contract.forwarded_by && contract.forwarded_by.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

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
      <div className="director-loading">
        <div className="director-loading-content">
          <Loader2 size={48} className="director-spinning" />
          <h3>Loading Contracts for Approval</h3>
          <p>Fetching contracts that require final approval...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="director-container">
      {/* Header */}
      <div className="director-header">
        <div className="director-header-left">
          <h1>Director Approval Dashboard</h1>
          <p className="director-subtitle">
            Review and provide final approval for contracts forwarded by Program Managers
          </p>
        </div>
        <div className="director-header-actions">
          <button 
            className="director-btn-secondary"
            onClick={fetchContractsForApproval}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'director-spinning' : ''} />
            Refresh
          </button>
          <button className="director-btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="director-stats">
        <div className="director-stat-card">
          <div className="director-stat-content">
            <span className="director-stat-value">{stats.total}</span>
            <span className="director-stat-label">Pending Approval</span>
          </div>
        </div>
        <div className="director-stat-card">
          <div className="director-stat-content">
            <span className="director-stat-value">{stats.highPriority}</span>
            <span className="director-stat-label">High Priority</span>
          </div>
        </div>
        <div className="director-stat-card">
          <div className="director-stat-content">
            <span className="director-stat-value">{stats.newToday}</span>
            <span className="director-stat-label">New Today</span>
          </div>
        </div>
        <div className="director-stat-card">
          <div className="director-stat-content">
            <span className="director-stat-value">{formatCurrency(stats.totalValue)}</span>
            <span className="director-stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="director-search-filters">
        <div className="director-section-controls">
          {/* <div className="director-search-container">
            <Search className="director-search-icon" />
            <input
              type="text"
              placeholder="Search contracts by name, grantor, or forwarded by..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="director-search-input"
            />
          </div> */}

          <div className="director-controls">
            {/* <button 
              className="director-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filters</span>
              <ChevronDown size={14} className={showFilters ? 'director-rotate' : ''} />
            </button> */}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="director-advanced-filters">
          <div className="director-filter-group">
            <label className="director-filter-label">
              <Filter size={16} />
              Filter by
            </label>
            <div className="director-filter-options">
              <button
                className={`director-filter-option ${filter === 'all' ? 'director-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Contracts
              </button>
              <button
                className={`director-filter-option ${filter === 'high_priority' ? 'director-active' : ''}`}
                onClick={() => setFilter('high_priority')}
              >
                High Priority
              </button>
              <button
                className={`director-filter-option ${filter === 'new' ? 'director-active' : ''}`}
                onClick={() => setFilter('new')}
              >
                New Today
              </button>
              <button
                className={`director-filter-option ${filter === 'large_amount' ? 'director-active' : ''}`}
                onClick={() => setFilter('large_amount')}
              >
                Large Amount ('$500K')
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div className="director-contracts-section">
        <div className="director-section-header">
          <h2>Contracts Pending Final Approval ({filteredContracts.length})</h2>
          {/* <div className="director-section-actions">
            <span className="director-sort-label">Sorted by: Forwarded Date</span>
          </div> */}
        </div>

        {filteredContracts.length === 0 ? (
          <div className="director-empty-state">
            <CheckCircle size={48} />
            <h3>No contracts pending approval</h3>
            <p>{searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'All contracts have been processed or are awaiting Program Manager review'}
            </p>
          </div>
        ) : (
          <div className="director-contracts-grid">
            {filteredContracts.map(contract => {
              const priority = getPriorityLevel(contract);
              const daysSince = calculateDaysSince(contract.forwarded_at);
              const priorityColor = getPriorityColor(priority);
              
              return (
                <div 
                  key={contract.id} 
                  className={`director-contract-card ${selectedContract?.id === contract.id ? 'director-selected' : ''}`}
                  onClick={() => handleContractSelect(contract)}
                >
                  <div className="director-card-header">
                    <div className="director-contract-status">
                      <div className="director-status-indicator" style={{ backgroundColor: getRecommendationColor(contract.review_recommendation) }} />
                      <span className="director-status-text">{contract.review_recommendation || 'pending'}</span>
                    </div>
                    <div className="director-priority-badge" style={{ backgroundColor: priorityColor }}>
                      {priority.toUpperCase()}
                    </div>
                  </div>

                  <div className="director-card-content">
                    <div className="director-contract-icon">
                      <FileText size={20} />
                    </div>
                    <h3 className="director-contract-name">
                      {contract.grant_name || contract.filename || 'Unnamed Contract'}
                    </h3>
                    
                    <div className="director-contract-meta">
                      <div className="director-meta-item">
                        <Building size={12} />
                        <span>{contract.grantor || 'No grantor'}</span>
                      </div>
                      <div className="director-meta-item">
                        <User size={12} />
                        <span>Forwarded by: {contract.forwarded_by || 'Unknown'}</span>
                      </div>
                      {daysSince && (
                        <div className="director-meta-item">
                          <Clock size={12} />
                          <span>Waiting: {daysSince} day(s)</span>
                        </div>
                      )}
                    </div>

                    <div className="director-financial-info">
                      <div className="director-amount-display">
                        <DollarSign size={14} />
                        <span>{formatCurrency(contract.total_amount)}</span>
                      </div>
                    </div>

                    <div className="director-review-summary">
                      {contract.program_manager_review?.review_summary ? (
                        <p className="director-summary-text">
                          {contract.program_manager_review.review_summary.substring(0, 100)}...
                        </p>
                      ) : (
                        <p className="director-no-summary">No review summary provided</p>
                      )}
                    </div>
                  </div>

                  <div className="director-card-footer">
                    <button 
                      className="director-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/contracts/${contract.id}`);
                      }}
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                    <button className="director-review-btn">
                      Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedContract && completeInfo && (
        <div className="director-modal-overlay">
          <div className="director-modal-container">
            <div className="director-modal">
              {/* Modal Header */}
              <div className="director-modal-header">
                <div className="director-modal-title-section">
                  <h2>Final Approval</h2>
                  {/* <div className="director-contract-title">
                    <FileText size={18} />
                    <span>{selectedContract.grant_name || selectedContract.filename}</span>
                  </div> */}
                </div>
                <button 
                  className="director-modal-close"
                  onClick={closeApprovalModal}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="director-modal-content">
                <div className="director-modal-body">
                  <div className="director-review-decision">
                    {/* Decision Options */}
                    <div className="director-decision-section">
                      
                      <div className="director-decision-options">
                        <div className="director-options-grid">
                          <label className={`director-decision-option ${decision === 'approve' ? 'director-selected' : ''}`}>
                            <input
                              type="radio"
                              name="decision"
                              value="approve"
                              checked={decision === 'approve'}
                              onChange={(e) => setDecision(e.target.value)}
                              className="director-radio-input"
                            />
                            <div className="director-option-content">
                              <div className="director-option-icon">
                                <CheckCircle size={24} />
                              </div>
                              <div className="director-option-text">
                                <span className="director-option-title">Approve</span>
                                <span className="director-option-desc">Approve this contract for execution</span>
                              </div>
                            </div>
                          </label>
                          
                          <label className={`director-decision-option ${decision === 'reject' ? 'director-selected' : ''}`}>
                            <input
                              type="radio"
                              name="decision"
                              value="reject"
                              checked={decision === 'reject'}
                              onChange={(e) => setDecision(e.target.value)}
                              className="director-radio-input"
                            />
                            <div className="director-option-content">
                              <div className="director-option-icon">
                                <XCircle size={24} />
                              </div>
                              <div className="director-option-text">
                                <span className="director-option-title">Reject</span>
                                <span className="director-option-desc">Reject this contract</span>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="director-comments-section">
                        <label className="director-comments-label">
                          {/* <MessageSquare size={16} /> */}
                          Comments 
                        </label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          // placeholder="Provide detailed comments for your decision. This will be visible to the Program Manager and Project Manager."
                          rows={5}
                          className="director-decision-comments"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="director-modal-actions">
                        <button
                          className="director-btn-secondary"
                          onClick={closeApprovalModal}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          className="director-btn-primary"
                          onClick={handleFinalApproval}
                          disabled={!decision || !comments || submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 size={16} className="director-spinning" />
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

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   CheckCircle,
//   XCircle,
//   Lock,
//   Shield,
//   AlertCircle,
//   FileText,
//   Eye,
//   Download,
//   Send,
//   History,
//   MessageSquare,
//   TrendingUp,
//   BarChart3,
//   Calendar,
//   User,
//   Building,
//   DollarSign,
//   Loader2,
//   Filter,
//   Search,
//   RefreshCw,
//   Clock,
//   Flag,
//   ChevronDown,
//   MoreVertical,
//   ShieldCheck,
//   X
// } from 'lucide-react';
// import API_CONFIG from '../../config';
// import './DirectorApproval.css';

// function DirectorApproval() {
//   const [contracts, setContracts] = useState([]);
//   const [selectedContract, setSelectedContract] = useState(null);
//   const [completeInfo, setCompleteInfo] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [decision, setDecision] = useState('');
//   const [comments, setComments] = useState('');
//   const [lockContract, setLockContract] = useState(false);
//   const [riskAccepted, setRiskAccepted] = useState(false);
//   const [businessSignOff, setBusinessSignOff] = useState(false);
//   const [activeTab, setActiveTab] = useState('review');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filter, setFilter] = useState('all');
//   const [showFilters, setShowFilters] = useState(false);
//   const [showApprovalModal, setShowApprovalModal] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchContractsForApproval();
//   }, []);

//   const fetchContractsForApproval = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       // Use Director's specific endpoint
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/director/dashboard`, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
        
//         // FIX: Show contracts with status "reviewed" OR "approved" for Director approval section
//         const contractsForApproval = data.filter(contract => 
//           contract.status === "reviewed" || contract.status === "approved"
//         );
        
//         setContracts(contractsForApproval);
//       }
//     } catch (error) {
//       console.error('Failed to fetch contracts for approval:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCompleteContractInfo = async (contractId) => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       // Try the director-specific endpoint first
//       let response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/director/view-complete`, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setCompleteInfo(data);
//       } else {
//         // Fallback to regular contract endpoint
//         const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });
        
//         if (fallbackResponse.ok) {
//           const fallbackData = await fallbackResponse.json();
//           setCompleteInfo({
//             contract_id: contractId,
//             basic_info: fallbackData,
//             comprehensive_data: fallbackData.comprehensive_data || {}
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch complete contract info:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleContractSelect = async (contract) => {
//     setSelectedContract(contract);
//     setDecision('');
//     setComments('');
//     setLockContract(false);
//     setRiskAccepted(false);
//     setBusinessSignOff(false);
//     setCompleteInfo(null);
//     setActiveTab('review');
    
//     // Fetch complete information
//     await fetchCompleteContractInfo(contract.id);
//     setShowApprovalModal(true);
//   };

//   const closeApprovalModal = () => {
//     setShowApprovalModal(false);
//     setSelectedContract(null);
//     setCompleteInfo(null);
//     setDecision('');
//     setComments('');
//     setLockContract(false);
//     setRiskAccepted(false);
//     setBusinessSignOff(false);
//   };

//   const handleFinalApproval = async () => {
//     if (!selectedContract || !decision || !comments) {
//       alert('Please select a decision, provide comments, and complete all required fields');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${selectedContract.id}/director/final-approval`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           decision: decision,
//           comments: comments,
//           lock_contract: lockContract,
//           risk_accepted: riskAccepted,
//           business_sign_off: businessSignOff
//         })
//       });

//       if (response.ok) {
//         const result = await response.json();
//         alert(result.message);
//         // Refresh the list
//         fetchContractsForApproval();
//         // Close modal and reset
//         closeApprovalModal();
//       } else {
//         const error = await response.json();
//         alert(`Failed to submit decision: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to submit decision:', error);
//       alert('Failed to submit decision');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return '-';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
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

//   const formatDateTime = (dateString) => {
//     if (!dateString) return 'Not specified';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (e) {
//       return dateString;
//     }
//   };

//   const calculateDaysSince = (dateString) => {
//     if (!dateString) return null;
//     try {
//       const reviewDate = new Date(dateString);
//       const now = new Date();
//       const diffTime = Math.abs(now - reviewDate);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return diffDays;
//     } catch (e) {
//       return null;
//     }
//   };

//   const getPriorityLevel = (contract) => {
//     const daysSince = calculateDaysSince(contract.forwarded_at);
//     const amount = contract.total_amount || 0;
    
//     if (daysSince && daysSince > 5) return 'high';
//     if (amount > 1000000) return 'high';
//     if (contract.review_recommendation === 'approve' && contract.flagged_issues) return 'medium';
//     return 'low';
//   };

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case 'high': return '#dc2626';
//       case 'medium': return '#f59e0b';
//       case 'low': return '#10b981';
//       default: return '#6b7280';
//     }
//   };

//   const getRecommendationColor = (recommendation) => {
//     switch (recommendation) {
//       case 'approve': return '#16a34a';
//       case 'reject': return '#dc2626';
//       case 'modify': return '#d97706';
//       default: return '#6b7280';
//     }
//   };

//   const filteredContracts = contracts.filter(contract => {
//     // Apply search filter
//     if (searchTerm) {
//       const searchLower = searchTerm.toLowerCase();
//       const matchesSearch = 
//         (contract.grant_name && contract.grant_name.toLowerCase().includes(searchLower)) ||
//         (contract.grantor && contract.grantor.toLowerCase().includes(searchLower)) ||
//         (contract.contract_number && contract.contract_number.toLowerCase().includes(searchLower)) ||
//         (contract.forwarded_by && contract.forwarded_by.toLowerCase().includes(searchLower));
//       if (!matchesSearch) return false;
//     }

//     // Apply status filter
//     if (filter === 'high_priority') {
//       return getPriorityLevel(contract) === 'high';
//     } else if (filter === 'new') {
//       const daysSince = calculateDaysSince(contract.forwarded_at);
//       return daysSince && daysSince <= 1;
//     } else if (filter === 'large_amount') {
//       return (contract.total_amount || 0) > 500000;
//     }

//     return true;
//   });

//   // Calculate statistics
//   const stats = {
//     total: contracts.length,
//     highPriority: contracts.filter(c => getPriorityLevel(c) === 'high').length,
//     newToday: contracts.filter(c => {
//       const daysSince = calculateDaysSince(c.forwarded_at);
//       return daysSince && daysSince <= 1;
//     }).length,
//     totalValue: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0)
//   };

//   if (loading && !selectedContract) {
//     return (
//       <div className="director-loading-page">
//         <div className="loading-content">
//           <Loader2 size={48} className="spinning" />
//           <h3>Loading Contracts for Approval</h3>
//           <p>Fetching contracts that require final approval...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="director-approval-page">
//       {/* Header */}
//       <div className="approval-header">
//         <div className="header-left">
//           <h1>Director Approval Dashboard</h1>
//           <p className="page-subtitle">
//             Review and provide final approval for contracts forwarded by Program Managers
//           </p>
//         </div>
//         <div className="header-actions">
//           <button 
//             className="btn-secondary"
//             onClick={fetchContractsForApproval}
//             disabled={loading}
//           >
//             <RefreshCw size={16} className={loading ? 'spinning' : ''} />
//             Refresh
//           </button>
//           <button className="btn-primary">
//             <Download size={16} />
//             Export Report
//           </button>
//         </div>
//       </div>

//       {/* Stats Overview */}
//       <div className="stats-overview">
//         <div className="stat-card">
//           <div className="stat-content">
//             <span className="stat-value">{stats.total}</span>
//             <span className="stat-label">Pending Approval</span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-content">
//             <span className="stat-value">{stats.highPriority}</span>
//             <span className="stat-label">High Priority</span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-content">
//             <span className="stat-value">{stats.newToday}</span>
//             <span className="stat-label">New Today</span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-content">
//             <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
//             <span className="stat-label">Total Value</span>
//           </div>
//         </div>
//       </div>

//       {/* Search and Filters */}
//       <div className="search-filters-section">
//         <div className="section-controls">
//           <div className="search-container">
//             <Search className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search contracts by name, grantor, or forwarded by..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//           </div>

//           <div className="controls-container">
//             <button 
//               className="btn-filter"
//               onClick={() => setShowFilters(!showFilters)}
//             >
//               <Filter size={16} />
//               <span>Filters</span>
//               <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Advanced Filters */}
//       {showFilters && (
//         <div className="advanced-filters">
//           <div className="filter-group">
//             <label className="filter-label">
//               <Filter size={16} />
//               Filter by
//             </label>
//             <div className="filter-options">
//               <button
//                 className={`filter-option ${filter === 'all' ? 'active' : ''}`}
//                 onClick={() => setFilter('all')}
//               >
//                 All Contracts
//               </button>
//               <button
//                 className={`filter-option ${filter === 'high_priority' ? 'active' : ''}`}
//                 onClick={() => setFilter('high_priority')}
//               >
//                 High Priority
//               </button>
//               <button
//                 className={`filter-option ${filter === 'new' ? 'active' : ''}`}
//                 onClick={() => setFilter('new')}
//               >
//                 New Today
//               </button>
//               <button
//                 className={`filter-option ${filter === 'large_amount' ? 'active' : ''}`}
//                 onClick={() => setFilter('large_amount')}
//               >
//                 Large Amount ('$500K')
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Contracts List */}
//       <div className="contracts-list-section">
//         <div className="section-header">
//           <h2>Contracts Pending Final Approval ({filteredContracts.length})</h2>
//           <div className="section-actions">
//             <span className="sort-label">Sorted by: Forwarded Date</span>
//           </div>
//         </div>

//         {filteredContracts.length === 0 ? (
//           <div className="empty-state">
//             <CheckCircle size={48} />
//             <h3>No contracts pending approval</h3>
//             <p>{searchTerm || filter !== 'all' 
//               ? 'Try adjusting your search or filters' 
//               : 'All contracts have been processed or are awaiting Program Manager review'}
//             </p>
//           </div>
//         ) : (
//           <div className="contracts-grid">
//             {filteredContracts.map(contract => {
//               const priority = getPriorityLevel(contract);
//               const daysSince = calculateDaysSince(contract.forwarded_at);
//               const priorityColor = getPriorityColor(priority);
              
//               return (
//                 <div 
//                   key={contract.id} 
//                   className={`contract-card ${selectedContract?.id === contract.id ? 'selected' : ''}`}
//                   onClick={() => handleContractSelect(contract)}
//                 >
//                   <div className="card-header">
//                     <div className="contract-status">
//                       <div className="status-indicator" style={{ backgroundColor: getRecommendationColor(contract.review_recommendation) }} />
//                       <span className="status-text">{contract.review_recommendation || 'pending'}</span>
//                     </div>
//                     <div className="priority-badge" style={{ backgroundColor: priorityColor }}>
//                       {priority.toUpperCase()}
//                     </div>
//                   </div>

//                   <div className="card-content">
//                     <div className="contract-icon">
//                       <FileText size={20} />
//                     </div>
//                     <h3 className="contract-name">
//                       {contract.grant_name || contract.filename || 'Unnamed Contract'}
//                     </h3>
                    
//                     <div className="contract-meta">
//                       <div className="meta-item">
//                         <Building size={12} />
//                         <span>{contract.grantor || 'No grantor'}</span>
//                       </div>
//                       <div className="meta-item">
//                         <User size={12} />
//                         <span>Forwarded by: {contract.forwarded_by || 'Unknown'}</span>
//                       </div>
//                       {daysSince && (
//                         <div className="meta-item">
//                           <Clock size={12} />
//                           <span>Waiting: {daysSince} day(s)</span>
//                         </div>
//                       )}
//                     </div>

//                     <div className="financial-info">
//                       <div className="amount-display">
//                         <DollarSign size={14} />
//                         <span>{formatCurrency(contract.total_amount)}</span>
//                       </div>
//                     </div>

//                     <div className="review-summary">
//                       {contract.program_manager_review?.review_summary ? (
//                         <p className="summary-text">
//                           {contract.program_manager_review.review_summary.substring(0, 100)}...
//                         </p>
//                       ) : (
//                         <p className="no-summary">No review summary provided</p>
//                       )}
//                     </div>
//                   </div>

//                   <div className="card-footer">
//                     <button 
//                       className="btn-view"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         navigate(`/contracts/${contract.id}`);
//                       }}
//                     >
//                       <Eye size={14} />
//                       View Details
//                     </button>
//                     <button className="btn-menu">
//                       <MoreVertical size={14} />
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Approval Modal */}
//       {showApprovalModal && selectedContract && completeInfo && (
//         <div className="approval-modal-overlay">
//           <div className="approval-modal-container">
//             <div className="approval-modal">
//               {/* Modal Header */}
//               <div className="modal-header">
//                 <div className="modal-title-section">
//                   <h2>Final Approval</h2>
//                   <div className="contract-title">
//                     <FileText size={18} />
//                     <span>{selectedContract.grant_name || selectedContract.filename}</span>
//                   </div>
//                 </div>
//                 <button 
//                   className="modal-close-btn"
//                   onClick={closeApprovalModal}
//                 >
//                   <X size={24} />
//                 </button>
//               </div>

//               {/* Modal Content */}
//               <div className="modal-content">
//                 {/* Tabs */}
//                 {/* <div className="modal-tabs">
//                   <button 
//                     className={`modal-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
//                     onClick={() => setActiveTab('review')}
//                   >
//                     <MessageSquare size={16} />
//                     <span>Review & Decision</span>
//                   </button>
//                 </div> */}

//                 <div className="modal-body">
//                   {/* Review & Decision Tab */}
//                   {activeTab === 'review' && (
//                     <div className="review-decision-tab">
//                       {/* Program Manager Review Summary */}
//                       {/* <div className="pm-review-section">
//                         <h3>
//                           <Shield size={18} />
//                           Program Manager Review
//                         </h3>
                        
//                         {completeInfo.program_manager_review ? (
//                           <div className="pm-review-card">
//                             <div className="review-header">
//                               <div className="reviewer-info">
//                                 <User size={14} />
//                                 <span className="reviewer-name">
//                                   {completeInfo.program_manager_review.reviewed_by_name || 'Unknown'}
//                                 </span>
//                                 <span className="reviewer-role">Program Manager</span>
//                               </div>
//                               <div className="review-date">
//                                 <Calendar size={14} />
//                                 <span>{formatDate(completeInfo.program_manager_review.reviewed_at)}</span>
//                               </div>
//                             </div>
                            
//                             <div className="review-content">
//                               <div className="recommendation-section">
//                                 <strong>Recommendation:</strong>
//                                 <div className={`recommendation-badge ${completeInfo.program_manager_review.overall_recommendation}`}>
//                                   {completeInfo.program_manager_review.overall_recommendation || 'No recommendation'}
//                                 </div>
//                               </div>
                              
//                               {completeInfo.program_manager_review.review_summary && (
//                                 <div className="summary-section">
//                                   <strong>Review Summary:</strong>
//                                   <p className="summary-text">
//                                     {completeInfo.program_manager_review.review_summary}
//                                   </p>
//                                 </div>
//                               )}
                              
//                               {completeInfo.program_manager_review.key_issues && 
//                               completeInfo.program_manager_review.key_issues.length > 0 && (
//                                 <div className="key-issues-section">
//                                   <strong>Key Issues Identified:</strong>
//                                   <ul className="key-issues-list">
//                                     {completeInfo.program_manager_review.key_issues.map((issue, idx) => (
//                                       <li key={idx}>
//                                         <AlertCircle size={12} />
//                                         <span>{issue}</span>
//                                       </li>
//                                     ))}
//                                   </ul>
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="no-review">
//                             <AlertCircle size={24} />
//                             <p>No program manager review available</p>
//                           </div>
//                         )}
//                       </div> */}

//                       {/* Director's Decision Section */}
//                       <div className="decision-section">
//                         {/* <h3>
//                           <ShieldCheck size={18} />
//                           Final Decision
//                         </h3> */}
                        
//                         {/* Decision Options */}
//                         <div className="decision-options">
//                           <div className="options-grid">
//                             <label className={`decision-option ${decision === 'approve' ? 'selected' : ''}`}>
//                               <input
//                                 type="radio"
//                                 name="decision"
//                                 value="approve"
//                                 checked={decision === 'approve'}
//                                 onChange={(e) => setDecision(e.target.value)}
//                               />
//                               <div className="option-content">
//                                 <div className="option-icon">
//                                   <CheckCircle size={24} />
//                                 </div>
//                                 <div className="option-text">
//                                   <span className="option-title">Approve</span>
//                                   <span className="option-description">Approve this contract for execution</span>
//                                 </div>
//                               </div>
//                             </label>
                            
//                             <label className={`decision-option ${decision === 'reject' ? 'selected' : ''}`}>
//                               <input
//                                 type="radio"
//                                 name="decision"
//                                 value="reject"
//                                 checked={decision === 'reject'}
//                                 onChange={(e) => setDecision(e.target.value)}
//                               />
//                               <div className="option-content">
//                                 <div className="option-icon">
//                                   <XCircle size={24} />
//                                 </div>
//                                 <div className="option-text">
//                                   <span className="option-title">Reject</span>
//                                   <span className="option-description">Reject this contract</span>
//                                 </div>
//                               </div>
//                             </label>
//                           </div>
//                         </div>

//                         {/* Additional Requirements */}
//                         {/* <div className="additional-requirements">
//                           <h4>Additional Requirements</h4>
//                           <div className="requirements-grid">
//                             <label className="requirement-checkbox">
//                               <input
//                                 type="checkbox"
//                                 checked={riskAccepted}
//                                 onChange={(e) => setRiskAccepted(e.target.checked)}
//                               />
//                               <div className="checkbox-content">
//                                 <Shield size={18} />
//                                 <div>
//                                   <span className="requirement-title">Risk Acceptance</span>
//                                   <span className="requirement-description">Accept identified risks</span>
//                                 </div>
//                               </div>
//                             </label>
                            
//                             <label className="requirement-checkbox">
//                               <input
//                                 type="checkbox"
//                                 checked={businessSignOff}
//                                 onChange={(e) => setBusinessSignOff(e.target.checked)}
//                               />
//                               <div className="checkbox-content">
//                                 <TrendingUp size={18} />
//                                 <div>
//                                   <span className="requirement-title">Business Sign-off</span>
//                                   <span className="requirement-description">Business unit approval</span>
//                                 </div>
//                               </div>
//                             </label>
                            
//                             <label className="requirement-checkbox">
//                               <input
//                                 type="checkbox"
//                                 checked={lockContract}
//                                 onChange={(e) => setLockContract(e.target.checked)}
//                               />
//                               <div className="checkbox-content">
//                                 <Lock size={18} />
//                                 <div>
//                                   <span className="requirement-title">Lock Contract</span>
//                                   <span className="requirement-description">Prevent further changes</span>
//                                 </div>
//                               </div>
//                             </label>
//                           </div>
//                         </div> */}

//                         {/* Comments */}
//                         <div className="comments-section">
//                           <label>
//                             <MessageSquare size={16} />
//                             Decision Comments *
//                           </label>
//                           <textarea
//                             value={comments}
//                             onChange={(e) => setComments(e.target.value)}
//                             placeholder="Provide detailed comments for your decision. This will be visible to the Program Manager and Project Manager."
//                             rows={5}
//                             className="decision-comments"
//                           />
//                           {/* <div className="comments-help">
//                             <AlertCircle size={14} />
//                             <span>These comments will be included in the final approval notification</span>
//                           </div> */}
//                         </div>

//                         {/* Action Buttons */}
//                         <div className="modal-action-buttons">
//                           <button
//                             className="btn-secondary"
//                             onClick={closeApprovalModal}
//                             disabled={submitting}
//                           >
//                             Cancel
//                           </button>
//                           <button
//                             className="btn-primary"
//                             onClick={handleFinalApproval}
//                             disabled={!decision || !comments || submitting}
//                           >
//                             {submitting ? (
//                               <>
//                                 <Loader2 size={16} className="spinning" />
//                                 Processing...
//                               </>
//                             ) : (
//                               <>
//                                 <Send size={16} />
//                                 Submit Final Decision
//                               </>
//                             )}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default DirectorApproval;
