import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Edit,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
  ChevronRight,
  Eye,
  Download,
  Clock,
  User,
  Calendar,
  Building,
  DollarSign,
  Shield,
  FileCheck,
  Award,
  ClipboardCheck,
  ListChecks,
  AlertTriangle,
  XCircle,
  Info,
  FileWarning
} from 'lucide-react';
import API_CONFIG from '../../config';
import './ProjectManagerActions.css';

function ProjectManagerActions({ contract, user, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [pmComment, setPmComment] = useState('');
  const [reviewComments, setReviewComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [formData, setFormData] = useState({
    notes: '',
    response: '',
    grant_name: '',
    contract_number: '',
    grantor: '',
    grantee: '',
    total_amount: '',
    start_date: '',
    end_date: '',
    purpose: ''
  });
  
  // Popup state
  const [popup, setPopup] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info', // success, error, warning, confirm
    onConfirm: null,
    onCancel: null
  });
  
  const navigate = useNavigate();

  // Show popup helper
  const showPopup = (title, message, type = 'info', onConfirm = null, onCancel = null) => {
    setPopup({
      show: true,
      title,
      message,
      type,
      onConfirm,
      onCancel
    });
  };

  // Close popup
  const closePopup = () => {
    setPopup({
      show: false,
      title: '',
      message: '',
      type: 'info',
      onConfirm: null,
      onCancel: null
    });
  };

  useEffect(() => {
    if (contract && (contract.status === 'under_review' || contract.status === 'rejected')) {
      fetchReviewComments();
    }
  }, [contract]);

  useEffect(() => {
    // If contract is draft or rejected, show submit form by default
    if (contract && (contract.status === 'draft' || contract.status === 'rejected')) {
      setActiveAction('submit_review');
    } else {
      setActiveAction(null);
    }
  }, [contract]);

  const fetchReviewComments = async () => {
    if (!contract?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/all-review-comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviewComments(data.comments || []);
      } else {
        const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/review-comments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setReviewComments(fallbackData.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch review comments:', error);
      showPopup('Error', 'Failed to fetch review comments', 'error');
    }
  };

  const handleSubmitForReview = async () => {
    if (!formData.notes.trim()) {
      showPopup('Missing Information', 'Please provide notes for the submission', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/submit-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: formData.notes
        })
      });

      if (response.ok) {
        showPopup('Success', 'Contract submitted for review successfully!', 'success');
        setFormData({ ...formData, notes: '' });
        setActiveAction(null);
        if (onActionComplete) onActionComplete();
      } else {
        const error = await response.json();
        showPopup('Submission Failed', `Failed to submit for review: ${error.detail}`, 'error');
      }
    } catch (error) {
      console.error('Failed to submit for review:', error);
      showPopup('Submission Failed', 'Failed to submit for review. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFixMetadata = async () => {
    const updatedFields = Object.keys(formData).filter(key => 
      key !== 'notes' && formData[key] !== ''
    );
    
    if (updatedFields.length === 0) {
      showPopup('No Changes', 'Please update at least one field', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/fix-metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_name: formData.grant_name || undefined,
          contract_number: formData.contract_number || undefined,
          grantor: formData.grantor || undefined,
          grantee: formData.grantee || undefined,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : undefined,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          purpose: formData.purpose || undefined,
          notes: formData.notes || undefined
        })
      });

      if (response.ok) {
        showPopup('Success', 'Metadata updated successfully!', 'success');
        setFormData({
          notes: '',
          response: '',
          grant_name: '',
          contract_number: '',
          grantor: '',
          grantee: '',
          total_amount: '',
          start_date: '',
          end_date: '',
          purpose: ''
        });
        setActiveAction(null);
        if (onActionComplete) onActionComplete();
      } else {
        const error = await response.json();
        showPopup('Update Failed', `Failed to update metadata: ${error.detail}`, 'error');
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
      showPopup('Update Failed', 'Failed to update metadata. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToComments = async () => {
    if (!formData.response.trim()) {
      showPopup('Missing Information', 'Please provide a response', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/respond-to-comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response: formData.response,
          review_comment_id: null
        })
      });

      if (response.ok) {
        showPopup('Success', 'Response submitted successfully!', 'success');
        setFormData({ ...formData, response: '' });
        setActiveAction(null);
        if (onActionComplete) onActionComplete();
      } else {
        const error = await response.json();
        showPopup('Submission Failed', `Failed to submit response: ${error.detail}`, 'error');
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      showPopup('Submission Failed', 'Failed to submit response. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProjectManagerComment = async () => {
    if (!pmComment.trim()) {
      showPopup('Missing Information', 'Please enter a comment', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/program-manager/add-comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contract_id: contract.id,
          comment: pmComment,
          comment_type: 'project_manager_note',
          flagged_risk: false,
          flagged_issue: false,
          recommendation: null
        })
      });

      if (response.ok) {
        showPopup('Success', 'Comment added successfully! Program Managers will see this during review.', 'success');
        setPmComment('');
        fetchReviewComments();
      } else {
        const error = await response.json();
        showPopup('Failed', `Failed to add comment: ${error.detail}`, 'error');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      showPopup('Failed', 'Failed to add comment. Please try again.', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={14} className="project-text-yellow-600" />;
      case 'resolved':
        return <CheckCircle size={14} className="project-text-green-600" />;
      default:
        return <Clock size={14} className="project-text-gray-600" />;
    }
  };

  // Get contract status display name
  const getStatusDisplay = (status) => {
    const statusMap = {
      'draft': 'Draft',
      'under_review': 'Under Review',
      'reviewed': 'Reviewed',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed'
    };
    return statusMap[status] || status;
  };

  // Show action forms based on contract status
  const shouldShowActionForms = () => {
    return contract && (contract.status === 'draft' || contract.status === 'rejected');
  };

  // Get appropriate action title based on status
  const getActionTitle = () => {
    if (contract.status === 'rejected') {
      return 'Resubmit Contract for Review';
    }
    return 'Submit Contract for Review';
  };

  // Get appropriate button text based on status
  const getActionButtonText = () => {
    if (contract.status === 'rejected') {
      return 'Resubmit for Review';
    }
    return 'Submit for Review';
  };

  return (
    <div className="project-actions-container">
      <div className="project-actions-header">
        <h3 className="project-title">
          <User size={20} />
          Project Manager Actions
        </h3>
        <div className={`project-status-badge ${contract.status}`}>
          {getStatusDisplay(contract.status)}
        </div>
      </div>

      {/* Action Forms - Always show for draft/rejected contracts */}
      {shouldShowActionForms() && (
        <div className="project-action-forms">
          {/* Submit for Review Form - Always visible for draft/rejected */}
          {(activeAction === 'submit_review' || !activeAction) && (
            <div className="project-action-form">
              <h4 className="project-form-title">{getActionTitle()}</h4>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes or comments for the reviewers..."
                rows={4}
                className="project-textarea"
              />
              <div className="project-form-actions">
                <button
                  className="project-btn-secondary"
                  onClick={() => {
                    setFormData({ ...formData, notes: '' });
                    setActiveAction(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="project-btn-primary"
                  onClick={handleSubmitForReview}
                  disabled={!formData.notes.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="project-spinning" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      {getActionButtonText()}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Fix Metadata Form */}
          {activeAction === 'fix_metadata' && (
            <div className="project-action-form">
              <h4 className="project-form-title">Fix Contract Metadata</h4>
              <div className="project-metadata-form">
                <div className="project-form-group">
                  <label>Grant Name</label>
                  <input
                    type="text"
                    value={formData.grant_name}
                    onChange={(e) => setFormData({ ...formData, grant_name: e.target.value })}
                    placeholder={contract.grant_name || 'Enter grant name'}
                    className="project-input"
                  />
                </div>
                <div className="project-form-group">
                  <label>Contract Number</label>
                  <input
                    type="text"
                    value={formData.contract_number}
                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                    placeholder={contract.contract_number || 'Enter contract number'}
                    className="project-input"
                  />
                </div>
                <div className="project-form-group">
                  <label>Grantor</label>
                  <input
                    type="text"
                    value={formData.grantor}
                    onChange={(e) => setFormData({ ...formData, grantor: e.target.value })}
                    placeholder={contract.grantor || 'Enter grantor name'}
                    className="project-input"
                  />
                </div>
                <div className="project-form-group">
                  <label>Grantee</label>
                  <input
                    type="text"
                    value={formData.grantee}
                    onChange={(e) => setFormData({ ...formData, grantee: e.target.value })}
                    placeholder={contract.grantee || 'Enter grantee name'}
                    className="project-input"
                  />
                </div>
                <div className="project-form-row">
                  <div className="project-form-group">
                    <label>Total Amount ($)</label>
                    <input
                      type="number"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      placeholder={contract.total_amount || 'Enter total amount'}
                      className="project-input"
                    />
                  </div>
                </div>
                <div className="project-form-row">
                  <div className="project-form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="project-input"
                    />
                  </div>
                  <div className="project-form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="project-input"
                    />
                  </div>
                </div>
                <div className="project-form-group">
                  <label>Purpose</label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder={contract.purpose || 'Enter contract purpose'}
                    rows={3}
                    className="project-textarea"
                  />
                </div>
                <div className="project-form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes about these changes..."
                    rows={2}
                    className="project-textarea"
                  />
                </div>
              </div>
              <div className="project-form-actions">
                <button
                  className="project-btn-secondary"
                  onClick={() => {
                    setActiveAction('submit_review');
                    setFormData({ ...formData, notes: '' });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="project-btn-primary"
                  onClick={handleFixMetadata}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="project-spinning" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit size={14} />
                      Update Metadata
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Respond to Comments Form */}
          {activeAction === 'respond_comments' && (
            <div className="project-action-form">
              <h4 className="project-form-title">Respond to Program Manager Comments</h4>
              <textarea
                value={formData.response}
                onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                placeholder="Enter your response to the program manager's comments..."
                rows={4}
                className="project-textarea"
              />
              <div className="project-form-actions">
                <button
                  className="project-btn-secondary"
                  onClick={() => setActiveAction('submit_review')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="project-btn-primary"
                  onClick={handleRespondToComments}
                  disabled={!formData.response.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="project-spinning" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={14} />
                      Submit Response
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Additional Actions Bar */}
          <div className="project-additional-actions">
            {contract.status === 'rejected' && (
              <button
                className="project-action-btn secondary"
                onClick={() => setActiveAction('respond_comments')}
                disabled={loading || activeAction === 'respond_comments'}
              >
                <MessageSquare size={16} />
                Respond to Comments
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contract Status Info - Show when not in draft/rejected */}
      {!shouldShowActionForms() && (
        <div className="project-status-info">
          <div className="project-status-message">
            {/* <CheckCircle size={20} className="project-text-green-600" /> */}
            <div>
              <p className="project-status-title">Grant Status: <strong>{getStatusDisplay(contract.status)}</strong></p>
              <p className="project-status-description">
                {contract.status === 'under_review' && 'The Grant is currently under review.'}
                {contract.status === 'reviewed' && 'The Grant has been reviewed.'}
                {contract.status === 'approved' && 'The Grant has been approved.'}
                {contract.status === 'completed' && 'The Grant has been completed.'}
              </p>
            </div>
          </div>
          
          {/* Show comments button for reviewed contracts */}
          {(contract.status === 'under_review' || contract.status === 'reviewed' || contract.status === 'approved') && (
            <button
              className="project-view-comments-btn"
              onClick={() => {
                setShowComments(!showComments);
                if (!showComments) {
                  fetchReviewComments();
                }
              }}
            >
              <MessageSquare size={16} />
              {showComments ? 'Hide' : 'View'} Review Comments
            </button>
          )}
        </div>
      )}

      {/* All Comments Display - Show for all statuses when toggled */}
      {showComments && reviewComments.length > 0 && (
        <div className="project-all-comments-section">
          <h4 className="project-comments-title">
            <MessageSquare size={16} />
            All Comments ({reviewComments.length})
          </h4>
          <div className="project-comments-list">
            {reviewComments.map((comment, index) => {
              const isProjectManager = comment.user_role === "project_manager";
              const isSubmission = comment.comment_type === "project_manager_submission";
              
              return (
                <div key={comment.id || index} className={`project-comment-card ${comment.status} ${isProjectManager ? 'project-manager-comment' : ''}`}>
                  <div className="project-comment-header">
                    <div className="project-commenter-info">
                      <User size={12} />
                      <span className="project-commenter-name">{comment.user_name}</span>
                      <span className={`project-commenter-role ${comment.user_role}`}>
                        {comment.user_role === "project_manager" ? "Project Manager" : 
                         comment.user_role === "program_manager" ? "Program Manager" : 
                         comment.user_role === "director" ? "Director" : comment.user_role}
                      </span>
                      {isSubmission && (
                        <span className="project-comment-type-badge submission">
                          <Send size={10} />
                          Submission Note
                        </span>
                      )}
                      <span className="project-comment-date">{formatDate(comment.created_at)}</span>
                    </div>
                    <div className="project-comment-meta">
                      <span className="project-comment-status">
                        {getStatusIcon(comment.status)}
                        {comment.status}
                      </span>
                    </div>
                  </div>
                  <div className="project-comment-body">
                    <div className="project-comment-type">{comment.comment_type}</div>
                    <p className="project-comment-text">{comment.comment}</p>
                    {isProjectManager && (
                      <div className="project-pm-comment-note">
                        <Info size={12} />
                        <span>This comment will be visible to Program Managers</span>
                      </div>
                    )}
                    {comment.flagged_risk && (
                      <div className="project-comment-flag risk">
                        <AlertCircle size={12} />
                        Flagged as Risk
                      </div>
                    )}
                    {comment.flagged_issue && (
                      <div className="project-comment-flag issue">
                        <AlertCircle size={12} />
                        Flagged as Issue
                      </div>
                    )}
                    {comment.recommendation && (
                      <div className={`project-comment-recommendation ${comment.recommendation}`}>
                        Recommendation: {comment.recommendation}
                      </div>
                    )}
                    {comment.resolution_response && (
                      <div className="project-comment-resolution">
                        <strong>Your Response:</strong> {comment.resolution_response}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty Comments State */}
      {showComments && reviewComments.length === 0 && (
        <div className="project-empty-comments">
          <MessageSquare size={32} />
          <p>No comments found</p>
        </div>
      )}

      {/* Custom Popup Component */}
      {popup.show && (
        <div className="project-popup-overlay">
          <div className={`project-popup project-popup-${popup.type}`}>
            <div className="project-popup-header">
              {popup.type === 'success' && <CheckCircle size={24} className="popup-icon-success" />}
              {popup.type === 'error' && <XCircle size={24} className="popup-icon-error" />}
              {popup.type === 'warning' && <AlertTriangle size={24} className="popup-icon-warning" />}
              {popup.type === 'confirm' && <AlertTriangle size={24} className="popup-icon-confirm" />}
              {popup.type === 'info' && <AlertTriangle size={24} className="popup-icon-info" />}
              <h3>{popup.title}</h3>
              <button className="project-popup-close" onClick={closePopup}>
                <X size={18} />
              </button>
            </div>
            <div className="project-popup-content">
              <p>{popup.message}</p>
            </div>
            <div className="project-popup-actions">
              {popup.type === 'confirm' ? (
                <>
                  <button 
                    className="project-popup-btn project-popup-btn-cancel"
                    onClick={popup.onCancel || closePopup}
                  >
                    Cancel
                  </button>
                  <button 
                    className="project-popup-btn project-popup-btn-confirm"
                    onClick={popup.onConfirm}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button 
                  className="project-popup-btn project-popup-btn-ok"
                  onClick={closePopup}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManagerActions;

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Send,
//   Edit,
//   MessageSquare,
//   RefreshCw,
//   CheckCircle,
//   AlertCircle,
//   FileText,
//   Loader2,
//   ChevronRight,
//   Eye,
//   Download,
//   Clock,
//   User,
//   Calendar,
//   Building,
//   DollarSign,
//   Shield,
//   FileCheck,
//   Award,
//   ClipboardCheck,
//   ListChecks,
//   AlertTriangle,
//   XCircle,
//   Info,
//   FileWarning
// } from 'lucide-react';
// import API_CONFIG from '../../config';
// import './ProjectManagerActions.css';

// function ProjectManagerActions({ contract, user, onActionComplete }) {
//   const [loading, setLoading] = useState(false);
//   const [activeAction, setActiveAction] = useState(null);
//   const [pmComment, setPmComment] = useState('');
//   const [reviewComments, setReviewComments] = useState([]);
//   const [showComments, setShowComments] = useState(false);
//   const [formData, setFormData] = useState({
//     notes: '',
//     response: '',
//     grant_name: '',
//     contract_number: '',
//     grantor: '',
//     grantee: '',
//     total_amount: '',
//     start_date: '',
//     end_date: '',
//     purpose: ''
//   });
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (contract && (contract.status === 'under_review' || contract.status === 'rejected')) {
//       fetchReviewComments();
//     }
//   }, [contract]);

//   useEffect(() => {
//     // If contract is draft or rejected, show submit form by default
//     if (contract && (contract.status === 'draft' || contract.status === 'rejected')) {
//       setActiveAction('submit_review');
//     } else {
//       setActiveAction(null);
//     }
//   }, [contract]);

//   const fetchReviewComments = async () => {
//     if (!contract?.id) return;
    
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/all-review-comments`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setReviewComments(data.comments || []);
//       } else {
//         const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/review-comments`, {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });
        
//         if (fallbackResponse.ok) {
//           const fallbackData = await fallbackResponse.json();
//           setReviewComments(fallbackData.comments || []);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch review comments:', error);
//     }
//   };

//   const handleSubmitForReview = async () => {
//     if (!formData.notes.trim()) {
//       alert('Please provide notes for the submission');
//       return;
//     }

//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/submit-review`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           notes: formData.notes
//         })
//       });

//       if (response.ok) {
//         alert('Contract submitted for review successfully!');
//         setFormData({ ...formData, notes: '' });
//         setActiveAction(null);
//         if (onActionComplete) onActionComplete();
//       } else {
//         const error = await response.json();
//         alert(`Failed to submit for review: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to submit for review:', error);
//       alert('Failed to submit for review');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFixMetadata = async () => {
//     const updatedFields = Object.keys(formData).filter(key => 
//       key !== 'notes' && formData[key] !== ''
//     );
    
//     if (updatedFields.length === 0) {
//       alert('Please update at least one field');
//       return;
//     }

//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/fix-metadata`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           grant_name: formData.grant_name || undefined,
//           contract_number: formData.contract_number || undefined,
//           grantor: formData.grantor || undefined,
//           grantee: formData.grantee || undefined,
//           total_amount: formData.total_amount ? parseFloat(formData.total_amount) : undefined,
//           start_date: formData.start_date || undefined,
//           end_date: formData.end_date || undefined,
//           purpose: formData.purpose || undefined,
//           notes: formData.notes || undefined
//         })
//       });

//       if (response.ok) {
//         alert('Metadata updated successfully!');
//         setFormData({
//           notes: '',
//           response: '',
//           grant_name: '',
//           contract_number: '',
//           grantor: '',
//           grantee: '',
//           total_amount: '',
//           start_date: '',
//           end_date: '',
//           purpose: ''
//         });
//         setActiveAction(null);
//         if (onActionComplete) onActionComplete();
//       } else {
//         const error = await response.json();
//         alert(`Failed to update metadata: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to update metadata:', error);
//       alert('Failed to update metadata');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRespondToComments = async () => {
//     if (!formData.response.trim()) {
//       alert('Please provide a response');
//       return;
//     }

//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/respond-to-comments`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           response: formData.response,
//           review_comment_id: null
//         })
//       });

//       if (response.ok) {
//         alert('Response submitted successfully!');
//         setFormData({ ...formData, response: '' });
//         setActiveAction(null);
//         if (onActionComplete) onActionComplete();
//       } else {
//         const error = await response.json();
//         alert(`Failed to submit response: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to submit response:', error);
//       alert('Failed to submit response');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddProjectManagerComment = async () => {
//     if (!pmComment.trim()) {
//       alert('Please enter a comment');
//       return;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/program-manager/add-comment`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           contract_id: contract.id,
//           comment: pmComment,
//           comment_type: 'project_manager_note',
//           flagged_risk: false,
//           flagged_issue: false,
//           recommendation: null
//         })
//       });

//       if (response.ok) {
//         alert('Comment added successfully! Program Managers will see this during review.');
//         setPmComment('');
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

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'open':
//         return <AlertCircle size={14} className="project-text-yellow-600" />;
//       case 'resolved':
//         return <CheckCircle size={14} className="project-text-green-600" />;
//       default:
//         return <Clock size={14} className="project-text-gray-600" />;
//     }
//   };

//   // Get contract status display name
//   const getStatusDisplay = (status) => {
//     const statusMap = {
//       'draft': 'Draft',
//       'under_review': 'Under Review',
//       'reviewed': 'Reviewed',
//       'approved': 'Approved',
//       'rejected': 'Rejected',
//       'completed': 'Completed'
//     };
//     return statusMap[status] || status;
//   };

//   // Show action forms based on contract status
//   const shouldShowActionForms = () => {
//     return contract && (contract.status === 'draft' || contract.status === 'rejected');
//   };

//   // Get appropriate action title based on status
//   const getActionTitle = () => {
//     if (contract.status === 'rejected') {
//       return 'Resubmit Contract for Review';
//     }
//     return 'Submit Contract for Review';
//   };

//   // Get appropriate button text based on status
//   const getActionButtonText = () => {
//     if (contract.status === 'rejected') {
//       return 'Resubmit for Review';
//     }
//     return 'Submit for Review';
//   };

//   return (
//     <div className="project-actions-container">
//       <div className="project-actions-header">
//         <h3 className="project-title">
//           <User size={20} />
//           Project Manager Actions
//         </h3>
//         <div className={`project-status-badge ${contract.status}`}>
//           {getStatusDisplay(contract.status)}
//         </div>
//       </div>

//       {/* Action Forms - Always show for draft/rejected contracts */}
//       {shouldShowActionForms() && (
//         <div className="project-action-forms">
//           {/* Submit for Review Form - Always visible for draft/rejected */}
//           {(activeAction === 'submit_review' || !activeAction) && (
//             <div className="project-action-form">
//               <h4 className="project-form-title">{getActionTitle()}</h4>
//               <textarea
//                 value={formData.notes}
//                 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//                 placeholder="Add any notes or comments for the reviewers..."
//                 rows={4}
//                 className="project-textarea"
//               />
//               <div className="project-form-actions">
//                 <button
//                   className="project-btn-secondary"
//                   onClick={() => {
//                     setFormData({ ...formData, notes: '' });
//                     setActiveAction(null);
//                   }}
//                   disabled={loading}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="project-btn-primary"
//                   onClick={handleSubmitForReview}
//                   disabled={!formData.notes.trim() || loading}
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 size={14} className="project-spinning" />
//                       Submitting...
//                     </>
//                   ) : (
//                     <>
//                       <Send size={14} />
//                       {getActionButtonText()}
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Fix Metadata Form */}
//           {activeAction === 'fix_metadata' && (
//             <div className="project-action-form">
//               <h4 className="project-form-title">Fix Contract Metadata</h4>
//               <div className="project-metadata-form">
//                 <div className="project-form-group">
//                   <label>Grant Name</label>
//                   <input
//                     type="text"
//                     value={formData.grant_name}
//                     onChange={(e) => setFormData({ ...formData, grant_name: e.target.value })}
//                     placeholder={contract.grant_name || 'Enter grant name'}
//                     className="project-input"
//                   />
//                 </div>
//                 <div className="project-form-group">
//                   <label>Contract Number</label>
//                   <input
//                     type="text"
//                     value={formData.contract_number}
//                     onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
//                     placeholder={contract.contract_number || 'Enter contract number'}
//                     className="project-input"
//                   />
//                 </div>
//                 <div className="project-form-group">
//                   <label>Grantor</label>
//                   <input
//                     type="text"
//                     value={formData.grantor}
//                     onChange={(e) => setFormData({ ...formData, grantor: e.target.value })}
//                     placeholder={contract.grantor || 'Enter grantor name'}
//                     className="project-input"
//                   />
//                 </div>
//                 <div className="project-form-group">
//                   <label>Grantee</label>
//                   <input
//                     type="text"
//                     value={formData.grantee}
//                     onChange={(e) => setFormData({ ...formData, grantee: e.target.value })}
//                     placeholder={contract.grantee || 'Enter grantee name'}
//                     className="project-input"
//                   />
//                 </div>
//                 <div className="project-form-row">
//                   <div className="project-form-group">
//                     <label>Total Amount ($)</label>
//                     <input
//                       type="number"
//                       value={formData.total_amount}
//                       onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
//                       placeholder={contract.total_amount || 'Enter total amount'}
//                       className="project-input"
//                     />
//                   </div>
//                 </div>
//                 <div className="project-form-row">
//                   <div className="project-form-group">
//                     <label>Start Date</label>
//                     <input
//                       type="date"
//                       value={formData.start_date}
//                       onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
//                       className="project-input"
//                     />
//                   </div>
//                   <div className="project-form-group">
//                     <label>End Date</label>
//                     <input
//                       type="date"
//                       value={formData.end_date}
//                       onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
//                       className="project-input"
//                     />
//                   </div>
//                 </div>
//                 <div className="project-form-group">
//                   <label>Purpose</label>
//                   <textarea
//                     value={formData.purpose}
//                     onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
//                     placeholder={contract.purpose || 'Enter contract purpose'}
//                     rows={3}
//                     className="project-textarea"
//                   />
//                 </div>
//                 <div className="project-form-group">
//                   <label>Notes (Optional)</label>
//                   <textarea
//                     value={formData.notes}
//                     onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//                     placeholder="Add any notes about these changes..."
//                     rows={2}
//                     className="project-textarea"
//                   />
//                 </div>
//               </div>
//               <div className="project-form-actions">
//                 <button
//                   className="project-btn-secondary"
//                   onClick={() => {
//                     setActiveAction('submit_review');
//                     setFormData({ ...formData, notes: '' });
//                   }}
//                   disabled={loading}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="project-btn-primary"
//                   onClick={handleFixMetadata}
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 size={14} className="project-spinning" />
//                       Updating...
//                     </>
//                   ) : (
//                     <>
//                       <Edit size={14} />
//                       Update Metadata
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Respond to Comments Form */}
//           {activeAction === 'respond_comments' && (
//             <div className="project-action-form">
//               <h4 className="project-form-title">Respond to Program Manager Comments</h4>
//               <textarea
//                 value={formData.response}
//                 onChange={(e) => setFormData({ ...formData, response: e.target.value })}
//                 placeholder="Enter your response to the program manager's comments..."
//                 rows={4}
//                 className="project-textarea"
//               />
//               <div className="project-form-actions">
//                 <button
//                   className="project-btn-secondary"
//                   onClick={() => setActiveAction('submit_review')}
//                   disabled={loading}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="project-btn-primary"
//                   onClick={handleRespondToComments}
//                   disabled={!formData.response.trim() || loading}
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 size={14} className="project-spinning" />
//                       Submitting...
//                     </>
//                   ) : (
//                     <>
//                       <MessageSquare size={14} />
//                       Submit Response
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Additional Actions Bar */}
//           <div className="project-additional-actions">
//             {contract.status === 'rejected' && (
//               <button
//                 className="project-action-btn secondary"
//                 onClick={() => setActiveAction('respond_comments')}
//                 disabled={loading || activeAction === 'respond_comments'}
//               >
//                 <MessageSquare size={16} />
//                 Respond to Comments
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Contract Status Info - Show when not in draft/rejected */}
//       {!shouldShowActionForms() && (
//         <div className="project-status-info">
//           <div className="project-status-message">
//             {/* <CheckCircle size={20} className="project-text-green-600" /> */}
//             <div>
//               <p className="project-status-title">Grant Status: <strong>{getStatusDisplay(contract.status)}</strong></p>
//               <p className="project-status-description">
//                 {contract.status === 'under_review' && 'The Grant is currently under review.'}
//                 {contract.status === 'reviewed' && 'The Grant has been reviewed.'}
//                 {contract.status === 'approved' && 'The Grant has been approved.'}
//                 {contract.status === 'completed' && 'The Grant has been completed.'}
//               </p>
//             </div>
//           </div>
          
//           {/* Show comments button for reviewed contracts */}
//           {(contract.status === 'under_review' || contract.status === 'reviewed' || contract.status === 'approved') && (
//             <button
//               className="project-view-comments-btn"
//               onClick={() => {
//                 setShowComments(!showComments);
//                 if (!showComments) {
//                   fetchReviewComments();
//                 }
//               }}
//             >
//               <MessageSquare size={16} />
//               {showComments ? 'Hide' : 'View'} Review Comments
//             </button>
//           )}
//         </div>
//       )}

//       {/* All Comments Display - Show for all statuses when toggled */}
//       {showComments && reviewComments.length > 0 && (
//         <div className="project-all-comments-section">
//           <h4 className="project-comments-title">
//             <MessageSquare size={16} />
//             All Comments ({reviewComments.length})
//           </h4>
//           <div className="project-comments-list">
//             {reviewComments.map((comment, index) => {
//               const isProjectManager = comment.user_role === "project_manager";
//               const isSubmission = comment.comment_type === "project_manager_submission";
              
//               return (
//                 <div key={comment.id || index} className={`project-comment-card ${comment.status} ${isProjectManager ? 'project-manager-comment' : ''}`}>
//                   <div className="project-comment-header">
//                     <div className="project-commenter-info">
//                       <User size={12} />
//                       <span className="project-commenter-name">{comment.user_name}</span>
//                       <span className={`project-commenter-role ${comment.user_role}`}>
//                         {comment.user_role === "project_manager" ? "Project Manager" : 
//                          comment.user_role === "program_manager" ? "Program Manager" : 
//                          comment.user_role === "director" ? "Director" : comment.user_role}
//                       </span>
//                       {isSubmission && (
//                         <span className="project-comment-type-badge submission">
//                           <Send size={10} />
//                           Submission Note
//                         </span>
//                       )}
//                       <span className="project-comment-date">{formatDate(comment.created_at)}</span>
//                     </div>
//                     <div className="project-comment-meta">
//                       <span className="project-comment-status">
//                         {getStatusIcon(comment.status)}
//                         {comment.status}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="project-comment-body">
//                     <div className="project-comment-type">{comment.comment_type}</div>
//                     <p className="project-comment-text">{comment.comment}</p>
//                     {isProjectManager && (
//                       <div className="project-pm-comment-note">
//                         <Info size={12} />
//                         <span>This comment will be visible to Program Managers</span>
//                       </div>
//                     )}
//                     {comment.flagged_risk && (
//                       <div className="project-comment-flag risk">
//                         <AlertCircle size={12} />
//                         Flagged as Risk
//                       </div>
//                     )}
//                     {comment.flagged_issue && (
//                       <div className="project-comment-flag issue">
//                         <AlertCircle size={12} />
//                         Flagged as Issue
//                       </div>
//                     )}
//                     {comment.recommendation && (
//                       <div className={`project-comment-recommendation ${comment.recommendation}`}>
//                         Recommendation: {comment.recommendation}
//                       </div>
//                     )}
//                     {comment.resolution_response && (
//                       <div className="project-comment-resolution">
//                         <strong>Your Response:</strong> {comment.resolution_response}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Empty Comments State */}
//       {showComments && reviewComments.length === 0 && (
//         <div className="project-empty-comments">
//           <MessageSquare size={32} />
//           <p>No comments found</p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ProjectManagerActions;
