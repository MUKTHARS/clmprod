import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Flag,
  Edit,
  Calendar,
  User,
  FileText,
  Eye,
  Download,
  Send,
  History,
  Shield,
  Check,
  X,
  Filter,
  Search,
  ChevronDown,
  Clock,
  TrendingUp,
  DollarSign,
  Building,
  Target,
  BarChart3,
  FileCheck,
  Loader2,
  RefreshCw,
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  ListChecks,
  AlertTriangle,
  Award,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  FileWarning,
  Info
} from 'lucide-react';
import API_CONFIG from '../../config';
import './ProgramManagerReview.css';

function ProgramManagerReview() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({
    comment: '',
    comment_type: 'review',
    flagged_risk: false,
    flagged_issue: false,
    change_request: null,
    recommendation: ''
  });
  const [reviewSummary, setReviewSummary] = useState({
    review_summary: '',
    overall_recommendation: '',
    key_issues: [],
    risk_assessment: {},
    change_requests: []
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate unique key for each comment to avoid duplicate keys
  const generateCommentKey = (comment) => {
    // Use id + timestamp to ensure uniqueness
    if (comment.id && comment.created_at) {
      return `${comment.id}_${comment.created_at}`;
    }
    // Fallback for comments without id
    if (comment.id) {
      return `comment_${comment.id}`;
    }
    // Fallback for comments with timestamp only
    if (comment.created_at) {
      return `comment_${comment.created_at}`;
    }
    // Final fallback - generate random key (should rarely happen)
    return `comment_${Math.random().toString(36).substr(2, 9)}`;
  };

  useEffect(() => {
    if (contractId) {
      fetchContractData();
      fetchReviewComments();
    }
  }, [contractId]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContract(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch contract');
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/review-comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Debug: Check for duplicate IDs
        const commentIds = data.comments?.map(c => c.id) || [];
        const duplicateIds = commentIds.filter((id, index) => commentIds.indexOf(id) !== index);
        
        if (duplicateIds.length > 0) {
          console.warn('Found duplicate comment IDs:', duplicateIds);
          
          // Remove duplicates by creating unique IDs
          const uniqueComments = (data.comments || []).map((comment, index) => ({
            ...comment,
            uniqueId: generateCommentKey(comment)
          }));
          
          setComments(uniqueComments);
        } else {
          setComments(data.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager/add-comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newComment,
          contract_id: parseInt(contractId)
        })
      });

      if (response.ok) {
        alert('Comment added successfully');
        setNewComment({
          comment: '',
          comment_type: 'review',
          flagged_risk: false,
          flagged_issue: false,
          change_request: null,
          recommendation: ''
        });
        fetchReviewComments();
      } else {
        const error = await response.json();
        alert(`Failed to add comment: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

const handleSubmitReview = async () => {
  if (!reviewSummary.review_summary.trim()) {
    alert('Please provide a review summary');
    return;
  }

  if (!reviewSummary.overall_recommendation) {
    alert('Please select an overall recommendation');
    return;
  }

  setSubmitting(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager/submit-review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...reviewSummary,
        contract_id: parseInt(contractId),
        comments: comments.filter(c => !c.id) // Only send new comments
      })
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message);
      setShowSubmitModal(false);
      navigate('/review'); 
    } else {
      const error = await response.json();
      alert(`Failed to submit review: ${error.detail}`);
    }
  } catch (error) {
    console.error('Failed to submit review:', error);
    alert('Failed to submit review');
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
    } catch (error) {
      return dateString;
    }
  };

  const getForwardingNotice = () => {
    if (reviewSummary.overall_recommendation === 'approve') {
      return {
        title: 'Ready for Director Approval',
        message: 'This contract will be forwarded to the Director for final approval after submission.',
        icon: Shield,
        color: '#16a34a',
        bgColor: '#dcfce7'
      };
    } else if (reviewSummary.overall_recommendation === 'reject') {
      return {
        title: 'Return to Project Manager',
        message: 'This contract will be returned to the Project Manager with rejection feedback.',
        icon: XCircle,
        color: '#dc2626',
        bgColor: '#fee2e2'
      };
    } else if (reviewSummary.overall_recommendation === 'modify') {
      return {
        title: 'Request Modifications',
        message: 'This contract will be returned to the Project Manager with modification requests.',
        icon: Edit,
        color: '#d97706',
        bgColor: '#fef3c7'
      };
    }
    return null;
  };

  const forwardingNotice = getForwardingNotice();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <Loader2 size={48} className="spinning" />
          <h3>Loading Contract for Review</h3>
          <p>Preparing review interface...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle size={48} />
          <h2>Error Loading Contract</h2>
          <p>{error}</p>
          {/* <button className="btn-primary" onClick={() => navigate('/my-reviews')}>
            Back to Reviews
          </button> */}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle size={48} />
          <h2>Contract Not Found</h2>
          <p>The contract you're trying to review could not be found.</p>
          {/* <button className="btn-primary" onClick={() => navigate('/my-reviews')}>
            Back to Reviews
          </button> */}
        </div>
      </div>
    );
  }

  // Extract comprehensive data
  const compData = contract.comprehensive_data || {};
  const contractDetails = compData.contract_details || {};
  const parties = compData.parties || {};
  const financial = compData.financial_details || {};

  // Calculate statistics for comments
  const commentStats = {
    total: comments.length,
    open: comments.filter(c => c.status === 'open').length,
    risks: comments.filter(c => c.flagged_risk).length,
    issues: comments.filter(c => c.flagged_issue).length
  };

  return (
    <div className="program-manager-review">
      {/* Header */}
      <div className="review-header">
        <div className="header-left">
          {/* <button className="btn-back" onClick={() => navigate('/review')}>
            <ArrowLeft size={20} />
            Back to Reviews
          </button> */}
          <div className="header-content">
            {/* <h1>Review Contract</h1> */}
            <div className="contract-info-header">
              <h2>{contract.grant_name || contract.filename}</h2>
              <div className="contract-meta-header">
                <span className="meta-item">
                  <Building size={14} />
                  {contract.grantor || 'Unknown Grantor'}
                </span>
                <span className="meta-item">
                  <DollarSign size={14} />
                  {formatCurrency(contract.total_amount)}
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                </span>
                <span className={`status-badge ${contract.status}`}>
                  {contract.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate(`/contracts/${contractId}`)}
          >
            <Eye size={16} />
            View Full Details
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Review Stats */}
      <div className="review-stats">
        <div className="stat-item">
          {/* <div className="stat-icon">
            <MessageSquare size={18} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{commentStats.total}</span>
            <span className="stat-label">Total Comments</span>
          </div>
        </div>
        <div className="stat-item">
          {/* <div className="stat-icon">
            <AlertCircle size={18} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{commentStats.risks}</span>
            <span className="stat-label">Risks Flagged</span>
          </div>
        </div>
        <div className="stat-item">
          {/* <div className="stat-icon">
            <Flag size={18} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{commentStats.issues}</span>
            <span className="stat-label">Issues Flagged</span>
          </div>
        </div>
        <div className="stat-item">
          {/* <div className="stat-icon">
            <Clock size={18} />
          </div> */}
          <div className="stat-content">
            <span className="stat-value">{commentStats.open}</span>
            <span className="stat-label">Open Items</span>
          </div>
        </div>
      </div>

      {/* Review Tabs */}
      <div className="review-tabs">
        <button 
          className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <MessageSquare size={18} />
          Review Comments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FileCheck size={18} />
          Review Summary
        </button>

      </div>

      {/* Review Content */}
      <div className="review-content">
        {activeTab === 'review' && (
          <div className="review-comments-section">
            <div className="section-header">
              <h3>Review Comments</h3>
              <p>Add comments, flag risks/issues, and request changes</p>
            </div>

            {/* Add Comment Form */}
            <div className="add-comment-form">
              <div className="form-header">
                <h4>Add Review Comment</h4>
                <div className="comment-type-selector">
                  <select
                    value={newComment.comment_type}
                    onChange={(e) => setNewComment({...newComment, comment_type: e.target.value})}
                  >
                    <option value="review">General Review</option>
                    <option value="financial">Financial Review</option>
                    <option value="compliance">Compliance Check</option>
                    <option value="risk">Risk Assessment</option>
                    <option value="legal">Legal Review</option>
                  </select>
                </div>
              </div>
              
              <textarea
                value={newComment.comment}
                onChange={(e) => setNewComment({...newComment, comment: e.target.value})}
                placeholder="Enter your review comment here... Be specific about any issues, risks, or required changes."
                rows={4}
                className="comment-textarea"
              />
              
              <div className="comment-options">
                <div className="option-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newComment.flagged_risk}
                      onChange={(e) => setNewComment({...newComment, flagged_risk: e.target.checked})}
                    />
                    <Flag size={14} />
                    <span>Flag as Risk</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newComment.flagged_issue}
                      onChange={(e) => setNewComment({...newComment, flagged_issue: e.target.checked})}
                    />
                    <AlertCircle size={14} />
                    <span>Flag as Issue</span>
                  </label>
                </div>
                
                <div className="recommendation-selector">
                  <label>Recommendation:</label>
                  <select
                    value={newComment.recommendation}
                    onChange={(e) => setNewComment({...newComment, recommendation: e.target.value})}
                  >
                    <option value="">Select recommendation</option>
                    <option value="approve">Approve</option>
                    <option value="modify">Request Modifications</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setNewComment({
                    comment: '',
                    comment_type: 'review',
                    flagged_risk: false,
                    flagged_issue: false,
                    change_request: null,
                    recommendation: ''
                  })}
                >
                  Clear
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAddComment}
                  disabled={!newComment.comment.trim()}
                >
                  <Send size={16} />
                  Add Comment
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="comments-list">
              <div className="list-header">
                <h4>Review Comments ({comments.length})</h4>
                <div className="sort-options">
                  <span>Sort by: Newest</span>
                  <ChevronDown size={14} />
                </div>
              </div>
              {comments.length === 0 ? (
                <div className="empty-comments">
                  <MessageSquare size={32} />
                  <h5>No comments yet</h5>
                  <p>Be the first to add a review comment</p>
                </div>
              ) : (
                <div className="comments-container">
                  {comments.map((comment) => {
                    // Check if this is a Project Manager comment
                    const isProjectManager = comment.user_role === "project_manager";
                    const isPmNote = comment.comment_type && (
                      comment.comment_type.includes('project_manager') || 
                      comment.comment_type === 'project_manager_note' || 
                      comment.comment_type === 'project_manager_submission'
                    );
                    
                    // Choose icon based on comment type
                    const Icon = isPmNote ? User :
                                comment.comment_type === 'risk' ? AlertCircle :
                                comment.comment_type === 'financial' ? DollarSign :
                                comment.comment_type === 'compliance' ? Shield :
                                comment.comment_type === 'legal' ? FileText :
                                MessageSquare;
                    
                    // Use unique key instead of just comment.id
                    const uniqueKey = comment.uniqueId || generateCommentKey(comment);
                    
                    return (
                      <div key={uniqueKey} className={`comment-card ${comment.status} ${isProjectManager ? 'project-manager-comment' : ''}`}>
                        <div className="comment-header">
                          <div className="commenter-info">
                            <div className="commenter-avatar">
                              <User size={14} />
                            </div>
                            <div className="commenter-details">
                              <span className="commenter-name">{comment.user_name || 'Unknown User'}</span>
                              <span className={`commenter-role ${comment.user_role}`}>
                                {comment.user_role === "project_manager" ? "Project Manager" : 
                                 comment.user_role === "program_manager" ? "Program Manager" : 
                                 comment.user_role === "director" ? "Director" : 
                                 comment.user_role || "Unknown Role"}
                              </span>
                              <span className="comment-date">
                                {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                              </span>
                            </div>
                          </div>
                          <div className="comment-badges">
                            <div className={`comment-type-badge ${comment.comment_type}`}>
                              <Icon size={12} />
                              <span>
                                {comment.comment_type === 'project_manager_note' ? 'PM Note' :
                                 comment.comment_type === 'project_manager_submission' ? 'PM Submission' :
                                 comment.comment_type === 'review' ? 'Review' :
                                 comment.comment_type === 'compliance' ? 'Compliance' :
                                 comment.comment_type || 'General'}
                              </span>
                            </div>
                            
                            {comment.flagged_risk && (
                              <span className="badge risk">
                                <Flag size={10} />
                                <span>Risk</span>
                              </span>
                            )}
                            
                            {comment.flagged_issue && (
                              <span className="badge issue">
                                <AlertCircle size={10} />
                                <span>Issue</span>
                              </span>
                            )}
                            
                            {comment.recommendation && (
                              <span className={`badge recommendation ${comment.recommendation}`}>
                                {comment.recommendation === 'approve' && <ThumbsUp size={10} />}
                                {comment.recommendation === 'reject' && <ThumbsDown size={10} />}
                                {comment.recommendation === 'modify' && <Edit size={10} />}
                                <span>
                                  {comment.recommendation === 'approve' ? 'Approve' : 
                                   comment.recommendation === 'reject' ? 'Reject' : 'Modify'}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="comment-body">
                          <p>{comment.comment}</p>
                          
                          {/* Show special label for PM comments */}
                          {isProjectManager && (
                            <div className="pm-comment-label">
                              <Info size={12} />
                              <span>Comment from the Project Manager who created this contract</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="comment-footer">
                          <div className="comment-status">
                            <span className={`status-dot ${comment.status}`} />
                            <span className="status-text">{comment.status}</span>
                          </div>
                          
                          {comment.resolution_response && (
                            <div className="comment-resolution">
                              <strong>Resolution:</strong> {comment.resolution_response}
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
        )}

        {activeTab === 'summary' && (
          <div className="review-summary-section">
            <div className="section-header">
              <h3>Review Summary</h3>
              <p>Provide your overall assessment and recommendation</p>
            </div>

            {/* Forwarding Notice */}
            {forwardingNotice && (
              <div 
                className="forwarding-notice"
                style={{ 
                  backgroundColor: forwardingNotice.bgColor,
                  borderLeftColor: forwardingNotice.color
                }}
              >
                <div className="notice-icon">
                  <forwardingNotice.icon size={20} color={forwardingNotice.color} />
                </div>
                <div className="notice-content">
                  <h5>{forwardingNotice.title}</h5>
                  <p>{forwardingNotice.message}</p>
                </div>
              </div>
            )}

            <div className="summary-form">
              <div className="form-group">
                <label>Review Summary *</label>
                <div className="input-help">
                  <BookOpen size={14} />
                  <span>Provide a comprehensive summary of your review</span>
                </div>
                <textarea
                  value={reviewSummary.review_summary}
                  onChange={(e) => setReviewSummary({...reviewSummary, review_summary: e.target.value})}
                  placeholder="Summarize your key findings, observations, and overall assessment..."
                  rows={6}
                  className="summary-textarea"
                />
              </div>

              <div className="form-group">
                <label>Overall Recommendation *</label>
                <div className="input-help">
                  <FileCheck size={14} />
                  <span>Select the final recommendation for this contract</span>
                </div>
                <div className="recommendation-options">
                  <button
                    className={`recommendation-btn ${reviewSummary.overall_recommendation === 'approve' ? 'selected' : ''}`}
                    onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'approve'})}
                  >
                    <div className="recommendation-icon">
                      <ThumbsUp size={20} />
                    </div>
                    <div className="recommendation-content">
                      <span className="recommendation-title">Approve</span>
                      <span className="recommendation-description">
                        Contract is ready for final approval
                        <br />
                        <small>Will be forwarded to Director</small>
                      </span>
                    </div>
                  </button>
                  <button
                    className={`recommendation-btn ${reviewSummary.overall_recommendation === 'modify' ? 'selected' : ''}`}
                    // onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'modify')}
                  onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'modify'})}
                  >
                    <div className="recommendation-icon">
                      <Edit size={20} />
                    </div>
                    <div className="recommendation-content">
                      <span className="recommendation-title">Request Modifications</span>
                      <span className="recommendation-description">
                        Needs changes before approval
                        <br />
                        <small>Will be returned to Project Manager</small>
                      </span>
                    </div>
                  </button>
                  <button
                    className={`recommendation-btn ${reviewSummary.overall_recommendation === 'reject' ? 'selected' : ''}`}
                    onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'reject'})}
                  >
                    <div className="recommendation-icon">
                      <ThumbsDown size={20} />
                    </div>
                    <div className="recommendation-content">
                      <span className="recommendation-title">Reject</span>
                      <span className="recommendation-description">
                        Contract cannot be approved
                        <br />
                        <small>Will be returned to Project Manager</small>
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Key Issues</label>
                <div className="input-help">
                  <AlertTriangle size={14} />
                  <span>List the main issues identified during review</span>
                </div>
                <div className="issues-list">
                  {reviewSummary.key_issues.map((issue, index) => (
                    <div key={`issue_${index}_${Date.now()}`} className="issue-item">
                      <input
                        type="text"
                        value={issue}
                        onChange={(e) => {
                          const newIssues = [...reviewSummary.key_issues];
                          newIssues[index] = e.target.value;
                          setReviewSummary({...reviewSummary, key_issues: newIssues});
                        }}
                        placeholder="Describe key issue..."
                        className="issue-input"
                      />
                      <button
                        className="btn-remove"
                        onClick={() => {
                          const newIssues = reviewSummary.key_issues.filter((_, i) => i !== index);
                          setReviewSummary({...reviewSummary, key_issues: newIssues});
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn-add-issue"
                    onClick={() => setReviewSummary({
                      ...reviewSummary,
                      key_issues: [...reviewSummary.key_issues, '']
                    })}
                  >
                    + Add Key Issue
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Risk Assessment</label>
                <div className="input-help">
                  <ShieldAlert size={14} />
                  <span>Document any risks identified</span>
                </div>
                <div className="risk-assessment">
                  <textarea
                    value={JSON.stringify(reviewSummary.risk_assessment, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setReviewSummary({...reviewSummary, risk_assessment: parsed});
                      } catch {
                        // Keep as is if invalid JSON
                      }
                    }}
                    placeholder='{
  "financial_risk": "Low",
  "compliance_risk": "Medium",
  "operational_risk": "Low"
}'
                    rows={4}
                    className="risk-textarea"
                  />
                </div>
              </div>

<div className="review-summary-actions">
  <button
    className="review-clear-form-btn"
    onClick={() => setReviewSummary({
      review_summary: '',
      overall_recommendation: '',
      key_issues: [],
      risk_assessment: {},
      change_requests: []
    })}
  >
    Clear Form
  </button>
  <button
    className="review-submit-btn"
    onClick={() => setShowSubmitModal(true)}
    disabled={!reviewSummary.review_summary.trim() || !reviewSummary.overall_recommendation}
  >
    <FileCheck size={16} />
    Submit Review
  </button>
</div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="contract-details-section">
            <div className="section-header">
              <h3>Contract Details for Review</h3>
              <p>Review the extracted contract information</p>
            </div>

            <div className="contract-review-details">
              <div className="review-section">
                <h4>
                  <FileText size={18} />
                  Basic Information
                </h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Contract Name:</strong>
                    <span>{contract.grant_name || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Contract Number:</strong>
                    <span>{contract.contract_number || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Contract Status:</strong>
                    <span className={`status-indicator ${contract.status}`}>
                      {contract.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Created By:</strong>
                    <span>{contract.created_by || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>
                  <DollarSign size={18} />
                  Financial Details
                </h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Total Amount:</strong>
                    <span className="amount-value">{formatCurrency(contract.total_amount)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Start Date:</strong>
                    <span>{formatDate(contract.start_date)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>End Date:</strong>
                    <span>{formatDate(contract.end_date)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Purpose:</strong>
                    <span className="purpose-text">{contract.purpose || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>
                  <Building size={18} />
                  Parties Information
                </h4>
                <div className="parties-grid">
                  <div className="party-card">
                    <div className="party-header">
                      <Shield size={16} />
                      <h5>Grantor</h5>
                    </div>
                    <div className="party-details">
                      <p><strong>Organization:</strong> {parties.grantor?.organization_name || 'Not specified'}</p>
                      <p><strong>Contact:</strong> {parties.grantor?.contact_person || 'Not specified'}</p>
                      <p><strong>Email:</strong> {parties.grantor?.email || 'Not specified'}</p>
                      <p><strong>Address:</strong> {parties.grantor?.address || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="party-card">
                    <div className="party-header">
                      <User size={16} />
                      <h5>Grantee</h5>
                    </div>
                    <div className="party-details">
                      <p><strong>Organization:</strong> {parties.grantee?.organization_name || 'Not specified'}</p>
                      <p><strong>Contact:</strong> {parties.grantee?.contact_person || 'Not specified'}</p>
                      <p><strong>Email:</strong> {parties.grantee?.email || 'Not specified'}</p>
                      <p><strong>Address:</strong> {parties.grantee?.address || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Data Preview */}
              {compData && Object.keys(compData).length > 0 && (
                <div className="review-section">
                  <h4>
                    <BarChart3 size={18} />
                    Comprehensive Data Preview
                  </h4>
                  <div className="comprehensive-preview">
                    <div className="preview-grid">
                      {compData.contract_details && (
                        <div className="preview-item">
                          <strong>Contract Details:</strong>
                          <span>{Object.keys(compData.contract_details).length} fields extracted</span>
                        </div>
                      )}
                      {compData.financial_details && (
                        <div className="preview-item">
                          <strong>Financial Details:</strong>
                          <span>{Object.keys(compData.financial_details).length} fields extracted</span>
                        </div>
                      )}
                      {compData.terms_conditions && (
                        <div className="preview-item">
                          <strong>Terms & Conditions:</strong>
                          <span>{Object.keys(compData.terms_conditions).length} items extracted</span>
                        </div>
                      )}
                      {compData.deliverables && (
                        <div className="preview-item">
                          <strong>Deliverables:</strong>
                          <span>{compData.deliverables?.items?.length || 0} items</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Review Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Submit Review</h3>
              <button className="modal-close" onClick={() => setShowSubmitModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="confirmation-message">
                <FileCheck size={32} />
                <h4>Ready to submit your review?</h4>
                <p>Your review will be submitted with the following recommendation:</p>
              </div>
              
              <div className="submission-summary">
                <div className="summary-item">
                  <strong>Recommendation:</strong>
                  <span className={`recommendation-badge ${reviewSummary.overall_recommendation}`}>
                    {reviewSummary.overall_recommendation === 'approve' ? 'Approve' :
                     reviewSummary.overall_recommendation === 'modify' ? 'Request Modifications' :
                     'Reject'}
                  </span>
                </div>
                <div className="summary-item">
                  <strong>Comments Added:</strong>
                  <span>{comments.length}</span>
                </div>
                <div className="summary-item">
                  <strong>Key Issues:</strong>
                  <span>{reviewSummary.key_issues.length}</span>
                </div>
                <div className="summary-item">
                  <strong>Review Summary:</strong>
                  <span className="summary-text">
                    {reviewSummary.review_summary.substring(0, 100)}...
                  </span>
                </div>
              </div>
              
              <div className="forwarding-notice-modal">
                {forwardingNotice && (
                  <>
                    <div className="notice-header">
                      <forwardingNotice.icon size={18} />
                      <h5>Next Steps</h5>
                    </div>
                    <p>{forwardingNotice.message}</p>
                    {reviewSummary.overall_recommendation === 'approve' && (
                      <div className="director-notice">
                        <Shield size={14} />
                        <span>The Director will be notified and can provide final approval.</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="warning-message">
                <AlertCircle size={16} />
                <p>Once submitted, the contract status will be updated and the Project Manager will be notified.</p>
              </div>
            </div>
            
<div className="modal-actions">
  <button
    className="btn-secondary"
    onClick={() => setShowSubmitModal(false)}
    disabled={submitting}
  >
    Cancel
  </button>
  <button
    className="modal-submit-btn"
    onClick={handleSubmitReview}
    disabled={submitting}
  >
    {submitting ? (
      <>
        <Loader2 size={16} className="spinning" />
        Submitting...
      </>
    ) : (
      'Submit Review'
    )}
  </button>
</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramManagerReview;