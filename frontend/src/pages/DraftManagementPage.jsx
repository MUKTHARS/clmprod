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
  ChevronDown
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
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const allContracts = await response.json();
          const myDrafts = allContracts.filter(contract => {
            if (!contract || contract.status !== 'draft') return false;
            return contract.created_by === user?.id;
          });
          setDrafts(myDrafts);
        } else {
          const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
          const mySavedDrafts = savedDrafts.filter(draft => 
            draft.created_by === user?.id || draft.userId === user?.id
          );
          setDrafts(mySavedDrafts);
        }
      } else {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/drafts`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const assignedDrafts = await response.json();
            const userId = user?.id;
            const filteredDrafts = assignedDrafts.filter(draft => {
              if (!draft) return false;
              return (
                (draft.assigned_pm_users && Array.isArray(draft.assigned_pm_users) && draft.assigned_pm_users.includes(userId)) ||
                (draft.assigned_pgm_users && Array.isArray(draft.assigned_pgm_users) && draft.assigned_pgm_users.includes(userId)) ||
                (draft.assigned_director_users && Array.isArray(draft.assigned_director_users) && draft.assigned_director_users.includes(userId))
              );
            });
            setDrafts(filteredDrafts);
          }
        } catch (assignedError) {
          const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
          const assignedSavedDrafts = savedDrafts.filter(draft => {
            const userId = user?.id;
            return (
              (draft.assigned_pm_users && draft.assigned_pm_users.includes(userId)) ||
              (draft.assigned_pgm_users && draft.assigned_pgm_users.includes(userId)) ||
              (draft.assigned_director_users && draft.assigned_director_users.includes(userId))
            );
          });
          setDrafts(assignedSavedDrafts);
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
        setDrafts(assignedDrafts);
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
    // Fetch fresh contract data before opening workflow
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
      // Use the fresh contract data
      setSelectedContractForWorkflow(data.contract);
    } else {
      // Fallback to the original contract data
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
    navigate(`/contracts/${draftId}`);
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
        (draft.grantor && draft.grantor.toLowerCase().includes(searchLower))
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

    return (
      <tr key={draft.id || index} className="draft-row">
        <td>
          <div className="draft-info-list">
            <div className="draft-name-list">
              {draft.grant_name || draft.filename || 'Unnamed Draft'}
            </div>
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
                <button 
                  className="btn-action"
                  onClick={() => handleEditContract(draft.id)}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className="btn-action workflow"
                  onClick={() => handleOpenWorkflow(draft)}
                  title="Manage Agreement Workflow"
                >
                  <FileText size={16} />
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
      {/* Header */}
      <div className="draft-header">
        <div className="header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <h1>
            {activeTab === 'my-drafts' ? 'My Drafts' : 'Drafts Assigned to Me'}
          </h1>
          <p className="page-subtitle">
            {activeTab === 'my-drafts' 
              ? 'Manage your draft agreements before publishing' 
              : 'Draft agreements assigned to you for review or collaboration'}
          </p>
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

      {/* Tabs Navigation */}
      <div className="draft-tabs">
        <button
          className={`tab-btn ${activeTab === 'my-drafts' ? 'active' : ''}`}
          onClick={() => navigate('/drafts/my')}
        >
          <FolderOpen size={18} />
          My Drafts
          <span className="tab-count">
            {drafts.filter(d => d.created_by === user?.id).length}
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

      {/* Search and Controls */}
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

        {/* Filter Popup */}
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

      {/* Drafts Content */}
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

      {/* Workflow Modal - MOVE THIS OUTSIDE THE MAIN CONTENT DIV */}
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

// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation, useParams } from 'react-router-dom';
// import {
//   Search,
//   Filter,
//   Calendar,
//   RefreshCw,
//   FileText,
//   CheckCircle,
//   AlertCircle,
//   Clock,
//   ChevronRight,
//   Eye,
//   User,
//   Users,
//   Loader2,
//   FolderOpen,
//   UserCheck,
//   Edit,
//   Trash2,
//   Share2,
//   DollarSign,
//   Building,
//   FileArchive,
//   ArrowLeft,
//   Plus
// } from 'lucide-react';
// import API_CONFIG from '../config';
// import './DraftManagementPage.css';

// function DraftManagementPage({ user }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { tab } = useParams(); // Get tab from route params if using /drafts/:tab
//   const [drafts, setDrafts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeTab, setActiveTab] = useState('my-drafts');
//   const [showFilters, setShowFilters] = useState(false);
  
//   // Determine active tab from URL
//   useEffect(() => {
//     // Check if we're on /drafts/my or /drafts/assigned
//     if (location.pathname.includes('/drafts/my')) {
//       setActiveTab('my-drafts');
//     } else if (location.pathname.includes('/drafts/assigned')) {
//       setActiveTab('assigned-drafts');
//     } else if (tab) {
//       // If using route params like /drafts/:tab
//       setActiveTab(tab);
//     }
//   }, [location.pathname, tab]);

//   useEffect(() => {
//     fetchDrafts();
//   }, [activeTab]);

//   const fetchDrafts = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       if (activeTab === 'my-drafts') {
//         // Fetch drafts created by current user
//         const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (response.ok) {
//           const allContracts = await response.json();
          
//           // Filter for drafts created by current user
//           const myDrafts = allContracts.filter(contract => {
//             // Check if contract exists and is a draft
//             if (!contract || contract.status !== 'draft') return false;
            
//             // Check if created by current user
//             return contract.created_by === user?.id;
//           });
          
//           setDrafts(myDrafts);
//         } else {
//           // Fallback to localStorage
//           const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
//           const mySavedDrafts = savedDrafts.filter(draft => 
//             draft.created_by === user?.id || draft.userId === user?.id
//           );
//           setDrafts(mySavedDrafts);
//         }
//       } else {
//         // Fetch drafts assigned to current user
//         try {
//           const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/drafts`, {
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           });

//           if (response.ok) {
//             const assignedDrafts = await response.json();
            
//             // Filter for drafts assigned to current user
//             const userId = user?.id;
//             const filteredDrafts = assignedDrafts.filter(draft => {
//               if (!draft) return false;
              
//               return (
//                 (draft.assigned_pm_users && Array.isArray(draft.assigned_pm_users) && draft.assigned_pm_users.includes(userId)) ||
//                 (draft.assigned_pgm_users && Array.isArray(draft.assigned_pgm_users) && draft.assigned_pgm_users.includes(userId)) ||
//                 (draft.assigned_director_users && Array.isArray(draft.assigned_director_users) && draft.assigned_director_users.includes(userId))
//               );
//             });
            
//             setDrafts(filteredDrafts);
//           }
//         } catch (assignedError) {
//           console.log('Could not fetch assigned drafts from API, using localStorage');
//           // Fallback to localStorage
//           const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
//           const assignedSavedDrafts = savedDrafts.filter(draft => {
//             const userId = user?.id;
//             return (
//               (draft.assigned_pm_users && draft.assigned_pm_users.includes(userId)) ||
//               (draft.assigned_pgm_users && draft.assigned_pgm_users.includes(userId)) ||
//               (draft.assigned_director_users && draft.assigned_director_users.includes(userId))
//             );
//           });
//           setDrafts(assignedSavedDrafts);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch drafts:', error);
//       // Final fallback to localStorage
//       const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
      
//       if (activeTab === 'my-drafts') {
//         const myDrafts = savedDrafts.filter(draft => 
//           draft.created_by === user?.id || draft.userId === user?.id
//         );
//         setDrafts(myDrafts);
//       } else {
//         const userId = user?.id;
//         const assignedDrafts = savedDrafts.filter(draft => {
//           return (
//             (draft.assigned_pm_users && draft.assigned_pm_users.includes(userId)) ||
//             (draft.assigned_pgm_users && draft.assigned_pgm_users.includes(userId)) ||
//             (draft.assigned_director_users && draft.assigned_director_users.includes(userId))
//           );
//         });
//         setDrafts(assignedDrafts);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return '-';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric'
//       });
//     } catch (e) {
//       return 'Invalid Date';
//     }
//   };

//   const getAssignedUsersCount = (draft) => {
//     if (!draft) return 0;
//     let count = 0;
//     if (draft.assigned_pm_users && Array.isArray(draft.assigned_pm_users)) count += draft.assigned_pm_users.length;
//     if (draft.assigned_pgm_users && Array.isArray(draft.assigned_pgm_users)) count += draft.assigned_pgm_users.length;
//     if (draft.assigned_director_users && Array.isArray(draft.assigned_director_users)) count += draft.assigned_director_users.length;
//     return count;
//   };

//   const handleDeleteDraft = async (draftId) => {
//     if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
//       return;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${draftId}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         alert('Draft deleted successfully!');
//         fetchDrafts(); // Refresh the list
        
//         // Also remove from localStorage
//         const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
//         const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
//         localStorage.setItem('user_drafts', JSON.stringify(updatedDrafts));
//       } else {
//         const error = await response.json();
//         alert(`Failed to delete draft: ${error.detail}`);
//       }
//     } catch (error) {
//       console.error('Failed to delete draft:', error);
//       // Fallback to localStorage removal
//       const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
//       const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
//       localStorage.setItem('user_drafts', JSON.stringify(updatedDrafts));
//       alert('Draft removed from local storage');
//       fetchDrafts();
//     }
//   };

//   const handleViewContract = (draftId) => {
//     navigate(`/contracts/${draftId}`);
//   };

//   const handleEditContract = (draftId) => {
//     navigate(`/contracts/${draftId}?edit=true`);
//   };

//   const filteredDrafts = drafts.filter(draft => {
//     if (!draft) return false;
    
//     if (searchTerm) {
//       const searchLower = searchTerm.toLowerCase();
//       return (
//         (draft.grant_name && draft.grant_name.toLowerCase().includes(searchLower)) ||
//         (draft.filename && draft.filename.toLowerCase().includes(searchLower)) ||
//         (draft.contract_number && draft.contract_number.toString().toLowerCase().includes(searchLower)) ||
//         (draft.grantor && draft.grantor.toLowerCase().includes(searchLower))
//       );
//     }
//     return true;
//   });

//   const getDraftTitle = () => {
//     return activeTab === 'my-drafts' ? 'My Drafts' : 'Drafts Assigned to Me';
//   };

//   const getDraftSubtitle = () => {
//     return activeTab === 'my-drafts' 
//       ? 'Manage your draft agreements before publishing' 
//       : 'Draft agreements assigned to you for review or collaboration';
//   };

//   const getEmptyStateMessage = () => {
//     return activeTab === 'my-drafts'
//       ? 'Upload a contract to create your first draft'
//       : 'No drafts have been assigned to you yet';
//   };

//   return (
//     <div className="draft-management-page">
//       {/* Header */}
//       <div className="draft-header">
//         <div className="header-left">
//           <button 
//             className="btn-back"
//             onClick={() => navigate('/dashboard')}
//           >
//             <ArrowLeft size={18} />
//             Back to Dashboard
//           </button>
//           <h1>{getDraftTitle()}</h1>
//           <p className="page-subtitle">
//             {getDraftSubtitle()}
//           </p>
//         </div>
//         <div className="header-actions">
//           <button 
//             className="btn-primary"
//             onClick={() => navigate('/upload')}
//           >
//             <Plus size={16} />
//             Upload New
//           </button>
//           <button 
//             className="btn-secondary"
//             onClick={fetchDrafts}
//             disabled={loading}
//           >
//             <RefreshCw size={16} className={loading ? 'spinning' : ''} />
//           </button>
//         </div>
//       </div>

//       {/* Tabs Navigation */}
//       <div className="draft-tabs">
//         <button
//           className={`tab-btn ${activeTab === 'my-drafts' ? 'active' : ''}`}
//           onClick={() => navigate('/drafts/my')}
//         >
//           <FolderOpen size={18} />
//           My Drafts
//           <span className="tab-count">{drafts.filter(d => d.created_by === user?.id).length}</span>
//         </button>
//         <button
//           className={`tab-btn ${activeTab === 'assigned-drafts' ? 'active' : ''}`}
//           onClick={() => navigate('/drafts/assigned')}
//         >
//           <UserCheck size={18} />
//           Assigned to Me
//           <span className="tab-count">
//             {drafts.filter(d => {
//               const userId = user?.id;
//               return (
//                 (d.assigned_pm_users && d.assigned_pm_users.includes(userId)) ||
//                 (d.assigned_pgm_users && d.assigned_pgm_users.includes(userId)) ||
//                 (d.assigned_director_users && d.assigned_director_users.includes(userId))
//               );
//             }).length}
//           </span>
//         </button>
//       </div>

//       {/* Search and Controls */}
//       <div className="draft-controls">
//         <div className="search-container">
//           <Search className="search-icon" />
//           <input
//             type="text"
//             placeholder={`Search ${activeTab === 'my-drafts' ? 'my drafts' : 'assigned drafts'}...`}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="search-input"
//           />
//         </div>

//         <div className="filter-container">
//           <button 
//             className="btn-filter"
//             onClick={() => setShowFilters(!showFilters)}
//           >
//             <Filter size={16} />
//             Filter
//           </button>
          
//           {showFilters && (
//             <div className="filter-dropdown">
//               <div className="filter-section">
//                 <label>Sort by</label>
//                 <select>
//                   <option>Newest First</option>
//                   <option>Oldest First</option>
//                   <option>Name (A-Z)</option>
//                   <option>Name (Z-A)</option>
//                   <option>Highest Amount</option>
//                   <option>Lowest Amount</option>
//                 </select>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Drafts Content */}
//       <div className="drafts-content">
//         {loading ? (
//           <div className="loading-state">
//             <Loader2 className="spinner" />
//             <p>Loading drafts...</p>
//           </div>
//         ) : filteredDrafts.length === 0 ? (
//           <div className="empty-state">
//             <FileText size={48} />
//             <h3>No drafts found</h3>
//             <p>{getEmptyStateMessage()}</p>
//             {activeTab === 'my-drafts' && (
//               <button 
//                 className="btn-primary"
//                 onClick={() => navigate('/upload')}
//               >
//                 <Plus size={16} />
//                 Upload First Draft
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             <div className="results-header">
//               <span className="results-count">
//                 Showing {filteredDrafts.length} of {drafts.length} {activeTab === 'my-drafts' ? 'drafts' : 'assigned drafts'}
//               </span>
//             </div>

//             <div className="drafts-grid">
//               {filteredDrafts.map((draft, index) => (
//                 <div key={draft.id || index} className="draft-card">
//                   <div className="card-header">
//                     <div className="draft-status">
//                       <span className="status-badge draft">Draft</span>
//                       {activeTab === 'assigned-drafts' && draft.created_by !== user?.id && (
//                         <span className="status-badge assigned">Assigned</span>
//                       )}
//                     </div>
//                     <div className="card-actions">
//                       <button 
//                         className="btn-action"
//                         onClick={() => handleViewContract(draft.id)}
//                         title="View Details"
//                       >
//                         <Eye size={14} />
//                       </button>
//                       {activeTab === 'my-drafts' && (
//                         <button 
//                           className="btn-action"
//                           onClick={() => handleEditContract(draft.id)}
//                           title="Edit"
//                         >
//                           <Edit size={14} />
//                         </button>
//                       )}
//                       <button 
//                         className="btn-action delete"
//                         onClick={() => handleDeleteDraft(draft.id)}
//                         title="Delete"
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </div>
//                   </div>

//                   <div className="card-content">
//                     <div className="draft-icon">
//                       <FileText size={24} />
//                     </div>
//                     <h3 className="draft-name">
//                       {draft.grant_name || draft.filename || 'Unnamed Draft'}
//                     </h3>
//                     <p className="draft-id">
//                       ID: {draft.id || 'N/A'}
//                     </p>

//                     <div className="draft-details">
//                       <div className="detail-item">
//                         <DollarSign size={14} />
//                         <span>{formatCurrency(draft.total_amount)}</span>
//                       </div>
//                       <div className="detail-item">
//                         <Building size={14} />
//                         <span>{draft.grantor || 'No grantor'}</span>
//                       </div>
//                       <div className="detail-item">
//                         <Calendar size={14} />
//                         <span>{formatDate(draft.uploaded_at)}</span>
//                       </div>
//                       {getAssignedUsersCount(draft) > 0 && (
//                         <div className="detail-item">
//                           <Users size={14} />
//                           <span>{getAssignedUsersCount(draft)} assigned</span>
//                         </div>
//                       )}
//                     </div>

//                     {draft.purpose && (
//                       <div className="draft-purpose">
//                         <p>{draft.purpose.length > 100 ? draft.purpose.substring(0, 100) + '...' : draft.purpose}</p>
//                       </div>
//                     )}
//                   </div>

//                   <div className="card-footer">
//                     <button 
//                       className="btn-view"
//                       onClick={() => handleViewContract(draft.id)}
//                     >
//                       View Contract Details
//                       <ChevronRight size={16} />
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default DraftManagementPage;

// // import React, { useState, useEffect } from 'react';
// // import { useNavigate, useLocation } from 'react-router-dom';
// // import {
// //   Search,
// //   Filter,
// //   Calendar,
// //   RefreshCw,
// //   FileText,
// //   CheckCircle,
// //   AlertCircle,
// //   Clock,
// //   ChevronRight,
// //   Eye,
// //   User,
// //   Users,
// //   Loader2,
// //   FolderOpen,
// //   UserCheck,
// //   Edit,
// //   Trash2,
// //   Share2,
// //   DollarSign,
// //   Building
// // } from 'lucide-react';
// // import API_CONFIG from '../config';
// // import './DraftManagementPage.css';

// // function DraftManagementPage({ user }) {
// //   const navigate = useNavigate();
// //   const location = useLocation();
// //   const [drafts, setDrafts] = useState([]);
// //   const [loading, setLoading] = useState(false);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [activeTab, setActiveTab] = useState('my-drafts');
  
// //   // Determine active tab from URL
// //   useEffect(() => {
// //     if (location.pathname.includes('/drafts/my')) {
// //       setActiveTab('my-drafts');
// //     } else if (location.pathname.includes('/drafts/assigned')) {
// //       setActiveTab('assigned-drafts');
// //     }
// //   }, [location]);

// //   useEffect(() => {
// //     fetchDrafts();
// //   }, [activeTab]);

// //   const fetchDrafts = async () => {
// //     try {
// //       setLoading(true);
// //       const token = localStorage.getItem('token');
      
// //       if (activeTab === 'my-drafts') {
// //         // Fetch all contracts and filter for drafts created by current user
// //         const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
// //           headers: {
// //             'Authorization': `Bearer ${token}`,
// //             'Content-Type': 'application/json'
// //           }
// //         });

// //         if (response.ok) {
// //           const allContracts = await response.json();
          
// //           // Filter for drafts created by current user
// //           const myDrafts = allContracts.filter(contract => 
// //             contract.status === 'draft' && contract.created_by === user?.id
// //           );
          
// //           setDrafts(myDrafts);
// //         }
// //       } else {
// //         // Fetch assigned drafts from agreements endpoint
// //         const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/drafts`, {
// //           headers: {
// //             'Authorization': `Bearer ${token}`,
// //             'Content-Type': 'application/json'
// //           }
// //         });

// //         if (response.ok) {
// //           const assignedDrafts = await response.json();
          
// //           // Filter for drafts assigned to current user
// //           const userId = user?.id;
// //           const filteredDrafts = assignedDrafts.filter(draft => {
// //             return (
// //               (draft.assigned_pm_users && draft.assigned_pm_users.includes(userId)) ||
// //               (draft.assigned_pgm_users && draft.assigned_pgm_users.includes(userId)) ||
// //               (draft.assigned_director_users && draft.assigned_director_users.includes(userId))
// //             );
// //           });
          
