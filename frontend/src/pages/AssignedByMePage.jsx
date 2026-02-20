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
  Award,
  UserCheck as UserCheckIcon
} from 'lucide-react';
import API_CONFIG from '../config';
import './AssignedByMePage.css';

function AssignedByMePage({ user }) {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('list');
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [expandedAssignments, setExpandedAssignments] = useState({});

  useEffect(() => {
    fetchAssignedByMeAgreements();
  }, []);

  const fetchAssignedByMeAgreements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/assigned-by-me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Assigned by me response:', data);
        setAgreements(data.drafts || []);
        setAssignmentStats(data.assignment_summary || null);
      } else {
        console.error('Failed to fetch assigned by me agreements');
        setAgreements([]);
        setAssignmentStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch assigned by me agreements:', error);
      setAgreements([]);
      setAssignmentStats(null);
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

  const toggleAssignmentsExpanded = (agreementId) => {
    setExpandedAssignments(prev => ({
      ...prev,
      [agreementId]: !prev[agreementId]
    }));
  };

  const renderAssignedUsersList = (agreement) => {
    if (!agreement.all_assigned_users || agreement.all_assigned_users.length === 0) {
      return null;
    }

    const isExpanded = expandedAssignments[agreement.id];
    const pmUsers = agreement.all_assigned_users.filter(u => u.assignment_type === 'project_manager');
    const pgmUsers = agreement.all_assigned_users.filter(u => u.assignment_type === 'program_manager');
    const directorUsers = agreement.all_assigned_users.filter(u => u.assignment_type === 'director');

    return (
      <div className="abm-assigned-users-list">
        <div className="abm-assigned-users-summary">
          <Users size={12} />
          <span>
            {pmUsers.length} PM{pmUsers.length !== 1 ? 's' : ''} • {pgmUsers.length} PGM{pgmUsers.length !== 1 ? 's' : ''} • {directorUsers.length} Director{directorUsers.length !== 1 ? 's' : ''}
          </span>
          <button 
            className="abm-toggle-assignments"
            onClick={() => toggleAssignmentsExpanded(agreement.id)}
          >
            {isExpanded ? 'Show less' : 'Show all'}
            <ChevronDown size={12} className={isExpanded ? 'abm-expanded' : ''} />
          </button>
        </div>
        
        {isExpanded && (
          <div className="abm-assigned-users-details">
            {pmUsers.length > 0 && (
              <div className="abm-assigned-role-group">
                <div className="abm-role-header">Project Managers:</div>
                {pmUsers.map(user => (
                  <div key={user.id} className="abm-assigned-user-item">
                    <User size={10} />
                    <span className="abm-user-name">{user.name}</span>
                    <span className="abm-user-badge abm-pm">PM</span>
                  </div>
                ))}
              </div>
            )}
            
            {pgmUsers.length > 0 && (
              <div className="abm-assigned-role-group">
                <div className="abm-role-header">Program Managers:</div>
                {pgmUsers.map(user => (
                  <div key={user.id} className="abm-assigned-user-item">
                    <User size={10} />
                    <span className="abm-user-name">{user.name}</span>
                    <span className="abm-user-badge abm-pgm">PGM</span>
                  </div>
                ))}
              </div>
            )}
            
            {directorUsers.length > 0 && (
              <div className="abm-assigned-role-group">
                <div className="abm-role-header">Directors:</div>
                {directorUsers.map(user => (
                  <div key={user.id} className="abm-assigned-user-item">
                    <User size={10} />
                    <span className="abm-user-name">{user.name}</span>
                    <span className="abm-user-badge abm-director">Director</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
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
        (agreement.grantor && agreement.grantor.toLowerCase().includes(searchLower)) ||
        (agreement.all_assigned_users && agreement.all_assigned_users.some(user => 
          user.name && user.name.toLowerCase().includes(searchLower)
        ))
      );
    }
    return true;
  });

  const renderAgreementRow = (agreement, index) => {
    const assignedAt = agreement.assigned_at ? formatDate(agreement.assigned_at) : "Unknown";

    return (
      <tr key={agreement.id || index} className="abm-agreement-row">
        <td>
          <div className="abm-agreement-info-list">
            <div className="abm-agreement-name-list">
              {agreement.grant_name || agreement.filename || 'Unnamed Agreement'}
            </div>
            <div className="abm-assigned-by-info">
              <UserCheckIcon size={12} />
              <span className="abm-assigned-by-text">
                You assigned this agreement on {assignedAt}
              </span>
            </div>
            {renderAssignedUsersList(agreement)}
          </div>
        </td>
        <td>
          <div className="abm-agreement-id-list">
            {agreement.id || 'N/A'}
          </div>
        </td>
        <td>
          <div className="abm-grantor-cell">
            <span>{agreement.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="abm-amount-cell">
            <span>{formatCurrency(agreement.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="abm-date-cell">
            <span>{formatDate(agreement.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="abm-date-cell">
            <span>{formatDate(agreement.assigned_at)}</span>
          </div>
        </td>
        <td>
          <div className="abm-status-cell">
            <span className="abm-status-text abm-draft">Draft</span>
            <div className="abm-assignment-role">
              <UserCheckIcon size={12} />
              <span className="abm-role-text">
                Assigned by You
              </span>
            </div>
          </div>
        </td>
        <td>
          <div className="abm-action-buttons">
            <button 
              className="abm-btn-action"
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
    const assignedAt = agreement.assigned_at ? formatDate(agreement.assigned_at) : "Unknown";

    return (
      <div key={agreement.id || index} className="abm-agreement-card">
        <div className="abm-card-header">
          <div className="abm-agreement-status">
            <span className="abm-status-badge abm-draft">Draft</span>
            <span className="abm-status-badge abm-assigned">Assigned by You</span>
          </div>
          <div className="abm-card-actions">
            <button 
              className="abm-btn-action"
              onClick={() => handleViewAgreement(agreement.id)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        <div className="abm-card-content">
          <div className="abm-agreement-icon">
            <FileText size={24} />
          </div>
          <h3 className="abm-agreement-name">
            {agreement.grant_name || agreement.filename || 'Unnamed Agreement'}
          </h3>
          <p className="abm-agreement-id">
            ID: {agreement.id || 'N/A'}
          </p>

          <div className="abm-assigned-by-section">
            <div className="abm-assigned-by-header">
              <UserCheckIcon size={14} />
              <span>Assigned by:</span>
            </div>
            <div className="abm-assigned-by-details">
              <div className="abm-assigner-name">You ({user.role.replace('_', ' ')})</div>
              <div className="abm-assigner-date">on {assignedAt}</div>
            </div>
          </div>

          {agreement.all_assigned_users && agreement.all_assigned_users.length > 0 && (
            <div className="abm-all-assigned-users">
              <div className="abm-assigned-users-header">
                <Users size={12} />
                <span>Assigned Users:</span>
                <span className="abm-assigned-count">
                  ({agreement.all_assigned_users.length} total)
                </span>
              </div>
              <div className="abm-assigned-users-chips">
                {agreement.all_assigned_users.slice(0, 3).map(user => (
                  <div key={user.id} className="abm-user-chip">
                    <User size={10} />
                    <span className="abm-chip-name">{user.name.split(' ')[0]}</span>
                    <span className={`abm-chip-role ${user.assignment_type}`}>
                      {user.assignment_type === 'project_manager' ? 'PM' : 
                       user.assignment_type === 'program_manager' ? 'PGM' : 'DIR'}
                    </span>
                  </div>
                ))}
                {agreement.all_assigned_users.length > 3 && (
                  <div className="abm-user-chip abm-more">
                    +{agreement.all_assigned_users.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="abm-agreement-details">
            <div className="abm-detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(agreement.total_amount)}</span>
            </div>
            <div className="abm-detail-item">
              <Building size={14} />
              <span>{agreement.grantor || 'No grantor'}</span>
            </div>
            <div className="abm-detail-item">
              <Calendar size={14} />
              <span>{formatDate(agreement.uploaded_at)}</span>
            </div>
            <div className="abm-detail-item">
              <Users size={14} />
              <span>{agreement.all_assigned_users?.length || 0} assigned</span>
            </div>
          </div>

          {agreement.purpose && (
            <div className="abm-agreement-purpose">
              <p>{agreement.purpose.length > 100 ? agreement.purpose.substring(0, 100) + '...' : agreement.purpose}</p>
            </div>
          )}
        </div>

        <div className="abm-card-footer">
          <button 
            className="abm-btn-view"
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
    <div className="abm-assigned-by-me-page">
      <div className="abm-agreements-header">
        <div className="abm-header-left">
          {assignmentStats && (
            <div className="abm-assignment-stats">
              <div className="abm-stat-item">
                <Users size={14} />
                <span>Total Agreements: {assignmentStats.total_agreements}</span>
              </div>
              <div className="abm-stat-item">
                <User size={14} />
                <span>Total PMs Assigned: {assignmentStats.total_assigned_pms}</span>
              </div>
              <div className="abm-stat-item">
                <Shield size={14} />
                <span>Total PGMs Assigned: {assignmentStats.total_assigned_pgms}</span>
              </div>
              <div className="abm-stat-item">
                <Award size={14} />
                <span>Total Directors Assigned: {assignmentStats.total_assigned_directors}</span>
              </div>
            </div>
          )}
        </div>
        <div className="abm-header-actions">
          <button 
            className="abm-btn-refresh"
            onClick={fetchAssignedByMeAgreements}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'abm-spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="abm-agreements-controls">
        <div className="abm-search-container">
          <Search className="abm-search-icon" />
          <input
            type="text"
            placeholder="Search agreements assigned by you..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="abm-search-input"
          />
        </div>

        <div className="abm-controls-right">
          <div className="abm-view-toggle">
            <button 
              className={`abm-view-btn ${activeView === 'list' ? 'abm-active' : ''}`}
              onClick={() => setActiveView('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button 
              className={`abm-view-btn ${activeView === 'grid' ? 'abm-active' : ''}`}
              onClick={() => setActiveView('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="abm-agreements-content">
        {loading ? (
          <div className="abm-loading-state">
            <Loader2 className="abm-spinner" />
            <p>Loading agreements assigned by you...</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="abm-empty-state">
            <FileText size={48} />
            <h3>No agreements assigned by you yet</h3>
            <p>
              You will see agreements here when you assign them to other users via the workflow
            </p>
            <button 
              className="abm-btn-primary"
              onClick={() => navigate('/contracts')}
            >
              View All Agreements
            </button>
          </div>
        ) : (
          <>
            <div className="abm-results-header">
              <span className="abm-results-count">
                Showing {filteredAgreements.length} agreement(s) assigned by you
              </span>
            </div>

            {activeView === 'list' ? (
              <div className="abm-agreements-table-container">
                <table className="abm-agreements-table">
                  <thead>
                    <tr>
                      <th className="abm-table-header">Agreement Name</th>
                      <th className="abm-table-header">Agreement ID</th>
                      <th className="abm-table-header">Grantor</th>
                      <th className="abm-table-header">Amount</th>
                      <th className="abm-table-header">Upload Date</th>
                      <th className="abm-table-header">Assigned Date</th>
                      <th className="abm-table-header">Status</th>
                      <th className="abm-table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgreements.map((agreement, index) => renderAgreementRow(agreement, index))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="abm-agreements-grid">
                {filteredAgreements.map((agreement, index) => renderAgreementCard(agreement, index))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AssignedByMePage;