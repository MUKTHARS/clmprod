import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TbFilePencil, TbUserCheck } from 'react-icons/tb';
import API_CONFIG from '../../config';
import './DraftsPanel.css';

const DraftsPanel = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [myDrafts, setMyDrafts] = useState([]);
  const [assignedDrafts, setAssignedDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    myDrafts: true,
    assigned: true
  });

  const fetchDrafts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    const baseUrl = API_CONFIG.BASE_URL;

    try {
      // Fetch My Drafts
      if (user.role === 'project_manager') {
        const myDraftsResponse = await fetch(`${baseUrl}/api/agreements/drafts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (myDraftsResponse.ok) {
          const data = await myDraftsResponse.json();
          const filtered = data.filter(draft => 
            draft.created_by === user.id || draft.userId === user.id
          );
          setMyDrafts(filtered.slice(0, 5)); // Show only latest 5
        }
      }

      // Fetch Assigned Drafts (for PM, Program Manager, Director)
      if (['project_manager', 'program_manager', 'director'].includes(user.role)) {
        const assignedResponse = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assignedResponse.ok) {
          const data = await assignedResponse.json();
          setAssignedDrafts(data.drafts?.slice(0, 5) || []);
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  // Calculate total drafts count for badge
  const totalDrafts = (myDrafts?.length || 0) + (assignedDrafts?.length || 0);

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
              <h3>Drafts</h3>
              <button 
                className="draft-view-all"
                onClick={() => navigate('/app/drafts')}
                title="View all drafts"
              >
                View All
              </button>
            </div>

            {/* My Drafts Section */}
            {user.role === 'project_manager' && (
              <div className="draft-section">
                <div 
                  className="draft-section-header"
                  onClick={() => toggleSection('myDrafts')}
                >
                  <div className="draft-section-title">
                    <TbFilePencil size={16} />
                    <span>My Drafts</span>
                    <span className="draft-count">{myDrafts.length}</span>
                  </div>
                  {expandedSections.myDrafts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {expandedSections.myDrafts && (
                  <div className="draft-list">
                    {loading ? (
                      <div className="draft-loading">Loading...</div>
                    ) : myDrafts.length > 0 ? (
                      myDrafts.map(draft => (
                        <div
                          key={draft.id}
                          className={`draft-item ${location.pathname.includes(draft.agreement_id || draft.id) ? 'active' : ''}`}
                          onClick={() => handleDraftClick(draft)}
                        >
                          <div className="draft-item-title">{draft.title || 'Untitled Draft'}</div>
                          <div className="draft-item-meta">
                            {getStatusBadge(draft.status)}
                            <span className="draft-date">
                              {new Date(draft.updated_at || draft.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="draft-empty">No drafts yet</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assigned to Me Section */}
            {['project_manager', 'program_manager', 'director'].includes(user.role) && (
              <div className="draft-section">
                <div 
                  className="draft-section-header"
                  onClick={() => toggleSection('assigned')}
                >
                  <div className="draft-section-title">
                    <TbUserCheck size={16} />
                    <span>Assigned to Me</span>
                    <span className="draft-count">{assignedDrafts.length}</span>
                  </div>
                  {expandedSections.assigned ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {expandedSections.assigned && (
                  <div className="draft-list">
                    {loading ? (
                      <div className="draft-loading">Loading...</div>
                    ) : assignedDrafts.length > 0 ? (
                      assignedDrafts.map(draft => (
                        <div
                          key={draft.id}
                          className={`draft-item ${location.pathname.includes(draft.agreement_id || draft.id) ? 'active' : ''}`}
                          onClick={() => handleDraftClick(draft)}
                        >
                          <div className="draft-item-title">{draft.title || 'Untitled Draft'}</div>
                          <div className="draft-item-meta">
                            {getStatusBadge(draft.status)}
                            <span className="draft-date">
                              {new Date(draft.updated_at || draft.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="draft-empty">No assigned drafts</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Collapsed View - Vertical text only
          <div 
            className="draft-vertical-text"
            onClick={() => setIsExpanded(true)}
            title="Expand drafts panel"
          >
            <TbFilePencil size={18} />
            <span>DRAFTS</span>
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