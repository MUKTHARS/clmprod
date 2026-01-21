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
  BarChart3,
  TrendingUp,
  RefreshCw,
  Loader2
} from 'lucide-react';
import API_CONFIG from '../config';

function ProgramManagerDashboard() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('under_review');
  const navigate = useNavigate();

  useEffect(() => {
    fetchContractsForReview();
  }, []);

  const fetchContractsForReview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/status/under_review`, {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysSince = (dateString) => {
    if (!dateString) return 'N/A';
    const now = new Date();
    const then = new Date(dateString);
    const diffTime = Math.abs(now - then);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  const filteredContracts = contracts.filter(contract => 
    searchTerm === '' ||
    (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="program-manager-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Contract Reviews</h1>
          {/* <p className="page-subtitle">
            Review and provide feedback on submitted contracts
          </p> */}
        </div>
        <div className="header-actions">
          <button 
            className="btn-icon"
            onClick={fetchContractsForReview}
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{contracts.length}</span>
            <span className="stat-label">Pending Reviews</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">
              {contracts.filter(c => new Date(c.uploaded_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </span>
            <span className="stat-label">New This Week</span>
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
              {contracts.filter(c => c.comprehensive_data?.review_flags?.length > 0).length}
            </span>
            <span className="stat-label">With Flags</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search contracts for review..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="under_review">Under Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Status</option>
          </select>
        </div>
      </div>

      {/* Contracts List */}
      <div className="contracts-section">
        <div className="section-header">
          <h2>Contracts for Review ({filteredContracts.length})</h2>
          <div className="section-actions">
            <span className="sort-label">Sort by: Submission Date</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Loading contracts for review...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} />
            <h3>No contracts to review</h3>
            <p>All submitted contracts have been reviewed or are awaiting submission.</p>
          </div>
        ) : (
          <div className="contracts-grid">
            {filteredContracts.map((contract) => (
              <div key={contract.id} className="review-contract-card">
                <div className="card-header">
                  <div className="contract-meta">
                    <span className="meta-item">
                      <Clock size={12} />
                      {getDaysSince(contract.uploaded_at)}
                    </span>
                    {contract.comprehensive_data?.review_flags?.length > 0 && (
                      <span className="meta-item flagged">
                        <AlertCircle size={12} />
                        {contract.comprehensive_data.review_flags.length} flags
                      </span>
                    )}
                  </div>
                  <div className="card-actions">
                    <button 
                      className="btn-view"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                <div className="card-content">
                  <div className="contract-icon">
                    <FileText size={24} />
                  </div>
                  <h3 className="contract-name">
                    {contract.grant_name || contract.filename}
                  </h3>
                  <p className="contract-id">
                    ID: {contract.investment_id ? `INV-${contract.investment_id}` : 
                         contract.project_id ? `PRJ-${contract.project_id}` : 
                         contract.grant_id ? `GRANT-${contract.grant_id}` : 
                         `CONT-${contract.id}`}
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
                    className="btn-review"
                    onClick={() => navigate(`/review-contract/${contract.id}`)}
                  >
                    Start Review
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgramManagerDashboard;