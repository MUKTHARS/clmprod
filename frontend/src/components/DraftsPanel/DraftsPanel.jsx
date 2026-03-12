import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  Clock,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { TbFilePencil, TbUserCheck, TbUserPlus } from 'react-icons/tb';
import API_CONFIG from '../../config';
import './DraftsPanel.css';

const DraftsPanel = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [myDrafts, setMyDrafts] = useState([]);
  const [assignedToMe, setAssignedToMe] = useState([]);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('myDrafts'); // 'myDrafts', 'assignedToMe', 'assignedByMe'

  const fetchDrafts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    const baseUrl = API_CONFIG.BASE_URL;

    try {
      // Fetch My Drafts (only for Project Managers)
      if (user.role === 'project_manager') {
        const myDraftsResponse = await fetch(`${baseUrl}/api/agreements/drafts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (myDraftsResponse.ok) {
          const data = await myDraftsResponse.json();
          const filtered = data.filter(draft => 
            draft.created_by === user.id || draft.userId === user.id
          );
          setMyDrafts(filtered.slice(0, 10));
        }
      }

      // Fetch Assigned to Me (for PM, Program Manager, Director)
      if (['project_manager', 'program_manager', 'director'].includes(user.role)) {
        const assignedToMeResponse = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assignedToMeResponse.ok) {
          const data = await assignedToMeResponse.json();
          setAssignedToMe(data.drafts?.slice(0, 10) || []);
        }
      }

      // Fetch Assigned by Me (for Program Manager and Director)
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

    // Refresh on events
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

  const handleDraftClick = (draft) => {
    if (draft.agreement_id || draft.id) {
      navigate(`/app/contracts/${draft.agreement_id || draft.id}`);
    }
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

  // Calculate total drafts count for collapsed badge
  const totalDrafts = (myDrafts?.length || 0) + (assignedToMe?.length || 0) + (assignedByMe?.length || 0);

  // Check if user has access to each tab
  const hasMyDraftsAccess = user?.role === 'project_manager';
  const hasAssignedToMeAccess = ['project_manager', 'program_manager', 'director'].includes(user?.role);
  const hasAssignedByMeAccess = ['program_manager', 'director'].includes(user?.role);

  // Set default tab based on access priority
  useEffect(() => {
    if (hasMyDraftsAccess) {
      setActiveTab('myDrafts');
    } else if (hasAssignedToMeAccess) {
      setActiveTab('assignedToMe');
    }
  }, [hasMyDraftsAccess, hasAssignedToMeAccess]);

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
          // Expanded View
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
                  myDrafts.map(draft => (
                    <div
                      key={draft.id}
                      className={`draft-item ${location.pathname.includes(draft.agreement_id || draft.id) ? 'active' : ''}`}
                      onClick={() => handleDraftClick(draft)}
                    >
                      <div className="draft-item-title">{draft.grant_name || draft.filename || draft.title || 'Untitled Draft'}</div>
                      <div className="draft-item-meta">
                        {getStatusBadge(draft.status)}
                        <span className="draft-date">
                          {draft.uploaded_at || draft.updated_at || draft.created_at
                            ? new Date(draft.uploaded_at || draft.updated_at || draft.created_at).toLocaleDateString()
                            : 'No date'}
                        </span>
                      </div>
                    </div>
                  ))
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
                  assignedToMe.map(draft => (
                    <div
                      key={draft.id}
                      className={`draft-item ${location.pathname.includes(draft.agreement_id || draft.id) ? 'active' : ''}`}
                      onClick={() => handleDraftClick(draft)}
                    >
                      <div className="draft-item-title">{draft.grant_name || draft.filename || draft.title || 'Untitled Draft'}</div>
                      <div className="draft-item-meta">
                        {getStatusBadge(draft.status)}
                        <span className="draft-date">
                          {draft.uploaded_at || draft.updated_at || draft.created_at
                            ? new Date(draft.uploaded_at || draft.updated_at || draft.created_at).toLocaleDateString()
                            : 'No date'}
                        </span>
                      </div>
                    </div>
                  ))
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
                  assignedByMe.map(draft => (
                    <div
                      key={draft.id}
                      className={`draft-item ${location.pathname.includes(draft.agreement_id || draft.id) ? 'active' : ''}`}
                      onClick={() => handleDraftClick(draft)}
                    >
                      <div className="draft-item-title">{draft.grant_name || draft.filename || draft.title || 'Untitled Draft'}</div>
                      <div className="draft-item-meta">
                        {getStatusBadge(draft.status)}
                        <span className="draft-date">
                          {draft.uploaded_at || draft.updated_at || draft.created_at
                            ? new Date(draft.uploaded_at || draft.updated_at || draft.created_at).toLocaleDateString()
                            : 'No date'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="draft-empty">No drafts assigned by you</div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Collapsed View - Vertical text only
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
    </>
  );
};

export default DraftsPanel;