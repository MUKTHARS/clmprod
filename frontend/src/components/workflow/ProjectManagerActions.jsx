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
  XCircle
} from 'lucide-react';
import API_CONFIG from '../../config';

function ProjectManagerActions({ contract, user, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
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
  const [reviewComments, setReviewComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  // Fetch review comments function
  const fetchReviewComments = async () => {
    if (!contract?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // First try to get the program manager review summary
      const reviewSummaryResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/review-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (reviewSummaryResponse.ok) {
        const reviewData = await reviewSummaryResponse.json();
        
        // If we have review comments, use them
        if (reviewData.comments && reviewData.comments.length > 0) {
          setReviewComments(reviewData.comments);
        }
        
        // Also store the review summary for display
        if (reviewData.review_summary) {
          console.log('Review summary available:', reviewData.review_summary);
        }
      } else {
        // Fallback to just comments if review-summary fails
        const commentsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/review-comments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setReviewComments(commentsData.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch review comments:', error);
    }
  };

  useEffect(() => {
    if (contract && (contract.status === 'under_review' || contract.status === 'rejected')) {
      fetchReviewComments();
    }
  }, [contract]);

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
    // Validate at least one field is updated
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

  const getReviewStatusInfo = () => {
    const review = contract.comprehensive_data?.program_manager_review;
    
    if (!review) return null;
    
    return {
      recommendation: review.overall_recommendation,
      summary: review.review_summary,
      reviewer: review.reviewed_by_name,
      reviewedAt: review.reviewed_at,
      keyIssues: review.key_issues || [],
      changeRequests: review.change_requests || [],
      riskAssessment: review.risk_assessment || {}
    };
  };

  const reviewInfo = getReviewStatusInfo();

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

      {/* Show Program Manager Review Summary if contract is reviewed or rejected */}
      {(contract.status === 'reviewed' || contract.status === 'rejected') && 
       contract.comprehensive_data?.program_manager_review && (
        <div className="program-manager-review-summary">
          <div className="review-summary-header">
            <h4>
              <Shield size={18} />
              Program Manager Review Summary
            </h4>
            <div className={`review-recommendation ${contract.comprehensive_data.program_manager_review.overall_recommendation}`}>
              {contract.comprehensive_data.program_manager_review.overall_recommendation === 'approve' && (
                <>
                  <CheckCircle size={16} />
                  <span>Recommended for Approval</span>
                </>
              )}
              {contract.comprehensive_data.program_manager_review.overall_recommendation === 'reject' && (
                <>
                  <XCircle size={16} />
                  <span>Recommended for Rejection</span>
                </>
              )}
              {contract.comprehensive_data.program_manager_review.overall_recommendation === 'modify' && (
                <>
                  <Edit size={16} />
                  <span>Modifications Requested</span>
                </>
              )}
            </div>
          </div>

          {/* Review Details */}
          <div className="review-details">
            {contract.comprehensive_data.program_manager_review.review_summary && (
              <div className="review-section">
                <h5>
                  <FileText size={16} />
                  Review Summary
                </h5>
                <p className="review-text">
                  {contract.comprehensive_data.program_manager_review.review_summary}
                </p>
                <div className="review-meta">
                  <span className="meta-item">
                    <User size={12} />
                    Reviewed by: {contract.comprehensive_data.program_manager_review.reviewed_by_name}
                  </span>
                  <span className="meta-item">
                    <Calendar size={12} />
                    Reviewed on: {formatDate(contract.comprehensive_data.program_manager_review.reviewed_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Key Issues */}
            {contract.comprehensive_data.program_manager_review.key_issues && 
             contract.comprehensive_data.program_manager_review.key_issues.length > 0 && (
              <div className="review-section">
                <h5>
                  <AlertTriangle size={16} />
                  Key Issues Identified ({contract.comprehensive_data.program_manager_review.key_issues.length})
                </h5>
                <ul className="issues-list">
                  {contract.comprehensive_data.program_manager_review.key_issues.map((issue, index) => (
                    <li key={index} className="issue-item">
                      <AlertCircle size={14} />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Change Requests */}
            {contract.comprehensive_data.program_manager_review.change_requests && 
             contract.comprehensive_data.program_manager_review.change_requests.length > 0 && (
              <div className="review-section">
                <h5>
                  <ListChecks size={16} />
                  Change Requests ({contract.comprehensive_data.program_manager_review.change_requests.length})
                </h5>
                <ul className="change-requests-list">
                  {contract.comprehensive_data.program_manager_review.change_requests.map((request, index) => (
                    <li key={index} className="change-request-item">
                      <ClipboardCheck size={14} />
                      <span>{request}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Assessment */}
            {contract.comprehensive_data.program_manager_review.risk_assessment && 
             Object.keys(contract.comprehensive_data.program_manager_review.risk_assessment).length > 0 && (
              <div className="review-section">
                <h5>
                  <Shield size={16} />
                  Risk Assessment
                </h5>
                <div className="risk-assessment">
                  {Object.entries(contract.comprehensive_data.program_manager_review.risk_assessment).map(([key, value]) => (
                    <div key={key} className="risk-item">
                      <span className="risk-label">{key}:</span>
                      <span className="risk-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="next-steps">
            <h5>
              <Award size={16} />
              Next Steps
            </h5>
            <div className="steps-list">
              {contract.status === 'reviewed' && (
                <div className="step-item approved">
                  <CheckCircle size={14} />
                  <span>Contract has been reviewed and recommended for approval</span>
                  <span className="step-action">Awaiting Director's final approval</span>
                </div>
              )}
              {contract.status === 'rejected' && (
                <div className="step-item rejected">
                  <AlertCircle size={14} />
                  <span>Contract requires modifications before resubmission</span>
                  <span className="step-action">Please address the issues and resubmit</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Actions Based on Status - Only show for draft or rejected contracts */}
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
            {showComments ? 'Hide' : 'View'} Program Manager Comments
          </button>
        </div>
      )}

      {/* For contracts under review */}
      {contract.status === 'under_review' && (
        <div className="contract-status-info">
          <div className="status-message">
            <Clock size={20} />
            <div>
              <h4>Contract Under Review</h4>
              <p>This contract is currently being reviewed by Program Managers.</p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments) {
                    fetchReviewComments();
                  }
                }}
              >
                <MessageSquare size={14} />
                View Review Comments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* For approved contracts */}
      {contract.status === 'approved' && (
        <div className="contract-status-info">
          <div className="status-message approved">
            <CheckCircle size={20} />
            <div>
              <h4>Contract Approved</h4>
              <p>This contract has been fully approved and is now active.</p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments) {
                    fetchReviewComments();
                  }
                }}
              >
                <FileCheck size={14} />
                View Review History
              </button>
            </div>
          </div>
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

      {/* Program Manager Comments Display */}
      {showComments && reviewComments.length > 0 && (
        <div className="program-manager-comments">
          <h4>
            <MessageSquare size={16} />
            Program Manager Comments ({reviewComments.length})
          </h4>
          <div className="comments-list">
            {reviewComments.map((comment) => (
              <div key={comment.id} className={`comment-card ${comment.status}`}>
                <div className="comment-header">
                  <div className="commenter-info">
                    <User size={12} />
                    <span className="commenter-name">{comment.user_name}</span>
                    <span className="commenter-role">{comment.user_role}</span>
                  </div>
                  <div className="comment-meta">
                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                    <span className="comment-status">
                      {getStatusIcon(comment.status)}
                      {comment.status}
                    </span>
                  </div>
                </div>
                <div className="comment-body">
                  <div className="comment-type">{comment.comment_type}</div>
                  <p className="comment-text">{comment.comment}</p>
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
            ))}
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
// // src/components/workflow/ProjectManagerActions.jsx
// import React, { useState, useEffect } from 'react';
// import {
//   Send,
//   Edit,
//   MessageSquare,
//   History,
//   CheckCircle,
//   AlertCircle,
//   FileCheck,
//   RefreshCw,
//   ChevronRight,
//   ChevronDown,
//   X,
//   Clock,
//   FileText,
//   User,
//   Calendar,
//   DollarSign,
//   Building,
//   Target,
//   Save,
//   Eye,
//   Loader2,
//   Download
// } from 'lucide-react';
// import API_CONFIG from '../../config';
// import './Workflow.css';

// function ProjectManagerActions({ contract, onActionComplete, user }) {
//   const [showFixMetadata, setShowFixMetadata] = useState(false);
//   const [showRespondForm, setShowRespondForm] = useState(false);
//   const [showVersions, setShowVersions] = useState(false);
//   const [metadata, setMetadata] = useState({});
//   const [response, setResponse] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [versions, setVersions] = useState([]);
//   const [loadingVersions, setLoadingVersions] = useState(false);
//   const [reviewComments, setReviewComments] = useState([]);

//   // Check permissions based on contract status
//   const canSubmitForReview = contract.status === 'draft' || contract.status === 'rejected';
//   const canFixMetadata = contract.status === 'draft' || contract.status === 'rejected';
//   const canRespondToComments = contract.status === 'under_review' || contract.status === 'rejected';
//   const canResubmit = contract.status === 'rejected';

//   // Fetch review comments from comprehensive data
//   useEffect(() => {
//     if (contract.comprehensive_data) {
//       const comments = contract.comprehensive_data.comments || [];
//       const reviewComments = comments.filter(c => 
//         c.type === 'review' || c.role === 'program_manager'
//       );
//       setReviewComments(reviewComments);
//     }
//   }, [contract]);

//   const fetchVersions = async () => {
//     setLoadingVersions(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/versions`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setVersions(data.versions || []);
//       } else {
//         console.error('Failed to fetch versions');
//       }
//     } catch (error) {
//       console.error('Failed to fetch versions:', error);
//     } finally {
//       setLoadingVersions(false);
//     }
//   };

//   const handleSubmitForReview = async (notes = '') => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/submit-review`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ notes })
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         alert(`Contract submitted for review! Version: ${data.version_number}`);
//         if (onActionComplete) onActionComplete();
//       } else {
//         const error = await response.json();
//         alert(`Failed to submit: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to submit for review:', error);
//       alert('Failed to submit for review');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFixMetadata = async () => {
//     // Validate required fields
//     if (!metadata.grant_name?.trim()) {
//       alert('Contract name is required');
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
//         body: JSON.stringify(metadata)
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         alert(`Metadata updated successfully! Version: ${data.version_number}`);
//         setShowFixMetadata(false);
//         if (onActionComplete) onActionComplete();
//       } else {
//         const error = await response.json();
//         alert(`Failed to update metadata: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to fix metadata:', error);
//       alert('Failed to update metadata');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRespondToComments = async () => {
//     if (!response.trim()) {
//       alert('Please enter a response');
//       return;
//     }

//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const responseData = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/respond-to-comments`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ 
//           response: response,
//           review_comment_id: reviewComments.length > 0 ? reviewComments[0].id : null
//         })
//       });
      
//       if (responseData.ok) {
//         const data = await responseData.json();
//         alert(`Response submitted successfully! Version: ${data.version_number}`);
//         setShowRespondForm(false);
//         setResponse('');
//         if (onActionComplete) onActionComplete();
//       } else {
//         const error = await responseData.json();
//         alert(`Failed to submit response: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to respond to comments:', error);
//       alert('Failed to submit response');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewVersions = async () => {
//     if (!showVersions) {
//       await fetchVersions();
//     }
//     setShowVersions(!showVersions);
//   };
// {(contract.status === 'rejected' || contract.status === 'under_review') && (
//   <div className="review-feedback-section">
//     <h3>
//       <MessageSquare size={20} />
//       Program Manager Review
//     </h3>
    
//     {contract.comprehensive_data?.program_manager_review && (
//       <div className="review-summary-card">
//         <div className="summary-header">
//           <h4>Review Summary</h4>
//           <span className={`recommendation-badge ${contract.comprehensive_data.program_manager_review.overall_recommendation}`}>
//             {contract.comprehensive_data.program_manager_review.overall_recommendation}
//           </span>
//         </div>
//         <div className="summary-content">
//           <p>{contract.comprehensive_data.program_manager_review.review_summary}</p>
//         </div>
        
//         {contract.comprehensive_data.program_manager_review.change_requests?.length > 0 && (
//           <div className="change-requests">
//             <h5>Change Requests:</h5>
//             <ul>
//               {contract.comprehensive_data.program_manager_review.change_requests.map((req, idx) => (
//                 <li key={idx}>{req}</li>
//               ))}
//             </ul>
//           </div>
//         )}
        
//         {contract.comprehensive_data.program_manager_review.key_issues?.length > 0 && (
//           <div className="key-issues">
//             <h5>Key Issues:</h5>
//             <ul>
//               {contract.comprehensive_data.program_manager_review.key_issues.map((issue, idx) => (
//                 <li key={idx}>{issue}</li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     )}
    
//     <div className="comment-actions">
//       <button 
//         className="btn-secondary"
//         onClick={fetchReviewComments}
//       >
//         <RefreshCw size={16} />
//         Refresh Comments
//       </button>
//     </div>
//   </div>
// )}
//   const getVersionTypeIcon = (type) => {
//     switch (type) {
//       case 'review_submission': return <Send size={14} />;
//       case 'metadata_update': return <Edit size={14} />;
//       case 'response_to_comments': return <MessageSquare size={14} />;
//       default: return <FileText size={14} />;
//     }
//   };

//   const getVersionTypeLabel = (type) => {
//     switch (type) {
//       case 'review_submission': return 'Review Submission';
//       case 'metadata_update': return 'Metadata Update';
//       case 'response_to_comments': return 'Response to Comments';
//       default: return type;
//     }
//   };

//   // Initialize metadata from contract
//   useEffect(() => {
//     if (showFixMetadata) {
//       setMetadata({
//         grant_name: contract.grant_name || '',
//         contract_number: contract.contract_number || '',
//         grantor: contract.grantor || '',
//         grantee: contract.grantee || '',
//         total_amount: contract.total_amount || 0,
//         start_date: contract.start_date || '',
//         end_date: contract.end_date || '',
//         purpose: contract.purpose || '',
//         notes: ''
//       });
//     }
//   }, [showFixMetadata, contract]);

//   const formatDate = (dateString) => {
//     if (!dateString) return '';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US');
//     } catch (e) {
//       return dateString;
//     }
//   };

//   return (
//     <div className="project-manager-actions">
//       <h3>Project Manager Actions</h3>
//       <p className="status-indicator">
//         Current Status: <span className={`status-badge ${contract.status}`}>{contract.status}</span>
//         {contract.version && (
//           <span className="version-badge">v{contract.version}</span>
//         )}
//       </p>
      
//       <div className="action-buttons-grid">
//         {/* Submit for Review (Draft or Rejected) */}
//         {canSubmitForReview && (
//           <button 
//             className="action-btn primary" 
//             onClick={() => {
//               const notes = prompt('Add notes for the reviewer (optional):', '');
//               if (notes !== null) {
//                 handleSubmitForReview(notes);
//               }
//             }}
//             disabled={loading}
//           >
//             <Send size={18} />
//             <div className="action-content">
//               <span className="action-title">Submit for Review</span>
//               <span className="action-description">Send contract to Program Manager for review</span>
//             </div>
//           </button>
//         )}
        
//         {/* Fix Metadata (Draft or Rejected) */}
//         {canFixMetadata && (
//           <button 
//             className="action-btn secondary" 
//             onClick={() => setShowFixMetadata(true)}
//             disabled={loading}
//           >
//             <Edit size={18} />
//             <div className="action-content">
//               <span className="action-title">Fix Metadata</span>
//               <span className="action-description">Update contract details before submission</span>
//             </div>
//           </button>
//         )}
        
//         {/* Respond to Comments (Under Review or Rejected) */}
//         {canRespondToComments && (
//           <button 
//             className="action-btn secondary" 
//             onClick={() => setShowRespondForm(true)}
//             disabled={loading}
//           >
//             <MessageSquare size={18} />
//             <div className="action-content">
//               <span className="action-title">Respond to Comments</span>
//               <span className="action-description">Reply to reviewer feedback</span>
//             </div>
//           </button>
//         )}
        
//         {/* View All Versions (Always available) */}
//         <button 
//           className="action-btn" 
//           onClick={handleViewVersions}
//           disabled={loadingVersions}
//         >
//           <History size={18} />
//           <div className="action-content">
//             <span className="action-title">View All Versions</span>
//             <span className="action-description">See history of changes and submissions</span>
//           </div>
//           {showVersions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//         </button>
//       </div>

//       {/* Versions Panel */}
//       {showVersions && (
//         <div className="versions-panel">
//           <div className="versions-header">
//             <h4>Contract Versions ({versions.length})</h4>
//             <button className="btn-close" onClick={() => setShowVersions(false)}>
//               <X size={16} />
//             </button>
//           </div>
          
//           {loadingVersions ? (
//             <div className="loading-versions">
//               <Loader2 className="spinning" size={20} />
//               <span>Loading versions...</span>
//             </div>
//           ) : versions.length === 0 ? (
//             <div className="empty-versions">
//               <History size={32} />
//               <p>No versions found</p>
//             </div>
//           ) : (
//             <div className="versions-list">
//               {versions.map(version => (
//                 <div key={version.id} className="version-card">
//                   <div className="version-header">
//                     <div className="version-type">
//                       {getVersionTypeIcon(version.version_type)}
//                       <span>{getVersionTypeLabel(version.version_type)}</span>
//                     </div>
//                     <span className="version-number">v{version.version_number}</span>
//                   </div>
                  
//                   <div className="version-body">
//                     <p className="version-description">{version.changes_description}</p>
                    
//                     <div className="version-meta">
//                       <div className="meta-item">
//                         <User size={12} />
//                         <span>{version.creator_name}</span>
//                       </div>
//                       <div className="meta-item">
//                         <Clock size={12} />
//                         <span>{new Date(version.created_at).toLocaleString()}</span>
//                       </div>
//                     </div>
                    
//                     {/* Show metadata changes if available */}
//                     {version.version_type === 'metadata_update' && version.contract_data?.updated_fields && (
//                       <div className="version-changes">
//                         <h5>Changed Fields:</h5>
//                         <ul>
//                           {version.contract_data.updated_fields.map((field, idx) => (
//                             <li key={idx}>{field.replace('_', ' ').toUpperCase()}</li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
                    
//                     {/* Show response preview if available */}
//                     {version.version_type === 'response_to_comments' && version.contract_data?.response && (
//                       <div className="version-response">
//                         <h5>Response:</h5>
//                         <p className="response-preview">{version.contract_data.response.substring(0, 100)}...</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Fix Metadata Modal */}
//       {showFixMetadata && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3>Fix Contract Metadata</h3>
//               <button className="btn-close" onClick={() => setShowFixMetadata(false)}>×</button>
//             </div>
//             <div className="modal-body">
//               <div className="form-group">
//                 <label>Contract Name *</label>
//                 <input 
//                   type="text" 
//                   value={metadata.grant_name || ''}
//                   onChange={(e) => setMetadata({...metadata, grant_name: e.target.value})}
//                   placeholder="Enter contract name"
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Contract Number</label>
//                 <input 
//                   type="text" 
//                   value={metadata.contract_number || ''}
//                   onChange={(e) => setMetadata({...metadata, contract_number: e.target.value})}
//                   placeholder="Enter contract number"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Grantor</label>
//                 <input 
//                   type="text" 
//                   value={metadata.grantor || ''}
//                   onChange={(e) => setMetadata({...metadata, grantor: e.target.value})}
//                   placeholder="Enter grantor name"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Grantee</label>
//                 <input 
//                   type="text" 
//                   value={metadata.grantee || ''}
//                   onChange={(e) => setMetadata({...metadata, grantee: e.target.value})}
//                   placeholder="Enter grantee name"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Total Amount ($)</label>
//                 <input 
//                   type="number" 
//                   value={metadata.total_amount || ''}
//                   onChange={(e) => setMetadata({...metadata, total_amount: parseFloat(e.target.value) || 0})}
//                   placeholder="Enter total amount"
//                   step="0.01"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Start Date</label>
//                 <input 
//                   type="date" 
//                   value={metadata.start_date || ''}
//                   onChange={(e) => setMetadata({...metadata, start_date: e.target.value})}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>End Date</label>
//                 <input 
//                   type="date" 
//                   value={metadata.end_date || ''}
//                   onChange={(e) => setMetadata({...metadata, end_date: e.target.value})}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Purpose</label>
//                 <textarea 
//                   value={metadata.purpose || ''}
//                   onChange={(e) => setMetadata({...metadata, purpose: e.target.value})}
//                   placeholder="Enter contract purpose"
//                   rows={3}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Notes (optional)</label>
//                 <textarea 
//                   value={metadata.notes || ''}
//                   onChange={(e) => setMetadata({...metadata, notes: e.target.value})}
//                   placeholder="Add notes about these changes"
//                   rows={2}
//                 />
//               </div>
//             </div>
//             <div className="modal-footer">
//               <button className="btn-secondary" onClick={() => setShowFixMetadata(false)}>Cancel</button>
//               <button className="btn-primary" onClick={handleFixMetadata} disabled={loading}>
//                 {loading ? <Loader2 className="spinning" size={16} /> : <Save size={16} />}
//                 {loading ? 'Saving...' : 'Save Changes'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Respond to Comments Modal */}
//       {showRespondForm && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3>Respond to Reviewer Comments</h3>
//               <button className="btn-close" onClick={() => setShowRespondForm(false)}>×</button>
//             </div>
//             <div className="modal-body">
//               {/* Show latest review comment if available */}
//               {reviewComments.length > 0 && (
//                 <div className="review-comment-preview">
//                   <h4>Latest Review Comment:</h4>
//                   <div className="comment-card">
//                     <p>{reviewComments[reviewComments.length - 1].comment}</p>
//                     <div className="comment-meta">
//                       <span>By: {reviewComments[reviewComments.length - 1].created_by_name}</span>
//                       <span>•</span>
//                       <span>{new Date(reviewComments[reviewComments.length - 1].created_at).toLocaleDateString()}</span>
//                     </div>
//                   </div>
//                 </div>
//               )}
              
//               <div className="form-group">
//                 <label>Your Response *</label>
//                 <textarea 
//                   value={response}
//                   onChange={(e) => setResponse(e.target.value)}
//                   rows={6}
//                   placeholder="Enter your detailed response to reviewer comments..."
//                   required
//                 />
//                 <div className="form-hint">
//                   <AlertCircle size={14} />
//                   <span>Your response will be visible to the reviewer and logged in the contract history.</span>
//                 </div>
//               </div>
//             </div>
//             <div className="modal-footer">
//               <button className="btn-secondary" onClick={() => setShowRespondForm(false)}>Cancel</button>
//               <button 
//                 className="btn-primary" 
//                 onClick={handleRespondToComments} 
//                 disabled={loading || !response.trim()}
//               >
//                 {loading ? <Loader2 className="spinning" size={16} /> : <Send size={16} />}
//                 {loading ? 'Submitting...' : 'Submit Response'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ProjectManagerActions;