// C:\saple.ai\POC\frontend\src\pages\AssignedAgreementsPage.jsx
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
  Users,
  Loader2,
  FolderOpen,
  UserCheck,
  Edit,
  Trash2,
  Share2,
  DollarSign,
  Building,
  FileArchive,
  ArrowLeft,
  Plus,
  Grid,
  List,
  Download,
  X,
  ChevronDown,
  UserPlus,
  UserCog,
  ChevronsRight,
  UserX,
  MoreHorizontal,
  Shield,
  Award
} from 'lucide-react';
import API_CONFIG from '../config';
import './AssignedAgreementsPage.css';

function AssignedAgreementsPage({ user }) {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAssignedAgreements();
  }, []);

  const fetchAssignedAgreements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Use the existing endpoint that already handles all roles
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/assigned-drafts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Assigned agreements response:', data);
        
        // Filter agreements based on user role
        const filteredAgreements = data.drafts?.filter(draft => {
          if (!draft) return false;
          
          // For program managers, check if they're in assigned_pgm_users
          if (user.role === 'program_manager') {
            return draft.assigned_pgm_users && Array.isArray(draft.assigned_pgm_users) && 
                   draft.assigned_pgm_users.includes(user.id);
          }
          
          // For directors, check if they're in assigned_director_users
          if (user.role === 'director') {
            return draft.assigned_director_users && Array.isArray(draft.assigned_director_users) && 
                   draft.assigned_director_users.includes(user.id);
          }
          
          return false;
        }) || [];
        
        setAgreements(filteredAgreements);
      } else {
        console.error('Failed to fetch assigned agreements');
        // Fallback to local storage or empty array
        const savedAgreements = JSON.parse(localStorage.getItem('user_agreements') || '[]');
        setAgreements(savedAgreements);
      }
    } catch (error) {
      console.error('Failed to fetch assigned agreements:', error);
      const savedAgreements = JSON.parse(localStorage.getItem('user_agreements') || '[]');
      setAgreements(savedAgreements);
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

  const handleViewAgreement = (agreementId) => {
    navigate(`/contracts/${agreementId}`);
  };

  const filteredAgreements = agreements.filter(agreement => {
    if (!agreement) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (agreement.grant_name && agreement.grant_name.toLowerCase().includes(searchLower)) ||
        (agreement.filename && agreement.filename.toLowerCase().includes(searchLower)) ||
        (agreement.contract_number && agreement.contract_number.toString().toLowerCase().includes(searchLower)) ||
        (agreement.grantor && agreement.grantor.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const renderAgreementRow = (agreement, index) => {
    const assignedBy = agreement.assigned_by || { name: "Unknown", role: "Unknown" };
    const assignedAt = agreement.assigned_at ? formatDate(agreement.assigned_at) : "Unknown";

    return (
      <tr key={agreement.id || index} className="agreement-row">
        <td>
          <div className="agreement-info-list">
            <div className="agreement-name-list">
              {agreement.grant_name || agreement.filename || 'Unnamed Agreement'}
            </div>
            <div className="assigned-by-info">
              <UserCog size={12} />
              <span className="assigned-by-text">
                Assigned by: {assignedBy.name} ({assignedBy.role})
              </span>
              <span className="assigned-date">on {assignedAt}</span>
            </div>
          </div>
        </td>
        <td>
          <div className="agreement-id-list">
            {agreement.id || 'N/A'}
          </div>
        </td>
        <td>
          <div className="grantor-cell">
            <span>{agreement.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="amount-cell">
            <span>{formatCurrency(agreement.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{formatDate(agreement.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="status-cell">
            <span className={`status-text ${agreement.status || 'draft'}`}>
              {agreement.status ? agreement.status.replace('_', ' ') : 'Draft'}
            </span>
            <div className="user-role-badge">
              {user.role === 'program_manager' ? (
                <Shield size={12} />
              ) : (
                <Award size={12} />
              )}
              <span className="role-text">
                {user.role === 'program_manager' ? 'PGM' : 'Director'}
              </span>
            </div>
          </div>
        </td>
        <td>
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => handleViewAgreement(agreement.id)}
              title="View details"
            >
              <Eye size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderAgreementCard = (agreement, index) => {
    const assignedBy = agreement.assigned_by || { name: "Unknown", role: "Unknown" };
    const assignedAt = agreement.assigned_at ? formatDate(agreement.assigned_at) : "Unknown";

    return (
      <div key={agreement.id || index} className="agreement-card">
        <div className="card-header">
          <div className="agreement-status">
            <span className={`status-badge ${agreement.status || 'draft'}`}>
              {agreement.status ? agreement.status.replace('_', ' ') : 'Draft'}
            </span>
            <span className="status-badge assigned">
              {user.role === 'program_manager' ? 'PGM Assigned' : 'Director Assigned'}
            </span>
          </div>
          <div className="card-actions">
            <button 
              className="btn-action"
              onClick={() => handleViewAgreement(agreement.id)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        <div className="card-content">
          <div className="agreement-icon">
            <FileText size={24} />
          </div>
          <h3 className="agreement-name">
            {agreement.grant_name || agreement.filename || 'Unnamed Agreement'}
          </h3>
          <p className="agreement-id">
            ID: {agreement.id || 'N/A'}
          </p>

          <div className="assigned-by-section">
            <div className="assigned-by-header">
              <UserCog size={14} />
              <span>Assigned by:</span>
            </div>
            <div className="assigned-by-details">
              <div className="assigner-name">{assignedBy.name}</div>
              <div className="assigner-role">{assignedBy.role}</div>
              <div className="assigner-date">on {assignedAt}</div>
            </div>
          </div>

          <div className="agreement-details">
            <div className="detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(agreement.total_amount)}</span>
            </div>
            <div className="detail-item">
              <Building size={14} />
              <span>{agreement.grantor || 'No grantor'}</span>
            </div>
            <div className="detail-item">
              <Calendar size={14} />
              <span>{formatDate(agreement.uploaded_at)}</span>
            </div>
            <div className="detail-item">
              {user.role === 'program_manager' ? (
                <Shield size={14} />
              ) : (
                <Award size={14} />
              )}
              <span>{user.role === 'program_manager' ? 'Program Manager' : 'Director'}</span>
            </div>
          </div>

          {agreement.purpose && (
            <div className="agreement-purpose">
              <p>{agreement.purpose.length > 100 ? agreement.purpose.substring(0, 100) + '...' : agreement.purpose}</p>
            </div>
          )}
        </div>

        <div className="card-footer">
          <button 
            className="btn-view"
            onClick={() => handleViewAgreement(agreement.id)}
          >
            View Agreement Details
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="assigned-agreements-page">
      <div className="agreements-header">
        <div className="header-left">

          <h1>
            Agreements Assigned to Me
          </h1>
          <p className="page-subtitle">
            Agreements assigned to you for review or collaboration
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={fetchAssignedAgreements}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="agreements-controls">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search assigned agreements..."
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

      <div className="agreements-content">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Loading assigned agreements...</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No agreements assigned to you yet</h3>
            <p>
              You will see agreements here when they are assigned to you by Project Managers
            </p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <span className="results-count">
                Showing {filteredAgreements.length} assigned agreement(s)
              </span>
            </div>

            {activeView === 'list' ? (
              <div className="agreements-table-container">
                <table className="agreements-table">
                  <thead>
                    <tr>
                      <th className="table-header">Agreement Name</th>
                      <th className="table-header">Agreement ID</th>
                      <th className="table-header">Grantor</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">Upload Date</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgreements.map((agreement, index) => renderAgreementRow(agreement, index))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="agreements-grid">
                {filteredAgreements.map((agreement, index) => renderAgreementCard(agreement, index))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AssignedAgreementsPage;