// //           setDrafts(filteredDrafts);
// //         }
// //       }
// //     } catch (error) {
// //       console.error('Failed to fetch drafts:', error);
// //       // Fallback to localStorage for my drafts
// //       if (activeTab === 'my-drafts') {
// //         const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
// //         setDrafts(savedDrafts);
// //       } else {
// //         setDrafts([]);
// //       }
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const formatCurrency = (amount) => {
// //     if (!amount && amount !== 0) return '-';
// //     return new Intl.NumberFormat('en-US', {
// //       style: 'currency',
// //       currency: 'USD',
// //       minimumFractionDigits: 0,
// //       maximumFractionDigits: 0
// //     }).format(amount);
// //   };

// //   const formatDate = (dateString) => {
// //     if (!dateString) return 'N/A';
// //     try {
// //       return new Date(dateString).toLocaleDateString('en-US', {
// //         month: 'short',
// //         day: 'numeric',
// //         year: 'numeric'
// //       });
// //     } catch (e) {
// //       return 'Invalid Date';
// //     }
// //   };

// //   const getAssignedUsersCount = (draft) => {
// //     let count = 0;
// //     if (draft.assigned_pm_users) count += draft.assigned_pm_users.length;
// //     if (draft.assigned_pgm_users) count += draft.assigned_pgm_users.length;
// //     if (draft.assigned_director_users) count += draft.assigned_director_users.length;
// //     return count;
// //   };

// //   const handleDeleteDraft = async (draftId) => {
// //     if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
// //       return;
// //     }

// //     try {
// //       const token = localStorage.getItem('token');
// //       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${draftId}`, {
// //         method: 'DELETE',
// //         headers: {
// //           'Authorization': `Bearer ${token}`,
// //           'Content-Type': 'application/json'
// //         }
// //       });

// //       if (response.ok) {
// //         alert('Draft deleted successfully!');
// //         fetchDrafts(); // Refresh the list
        
// //         // Also remove from localStorage
// //         const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
// //         const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
// //         localStorage.setItem('user_drafts', JSON.stringify(updatedDrafts));
// //       } else {
// //         const error = await response.json();
// //         alert(`Failed to delete draft: ${error.detail}`);
// //       }
// //     } catch (error) {
// //       console.error('Failed to delete draft:', error);
// //       alert('Failed to delete draft');
// //     }
// //   };

// //   const filteredDrafts = drafts.filter(draft => {
// //     if (searchTerm) {
// //       const searchLower = searchTerm.toLowerCase();
// //       return (
// //         (draft.grant_name && draft.grant_name.toLowerCase().includes(searchLower)) ||
// //         (draft.filename && draft.filename.toLowerCase().includes(searchLower)) ||
// //         (draft.contract_number && draft.contract_number?.toLowerCase().includes(searchLower))
// //       );
// //     }
// //     return true;
// //   });

// //   return (
// //     <div className="draft-management-page">
// //       {/* Header */}
// //       <div className="draft-header">
// //         <div className="header-left">
// //           <h1>Draft Management</h1>
// //           <p className="page-subtitle">
// //             Manage your draft agreements before publishing
// //           </p>
// //         </div>
// //         <div className="header-actions">
// //           <button 
// //             className="btn-primary"
// //             onClick={() => navigate('/upload')}
// //           >
// //             <FileText size={16} />
// //             Create New Draft
// //           </button>
// //           <button 
// //             className="btn-secondary"
// //             onClick={fetchDrafts}
// //             disabled={loading}
// //           >
// //             <RefreshCw size={16} className={loading ? 'spinning' : ''} />
// //           </button>
// //         </div>
// //       </div>

// //       {/* Tabs */}
// //       <div className="draft-tabs">
// //         <button
// //           className={`tab-btn ${activeTab === 'my-drafts' ? 'active' : ''}`}
// //           onClick={() => {
// //             setActiveTab('my-drafts');
// //             navigate('/drafts/my');
// //           }}
// //         >
// //           <FolderOpen size={18} />
// //           My Drafts ({drafts.filter(d => d.created_by === user?.id).length})
// //         </button>
// //         <button
// //           className={`tab-btn ${activeTab === 'assigned-drafts' ? 'active' : ''}`}
// //           onClick={() => {
// //             setActiveTab('assigned-drafts');
// //             navigate('/drafts/assigned');
// //           }}
// //         >
// //           <UserCheck size={18} />
// //           Assigned to Me ({drafts.filter(d => {
// //             const userId = user?.id;
// //             return (
// //               (d.assigned_pm_users && d.assigned_pm_users.includes(userId)) ||
// //               (d.assigned_pgm_users && d.assigned_pgm_users.includes(userId)) ||
// //               (d.assigned_director_users && d.assigned_director_users.includes(userId))
// //             );
// //           }).length})
// //         </button>
// //       </div>

// //       {/* Search */}
// //       <div className="draft-search">
// //         <div className="search-container">
// //           <Search className="search-icon" />
// //           <input
// //             type="text"
// //             placeholder="Search drafts..."
// //             value={searchTerm}
// //             onChange={(e) => setSearchTerm(e.target.value)}
// //             className="search-input"
// //           />
// //         </div>
// //       </div>

// //       {/* Drafts List */}
// //       <div className="drafts-section">
// //         {loading ? (
// //           <div className="loading-state">
// //             <Loader2 className="spinner" />
// //             <p>Loading drafts...</p>
// //           </div>
// //         ) : filteredDrafts.length === 0 ? (
// //           <div className="empty-state">
// //             <FileText size={48} />
// //             <h3>No drafts found</h3>
// //             <p>
// //               {activeTab === 'my-drafts' 
// //                 ? 'Upload a contract to create your first draft' 
// //                 : 'No drafts have been assigned to you yet'}
// //             </p>
// //             {activeTab === 'my-drafts' && (
// //               <button 
// //                 className="btn-primary"
// //                 onClick={() => navigate('/upload')}
// //               >
// //                 Create First Draft
// //               </button>
// //             )}
// //           </div>
// //         ) : (
// //           <div className="drafts-grid">
// //             {filteredDrafts.map((draft) => (
// //               <div key={draft.id} className="draft-card">
// //                 <div className="card-header">
// //                   <div className="draft-status">
// //                     <span className="status-badge draft">Draft</span>
// //                   </div>
// //                   <div className="card-actions">
// //                     <button 
// //                       className="btn-action"
// //                       onClick={() => navigate(`/contracts/${draft.id}`)}
// //                       title="View Details"
// //                     >
// //                       <Eye size={14} />
// //                     </button>
// //                     <button 
// //                       className="btn-action"
// //                       onClick={() => navigate(`/contracts/${draft.id}`)}
// //                       title="Edit"
// //                     >
// //                       <Edit size={14} />
// //                     </button>
// //                     <button 
// //                       className="btn-action delete"
// //                       onClick={() => handleDeleteDraft(draft.id)}
// //                       title="Delete"
// //                     >
// //                       <Trash2 size={14} />
// //                     </button>
// //                   </div>
// //                 </div>

// //                 <div className="card-content">
// //                   <div className="draft-icon">
// //                     <FileText size={24} />
// //                   </div>
// //                   <h3 className="draft-name">
// //                     {draft.grant_name || draft.filename || 'Unnamed Draft'}
// //                   </h3>
// //                   <p className="draft-id">
// //                     ID: {draft.id}
// //                   </p>

// //                   <div className="draft-details">
// //                     <div className="detail-item">
// //                       <DollarSign size={14} />
// //                       <span>{formatCurrency(draft.total_amount)}</span>
// //                     </div>
// //                     <div className="detail-item">
// //                       <Building size={14} />
// //                       <span>{draft.grantor || 'No grantor'}</span>
// //                     </div>
// //                     <div className="detail-item">
// //                       <Calendar size={14} />
// //                       <span>{formatDate(draft.uploaded_at)}</span>
// //                     </div>
// //                     {getAssignedUsersCount(draft) > 0 && (
// //                       <div className="detail-item">
// //                         <Users size={14} />
// //                         <span>{getAssignedUsersCount(draft)} assigned</span>
// //                       </div>
// //                     )}
// //                   </div>

// //                   {draft.purpose && (
// //                     <div className="draft-purpose">
// //                       <p>{draft.purpose.length > 100 ? draft.purpose.substring(0, 100) + '...' : draft.purpose}</p>
// //                     </div>
// //                   )}
// //                 </div>

// //                 <div className="card-footer">
// //                   <button 
// //                     className="btn-view"
// //                     onClick={() => navigate(`/contracts/${draft.id}`)}
// //                   >
// //                     View Contract Details
// //                     <ChevronRight size={16} />
// //                   </button>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // export default DraftManagementPage;

// // // import React, { useState, useEffect } from 'react';
// // // import { useNavigate, useLocation } from 'react-router-dom';
// // // import {
// // //   Search,
// // //   Filter,
// // //   Calendar,
// // //   RefreshCw,
// // //   FileText,
// // //   CheckCircle,
// // //   AlertCircle,
// // //   Clock,
// // //   ChevronRight,
// // //   MoreVertical,
// // //   Download,
// // //   Eye,
// // //   User,
// // //   Users,
// // //   DollarSign,
// // //   X,
// // //   ChevronDown,
// // //   Loader2,
// // //   FolderOpen,
// // //   UserCheck,
// // //   Edit,
// // //   Trash2,
// // //   Share2,
// // //   Archive
// // // } from 'lucide-react';
// // // import API_CONFIG from '../config';
// // // import './DraftManagementPage.css';

// // // function DraftManagementPage({ user }) {
// // //   const navigate = useNavigate();
// // //   const location = useLocation();
// // //   const [drafts, setDrafts] = useState([]);
// // //   const [loading, setLoading] = useState(false);
// // //   const [searchTerm, setSearchTerm] = useState('');
// // //   const [statusFilter, setStatusFilter] = useState('all');
// // //   const [dateFilter, setDateFilter] = useState('all');
// // //   const [showFilters, setShowFilters] = useState(false);
// // //   const [activeTab, setActiveTab] = useState('my-drafts');
  
// // //   // Determine active tab from URL
// // //   useEffect(() => {
// // //     if (location.pathname.includes('/drafts/my')) {
// // //       setActiveTab('my-drafts');
// // //     } else if (location.pathname.includes('/drafts/assigned')) {
// // //       setActiveTab('assigned-drafts');
// // //     }
// // //   }, [location]);

// // //   useEffect(() => {
// // //     fetchDrafts();
// // //   }, [activeTab]);

// // //   const fetchDrafts = async () => {
// // //     try {
// // //       setLoading(true);
// // //       const token = localStorage.getItem('token');
      
// // //       let url = '';
// // //       if (activeTab === 'my-drafts') {
// // //         // Fetch drafts created by current user
// // //         url = `${API_CONFIG.BASE_URL}/api/contracts/?status=draft`;
// // //       } else {
// // //         // Fetch drafts assigned to current user
// // //         url = `${API_CONFIG.BASE_URL}/api/agreements/drafts`;
// // //       }

// // //       const response = await fetch(url, {
// // //         headers: {
// // //           'Authorization': `Bearer ${token}`,
// // //           'Content-Type': 'application/json'
// // //         }
// // //       });

// // //       if (response.ok) {
// // //         const data = await response.json();
        
// // //         // Filter for drafts only
// // //         const draftContracts = data.filter(contract => 
// // //           contract.status === 'draft'
// // //         );
        
// // //         // For assigned drafts, filter by assigned users
// // //         if (activeTab === 'assigned-drafts') {
// // //           const userId = user?.id;
// // //           const assignedDrafts = draftContracts.filter(contract => {
// // //             return (
// // //               (contract.assigned_pm_users && contract.assigned_pm_users.includes(userId)) ||
// // //               (contract.assigned_pgm_users && contract.assigned_pgm_users.includes(userId)) ||
// // //               (contract.assigned_director_users && contract.assigned_director_users.includes(userId))
// // //             );
// // //           });
// // //           setDrafts(assignedDrafts);
// // //         } else {
// // //           // My drafts - created by current user
// // //           const myDrafts = draftContracts.filter(contract => 
// // //             contract.created_by === user?.id
// // //           );
// // //           setDrafts(myDrafts);
// // //         }
// // //       }
// // //     } catch (error) {
// // //       console.error('Failed to fetch drafts:', error);
// // //       // Fallback to localStorage
// // //       const savedDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
// // //       setDrafts(savedDrafts);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const formatCurrency = (amount) => {
// // //     if (!amount && amount !== 0) return '-';
// // //     return new Intl.NumberFormat('en-US', {
// // //       style: 'currency',
// // //       currency: 'USD',
// // //       minimumFractionDigits: 0,
// // //       maximumFractionDigits: 0
// // //     }).format(amount);
// // //   };

// // //   const formatDate = (dateString) => {
// // //     if (!dateString) return 'N/A';
// // //     try {
// // //       return new Date(dateString).toLocaleDateString('en-US', {
// // //         month: 'short',
// // //         day: 'numeric',
// // //         year: 'numeric'
// // //       });
// // //     } catch (e) {
// // //       return 'Invalid Date';
// // //     }
// // //   };

// // //   const getAssignedUsersCount = (contract) => {
// // //     let count = 0;
// // //     if (contract.assigned_pm_users) count += contract.assigned_pm_users.length;
// // //     if (contract.assigned_pgm_users) count += contract.assigned_pgm_users.length;
// // //     if (contract.assigned_director_users) count += contract.assigned_director_users.length;
// // //     return count;
// // //   };

// // //   const handleEditDraft = (draftId) => {
// // //     navigate(`/contracts/${draftId}`);
// // //   };

// // //   const handleDeleteDraft = async (draftId) => {
// // //     if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
// // //       return;
// // //     }

// // //     try {
// // //       const token = localStorage.getItem('token');
// // //       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${draftId}`, {
// // //         method: 'DELETE',
// // //         headers: {
// // //           'Authorization': `Bearer ${token}`,
// // //           'Content-Type': 'application/json'
// // //         }
// // //       });

// // //       if (response.ok) {
// // //         alert('Draft deleted successfully!');
// // //         fetchDrafts(); // Refresh the list
// // //       } else {
// // //         const error = await response.json();
// // //         alert(`Failed to delete draft: ${error.detail}`);
// // //       }
// // //     } catch (error) {
// // //       console.error('Failed to delete draft:', error);
// // //       alert('Failed to delete draft');
// // //     }
// // //   };

// // //   const handleAssignUsers = (draftId) => {
// // //     // Navigate to contract details where workflow can handle assignment
// // //     navigate(`/contracts/${draftId}`);
// // //   };

// // //   const filteredDrafts = drafts.filter(draft => {
// // //     if (searchTerm) {
// // //       const searchLower = searchTerm.toLowerCase();
// // //       return (
// // //         (draft.grant_name && draft.grant_name.toLowerCase().includes(searchLower)) ||
// // //         (draft.filename && draft.filename.toLowerCase().includes(searchLower)) ||
// // //         (draft.contract_number && draft.contract_number.toLowerCase().includes(searchLower))
// // //       );
// // //     }
// // //     return true;
// // //   });

// // //   return (
// // //     <div className="draft-management-page">
// // //       {/* Header */}
// // //       <div className="draft-header">
// // //         <div className="header-left">
// // //           <h1>Draft Management</h1>
// // //           <p className="page-subtitle">
// // //             Manage your draft agreements before publishing
// // //           </p>
// // //         </div>
// // //         <div className="header-actions">
// // //           <button 
// // //             className="btn-primary"
// // //             onClick={() => navigate('/upload')}
// // //           >
// // //             <FileText size={16} />
// // //             Create New Draft
// // //           </button>
// // //           <button 
// // //             className="btn-secondary"
// // //             onClick={fetchDrafts}
// // //             disabled={loading}
// // //           >
// // //             <RefreshCw size={16} className={loading ? 'spinning' : ''} />
// // //           </button>
// // //         </div>
// // //       </div>

// // //       {/* Tabs */}
// // //       <div className="draft-tabs">
// // //         <button
// // //           className={`tab-btn ${activeTab === 'my-drafts' ? 'active' : ''}`}
// // //           onClick={() => {
// // //             setActiveTab('my-drafts');
// // //             navigate('/drafts/my');
// // //           }}
// // //         >
// // //           <FolderOpen size={18} />
// // //           My Drafts ({drafts.filter(d => d.created_by === user?.id).length})
// // //         </button>
// // //         <button
// // //           className={`tab-btn ${activeTab === 'assigned-drafts' ? 'active' : ''}`}
// // //           onClick={() => {
// // //             setActiveTab('assigned-drafts');
// // //             navigate('/drafts/assigned');
// // //           }}
// // //         >
// // //           <UserCheck size={18} />
// // //           Assigned to Me ({drafts.filter(d => {
// // //             const userId = user?.id;
// // //             return (
// // //               (d.assigned_pm_users && d.assigned_pm_users.includes(userId)) ||
// // //               (d.assigned_pgm_users && d.assigned_pgm_users.includes(userId)) ||
// // //               (d.assigned_director_users && d.assigned_director_users.includes(userId))
// // //             );
// // //           }).length})
// // //         </button>
// // //       </div>

// // //       {/* Search and Filters */}
// // //       <div className="draft-controls">
// // //         <div className="search-container">
// // //           <Search className="search-icon" />
// // //           <input
// // //             type="text"
// // //             placeholder="Search drafts..."
// // //             value={searchTerm}
// // //             onChange={(e) => setSearchTerm(e.target.value)}
// // //             className="search-input"
// // //           />
// // //         </div>

// // //         <div className="filter-container">
// // //           <button 
// // //             className="btn-filter"
// // //             onClick={() => setShowFilters(!showFilters)}
// // //           >
// // //             <Filter size={16} />
// // //             Filter
// // //           </button>
          
// // //           {showFilters && (
// // //             <div className="filter-dropdown">
// // //               <div className="filter-section">
// // //                 <label>Status</label>
// // //                 <select
// // //                   value={statusFilter}
// // //                   onChange={(e) => setStatusFilter(e.target.value)}
// // //                 >
// // //                   <option value="all">All Status</option>
// // //                   <option value="draft">Draft</option>
// // //                   <option value="in_progress">In Progress</option>
// // //                 </select>
// // //               </div>
// // //               <div className="filter-section">
// // //                 <label>Date</label>
// // //                 <select
// // //                   value={dateFilter}
// // //                   onChange={(e) => setDateFilter(e.target.value)}
// // //                 >
// // //                   <option value="all">All Dates</option>
// // //                   <option value="today">Today</option>
// // //                   <option value="week">This Week</option>
// // //                   <option value="month">This Month</option>
// // //                 </select>
// // //               </div>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </div>

// // //       {/* Drafts List */}
// // //       <div className="drafts-section">
// // //         {loading ? (
// // //           <div className="loading-state">
// // //             <Loader2 className="spinner" />
// // //             <p>Loading drafts...</p>
// // //           </div>
// // //         ) : filteredDrafts.length === 0 ? (
// // //           <div className="empty-state">
// // //             <FileText size={48} />
// // //             <h3>No drafts found</h3>
// // //             <p>
// // //               {activeTab === 'my-drafts' 
// // //                 ? 'Upload a contract to create your first draft' 
// // //                 : 'No drafts have been assigned to you yet'}
// // //             </p>
// // //             {activeTab === 'my-drafts' && (
// // //               <button 
// // //                 className="btn-primary"
// // //                 onClick={() => navigate('/upload')}
// // //               >
// // //                 Create First Draft
// // //               </button>
// // //             )}
// // //           </div>
// // //         ) : (
// // //           <div className="drafts-grid">
// // //             {filteredDrafts.map((draft) => (
// // //               <div key={draft.id} className="draft-card">
// // //                 <div className="card-header">
// // //                   <div className="draft-status">
// // //                     <span className="status-badge draft">
// // //                       {draft.status || 'Draft'}
// // //                     </span>
// // //                   </div>
// // //                   <div className="card-actions">
// // //                     <button 
// // //                       className="btn-action"
// // //                       onClick={() => handleEditDraft(draft.id)}
// // //                       title="Edit"
// // //                     >
// // //                       <Edit size={14} />
// // //                     </button>
// // //                     <button 
// // //                       className="btn-action"
// // //                       onClick={() => handleAssignUsers(draft.id)}
// // //                       title="Assign Users"
// // //                     >
// // //                       <Share2 size={14} />
// // //                     </button>
// // //                     <button 
// // //                       className="btn-action delete"
// // //                       onClick={() => handleDeleteDraft(draft.id)}
// // //                       title="Delete"
// // //                     >
// // //                       <Trash2 size={14} />
// // //                     </button>
// // //                   </div>
// // //                 </div>

// // //                 <div className="card-content">
// // //                   <div className="draft-icon">
// // //                     <FileText size={24} />
// // //                   </div>
// // //                   <h3 className="draft-name">
// // //                     {draft.grant_name || draft.filename}
// // //                   </h3>
// // //                   <p className="draft-id">
// // //                     ID: {draft.id}
// // //                   </p>

// // //                   <div className="draft-details">
// // //                     <div className="detail-item">
// // //                       <DollarSign size={14} />
// // //                       <span>{formatCurrency(draft.total_amount)}</span>
// // //                     </div>
// // //                     <div className="detail-item">
// // //                       <Calendar size={14} />
// // //                       <span>{formatDate(draft.uploaded_at)}</span>
// // //                     </div>
// // //                     {getAssignedUsersCount(draft) > 0 && (
// // //                       <div className="detail-item">
// // //                         <Users size={14} />
// // //                         <span>{getAssignedUsersCount(draft)} assigned</span>
// // //                       </div>
// // //                     )}
// // //                   </div>

// // //                   {draft.purpose && (
// // //                     <div className="draft-purpose">
// // //                       <p>{draft.purpose.length > 100 ? draft.purpose.substring(0, 100) + '...' : draft.purpose}</p>
// // //                     </div>
// // //                   )}
// // //                 </div>

// // //                 <div className="card-footer">
// // //                   <button 
// // //                     className="btn-view"
// // //                     onClick={() => navigate(`/contracts/${draft.id}`)}
// // //                   >
// // //                     View Details
// // //                     <ChevronRight size={16} />
// // //                   </button>
// // //                 </div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // export default DraftManagementPage;