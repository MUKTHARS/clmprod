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
  const [contractData, setContractData] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    title: '',
    message: ''
  });
  
  const [commentFormData, setCommentFormData] = useState({
    comment: '',
    comment_type: 'review',
    flagged_risk: false,
    flagged_issue: false,
    change_request: null,
    recommendation: ''
  });
  
  const [reviewFinalData, setReviewFinalData] = useState({
    review_summary: '',
    overall_recommendation: '',
    key_issues: [],
    risk_assessment: {},
    change_requests: []
  });
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [pageError, setPageError] = useState('');

  const generateCommentUniqueKey = (commentItem) => {
    if (commentItem.id && commentItem.created_at) {
      return `${commentItem.id}_${commentItem.created_at}`;
    }
    if (commentItem.id) {
      return `comment_${commentItem.id}`;
    }
    if (commentItem.created_at) {
      return `comment_${commentItem.created_at}`;
    }
    return `comment_${Math.random().toString(36).substr(2, 9)}`;
  };

  const showNotificationMessage = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (contractId) {
      fetchContractDetails();
      fetchCommentHistory();
    }
  }, [contractId]);

  const fetchContractDetails = async () => {
    try {
      setIsPageLoading(true);
      setPageError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContractData(data);
      } else {
        const errorData = await response.json();
        setPageError(errorData.detail || 'Failed to fetch contract');
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setIsPageLoading(false);
    }
  };

  const fetchCommentHistory = async () => {
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
        const commentIds = data.comments?.map(c => c.id) || [];
        const duplicateIds = commentIds.filter((id, index) => commentIds.indexOf(id) !== index);
        
        if (duplicateIds.length > 0) {
          console.warn('Found duplicate comment IDs:', duplicateIds);
          const uniqueComments = (data.comments || []).map((comment, index) => ({
            ...comment,
            uniqueId: generateCommentUniqueKey(comment)
          }));
          setReviewComments(uniqueComments);
        } else {
          setReviewComments(data.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddNewComment = async () => {
    if (!commentFormData.comment.trim()) {
      showNotificationMessage('error', 'Validation Error', 'Please enter a comment');
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
          ...commentFormData,
          contract_id: parseInt(contractId)
        })
      });

      if (response.ok) {
        showNotificationMessage('success', 'Success', 'Comment added successfully');
        setCommentFormData({
          comment: '',
          comment_type: 'review',
          flagged_risk: false,
          flagged_issue: false,
          change_request: null,
          recommendation: ''
        });
        fetchCommentHistory();
      } else {
        const error = await response.json();
        showNotificationMessage('error', 'Failed', `Failed to add comment: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      showNotificationMessage('error', 'Failed', 'Failed to add comment');
    }
  };

  const handleSubmitFinalReview = async () => {
    if (!reviewFinalData.review_summary.trim()) {
      showNotificationMessage('error', 'Validation Error', 'Please provide a review summary');
      return;
    }

    if (!reviewFinalData.overall_recommendation) {
      showNotificationMessage('error', 'Validation Error', 'Please select an overall recommendation');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager/submit-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...reviewFinalData,
          contract_id: parseInt(contractId),
          comments: reviewComments.filter(c => !c.id)
        })
      });

      if (response.ok) {
        const result = await response.json();
        showNotificationMessage('success', 'Review Submitted', result.message);
        setShowReviewModal(false);
        setTimeout(() => {
          navigate('/review');
        }, 2000);
      } else {
        const error = await response.json();
        showNotificationMessage('error', 'Submission Failed', `Failed to submit review: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      showNotificationMessage('error', 'Submission Failed', 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatCurrencyValue = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateString = (dateString) => {
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

  const getForwardingActionInfo = () => {
    if (reviewFinalData.overall_recommendation === 'approve') {
      return {
        title: 'Ready for Director Approval',
        message: 'This contract will be forwarded to the Director for final approval after submission.',
        icon: Shield,
        color: '#16a34a',
        bgColor: '#dcfce7'
      };
    } else if (reviewFinalData.overall_recommendation === 'reject') {
      return {
        title: 'Return to Project Manager',
        message: 'This contract will be returned to the Project Manager with rejection feedback.',
        icon: XCircle,
        color: '#dc2626',
        bgColor: '#fee2e2'
      };
    } else if (reviewFinalData.overall_recommendation === 'modify') {
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

  const forwardingActionInfo = getForwardingActionInfo();

  if (isPageLoading) {
    return (
      <div className="review-loading-container">
        <div className="review-loading-content">
          <Loader2 size={48} className="loading-spinner" />
          <h3>Loading Contract for Review</h3>
          <p>Preparing review interface...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="review-error-container">
        <div className="review-error-content">
          <AlertCircle size={48} />
          <h2>Error Loading Contract</h2>
          <p>{pageError}</p>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="review-error-container">
        <div className="review-error-content">
          <AlertCircle size={48} />
          <h2>Contract Not Found</h2>
          <p>The contract you're trying to review could not be found.</p>
        </div>
      </div>
    );
  }

  const comprehensiveData = contractData.comprehensive_data || {};
  const contractDetails = comprehensiveData.contract_details || {};
  const parties = comprehensiveData.parties || {};
  const financial = comprehensiveData.financial_details || {};

  const commentStatistics = {
    total: reviewComments.length,
    open: reviewComments.filter(c => c.status === 'open').length,
    risks: reviewComments.filter(c => c.flagged_risk).length,
    issues: reviewComments.filter(c => c.flagged_issue).length
  };

  const projectManagerCommentList = reviewComments.filter(comment => 
    comment.user_role === "project_manager" || 
    comment.comment_type?.includes('project_manager')
  );
  
  const programManagerCommentList = reviewComments.filter(comment => 
    comment.user_role === "program_manager"
  );

  return (
    <div className="pm-review-container">
      {/* Notification System */}
      {notification.show && (
        <div className={`notification-popup notification-${notification.type}`}>
          <div className="notification-icon">
            {notification.type === 'success' && <CheckCircle size={20} />}
            {notification.type === 'error' && <AlertCircle size={20} />}
            {notification.type === 'warning' && <AlertTriangle size={20} />}
            {notification.type === 'info' && <Info size={20} />}
          </div>
          <div className="notification-content">
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
          </div>
          <button className="notification-close" onClick={closeNotification}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="review-header-section">
        <div className="header-left-section">
          <div className="header-info-wrapper">
            <div className="contract-title-section">
              <h2>{contractData.grant_name || contractData.filename}</h2>
              <div className="contract-metadata">
                <span className="metadata-item">
                  <Building size={14} />
                  {contractData.grantor || 'Unknown Grantor'}
                </span>
                <span className="metadata-item">
                  <DollarSign size={14} />
                  {formatCurrencyValue(contractData.total_amount)}
                </span>
                <span className="metadata-item">
                  <Calendar size={14} />
                  {formatDateString(contractData.start_date)} - {formatDateString(contractData.end_date)}
                </span>
                <span className={`status-indicator ${contractData.status}`}>
                  {contractData.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-action-buttons">
          <button 
            className="primary-action-btn"
            onClick={() => navigate(`/contracts/${contractId}`)}
          >
            <Eye size={16} />
            View Full Details
          </button>
          <button className="secondary-action-btn">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="review-statistics">
        <div className="stat-card">
          <div className="stat-card-content">
            <span className="stat-number">{commentStatistics.total}</span>
            <span className="stat-label-text">Total Comments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <span className="stat-number">{commentStatistics.risks}</span>
            <span className="stat-label-text">Risks Flagged</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <span className="stat-number">{commentStatistics.issues}</span>
            <span className="stat-label-text">Issues Flagged</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <span className="stat-number">{commentStatistics.open}</span>
            <span className="stat-label-text">Open Items</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="review-main-panel">
        <div className="panel-header">
          <h3>Grant Review</h3>
        </div>

        {/* Project Manager Comments Section */}
        {projectManagerCommentList.length > 0 && (
          <div className="comment-section-card">
            <div className="comment-section-header">
              <h4>
                <User size={18} />
                Project Manager Comments
                <span className="comment-counter">({projectManagerCommentList.length})</span>
              </h4>
              <p>Comments from the Project Manager who created this contract</p>
            </div>
            
            <div className="comment-feed">
              {projectManagerCommentList.map((comment) => {
                const IconComponent = comment.comment_type === 'project_manager_note' ? User :
                            comment.comment_type === 'project_manager_submission' ? FileCheck :
                            MessageSquare;
                
                const uniqueItemKey = comment.uniqueId || generateCommentUniqueKey(comment);
                
                return (
                  <div key={uniqueItemKey} className="comment-thread project-manager-thread">
                    <div className="thread-header">
                      <div className="author-info">
                        <div className="author-avatar">
                          <User size={14} />
                        </div>
                        <div className="author-details">
                          <span className="author-name">{comment.user_name || 'Project Manager'}</span>
                          <span className="author-role project-manager-role">
                            Project Manager
                          </span>
                          <span className="comment-timestamp">
                            {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                      <div className="comment-tags">
                        <div className={`comment-tag ${comment.comment_type}`}>
                          <IconComponent size={12} />
                          <span>
                            {comment.comment_type === 'project_manager_note' ? 'PM Note' :
                             comment.comment_type === 'project_manager_submission' ? 'PM Submission' :
                             'General'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="thread-body">
                      <p>{comment.comment}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Comment Form - Commented Out */}
        {/* ... */}

        {/* Program Manager Comments Section */}
        {programManagerCommentList.length > 0 && (
          <div className="comment-section-card">
            <div className="comment-section-header">
              <h4>
                <MessageSquare size={18} />
                Your Review Comments
                <span className="comment-counter">({programManagerCommentList.length})</span>
              </h4>
              <p>Comments you've added during this review</p>
            </div>
            
            <div className="comment-feed">
              {programManagerCommentList.map((comment) => {
                const IconComponent = comment.comment_type === 'risk' ? AlertCircle :
                            comment.comment_type === 'financial' ? DollarSign :
                            comment.comment_type === 'compliance' ? Shield :
                            comment.comment_type === 'legal' ? FileText :
                            MessageSquare;
                
                const uniqueItemKey = comment.uniqueId || generateCommentUniqueKey(comment);
                
                return (
                  <div key={uniqueItemKey} className={`comment-thread ${comment.status}`}>
                    <div className="thread-header">
                      <div className="author-info">
                        <div className="author-avatar">
                          <User size={14} />
                        </div>
                        <div className="author-details">
                          <span className="author-name">{comment.user_name || 'You'}</span>
                          <span className="author-role program-manager-role">
                            Program Manager
                          </span>
                          <span className="comment-timestamp">
                            {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                      <div className="comment-tags">
                        <div className={`comment-tag ${comment.comment_type}`}>
                          <IconComponent size={12} />
                          <span>
                            {comment.comment_type === 'review' ? 'Review' :
                             comment.comment_type === 'compliance' ? 'Compliance' :
                             comment.comment_type || 'General'}
                          </span>
                        </div>
                        
                        {comment.flagged_risk && (
                          <span className="tag risk-tag">
                            <Flag size={10} />
                            <span>Risk</span>
                          </span>
                        )}
                        
                        {comment.flagged_issue && (
                          <span className="tag issue-tag">
                            <AlertCircle size={10} />
                            <span>Issue</span>
                          </span>
                        )}
                        
                        {comment.recommendation && (
                          <span className={`tag recommendation-tag ${comment.recommendation}`}>
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
                    
                    <div className="thread-body">
                      <p>{comment.comment}</p>
                    </div>
                    
                    <div className="thread-footer">
                      <div className="thread-status">
                        <span className={`status-dot-indicator ${comment.status}`} />
                        <span className="status-text-label">{comment.status}</span>
                      </div>
                      
                      {comment.resolution_response && (
                        <div className="thread-resolution">
                          <strong>Resolution:</strong> {comment.resolution_response}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Final Review Summary Section */}
        <div className="review-section-card">
          <div className="review-section-header">
            <h4>
              Final Review Summary
            </h4>
            <p>Provide your overall assessment and final recommendation</p>
          </div>

          <div className="review-form-container">
            <div className="form-field-group">
              <label>Review Summary *</label>
              <div className="field-hint">
                <BookOpen size={14} />
                <span>Provide a comprehensive summary of your review findings</span>
              </div>
              <textarea
                value={reviewFinalData.review_summary}
                onChange={(e) => setReviewFinalData({...reviewFinalData, review_summary: e.target.value})}
                placeholder="Summarize your key findings, observations, and overall assessment of this contract..."
                rows={6}
                className="review-textarea"
              />
            </div>

            <div className="form-field-group">
              <label>Overall Recommendation *</label>
              <div className="field-hint">
                <FileCheck size={14} />
                <span>Select the final recommendation for this contract</span>
              </div>
              <div className="recommendation-grid">
                <button
                  className={`recommendation-option ${reviewFinalData.overall_recommendation === 'approve' ? 'selected-option' : ''}`}
                  onClick={() => setReviewFinalData({...reviewFinalData, overall_recommendation: 'approve'})}
                >
                  <div className="option-icon">
                    <ThumbsUp size={20} />
                  </div>
                  <div className="option-content">
                    <span className="option-title">Approve</span>
                    <span className="option-description">
                      Contract is ready for final approval
                      <br />
                      <small>Will be forwarded to Director</small>
                    </span>
                  </div>
                </button>
                <button
                  className={`recommendation-option ${reviewFinalData.overall_recommendation === 'modify' ? 'selected-option' : ''}`}
                  onClick={() => setReviewFinalData({...reviewFinalData, overall_recommendation: 'modify'})}
                >
                  <div className="option-icon">
                    <Edit size={20} />
                  </div>
                  <div className="option-content">
                    <span className="option-title">Request Modifications</span>
                    <span className="option-description">
                      Needs changes before approval
                      <br />
                      <small>Will be returned to Project Manager</small>
                    </span>
                  </div>
                </button>
                <button
                  className={`recommendation-option ${reviewFinalData.overall_recommendation === 'reject' ? 'selected-option' : ''}`}
                  onClick={() => setReviewFinalData({...reviewFinalData, overall_recommendation: 'reject'})}
                >
                  <div className="option-icon">
                    <ThumbsDown size={20} />
                  </div>
                  <div className="option-content">
                    <span className="option-title">Reject</span>
                    <span className="option-description">
                      Contract cannot be approved
                      <br />
                      <small>Will be returned to Project Manager</small>
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="review-form-actions">
              <button
                className="clear-form-button"
                onClick={() => setReviewFinalData({
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
                className="submit-review-button"
                onClick={() => setShowReviewModal(true)}
                disabled={!reviewFinalData.review_summary.trim() || !reviewFinalData.overall_recommendation}
              >
                <FileCheck size={16} />
                Submit Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal-container">
            <div className="review-modal-header">
              <h3>Submit Review</h3>
              <button className="review-modal-close" onClick={() => setShowReviewModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="review-modal-body">
              <div className="confirmation-panel">
                <FileCheck size={32} />
                <h4>Ready to submit your review?</h4>
                <p>Your review will be submitted with the following recommendation:</p>
              </div>
              
              <div className="submission-details">
                <div className="detail-item">
                  <strong>Recommendation:</strong>
                  <span className={`recommendation-label ${reviewFinalData.overall_recommendation}`}>
                    {reviewFinalData.overall_recommendation === 'approve' ? 'Approve' :
                     reviewFinalData.overall_recommendation === 'modify' ? 'Request Modifications' :
                     'Reject'}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Review Summary:</strong>
                  <span className="summary-preview">
                    {reviewFinalData.review_summary.substring(0, 100)}...
                  </span>
                </div>
              </div>
           
            </div>
            
            <div className="review-modal-footer">
              <button
                className="secondary-modal-btn"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmittingReview}
              >
                Cancel
              </button>
              <button
                className="primary-modal-btn"
                onClick={handleSubmitFinalReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 size={16} className="loading-spinner" />
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



// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import {
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   MessageSquare,
//   Flag,
//   Edit,
//   Calendar,
//   User,
//   FileText,
//   Eye,
//   Download,
//   Send,
//   History,
//   Shield,
//   Check,
//   X,
//   Filter,
//   Search,
//   ChevronDown,
//   Clock,
//   TrendingUp,
//   DollarSign,
//   Building,
//   Target,
//   BarChart3,
//   FileCheck,
//   Loader2,
//   RefreshCw,
//   ArrowLeft,
//   BookOpen,
//   ClipboardCheck,
//   ListChecks,
//   AlertTriangle,
//   Award,
//   ShieldAlert,
//   ThumbsUp,
//   ThumbsDown,
//   FileWarning,
//   Info
// } from 'lucide-react';
// import API_CONFIG from '../../config';
// import './ProgramManagerReview.css';

// function ProgramManagerReview() {
//   const { contractId } = useParams();
//   const navigate = useNavigate();
//   const [contract, setContract] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState({
//     comment: '',
//     comment_type: 'review',
//     flagged_risk: false,
//     flagged_issue: false,
//     change_request: null,
//     recommendation: ''
//   });
//   const [reviewSummary, setReviewSummary] = useState({
//     review_summary: '',
//     overall_recommendation: '',
//     key_issues: [],
//     risk_assessment: {},
//     change_requests: []
//   });
//   const [showSubmitModal, setShowSubmitModal] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   // Generate unique key for each comment to avoid duplicate keys
//   const generateCommentKey = (comment) => {
//     // Use id + timestamp to ensure uniqueness
//     if (comment.id && comment.created_at) {
//       return `${comment.id}_${comment.created_at}`;
//     }
//     // Fallback for comments without id
//     if (comment.id) {
//       return `comment_${comment.id}`;
//     }
//     // Fallback for comments with timestamp only
//     if (comment.created_at) {
//       return `comment_${comment.created_at}`;
//     }
//     // Final fallback - generate random key (should rarely happen)
//     return `comment_${Math.random().toString(36).substr(2, 9)}`;
//   };

//   useEffect(() => {
//     if (contractId) {
//       fetchContractData();
//       fetchReviewComments();
//     }
//   }, [contractId]);

//   const fetchContractData = async () => {
//     try {
//       setLoading(true);
//       setError('');
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setContract(data);
//       } else {
//         const errorData = await response.json();
//         setError(errorData.detail || 'Failed to fetch contract');
//       }
//     } catch (error) {
//       console.error('Failed to fetch contract:', error);
//       setError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchReviewComments = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/review-comments`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
        
//         // Debug: Check for duplicate IDs
//         const commentIds = data.comments?.map(c => c.id) || [];
//         const duplicateIds = commentIds.filter((id, index) => commentIds.indexOf(id) !== index);
        
//         if (duplicateIds.length > 0) {
//           console.warn('Found duplicate comment IDs:', duplicateIds);
          
//           // Remove duplicates by creating unique IDs
//           const uniqueComments = (data.comments || []).map((comment, index) => ({
//             ...comment,
//             uniqueId: generateCommentKey(comment)
//           }));
          
//           setComments(uniqueComments);
//         } else {
//           setComments(data.comments || []);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch comments:', error);
//     }
//   };

//   const handleAddComment = async () => {
//     if (!newComment.comment.trim()) {
//       alert('Please enter a comment');
//       return;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager/add-comment`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           ...newComment,
//           contract_id: parseInt(contractId)
//         })
//       });

//       if (response.ok) {
//         alert('Comment added successfully');
//         setNewComment({
//           comment: '',
//           comment_type: 'review',
//           flagged_risk: false,
//           flagged_issue: false,
//           change_request: null,
//           recommendation: ''
//         });
//         fetchReviewComments();
//       } else {
//         const error = await response.json();
//         alert(`Failed to add comment: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to add comment:', error);
//       alert('Failed to add comment');
//     }
//   };

//   const handleSubmitReview = async () => {
//     if (!reviewSummary.review_summary.trim()) {
//       alert('Please provide a review summary');
//       return;
//     }

//     if (!reviewSummary.overall_recommendation) {
//       alert('Please select an overall recommendation');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager/submit-review`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           ...reviewSummary,
//           contract_id: parseInt(contractId),
//           comments: comments.filter(c => !c.id) // Only send new comments
//         })
//       });

//       if (response.ok) {
//         const result = await response.json();
//         alert(result.message);
//         setShowSubmitModal(false);
//         navigate('/review'); 
//       } else {
//         const error = await response.json();
//         alert(`Failed to submit review: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to submit review:', error);
//       alert('Failed to submit review');
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
//     } catch (error) {
//       return dateString;
//     }
//   };

//   const getForwardingNotice = () => {
//     if (reviewSummary.overall_recommendation === 'approve') {
//       return {
//         title: 'Ready for Director Approval',
//         message: 'This contract will be forwarded to the Director for final approval after submission.',
//         icon: Shield,
//         color: '#16a34a',
//         bgColor: '#dcfce7'
//       };
//     } else if (reviewSummary.overall_recommendation === 'reject') {
//       return {
//         title: 'Return to Project Manager',
//         message: 'This contract will be returned to the Project Manager with rejection feedback.',
//         icon: XCircle,
//         color: '#dc2626',
//         bgColor: '#fee2e2'
//       };
//     } else if (reviewSummary.overall_recommendation === 'modify') {
//       return {
//         title: 'Request Modifications',
//         message: 'This contract will be returned to the Project Manager with modification requests.',
//         icon: Edit,
//         color: '#d97706',
//         bgColor: '#fef3c7'
//       };
//     }
//     return null;
//   };

//   const forwardingNotice = getForwardingNotice();

//   if (loading) {
//     return (
//       <div className="loading-page">
//         <div className="loading-content">
//           <Loader2 size={48} className="spinning" />
//           <h3>Loading Contract for Review</h3>
//           <p>Preparing review interface...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="error-page">
//         <div className="error-content">
//           <AlertCircle size={48} />
//           <h2>Error Loading Contract</h2>
//           <p>{error}</p>
//         </div>
//       </div>
//     );
//   }

//   if (!contract) {
//     return (
//       <div className="error-page">
//         <div className="error-content">
//           <AlertCircle size={48} />
//           <h2>Contract Not Found</h2>
//           <p>The contract you're trying to review could not be found.</p>
//         </div>
//       </div>
//     );
//   }

//   // Extract comprehensive data
//   const compData = contract.comprehensive_data || {};
//   const contractDetails = compData.contract_details || {};
//   const parties = compData.parties || {};
//   const financial = compData.financial_details || {};

//   // Calculate statistics for comments
//   const commentStats = {
//     total: comments.length,
//     open: comments.filter(c => c.status === 'open').length,
//     risks: comments.filter(c => c.flagged_risk).length,
//     issues: comments.filter(c => c.flagged_issue).length
//   };

//   // Separate Project Manager comments from Program Manager comments
//   const pmComments = comments.filter(comment => 
//     comment.user_role === "project_manager" || 
//     comment.comment_type?.includes('project_manager')
//   );
//   const programManagerComments = comments.filter(comment => 
//     comment.user_role === "program_manager"
//   );

//   return (
//     <div className="program-manager-review">
//       {/* Header */}
//       <div className="review-header">
//         <div className="header-left">
//           <div className="header-content">
//             <div className="contract-info-header">
//               <h2>{contract.grant_name || contract.filename}</h2>
//               <div className="contract-meta-header">
//                 <span className="meta-item">
//                   <Building size={14} />
//                   {contract.grantor || 'Unknown Grantor'}
//                 </span>
//                 <span className="meta-item">
//                   <DollarSign size={14} />
//                   {formatCurrency(contract.total_amount)}
//                 </span>
//                 <span className="meta-item">
//                   <Calendar size={14} />
//                   {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
//                 </span>
//                 <span className={`status-badge ${contract.status}`}>
//                   {contract.status}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="header-actions">
//           <button 
//             className="btn-primary"
//             onClick={() => navigate(`/contracts/${contractId}`)}
//           >
//             <Eye size={16} />
//             View Full Details
//           </button>
//           <button className="btn-secondary">
//             <Download size={16} />
//             Export
//           </button>
//         </div>
//       </div>

//       {/* Review Stats */}
//       <div className="review-stats">
//         <div className="stat-item">
//           <div className="stat-content">
//             <span className="stat-value">{commentStats.total}</span>
//             <span className="stat-label">Total Comments</span>
//           </div>
//         </div>
//         <div className="stat-item">
//           <div className="stat-content">
//             <span className="stat-value">{commentStats.risks}</span>
//             <span className="stat-label">Risks Flagged</span>
//           </div>
//         </div>
//         <div className="stat-item">
//           <div className="stat-content">
//             <span className="stat-value">{commentStats.issues}</span>
//             <span className="stat-label">Issues Flagged</span>
//           </div>
//         </div>
//         <div className="stat-item">
//           <div className="stat-content">
//             <span className="stat-value">{commentStats.open}</span>
//             <span className="stat-label">Open Items</span>
//           </div>
//         </div>
//       </div>

//       {/* Single Review Content */}
//       <div className="review-content">
//         <div className="section-header">
//           <h3>Grant Review</h3>
//           {/* <p>Review contract details, add comments, and provide overall recommendation</p> */}
//         </div>

//         {/* Forwarding Notice */}
//         {/* {forwardingNotice && (
//           <div 
//             className="forwarding-notice"
//             style={{ 
//               backgroundColor: forwardingNotice.bgColor,
//               borderLeftColor: forwardingNotice.color
//             }}
//           >
//             <div className="notice-icon">
//               <forwardingNotice.icon size={20} color={forwardingNotice.color} />
//             </div>
//             <div className="notice-content">
//               <h5>{forwardingNotice.title}</h5>
//               <p>{forwardingNotice.message}</p>
//             </div>
//           </div>
//         )} */}

//         {/* Contract Summary for Review */}
//         {/* <div className="contract-summary-review">
//           <div className="summary-section">
//             <h4>
//               <FileText size={18} />
//               Contract Summary
//             </h4>
//             <div className="summary-grid">
//               <div className="summary-item">
//                 <strong>Contract Name:</strong>
//                 <span>{contract.grant_name || 'Not specified'}</span>
//               </div>
//               <div className="summary-item">
//                 <strong>Total Amount:</strong>
//                 <span className="amount-value">{formatCurrency(contract.total_amount)}</span>
//               </div>
//               <div className="summary-item">
//                 <strong>Grantor:</strong>
//                 <span>{contract.grantor || 'Not specified'}</span>
//               </div>
//               <div className="summary-item">
//                 <strong>Period:</strong>
//                 <span>{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</span>
//               </div>
//             </div>
//           </div>
//         </div> */}

//         {/* Project Manager Comments */}
//         {pmComments.length > 0 && (
//           <div className="review-section-card">
//             <div className="section-card-header">
//               <h4>
//                 <User size={18} />
//                 Project Manager Comments
//                 <span className="comment-count">({pmComments.length})</span>
//               </h4>
//               <p>Comments from the Project Manager who created this contract</p>
//             </div>
            
//             <div className="comments-container">
//               {pmComments.map((comment) => {
//                 const Icon = comment.comment_type === 'project_manager_note' ? User :
//                             comment.comment_type === 'project_manager_submission' ? FileCheck :
//                             MessageSquare;
                
//                 const uniqueKey = comment.uniqueId || generateCommentKey(comment);
                
//                 return (
//                   <div key={uniqueKey} className="comment-card project-manager-comment">
//                     <div className="comment-header">
//                       <div className="commenter-info">
//                         <div className="commenter-avatar">
//                           <User size={14} />
//                         </div>
//                         <div className="commenter-details">
//                           <span className="commenter-name">{comment.user_name || 'Project Manager'}</span>
//                           <span className="commenter-role project_manager">
//                             Project Manager
//                           </span>
//                           <span className="comment-date">
//                             {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="comment-badges">
//                         <div className={`comment-type-badge ${comment.comment_type}`}>
//                           <Icon size={12} />
//                           <span>
//                             {comment.comment_type === 'project_manager_note' ? 'PM Note' :
//                              comment.comment_type === 'project_manager_submission' ? 'PM Submission' :
//                              'General'}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="comment-body">
//                       <p>{comment.comment}</p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* Add Comment Form */}
//         {/* <div className="review-section-card">
//           <div className="section-card-header">
//             <h4>
//               <MessageSquare size={18} />
//               Add Your Review Comment
//             </h4>
//             <p>Add comments, flag risks/issues, and provide recommendations</p>
//           </div>

//           <div className="add-comment-form">
//             <div className="form-header">
//               <select
//                 value={newComment.comment_type}
//                 onChange={(e) => setNewComment({...newComment, comment_type: e.target.value})}
//                 className="comment-type-select"
//               >
//                 <option value="review">General Review</option>
//                 <option value="financial">Financial Review</option>
//                 <option value="compliance">Compliance Check</option>
//                 <option value="risk">Risk Assessment</option>
//                 <option value="legal">Legal Review</option>
//               </select>
//             </div>
            
//             <textarea
//               value={newComment.comment}
//               onChange={(e) => setNewComment({...newComment, comment: e.target.value})}
//               placeholder="Enter your review comment here... Be specific about any issues, risks, or required changes."
//               rows={4}
//               className="comment-textarea"
//             />
            
//             <div className="comment-options">
//               <div className="option-group">
//                 <label className="checkbox-label">
//                   <input
//                     type="checkbox"
//                     checked={newComment.flagged_risk}
//                     onChange={(e) => setNewComment({...newComment, flagged_risk: e.target.checked})}
//                   />
//                   <Flag size={14} />
//                   <span>Flag as Risk</span>
//                 </label>
                
//                 <label className="checkbox-label">
//                   <input
//                     type="checkbox"
//                     checked={newComment.flagged_issue}
//                     onChange={(e) => setNewComment({...newComment, flagged_issue: e.target.checked})}
//                   />
//                   <AlertCircle size={14} />
//                   <span>Flag as Issue</span>
//                 </label>
//               </div>
              
//               <div className="recommendation-selector">
//                 <label>Comment Recommendation:</label>
//                 <select
//                   value={newComment.recommendation}
//                   onChange={(e) => setNewComment({...newComment, recommendation: e.target.value})}
//                 >
//                   <option value="">Select recommendation</option>
//                   <option value="approve">Approve</option>
//                   <option value="modify">Request Modifications</option>
//                   <option value="reject">Reject</option>
//                 </select>
//               </div>
//             </div>
            
//             <div className="form-actions">
//               <button
//                 className="btn-secondary"
//                 onClick={() => setNewComment({
//                   comment: '',
//                   comment_type: 'review',
//                   flagged_risk: false,
//                   flagged_issue: false,
//                   change_request: null,
//                   recommendation: ''
//                 })}
//               >
//                 Clear
//               </button>
//               <button
//                 className="btn-primary"
//                 onClick={handleAddComment}
//                 disabled={!newComment.comment.trim()}
//               >
//                 <Send size={16} />
//                 Add Comment
//               </button>
//             </div>
//           </div>
//         </div> */}

//         {/* Program Manager Comments */}
//         {programManagerComments.length > 0 && (
//           <div className="review-section-card">
//             <div className="section-card-header">
//               <h4>
//                 <MessageSquare size={18} />
//                 Your Review Comments
//                 <span className="comment-count">({programManagerComments.length})</span>
//               </h4>
//               <p>Comments you've added during this review</p>
//             </div>
            
//             <div className="comments-container">
//               {programManagerComments.map((comment) => {
//                 const Icon = comment.comment_type === 'risk' ? AlertCircle :
//                             comment.comment_type === 'financial' ? DollarSign :
//                             comment.comment_type === 'compliance' ? Shield :
//                             comment.comment_type === 'legal' ? FileText :
//                             MessageSquare;
                
//                 const uniqueKey = comment.uniqueId || generateCommentKey(comment);
                
//                 return (
//                   <div key={uniqueKey} className={`comment-card ${comment.status}`}>
//                     <div className="comment-header">
//                       <div className="commenter-info">
//                         <div className="commenter-avatar">
//                           <User size={14} />
//                         </div>
//                         <div className="commenter-details">
//                           <span className="commenter-name">{comment.user_name || 'You'}</span>
//                           <span className="commenter-role program_manager">
//                             Program Manager
//                           </span>
//                           <span className="comment-date">
//                             {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="comment-badges">
//                         <div className={`comment-type-badge ${comment.comment_type}`}>
//                           <Icon size={12} />
//                           <span>
//                             {comment.comment_type === 'review' ? 'Review' :
//                              comment.comment_type === 'compliance' ? 'Compliance' :
//                              comment.comment_type || 'General'}
//                           </span>
//                         </div>
                        
//                         {comment.flagged_risk && (
//                           <span className="badge risk">
//                             <Flag size={10} />
//                             <span>Risk</span>
//                           </span>
//                         )}
                        
//                         {comment.flagged_issue && (
//                           <span className="badge issue">
//                             <AlertCircle size={10} />
//                             <span>Issue</span>
//                           </span>
//                         )}
                        
//                         {comment.recommendation && (
//                           <span className={`badge recommendation ${comment.recommendation}`}>
//                             {comment.recommendation === 'approve' && <ThumbsUp size={10} />}
//                             {comment.recommendation === 'reject' && <ThumbsDown size={10} />}
//                             {comment.recommendation === 'modify' && <Edit size={10} />}
//                             <span>
//                               {comment.recommendation === 'approve' ? 'Approve' : 
//                                comment.recommendation === 'reject' ? 'Reject' : 'Modify'}
//                             </span>
//                           </span>
//                         )}
//                       </div>
//                     </div>
                    
//                     <div className="comment-body">
//                       <p>{comment.comment}</p>
//                     </div>
                    
//                     <div className="comment-footer">
//                       <div className="comment-status">
//                         <span className={`status-dot ${comment.status}`} />
//                         <span className="status-text">{comment.status}</span>
//                       </div>
                      
//                       {comment.resolution_response && (
//                         <div className="comment-resolution">
//                           <strong>Resolution:</strong> {comment.resolution_response}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* Overall Review Summary and Recommendation */}
//         <div className="review-section-card">
//           <div className="section-card-header">
//             <h4>
//               {/* <FileCheck size={18} /> */}
//               Final Review Summary
//             </h4>
//             <p>Provide your overall assessment and final recommendation</p>
//           </div>

//           <div className="summary-form">
//             <div className="form-group">
//               <label>Review Summary *</label>
//               <div className="input-help">
//                 <BookOpen size={14} />
//                 <span>Provide a comprehensive summary of your review findings</span>
//               </div>
//               <textarea
//                 value={reviewSummary.review_summary}
//                 onChange={(e) => setReviewSummary({...reviewSummary, review_summary: e.target.value})}
//                 placeholder="Summarize your key findings, observations, and overall assessment of this contract..."
//                 rows={6}
//                 className="summary-textarea"
//               />
//             </div>

//             <div className="form-group">
//               <label>Overall Recommendation *</label>
//               <div className="input-help">
//                 <FileCheck size={14} />
//                 <span>Select the final recommendation for this contract</span>
//               </div>
//               <div className="recommendation-options">
//                 <button
//                   className={`recommendation-btn ${reviewSummary.overall_recommendation === 'approve' ? 'selected' : ''}`}
//                   onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'approve'})}
//                 >
//                   <div className="recommendation-icon">
//                     <ThumbsUp size={20} />
//                   </div>
//                   <div className="recommendation-content">
//                     <span className="recommendation-title">Approve</span>
//                     <span className="recommendation-description">
//                       Contract is ready for final approval
//                       <br />
//                       <small>Will be forwarded to Director</small>
//                     </span>
//                   </div>
//                 </button>
//                 <button
//                   className={`recommendation-btn ${reviewSummary.overall_recommendation === 'modify' ? 'selected' : ''}`}
//                   onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'modify'})}
//                 >
//                   <div className="recommendation-icon">
//                     <Edit size={20} />
//                   </div>
//                   <div className="recommendation-content">
//                     <span className="recommendation-title">Request Modifications</span>
//                     <span className="recommendation-description">
//                       Needs changes before approval
//                       <br />
//                       <small>Will be returned to Project Manager</small>
//                     </span>
//                   </div>
//                 </button>
//                 <button
//                   className={`recommendation-btn ${reviewSummary.overall_recommendation === 'reject' ? 'selected' : ''}`}
//                   onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'reject'})}
//                 >
//                   <div className="recommendation-icon">
//                     <ThumbsDown size={20} />
//                   </div>
//                   <div className="recommendation-content">
//                     <span className="recommendation-title">Reject</span>
//                     <span className="recommendation-description">
//                       Contract cannot be approved
//                       <br />
//                       <small>Will be returned to Project Manager</small>
//                     </span>
//                   </div>
//                 </button>
//               </div>
//             </div>

//             <div className="review-summary-actions">
//               <button
//                 className="review-clear-form-btn"
//                 onClick={() => setReviewSummary({
//                   review_summary: '',
//                   overall_recommendation: '',
//                   key_issues: [],
//                   risk_assessment: {},
//                   change_requests: []
//                 })}
//               >
//                 Clear Form
//               </button>
//               <button
//                 className="review-submit-btn"
//                 onClick={() => setShowSubmitModal(true)}
//                 disabled={!reviewSummary.review_summary.trim() || !reviewSummary.overall_recommendation}
//               >
//                 <FileCheck size={16} />
//                 Submit Review
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Submit Review Modal */}
//       {showSubmitModal && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h3>Submit Review</h3>
//               <button className="modal-close" onClick={() => setShowSubmitModal(false)}>
//                 <X size={24} />
//               </button>
//             </div>
            
//             <div className="modal-body">
//               <div className="confirmation-message">
//                 <FileCheck size={32} />
//                 <h4>Ready to submit your review?</h4>
//                 <p>Your review will be submitted with the following recommendation:</p>
//               </div>
              
//               <div className="submission-summary">
//                 <div className="summary-item">
//                   <strong>Recommendation:</strong>
//                   <span className={`recommendation-badge ${reviewSummary.overall_recommendation}`}>
//                     {reviewSummary.overall_recommendation === 'approve' ? 'Approve' :
//                      reviewSummary.overall_recommendation === 'modify' ? 'Request Modifications' :
//                      'Reject'}
//                   </span>
//                 </div>
//                 {/* <div className="summary-item">
//                   <strong>Comments Added:</strong>
//                   <span>{programManagerComments.length}</span>
//                 </div> */}
//                 <div className="summary-item">
//                   <strong>Review Summary:</strong>
//                   <span className="summary-text">
//                     {reviewSummary.review_summary.substring(0, 100)}...
//                   </span>
//                 </div>
//               </div>
              
//               {/* <div className="forwarding-notice-modal">
//                 {forwardingNotice && (
//                   <>

//                     <p>{forwardingNotice.message}</p>
//                     {reviewSummary.overall_recommendation === 'approve' && (
//                       <div className="director-notice">
//                         <Shield size={14} />
//                         <span>The Director will be notified and can provide final approval.</span>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div> */}
              
//               <div className="warning-message">
//                 {/* <AlertCircle size={16} /> */}
//                 <p>Once submitted, the contract status will be updated and the Project Manager will be notified.</p>
//               </div>
//             </div>
            
//             <div className="modal-actions">
//               <button
//                 className="btn-secondary"
//                 onClick={() => setShowSubmitModal(false)}
//                 disabled={submitting}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="modal-submit-btn"
//                 onClick={handleSubmitReview}
//                 disabled={submitting}
//               >
//                 {submitting ? (
//                   <>
//                     <Loader2 size={16} className="spinning" />
//                     Submitting...
//                   </>
//                 ) : (
//                   'Submit Review'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ProgramManagerReview;