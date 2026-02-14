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
          <div className="comments-section">
            <div className="comments-section-header">
              <h4>Project Manager Comments</h4>
            </div>
            
            <div className="comments-list">
              {projectManagerCommentList.map((comment) => {
                const uniqueItemKey = comment.uniqueId || generateCommentUniqueKey(comment);
                
                return (
                  <div key={uniqueItemKey} className="comment-card">
                    <div className="comment-header">
                      <div className="comment-author">
                        <div className="comment-author-avatar">
                          <User size={16} />
                        </div>
                        <div className="comment-author-info">
                          <span className="comment-author-name">{comment.user_name || 'Project Manager'}</span>
                          <span className="comment-date">
                            {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="comment-content">
                      <p>{comment.comment}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Program Manager Comments Section */}
        {programManagerCommentList.length > 0 && (
          <div className="comments-section">
            <div className="comments-section-header">
              <h4>Your Review Comments</h4>
            </div>
            
            <div className="comments-list">
              {programManagerCommentList.map((comment) => {
                const uniqueItemKey = comment.uniqueId || generateCommentUniqueKey(comment);
                
                return (
                  <div key={uniqueItemKey} className="comment-card">
                    <div className="comment-header">
                      <div className="comment-author">
                        <div className="comment-author-avatar">
                          <User size={16} />
                        </div>
                        <div className="comment-author-info">
                          <span className="comment-author-name">{comment.user_name || 'You'}</span>
                          <span className="comment-date">
                            {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="comment-tags">
                        {comment.flagged_risk && (
                          <span className="comment-tag risk-tag">
                            <Flag size={12} />
                            <span>Risk</span>
                          </span>
                        )}
                        
                        {comment.flagged_issue && (
                          <span className="comment-tag issue-tag">
                            <AlertCircle size={12} />
                            <span>Issue</span>
                          </span>
                        )}
                        
                        {comment.recommendation && (
                          <span className={`comment-tag recommendation-tag ${comment.recommendation}`}>
                            {comment.recommendation === 'approve' && <ThumbsUp size={12} />}
                            {comment.recommendation === 'reject' && <ThumbsDown size={12} />}
                            {comment.recommendation === 'modify' && <Edit size={12} />}
                            <span>
                              {comment.recommendation === 'approve' ? 'Approve' : 
                               comment.recommendation === 'reject' ? 'Reject' : 'Modify'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="comment-content">
                      <p>{comment.comment}</p>
                    </div>
                    
                    {comment.resolution_response && (
                      <div className="comment-resolution">
                        <strong>Resolution:</strong> {comment.resolution_response}
                      </div>
                    )}
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
//   const [contractData, setContractData] = useState(null);
//   const [isPageLoading, setIsPageLoading] = useState(true);
//   const [reviewComments, setReviewComments] = useState([]);
//   const [notification, setNotification] = useState({
//     show: false,
//     type: '',
//     title: '',
//     message: ''
//   });
  
//   const [commentFormData, setCommentFormData] = useState({
//     comment: '',
//     comment_type: 'review',
//     flagged_risk: false,
//     flagged_issue: false,
//     change_request: null,
//     recommendation: ''
//   });
  
//   const [reviewFinalData, setReviewFinalData] = useState({
//     review_summary: '',
//     overall_recommendation: '',
//     key_issues: [],
//     risk_assessment: {},
//     change_requests: []
//   });
  
//   const [showReviewModal, setShowReviewModal] = useState(false);
//   const [isSubmittingReview, setIsSubmittingReview] = useState(false);
//   const [pageError, setPageError] = useState('');

//   const generateCommentUniqueKey = (commentItem) => {
//     if (commentItem.id && commentItem.created_at) {
//       return `${commentItem.id}_${commentItem.created_at}`;
//     }
//     if (commentItem.id) {
//       return `comment_${commentItem.id}`;
//     }
//     if (commentItem.created_at) {
//       return `comment_${commentItem.created_at}`;
//     }
//     return `comment_${Math.random().toString(36).substr(2, 9)}`;
//   };

//   const showNotificationMessage = (type, title, message) => {
//     setNotification({
//       show: true,
//       type,
//       title,
//       message
//     });
    
//     setTimeout(() => {
//       setNotification(prev => ({ ...prev, show: false }));
//     }, 5000);
//   };

//   const closeNotification = () => {
//     setNotification(prev => ({ ...prev, show: false }));
//   };

//   useEffect(() => {
//     if (contractId) {
//       fetchContractDetails();
//       fetchCommentHistory();
//     }
//   }, [contractId]);

//   const fetchContractDetails = async () => {
//     try {
//       setIsPageLoading(true);
//       setPageError('');
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setContractData(data);
//       } else {
//         const errorData = await response.json();
//         setPageError(errorData.detail || 'Failed to fetch contract');
//       }
//     } catch (error) {
//       console.error('Failed to fetch contract:', error);
//       setPageError('Network error. Please try again.');
//     } finally {
//       setIsPageLoading(false);
//     }
//   };

//   const fetchCommentHistory = async () => {
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
//         const commentIds = data.comments?.map(c => c.id) || [];
//         const duplicateIds = commentIds.filter((id, index) => commentIds.indexOf(id) !== index);
        
//         if (duplicateIds.length > 0) {
//           console.warn('Found duplicate comment IDs:', duplicateIds);
//           const uniqueComments = (data.comments || []).map((comment, index) => ({
//             ...comment,
//             uniqueId: generateCommentUniqueKey(comment)
//           }));
//           setReviewComments(uniqueComments);
//         } else {
//           setReviewComments(data.comments || []);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch comments:', error);
//     }
//   };

//   const handleAddNewComment = async () => {
//     if (!commentFormData.comment.trim()) {
//       showNotificationMessage('error', 'Validation Error', 'Please enter a comment');
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
//           ...commentFormData,
//           contract_id: parseInt(contractId)
//         })
//       });

//       if (response.ok) {
//         showNotificationMessage('success', 'Success', 'Comment added successfully');
//         setCommentFormData({
//           comment: '',
//           comment_type: 'review',
//           flagged_risk: false,
//           flagged_issue: false,
//           change_request: null,
//           recommendation: ''
//         });
//         fetchCommentHistory();
//       } else {
//         const error = await response.json();
//         showNotificationMessage('error', 'Failed', `Failed to add comment: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to add comment:', error);
//       showNotificationMessage('error', 'Failed', 'Failed to add comment');
//     }
//   };

//   const handleSubmitFinalReview = async () => {
//     if (!reviewFinalData.review_summary.trim()) {
//       showNotificationMessage('error', 'Validation Error', 'Please provide a review summary');
//       return;
//     }

//     if (!reviewFinalData.overall_recommendation) {
//       showNotificationMessage('error', 'Validation Error', 'Please select an overall recommendation');
//       return;
//     }

//     setIsSubmittingReview(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager/submit-review`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           ...reviewFinalData,
//           contract_id: parseInt(contractId),
//           comments: reviewComments.filter(c => !c.id)
//         })
//       });

//       if (response.ok) {
//         const result = await response.json();
//         showNotificationMessage('success', 'Review Submitted', result.message);
//         setShowReviewModal(false);
//         setTimeout(() => {
//           navigate('/review');
//         }, 2000);
//       } else {
//         const error = await response.json();
//         showNotificationMessage('error', 'Submission Failed', `Failed to submit review: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to submit review:', error);
//       showNotificationMessage('error', 'Submission Failed', 'Failed to submit review');
//     } finally {
//       setIsSubmittingReview(false);
//     }
//   };

//   const formatCurrencyValue = (amount) => {
//     if (!amount && amount !== 0) return '-';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const formatDateString = (dateString) => {
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

//   const getForwardingActionInfo = () => {
//     if (reviewFinalData.overall_recommendation === 'approve') {
//       return {
//         title: 'Ready for Director Approval',
//         message: 'This contract will be forwarded to the Director for final approval after submission.',
//         icon: Shield,
//         color: '#16a34a',
//         bgColor: '#dcfce7'
//       };
//     } else if (reviewFinalData.overall_recommendation === 'reject') {
//       return {
//         title: 'Return to Project Manager',
//         message: 'This contract will be returned to the Project Manager with rejection feedback.',
//         icon: XCircle,
//         color: '#dc2626',
//         bgColor: '#fee2e2'
//       };
//     } else if (reviewFinalData.overall_recommendation === 'modify') {
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

//   const forwardingActionInfo = getForwardingActionInfo();

//   if (isPageLoading) {
//     return (
//       <div className="review-loading-container">
//         <div className="review-loading-content">
//           <Loader2 size={48} className="loading-spinner" />
//           <h3>Loading Contract for Review</h3>
//           <p>Preparing review interface...</p>
//         </div>
//       </div>
//     );
//   }

//   if (pageError) {
//     return (
//       <div className="review-error-container">
//         <div className="review-error-content">
//           <AlertCircle size={48} />
//           <h2>Error Loading Contract</h2>
//           <p>{pageError}</p>
//         </div>
//       </div>
//     );
//   }

//   if (!contractData) {
//     return (
//       <div className="review-error-container">
//         <div className="review-error-content">
//           <AlertCircle size={48} />
//           <h2>Contract Not Found</h2>
//           <p>The contract you're trying to review could not be found.</p>
//         </div>
//       </div>
//     );
//   }

//   const comprehensiveData = contractData.comprehensive_data || {};
//   const contractDetails = comprehensiveData.contract_details || {};
//   const parties = comprehensiveData.parties || {};
//   const financial = comprehensiveData.financial_details || {};

//   const commentStatistics = {
//     total: reviewComments.length,
//     open: reviewComments.filter(c => c.status === 'open').length,
//     risks: reviewComments.filter(c => c.flagged_risk).length,
//     issues: reviewComments.filter(c => c.flagged_issue).length
//   };

//   const projectManagerCommentList = reviewComments.filter(comment => 
//     comment.user_role === "project_manager" || 
//     comment.comment_type?.includes('project_manager')
//   );
  
//   const programManagerCommentList = reviewComments.filter(comment => 
//     comment.user_role === "program_manager"
//   );

//   return (
//     <div className="pm-review-container">
//       {/* Notification System */}
//       {notification.show && (
//         <div className={`notification-popup notification-${notification.type}`}>
//           <div className="notification-icon">
//             {notification.type === 'success' && <CheckCircle size={20} />}
//             {notification.type === 'error' && <AlertCircle size={20} />}
//             {notification.type === 'warning' && <AlertTriangle size={20} />}
//             {notification.type === 'info' && <Info size={20} />}
//           </div>
//           <div className="notification-content">
//             <h4>{notification.title}</h4>
//             <p>{notification.message}</p>
//           </div>
//           <button className="notification-close" onClick={closeNotification}>
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       {/* Header */}
//       <div className="review-header-section">
//         <div className="header-left-section">
//           <div className="header-info-wrapper">
//             <div className="contract-title-section">
//               <h2>{contractData.grant_name || contractData.filename}</h2>
//               <div className="contract-metadata">
//                 <span className="metadata-item">
//                   <Building size={14} />
//                   {contractData.grantor || 'Unknown Grantor'}
//                 </span>
//                 <span className="metadata-item">
//                   <DollarSign size={14} />
//                   {formatCurrencyValue(contractData.total_amount)}
//                 </span>
//                 <span className="metadata-item">
//                   <Calendar size={14} />
//                   {formatDateString(contractData.start_date)} - {formatDateString(contractData.end_date)}
//                 </span>
//                 <span className={`status-indicator ${contractData.status}`}>
//                   {contractData.status}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="header-action-buttons">
//           <button 
//             className="primary-action-btn"
//             onClick={() => navigate(`/contracts/${contractId}`)}
//           >
//             <Eye size={16} />
//             View Full Details
//           </button>
//           <button className="secondary-action-btn">
//             <Download size={16} />
//             Export
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="review-statistics">
//         <div className="stat-card">
//           <div className="stat-card-content">
//             <span className="stat-number">{commentStatistics.total}</span>
//             <span className="stat-label-text">Total Comments</span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-card-content">
//             <span className="stat-number">{commentStatistics.risks}</span>
//             <span className="stat-label-text">Risks Flagged</span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-card-content">
//             <span className="stat-number">{commentStatistics.issues}</span>
//             <span className="stat-label-text">Issues Flagged</span>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-card-content">
//             <span className="stat-number">{commentStatistics.open}</span>
//             <span className="stat-label-text">Open Items</span>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="review-main-panel">
//         <div className="panel-header">
//           <h3>Grant Review</h3>
//         </div>

//         {/* Project Manager Comments Section */}
//         {projectManagerCommentList.length > 0 && (
//           <div className="comment-section-card">
//             <div className="comment-section-header">
//               <h4>
//                 <User size={18} />
//                 Project Manager Comments
//                 <span className="comment-counter">({projectManagerCommentList.length})</span>
//               </h4>
//               <p>Comments from the Project Manager who created this contract</p>
//             </div>
            
//             <div className="comment-feed">
//               {projectManagerCommentList.map((comment) => {
//                 const IconComponent = comment.comment_type === 'project_manager_note' ? User :
//                             comment.comment_type === 'project_manager_submission' ? FileCheck :
//                             MessageSquare;
                
//                 const uniqueItemKey = comment.uniqueId || generateCommentUniqueKey(comment);
                
//                 return (
//                   <div key={uniqueItemKey} className="comment-thread project-manager-thread">
//                     <div className="thread-header">
//                       <div className="author-info">
//                         <div className="author-avatar">
//                           <User size={14} />
//                         </div>
//                         <div className="author-details">
//                           <span className="author-name">{comment.user_name || 'Project Manager'}</span>
//                           <span className="author-role project-manager-role">
//                             Project Manager
//                           </span>
//                           <span className="comment-timestamp">
//                             {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="comment-tags">
//                         <div className={`comment-tag ${comment.comment_type}`}>
//                           <IconComponent size={12} />
//                           <span>
//                             {comment.comment_type === 'project_manager_note' ? 'PM Note' :
//                              comment.comment_type === 'project_manager_submission' ? 'PM Submission' :
//                              'General'}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="thread-body">
//                       <p>{comment.comment}</p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* Add Comment Form - Commented Out */}
//         {/* ... */}

//         {/* Program Manager Comments Section */}
//         {programManagerCommentList.length > 0 && (
//           <div className="comment-section-card">
//             <div className="comment-section-header">
//               <h4>
//                 <MessageSquare size={18} />
//                 Your Review Comments
//                 <span className="comment-counter">({programManagerCommentList.length})</span>
//               </h4>
//               <p>Comments you've added during this review</p>
//             </div>
            
//             <div className="comment-feed">
//               {programManagerCommentList.map((comment) => {
//                 const IconComponent = comment.comment_type === 'risk' ? AlertCircle :
//                             comment.comment_type === 'financial' ? DollarSign :
//                             comment.comment_type === 'compliance' ? Shield :
//                             comment.comment_type === 'legal' ? FileText :
//                             MessageSquare;
                
//                 const uniqueItemKey = comment.uniqueId || generateCommentUniqueKey(comment);
                
//                 return (
//                   <div key={uniqueItemKey} className={`comment-thread ${comment.status}`}>
//                     <div className="thread-header">
//                       <div className="author-info">
//                         <div className="author-avatar">
//                           <User size={14} />
//                         </div>
//                         <div className="author-details">
//                           <span className="author-name">{comment.user_name || 'You'}</span>
//                           <span className="author-role program-manager-role">
//                             Program Manager
//                           </span>
//                           <span className="comment-timestamp">
//                             {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="comment-tags">
//                         <div className={`comment-tag ${comment.comment_type}`}>
//                           <IconComponent size={12} />
//                           <span>
//                             {comment.comment_type === 'review' ? 'Review' :
//                              comment.comment_type === 'compliance' ? 'Compliance' :
//                              comment.comment_type || 'General'}
//                           </span>
//                         </div>
                        
//                         {comment.flagged_risk && (
//                           <span className="tag risk-tag">
//                             <Flag size={10} />
//                             <span>Risk</span>
//                           </span>
//                         )}
                        
//                         {comment.flagged_issue && (
//                           <span className="tag issue-tag">
//                             <AlertCircle size={10} />
//                             <span>Issue</span>
//                           </span>
//                         )}
                        
//                         {comment.recommendation && (
//                           <span className={`tag recommendation-tag ${comment.recommendation}`}>
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
                    
//                     <div className="thread-body">
//                       <p>{comment.comment}</p>
//                     </div>
                    
//                     <div className="thread-footer">
//                       <div className="thread-status">
//                         <span className={`status-dot-indicator ${comment.status}`} />
//                         <span className="status-text-label">{comment.status}</span>
//                       </div>
                      
//                       {comment.resolution_response && (
//                         <div className="thread-resolution">
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

//         {/* Final Review Summary Section */}
//         <div className="review-section-card">
//           <div className="review-section-header">
//             <h4>
//               Final Review Summary
//             </h4>
//             <p>Provide your overall assessment and final recommendation</p>
//           </div>

//           <div className="review-form-container">
//             <div className="form-field-group">
//               <label>Review Summary *</label>
//               <div className="field-hint">
//                 <BookOpen size={14} />
//                 <span>Provide a comprehensive summary of your review findings</span>
//               </div>
//               <textarea
//                 value={reviewFinalData.review_summary}
//                 onChange={(e) => setReviewFinalData({...reviewFinalData, review_summary: e.target.value})}
//                 placeholder="Summarize your key findings, observations, and overall assessment of this contract..."
//                 rows={6}
//                 className="review-textarea"
//               />
//             </div>

//             <div className="form-field-group">
//               <label>Overall Recommendation *</label>
//               <div className="field-hint">
//                 <FileCheck size={14} />
//                 <span>Select the final recommendation for this contract</span>
//               </div>
//               <div className="recommendation-grid">
//                 <button
//                   className={`recommendation-option ${reviewFinalData.overall_recommendation === 'approve' ? 'selected-option' : ''}`}
//                   onClick={() => setReviewFinalData({...reviewFinalData, overall_recommendation: 'approve'})}
//                 >
//                   <div className="option-icon">
//                     <ThumbsUp size={20} />
//                   </div>
//                   <div className="option-content">
//                     <span className="option-title">Approve</span>
//                     <span className="option-description">
//                       Contract is ready for final approval
//                       <br />
//                       <small>Will be forwarded to Director</small>
//                     </span>
//                   </div>
//                 </button>
//                 <button
//                   className={`recommendation-option ${reviewFinalData.overall_recommendation === 'modify' ? 'selected-option' : ''}`}
//                   onClick={() => setReviewFinalData({...reviewFinalData, overall_recommendation: 'modify'})}
//                 >
//                   <div className="option-icon">
//                     <Edit size={20} />
//                   </div>
//                   <div className="option-content">
//                     <span className="option-title">Request Modifications</span>
//                     <span className="option-description">
//                       Needs changes before approval
//                       <br />
//                       <small>Will be returned to Project Manager</small>
//                     </span>
//                   </div>
//                 </button>
//                 <button
//                   className={`recommendation-option ${reviewFinalData.overall_recommendation === 'reject' ? 'selected-option' : ''}`}
//                   onClick={() => setReviewFinalData({...reviewFinalData, overall_recommendation: 'reject'})}
//                 >
//                   <div className="option-icon">
//                     <ThumbsDown size={20} />
//                   </div>
//                   <div className="option-content">
//                     <span className="option-title">Reject</span>
//                     <span className="option-description">
//                       Contract cannot be approved
//                       <br />
//                       <small>Will be returned to Project Manager</small>
//                     </span>
//                   </div>
//                 </button>
//               </div>
//             </div>

//             <div className="review-form-actions">
//               <button
//                 className="clear-form-button"
//                 onClick={() => setReviewFinalData({
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
//                 className="submit-review-button"
//                 onClick={() => setShowReviewModal(true)}
//                 disabled={!reviewFinalData.review_summary.trim() || !reviewFinalData.overall_recommendation}
//               >
//                 <FileCheck size={16} />
//                 Submit Review
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Review Submission Modal */}
//       {showReviewModal && (
//         <div className="review-modal-overlay">
//           <div className="review-modal-container">
//             <div className="review-modal-header">
//               <h3>Submit Review</h3>
//               <button className="review-modal-close" onClick={() => setShowReviewModal(false)}>
//                 <X size={24} />
//               </button>
//             </div>
            
//             <div className="review-modal-body">
//               <div className="confirmation-panel">
//                 <FileCheck size={32} />
//                 <h4>Ready to submit your review?</h4>
//                 <p>Your review will be submitted with the following recommendation:</p>
//               </div>
              
//               <div className="submission-details">
//                 <div className="detail-item">
//                   <strong>Recommendation:</strong>
//                   <span className={`recommendation-label ${reviewFinalData.overall_recommendation}`}>
//                     {reviewFinalData.overall_recommendation === 'approve' ? 'Approve' :
//                      reviewFinalData.overall_recommendation === 'modify' ? 'Request Modifications' :
//                      'Reject'}
//                   </span>
//                 </div>
//                 <div className="detail-item">
//                   <strong>Review Summary:</strong>
//                   <span className="summary-preview">
//                     {reviewFinalData.review_summary.substring(0, 100)}...
//                   </span>
//                 </div>
//               </div>
           
//             </div>
            
//             <div className="review-modal-footer">
//               <button
//                 className="secondary-modal-btn"
//                 onClick={() => setShowReviewModal(false)}
//                 disabled={isSubmittingReview}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="primary-modal-btn"
//                 onClick={handleSubmitFinalReview}
//                 disabled={isSubmittingReview}
//               >
//                 {isSubmittingReview ? (
//                   <>
//                     <Loader2 size={16} className="loading-spinner" />
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