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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/approved/${contractId}/final-publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: publishNotes || 'Contract finalized and published',
          publish_to_review: false
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
    const directorApproval = contract.enhanced_approval || contract.comprehensive_data?.director_final_approval || {};
    const approvedBy = directorApproval.approved_by_name || 'Unknown Director';
    const approvedAt = directorApproval.approved_at ? formatDate(directorApproval.approved_at) : 'Unknown';

    return (
      <tr key={contract.id || index} className="acp-contract-row">
        <td>
          <div className="acp-contract-info-list">
            <div className="acp-contract-name-list">
              {contract.grant_name || contract.filename || 'Unnamed Contract'}
            </div>

            {directorApproval.approval_comments && (
              <div className="acp-approval-comments">
                <span className="acp-comments-label">Director Comments: </span>
                <span className="acp-comments-text">
                  {directorApproval.approval_comments.length > 50 
                    ? directorApproval.approval_comments.substring(0, 50) + '...'
                    : directorApproval.approval_comments}
                </span>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="acp-contract-id-list">
            {contract.id || 'N/A'}
          </div>
        </td>
        <td>
          <div className="acp-grantor-cell">
            <span>{contract.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="acp-amount-cell">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="acp-date-cell">
            <span>{formatDate(contract.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="acp-status-cell">
            <span className="acp-status-text acp-approved">
              <CheckCircle size={12} />
              Approved
            </span>
            <div className="acp-lock-status">
              {contract.comprehensive_data?.director_final_approval?.contract_locked ? (
                <span className="acp-locked">
                  <Shield size={10} />
                  Locked
                </span>
              ) : (
                <span className="acp-unlocked">Ready to Publish</span>
              )}
            </div>
          </div>
        </td>
        <td>
          <div className="acp-action-buttons">
            <button 
              className="acp-btn-action"
              onClick={() => handleViewContract(contract.id)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            {!contract.comprehensive_data?.director_final_approval?.contract_locked && (
              <button 
                className="acp-btn-action acp-publish"
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
      <div key={contract.id || index} className="acp-contract-card">
        <div className="acp-card-header">
          <div className="acp-contract-status">
            <span className="acp-status-badge acp-approved">
              <CheckCircle size={12} />
              Approved
            </span>
            {directorApproval.contract_locked && (
              <span className="acp-status-badge acp-locked">
                <Shield size={12} />
                Locked
              </span>
            )}
          </div>
          <div className="acp-card-actions">
            <button 
              className="acp-btn-action"
              onClick={() => handleViewContract(contract.id)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {!directorApproval.contract_locked && (
              <button 
                className="acp-btn-action acp-publish"
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

        <div className="acp-card-content">
          <div className="acp-contract-icon">
            <FileText size={24} />
          </div>
          <h3 className="acp-contract-name">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </h3>
          <p className="acp-contract-id">
            ID: {contract.id || 'N/A'}
          </p>

          <div className="acp-approval-info-section">
            <div className="acp-approval-header">
              <Award size={14} />
              <span>Director Approval:</span>
            </div>
            <div className="acp-approval-details">
              <div className="acp-approver-name">{approvedBy}</div>
              <div className="acp-approver-date">{approvedAt}</div>
            </div>
            {directorApproval.approval_comments && (
              <div className="acp-approval-comments-card">
                <div className="acp-comments-label">Comments:</div>
                <div className="acp-comments-text">
                  {directorApproval.approval_comments.length > 100 
                    ? directorApproval.approval_comments.substring(0, 100) + '...'
                    : directorApproval.approval_comments}
                </div>
              </div>
            )}
          </div>

          <div className="acp-contract-details">
            <div className="acp-detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(contract.total_amount)}</span>
            </div>
            <div className="acp-detail-item">
              <Building size={14} />
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="acp-detail-item">
              <Calendar size={14} />
              <span>{formatDate(contract.uploaded_at)}</span>
            </div>
          </div>

          {contract.purpose && (
            <div className="acp-contract-purpose">
              <p>{contract.purpose.length > 100 ? contract.purpose.substring(0, 100) + '...' : contract.purpose}</p>
            </div>
          )}
        </div>

        <div className="acp-card-footer">
          {!directorApproval.contract_locked ? (
            <button 
              className="acp-btn-publish"
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
            <div className="acp-locked-notice">
              <Shield size={12} />
              <span>Contract is locked and finalized</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="acp-approved-contracts-page">
      <div className="acp-contracts-controls">
        <div className="acp-search-container">
          <Search className="acp-search-icon" />
          <input
            type="text"
            placeholder="Search approved contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="acp-search-input"
          />
        </div>

        <div className="acp-controls-right">
          <div className="acp-view-toggle">
            <button 
              className={`acp-view-btn ${activeView === 'list' ? 'acp-active' : ''}`}
              onClick={() => setActiveView('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button 
              className={`acp-view-btn ${activeView === 'grid' ? 'acp-active' : ''}`}
              onClick={() => setActiveView('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="acp-contracts-content">
        {loading ? (
          <div className="acp-loading-state">
            <Loader2 className="acp-spinner" />
            <p>Loading approved contracts...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="acp-empty-state">
            <CheckCircle size={48} />
            <h3>No approved contracts</h3>
            <p>
              You will see contracts here once they are approved by the Director
            </p>
          </div>
        ) : (
          <>
            <div className="acp-results-header">
              <span className="acp-results-count">
                Showing {filteredContracts.length} approved contract(s)
              </span>
            </div>

            {activeView === 'list' ? (
              <div className="acp-contracts-table-container">
                <table className="acp-contracts-table">
                  <thead>
                    <tr>
                      <th className="acp-table-header">Contract Name</th>
                      <th className="acp-table-header">Contract ID</th>
                      <th className="acp-table-header">Grantor</th>
                      <th className="acp-table-header">Amount</th>
                      <th className="acp-table-header">Upload Date</th>
                      <th className="acp-table-header">Status</th>
                      <th className="acp-table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract, index) => renderContractRow(contract, index))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="acp-contracts-grid">
                {filteredContracts.map((contract, index) => renderContractCard(contract, index))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && selectedContract && (
        <div className="acp-publish-modal-overlay">
          <div className="acp-publish-modal">
            <div className="acp-modal-header">
              <h3>
                Publish Contract
              </h3>
              <button 
                className="acp-modal-close"
                onClick={() => {
                  setShowPublishModal(false);
                  setSelectedContract(null);
                  setPublishNotes('');
                }}
              >
                ×
              </button>
            </div>

            <div className="acp-modal-body">
              <div className="acp-contract-summary">
                <h4>Contract: {selectedContract.grant_name || selectedContract.filename}</h4>
                <p className="acp-contract-id">ID: {selectedContract.id}</p>
                <div className="acp-summary-details">
                  <div className="acp-detail">
                    <strong>Grantor:</strong> {selectedContract.grantor || 'N/A'}
                  </div>
                  <div className="acp-detail">
                    <strong>Amount:</strong> {formatCurrency(selectedContract.total_amount)}
                  </div>
                  <div className="acp-detail">
                    <strong>Approved by:</strong> {selectedContract.comprehensive_data?.director_final_approval?.approved_by_name || 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="acp-publish-notes-section">
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
              </div>
            </div>

            <div className="acp-modal-footer">
              <button
                className="acp-btn-secondary"
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
                className="acp-btn-primary"
                onClick={() => handleFinalPublish(selectedContract.id)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="acp-spinning" />
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