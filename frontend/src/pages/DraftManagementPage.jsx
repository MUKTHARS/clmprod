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
  const [tabCounts, setTabCounts] = useState({
    'my-drafts': 0,
    'assigned-drafts': 0
  });

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
            // console.log('DEBUG: My drafts response:', data);
            
            const myDrafts = data.filter(draft => {
              if (!draft) return false;
              const isCreator = draft.created_by === user?.id;
              const isOldCreator = draft.userId === user?.id;
              return isCreator || isOldCreator;
            });
            
            // console.log('DEBUG: Filtered my drafts:', myDrafts);
            setDrafts(myDrafts || []);
            setAssignmentStats(null);
            setTabCounts(prev => ({
              ...prev,
              'my-drafts': myDrafts.length
            }));
          } else {
            const error = await response.json();
            console.error('Failed to fetch my drafts:', error);
            
            const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
            const myDrafts = savedDrafts.filter(draft => 
              draft.created_by === user?.id || draft.userId === user?.id
            );
            setDrafts(myDrafts);
            setTabCounts(prev => ({
              ...prev,
              'my-drafts': myDrafts.length
            }));
          }
        } catch (myDraftsError) {
          console.error('Error fetching my drafts:', myDraftsError);
          
          const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
          const myDrafts = savedDrafts.filter(draft => 
            draft.created_by === user?.id || draft.userId === user?.id
          );
          setDrafts(myDrafts);
          setTabCounts(prev => ({
            ...prev,
            'my-drafts': myDrafts.length
          }));
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
            // console.log('DEBUG: Assigned drafts response:', data);
            const assignedDrafts = data.drafts || [];
            setDrafts(assignedDrafts);
            setAssignmentStats(data.assignment_summary || null);
            setTabCounts(prev => ({
              ...prev,
              'assigned-drafts': assignedDrafts.length
            }));
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
              const allDrafts = await fallbackResponse.json();
              const userId = user?.id;
              const filteredDrafts = allDrafts.filter(draft => {
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
              setTabCounts(prev => ({
                ...prev,
                'assigned-drafts': draftsWithAssigner.length
              }));
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
          setTabCounts(prev => ({
            ...prev,
            'assigned-drafts': draftsWithAssigner.length
          }));
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
        setTabCounts(prev => ({
          ...prev,
          'my-drafts': myDrafts.length
        }));
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
        setTabCounts(prev => ({
          ...prev,
          'assigned-drafts': draftsWithAssigner.length
        }));
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
    if (days === 'Expired') return 'dmp-expired';
    if (days === 'Today') return 'dmp-today';
    if (days.includes('days')) {
      const numDays = parseInt(days);
      if (numDays <= 7) return 'dmp-critical';
      if (numDays <= 30) return 'dmp-warning';
    }
    return 'dmp-normal';
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
      <div className="dmp-assigned-users-list">
        <div className="dmp-assigned-users-summary">
          <Users size={12} />
          <span>
            {pmUsers.length} PM{pmUsers.length !== 1 ? 's' : ''} • {pgmUsers.length} PGM{pgmUsers.length !== 1 ? 's' : ''} • {directorUsers.length} Director{directorUsers.length !== 1 ? 's' : ''}
          </span>
          <button 
            className="dmp-toggle-assignments"
            onClick={() => toggleAssignmentsExpanded(draft.id)}
          >
            {isExpanded ? 'Show less' : 'Show all'}
            <ChevronDown size={12} className={isExpanded ? 'dmp-expanded' : ''} />
          </button>
        </div>
        
        {isExpanded && (
          <div className="dmp-assigned-users-details">
            {pmUsers.length > 0 && (
              <div className="dmp-assigned-role-group">
                <div className="dmp-role-header">Project Managers:</div>
                {pmUsers.map(user => (
                  <div key={user.id} className="dmp-assigned-user-item">
                    <User size={10} />
                    <span className="dmp-user-name">{user.name}</span>
                    <span className="dmp-user-badge dmp-pm">PM</span>
                  </div>
                ))}
              </div>
            )}
            
            {pgmUsers.length > 0 && (
              <div className="dmp-assigned-role-group">
                <div className="dmp-role-header">Program Managers:</div>
                {pgmUsers.map(user => (
                  <div key={user.id} className="dmp-assigned-user-item">
                    <User size={10} />
                    <span className="dmp-user-name">{user.name}</span>
                    <span className="dmp-user-badge dmp-pgm">PGM</span>
                  </div>
                ))}
              </div>
            )}
            
            {directorUsers.length > 0 && (
              <div className="dmp-assigned-role-group">
                <div className="dmp-role-header">Directors:</div>
                {directorUsers.map(user => (
                  <div key={user.id} className="dmp-assigned-user-item">
                    <User size={10} />
                    <span className="dmp-user-name">{user.name}</span>
                    <span className="dmp-user-badge dmp-director">Director</span>
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
      if (showFilters && !event.target.closest('.dmp-filter-popup') && !event.target.closest('.dmp-btn-filter')) {
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
      <tr key={draft.id || index} className="dmp-draft-row">
        <td>
          <div className="dmp-draft-info-list">
            <div className="dmp-draft-name-list">
              {draft.grant_name || draft.filename || 'Unnamed Draft'}
            </div>
            {activeTab === 'assigned-drafts' && (
              <>
                <div className="dmp-assigned-by-info">
                  <UserCog size={12} />
                  <span className="dmp-assigned-by-text">
                    Assigned by: {assignedBy.name} ({assignedBy.role})
                  </span>
                  <span className="dmp-assigned-date">on {assignedAt}</span>
                </div>
                {renderAssignedUsersList(draft)}
              </>
            )}
          </div>
        </td>
        <td>
          <div className="dmp-draft-id-list">
            {draft.id || 'N/A'}
          </div>
        </td>
        <td>
          <div className="dmp-grantor-cell">
            <span>{draft.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="dmp-amount-cell">
            <span>{formatCurrency(draft.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="dmp-date-cell">
            <span>{formatDate(draft.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="dmp-date-cell">
            <span>{formatDate(draft.end_date)}</span>
          </div>
        </td>
        <td>
          <div className="dmp-status-cell">
            <span className={`dmp-status-text ${draft.status?.replace('_', '-') || 'dmp-draft'}`}>
              {draft.status ? draft.status.replace('_', ' ').toUpperCase() : 'DRAFT'}
            </span>
            {activeTab === 'assigned-drafts' && (
              <div className="dmp-assignment-role">
                <UserPlus size={12} />
                <span className="dmp-role-text">
                  {draft.assignment_role?.replace('_', ' ') || 'Assigned'}
                </span>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="dmp-action-buttons">
            <button 
              className="dmp-btn-action"
              onClick={() => handleViewContract(draft.id)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            {activeTab === 'my-drafts' && (
              <>
                <button 
                  className="dmp-btn-action dmp-workflow"
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
      <div key={draft.id || index} className="dmp-draft-card">
        <div className="dmp-card-header">
          <div className="dmp-draft-status">
            <span className={`dmp-status-badge ${draft.status?.replace('_', '-') || 'dmp-draft'}`}>
              {draft.status ? draft.status.replace('_', ' ').toUpperCase() : 'DRAFT'}
            </span>
            {activeTab === 'assigned-drafts' && draft.created_by !== user?.id && (
              <span className="dmp-status-badge dmp-assigned">Assigned</span>
            )}
          </div>
          <div className="dmp-card-actions">
            <button 
              className="dmp-btn-action"
              onClick={() => handleViewContract(draft.id)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {activeTab === 'my-drafts' && (
              <>
                <button 
                  className="dmp-btn-action"
                  onClick={() => handleEditContract(draft.id)}
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button 
                  className="dmp-btn-action dmp-workflow"
                  onClick={() => handleOpenWorkflow(draft)}
                  title="Manage Agreement Workflow"
                >
                  <Settings size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="dmp-card-content">
          <div className="dmp-draft-icon">
            <FileText size={24} />
          </div>
          <h3 className="dmp-draft-name">
            {draft.grant_name || draft.filename || 'Unnamed Draft'}
          </h3>
          <p className="dmp-draft-id">
            ID: {draft.id || 'N/A'}
          </p>

          {activeTab === 'assigned-drafts' && (
            <>
              <div className="dmp-assigned-by-section">
                <div className="dmp-assigned-by-header">
                  <UserCog size={14} />
                  <span>Assigned by:</span>
                </div>
                <div className="dmp-assigned-by-details">
                  <div className="dmp-assigner-name">{assignedBy.name}</div>
                  <div className="dmp-assigner-role">{assignedBy.role}</div>
                  <div className="dmp-assigner-date">on {assignedAt}</div>
                </div>
              </div>

              {draft.all_assigned_users && draft.all_assigned_users.length > 0 && (
                <div className="dmp-all-assigned-users">
                  <div className="dmp-assigned-users-header">
                    <Users size={12} />
                    <span>All Assigned Users:</span>
                    <span className="dmp-assigned-count">
                      ({draft.all_assigned_users.length} total)
                    </span>
                  </div>
                  <div className="dmp-assigned-users-chips">
                    {draft.all_assigned_users.slice(0, 3).map(user => (
                      <div key={user.id} className="dmp-user-chip">
                        <User size={10} />
                        <span className="dmp-chip-name">{user.name.split(' ')[0]}</span>
                        <span className={`dmp-chip-role ${user.assignment_type}`}>
                          {user.assignment_type === 'project_manager' ? 'PM' : 
                           user.assignment_type === 'program_manager' ? 'PGM' : 'DIR'}
                        </span>
                      </div>
                    ))}
                    {draft.all_assigned_users.length > 3 && (
                      <div className="dmp-user-chip dmp-more">
                        +{draft.all_assigned_users.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="dmp-draft-details">
            <div className="dmp-detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(draft.total_amount)}</span>
            </div>
            <div className="dmp-detail-item">
              <Building size={14} />
              <span>{draft.grantor || 'No grantor'}</span>
            </div>
            <div className="dmp-detail-item">
              <Calendar size={14} />
              <span>{formatDate(draft.uploaded_at)}</span>
            </div>
            {getAssignedUsersCount(draft) > 0 && (
              <div className="dmp-detail-item">
                <Users size={14} />
                <span>{getAssignedUsersCount(draft)} assigned</span>
              </div>
            )}
          </div>

          {draft.purpose && (
            <div className="dmp-draft-purpose">
              <p>{draft.purpose.length > 100 ? draft.purpose.substring(0, 100) + '...' : draft.purpose}</p>
            </div>
          )}

          <div className="dmp-draft-timeline">
            <div className="dmp-timeline-item">
              <span className="dmp-timeline-label">Ends in</span>
              <span className={`dmp-timeline-value ${daysColor}`}>
                {daysRemaining}
              </span>
            </div>
          </div>
        </div>

        <div className="dmp-card-footer">
          <button 
            className="dmp-btn-view"
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
    <div className="dmp-draft-management-page">
      <div className="dmp-draft-header">
        <div className="dmp-header-left">
          {activeTab === 'assigned-drafts' && assignmentStats && (
            <div className="dmp-assignment-stats">
              <div className="dmp-stat-item">
                <UserCheck size={14} />
                <span>Assigned by PM: {assignmentStats.assigned_by_pm}</span>
              </div>
              <div className="dmp-stat-item">
                <UserCog size={14} />
                <span>Assigned by PGM: {assignmentStats.assigned_by_pgm}</span>
              </div>
              <div className="dmp-stat-item">
                <User size={14} />
                <span>Assigned by Director: {assignmentStats.assigned_by_director}</span>
              </div>
              <div className="dmp-stat-item">
                <Users size={14} />
                <span>Total PMs: {assignmentStats.total_assigned_pms}</span>
              </div>
              <div className="dmp-stat-item">
                <UserPlus size={14} />
                <span>Total PGMs: {assignmentStats.total_assigned_pgms}</span>
              </div>
              <div className="dmp-stat-item">
                <UserCog size={14} />
                <span>Total Directors: {assignmentStats.total_assigned_directors}</span>
              </div>
              {assignmentStats.unknown_assigner > 0 && (
                <div className="dmp-stat-item dmp-warning">
                  <AlertCircle size={14} />
                  <span>Unknown assigner: {assignmentStats.unknown_assigner}</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="dmp-draft-tabs">
        <button
          className={`dmp-tab-btn ${activeTab === 'my-drafts' ? 'dmp-active' : ''}`}
          onClick={() => navigate('/drafts/my')}
        >
          <FolderOpen size={18} />
          My Drafts
          <span className="dmp-tab-count">
            {tabCounts['my-drafts']}
          </span>
        </button>
        <button
          className={`dmp-tab-btn ${activeTab === 'assigned-drafts' ? 'dmp-active' : ''}`}
          onClick={() => navigate('/drafts/assigned')}
        >
          <UserCheck size={18} />
          Assigned to Me
          <span className="dmp-tab-count">
            {tabCounts['assigned-drafts']}
          </span>
        </button>
      </div>

      <div className="dmp-draft-controls">
        <div className="dmp-search-container">
          <Search className="dmp-search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'my-drafts' ? 'my drafts' : 'assigned drafts'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dmp-search-input"
          />
        </div>

        <div className="dmp-controls-right">
          <div className="dmp-view-toggle">
            <button 
              className={`dmp-view-btn ${activeView === 'list' ? 'dmp-active' : ''}`}
              onClick={() => setActiveView('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button 
              className={`dmp-view-btn ${activeView === 'grid' ? 'dmp-active' : ''}`}
              onClick={() => setActiveView('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>

          <div className="dmp-filter-actions">
            <button 
              className="dmp-btn-filter"
              onClick={() => setShowFilters(!showFilters)}
              title="Filter drafts"
            >
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="dmp-filter-popup">
            <div className="dmp-filter-popup-header">
              <h3>Filter Drafts</h3>
              <button 
                className="dmp-filter-close"
                onClick={() => setShowFilters(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="dmp-filter-content">
              <div className="dmp-filter-group">
                <label className="dmp-filter-label">Status</label>
                <div className="dmp-filter-options">
                  {['all', 'draft', 'in_progress'].map((status) => (
                    <button
                      key={status}
                      className={`dmp-filter-option ${statusFilter === status ? 'dmp-active' : ''}`}
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

              <div className="dmp-filter-group">
                <label className="dmp-filter-label">Date Range</label>
                <div className="dmp-filter-options">
                  {['all', 'today', 'week', 'month'].map((date) => (
                    <button
                      key={date}
                      className={`dmp-filter-option ${dateFilter === date ? 'dmp-active' : ''}`}
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

              <div className="dmp-filter-actions-bottom">
                <button 
                  className="dmp-btn-clear-filters"
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

      <div className="dmp-drafts-content">
        {loading ? (
          <div className="dmp-loading-state">
            <Loader2 className="dmp-spinner" />
            <p>Loading drafts...</p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="dmp-empty-state">
            <FileText size={48} />
            <h3>No drafts found</h3>
            <p>
              {activeTab === 'my-drafts' 
                ? 'Upload a contract to create your first draft' 
                : 'No drafts have been assigned to you yet'}
            </p>
            {activeTab === 'my-drafts' && (
              <button 
                className="dmp-btn-primary"
                onClick={() => navigate('/upload')}
              >
                <Plus size={16} />
                Upload First Draft
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="dmp-results-header">
              <span className="dmp-results-count">
                Showing {filteredDrafts.length} of {drafts.length} {activeTab === 'my-drafts' ? 'drafts' : 'assigned drafts'}
              </span>
            </div>

            {activeView === 'list' ? (
              <div className="dmp-drafts-table-container">
                <table className="dmp-drafts-table">
                  <thead>
                    <tr>
                      <th className="dmp-table-header">Draft Name</th>
                      <th className="dmp-table-header">Draft ID</th>
                      <th className="dmp-table-header">Grantor</th>
                      <th className="dmp-table-header">Amount</th>
                      <th className="dmp-table-header">Upload Date</th>
                      <th className="dmp-table-header">End Date</th>
                      <th className="dmp-table-header">Status</th>
                      <th className="dmp-table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrafts.map((draft, index) => renderDraftRow(draft, index))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dmp-drafts-grid">
                {filteredDrafts.map((draft, index) => renderDraftCard(draft, index))}
              </div>
            )}
          </>
        )}
      </div>

      {showWorkflowModal && selectedContractForWorkflow && (
        <div className="dmp-workflow-modal-overlay">
          <div className="dmp-workflow-modal-content">
            <div className="dmp-workflow-modal-header">
              <h3>Agreement Workflow</h3>
              <button 
                className="dmp-modal-close"
                onClick={() => {
                  setShowWorkflowModal(false);
                  setSelectedContractForWorkflow(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="dmp-workflow-modal-body">
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