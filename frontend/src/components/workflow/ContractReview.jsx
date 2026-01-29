import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ChevronRight,
  Eye,
  Download,
  Send,
  History
} from 'lucide-react';
import './Workflow.css';

function ContractReview() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [comment, setComment] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContractsUnderReview();
  }, []);

  const fetchContractsUnderReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://44.219.56.85:4001/api/contracts/status/under_review', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const handleContractSelect = async (contract) => {
    setSelectedContract(contract);
    setComment('');
    setAction('');
  };

  const handleSubmitReview = async () => {
    if (!selectedContract || !action || !comment) {
      alert('Please select an action and provide comments');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://44.219.56.85:4001/api/contracts/${selectedContract.id}/update-status?status=${action}&comments=${encodeURIComponent(comment)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Review submitted successfully');
        fetchContractsUnderReview();
        setSelectedContract(null);
        setComment('');
        setAction('');
      } else {
        const error = await response.json();
        alert(`Failed to submit review: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <h1>Contract Review</h1>
        {/* <p>Review and provide feedback on submitted contracts</p> */}
      </div>

      <div className="workflow-content">
        {/* Contracts List */}
        <div className="contracts-list-section">
          <h2>Contracts Under Review ({contracts.length})</h2>
          {contracts.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} />
              <h3>No contracts to review</h3>
              <p>All submitted contracts have been reviewed</p>
            </div>
          ) : (
            <div className="contracts-grid">
              {contracts.map(contract => (
                <div 
                  key={contract.id} 
                  className={`contract-card ${selectedContract?.id === contract.id ? 'selected' : ''}`}
                  onClick={() => handleContractSelect(contract)}
                >
                  <div className="contract-card-header">
                    <FileText size={20} />
                    <div>
                      <h3>{contract.grant_name || contract.filename}</h3>
                      <p className="contract-meta">
                        <User size={14} /> {contract.created_by}
                        <span className="separator">•</span>
                        <Calendar size={14} /> {new Date(contract.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="contract-card-body">
                    <div className="contract-info">
                      <span><strong>Grantor:</strong> {contract.grantor || 'Not specified'}</span>
                      <span><strong>Amount:</strong> ${contract.total_amount?.toLocaleString() || '0'}</span>
                    </div>
                    <button 
                      className="btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/contracts/${contract.id}`);
                      }}
                    >
                      <Eye size={16} /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Panel */}
        {selectedContract && (
          <div className="review-panel">
            <div className="review-panel-header">
              <h2>Review Contract</h2>
              <button 
                className="btn-close"
                onClick={() => setSelectedContract(null)}
              >
                ×
              </button>
            </div>

            <div className="review-panel-body">
              <div className="contract-summary">
                <h3>{selectedContract.grant_name || selectedContract.filename}</h3>
                <div className="summary-details">
                  <div className="detail-item">
                    <strong>Contract ID:</strong> {selectedContract.id}
                  </div>
                  <div className="detail-item">
                    <strong>Submitted by:</strong> {selectedContract.created_by}
                  </div>
                  <div className="detail-item">
                    <strong>Submitted on:</strong> {new Date(selectedContract.uploaded_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="action-section">
                <h3>Review Action</h3>
                <div className="action-buttons">
                  <button
                    className={`action-btn ${action === 'reviewed' ? 'selected' : ''}`}
                    onClick={() => setAction('reviewed')}
                  >
                    <CheckCircle size={20} />
                    <span>Approve for Final Review</span>
                  </button>
                  <button
                    className={`action-btn ${action === 'rejected' ? 'selected' : ''}`}
                    onClick={() => setAction('rejected')}
                  >
                    <XCircle size={20} />
                    <span>Reject and Return</span>
                  </button>
                </div>
              </div>

              <div className="comments-section">
                <h3>Review Comments</h3>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Provide detailed feedback and reasons for your decision..."
                  rows={6}
                />
                <div className="comment-guidelines">
                  <AlertCircle size={14} />
                  <span>Please provide constructive feedback that will help improve the contract</span>
                </div>
              </div>

              <div className="review-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedContract(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleSubmitReview}
                  disabled={!action || !comment || loading}
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractReview;