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
        
        const filteredAgreements = data.drafts?.filter(draft => {
          if (!draft) return false;
          
          // For program managers, check if they're in assigned_pgm_users array
          if (user.role === 'program_manager') {
            // Handle both array and string formats
            let pgmUsers = draft.assigned_pgm_users;
            
            // If it's a string, try to parse it
            if (typeof pgmUsers === 'string') {
              try {
                pgmUsers = JSON.parse(pgmUsers);
              } catch (e) {
                // If not valid JSON, try comma-separated
                pgmUsers = pgmUsers.split(',').map(id => id.trim()).filter(id => id);
              }
            }
            
            return Array.isArray(pgmUsers) && pgmUsers.includes(user.id);
          }
          
          // For directors, check if they're in assigned_director_users array
          if (user.role === 'director') {
            // Handle both array and string formats
            let directorUsers = draft.assigned_director_users;
            
            // If it's a string, try to parse it
            if (typeof directorUsers === 'string') {
              try {
                directorUsers = JSON.parse(directorUsers);
              } catch (e) {
                // If not valid JSON, try comma-separated
                directorUsers = directorUsers.split(',').map(id => id.trim()).filter(id => id);
              }
            }
            
            return Array.isArray(directorUsers) && directorUsers.includes(user.id);
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
      <tr key={agreement.id || index} className="aap-agreement-row">
        <td>
          <div className="aap-agreement-info-list">
            <div className="aap-agreement-name-list">
              {agreement.grant_name || agreement.filename || 'Unnamed Agreement'}
            </div>
            <div className="aap-assigned-by-info">
              <UserCog size={12} />
              <span className="aap-assigned-by-text">
                Assigned by: {assignedBy.name} ({assignedBy.role})
              </span>
              <span className="aap-assigned-date">on {assignedAt}</span>
            </div>
          </div>
        </td>
        <td>
          <div className="aap-agreement-id-list">
            {agreement.id || 'N/A'}
          </div>
        </td>
        <td>
          <div className="aap-grantor-cell">
            <span>{agreement.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="aap-amount-cell">
            <span>{formatCurrency(agreement.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="aap-date-cell">
            <span>{formatDate(agreement.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="aap-status-cell">
            <span className={`aap-status-text ${agreement.status || 'draft'}`}>
              {agreement.status ? agreement.status.replace('_', ' ') : 'Draft'}
            </span>
            <div className="aap-user-role-badge">
              {user.role === 'program_manager' ? (
                <Shield size={12} />
              ) : (
                <Award size={12} />
              )}
              <span className="aap-role-text">
                {user.role === 'program_manager' ? 'PGM' : 'Director'}
              </span>
            </div>
          </div>
        </td>
        <td>
          <div className="aap-action-buttons">
            <button 
              className="aap-btn-action"
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
      <div key={agreement.id || index} className="aap-agreement-card">
        <div className="aap-card-header">
          <div className="aap-agreement-status">
            <span className={`aap-status-badge ${agreement.status || 'draft'}`}>
              {agreement.status ? agreement.status.replace('_', ' ') : 'Draft'}
            </span>
            <span className="aap-status-badge aap-assigned">
              {user.role === 'program_manager' ? 'PGM Assigned' : 'Director Assigned'}
            </span>
          </div>
          <div className="aap-card-actions">
            <button 
              className="aap-btn-action"
              onClick={() => handleViewAgreement(agreement.id)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        <div className="aap-card-content">
          <div className="aap-agreement-icon">
            <FileText size={24} />
          </div>
          <h3 className="aap-agreement-name">
            {agreement.grant_name || agreement.filename || 'Unnamed Agreement'}
          </h3>
          <p className="aap-agreement-id">
            ID: {agreement.id || 'N/A'}
          </p>

          <div className="aap-assigned-by-section">
            <div className="aap-assigned-by-header">
              <UserCog size={14} />
              <span>Assigned by:</span>
            </div>
            <div className="aap-assigned-by-details">
              <div className="aap-assigner-name">{assignedBy.name}</div>
              <div className="aap-assigner-role">{assignedBy.role}</div>
              <div className="aap-assigner-date">on {assignedAt}</div>
            </div>
          </div>

          <div className="aap-agreement-details">
            <div className="aap-detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(agreement.total_amount)}</span>
            </div>
            <div className="aap-detail-item">
              <Building size={14} />
              <span>{agreement.grantor || 'No grantor'}</span>
            </div>
            <div className="aap-detail-item">
              <Calendar size={14} />
              <span>{formatDate(agreement.uploaded_at)}</span>
            </div>
            <div className="aap-detail-item">
              {user.role === 'program_manager' ? (
                <Shield size={14} />
              ) : (
                <Award size={14} />
              )}
              <span>{user.role === 'program_manager' ? 'Program Manager' : 'Director'}</span>
            </div>
          </div>

          {agreement.purpose && (
            <div className="aap-agreement-purpose">
              <p>{agreement.purpose.length > 100 ? agreement.purpose.substring(0, 100) + '...' : agreement.purpose}</p>
            </div>
          )}
        </div>

        <div className="aap-card-footer">
          <button 
            className="aap-btn-view"
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
    <div className="aap-assigned-agreements-page">
      <div className="aap-agreements-header">
        <div className="aap-header-left">
        </div>
        <div className="aap-header-actions">
          <button 
            className="aap-btn-refresh"
            onClick={fetchAssignedAgreements}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'aap-spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="aap-agreements-controls">
        <div className="aap-search-container">
          <Search className="aap-search-icon" />
          <input
            type="text"
            placeholder="Search assigned agreements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="aap-search-input"
          />
        </div>

        <div className="aap-controls-right">
          <div className="aap-view-toggle">
            <button 
              className={`aap-view-btn ${activeView === 'list' ? 'aap-active' : ''}`}
              onClick={() => setActiveView('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button 
              className={`aap-view-btn ${activeView === 'grid' ? 'aap-active' : ''}`}
              onClick={() => setActiveView('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="aap-agreements-content">
        {loading ? (
          <div className="aap-loading-state">
            <Loader2 className="aap-spinner" />
            <p>Loading assigned agreements...</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="aap-empty-state">
            <FileText size={48} />
            <h3>No agreements assigned to you yet</h3>
            <p>
              You will see agreements here when they are assigned to you by Project Managers
            </p>
          </div>
        ) : (
          <>
            <div className="aap-results-header">
              <span className="aap-results-count">
                Showing {filteredAgreements.length} assigned agreement(s)
              </span>
            </div>

            {activeView === 'list' ? (
              <div className="aap-agreements-table-container">
                <table className="aap-agreements-table">
                  <thead>
                    <tr>
                      <th className="aap-table-header">Agreement Name</th>
                      <th className="aap-table-header">Agreement ID</th>
                      <th className="aap-table-header">Grantor</th>
                      <th className="aap-table-header">Amount</th>
                      <th className="aap-table-header">Upload Date</th>
                      <th className="aap-table-header">Status</th>
                      <th className="aap-table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgreements.map((agreement, index) => renderAgreementRow(agreement, index))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="aap-agreements-grid">
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