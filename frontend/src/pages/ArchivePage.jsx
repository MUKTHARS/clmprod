import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileArchive,
  Calendar,
  DollarSign,
  Building,
  Eye,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  FileText,
  Users,
  Shield,
  Award,
  Grid,
  List,
  ChevronRight,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  Trash2,
  FileX,
  FileClock,
  CalendarDays,
  TrendingDown,
  BarChart3,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import API_CONFIG from '../config';
import './ArchivePage.css';

function ArchivePage({ user }) {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [showBatchArchive, setShowBatchArchive] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    past_due: 0,
    terminated: 0,
    total_value: 0
  });

  useEffect(() => {
    fetchArchiveData();
  }, []);

  const fetchArchiveData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/archive/eligible`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
        setStats(data.stats || {});
      } else {
        console.error('Failed to fetch archive data');
      }
    } catch (error) {
      console.error('Failed to fetch archive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/archive/archived`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // This would be for viewing already archived contracts
        console.log('Archived contracts:', data);
      }
    } catch (error) {
      console.error('Failed to fetch archived contracts:', error);
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
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getDaysPastDue = (contract) => {
    if (!contract.days_past_due && contract.days_past_due !== 0) return null;
    return contract.days_past_due;
  };

  const getStatusBadge = (contract) => {
    if (contract.is_terminated) {
      return {
        label: 'Terminated',
        color: 'terminated',
        icon: <FileX size={12} />
      };
    }
    
    if (contract.is_past_due) {
      const days = getDaysPastDue(contract);
      if (days !== null) {
        return {
          label: `${days} day${days !== 1 ? 's' : ''} past due`,
          color: days > 30 ? 'critical' : days > 7 ? 'warning' : 'late',
          icon: <Clock size={12} />
        };
      }
      return {
        label: 'Past due',
        color: 'warning',
        icon: <Clock size={12} />
      };
    }
    
    return null;
  };

  const handleSelectContract = (contractId) => {
    setSelectedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContracts.length === filteredContracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(filteredContracts.map(c => c.id));
    }
  };

  const handleArchiveSingle = async (contractId, contractName) => {
    if (!confirm(`Archive contract "${contractName}"? This will mark it as archived.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/archive/${contractId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Contract end date passed',
          notes: 'Archived manually from archive page'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchArchiveData();
        // Remove from selected
        setSelectedContracts(prev => prev.filter(id => id !== contractId));
      } else {
        const error = await response.json();
        alert(`Failed to archive: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error archiving contract:', error);
      alert('Failed to archive contract');
    }
  };

  const handleBatchArchive = async () => {
    if (selectedContracts.length === 0) {
      alert('Please select contracts to archive');
      return;
    }
    
    if (!archiveReason.trim()) {
      alert('Please provide a reason for archiving');
      return;
    }
    
    if (!confirm(`Archive ${selectedContracts.length} selected contract(s)?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/archive/batch-archive?${selectedContracts.map(id => `contract_ids=${id}`).join('&')}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: archiveReason,
            notes: archiveNotes
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchArchiveData();
        setSelectedContracts([]);
        setShowBatchArchive(false);
        setArchiveReason('');
        setArchiveNotes('');
      } else {
        const error = await response.json();
        alert(`Failed to batch archive: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error batch archiving:', error);
      alert('Failed to batch archive contracts');
    }
  };

  const handleViewContract = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  const filteredContracts = contracts.filter(contract => {
    if (!contract) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (contract.grant_name && contract.grant_name.toLowerCase().includes(searchLower)) ||
        (contract.filename && contract.filename.toLowerCase().includes(searchLower)) ||
        (contract.contract_number && contract.contract_number.toString().toLowerCase().includes(searchLower)) ||
        (contract.grantor && contract.grantor.toLowerCase().includes(searchLower))
      );
      if (!matchesSearch) return false;
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'past_due' && !contract.is_past_due) return false;
      if (statusFilter === 'terminated' && !contract.is_terminated) return false;
    }
    
    if (yearFilter !== 'all' && contract.end_date) {
      const year = new Date(contract.end_date).getFullYear().toString();
      if (year !== yearFilter) return false;
    }
    
    return true;
  });

  // Get unique years for filter
  const availableYears = ['all', ...new Set(contracts
    .map(c => c.end_date ? new Date(c.end_date).getFullYear().toString() : null)
    .filter(year => year)
    .sort((a, b) => b - a)
  )];

  const renderContractRow = (contract) => {
    const statusBadge = getStatusBadge(contract);
    const isSelected = selectedContracts.includes(contract.id);
    
    return (
      <tr key={contract.id} className="contract-row">
        <td>
          <div className="select-cell">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectContract(contract.id)}
              className="contract-checkbox"
            />
          </div>
        </td>
        <td>
          <div className="contract-info">
            <div className="contract-name">
              {contract.grant_name || contract.filename || 'Unnamed Contract'}
            </div>
            <div className="contract-id">
              {contract.contract_number ? `Contract #${contract.contract_number}` : `ID: ${contract.id}`}
            </div>
          </div>
        </td>
        <td>
          <div className="grantor-cell">
            <span>{contract.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="amount-cell">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{formatDate(contract.end_date)}</span>
            {statusBadge && (
              <div className={`status-badge ${statusBadge.color}`}>
                {statusBadge.icon}
                <span>{statusBadge.label}</span>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{contract.days_past_due !== null ? `${contract.days_past_due} days` : 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => handleViewContract(contract.id)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            <button 
              className="btn-action archive-btn"
              onClick={() => handleArchiveSingle(contract.id, contract.grant_name || contract.filename)}
              title="Archive contract"
            >
              <Archive size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderContractCard = (contract) => {
    const statusBadge = getStatusBadge(contract);
    const isSelected = selectedContracts.includes(contract.id);
    
    return (
      <div key={contract.id} className="contract-card">
        <div className="card-header">
          <div className="card-select">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectContract(contract.id)}
              className="contract-checkbox"
            />
          </div>
          <div className="card-actions">
            <button 
              className="btn-action"
              onClick={() => handleViewContract(contract.id)}
              title="View details"
            >
              <Eye size={14} />
            </button>
            <button 
              className="btn-action archive-btn"
              onClick={() => handleArchiveSingle(contract.id, contract.grant_name || contract.filename)}
              title="Archive contract"
            >
              <Archive size={14} />
            </button>
          </div>
        </div>

        <div className="card-content">
          <div className="contract-icon">
            <FileArchive size={24} />
          </div>
          
          <h3 className="contract-name">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </h3>
          
          <p className="contract-id">
            {contract.contract_number ? `Contract #${contract.contract_number}` : `ID: ${contract.id}`}
          </p>

          {statusBadge && (
            <div className={`status-badge-large ${statusBadge.color}`}>
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </div>
          )}

          <div className="contract-details">
            <div className="detail-item">
              <DollarSign size={14} />
              <span>{formatCurrency(contract.total_amount)}</span>
            </div>
            <div className="detail-item">
              <Building size={14} />
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="detail-item">
              <Calendar size={14} />
              <span>Ended: {formatDate(contract.end_date)}</span>
            </div>
            {contract.days_past_due !== null && (
              <div className="detail-item">
                <CalendarDays size={14} />
                <span>{contract.days_past_due} days past due</span>
              </div>
            )}
          </div>

          {contract.is_terminated && (
            <div className="terminated-note">
              <AlertTriangle size={12} />
              <span>Contract was terminated</span>
            </div>
          )}
        </div>

        <div className="card-footer">
          <button 
            className="btn-archive"
            onClick={() => handleArchiveSingle(contract.id, contract.grant_name || contract.filename)}
          >
            <Archive size={14} />
            <span>Archive Now</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="archive-page">
      <div className="archive-header">

        <div className="header-actions">

          {selectedContracts.length > 0 && (
            <button 
              className="btn-batch-archive"
              onClick={() => setShowBatchArchive(true)}
            >
              <Archive size={16} />
              <span>Archive Selected ({selectedContracts.length})</span>
            </button>
          )}
        </div>
      </div>

      <div className="archive-stats">
        <div className="stat-card">
         
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Eligible for Archive</div>
          </div>
        </div>
        
        <div className="stat-card">
          
          <div className="stat-content">
            <div className="stat-value">{stats.past_due}</div>
            <div className="stat-label">Past Due</div>
          </div>
        </div>
        
        <div className="stat-card">
          
          <div className="stat-content">
            <div className="stat-value">{stats.terminated}</div>
            <div className="stat-label">Terminated</div>
          </div>
        </div>
        
        <div className="stat-card">
        
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.total_value)}</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>
      </div>

      <div className="archive-controls">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-container">
        
 
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

      <div className="archive-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinner" />
            <p>Loading archive data...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="empty-state">
            <FileArchive size={48} />
            <h3>No contracts eligible for archive</h3>
            <p>
              {searchTerm || statusFilter !== 'all' || yearFilter !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'Contracts will appear here once their end date has passed or they are terminated'}
            </p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <div className="select-all">
                <input
                  type="checkbox"
                  checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                  onChange={handleSelectAll}
                  className="select-all-checkbox"
                />
                <span className="select-all-label">
                  {selectedContracts.length > 0 
                    ? `${selectedContracts.length} selected` 
                    : 'Select all'}
                </span>
              </div>
              
              <div className="results-info">
                <span className="results-count">
                  Showing {filteredContracts.length} contract(s)
                </span>
                <span className="results-actions">
                  {selectedContracts.length > 0 && (
                    <button 
                      className="btn-archive-selected"
                      onClick={() => setShowBatchArchive(true)}
                    >
                      <Archive size={14} />
                      <span>Archive Selected</span>
                    </button>
                  )}
                </span>
              </div>
            </div>

            {activeView === 'list' ? (
              <div className="contracts-table-container">
                <table className="contracts-table">
                  <thead>
                    <tr>
                      <th className="table-header select-column"></th>
                      <th className="table-header">Contract Name</th>
                      <th className="table-header">Grantor</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">End Date</th>
                      <th className="table-header">Days Past Due</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map(renderContractRow)}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="contracts-grid">
                {filteredContracts.map(renderContractCard)}
              </div>
            )}
          </>
        )}
      </div>

      {showBatchArchive && (
        <div className="batch-archive-modal">
          <div className="modal-overlay" onClick={() => setShowBatchArchive(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Batch Archive Contracts</h3>
              <button 
                className="modal-close"
                onClick={() => setShowBatchArchive(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="archive-summary">
                <Archive size={24} />
                <p>
                  You are about to archive <strong>{selectedContracts.length}</strong> contract(s).
                  This action will mark them as "archived" status.
                </p>
              </div>
              
              <div className="form-group">
                <label htmlFor="archive-reason">Archive Reason *</label>
                <input
                  type="text"
                  id="archive-reason"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="e.g., Contract end date passed, Terminated agreement"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="archive-notes">Notes (Optional)</label>
                <textarea
                  id="archive-notes"
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowBatchArchive(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm"
                onClick={handleBatchArchive}
                disabled={!archiveReason.trim()}
              >
                <Archive size={16} />
                <span>Archive {selectedContracts.length} Contract(s)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchivePage;