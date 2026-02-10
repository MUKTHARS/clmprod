import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Eye,
  User,
  Loader2,
  DollarSign,
  Building,
  Grid,
  List,
  Download,
  Send,
  Shield,
  Award,
  Check
} from 'lucide-react';
import API_CONFIG from '../config';
import './ApprovedContractsPage.css';

function ApprovedContractsPage({ user }) {
  const navigate = useNavigate();
  const [approvedContracts, setApprovedContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('list');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');

  useEffect(() => {
    fetchApprovedContracts();
  }, []);

const fetchApprovedContracts = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Get all contracts
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const allContracts = await response.json();
      
      // Filter for approved contracts created by this project manager
      const filteredContracts = allContracts.filter(contract => {
        if (!contract || contract.status !== 'approved') return false;
        
        // Check if this user created the contract
        const isCreator = contract.created_by === user.id;
        
        // Also check if user is assigned to the contract
        const isAssigned = (
          (contract.assigned_pm_users && Array.isArray(contract.assigned_pm_users) && contract.assigned_pm_users.includes(user.id)) ||
          (contract.assigned_pgm_users && Array.isArray(contract.assigned_pgm_users) && contract.assigned_pgm_users.includes(user.id)) ||
          (contract.assigned_director_users && Array.isArray(contract.assigned_director_users) && contract.assigned_director_users.includes(user.id))
        );
        
        return isCreator || isAssigned;
      });
      
      // Enhance contracts with director information
      const enhancedContracts = filteredContracts.map(contract => {
        const directorApproval = contract.comprehensive_data?.director_final_approval || {};
        
        // If no director approval in comprehensive_data, try to get from review_comments
        if (!directorApproval.approved_by_name && contract.review_comments) {
          const reviewText = contract.review_comments;
          const approvedByMatch = reviewText.match(/Approved by: (.+?)\n/);
          const approvedAtMatch = reviewText.match(/Approved at: (.+?)\n/);
          const commentsMatch = reviewText.match(/Comments: (.+?)(?:\n|$)/);
          
          if (approvedByMatch) {
            directorApproval.approved_by_name = approvedByMatch[1];
          }
          if (approvedAtMatch) {
            directorApproval.approved_at = approvedAtMatch[1];
          }
          if (commentsMatch) {
            directorApproval.approval_comments = commentsMatch[1];
          }
        }
        
        return {
          ...contract,
          enhanced_approval: directorApproval
        };
      });
      
      setApprovedContracts(enhancedContracts);
    }
  } catch (error) {
    console.error('Failed to fetch approved contracts:', error);
  } finally {
    setLoading(false);
  }
};

const handleFinalPublish = async (contractId) => {
  if (!confirm('Are you sure you want to finalize and publish this contract? This action cannot be undone.')) {
    return;
  }

  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Use the new endpoint for approved contracts
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/approved/${contractId}/final-publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notes: publishNotes || 'Contract finalized and published',
        publish_to_review: false // Final publish, not for review
      })
    });

    if (response.ok) {
      const result = await response.json();
      alert('Contract published successfully!');
      setShowPublishModal(false);
      setPublishNotes('');
      setSelectedContract(null);
      fetchApprovedContracts();
    } else {
      const error = await response.json();
      alert(`Failed to publish contract: ${error.detail}`);
    }
  } catch (error) {
    console.error('Error publishing contract:', error);
    alert('Failed to publish contract');
  } finally {
    setLoading(false);
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
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleViewContract = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  const filteredContracts = approvedContracts.filter(contract => {
    if (!contract) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (contract.grant_name && contract.grant_name.toLowerCase().includes(searchLower)) ||
        (contract.filename && contract.filename.toLowerCase().includes(searchLower)) ||
        (contract.contract_number && contract.contract_number.toString().toLowerCase().includes(searchLower)) ||
        (contract.grantor && contract.grantor.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

const renderContractRow = (contract, index) => {
  // Use enhanced approval data
  const directorApproval = contract.enhanced_approval || contract.comprehensive_data?.director_final_approval || {};
  const approvedBy = directorApproval.approved_by_name || 'Unknown Director';
  const approvedAt = directorApproval.approved_at ? formatDate(directorApproval.approved_at) : 'Unknown';

  return (
    <tr key={contract.id || index} className="contract-row">
      <td>
        <div className="contract-info-list">
          <div className="contract-name-list">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </div>

          {directorApproval.approval_comments && (
            <div className="approval-comments">
              <span className="comments-label">Director Comments: </span>
              <span className="comments-text">
                {directorApproval.approval_comments.length > 50 
                  ? directorApproval.approval_comments.substring(0, 50) + '...'
                  : directorApproval.approval_comments}
              </span>
            </div>
          )}
        </div>
      </td>
        <td>
          <div className="contract-id-list">
            {contract.id || 'N/A'}
          </div>
        </td>
        <td>
          <div className="grantor-cell">
            <span>{contract.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="amount-cell">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{formatDate(contract.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="status-cell">
            <span className="status-text approved">
              <CheckCircle size={12} />
              Approved
            </span>
            <div className="lock-status">
              {contract.comprehensive_data?.director_final_approval?.contract_locked ? (
                <span className="locked">
                  <Shield size={10} />
                  Locked
                </span>
              ) : (
                <span className="unlocked">Ready to Publish</span>
              )}
            </div>
          </div>
        </td>
        <td>
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => handleViewContract(contract.id)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            {!contract.comprehensive_data?.director_final_approval?.contract_locked && (
              <button 
                className="btn-action publish"
                onClick={() => {
                  setSelectedContract(contract);
                  setShowPublishModal(true);
                }}
                title="Publish Contract"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderContractCard = (contract, index) => {
    const directorApproval = contract.comprehensive_data?.director_final_approval || {};
    const approvedBy = directorApproval.approved_by_name || 'Unknown Director';
    const approvedAt = directorApproval.approved_at ? formatDate(directorApproval.approved_at) : 'Unknown';

    return (
      <div key={contract.id || index} className="contract-card">
        <div className="card-header">
          <div className="contract-status">
            <span className="status-badge approved">
              <CheckCircle size={12} />
              Approved
            </span>
            {directorApproval.contract_locked && (
              <span className="status-badge locked">
                <Shield size={12} />
                Locked
              </span>
            )}
          </div>
          <div className="card-actions">
            <button 
              className="btn-action"
              onClick={() => handleViewContract(contract.id)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {!directorApproval.contract_locked && (
              <button 
                className="btn-action publish"
                onClick={() => {
                  setSelectedContract(contract);
                  setShowPublishModal(true);
                }}
                title="Publish Contract"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="card-content">
          <div className="contract-icon">
            <FileText size={24} />
          </div>
          <h3 className="contract-name">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </h3>
          <p className="contract-id">
            ID: {contract.id || 'N/A'}
          </p>

          <div className="approval-info-section">
            <div className="approval-header">
              <Award size={14} />
              <span>Director Approval:</span>
            </div>
            <div className="approval-details">
              <div className="approver-name">{approvedBy}</div>
              <div className="approver-date">{approvedAt}</div>
            </div>
            {directorApproval.approval_comments && (
              <div className="approval-comments-card">
                <div className="comments-label">Comments:</div>
                <div className="comments-text">
                  {directorApproval.approval_comments.length > 100 
                    ? directorApproval.approval_comments.substring(0, 100) + '...'
                    : directorApproval.approval_comments}
                </div>
              </div>
            )}
          </div>

          <div className="contract-details">
            <div className="detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(contract.total_amount)}</span>
            </div>
            <div className="detail-item">
              <Building size={14} />
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="detail-item">
              <Calendar size={14} />
              <span>{formatDate(contract.uploaded_at)}</span>
            </div>
          </div>

          {contract.purpose && (
            <div className="contract-purpose">
              <p>{contract.purpose.length > 100 ? contract.purpose.substring(0, 100) + '...' : contract.purpose}</p>
            </div>
          )}
        </div>

        <div className="card-footer">
          {!directorApproval.contract_locked ? (
            <button 
              className="btn-publish"
              onClick={() => {
                setSelectedContract(contract);
                setShowPublishModal(true);
              }}
            >
              <Send size={14} />
              Finalize & Publish
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="locked-notice">
              <Shield size={12} />
              <span>Contract is locked and finalized</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="approved-contracts-page">
      <div className="contracts-header">
        <div className="header-left">
          <h1>
            {/* <CheckCircle size={24} /> */}
            Approved Contracts
          </h1>
          
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={fetchApprovedContracts}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="contracts-controls">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search approved contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="controls-right">
          <div className="view-toggle">
            <button 
              className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button 
              className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveView('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="contracts-content">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Loading approved contracts...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} />
            <h3>No approved contracts</h3>
            <p>
              You will see contracts here once they are approved by the Director
            </p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <span className="results-count">
                Showing {filteredContracts.length} approved contract(s)
              </span>
            </div>

            {activeView === 'list' ? (
              <div className="contracts-table-container">
                <table className="contracts-table">
                  <thead>
                    <tr>
                      <th className="table-header">Contract Name</th>
                      <th className="table-header">Contract ID</th>
                      <th className="table-header">Grantor</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">Upload Date</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract, index) => renderContractRow(contract, index))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="contracts-grid">
                {filteredContracts.map((contract, index) => renderContractCard(contract, index))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && selectedContract && (
        <div className="publish-modal-overlay">
          <div className="publish-modal">
            <div className="modal-header">
              <h3>
                <Send size={20} />
                Finalize & Publish Contract
              </h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowPublishModal(false);
                  setSelectedContract(null);
                  setPublishNotes('');
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="contract-summary">
                <h4>Contract: {selectedContract.grant_name || selectedContract.filename}</h4>
                <p className="contract-id">ID: {selectedContract.id}</p>
                <div className="summary-details">
                  <div className="detail">
                    <strong>Grantor:</strong> {selectedContract.grantor || 'N/A'}
                  </div>
                  <div className="detail">
                    <strong>Amount:</strong> {formatCurrency(selectedContract.total_amount)}
                  </div>
                  <div className="detail">
                    <strong>Approved by:</strong> {selectedContract.comprehensive_data?.director_final_approval?.approved_by_name || 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="publish-notes-section">
                <label htmlFor="publish-notes">
                  <FileText size={14} />
                  Publish Notes (Optional)
                </label>
                <textarea
                  id="publish-notes"
                  value={publishNotes}
                  onChange={(e) => setPublishNotes(e.target.value)}
                  placeholder="Add any notes about this final publication..."
                  rows={4}
                />
                <p className="notes-help">
                  These notes will be recorded in the contract history
                </p>
              </div>

              <div className="warning-section">
                <AlertCircle size={16} />
                <div className="warning-content">
                  <strong>Important:</strong>
                  <ul>
                    <li>This will finalize the contract and mark it as published</li>
                    <li>The contract will be locked for further changes</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowPublishModal(false);
                  setSelectedContract(null);
                  setPublishNotes('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => handleFinalPublish(selectedContract.id)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Finalize & Publish Contract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovedContractsPage;