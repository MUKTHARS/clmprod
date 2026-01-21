import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Download,
  Calendar,
  User,
  Building,
  DollarSign,
  Shield,
  TrendingUp,
  Lock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Loader2,
  BarChart3,
  MessageSquare,
  Clock,
  Award
} from 'lucide-react';
import API_CONFIG from '../../config';

function ProgramManagerDirectorDecisions() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    approved: 0,
    rejected: 0,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDirectorDecisions();
  }, []);

  const fetchDirectorDecisions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/program-manager/reviewed-by-director`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
        setStats(data.summary || { approved: 0, rejected: 0, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch director decisions:', error);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now - then;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const filteredContracts = contracts.filter(contract => {
    // Search filter
    if (searchTerm && !contract.grant_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !contract.grantor?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && contract.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <Loader2 size={48} className="spinning" />
          <h3>Loading Director Decisions</h3>
          <p>Fetching contracts reviewed by you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="program-manager-decisions">
      {/* Header */}
      <div className="decisions-header">
        <div className="header-left">
          <h1>Director Decisions</h1>
          <p className="page-subtitle">
            View final decisions on contracts you reviewed
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={fetchDirectorDecisions}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Reviewed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved by Director</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Rejected by Director</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-value">
              {contracts.filter(c => c.director_decision).length}
            </span>
            <span className="stat-label">With Comments</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search contracts..."
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
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Contracts List */}
      <div className="contracts-section">
        <div className="section-header">
          <h2>Contracts with Director Decisions ({filteredContracts.length})</h2>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No decisions yet</h3>
            <p>Contracts you review will appear here after Director makes a decision</p>
          </div>
        ) : (
          <div className="contracts-grid">
            {filteredContracts.map(contract => (
              <div key={contract.id} className="decision-card">
                {/* Header with status */}
                <div className="card-header">
                  <div className={`status-badge ${contract.status}`}>
                    {contract.status === 'approved' ? (
                      <>
                        <CheckCircle size={14} />
                        <span>Approved by Director</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        <span>Rejected by Director</span>
                      </>
                    )}
                  </div>
                  
                  <div className="card-meta">
                    <span className="meta-item">
                      <Clock size={12} />
                      {getTimeAgo(contract.director_decided_at)}
                    </span>
                  </div>
                </div>

                {/* Contract Info */}
                <div className="card-content">
                  <div className="contract-icon">
                    <FileText size={24} />
                  </div>
                  
                  <h3 className="contract-name">
                    {contract.grant_name || contract.filename}
                  </h3>
                  
                  <div className="contract-meta">
                    <div className="meta-item">
                      <Building size={14} />
                      <span>{contract.grantor || 'No grantor'}</span>
                    </div>
                    <div className="meta-item">
                      <DollarSign size={14} />
                      <span>{formatCurrency(contract.total_amount)}</span>
                    </div>
                  </div>

                  {/* Your Recommendation vs Director Decision */}
                  <div className="decision-comparison">
                    <div className="comparison-row">
                      <div className="comparison-item">
                        <span className="comparison-label">Your Recommendation:</span>
                        <span className={`recommendation-badge ${contract.program_manager_recommendation}`}>
                          {contract.program_manager_recommendation}
                        </span>
                      </div>
                      <div className="comparison-item">
                        <span className="comparison-label">Director Decision:</span>
                        <span className={`decision-badge ${contract.director_decision_status}`}>
                          {contract.director_decision_status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Decision Outcome */}
                    <div className="outcome-indicator">
                      {contract.program_manager_recommendation === contract.director_decision_status ? (
                        <div className="outcome-match">
                          <CheckCircle size={16} />
                          <span>Director agreed with your recommendation</span>
                        </div>
                      ) : (
                        <div className="outcome-mismatch">
                          <AlertCircle size={16} />
                          <span>Director made a different decision</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Director Comments */}
                  {contract.director_decision_comments && (
                    <div className="director-comments">
                      <h4>Director's Comments:</h4>
                      <div className="comments-box">
                        <p>{contract.director_decision_comments}</p>
                        <div className="comments-footer">
                          <span className="comment-author">
                            <User size={12} />
                            {contract.director_name || 'Director'}
                          </span>
                          <span className="comment-date">
                            {formatDate(contract.director_decided_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="additional-info">
                    {contract.is_locked && (
                      <div className="info-item">
                        <Lock size={14} />
                        <span>Contract Locked</span>
                      </div>
                    )}
                    {contract.risk_accepted && (
                      <div className="info-item">
                        <Shield size={14} />
                        <span>Risk Accepted</span>
                      </div>
                    )}
                    {contract.business_sign_off && (
                      <div className="info-item">
                        <TrendingUp size={14} />
                        <span>Business Sign-off</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="card-footer">
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <Eye size={16} />
                    View Contract
                  </button>
                  
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate(`/contracts/${contract.id}/reviews`)}
                  >
                    <MessageSquare size={16} />
                    View Reviews
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add CSS styles */}
      <style jsx>{`
        .program-manager-decisions {
          padding: 2rem;
          max-width: 100%;
          min-height: 100vh;
          background: #f9fafb;
        }
        
        .decisions-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        
        .header-left h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        
        .page-subtitle {
          color: #6b7280;
          font-size: 1.1rem;
        }
        
        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .search-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: center;
        }
        
        .search-container {
          flex: 1;
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }
        
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .filter-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #6b7280;
        }
        
        .filter-select {
          border: none;
          background: none;
          color: #374151;
          font-size: 0.875rem;
          cursor: pointer;
          outline: none;
        }
        
        .contracts-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .section-header h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1f2937;
        }
        
        .contracts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        
        .decision-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .decision-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-badge.approved {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-badge.rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .card-meta {
          display: flex;
          gap: 0.75rem;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #6b7280;
          font-size: 0.75rem;
        }
        
        .card-content {
          padding: 1.5rem;
        }
        
        .contract-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: #eff6ff;
          border-radius: 12px;
          margin-bottom: 1rem;
          color: #3b82f6;
        }
        
        .contract-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1f2937;
        }
        
        .contract-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .contract-meta .meta-item {
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        .decision-comparison {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        
        .comparison-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .comparison-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .comparison-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .recommendation-badge,
        .decision-badge {
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
          text-transform: capitalize;
        }
        
        .recommendation-badge.approve,
        .decision-badge.approve {
          background: #dcfce7;
          color: #166534;
        }
        
        .recommendation-badge.reject,
        .decision-badge.reject {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .recommendation-badge.modify {
          background: #fef3c7;
          color: #92400e;
        }
        
        .outcome-indicator {
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        
        .outcome-match {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #059669;
          background: #f0fdf4;
          padding: 0.5rem;
          border-radius: 6px;
        }
        
        .outcome-mismatch {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #d97706;
          background: #fffbeb;
          padding: 0.5rem;
          border-radius: 6px;
        }
        
        .director-comments {
          margin-bottom: 1.5rem;
        }
        
        .director-comments h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #374151;
        }
        
        .comments-box {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .comments-box p {
          color: #4b5563;
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        
        .comments-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid #f3f4f6;
        }
        
        .comment-author {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .comment-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        
        .additional-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 0.75rem;
          color: #4b5563;
        }
        
        .card-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .btn-primary,
        .btn-secondary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.875rem;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        
        .btn-secondary:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: #6b7280;
        }
        
        .empty-state svg {
          color: #9ca3af;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        
        .empty-state p {
          margin-bottom: 1.5rem;
        }
        
        .loading-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          text-align: center;
        }
        
        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default ProgramManagerDirectorDecisions;