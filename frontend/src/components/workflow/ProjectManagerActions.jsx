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
  const navigate = useNavigate();

  useEffect(() => {
    if (contract && (contract.status === 'under_review' || contract.status === 'rejected')) {
      fetchReviewComments();
    }
  }, [contract]);

  const fetchReviewComments = async () => {
    if (!contract?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      // Use the new endpoint that gets ALL comments
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
        // Fallback to old endpoint
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
    }
  };

  const handleSubmitForReview = async () => {
    if (!formData.notes.trim()) {
      alert('Please provide notes for the submission');
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
        alert('Contract submitted for review successfully!');
        setFormData({ ...formData, notes: '' });
        setActiveAction(null);
        if (onActionComplete) onActionComplete();
      } else {
        const error = await response.json();
        alert(`Failed to submit for review: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit for review:', error);
      alert('Failed to submit for review');
    } finally {
      setLoading(false);
    }
  };

  const handleFixMetadata = async () => {
    const updatedFields = Object.keys(formData).filter(key => 
      key !== 'notes' && formData[key] !== ''
    );
    
    if (updatedFields.length === 0) {
      alert('Please update at least one field');
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
        alert('Metadata updated successfully!');
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
        alert(`Failed to update metadata: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
      alert('Failed to update metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToComments = async () => {
    if (!formData.response.trim()) {
      alert('Please provide a response');
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
        alert('Response submitted successfully!');
        setFormData({ ...formData, response: '' });
        setActiveAction(null);
        if (onActionComplete) onActionComplete();
      } else {
        const error = await response.json();
        alert(`Failed to submit response: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW FUNCTION: Add a comment from Project Manager
  const handleAddProjectManagerComment = async () => {
    if (!pmComment.trim()) {
      alert('Please enter a comment');
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
        alert('Comment added successfully! Program Managers will see this during review.');
        setPmComment('');
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
        return <AlertCircle size={14} className="text-yellow-600" />;
      case 'resolved':
        return <CheckCircle size={14} className="text-green-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  return (
    <div className="project-manager-actions">
      <div className="actions-header">
        <h3>
          <User size={20} />
          Project Manager Actions
        </h3>
        <div className={`status-badge ${contract.status}`}>
          {contract.status}
        </div>
      </div>

      {/* ✅ NEW: Add Comment Section for Project Manager */}
      {(contract.status === 'draft' || contract.status === 'rejected') && (
        <div className="pm-add-comment-section">
          <h4>
            <MessageSquare size={18} />
            Add Notes for Program Managers
          </h4>
          <p className="pm-comment-help">
            These notes will be visible to Program Managers when reviewing this contract
          </p>
          <textarea
            value={pmComment}
            onChange={(e) => setPmComment(e.target.value)}
            placeholder="Add notes, clarifications, or important information for Program Managers reviewing this contract..."
            rows={3}
            className="pm-comment-textarea"
          />
          <div className="pm-comment-actions">
            <button
              className="btn-primary"
              onClick={handleAddProjectManagerComment}
              disabled={!pmComment.trim()}
            >
              <Send size={14} />
              Add Note for Program Managers
            </button>
          </div>
        </div>
      )}

      {/* Available Actions Based on Status */}
      {(contract.status === 'draft' || contract.status === 'rejected') && (
        <div className="available-actions">
          <button
            className="action-btn primary"
            onClick={() => setActiveAction('submit_review')}
            disabled={loading}
          >
            <Send size={16} />
            {contract.status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
          </button>

          <button
            className="action-btn secondary"
            onClick={() => setActiveAction('fix_metadata')}
            disabled={loading}
          >
            <Edit size={16} />
            Fix Metadata
          </button>

          {contract.status === 'rejected' && (
            <button
              className="action-btn secondary"
              onClick={() => setActiveAction('respond_comments')}
              disabled={loading}
            >
              <MessageSquare size={16} />
              Respond to Comments
            </button>
          )}

          <button
            className="action-btn secondary"
            onClick={() => {
              setShowComments(!showComments);
              if (!showComments) {
                fetchReviewComments();
              }
            }}
          >
            <RefreshCw size={16} />
            {showComments ? 'Hide' : 'View'} All Comments ({reviewComments.length})
          </button>
        </div>
      )}

      {/* Action Forms */}
      {activeAction === 'submit_review' && (
        <div className="action-form">
          <h4>Submit Contract for Review</h4>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any notes or comments for the reviewers..."
            rows={4}
          />
          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => setActiveAction(null)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmitForReview}
              disabled={!formData.notes.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="spinning" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Submit for Review
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeAction === 'fix_metadata' && (
        <div className="action-form">
          <h4>Fix Contract Metadata</h4>
          <div className="metadata-form">
            <div className="form-group">
              <label>Grant Name</label>
              <input
                type="text"
                value={formData.grant_name}
                onChange={(e) => setFormData({ ...formData, grant_name: e.target.value })}
                placeholder={contract.grant_name || 'Enter grant name'}
              />
            </div>
            <div className="form-group">
              <label>Contract Number</label>
              <input
                type="text"
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                placeholder={contract.contract_number || 'Enter contract number'}
              />
            </div>
            <div className="form-group">
              <label>Grantor</label>
              <input
                type="text"
                value={formData.grantor}
                onChange={(e) => setFormData({ ...formData, grantor: e.target.value })}
                placeholder={contract.grantor || 'Enter grantor name'}
              />
            </div>
            <div className="form-group">
              <label>Grantee</label>
              <input
                type="text"
                value={formData.grantee}
                onChange={(e) => setFormData({ ...formData, grantee: e.target.value })}
                placeholder={contract.grantee || 'Enter grantee name'}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Total Amount ($)</label>
                <input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  placeholder={contract.total_amount || 'Enter total amount'}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder={contract.purpose || 'Enter contract purpose'}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about these changes..."
                rows={2}
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => setActiveAction(null)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleFixMetadata}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="spinning" />
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

      {activeAction === 'respond_comments' && (
        <div className="action-form">
          <h4>Respond to Program Manager Comments</h4>
          <textarea
            value={formData.response}
            onChange={(e) => setFormData({ ...formData, response: e.target.value })}
            placeholder="Enter your response to the program manager's comments..."
            rows={4}
          />
          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => setActiveAction(null)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleRespondToComments}
              disabled={!formData.response.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="spinning" />
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

      {/* All Comments Display */}
      {showComments && reviewComments.length > 0 && (
        <div className="all-comments-section">
          <h4>
            <MessageSquare size={16} />
            All Comments ({reviewComments.length})
          </h4>
          <div className="comments-list">
            {reviewComments.map((comment, index) => {
              const isProjectManager = comment.user_role === "project_manager";
              const isSubmission = comment.comment_type === "project_manager_submission";
              
              return (
                <div key={comment.id || index} className={`comment-card ${comment.status} ${isProjectManager ? 'project-manager-comment' : ''}`}>
                  <div className="comment-header">
                    <div className="commenter-info">
                      <User size={12} />
                      <span className="commenter-name">{comment.user_name}</span>
                      <span className={`commenter-role ${comment.user_role}`}>
                        {comment.user_role === "project_manager" ? "Project Manager" : 
                         comment.user_role === "program_manager" ? "Program Manager" : 
                         comment.user_role === "director" ? "Director" : comment.user_role}
                      </span>
                      {isSubmission && (
                        <span className="comment-type-badge submission">
                          <Send size={10} />
                          Submission Note
                        </span>
                      )}
                      <span className="comment-date">{formatDate(comment.created_at)}</span>
                    </div>
                    <div className="comment-meta">
                      <span className="comment-status">
                        {getStatusIcon(comment.status)}
                        {comment.status}
                      </span>
                    </div>
                  </div>
                  <div className="comment-body">
                    <div className="comment-type">{comment.comment_type}</div>
                    <p className="comment-text">{comment.comment}</p>
                    {isProjectManager && (
                      <div className="pm-comment-note">
                        <Info size={12} />
                        <span>This comment will be visible to Program Managers</span>
                      </div>
                    )}
                    {comment.flagged_risk && (
                      <div className="comment-flag risk">
                        <AlertCircle size={12} />
                        Flagged as Risk
                      </div>
                    )}
                    {comment.flagged_issue && (
                      <div className="comment-flag issue">
                        <AlertCircle size={12} />
                        Flagged as Issue
                      </div>
                    )}
                    {comment.recommendation && (
                      <div className={`comment-recommendation ${comment.recommendation}`}>
                        Recommendation: {comment.recommendation}
                      </div>
                    )}
                    {comment.resolution_response && (
                      <div className="comment-resolution">
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

      {/* Contract Info Summary */}
      <div className="contract-info-summary">
        <h4>Contract Summary</h4>
        <div className="info-grid">
          <div className="info-item">
            <Building size={14} />
            <span className="info-label">Grantor:</span>
            <span className="info-value">{contract.grantor || 'Not specified'}</span>
          </div>
          <div className="info-item">
            <User size={14} />
            <span className="info-label">Grantee:</span>
            <span className="info-value">{contract.grantee || 'Not specified'}</span>
          </div>
          <div className="info-item">
            <DollarSign size={14} />
            <span className="info-label">Total Amount:</span>
            <span className="info-value">
              {contract.total_amount ? 
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(contract.total_amount) : 'Not specified'}
            </span>
          </div>
          <div className="info-item">
            <Calendar size={14} />
            <span className="info-label">Status:</span>
            <span className={`info-value status-${contract.status}`}>
              {contract.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectManagerActions;



// // ProjectManagerActions.jsx - Fixed version
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
//   Save,
//   X
// } from 'lucide-react';
// import API_CONFIG from '../../config';
// function ProjectManagerActions({ contract, user, onActionComplete }) {
//   const [loading, setLoading] = useState(false);
//   const [activeAction, setActiveAction] = useState(null);
//   const [pmComment, setPmComment] = useState(''); // For Project Manager comments
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
//   const [reviewComments, setReviewComments] = useState([]);
//   const [showComments, setShowComments] = useState(false);
//   const [submittingComment, setSubmittingComment] = useState(false);

//   // Fetch review comments function - Updated to use review-comments endpoint
//   const fetchReviewComments = async () => {
//     if (!contract?.id) return;
    
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/review-comments`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setReviewComments(data.comments || []);
//         console.log('Fetched review comments:', data.comments);
//       } else {
//         console.error('Failed to fetch review comments');
//       }
//     } catch (error) {
//       console.error('Failed to fetch review comments:', error);
//     }
//   };

//   useEffect(() => {
//     if (contract && (contract.status === 'under_review' || contract.status === 'rejected' || contract.status === 'draft')) {
//       fetchReviewComments();
//     }
//   }, [contract]);

//   // Function for Project Manager to add comments that Program Managers can see
//   const handleAddProjectManagerComment = async (commentText, commentType = 'general') => {
//     if (!commentText.trim()) {
//       alert('Please enter a comment');
//       return;
//     }

//     if (!contract?.id) {
//       alert('Contract not found');
//       return;
//     }

//     setSubmittingComment(true);
//     try {
//       const token = localStorage.getItem('token');
      
//       // Use the program-manager/add-comment endpoint to ensure comments go to review_comments table
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/program-manager/add-comment`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           contract_id: contract.id,
//           comment: commentText,
//           comment_type: commentType,
//           flagged_risk: false,
//           flagged_issue: false,
//           recommendation: null
//         })
//       });

//       if (response.ok) {
//         const result = await response.json();
//         alert('Comment added successfully! Program Managers will see this comment when reviewing the contract.');
//         setPmComment('');
//         // Refresh comments
//         fetchReviewComments();
//       } else {
//         const error = await response.json();
//         alert(`Failed to add comment: ${error.detail || 'Unknown error'}`);
//       }
//     } catch (error) {
//       console.error('Failed to add comment:', error);
//       alert('Failed to add comment. Please try again.');
//     } finally {
//       setSubmittingComment(false);
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
//     // Validate at least one field is updated
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

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const formatDateTime = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'open':
//         return <AlertCircle size={14} className="text-yellow-600" />;
//       case 'resolved':
//         return <CheckCircle size={14} className="text-green-600" />;
//       default:
//         return <Clock size={14} className="text-gray-600" />;
//     }
//   };

//   const getUserRoleColor = (role) => {
//     switch (role) {
//       case 'project_manager':
//         return 'bg-blue-100 text-blue-800 border-blue-200';
//       case 'program_manager':
//         return 'bg-purple-100 text-purple-800 border-purple-200';
//       case 'director':
//         return 'bg-green-100 text-green-800 border-green-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   const getReviewStatusInfo = () => {
//     const review = contract.comprehensive_data?.program_manager_review;
    
//     if (!review) return null;
    
//     return {
//       recommendation: review.overall_recommendation,
//       summary: review.review_summary,
//       reviewer: review.reviewed_by_name,
//       reviewedAt: review.reviewed_at,
//       keyIssues: review.key_issues || [],
//       changeRequests: review.change_requests || [],
//       riskAssessment: review.risk_assessment || {}
//     };
//   };

//   const reviewInfo = getReviewStatusInfo();

//   return (
//     <div className="project-manager-actions">
//       <div className="actions-header">
//         <h3>
//           <User size={20} />
//           Project Manager Actions
//         </h3>
//         <div className={`status-badge ${contract.status}`}>
//           {contract.status}
//         </div>
//       </div>

//       {/* Project Manager Comment Form - Always show for draft contracts */}
//       {contract.status === 'draft' && (
//         <div className="pm-comment-form-section">
//           <div className="section-header">
//             <h4>
//               <MessageSquare size={16} />
//               Add Comments for Program Managers
//             </h4>
//             <p className="section-subtitle">
//               These comments will be visible to Program Managers when they review this contract
//             </p>
//           </div>
          
//           <div className="comment-input-area">
//             <textarea
//               value={pmComment}
//               onChange={(e) => setPmComment(e.target.value)}
//               placeholder="Add notes, clarifications, or important information for Program Managers reviewing this contract..."
//               rows={3}
//               className="comment-textarea"
//             />
//             <div className="comment-actions">
//               <button
//                 className="btn-secondary"
//                 onClick={() => setPmComment('')}
//                 disabled={!pmComment.trim() || submittingComment}
//               >
//                 Clear
//               </button>
//               <button
//                 className="btn-primary"
//                 onClick={() => handleAddProjectManagerComment(pmComment)}
//                 disabled={!pmComment.trim() || submittingComment}
//               >
//                 {submittingComment ? (
//                   <>
//                     <Loader2 size={14} className="spinning" />
//                     Adding...
//                   </>
//                 ) : (
//                   <>
//                     <Send size={14} />
//                     Add Comment for Program Managers
//                   </>
//                 )}
//               </button>
//             </div>
//             <div className="comment-help">
//               <AlertCircle size={12} />
//               <span>These comments will appear in the Program Manager's review interface</span>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Show Program Manager Review Summary if contract is reviewed or rejected */}
//       {(contract.status === 'reviewed' || contract.status === 'rejected') && 
//        contract.comprehensive_data?.program_manager_review && (
//         <div className="program-manager-review-summary">
//           <div className="review-summary-header">
//             <h4>
//               <Shield size={18} />
//               Program Manager Review Summary
//             </h4>
//             <div className={`review-recommendation ${contract.comprehensive_data.program_manager_review.overall_recommendation}`}>
//               {contract.comprehensive_data.program_manager_review.overall_recommendation === 'approve' && (
//                 <>
//                   <CheckCircle size={16} />
//                   <span>Recommended for Approval</span>
//                 </>
//               )}
//               {contract.comprehensive_data.program_manager_review.overall_recommendation === 'reject' && (
//                 <>
//                   <XCircle size={16} />
//                   <span>Recommended for Rejection</span>
//                 </>
//               )}
//               {contract.comprehensive_data.program_manager_review.overall_recommendation === 'modify' && (
//                 <>
//                   <Edit size={16} />
//                   <span>Modifications Requested</span>
//                 </>
//               )}
//             </div>
//           </div>

//           {/* Review Details */}
//           <div className="review-details">
//             {contract.comprehensive_data.program_manager_review.review_summary && (
//               <div className="review-section">
//                 <h5>
//                   <FileText size={16} />
//                   Review Summary
//                 </h5>
//                 <p className="review-text">
//                   {contract.comprehensive_data.program_manager_review.review_summary}
//                 </p>
//                 <div className="review-meta">
//                   <span className="meta-item">
//                     <User size={12} />
//                     Reviewed by: {contract.comprehensive_data.program_manager_review.reviewed_by_name}
//                   </span>
//                   <span className="meta-item">
//                     <Calendar size={12} />
//                     Reviewed on: {formatDate(contract.comprehensive_data.program_manager_review.reviewed_at)}
//                   </span>
//                 </div>
//               </div>
//             )}

//             {/* Key Issues */}
//             {contract.comprehensive_data.program_manager_review.key_issues && 
//              contract.comprehensive_data.program_manager_review.key_issues.length > 0 && (
//               <div className="review-section">
//                 <h5>
//                   <AlertTriangle size={16} />
//                   Key Issues Identified ({contract.comprehensive_data.program_manager_review.key_issues.length})
//                 </h5>
//                 <ul className="issues-list">
//                   {contract.comprehensive_data.program_manager_review.key_issues.map((issue, index) => (
//                     <li key={index} className="issue-item">
//                       <AlertCircle size={14} />
//                       <span>{issue}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Change Requests */}
//             {contract.comprehensive_data.program_manager_review.change_requests && 
//              contract.comprehensive_data.program_manager_review.change_requests.length > 0 && (
//               <div className="review-section">
//                 <h5>
//                   <ListChecks size={16} />
//                   Change Requests ({contract.comprehensive_data.program_manager_review.change_requests.length})
//                 </h5>
//                 <ul className="change-requests-list">
//                   {contract.comprehensive_data.program_manager_review.change_requests.map((request, index) => (
//                     <li key={index} className="change-request-item">
//                       <ClipboardCheck size={14} />
//                       <span>{request}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Risk Assessment */}
//             {contract.comprehensive_data.program_manager_review.risk_assessment && 
//              Object.keys(contract.comprehensive_data.program_manager_review.risk_assessment).length > 0 && (
//               <div className="review-section">
//                 <h5>
//                   <Shield size={16} />
//                   Risk Assessment
//                 </h5>
//                 <div className="risk-assessment">
//                   {Object.entries(contract.comprehensive_data.program_manager_review.risk_assessment).map(([key, value]) => (
//                     <div key={key} className="risk-item">
//                       <span className="risk-label">{key}:</span>
//                       <span className="risk-value">{value}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Next Steps */}
//           <div className="next-steps">
//             <h5>
//               <Award size={16} />
//               Next Steps
//             </h5>
//             <div className="steps-list">
//               {contract.status === 'reviewed' && (
//                 <div className="step-item approved">
//                   <CheckCircle size={14} />
//                   <span>Contract has been reviewed and recommended for approval</span>
//                   <span className="step-action">Awaiting Director's final approval</span>
//                 </div>
//               )}
//               {contract.status === 'rejected' && (
//                 <div className="step-item rejected">
//                   <AlertCircle size={14} />
//                   <span>Contract requires modifications before resubmission</span>
//                   <span className="step-action">Please address the issues and resubmit</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Available Actions Based on Status */}
//       {(contract.status === 'draft' || contract.status === 'rejected') && (
//         <div className="available-actions">
//           <button
//             className="action-btn primary"
//             onClick={() => setActiveAction('submit_review')}
//             disabled={loading}
//           >
//             <Send size={16} />
//             {contract.status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
//           </button>

//           <button
//             className="action-btn secondary"
//             onClick={() => setActiveAction('fix_metadata')}
//             disabled={loading}
//           >
//             <Edit size={16} />
//             Fix Metadata
//           </button>

//           {contract.status === 'rejected' && (
//             <button
//               className="action-btn secondary"
//               onClick={() => setActiveAction('respond_comments')}
//               disabled={loading}
//             >
//               <MessageSquare size={16} />
//               Respond to Comments
//             </button>
//           )}

//           <button
//             className="action-btn secondary"
//             onClick={() => {
//               setShowComments(!showComments);
//               if (!showComments) {
//                 fetchReviewComments();
//               }
//             }}
//           >
//             <RefreshCw size={16} />
//             {showComments ? 'Hide' : 'View'} All Comments ({reviewComments.length})
//           </button>
//         </div>
//       )}

//       {/* For contracts under review */}
//       {contract.status === 'under_review' && (
//         <div className="contract-status-info">
//           <div className="status-message">
//             <Clock size={20} />
//             <div>
//               <h4>Contract Under Review</h4>
//               <p>This contract is currently being reviewed by Program Managers.</p>
//               <button
//                 className="btn-secondary"
//                 onClick={() => {
//                   setShowComments(!showComments);
//                   if (!showComments) {
//                     fetchReviewComments();
//                   }
//                 }}
//               >
//                 <MessageSquare size={14} />
//                 {showComments ? 'Hide' : 'View'} Comments ({reviewComments.length})
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* For approved contracts */}
//       {contract.status === 'approved' && (
//         <div className="contract-status-info">
//           <div className="status-message approved">
//             <CheckCircle size={20} />
//             <div>
//               <h4>Contract Approved</h4>
//               <p>This contract has been fully approved and is now active.</p>
//               <button
//                 className="btn-secondary"
//                 onClick={() => {
//                   setShowComments(!showComments);
//                   if (!showComments) {
//                     fetchReviewComments();
//                   }
//                 }}
//               >
//                 <FileCheck size={14} />
//                 {showComments ? 'Hide' : 'View'} Review History ({reviewComments.length})
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Action Forms */}
//       {activeAction === 'submit_review' && (
//         <div className="action-form">
//           <div className="form-header">
//             <h4>Submit Contract for Review</h4>
//             <button className="btn-close" onClick={() => setActiveAction(null)}>
//               <X size={18} />
//             </button>
//           </div>
//           <div className="form-group">
//             <label>Submission Notes (Optional)</label>
//             <textarea
//               value={formData.notes}
//               onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//               placeholder="Add any notes or comments for the reviewers..."
//               rows={4}
//               className="form-textarea"
//             />
//           </div>
//           <div className="form-actions">
//             <button
//               className="btn-secondary"
//               onClick={() => setActiveAction(null)}
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               className="btn-primary"
//               onClick={handleSubmitForReview}
//               disabled={!formData.notes.trim() || loading}
//             >
//               {loading ? (
//                 <>
//                   <Loader2 size={14} className="spinning" />
//                   Submitting...
//                 </>
//               ) : (
//                 <>
//                   <Send size={14} />
//                   Submit for Review
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       )}

//       {activeAction === 'fix_metadata' && (
//         <div className="action-form">
//           <div className="form-header">
//             <h4>Fix Contract Metadata</h4>
//             <button className="btn-close" onClick={() => setActiveAction(null)}>
//               <X size={18} />
//             </button>
//           </div>
//           <div className="metadata-form">
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Grant Name</label>
//                 <input
//                   type="text"
//                   value={formData.grant_name}
//                   onChange={(e) => setFormData({ ...formData, grant_name: e.target.value })}
//                   placeholder={contract.grant_name || 'Enter grant name'}
//                   className="form-input"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Contract Number</label>
//                 <input
//                   type="text"
//                   value={formData.contract_number}
//                   onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
//                   placeholder={contract.contract_number || 'Enter contract number'}
//                   className="form-input"
//                 />
//               </div>
//             </div>
            
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Grantor</label>
//                 <input
//                   type="text"
//                   value={formData.grantor}
//                   onChange={(e) => setFormData({ ...formData, grantor: e.target.value })}
//                   placeholder={contract.grantor || 'Enter grantor name'}
//                   className="form-input"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Grantee</label>
//                 <input
//                   type="text"
//                   value={formData.grantee}
//                   onChange={(e) => setFormData({ ...formData, grantee: e.target.value })}
//                   placeholder={contract.grantee || 'Enter grantee name'}
//                   className="form-input"
//                 />
//               </div>
//             </div>
            
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Total Amount ($)</label>
//                 <input
//                   type="number"
//                   value={formData.total_amount}
//                   onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
//                   placeholder={contract.total_amount || 'Enter total amount'}
//                   className="form-input"
//                 />
//               </div>
//             </div>
            
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Start Date</label>
//                 <input
//                   type="date"
//                   value={formData.start_date}
//                   onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
//                   className="form-input"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>End Date</label>
//                 <input
//                   type="date"
//                   value={formData.end_date}
//                   onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
//                   className="form-input"
//                 />
//               </div>
//             </div>
            
//             <div className="form-group">
//               <label>Purpose</label>
//               <textarea
//                 value={formData.purpose}
//                 onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
//                 placeholder={contract.purpose || 'Enter contract purpose'}
//                 rows={3}
//                 className="form-textarea"
//               />
//             </div>
            
//             <div className="form-group">
//               <label>Notes (Optional)</label>
//               <textarea
//                 value={formData.notes}
//                 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//                 placeholder="Add any notes about these changes..."
//                 rows={2}
//                 className="form-textarea"
//               />
//             </div>
//           </div>
//           <div className="form-actions">
//             <button
//               className="btn-secondary"
//               onClick={() => setActiveAction(null)}
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               className="btn-primary"
//               onClick={handleFixMetadata}
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <Loader2 size={14} className="spinning" />
//                   Updating...
//                 </>
//               ) : (
//                 <>
//                   <Save size={14} />
//                   Update Metadata
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       )}

//       {activeAction === 'respond_comments' && (
//         <div className="action-form">
//           <div className="form-header">
//             <h4>Respond to Program Manager Comments</h4>
//             <button className="btn-close" onClick={() => setActiveAction(null)}>
//               <X size={18} />
//             </button>
//           </div>
//           <div className="form-group">
//             <label>Your Response</label>
//             <textarea
//               value={formData.response}
//               onChange={(e) => setFormData({ ...formData, response: e.target.value })}
//               placeholder="Enter your response to the program manager's comments..."
//               rows={4}
//               className="form-textarea"
//             />
//           </div>
//           <div className="form-actions">
//             <button
//               className="btn-secondary"
//               onClick={() => setActiveAction(null)}
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               className="btn-primary"
//               onClick={handleRespondToComments}
//               disabled={!formData.response.trim() || loading}
//             >
//               {loading ? (
//                 <>
//                   <Loader2 size={14} className="spinning" />
//                   Submitting...
//                 </>
//               ) : (
//                 <>
//                   <Send size={14} />
//                   Submit Response
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* All Comments Display */}
//       {showComments && (
//         <div className="all-comments-section">
//           <div className="section-header">
//             <h4>
//               <MessageSquare size={16} />
//               All Comments ({reviewComments.length})
//             </h4>
//             <button className="btn-refresh" onClick={fetchReviewComments}>
//               <RefreshCw size={14} />
//               Refresh
//             </button>
//           </div>
          
//           {reviewComments.length === 0 ? (
//             <div className="no-comments">
//               <MessageSquare size={32} />
//               <p>No comments yet</p>
//             </div>
//           ) : (
//             <div className="comments-list">
//               {reviewComments.map((comment) => (
//                 <div key={comment.id} className={`comment-card ${comment.status}`}>
//                   <div className="comment-header">
//                     <div className="commenter-info">
//                       <div className={`user-avatar ${getUserRoleColor(comment.user_role)}`}>
//                         <User size={12} />
//                       </div>
//                       <div className="commenter-details">
//                         <span className="commenter-name">{comment.user_name}</span>
//                         <span className={`commenter-role ${comment.user_role}`}>
//                           {comment.user_role.replace('_', ' ').toUpperCase()}
//                         </span>
//                         <span className="comment-date">
//                           {formatDateTime(comment.created_at)}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="comment-status">
//                       {getStatusIcon(comment.status)}
//                       <span className="status-text">{comment.status}</span>
//                     </div>
//                   </div>
                  
//                   <div className="comment-body">
//                     <div className="comment-type">
//                       <span className="type-badge">{comment.comment_type}</span>
//                     </div>
//                     <p className="comment-text">{comment.comment}</p>
                    
//                     <div className="comment-flags">
//                       {comment.flagged_risk && (
//                         <span className="flag-badge risk">
//                           <AlertCircle size={10} />
//                           Risk
//                         </span>
//                       )}
//                       {comment.flagged_issue && (
//                         <span className="flag-badge issue">
//                           <AlertTriangle size={10} />
//                           Issue
//                         </span>
//                       )}
//                       {comment.recommendation && (
//                         <span className={`recommendation-badge ${comment.recommendation}`}>
//                           {comment.recommendation}
//                         </span>
//                       )}
//                     </div>
//                   </div>
                  
//                   {comment.resolution_response && (
//                     <div className="comment-resolution">
//                       <div className="resolution-header">
//                         <CheckCircle size={12} />
//                         <strong>Resolution:</strong>
//                       </div>
//                       <p className="resolution-text">{comment.resolution_response}</p>
//                       {comment.resolved_at && (
//                         <div className="resolution-meta">
//                           <span className="meta-item">
//                             Resolved on: {formatDate(comment.resolved_at)}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Contract Info Summary */}
//       <div className="contract-info-summary">
//         <h4>Contract Summary</h4>
//         <div className="info-grid">
//           <div className="info-item">
//             <Building size={14} />
//             <span className="info-label">Grantor:</span>
//             <span className="info-value">{contract.grantor || 'Not specified'}</span>
//           </div>
//           <div className="info-item">
//             <User size={14} />
//             <span className="info-label">Grantee:</span>
//             <span className="info-value">{contract.grantee || 'Not specified'}</span>
//           </div>
//           <div className="info-item">
//             <DollarSign size={14} />
//             <span className="info-label">Total Amount:</span>
//             <span className="info-value">
//               {contract.total_amount ? 
//                 new Intl.NumberFormat('en-US', {
//                   style: 'currency',
//                   currency: 'USD'
//                 }).format(contract.total_amount) : 'Not specified'}
//             </span>
//           </div>
//           <div className="info-item">
//             <Calendar size={14} />
//             <span className="info-label">Status:</span>
//             <span className={`info-value status-${contract.status}`}>
//               {contract.status}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ProjectManagerActions;