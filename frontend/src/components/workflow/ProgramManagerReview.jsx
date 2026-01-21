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
  RefreshCw
} from 'lucide-react';
import API_CONFIG from '../../config';
import './Workflow.css';

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

  useEffect(() => {
    if (contractId) {
      fetchContractData();
      fetchReviewComments();
    }
  }, [contractId]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
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
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
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
        setComments(data.comments || []);
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
        navigate('/my-reviews'); // Redirect to reviews list
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  if (!contract) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle size={48} />
          <h2>Contract Not Found</h2>
          <p>The contract you're trying to review could not be found.</p>
          <button className="btn-primary" onClick={() => navigate('/my-reviews')}>
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  // Extract comprehensive data
  const compData = contract.comprehensive_data || {};
  const contractDetails = compData.contract_details || {};
  const parties = compData.parties || {};
  const financial = compData.financial_details || {};

  return (
    <div className="program-manager-review">
      {/* Header */}
      <div className="review-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/my-reviews')}>
            ← Back to Reviews
          </button>
          <h1>Review Contract</h1>
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
        <button 
          className={`tab-btn ${activeTab === 'contract' ? 'active' : ''}`}
          onClick={() => setActiveTab('contract')}
        >
          <FileText size={18} />
          Contract Details
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
                  </select>
                </div>
              </div>
              
              <textarea
                value={newComment.comment}
                onChange={(e) => setNewComment({...newComment, comment: e.target.value})}
                placeholder="Enter your review comment here..."
                rows={4}
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
              <h4>Previous Comments ({comments.length})</h4>
              {comments.length === 0 ? (
                <div className="empty-comments">
                  <MessageSquare size={32} />
                  <p>No comments yet. Be the first to add a review comment.</p>
                </div>
              ) : (
                <div className="comments-container">
                  {comments.map((comment) => (
                    <div key={comment.id} className={`comment-card ${comment.status}`}>
                      <div className="comment-header">
                        <div className="commenter-info">
                          <User size={14} />
                          <span className="commenter-name">{comment.user_name}</span>
                          <span className="commenter-role">{comment.user_role}</span>
                          <span className="comment-date">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="comment-badges">
                          {comment.flagged_risk && (
                            <span className="badge risk">
                              <Flag size={12} />
                              Risk
                            </span>
                          )}
                          {comment.flagged_issue && (
                            <span className="badge issue">
                              <AlertCircle size={12} />
                              Issue
                            </span>
                          )}
                          {comment.recommendation && (
                            <span className={`badge recommendation ${comment.recommendation}`}>
                              {comment.recommendation === 'approve' ? '✓ Approve' : 
                               comment.recommendation === 'reject' ? '✗ Reject' : '↻ Modify'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="comment-body">
                        <p>{comment.comment}</p>
                      </div>
                      <div className="comment-footer">
                        <span className="comment-type">{comment.comment_type}</span>
                        <span className={`comment-status ${comment.status}`}>
                          {comment.status}
                        </span>
                      </div>
                    </div>
                  ))}
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

            <div className="summary-form">
              <div className="form-group">
                <label>Review Summary *</label>
                <textarea
                  value={reviewSummary.review_summary}
                  onChange={(e) => setReviewSummary({...reviewSummary, review_summary: e.target.value})}
                  placeholder="Provide a comprehensive summary of your review..."
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label>Overall Recommendation *</label>
                <div className="recommendation-options">
                  <button
                    className={`recommendation-btn ${reviewSummary.overall_recommendation === 'approve' ? 'selected' : ''}`}
                    onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'approve'})}
                  >
                    <CheckCircle size={20} />
                    <span>Approve</span>
                    <small>Contract is ready for final approval</small>
                  </button>
                  <button
                    className={`recommendation-btn ${reviewSummary.overall_recommendation === 'modify' ? 'selected' : ''}`}
                    onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'modify'})}
                  >
                    <Edit size={20} />
                    <span>Request Modifications</span>
                    <small>Needs changes before approval</small>
                  </button>
                  <button
                    className={`recommendation-btn ${reviewSummary.overall_recommendation === 'reject' ? 'selected' : ''}`}
                    onClick={() => setReviewSummary({...reviewSummary, overall_recommendation: 'reject'})}
                  >
                    <XCircle size={20} />
                    <span>Reject</span>
                    <small>Contract cannot be approved</small>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Key Issues</label>
                <div className="issues-list">
                  {reviewSummary.key_issues.map((issue, index) => (
                    <div key={index} className="issue-item">
                      <input
                        type="text"
                        value={issue}
                        onChange={(e) => {
                          const newIssues = [...reviewSummary.key_issues];
                          newIssues[index] = e.target.value;
                          setReviewSummary({...reviewSummary, key_issues: newIssues});
                        }}
                        placeholder="Describe key issue..."
                      />
                      <button
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

              <div className="form-actions-summary">
                <button
                  className="btn-secondary"
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
                  className="btn-primary"
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
                <h4>Basic Information</h4>
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
                    <strong>Grantor:</strong>
                    <span>{contract.grantor || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Grantee:</strong>
                    <span>{contract.grantee || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Financial Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Total Amount:</strong>
                    <span>{formatCurrency(contract.total_amount)}</span>
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
                    <span>{contract.purpose || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Parties Information</h4>
                <div className="parties-grid">
                  <div className="party-card">
                    <h5>Grantor</h5>
                    <p><strong>Organization:</strong> {parties.grantor?.organization_name || 'Not specified'}</p>
                    <p><strong>Contact:</strong> {parties.grantor?.contact_person || 'Not specified'}</p>
                    <p><strong>Email:</strong> {parties.grantor?.email || 'Not specified'}</p>
                  </div>
                  <div className="party-card">
                    <h5>Grantee</h5>
                    <p><strong>Organization:</strong> {parties.grantee?.organization_name || 'Not specified'}</p>
                    <p><strong>Contact:</strong> {parties.grantee?.contact_person || 'Not specified'}</p>
                    <p><strong>Email:</strong> {parties.grantee?.email || 'Not specified'}</p>
                  </div>
                </div>
              </div>
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
              <p>Are you sure you want to submit your review with the following recommendation?</p>
              
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
                className="btn-primary"
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