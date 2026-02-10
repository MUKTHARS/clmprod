import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  Settings
} from 'lucide-react';
import API_CONFIG from '../config';
import './DraftManagementPage.css';
import AgreementWorkflow from '../components/workflow/AgreementWorkflow';

function DraftManagementPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('my-drafts');
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedContractForWorkflow, setSelectedContractForWorkflow] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [expandedAssignments, setExpandedAssignments] = useState({});

  useEffect(() => {
    if (location.pathname.includes('/drafts/my')) {
      setActiveTab('my-drafts');
    } else if (location.pathname.includes('/drafts/assigned')) {
      setActiveTab('assigned-drafts');
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [location.pathname, tab]);

  useEffect(() => {
    fetchDrafts();
  }, [activeTab]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (activeTab === 'my-drafts') {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/drafts`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('DEBUG: My drafts response:', data);
            
            const myDrafts = data.filter(draft => {
              if (!draft) return false;
              const isCreator = draft.created_by === user?.id;
              const isOldCreator = draft.userId === user?.id;
              return isCreator || isOldCreator;
            });
            
            console.log('DEBUG: Filtered my drafts:', myDrafts);
            setDrafts(myDrafts || []);
            setAssignmentStats(null);
          } else {
            const error = await response.json();
            console.error('Failed to fetch my drafts:', error);
            
            const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
            const myDrafts = savedDrafts.filter(draft => 
              draft.created_by === user?.id || draft.userId === user?.id
            );
            setDrafts(myDrafts);
          }
        } catch (myDraftsError) {
          console.error('Error fetching my drafts:', myDraftsError);
          
          const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
          const myDrafts = savedDrafts.filter(draft => 
            draft.created_by === user?.id || draft.userId === user?.id
          );
          setDrafts(myDrafts);
        }
      } else {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/assigned-drafts`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('DEBUG: Assigned drafts response:', data);
            setDrafts(data.drafts || []);
            setAssignmentStats(data.assignment_summary || null);
          } else {
            const error = await response.json();
            console.error('Failed to fetch assigned drafts:', error);
            
            const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/drafts`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (fallbackResponse.ok) {
              const assignedDrafts = await fallbackResponse.json();
              const userId = user?.id;
              const filteredDrafts = assignedDrafts.filter(draft => {
                if (!draft) return false;
                return (
                  (draft.assigned_pm_users && Array.isArray(draft.assigned_pm_users) && draft.assigned_pm_users.includes(userId)) ||
                  (draft.assigned_pgm_users && Array.isArray(draft.assigned_pgm_users) && draft.assigned_pgm_users.includes(userId)) ||
                  (draft.assigned_director_users && Array.isArray(draft.assigned_director_users) && draft.assigned_director_users.includes(userId))
                );
              });
              
              const draftsWithAssigner = filteredDrafts.map(draft => ({
                ...draft,
                assigned_by: {
                  id: null,
                  name: "Unknown",
                  role: "Unknown"
                },
                all_assigned_users: []
              }));
              
              setDrafts(draftsWithAssigner);
              setAssignmentStats(null);
            }
          }
        } catch (assignedError) {
          console.error('Error fetching assigned drafts:', assignedError);
          const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
          const assignedSavedDrafts = savedDrafts.filter(draft => {
            const userId = user?.id;
            return (
              (draft.assigned_pm_users && draft.assigned_pm_users.includes(userId)) ||
              (draft.assigned_pgm_users && draft.assigned_pgm_users.includes(userId)) ||
              (draft.assigned_director_users && draft.assigned_director_users.includes(userId))
            );
          });
          
          const draftsWithAssigner = assignedSavedDrafts.map(draft => ({
            ...draft,
            assigned_by: draft.assigned_by || {
              id: null,
              name: "Unknown",
              role: "Unknown"
            },
            all_assigned_users: draft.all_assigned_users || []
          }));
          
          setDrafts(draftsWithAssigner);
          setAssignmentStats(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      
      const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
      
      if (activeTab === 'my-drafts') {
        const myDrafts = savedDrafts.filter(draft => 
          draft.created_by === user?.id || draft.userId === user?.id
        );
        setDrafts(myDrafts);
      } else {
        const userId = user?.id;
        const assignedDrafts = savedDrafts.filter(draft => {
          return (
            (draft.assigned_pm_users && draft.assigned_pm_users.includes(userId)) ||
            (draft.assigned_pgm_users && draft.assigned_pgm_users.includes(userId)) ||
            (draft.assigned_director_users && draft.assigned_director_users.includes(userId))
          );
        });
        
        const draftsWithAssigner = assignedDrafts.map(draft => ({
          ...draft,
          assigned_by: draft.assigned_by || {
            id: null,
            name: "Unknown",
            role: "Unknown"
          },
          all_assigned_users: draft.all_assigned_users || []
        }));
        
        setDrafts(draftsWithAssigner);
      }
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

  const getDaysRemaining = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const today = new Date();
      const targetDate = new Date(dateString);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `${diffDays} days`;
      } else if (diffDays === 0) {
        return 'Today';
      } else {
        return 'Expired';
      }
    } catch (e) {
      return 'N/A';
    }
  };

  const getDaysColor = (days) => {
    if (days === 'Expired') return 'expired';
    if (days === 'Today') return 'today';
    if (days.includes('days')) {
      const numDays = parseInt(days);
      if (numDays <= 7) return 'critical';
      if (numDays <= 30) return 'warning';
    }
    return 'normal';
  };

  const handleOpenWorkflow = async (contract) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/agreements/drafts/${contract.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedContractForWorkflow(data.contract);
      } else {
        setSelectedContractForWorkflow(contract);
      }
    } catch (error) {
      console.error('Error fetching contract details:', error);
      setSelectedContractForWorkflow(contract);
    }
    
    setShowWorkflowModal(true);
  };

  const handleWorkflowComplete = () => {
    fetchDrafts();
    setShowWorkflowModal(false);
    setSelectedContractForWorkflow(null);
  };

  const getAssignedUsersCount = (draft) => {
    if (!draft) return 0;
    let count = 0;
    if (draft.assigned_pm_users && Array.isArray(draft.assigned_pm_users)) count += draft.assigned_pm_users.length;
    if (draft.assigned_pgm_users && Array.isArray(draft.assigned_pgm_users)) count += draft.assigned_pgm_users.length;
    if (draft.assigned_director_users && Array.isArray(draft.assigned_director_users)) count += draft.assigned_director_users.length;
    return count;
  };

  const toggleAssignmentsExpanded = (draftId) => {
    setExpandedAssignments(prev => ({
      ...prev,
      [draftId]: !prev[draftId]
    }));
  };

  const renderAssignedUsersList = (draft) => {
    if (!draft.all_assigned_users || draft.all_assigned_users.length === 0) {
      return null;
    }

    const isExpanded = expandedAssignments[draft.id];
    const pmUsers = draft.all_assigned_users.filter(u => u.assignment_type === 'project_manager');
    const pgmUsers = draft.all_assigned_users.filter(u => u.assignment_type === 'program_manager');
    const directorUsers = draft.all_assigned_users.filter(u => u.assignment_type === 'director');

    return (
      <div className="assigned-users-list">
        <div className="assigned-users-summary">
          <Users size={12} />
          <span>
            {pmUsers.length} PM{pmUsers.length !== 1 ? 's' : ''} • {pgmUsers.length} PGM{pgmUsers.length !== 1 ? 's' : ''} • {directorUsers.length} Director{directorUsers.length !== 1 ? 's' : ''}
          </span>
          <button 
            className="toggle-assignments"
            onClick={() => toggleAssignmentsExpanded(draft.id)}
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

  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Draft deleted successfully!');
        fetchDrafts();
        const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
        const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
        localStorage.setItem('user_drafts', JSON.stringify(updatedDrafts));
      } else {
        const error = await response.json();
        alert(`Failed to delete draft: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
      const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
      localStorage.setItem('user_drafts', JSON.stringify(updatedDrafts));
      alert('Draft removed from local storage');
      fetchDrafts();
    }
  };

const handleViewContract = (draftId) => {
  // Navigate to contract details with from=drafts parameter
  navigate(`/contracts/${draftId}?from=drafts&source=mydrafts`);
};

  const handleEditContract = (draftId) => {
    navigate(`/contracts/${draftId}?edit=true`);
  };

  const filteredDrafts = drafts.filter(draft => {
    if (!draft) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (draft.grant_name && draft.grant_name.toLowerCase().includes(searchLower)) ||
        (draft.filename && draft.filename.toLowerCase().includes(searchLower)) ||
        (draft.contract_number && draft.contract_number.toString().toLowerCase().includes(searchLower)) ||
        (draft.grantor && draft.grantor.toLowerCase().includes(searchLower)) ||
        (draft.all_assigned_users && draft.all_assigned_users.some(user => 
          user.name && user.name.toLowerCase().includes(searchLower)
        ))
      );
    }
    return true;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest('.filter-popup') && !event.target.closest('.btn-filter')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const renderDraftRow = (draft, index) => {
    const daysRemaining = getDaysRemaining(draft.end_date);
    const daysColor = getDaysColor(daysRemaining);
    const assignedBy = draft.assigned_by || { name: "Unknown", role: "Unknown" };
    const assignedAt = draft.assigned_at ? formatDate(draft.assigned_at) : "Unknown";

    return (
      <tr key={draft.id || index} className="draft-row">
        <td>
          <div className="draft-info-list">
            <div className="draft-name-list">
              {draft.grant_name || draft.filename || 'Unnamed Draft'}
            </div>
            {activeTab === 'assigned-drafts' && (
              <>
                <div className="assigned-by-info">
                  <UserCog size={12} />
                  <span className="assigned-by-text">
                    Assigned by: {assignedBy.name} ({assignedBy.role})
                  </span>
                  <span className="assigned-date">on {assignedAt}</span>
                </div>
                {renderAssignedUsersList(draft)}
              </>
            )}
          </div>
        </td>
        <td>
          <div className="draft-id-list">
            {draft.id || 'N/A'}
          </div>
        </td>
        <td>
          <div className="grantor-cell">
            <span>{draft.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="amount-cell">
            <span>{formatCurrency(draft.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{formatDate(draft.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{formatDate(draft.end_date)}</span>
          </div>
        </td>
        <td>
          <div className="status-cell">
            <span className={`status-text draft`}>Draft</span>
            {activeTab === 'assigned-drafts' && (
              <div className="assignment-role">
                <UserPlus size={12} />
                <span className="role-text">
                  {draft.assignment_role?.replace('_', ' ') || 'Assigned'}
                </span>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => handleViewContract(draft.id)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            {activeTab === 'my-drafts' && (
              <>
                {/* <button 
                  className="btn-action"
                  onClick={() => handleEditContract(draft.id)}
                  title="Edit"
                >
                  <Edit size={16} />
                </button> */}
                <button 
                  className="btn-action workflow"
                  onClick={() => handleOpenWorkflow(draft)}
                  title="Manage Agreement Workflow"
                >
                  <Settings size={16} />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderDraftCard = (draft, index) => {
    const daysRemaining = getDaysRemaining(draft.end_date);
    const daysColor = getDaysColor(daysRemaining);
    const assignedBy = draft.assigned_by || { name: "Unknown", role: "Unknown" };
    const assignedAt = draft.assigned_at ? formatDate(draft.assigned_at) : "Unknown";

    return (
      <div key={draft.id || index} className="draft-card">
        <div className="card-header">
          <div className="draft-status">
            <span className="status-badge draft">Draft</span>
            {activeTab === 'assigned-drafts' && draft.created_by !== user?.id && (
              <span className="status-badge assigned">Assigned</span>
            )}
          </div>
          <div className="card-actions">
            <button 
              className="btn-action"
              onClick={() => handleViewContract(draft.id)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {activeTab === 'my-drafts' && (
              <>
                <button 
                  className="btn-action"
                  onClick={() => handleEditContract(draft.id)}
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button 
                  className="btn-action workflow"
                  onClick={() => handleOpenWorkflow(draft)}
                  title="Manage Agreement Workflow"
                >
                  <FileText size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card-content">
          <div className="draft-icon">
            <FileText size={24} />
          </div>
          <h3 className="draft-name">
            {draft.grant_name || draft.filename || 'Unnamed Draft'}
          </h3>
          <p className="draft-id">
            ID: {draft.id || 'N/A'}
          </p>

          {activeTab === 'assigned-drafts' && (
            <>
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

              {draft.all_assigned_users && draft.all_assigned_users.length > 0 && (
                <div className="all-assigned-users">
                  <div className="assigned-users-header">
                    <Users size={12} />
                    <span>All Assigned Users:</span>
                    <span className="assigned-count">
                      ({draft.all_assigned_users.length} total)
                    </span>
                  </div>
                  <div className="assigned-users-chips">
                    {draft.all_assigned_users.slice(0, 3).map(user => (
                      <div key={user.id} className="user-chip">
                        <User size={10} />
                        <span className="chip-name">{user.name.split(' ')[0]}</span>
                        <span className={`chip-role ${user.assignment_type}`}>
                          {user.assignment_type === 'project_manager' ? 'PM' : 
                           user.assignment_type === 'program_manager' ? 'PGM' : 'DIR'}
                        </span>
                      </div>
                    ))}
                    {draft.all_assigned_users.length > 3 && (
                      <div className="user-chip more">
                        +{draft.all_assigned_users.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="draft-details">
            <div className="detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(draft.total_amount)}</span>
            </div>
            <div className="detail-item">
              <Building size={14} />
              <span>{draft.grantor || 'No grantor'}</span>
            </div>
            <div className="detail-item">
              <Calendar size={14} />
              <span>{formatDate(draft.uploaded_at)}</span>
            </div>
            {getAssignedUsersCount(draft) > 0 && (
              <div className="detail-item">
                <Users size={14} />
                <span>{getAssignedUsersCount(draft)} assigned</span>
              </div>
            )}
          </div>

          {draft.purpose && (
            <div className="draft-purpose">
              <p>{draft.purpose.length > 100 ? draft.purpose.substring(0, 100) + '...' : draft.purpose}</p>
            </div>
          )}

          <div className="draft-timeline">
            <div className="timeline-item">
              <span className="timeline-label">Ends in</span>
              <span className={`timeline-value ${daysColor}`}>
                {daysRemaining}
              </span>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <button 
            className="btn-view"
            onClick={() => handleViewContract(draft.id)}
          >
            View Contract Details
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="draft-management-page">
      <div className="draft-header">
        <div className="header-left">
          <h1>
            {activeTab === 'my-drafts' ? 'My Drafts' : 'Drafts Assigned to Me'}
          </h1>
          <p className="page-subtitle">
            {activeTab === 'my-drafts' 
              ? 'Manage your draft agreements before publishing' 
              : 'Draft agreements assigned to you for review or collaboration'}
          </p>
          
          {activeTab === 'assigned-drafts' && assignmentStats && (
            <div className="assignment-stats">
              <div className="stat-item">
                <UserCheck size={14} />
                <span>Assigned by PM: {assignmentStats.assigned_by_pm}</span>
              </div>
              <div className="stat-item">
                <UserCog size={14} />
                <span>Assigned by PGM: {assignmentStats.assigned_by_pgm}</span>
              </div>
              <div className="stat-item">
                <User size={14} />
                <span>Assigned by Director: {assignmentStats.assigned_by_director}</span>
              </div>
              <div className="stat-item">
                <Users size={14} />
                <span>Total PMs: {assignmentStats.total_assigned_pms}</span>
              </div>
              <div className="stat-item">
                <UserPlus size={14} />
                <span>Total PGMs: {assignmentStats.total_assigned_pgms}</span>
              </div>
              <div className="stat-item">
                <UserCog size={14} />
                <span>Total Directors: {assignmentStats.total_assigned_directors}</span>
              </div>
              {assignmentStats.unknown_assigner > 0 && (
                <div className="stat-item warning">
                  <AlertCircle size={14} />
                  <span>Unknown assigner: {assignmentStats.unknown_assigner}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/upload')}
          >
            <Plus size={16} />
            Upload New
          </button>
          <button 
            className="btn-secondary"
            onClick={fetchDrafts}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="draft-tabs">
        <button
          className={`tab-btn ${activeTab === 'my-drafts' ? 'active' : ''}`}
          onClick={() => navigate('/drafts/my')}
        >
          <FolderOpen size={18} />
          My Drafts
          <span className="tab-count">
            {drafts.filter(d => d.created_by === user?.id || d.userId === user?.id).length}
          </span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'assigned-drafts' ? 'active' : ''}`}
          onClick={() => navigate('/drafts/assigned')}
        >
          <UserCheck size={18} />
          Assigned to Me
          <span className="tab-count">
            {drafts.filter(d => {
              const userId = user?.id;
              return (
                (d.assigned_pm_users && d.assigned_pm_users.includes(userId)) ||
                (d.assigned_pgm_users && d.assigned_pgm_users.includes(userId)) ||
                (d.assigned_director_users && d.assigned_director_users.includes(userId))
              );
            }).length}
          </span>
        </button>
      </div>

      <div className="draft-controls">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'my-drafts' ? 'my drafts' : 'assigned drafts'}...`}
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

          <div className="filter-actions">
            <button 
              className="btn-filter"
              onClick={() => setShowFilters(!showFilters)}
              title="Filter drafts"
            >
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filter-popup">
            <div className="filter-popup-header">
              <h3>Filter Drafts</h3>
              <button 
                className="filter-close"
                onClick={() => setShowFilters(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="filter-content">
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <div className="filter-options">
                  {['all', 'draft', 'in_progress'].map((status) => (
                    <button
                      key={status}
                      className={`filter-option ${statusFilter === status ? 'active' : ''}`}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilters(false);
                      }}
                    >
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">Date Range</label>
                <div className="filter-options">
                  {['all', 'today', 'week', 'month'].map((date) => (
                    <button
                      key={date}
                      className={`filter-option ${dateFilter === date ? 'active' : ''}`}
                      onClick={() => {
                        setDateFilter(date);
                        setShowFilters(false);
                      }}
                    >
                      {date === 'all' && 'All Dates'}
                      {date === 'today' && 'Today'}
                      {date === 'week' && 'This Week'}
                      {date === 'month' && 'This Month'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-actions-bottom">
                <button 
                  className="btn-clear-filters"
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('all');
                    setShowFilters(false);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="drafts-content">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Loading drafts...</p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No drafts found</h3>
            <p>
              {activeTab === 'my-drafts' 
                ? 'Upload a contract to create your first draft' 
                : 'No drafts have been assigned to you yet'}
            </p>
            {activeTab === 'my-drafts' && (
              <button 
                className="btn-primary"
                onClick={() => navigate('/upload')}
              >
                <Plus size={16} />
                Upload First Draft
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="results-header">
              <span className="results-count">
                Showing {filteredDrafts.length} of {drafts.length} {activeTab === 'my-drafts' ? 'drafts' : 'assigned drafts'}
              </span>
            </div>

            {activeView === 'list' ? (
              <div className="drafts-table-container">
                <table className="drafts-table">
                  <thead>
                    <tr>
                      <th className="table-header">Draft Name</th>
                      <th className="table-header">Draft ID</th>
                      <th className="table-header">Grantor</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">Upload Date</th>
                      <th className="table-header">End Date</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrafts.map((draft, index) => renderDraftRow(draft, index))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="drafts-grid">
                {filteredDrafts.map((draft, index) => renderDraftCard(draft, index))}
              </div>
            )}
          </>
        )}
      </div>

      {showWorkflowModal && selectedContractForWorkflow && (
        <div className="workflow-modal-overlay">
          <div className="workflow-modal-content">
            <div className="workflow-modal-header">
              <h3>Agreement Workflow</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowWorkflowModal(false);
                  setSelectedContractForWorkflow(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="workflow-modal-body">
              <AgreementWorkflow 
                contract={selectedContractForWorkflow}
                user={user}
                showWorkflow={showWorkflowModal}
                setShowWorkflow={setShowWorkflowModal}
                onWorkflowComplete={handleWorkflowComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DraftManagementPage;



