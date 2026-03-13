import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  Clock,
  AlertCircle,
  Settings,
  Eye,
  X,
  DollarSign,
  CalendarDays,
  Hash,
  Building2,
  User
} from 'lucide-react';
import { TbFilePencil, TbUserCheck, TbUserPlus } from 'react-icons/tb';
import AgreementWorkflow from '../workflow/AgreementWorkflow';
import API_CONFIG from '../../config';
import './DraftsPanel.css';

const DraftsPanel = ({ user }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [myDrafts, setMyDrafts] = useState([]);
  const [assignedToMe, setAssignedToMe] = useState([]);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('myDrafts');
  const [selectedDraft, setSelectedDraft] = useState(null);

  // Workflow modal state
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedContractForWorkflow, setSelectedContractForWorkflow] = useState(null);

  const fetchDrafts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const token = localStorage.getItem('token');
    const baseUrl = API_CONFIG.BASE_URL;

    try {
      // Fetch My Drafts — only for project_manager
      if (['project_manager'].includes(user.role)) {
        const myDraftsResponse = await fetch(`${baseUrl}/api/contracts/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (myDraftsResponse.ok) {
          const data = await myDraftsResponse.json();
          const draftStatuses = ['draft', 'under_review', 'reviewed', 'rejected'];
          const filtered = (Array.isArray(data) ? data : []).filter(draft =>
            draft.created_by === user.id &&
            draftStatuses.includes(draft.status)
          );
          setMyDrafts(filtered.slice(0, 10));
        }
      }

      // Fetch Assigned to Me
      if (['project_manager', 'program_manager', 'director'].includes(user.role)) {
        const assignedToMeResponse = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assignedToMeResponse.ok) {
          const data = await assignedToMeResponse.json();
          setAssignedToMe(data.drafts?.slice(0, 10) || []);
        }
      }

      // Fetch Assigned by Me
      if (['program_manager', 'director'].includes(user.role)) {
        const assignedByMeResponse = await fetch(`${baseUrl}/api/agreements/assigned-by-me?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assignedByMeResponse.ok) {
          const data = await assignedByMeResponse.json();
          setAssignedByMe(data.drafts?.slice(0, 10) || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDrafts();

    const handleDraftUpdate = () => fetchDrafts();
    window.addEventListener('draft-updated', handleDraftUpdate);
    window.addEventListener('contract-submitted', handleDraftUpdate);
    window.addEventListener('assignment-changed', handleDraftUpdate);

    return () => {
      window.removeEventListener('draft-updated', handleDraftUpdate);
      window.removeEventListener('contract-submitted', handleDraftUpdate);
      window.removeEventListener('assignment-changed', handleDraftUpdate);
    };
  }, [fetchDrafts]);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedDraft(null);
  }, [activeTab]);

  const handleCardClick = (draft) => {
    setSelectedDraft(prev => prev?.id === draft.id ? null : draft);
  };

  const handleOpenWorkflow = async (e, draft) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/agreements/drafts/${draft.id}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedContractForWorkflow(data.contract || draft);
      } else {
        setSelectedContractForWorkflow(draft);
      }
    } catch {
      setSelectedContractForWorkflow(draft);
    }
    setShowWorkflowModal(true);
  };

  const handleWorkflowComplete = () => {
    fetchDrafts();
    setShowWorkflowModal(false);
    setSelectedContractForWorkflow(null);
    window.dispatchEvent(new CustomEvent('assignment-changed'));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': { label: 'Draft', class: 'draft-status-draft', icon: FileText },
      'under_review': { label: 'Review', class: 'draft-status-review', icon: Clock },
      'assigned': { label: 'Assigned', class: 'draft-status-assigned', icon: UserCheck },
      'changes_requested': { label: 'Changes', class: 'draft-status-changes', icon: AlertCircle }
    };
    const statusInfo = statusMap[status] || { label: status, class: 'draft-status-default', icon: FileText };
    const StatusIcon = statusInfo.icon;

    return (
      <span className={`draft-status-badge ${statusInfo.class}`}>
        <StatusIcon size={12} />
        <span>{statusInfo.label}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'N/A';
    }
  };

  const getEffectiveStatus = (draft, tab) => {
    if (tab === 'assignedToMe') return 'assigned';
    if (tab === 'myDrafts') {
      const tracking = draft.comprehensive_data?.assignment_tracking;
      const hasAssigned = (
        (tracking?.current_pm_users?.length > 0) ||
        (tracking?.current_pgm_users?.length > 0) ||
        (tracking?.current_director_users?.length > 0)
      );
      if (hasAssigned) return 'assigned';
    }
    return draft.status;
  };

  const renderCard = (draft, showWorkflowBtn = false, statusOverride = null) => (
    <div
      key={draft.id}
      className={`draft-item${selectedDraft?.id === draft.id ? ' selected' : ''}`}
      onClick={() => handleCardClick(draft)}
    >
      <div className="draft-item-title">{draft.grant_name || draft.filename || draft.title || 'Untitled Draft'}</div>
      <div className="draft-item-meta">
        {getStatusBadge(statusOverride || draft.status)}
        <span className="draft-date">
          {formatDate(draft.uploaded_at || draft.updated_at || draft.created_at)}
        </span>
      </div>
      <div className="draft-item-actions">
        <button
          className="draft-action-btn draft-action-eye"
          onClick={(e) => { e.stopPropagation(); navigate(`/app/contracts/${draft.agreement_id || draft.id}`); }}
          title="View contract details"
        >
          <Eye size={13} />
          <span>View</span>
        </button>
        {showWorkflowBtn && (
          <button
            className="draft-action-btn draft-action-gear"
            onClick={(e) => handleOpenWorkflow(e, draft)}
            title="Manage workflow & assignment"
          >
            <Settings size={13} />
            <span>Assign</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderDetailOverlay = () => {
    if (!selectedDraft) return null;
    const d = selectedDraft;
    return (
      <div className="draft-detail-overlay" onClick={() => setSelectedDraft(null)}>
        <div className="draft-detail-card" onClick={e => e.stopPropagation()}>
          <div className="draft-detail-card-header">
            <div className="draft-detail-title">{d.grant_name || d.filename || d.title || 'Untitled Draft'}</div>
            <button className="draft-detail-close" onClick={() => setSelectedDraft(null)}><X size={16} /></button>
          </div>
          <div className="draft-detail-status-row">
            {getStatusBadge(d.status)}
            <span className="draft-detail-date">Uploaded: {formatDate(d.uploaded_at || d.created_at)}</span>
          </div>
          <div className="draft-detail-grid">
            {(d.grantor || d.grantor_name) && (
              <div className="draft-detail-cell">
                <span className="draft-detail-cell-label"><Building2 size={13} /> Grantor</span>
                <span className="draft-detail-cell-value">{d.grantor || d.grantor_name}</span>
              </div>
            )}
            {d.grant_id && (
              <div className="draft-detail-cell">
                <span className="draft-detail-cell-label"><Hash size={13} /> Grantor ID</span>
                <span className="draft-detail-cell-value">{d.grant_id}</span>
              </div>
            )}
            {(d.grantee || d.grantee_name) && (
              <div className="draft-detail-cell">
                <span className="draft-detail-cell-label"><User size={13} /> Grantee</span>
                <span className="draft-detail-cell-value">{d.grantee || d.grantee_name}</span>
              </div>
            )}
            {d.total_amount && (
              <div className="draft-detail-cell">
                <span className="draft-detail-cell-label"><DollarSign size={13} /> Amount</span>
                <span className="draft-detail-cell-value draft-detail-amount">
                  {typeof d.total_amount === 'number'
                    ? `$${d.total_amount.toLocaleString()}`
                    : d.total_amount}
                </span>
              </div>
            )}
            {d.contract_number && (
              <div className="draft-detail-cell">
                <span className="draft-detail-cell-label"><Hash size={13} /> Contract #</span>
                <span className="draft-detail-cell-value">{d.contract_number}</span>
              </div>
            )}
            {d.start_date && (
              <div className="draft-detail-cell">
                <span className="draft-detail-cell-label"><CalendarDays size={13} /> Start</span>
                <span className="draft-detail-cell-value">{formatDate(d.start_date)}</span>
              </div>
            )}
            {d.end_date && (
              <div className="draft-detail-cell">
                <span className="draft-detail-cell-label"><CalendarDays size={13} /> End</span>
                <span className="draft-detail-cell-value">{formatDate(d.end_date)}</span>
              </div>
            )}
          </div>
          {d.purpose && (
            <div className="draft-detail-purpose">
              <span className="draft-detail-cell-label">Purpose</span>
              <p>{d.purpose}</p>
            </div>
          )}
          <div className="draft-detail-card-footer">
            <button
              className="draft-detail-footer-btn draft-detail-btn-assign"
              onClick={(e) => { handleOpenWorkflow(e, d); }}
            >
              <Settings size={14} /> Assign To People
            </button>
            <button
              className="draft-detail-footer-btn draft-detail-btn-view"
              onClick={() => { setSelectedDraft(null); navigate(`/app/contracts/${d.agreement_id || d.id}`); }}
            >
              <Eye size={14} /> Open Full Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Calculate total drafts count for collapsed badge
  const totalDrafts = (myDrafts?.length || 0) + (assignedToMe?.length || 0) + (assignedByMe?.length || 0);

  // Check if user has access to each tab
  const hasMyDraftsAccess = ['project_manager'].includes(user?.role);
  const hasAssignedToMeAccess = ['project_manager', 'program_manager', 'director'].includes(user?.role);
  const hasAssignedByMeAccess = ['program_manager', 'director'].includes(user?.role);

  // Set default tab based on access priority
  useEffect(() => {
    if (hasMyDraftsAccess) {
      setActiveTab('myDrafts');
    } else {
      setActiveTab('assignedToMe');
    }
  }, [hasMyDraftsAccess]);

  // Don't render if user doesn't have draft access
  if (!user || !['project_manager', 'program_manager', 'director'].includes(user.role)) {
    return null;
  }

  return (
    <>
      <div className={`draft-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button
          className="draft-panel-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse drafts panel' : 'Expand drafts panel'}
        >
          {isExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {isExpanded ? (
          <div className="draft-panel-content">
            <div className="draft-panel-header">
              <h3>
                {user?.role === 'project_manager' ? 'Drafts' : 'Assigned Grants'}
              </h3>
              <button
                className="draft-view-all"
                onClick={() => navigate('/app/drafts')}
                title={user?.role === 'project_manager' ? 'View all drafts' : 'View all assigned grants'}
              >
                View All
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="draft-tabs">
              {hasMyDraftsAccess && (
                <button
                  className={`draft-tab ${activeTab === 'myDrafts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('myDrafts')}
                >
                  <TbFilePencil size={14} />
                  <span>My Drafts</span>
                  {myDrafts.length > 0 && (
                    <span className="draft-tab-count">{myDrafts.length}</span>
                  )}
                </button>
              )}

              {hasAssignedToMeAccess && (
                <button
                  className={`draft-tab ${activeTab === 'assignedToMe' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assignedToMe')}
                >
                  <TbUserCheck size={14} />
                  <span>To Me</span>
                  {assignedToMe.length > 0 && (
                    <span className="draft-tab-count">{assignedToMe.length}</span>
                  )}
                </button>
              )}

              {hasAssignedByMeAccess && (
                <button
                  className={`draft-tab ${activeTab === 'assignedByMe' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assignedByMe')}
                >
                  <TbUserPlus size={14} />
                  <span>By Me</span>
                  {assignedByMe.length > 0 && (
                    <span className="draft-tab-count">{assignedByMe.length}</span>
                  )}
                </button>
              )}
            </div>

            {/* My Drafts Tab Content */}
            {activeTab === 'myDrafts' && hasMyDraftsAccess && (
              <div className="draft-tab-content">
                {loading ? (
                  <div className="draft-loading">Loading drafts...</div>
                ) : myDrafts.length > 0 ? (
                  myDrafts.map(draft => renderCard(draft, true, getEffectiveStatus(draft, 'myDrafts')))
                ) : (
                  <div className="draft-empty">No drafts yet</div>
                )}
              </div>
            )}

            {/* Assigned to Me Tab Content */}
            {activeTab === 'assignedToMe' && hasAssignedToMeAccess && (
              <div className="draft-tab-content">
                {loading ? (
                  <div className="draft-loading">Loading assigned drafts...</div>
                ) : assignedToMe.length > 0 ? (
                  assignedToMe.map(draft => renderCard(draft, ['program_manager', 'director'].includes(user?.role), 'assigned'))
                ) : (
                  <div className="draft-empty">No drafts assigned to you</div>
                )}
              </div>
            )}

            {/* Assigned by Me Tab Content */}
            {activeTab === 'assignedByMe' && hasAssignedByMeAccess && (
              <div className="draft-tab-content">
                {loading ? (
                  <div className="draft-loading">Loading drafts you assigned...</div>
                ) : assignedByMe.length > 0 ? (
                  assignedByMe.map(draft => renderCard(draft, false))
                ) : (
                  <div className="draft-empty">No drafts assigned by you</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className="draft-vertical-text"
            onClick={() => setIsExpanded(true)}
            title={user?.role === 'project_manager' ? 'Expand drafts panel' : 'Expand assigned grants panel'}
          >
            <TbFilePencil size={18} />
            <span>{user?.role === 'project_manager' ? 'DRAFTS' : 'ASSIGNED'}</span>
            {totalDrafts > 0 && (
              <span className="draft-collapsed-badge">{totalDrafts}</span>
            )}
          </div>
        )}
      </div>

      {/* Detail overlay — rendered outside panel, fixed in main content area */}
      {renderDetailOverlay()}

      {/* Workflow Modal */}
      {showWorkflowModal && selectedContractForWorkflow && (
        <div className="draft-workflow-modal-overlay" onClick={() => { setShowWorkflowModal(false); setSelectedContractForWorkflow(null); }}>
          <div className="draft-workflow-modal-content" onClick={e => e.stopPropagation()}>
            <div className="draft-workflow-modal-header">
              <h3>Agreement Workflow</h3>
              <button
                className="draft-workflow-modal-close"
                onClick={() => { setShowWorkflowModal(false); setSelectedContractForWorkflow(null); }}
              >
                ×
              </button>
            </div>
            <div className="draft-workflow-modal-body">
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
    </>
  );
};

export default DraftsPanel;
