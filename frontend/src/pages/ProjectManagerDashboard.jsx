// src/pages/ProjectManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectManagerActions from '../components/workflow/ProjectManagerActions';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';

function ProjectManagerDashboard({ user }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyContracts();
  }, []);

  const fetchMyContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://44.219.56.85:4001/api/contracts/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <FileText size={16} className="status-icon draft" />;
      case 'under_review': return <Clock size={16} className="status-icon under-review" />;
      case 'reviewed': return <CheckCircle size={16} className="status-icon reviewed" />;
      case 'approved': return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected': return <AlertCircle size={16} className="status-icon rejected" />;
      default: return <FileText size={16} className="status-icon" />;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (filter === 'all') return true;
    if (filter === 'needs_action') return contract.status === 'draft' || contract.status === 'rejected';
    if (filter === 'under_review') return contract.status === 'under_review';
    return contract.status === filter;
  });

  return (
    <div className="pm-dashboard">
      <div className="dashboard-header">
        <h1>My Contracts Dashboard</h1>
        <p>Manage your contracts and workflow actions</p>
      </div>

      <div className="dashboard-content">
        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{contracts.length}</div>
            <div className="stat-label">Total Contracts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {contracts.filter(c => c.status === 'draft' || c.status === 'rejected').length}
            </div>
            <div className="stat-label">Need Action</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {contracts.filter(c => c.status === 'under_review').length}
            </div>
            <div className="stat-label">Under Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {contracts.filter(c => c.status === 'approved').length}
            </div>
            <div className="stat-label">Approved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-buttons">
            {['all', 'needs_action', 'draft', 'under_review', 'rejected', 'approved'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Contracts List with Actions */}
        <div className="contracts-list">
          <h2>My Contracts ({filteredContracts.length})</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No contracts found</h3>
              <p>{filter === 'all' ? 'Upload your first contract to get started' : 'No contracts match this filter'}</p>
            </div>
          ) : (
            <div className="contracts-grid">
              {filteredContracts.map(contract => (
                <div key={contract.id} className="contract-card">
                  <div className="card-header">
                    <div className="contract-status">
                      {getStatusIcon(contract.status)}
                      <span className={`status-text ${contract.status}`}>
                        {contract.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <button 
                      className="card-menu"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="card-body">
                    <h3>{contract.grant_name || contract.filename}</h3>
                    <p className="contract-id">ID: {contract.id}</p>
                    <div className="contract-meta">
                      <span className="meta-item">
                        <strong>Grantor:</strong> {contract.grantor || 'Not specified'}
                      </span>
                      <span className="meta-item">
                        <strong>Amount:</strong> ${contract.total_amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    {/* Project Manager Actions for this contract */}
                    <ProjectManagerActions 
                      contract={contract}
                      user={user}
                      onActionComplete={fetchMyContracts}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectManagerDashboard;