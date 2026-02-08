import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  User,
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Download,
  Copy,
  MoreVertical,
   RefreshCw
} from 'lucide-react';
import API_CONFIG from '../../config';
import './ViewDraftsPage.css';

function ViewDraftsPage({ user }) {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDrafts, setSelectedDrafts] = useState([]);

  useEffect(() => {
    if (user && user.role === 'project_manager') {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/drafts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDrafts(data);
      } else {
        console.error('Failed to fetch drafts');
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDraft = (draftId) => {
    navigate(`/contracts/${draftId}`);
  };

  const handleEditDraft = (draftId) => {
    navigate(`/contracts/${draftId}`);
  };

  const handleDeleteDraft = async (draftId) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
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
        alert('Draft deleted successfully');
        fetchDrafts(); // Refresh the list
      } else {
        alert('Failed to delete draft');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="status-badge draft">
            <Clock size={12} />
            Draft
          </span>
        );
      case 'under_review':
        return (
          <span className="status-badge under-review">
            <AlertCircle size={12} />
            Under Review
          </span>
        );
      case 'reviewed':
        return (
          <span className="status-badge reviewed">
            <FileCheck size={12} />
            Reviewed
          </span>
        );
      case 'approved':
        return (
          <span className="status-badge approved">
            <CheckCircle size={12} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge rejected">
            <XCircle size={12} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="status-badge unknown">
            <Clock size={12} />
            {status}
          </span>
        );
    }
  };

  // Filter drafts based on search and filter
  const filteredDrafts = drafts.filter(draft => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      (draft.grant_name && draft.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (draft.contract_number && draft.contract_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (draft.filename && draft.filename.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = filterStatus === 'all' || draft.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (!user || user.role !== 'project_manager') {
    return (
      <div className="access-denied">
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>Only Project Managers can access draft agreements.</p>
        <button onClick={() => navigate('/contracts')} className="btn-primary">
          Back to Contracts
        </button>
      </div>
    );
  }

  return (
    <div className="view-drafts-page">
      <div className="drafts-header">
        <div className="header-left">
          <h1>Draft Agreements</h1>
          <p className="subtitle">Manage and edit your draft agreements</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => navigate('/upload')}>
            <Plus size={16} />
            Upload New
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search drafts by name, number, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <Filter size={16} />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <button className="btn-secondary" onClick={fetchDrafts}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Drafts Table */}
      <div className="drafts-table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spinner" />
            <p>Loading drafts...</p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No Drafts Found</h3>
            <p>{searchTerm || filterStatus !== 'all' ? 'Try changing your search or filter criteria.' : 'You don\'t have any draft agreements yet.'}</p>
            <button className="btn-primary" onClick={() => navigate('/upload')}>
              <Plus size={16} />
              Upload Your First Agreement
            </button>
          </div>
        ) : (
          <>
            <div className="table-info">
              <span>Showing {filteredDrafts.length} of {drafts.length} drafts</span>
              {selectedDrafts.length > 0 && (
                <span className="selected-count">
                  {selectedDrafts.length} selected
                </span>
              )}
            </div>
            
            <div className="drafts-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedDrafts.length === filteredDrafts.length && filteredDrafts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDrafts(filteredDrafts.map(d => d.id));
                          } else {
                            setSelectedDrafts([]);
                          }
                        }}
                      />
                    </th>
                    <th>Agreement Name</th>
                    <th>Contract Number</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Edited</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrafts.map((draft) => (
                    <tr key={draft.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedDrafts.includes(draft.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDrafts([...selectedDrafts, draft.id]);
                            } else {
                              setSelectedDrafts(selectedDrafts.filter(id => id !== draft.id));
                            }
                          }}
                        />
                      </td>
                      <td className="agreement-name">
                        <FileText size={16} />
                        <div>
                          <strong>{draft.grant_name || draft.filename}</strong>
                          <small>{draft.filename}</small>
                        </div>
                      </td>
                      <td>{draft.contract_number || 'N/A'}</td>
                      <td className="amount">{formatCurrency(draft.total_amount)}</td>
                      <td>{getStatusBadge(draft.status)}</td>
                      <td>{formatDate(draft.uploaded_at)}</td>
                      <td>{formatDate(draft.last_edited_at)}</td>
                      <td className="actions">
                        <button
                          className="action-btn view"
                          onClick={() => handleViewDraft(draft.id)}
                          title="View Draft"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => handleEditDraft(draft.id)}
                          title="Edit Draft"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteDraft(draft.id)}
                          title="Delete Draft"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedDrafts.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions-content">
            <span>{selectedDrafts.length} drafts selected</span>
            <div className="bulk-buttons">
              <button className="btn-secondary" onClick={() => setSelectedDrafts([])}>
                Clear Selection
              </button>
              <button className="btn-primary" onClick={() => {
                // Handle bulk actions here
                alert(`Bulk action on ${selectedDrafts.length} drafts`);
              }}>
                Publish Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewDraftsPage;