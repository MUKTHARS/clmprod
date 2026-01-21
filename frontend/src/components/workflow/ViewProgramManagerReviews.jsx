import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Flag,
  CheckCircle,
  XCircle,
  Edit,
  User,
  Calendar,
  FileText,
  RefreshCw,
  Check,
  X,
  Loader2,
  Download,
  Shield
} from 'lucide-react';
import API_CONFIG from '../../config';

function ViewProgramManagerReviews() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvingCommentId, setResolvingCommentId] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  useEffect(() => {
    if (contractId) {
      fetchReviews();
    }
  }, [contractId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractId}/program-manager-reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        console.error('Failed to fetch reviews');
        setReviews(null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComment = async (commentId) => {
    if (!resolutionText.trim()) {
      alert('Please enter a resolution response');
      return;
    }

    setResolvingCommentId(commentId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/review-comments/${commentId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response: resolutionText
        })
      });

      if (response.ok) {
        alert('Comment resolved successfully');
        setResolutionText('');
        fetchReviews(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to resolve comment: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
      alert('Failed to resolve comment');
    } finally {
      setResolvingCommentId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'approve':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'reject':
        return <XCircle size={16} className="text-red-600" />;
      case 'modify':
        return <Edit size={16} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case 'approve':
        return 'Approve';
      case 'reject':
        return 'Reject';
      case 'modify':
        return 'Request Modifications';
      default:
        return 'No Recommendation';
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <Loader2 size={48} className="spinning" />
          <h3>Loading Program Manager Reviews</h3>
          <p>Fetching review data...</p>
        </div>
      </div>
    );
  }

  if (!reviews) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle size={48} />
          <h2>No Reviews Found</h2>
          <p>No program manager reviews available for this contract.</p>
          <button className="btn-primary" onClick={() => navigate(`/contracts/${contractId}`)}>
            <ArrowLeft size={16} />
            Back to Contract
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="program-manager-reviews-page">
      {/* Header */}
      <div className="reviews-header">
        <button className="btn-back" onClick={() => navigate(`/contracts/${contractId}`)}>
          <ArrowLeft size={20} />
          Back to Contract
        </button>
        <h1>Program Manager Reviews</h1>
        <p>View and respond to program manager feedback</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{reviews.statistics.total_comments}</span>
            <span className="stat-label">Total Comments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{reviews.statistics.open_comments}</span>
            <span className="stat-label">Open Comments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{reviews.statistics.risk_comments}</span>
            <span className="stat-label">Risk Flags</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{reviews.statistics.issue_comments}</span>
            <span className="stat-label">Issue Flags</span>
          </div>
        </div>
      </div>

      {/* Review Summary */}
      {reviews.review_summary && Object.keys(reviews.review_summary).length > 0 && (
        <div className="review-summary-section">
          <div className="section-header">
            <h2>
              <Shield size={20} />
              Program Manager Review Summary
            </h2>
            <button className="btn-refresh" onClick={fetchReviews}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
          
          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-info">
                <h3>Overall Recommendation</h3>
                <div className={`recommendation-badge ${reviews.review_summary.overall_recommendation}`}>
                  {getRecommendationIcon(reviews.review_summary.overall_recommendation)}
                  <span>{getRecommendationText(reviews.review_summary.overall_recommendation)}</span>
                </div>
              </div>
              <div className="summary-meta">
                <span className="meta-item">
                  <User size={14} />
                  {reviews.review_summary.reviewed_by_name || 'Unknown Reviewer'}
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  {formatDate(reviews.review_summary.reviewed_at)}
                </span>
              </div>
            </div>
            
            <div className="summary-content">
              <h4>Review Summary</h4>
              <p>{reviews.review_summary.review_summary || 'No summary provided'}</p>
            </div>
            
            {reviews.review_summary.key_issues && reviews.review_summary.key_issues.length > 0 && (
              <div className="key-issues-section">
                <h4>Key Issues Identified</h4>
                <ul className="issues-list">
                  {reviews.review_summary.key_issues.map((issue, index) => (
                    <li key={index} className="issue-item">
                      <AlertCircle size={14} />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {reviews.review_summary.change_requests && reviews.review_summary.change_requests.length > 0 && (
              <div className="change-requests-section">
                <h4>Change Requests</h4>
                <ul className="change-requests-list">
                  {reviews.review_summary.change_requests.map((request, index) => (
                    <li key={index} className="change-request-item">
                      <Edit size={14} />
                      <span>{request}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Comments */}
      <div className="review-comments-section">
        <div className="section-header">
          <h2>
            <MessageSquare size={20} />
            Review Comments ({reviews.comments.length})
          </h2>
          <div className="comment-filters">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Open ({reviews.statistics.open_comments})</button>
            <button className="filter-btn">Resolved ({reviews.statistics.total_comments - reviews.statistics.open_comments})</button>
          </div>
        </div>

        <div className="comments-container">
          {reviews.comments.length === 0 ? (
            <div className="empty-comments">
              <MessageSquare size={32} />
              <p>No review comments yet.</p>
            </div>
          ) : (
            reviews.comments.map((comment) => (
              <div key={comment.id} className={`comment-card ${comment.status}`}>
                <div className="comment-header">
                  <div className="commenter-info">
                    <div className="commenter-avatar">
                      <User size={14} />
                    </div>
                    <div className="commenter-details">
                      <span className="commenter-name">{comment.user_name}</span>
                      <span className="commenter-role">{comment.user_role}</span>
                      <span className="comment-date">{formatDate(comment.created_at)}</span>
                    </div>
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
                        {getRecommendationIcon(comment.recommendation)}
                        {getRecommendationText(comment.recommendation)}
                      </span>
                    )}
                    <span className={`status-badge ${comment.status}`}>
                      {comment.status}
                    </span>
                  </div>
                </div>
                
                <div className="comment-body">
                  <div className="comment-type">
                    <FileText size={12} />
                    {comment.comment_type}
                  </div>
                  <p className="comment-text">{comment.comment}</p>
                  
                  {comment.change_request && (
                    <div className="change-request">
                      <h5>Change Request:</h5>
                      <pre>{JSON.stringify(comment.change_request, null, 2)}</pre>
                    </div>
                  )}
                </div>
                
                {comment.status === 'open' && (
                  <div className="comment-resolution">
                    <h5>Add Resolution Response:</h5>
                    <textarea
                      placeholder="Enter your response to this comment..."
                      rows={3}
                      value={resolvingCommentId === comment.id ? resolutionText : ''}
                      onChange={(e) => setResolutionText(e.target.value)}
                    />
                    <div className="resolution-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => setResolutionText('')}
                        disabled={resolvingCommentId === comment.id}
                      >
                        Clear
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => handleResolveComment(comment.id)}
                        disabled={!resolutionText.trim() || resolvingCommentId === comment.id}
                      >
                        {resolvingCommentId === comment.id ? (
                          <>
                            <Loader2 size={14} className="spinning" />
                            Resolving...
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            Mark as Resolved
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {comment.status === 'resolved' && comment.resolution_response && (
                  <div className="resolution-display">
                    <h5>
                      <Check size={14} />
                      Resolution Response
                    </h5>
                    <p className="resolution-text">{comment.resolution_response}</p>
                    <div className="resolution-meta">
                      <span className="meta-item">
                        Resolved on: {formatDate(comment.resolved_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-section">
        <button className="btn-secondary" onClick={() => navigate(`/contracts/${contractId}`)}>
          <ArrowLeft size={16} />
          Back to Contract
        </button>
        <button className="btn-primary" onClick={() => navigate(`/contracts/${contractId}?tab=workflow`)}>
          Go to Workflow Actions
        </button>
        <button className="btn-download">
          <Download size={16} />
          Export Reviews
        </button>
      </div>
    </div>
  );
}

export default ViewProgramManagerReviews;