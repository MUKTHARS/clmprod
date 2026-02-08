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
      <div className="assigned-users-list">
        <div className="assigned-users-summary">
          <Users size={12} />
          <span>
            {pmUsers.length} PM{pmUsers.length !== 1 ? 's' : ''} • {pgmUsers.length} PGM{pgmUsers.length !== 1 ? 's' : ''} • {directorUsers.length} Director{directorUsers.length !== 1 ? 's' : ''}
          </span>
          <button 
            className="toggle-assignments"
            onClick={() => toggleAssignmentsExpanded(agreement.id)}
          >
            {isExpanded ? 'Show less' : 'Show all'}
            <ChevronDown size={12} className={isExpanded ? 'expanded' : ''} />
          </button>
        </div>
        
        {isExpanded && (
          <div className="assigned-users-details">
            {pmUsers.length > 0 && (
              <div className="assigned-role-group">
                <div className="role-header">Project Managers:</div>
                {pmUsers.map(user => (
                  <div key={user.id} className="assigned-user-item">
                    <User size={10} />
                    <span className="user-name">{user.name}</span>
                    <span className="user-badge pm">PM</span>
                  </div>
                ))}
              </div>
            )}
            
            {pgmUsers.length > 0 && (
              <div className="assigned-role-group">
                <div className="role-header">Program Managers:</div>
                {pgmUsers.map(user => (
                  <div key={user.id} className="assigned-user-item">
                    <User size={10} />
                    <span className="user-name">{user.name}</span>
                    <span className="user-badge pgm">PGM</span>
                  </div>
                ))}
              </div>
            )}
            
            {directorUsers.length > 0 && (
              <div className="assigned-role-group">
                <div className="role-header">Directors:</div>
                {directorUsers.map(user => (
                  <div key={user.id} className="assigned-user-item">
                    <User size={10} />
                    <span className="user-name">{user.name}</span>
                    <span className="user-badge director">Director</span>
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
      <tr key={agreement.id || index} className="agreement-row">
        <td>
          <div className="agreement-info-list">
            <div className="agreement-name-list">
              {agreement.grant_name || agreement.filename || 'Unnamed Agreement'}
            </div>
            <div className="assigned-by-info">
              <UserCheckIcon size={12} />
              <span className="assigned-by-text">
                You assigned this agreement on {assignedAt}
              </span>
            </div>
            {renderAssignedUsersList(agreement)}
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
          <div className="date-cell">
            <span>{formatDate(agreement.assigned_at)}</span>
          </div>
        </td>
        <td>
          <div className="status-cell">
            <span className="status-text draft">Draft</span>
            <div className="assignment-role">
              <UserCheckIcon size={12} />
              <span className="role-text">
                Assigned by You
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
    const assignedAt = agreement.assigned_at ? formatDate(agreement.assigned_at) : "Unknown";

    return (
      <div key={agreement.id || index} className="agreement-card">
        <div className="card-header">
          <div className="agreement-status">
            <span className="status-badge draft">Draft</span>
            <span className="status-badge assigned">Assigned by You</span>
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
              <UserCheckIcon size={14} />
              <span>Assigned by:</span>
            </div>
            <div className="assigned-by-details">
              <div className="assigner-name">You ({user.role.replace('_', ' ')})</div>
              <div className="assigner-date">on {assignedAt}</div>
            </div>
          </div>

          {agreement.all_assigned_users && agreement.all_assigned_users.length > 0 && (
            <div className="all-assigned-users">
              <div className="assigned-users-header">
                <Users size={12} />
                <span>Assigned Users:</span>
                <span className="assigned-count">
                  ({agreement.all_assigned_users.length} total)
                </span>
              </div>
              <div className="assigned-users-chips">
                {agreement.all_assigned_users.slice(0, 3).map(user => (
                  <div key={user.id} className="user-chip">
                    <User size={10} />
                    <span className="chip-name">{user.name.split(' ')[0]}</span>
                    <span className={`chip-role ${user.assignment_type}`}>
                      {user.assignment_type === 'project_manager' ? 'PM' : 
                       user.assignment_type === 'program_manager' ? 'PGM' : 'DIR'}
                    </span>
                  </div>
                ))}
                {agreement.all_assigned_users.length > 3 && (
                  <div className="user-chip more">
                    +{agreement.all_assigned_users.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

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
              <Users size={14} />
              <span>{agreement.all_assigned_users?.length || 0} assigned</span>
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
    <div className="assigned-by-me-page">
      <div className="agreements-header">
        <div className="header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <h1>
            Agreements Assigned by Me
          </h1>
          <p className="page-subtitle">
            Agreements you have assigned to others for review or collaboration
          </p>
          
          {assignmentStats && (
            <div className="assignment-stats">
              <div className="stat-item">
                <Users size={14} />
                <span>Total Agreements: {assignmentStats.total_agreements}</span>
              </div>
              <div className="stat-item">
                <User size={14} />
                <span>Total PMs Assigned: {assignmentStats.total_assigned_pms}</span>
              </div>
              <div className="stat-item">
                <Shield size={14} />
                <span>Total PGMs Assigned: {assignmentStats.total_assigned_pgms}</span>
              </div>
              <div className="stat-item">
                <Award size={14} />
                <span>Total Directors Assigned: {assignmentStats.total_assigned_directors}</span>
              </div>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={fetchAssignedByMeAgreements}
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
            placeholder="Search agreements assigned by you..."
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
            <p>Loading agreements assigned by you...</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="empty-state">
            <UserCheckIcon size={48} />
            <h3>No agreements assigned by you yet</h3>
            <p>
              You will see agreements here when you assign them to other users via the workflow
            </p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/contracts')}
            >
              <Eye size={16} />
              View All Agreements
            </button>
          </div>
        ) : (
          <>
            <div className="results-header">
              <span className="results-count">
                Showing {filteredAgreements.length} agreement(s) assigned by you
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
                      <th className="table-header">Assigned Date</th>
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

export default AssignedByMePage;