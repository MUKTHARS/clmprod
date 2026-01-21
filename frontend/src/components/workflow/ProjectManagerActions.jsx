// src/components/workflow/ProjectManagerActions.jsx
import React, { useState, useEffect } from 'react';
import {
  Send,
  Edit,
  MessageSquare,
  History,
  CheckCircle,
  AlertCircle,
  FileCheck,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  X,
  Clock,
  FileText,
  User,
  Calendar,
  DollarSign,
  Building,
  Target,
  Save,
  Eye,
  Loader2,
  Download
} from 'lucide-react';
import API_CONFIG from '../../config';
import './Workflow.css';

function ProjectManagerActions({ contract, onActionComplete, user }) {
  const [showFixMetadata, setShowFixMetadata] = useState(false);
  const [showRespondForm, setShowRespondForm] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [reviewComments, setReviewComments] = useState([]);

  // Check permissions based on contract status
  const canSubmitForReview = contract.status === 'draft' || contract.status === 'rejected';
  const canFixMetadata = contract.status === 'draft' || contract.status === 'rejected';
  const canRespondToComments = contract.status === 'under_review' || contract.status === 'rejected';
  const canResubmit = contract.status === 'rejected';

  // Fetch review comments from comprehensive data
  useEffect(() => {
    if (contract.comprehensive_data) {
      const comments = contract.comprehensive_data.comments || [];
      const reviewComments = comments.filter(c => 
        c.type === 'review' || c.role === 'program_manager'
      );
      setReviewComments(reviewComments);
    }
  }, [contract]);

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      } else {
        console.error('Failed to fetch versions');
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSubmitForReview = async (notes = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/submit-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Contract submitted for review! Version: ${data.version_number}`);
        if (onActionComplete) onActionComplete();
      } else {
        const error = await response.json();
        alert(`Failed to submit: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit for review:', error);
      alert('Failed to submit for review');
    } finally {
      setLoading(false);
    }
  };

  const handleFixMetadata = async () => {
    // Validate required fields
    if (!metadata.grant_name?.trim()) {
      alert('Contract name is required');
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
        body: JSON.stringify(metadata)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Metadata updated successfully! Version: ${data.version_number}`);
        setShowFixMetadata(false);
        if (onActionComplete) onActionComplete();
      } else {
        const error = await response.json();
        alert(`Failed to update metadata: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to fix metadata:', error);
      alert('Failed to update metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToComments = async () => {
    if (!response.trim()) {
      alert('Please enter a response');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const responseData = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contract.id}/project-manager/respond-to-comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          response: response,
          review_comment_id: reviewComments.length > 0 ? reviewComments[0].id : null
        })
      });
      
      if (responseData.ok) {
        const data = await responseData.json();
        alert(`Response submitted successfully! Version: ${data.version_number}`);
        setShowRespondForm(false);
        setResponse('');
        if (onActionComplete) onActionComplete();
      } else {
        const error = await responseData.json();
        alert(`Failed to submit response: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to respond to comments:', error);
      alert('Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersions = async () => {
    if (!showVersions) {
      await fetchVersions();
    }
    setShowVersions(!showVersions);
  };
{(contract.status === 'rejected' || contract.status === 'under_review') && (
  <div className="review-feedback-section">
    <h3>
      <MessageSquare size={20} />
      Program Manager Review
    </h3>
    
    {contract.comprehensive_data?.program_manager_review && (
      <div className="review-summary-card">
        <div className="summary-header">
          <h4>Review Summary</h4>
          <span className={`recommendation-badge ${contract.comprehensive_data.program_manager_review.overall_recommendation}`}>
            {contract.comprehensive_data.program_manager_review.overall_recommendation}
          </span>
        </div>
        <div className="summary-content">
          <p>{contract.comprehensive_data.program_manager_review.review_summary}</p>
        </div>
        
        {contract.comprehensive_data.program_manager_review.change_requests?.length > 0 && (
          <div className="change-requests">
            <h5>Change Requests:</h5>
            <ul>
              {contract.comprehensive_data.program_manager_review.change_requests.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}
        
        {contract.comprehensive_data.program_manager_review.key_issues?.length > 0 && (
          <div className="key-issues">
            <h5>Key Issues:</h5>
            <ul>
              {contract.comprehensive_data.program_manager_review.key_issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
    
    <div className="comment-actions">
      <button 
        className="btn-secondary"
        onClick={fetchReviewComments}
      >
        <RefreshCw size={16} />
        Refresh Comments
      </button>
    </div>
  </div>
)}
  const getVersionTypeIcon = (type) => {
    switch (type) {
      case 'review_submission': return <Send size={14} />;
      case 'metadata_update': return <Edit size={14} />;
      case 'response_to_comments': return <MessageSquare size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getVersionTypeLabel = (type) => {
    switch (type) {
      case 'review_submission': return 'Review Submission';
      case 'metadata_update': return 'Metadata Update';
      case 'response_to_comments': return 'Response to Comments';
      default: return type;
    }
  };

  // Initialize metadata from contract
  useEffect(() => {
    if (showFixMetadata) {
      setMetadata({
        grant_name: contract.grant_name || '',
        contract_number: contract.contract_number || '',
        grantor: contract.grantor || '',
        grantee: contract.grantee || '',
        total_amount: contract.total_amount || 0,
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        purpose: contract.purpose || '',
        notes: ''
      });
    }
  }, [showFixMetadata, contract]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="project-manager-actions">
      <h3>Project Manager Actions</h3>
      <p className="status-indicator">
        Current Status: <span className={`status-badge ${contract.status}`}>{contract.status}</span>
        {contract.version && (
          <span className="version-badge">v{contract.version}</span>
        )}
      </p>
      
      <div className="action-buttons-grid">
        {/* Submit for Review (Draft or Rejected) */}
        {canSubmitForReview && (
          <button 
            className="action-btn primary" 
            onClick={() => {
              const notes = prompt('Add notes for the reviewer (optional):', '');
              if (notes !== null) {
                handleSubmitForReview(notes);
              }
            }}
            disabled={loading}
          >
            <Send size={18} />
            <div className="action-content">
              <span className="action-title">Submit for Review</span>
              <span className="action-description">Send contract to Program Manager for review</span>
            </div>
          </button>
        )}
        
        {/* Fix Metadata (Draft or Rejected) */}
        {canFixMetadata && (
          <button 
            className="action-btn secondary" 
            onClick={() => setShowFixMetadata(true)}
            disabled={loading}
          >
            <Edit size={18} />
            <div className="action-content">
              <span className="action-title">Fix Metadata</span>
              <span className="action-description">Update contract details before submission</span>
            </div>
          </button>
        )}
        
        {/* Respond to Comments (Under Review or Rejected) */}
        {canRespondToComments && (
          <button 
            className="action-btn secondary" 
            onClick={() => setShowRespondForm(true)}
            disabled={loading}
          >
            <MessageSquare size={18} />
            <div className="action-content">
              <span className="action-title">Respond to Comments</span>
              <span className="action-description">Reply to reviewer feedback</span>
            </div>
          </button>
        )}
        
        {/* View All Versions (Always available) */}
        <button 
          className="action-btn" 
          onClick={handleViewVersions}
          disabled={loadingVersions}
        >
          <History size={18} />
          <div className="action-content">
            <span className="action-title">View All Versions</span>
            <span className="action-description">See history of changes and submissions</span>
          </div>
          {showVersions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Versions Panel */}
      {showVersions && (
        <div className="versions-panel">
          <div className="versions-header">
            <h4>Contract Versions ({versions.length})</h4>
            <button className="btn-close" onClick={() => setShowVersions(false)}>
              <X size={16} />
            </button>
          </div>
          
          {loadingVersions ? (
            <div className="loading-versions">
              <Loader2 className="spinning" size={20} />
              <span>Loading versions...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="empty-versions">
              <History size={32} />
              <p>No versions found</p>
            </div>
          ) : (
            <div className="versions-list">
              {versions.map(version => (
                <div key={version.id} className="version-card">
                  <div className="version-header">
                    <div className="version-type">
                      {getVersionTypeIcon(version.version_type)}
                      <span>{getVersionTypeLabel(version.version_type)}</span>
                    </div>
                    <span className="version-number">v{version.version_number}</span>
                  </div>
                  
                  <div className="version-body">
                    <p className="version-description">{version.changes_description}</p>
                    
                    <div className="version-meta">
                      <div className="meta-item">
                        <User size={12} />
                        <span>{version.creator_name}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={12} />
                        <span>{new Date(version.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Show metadata changes if available */}
                    {version.version_type === 'metadata_update' && version.contract_data?.updated_fields && (
                      <div className="version-changes">
                        <h5>Changed Fields:</h5>
                        <ul>
                          {version.contract_data.updated_fields.map((field, idx) => (
                            <li key={idx}>{field.replace('_', ' ').toUpperCase()}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Show response preview if available */}
                    {version.version_type === 'response_to_comments' && version.contract_data?.response && (
                      <div className="version-response">
                        <h5>Response:</h5>
                        <p className="response-preview">{version.contract_data.response.substring(0, 100)}...</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fix Metadata Modal */}
      {showFixMetadata && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Fix Contract Metadata</h3>
              <button className="btn-close" onClick={() => setShowFixMetadata(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Contract Name *</label>
                <input 
                  type="text" 
                  value={metadata.grant_name || ''}
                  onChange={(e) => setMetadata({...metadata, grant_name: e.target.value})}
                  placeholder="Enter contract name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contract Number</label>
                <input 
                  type="text" 
                  value={metadata.contract_number || ''}
                  onChange={(e) => setMetadata({...metadata, contract_number: e.target.value})}
                  placeholder="Enter contract number"
                />
              </div>
              <div className="form-group">
                <label>Grantor</label>
                <input 
                  type="text" 
                  value={metadata.grantor || ''}
                  onChange={(e) => setMetadata({...metadata, grantor: e.target.value})}
                  placeholder="Enter grantor name"
                />
              </div>
              <div className="form-group">
                <label>Grantee</label>
                <input 
                  type="text" 
                  value={metadata.grantee || ''}
                  onChange={(e) => setMetadata({...metadata, grantee: e.target.value})}
                  placeholder="Enter grantee name"
                />
              </div>
              <div className="form-group">
                <label>Total Amount ($)</label>
                <input 
                  type="number" 
                  value={metadata.total_amount || ''}
                  onChange={(e) => setMetadata({...metadata, total_amount: parseFloat(e.target.value) || 0})}
                  placeholder="Enter total amount"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  value={metadata.start_date || ''}
                  onChange={(e) => setMetadata({...metadata, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input 
                  type="date" 
                  value={metadata.end_date || ''}
                  onChange={(e) => setMetadata({...metadata, end_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Purpose</label>
                <textarea 
                  value={metadata.purpose || ''}
                  onChange={(e) => setMetadata({...metadata, purpose: e.target.value})}
                  placeholder="Enter contract purpose"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea 
                  value={metadata.notes || ''}
                  onChange={(e) => setMetadata({...metadata, notes: e.target.value})}
                  placeholder="Add notes about these changes"
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFixMetadata(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleFixMetadata} disabled={loading}>
                {loading ? <Loader2 className="spinning" size={16} /> : <Save size={16} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Comments Modal */}
      {showRespondForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Respond to Reviewer Comments</h3>
              <button className="btn-close" onClick={() => setShowRespondForm(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Show latest review comment if available */}
              {reviewComments.length > 0 && (
                <div className="review-comment-preview">
                  <h4>Latest Review Comment:</h4>
                  <div className="comment-card">
                    <p>{reviewComments[reviewComments.length - 1].comment}</p>
                    <div className="comment-meta">
                      <span>By: {reviewComments[reviewComments.length - 1].created_by_name}</span>
                      <span>•</span>
                      <span>{new Date(reviewComments[reviewComments.length - 1].created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>Your Response *</label>
                <textarea 
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={6}
                  placeholder="Enter your detailed response to reviewer comments..."
                  required
                />
                <div className="form-hint">
                  <AlertCircle size={14} />
                  <span>Your response will be visible to the reviewer and logged in the contract history.</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRespondForm(false)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleRespondToComments} 
                disabled={loading || !response.trim()}
              >
                {loading ? <Loader2 className="spinning" size={16} /> : <Send size={16} />}
                {loading ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManagerActions;