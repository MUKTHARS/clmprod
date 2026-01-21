import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Building,
  DollarSign,
  ChevronRight,
  Eye,
  Download,
  MessageSquare,
  Flag,
  RefreshCw,
  Loader2,
  Check,
  X
} from 'lucide-react';
import API_CONFIG from '../../config';
import './Review.css'; 
import './Workflow.css';
function Review() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('under_review');
  const navigate = useNavigate();

  useEffect(() => {
    fetchContractsForReview();
  }, []);

  const fetchContractsForReview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/status/${selectedStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]);
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
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getDaysSince = (dateString) => {
    if (!dateString) return 'N/A';
    const now = new Date();
    const then = new Date(dateString);
    const diffTime = Math.abs(now - then);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  const getContractDisplayId = (contract) => {
    if (!contract) return 'Unknown';
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.id}`;
  };

  const filteredContracts = contracts.filter(contract => 
    searchTerm === '' ||
    (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    fetchContractsForReview();
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <Loader2 size={48} className="spinning" />
          <h3>Loading Review Contracts</h3>
          <p>Fetching contracts for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      {/* Header */}
      <div className="review-header">
        <h1>Contract Review</h1>
        <p>Review and provide feedback on submitted contracts</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{contracts.length}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">
              {contracts.filter(c => c.comprehensive_data?.review_flags?.length > 0).length}
            </span>
            <span className="stat-label">With Flags</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">
              {formatCurrency(contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0))}
            </span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">
              {contracts.filter(c => new Date(c.uploaded_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)).length}
            </span>
            <span className="stat-label">New (3 days)</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="review-controls">
        <div className="search-container">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filters">
          <button
            className={`status-filter-btn ${selectedStatus === 'under_review' ? 'active' : ''}`}
            onClick={() => handleStatusChange('under_review')}
          >
            Under Review ({contracts.filter(c => c.status === 'under_review').length})
          </button>
          <button
            className={`status-filter-btn ${selectedStatus === 'reviewed' ? 'active' : ''}`}
            onClick={() => handleStatusChange('reviewed')}
          >
            Reviewed ({contracts.filter(c => c.status === 'reviewed').length})
          </button>
          <button
            className={`status-filter-btn ${selectedStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => handleStatusChange('rejected')}
          >
            Rejected ({contracts.filter(c => c.status === 'rejected').length})
          </button>
        </div>

        <button 
          className="refresh-btn"
          onClick={fetchContractsForReview}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Contracts List */}
      <div className="contracts-section">
        <div className="section-header">
          <h2>
            {selectedStatus === 'under_review' && 'Contracts Pending Review'}
            {selectedStatus === 'reviewed' && 'Reviewed Contracts'}
            {selectedStatus === 'rejected' && 'Rejected Contracts'}
            ({filteredContracts.length})
          </h2>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <h3>No contracts found</h3>
            <p>{selectedStatus === 'under_review' 
              ? 'No contracts are currently pending review' 
              : selectedStatus === 'reviewed'
              ? 'No contracts have been reviewed yet'
              : 'No contracts have been rejected'}
            </p>
          </div>
        ) : (
          <div className="contracts-grid">
            {filteredContracts.map((contract) => (
              <div key={contract.id} className="contract-card">
                <div className="card-header">
                  <div className="contract-meta">
                    <span className="meta-item">
                      <Clock size={12} />
                      {getDaysSince(contract.uploaded_at)}
                    </span>
                    {contract.comprehensive_data?.review_flags?.length > 0 && (
                      <span className="meta-item flagged">
                        <Flag size={12} />
                        {contract.comprehensive_data.review_flags.length} flags
                      </span>
                    )}
                    {contract.comprehensive_data?.review_history?.length > 0 && (
                      <span className="meta-item comments">
                        <MessageSquare size={12} />
                        {contract.comprehensive_data.review_history.length} comments
                      </span>
                    )}
                  </div>
                  <div className="contract-status">
                    <span className={`status-badge ${contract.status}`}>
                      {contract.status}
                    </span>
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
                    ID: {getContractDisplayId(contract)}
                    {contract.contract_number && (
                      <span className="contract-number"> • #{contract.contract_number}</span>
                    )}
                  </p>

                  <div className="contract-details">
                    <div className="detail-item">
                      <Building size={14} />
                      <span>{contract.grantor || 'No grantor'}</span>
                    </div>
                    <div className="detail-item">
                      <DollarSign size={14} />
                      <span>{formatCurrency(contract.total_amount)}</span>
                    </div>
                  </div>

                  {contract.purpose && (
                    <div className="contract-purpose">
                      <p>{contract.purpose.length > 100 ? contract.purpose.substring(0, 100) + '...' : contract.purpose}</p>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button 
                    className="btn-view"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                  {selectedStatus === 'under_review' && (
                    <button 
                      className="btn-review"
                      onClick={() => navigate(`/review-contract/${contract.id}`)}
                    >
                      Start Review
                      <ChevronRight size={16} />
                    </button>
                  )}
                  {selectedStatus === 'rejected' && (
                    <button 
                      className="btn-download"
                      onClick={() => {
                        // Handle download
                      }}
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Review;