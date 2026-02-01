import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Download,
  Calendar,
  User,
  Building,
  DollarSign,
  Shield,
  TrendingUp,
  Lock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Loader2,
  BarChart3,
  MessageSquare,
  Clock,
  Award,
  ExternalLink,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import API_CONFIG from '../../config';
import './ProgramManagerDirectorDecisions.css';
function ProgramManagerDirectorDecisions() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null); // ADDED THIS
  const [showReviewModal, setShowReviewModal] = useState(false); // ADDED THIS
  const [directorReviewLoading, setDirectorReviewLoading] = useState(false); // ADDED THIS
  const [stats, setStats] = useState({
    approved: 0,
    rejected: 0,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDirectorDecisions();
  }, []);

const fetchDirectorDecisions = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/program-manager/reviewed-by-director`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setContracts(data.contracts || []);
      setStats(data.summary || { approved: 0, rejected: 0, total: 0 });
    }
  } catch (error) {
    console.error('Failed to fetch director decisions:', error);
    // Try the fallback endpoint for approved contracts
    await fetchApprovedContractsFallback();
  } finally {
    setLoading(false);
  }
};

// Add this fallback function
const fetchApprovedContractsFallback = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/status/approved`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const approvedContracts = await response.json();
      
      // Filter for contracts where current user is a program manager
      const userContracts = approvedContracts.filter(contract => {
        // Check comprehensive data for program manager review
        if (contract.comprehensive_data?.program_manager_review) {
          return true;
        }
        
        // Check if user has review comments on this contract
        return contract.comprehensive_data?.review_history?.some(history => 
          history.by_user_id === user?.id || 
          history.by_user_role === "program_manager"
        );
      });
      
      setContracts(userContracts);
      setStats({
        approved: userContracts.length,
        rejected: 0,
        total: userContracts.length
      });
    }
  } catch (error) {
    console.error('Failed to fetch approved contracts fallback:', error);
  }
};

  const viewDirectorReview = async (contractId) => {
    try {
      setDirectorReviewLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager/director-review`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const reviewData = await response.json();
        console.log('Director review details:', reviewData);
        setSelectedReview(reviewData);
        setShowReviewModal(true);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Failed to load director review'}`);
      }
    } catch (error) {
      console.error('Failed to fetch director review:', error);
      alert('Failed to load director review details');
    } finally {
      setDirectorReviewLoading(false);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now - then;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const filteredContracts = contracts.filter(contract => {
    // Search filter
    if (searchTerm && !contract.grant_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !contract.grantor?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && contract.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'approve': return '#16a34a';
      case 'reject': return '#dc2626';
      case 'modify': return '#d97706';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <Loader2 size={48} className="spinning" />
          <h3>Loading Director Decisions</h3>
          <p>Fetching contracts reviewed by you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="program-manager-decisions">
      {/* Header */}
      <div className="decisions-header">
        <div className="header-left">
          <h1>Director Decisions</h1>
          {/* <p className="page-subtitle">
            View final decisions on contracts you reviewed
          </p> */}
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={fetchDirectorDecisions}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Reviewed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved by Director</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Rejected by Director</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">
              {contracts.filter(c => c.director_decision_comments).length}
            </span>
            <span className="stat-label">With Comments</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Contracts List */}
      <div className="contracts-section">
        <div className="section-header">
          <h2>Contracts with Director Decisions ({filteredContracts.length})</h2>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No decisions yet</h3>
            <p>Contracts you review will appear here after Director makes a decision</p>
          </div>
        ) : (
          <div className="contracts-grid">
            {filteredContracts.map((contract) => (
              <div key={contract.id} className="decision-card">
                {/* Header with status */}
                <div className="card-header">
                  <div className={`status-badge ${contract.status}`}>
                    {contract.status === 'approved' ? (
                      <>
                        <CheckCircle size={14} />
                        <span>Approved by Director</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        <span>Rejected by Director</span>
                      </>
                    )}
                  </div>
                  
                  <div className="card-meta">
                    <span className="meta-item">
                      <Clock size={12} />
                      {getTimeAgo(contract.director_decided_at)}
                    </span>
                  </div>
                </div>

                {/* Contract Info */}
                <div className="card-content">
                  {/* <div className="contract-icon">
                    <FileText size={24} />
                  </div> */}
                  
                  <h3 className="contract-name">
                    {contract.grant_name || contract.filename}
                  </h3>
                  
                  <div className="contract-meta">
                    <div className="meta-item">
                      <Building size={14} />
                      <span>{contract.grantor || 'No grantor'}</span>
                    </div>
                    <div className="meta-item">
                      <DollarSign size={14} />
                      <span>{formatCurrency(contract.total_amount)}</span>
                    </div>
                  </div>

                  {/* Your Recommendation vs Director Decision */}
                  <div className="decision-comparison">
                    <div className="comparison-row">
                      <div className="comparison-item">
                        <span className="comparison-label">Your Recommendation:</span>
                        <span 
                          className="recommendation-badge"
                          style={{ backgroundColor: getRecommendationColor(contract.program_manager_recommendation) }}
                        >
                          {contract.program_manager_recommendation}
                        </span>
                      </div>
                      <div className="comparison-item">
                        <span className="comparison-label">Director Decision:</span>
                        <span 
                          className="decision-badge"
                          style={{ backgroundColor: getRecommendationColor(contract.director_decision_status) }}
                        >
                          {contract.director_decision_status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Decision Outcome */}
                    <div className="outcome-indicator">
                      {contract.program_manager_recommendation === contract.director_decision_status ? (
                        <div className="outcome-match">
                          <CheckCircle size={16} />
                          <span>Director agreed with your recommendation</span>
                        </div>
                      ) : (
                        <div className="outcome-mismatch">
                          <AlertCircle size={16} />
                          <span>Director made a different decision</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Director Comments Preview */}
                  {contract.director_decision_comments && (
                    <div className="director-comments-preview">
                      <h4>Director's Comments:</h4>
                      <div className="comments-preview-box">
                        <p>{contract.director_decision_comments.length > 100 
                          ? `${contract.director_decision_comments.substring(0, 100)}...` 
                          : contract.director_decision_comments}
                        </p>
                        <button 
                          className="btn-view-more"
                          onClick={() => viewDirectorReview(contract.id)}
                          disabled={directorReviewLoading}
                        >
                          {directorReviewLoading ? 'Loading...' : 'View Full Review'}
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="additional-info">
                    {contract.is_locked && (
                      <div className="info-item">
                        <Lock size={14} />
                        <span>Contract Locked</span>
                      </div>
                    )}
                    {contract.risk_accepted && (
                      <div className="info-item">
                        <Shield size={14} />
                        <span>Risk Accepted</span>
                      </div>
                    )}
                    {contract.business_sign_off && (
                      <div className="info-item">
                        <TrendingUp size={14} />
                        <span>Business Sign-off</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="card-footer">
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <Eye size={16} />
                    View Contract
                  </button>
                  
                  <button 
                    className="btn-secondary"
                    onClick={() => viewDirectorReview(contract.id)}
                    disabled={directorReviewLoading}
                  >
                    {directorReviewLoading ? (
                      <Loader2 size={14} className="spinning" />
                    ) : (
                      <FileCheck size={14} />
                    )}
                     Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Director Review Modal */}
      {showReviewModal && selectedReview && (
        <div className="modal-overlay">
          <div className="modal-content director-review-modal">
            <div className="modal-header">
              <h3>Director Review Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReview(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="review-header">
                <div className="contract-info">
                  <h4>{selectedReview.contract_info.grant_name}</h4>
                  <div className="contract-meta">
                    <span>Status: {selectedReview.contract_status}</span>
                    <span>Grantor: {selectedReview.contract_info.grantor}</span>
                    <span>Amount: {formatCurrency(selectedReview.contract_info.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Program Manager Review */}
              {selectedReview.program_manager_review && (
                <div className="review-section">
                  <h5>
                    <ShieldCheck size={18} />
                    Your Review Summary
                  </h5>
                  <div className="review-card">
                    <div className="review-meta">
                      <span>
                        <User size={12} />
                        {selectedReview.program_manager_review.reviewed_by_name || 'You'}
                      </span>
                      <span>
                        <Calendar size={12} />
                        {formatDate(selectedReview.program_manager_review.reviewed_at)}
                      </span>
                    </div>
                    <div className="review-content">
                      <div className="recommendation-display">
                        <strong>Your Recommendation:</strong>
                        <span 
                          className="recommendation-badge"
                          style={{ backgroundColor: getRecommendationColor(selectedReview.program_manager_review.overall_recommendation) }}
                        >
                          {selectedReview.program_manager_review.overall_recommendation}
                        </span>
                      </div>
                      {selectedReview.program_manager_review.review_summary && (
                        <div className="summary-section">
                          <strong>Your Summary:</strong>
                          <p>{selectedReview.program_manager_review.review_summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Director Decision */}
              {selectedReview.director_decision ? (
                <div className="review-section">
                  <h5>
                    <Shield size={18} />
                    Director's Final Decision
                  </h5>
                  <div className="director-decision-card">
                    <div className="decision-header">
                      <div className="decision-maker">
                        <User size={14} />
                        <span>{selectedReview.director_decision.approved_by_name || 'Director'}</span>
                      </div>
                      <div className="decision-date">
                        <Calendar size={14} />
                        <span>{formatDate(selectedReview.director_decision.approved_at)}</span>
                      </div>
                    </div>
                    <div className="decision-content">
                      <div className="final-decision">
                        <strong>Final Decision:</strong>
                        <span 
                          className="decision-badge"
                          style={{ backgroundColor: getRecommendationColor(selectedReview.director_decision.final_decision) }}
                        >
                          {selectedReview.director_decision.final_decision}
                        </span>
                      </div>
                      {selectedReview.director_decision.approval_comments && (
                        <div className="director-comments">
                          <strong>Director's Comments:</strong>
                          <p>{selectedReview.director_decision.approval_comments}</p>
                        </div>
                      )}
                      <div className="additional-requirements">
                        {selectedReview.director_decision.risk_accepted && (
                          <div className="requirement-item">
                            <CheckCircle size={14} />
                            <span>Risk Accepted</span>
                          </div>
                        )}
                        {selectedReview.director_decision.business_sign_off && (
                          <div className="requirement-item">
                            <CheckCircle size={14} />
                            <span>Business Sign-off</span>
                          </div>
                        )}
                        {selectedReview.director_decision.contract_locked && (
                          <div className="requirement-item">
                            <Lock size={14} />
                            <span>Contract Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="review-section">
                  <h5>
                    <Shield size={18} />
                    Director Decision
                  </h5>
                  <div className="no-decision">
                    <AlertCircle size={24} />
                    <p>No director decision available for this contract yet.</p>
                  </div>
                </div>
              )}

              {/* Review Comments */}
              {selectedReview.review_comments && selectedReview.review_comments.length > 0 && (
                <div className="review-section">
                  <h5>
                    <MessageSquare size={18} />
                    All Review Comments ({selectedReview.review_comments.length})
                  </h5>
                  <div className="comments-list">
                    {selectedReview.review_comments.map((comment, index) => (
                      <div key={index} className="comment-item">
                        <div className="comment-header">
                          <span className="commenter">
                            <User size={12} />
                            {comment.user_name} ({comment.user_role})
                          </span>
                          <span className="comment-date">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <div className="comment-body">
                          <p>{comment.comment}</p>
                          <div className="comment-tags">
                            {comment.comment_type && (
                              <span className="tag type">{comment.comment_type}</span>
                            )}
                            {comment.flagged_risk && (
                              <span className="tag risk">
                                <AlertCircle size={10} />
                                Risk
                              </span>
                            )}
                            {comment.flagged_issue && (
                              <span className="tag issue">
                                <AlertCircle size={10} />
                                Issue
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
            
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReview(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramManagerDirectorDecisions;