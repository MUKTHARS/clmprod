import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  MoreVertical,
  Download,
  Eye,
  X,
  ChevronDown,
  Loader2
} from 'lucide-react';
import './styles/ContractsListPage.css';

function ContractsListPage({ contracts: propContracts = [], user, refreshContracts }) {
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const [metrics, setMetrics] = useState({
    totalValue: 0,
    totalContracts: 0,
    activeContracts: 0,
    expiringSoon: 0,
    averageValue: 0
  });
  
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const [normalizedContracts, setNormalizedContracts] = useState([]);
  
  const navigate = useNavigate();

  // Auto-refresh logic
  useEffect(() => {
    // If contracts are empty and we're not loading, trigger a refresh
    if ((!propContracts || propContracts.length === 0) && !loading && refreshContracts) {
      console.log('No contracts found, triggering auto-refresh...');
      refreshContracts();
    }
  }, [propContracts, loading, refreshContracts]);

  // Set up interval to periodically refresh
  useEffect(() => {
    // Set up an interval to refresh every 30 seconds
    const interval = setInterval(() => {
      if (refreshContracts && !loading) {
        console.log('Auto-refreshing contracts data...');
        refreshContracts();
        setAutoRefreshCount(prev => prev + 1);
      }
    }, 30000); // 30 seconds

    setRefreshInterval(interval);

    // Clean up interval on component unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refreshContracts, loading]);

  // Additional check for data consistency
  useEffect(() => {
    // Check if we need to trigger a refresh
    const shouldRefresh = () => {
      // If no contracts and not currently loading
      if ((!propContracts || propContracts.length === 0) && !loading) {
        return true;
      }
      
      // If contracts exist but filtered contracts is empty when there should be data
      if (propContracts && propContracts.length > 0 && filteredContracts.length === 0 && !searchTerm && statusFilter === 'all' && dateFilter === 'all') {
        return true;
      }
      
      return false;
    };

    if (shouldRefresh() && refreshContracts) {
      console.log('Detected missing or inconsistent data, triggering refresh...');
      
      // Small delay to avoid rapid refreshes
      const timer = setTimeout(() => {
        refreshContracts();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [propContracts, filteredContracts, loading, refreshContracts, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    // Log data state for debugging
    console.log('ContractsListPage state:', {
      propContractsCount: propContracts?.length || 0,
      filteredCount: filteredContracts.length,
      loading,
      autoRefreshCount
    });
  }, [propContracts, filteredContracts, loading, autoRefreshCount]);

  useEffect(() => {
    if (propContracts.length > 0) {
      filterContracts();
      calculateMetrics();
    }
  }, [propContracts, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    // Calculate metrics whenever filtered contracts change
    calculateMetrics();
  }, [filteredContracts]);

  const normalizeContractData = (contract) => {
    if (!contract || typeof contract !== 'object') {
      return null;
    }
    
    const status = contract.status || contract.Status;
    const contractId = contract.id || contract.contract_id;
    
    const normalized = {
      id: contractId || Math.random().toString(36).substr(2, 9),
      filename: contract.filename || 'Unnamed Contract',
      uploaded_at: contract.uploaded_at,
      status: status ? status.toLowerCase() : 'unknown',
      investment_id: contract.investment_id,
      project_id: contract.project_id,
      grant_id: contract.grant_id,
      extracted_reference_ids: contract.extracted_reference_ids || [],
      comprehensive_data: contract.comprehensive_data || null
    };
    
    normalized.grant_name = contract.grant_name || 
                           contract.filename || 
                           'Unnamed Contract';
    
    normalized.grantor = contract.grantor || 'Unknown Grantor';
    normalized.grantee = contract.grantee || 'Unknown Grantee';
    normalized.total_amount = contract.total_amount || 0;
    normalized.contract_number = contract.contract_number;
    normalized.start_date = contract.start_date;
    normalized.end_date = contract.end_date;
    normalized.purpose = contract.purpose;
    
    if (normalized.comprehensive_data && typeof normalized.comprehensive_data === 'object') {
      const compData = normalized.comprehensive_data;
      const contractDetails = compData.contract_details || compData.contractDetails || {};
      const parties = compData.parties || compData.Parties || {};
      const financial = compData.financial_details || compData.financialDetails || {};
      
      normalized.grant_name = contractDetails.grant_name || 
                             contractDetails.grantName || 
                             normalized.grant_name;
      
      normalized.grantor = parties.grantor?.organization_name || 
                          parties.grantor?.organizationName || 
                          normalized.grantor;
      
      normalized.grantee = parties.grantee?.organization_name || 
                          parties.grantee?.organizationName || 
                          normalized.grantee;
      
      normalized.total_amount = financial.total_grant_amount || 
                               financial.totalGrantAmount || 
                               normalized.total_amount;
    }
    
    return normalized;
  };

  const filterContracts = () => {
    console.log('DEBUG: All contracts found:', propContracts.length);
    
    let filtered = propContracts.map(normalizeContractData).filter(Boolean);
    
    // Store normalized contracts
    setNormalizedContracts(filtered);
    
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.contract_number && contract.contract_number.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.filename && contract.filename.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => 
        contract.status && contract.status.toLowerCase() === statusFilter
      );
    }

    if (dateFilter !== 'all') {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      
      switch (dateFilter) {
        case 'last30':
          filtered = filtered.filter(contract => 
            contract.uploaded_at && new Date(contract.uploaded_at) > thirtyDaysAgo
          );
          break;
        case 'expiring':
          filtered = filtered.filter(contract => {
            if (!contract.end_date) return false;
            const endDate = new Date(contract.end_date);
            const daysDiff = (endDate - new Date()) / (1000 * 60 * 60 * 24);
            return daysDiff > 0 && daysDiff <= 30;
          });
          break;
        case 'expired':
          filtered = filtered.filter(contract => {
            if (!contract.end_date) return false;
            return new Date(contract.end_date) < new Date();
          });
          break;
      }
    }

    console.log('DEBUG: Final filtered contracts:', filtered.length);
    setFilteredContracts(filtered);
  };

  const calculateMetrics = () => {
    // Calculate metrics based on CURRENTLY FILTERED contracts, not all propContracts
    const totalValue = filteredContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const totalContracts = filteredContracts.length;
    
    // Active contracts are those with status 'approved' or 'processed' in the filtered list
    const activeContracts = filteredContracts.filter(c => 
      c.status === 'approved' || c.status === 'processed'
    ).length;
    
    // Expiring soon from filtered contracts
    const expiringSoon = filteredContracts.filter(c => {
      const days = getDaysRemaining(c.end_date);
      return days !== 'N/A' && days !== 'Expired' && days !== 'Today' && parseInt(days) <= 30;
    }).length;

    const averageValue = totalContracts > 0 ? totalValue / totalContracts : 0;

    setMetrics({
      totalValue,
      totalContracts,
      activeContracts,
      expiringSoon,
      averageValue
    });
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

  const getContractDisplayId = (contract) => {
    if (!contract) return 'Unknown';
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.id}`;
  };

  const getStatusColorForApproved = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return 'clp-approved';
      case 'draft':
        return 'clp-draft';
      case 'under_review':
        return 'clp-under-review';
      case 'reviewed':
        return 'clp-reviewed';
      case 'rejected':
        return 'clp-rejected';
      case 'published':
        return 'clp-published';
      case 'processed':
        return 'clp-processed';
      case 'processing':
        return 'clp-processing';
      case 'error':
        return 'clp-error';
      default:
        return 'clp-default';
    }
  };

  const getStatusIconForApproved = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return <CheckCircle size={14} className="clp-status-icon clp-approved" />;
      case 'draft':
        return <FileText size={14} className="clp-status-icon clp-draft" />;
      case 'under_review':
        return <Clock size={14} className="clp-status-icon clp-under-review" />;
      case 'reviewed':
        return <CheckCircle size={14} className="clp-status-icon clp-reviewed" />;
      case 'rejected':
        return <AlertCircle size={14} className="clp-status-icon clp-rejected" />;
      case 'published':
        return <CheckCircle size={14} className="clp-status-icon clp-published" />;
      case 'processed':
        return <CheckCircle size={14} className="clp-status-icon clp-processed" />;
      case 'processing':
        return <Loader2 size={14} className="clp-status-icon clp-processing" />;
      case 'error':
        return <AlertCircle size={14} className="clp-status-icon clp-error" />;
      default:
        return <Clock size={14} className="clp-status-icon clp-default" />;
    }
  };

  const getDaysColor = (days) => {
    if (days === 'Expired') return 'clp-expired';
    if (days === 'Today') return 'clp-today';
    if (days.includes('days')) {
      const numDays = parseInt(days);
      if (numDays <= 7) return 'clp-critical';
      if (numDays <= 30) return 'clp-warning';
    }
    return 'clp-normal';
  };

  // Handle click outside filter popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest('.clp-filter-popup') && !event.target.closest('.clp-btn-filter')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const renderContractRow = (contract) => {
    const displayId = getContractDisplayId(contract);
    const daysRemaining = getDaysRemaining(contract.end_date);

    return (
      <tr key={contract.id} className="clp-contract-row">
        <td>
          <div className="clp-contract-info">
            <div className="clp-contract-name">
              {contract.grant_name || contract.filename || 'Unnamed Contract'}
            </div>
          </div>
        </td>
        <td>
          <div className="clp-contract-id">
            {displayId}
          </div>
        </td>
        <td>
          <div className="clp-grantor-cell">
            <span>{contract.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="clp-amount-cell">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="clp-date-cell">
            <span>{formatDate(contract.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="clp-date-cell">
            <span>{formatDate(contract.end_date)}</span>
          </div>
        </td>
        <td>
          <div className="clp-status-cell">
            {getStatusIconForApproved(contract.status)}
            <span className={`clp-status-text ${getStatusColorForApproved(contract.status)}`}>
              {contract.status ? contract.status.replace('_', ' ') : 'Unknown'}
            </span>
          </div>
        </td>
        <td>
          <div className="clp-action-buttons">
            <button 
              className="clp-btn-action"
              onClick={() => navigate(`/contracts/${contract.id}`)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            <button className="clp-btn-action" title="Download">
              <Download size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderContractCard = (contract) => {
    const displayId = getContractDisplayId(contract);
    const daysRemaining = getDaysRemaining(contract.end_date);
    const daysColor = getDaysColor(daysRemaining);

    return (
      <div key={contract.id} className="clp-contract-card">
        <div className="clp-card-header">
          <div className="clp-contract-status">
            {getStatusIconForApproved(contract.status)}
            <span className={`clp-status-text ${getStatusColorForApproved(contract.status)}`}>
              {contract.status ? contract.status.replace('_', ' ') : 'unknown'}
            </span>
          </div>
        </div>

        <div className="clp-card-content">
          <h3 className="clp-contract-name-small">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </h3>
          <p className="clp-contract-id-small">
            ID: {displayId}
          </p>

          <div className="clp-contract-meta">
            <div className="clp-meta-item">
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="clp-meta-item">
              <span>{contract.uploaded_at ? formatDate(contract.uploaded_at) : 'No date'}</span>
            </div>
          </div>

          <div className="clp-contract-amount">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>

          <div className="clp-contract-timeline">
            <div className="clp-timeline-item">
              <span className="clp-timeline-label">Ends in</span>
              <span className={`clp-timeline-value ${daysColor}`}>
                {daysRemaining}
              </span>
            </div>
          </div>
        </div>

        <div className="clp-card-footer">
          <div className="clp-action-buttons">
            <button 
              className="clp-btn-action"
              onClick={() => navigate(`/contracts/${contract.id}`)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            <button className="clp-btn-action" title="Download">
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="clp-contracts-list-page">
      <div className="clp-contracts-list-page-content">
        {/* Metrics Container */}
        <div className="clp-metrics-container">
          <div className="clp-metric-card clp-metric-total-grants">
            <div className="clp-metric-value">{metrics.totalContracts}</div>
            <div className="clp-metric-title">Total Grants</div>
          </div>

          <div className="clp-metric-card clp-metric-total-value">
            <div className="clp-metric-value">{formatCurrency(metrics.totalValue)}</div>
            <div className="clp-metric-title">Total Value</div>
          </div>

          <div className="clp-metric-card clp-metric-active">
            <div className="clp-metric-value">{metrics.activeContracts}</div>
            <div className="clp-metric-title">Active</div>
          </div>

          <div className="clp-metric-card clp-metric-deadlines">
            <div className="clp-metric-value">{metrics.expiringSoon}</div>
            <div className="clp-metric-title">Deadlines</div>
          </div>
        </div>

        {/* Recent Contracts Section */}
        <div className="clp-recent-contracts">
          <div className="clp-section-controls">
            <div className="clp-controls-right">
              <div className="clp-view-toggle">
                <button 
                  className={`clp-view-btn ${activeView === 'list' ? 'clp-active' : ''}`}
                  onClick={() => setActiveView('list')}
                >
                  List
                </button>
                <button 
                  className={`clp-view-btn ${activeView === 'grid' ? 'clp-active' : ''}`}
                  onClick={() => setActiveView('grid')}
                >
                  Grid
                </button>
              </div>

              <div className="clp-filter-actions">
                <button 
                  className="clp-btn-filter"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filter contracts"
                >
                  <Filter size={16} />
                  <span className="clp-filter-label">Filter</span>
                </button>
              </div>
            </div>

            {/* Filter Popup */}
            {showFilters && (
              <div className="clp-filter-popup">
                <div className="clp-filter-popup-header">
                  <h3>Filter Contracts</h3>
                  <button 
                    className="clp-filter-close"
                    onClick={() => setShowFilters(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="clp-filter-content">
                  <div className="clp-filter-group">
                    <label className="clp-filter-label">Status</label>
                    <div className="clp-filter-options">
                      {['all', 'approved', 'draft', 'under_review', 'reviewed', 'rejected', 'published'].map((status) => (
                        <button
                          key={status}
                          className={`clp-filter-option ${statusFilter === status ? 'clp-active' : ''}`}
                          onClick={() => {
                            setStatusFilter(status);
                            setShowFilters(false);
                          }}
                        >
                          {status === 'all' ? 'All Status' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="clp-filter-group">
                    <label className="clp-filter-label">Date Range</label>
                    <div className="clp-filter-options">
                      {['all', 'last30', 'expiring', 'expired'].map((date) => (
                        <button
                          key={date}
                          className={`clp-filter-option ${dateFilter === date ? 'clp-active' : ''}`}
                          onClick={() => {
                            setDateFilter(date);
                            setShowFilters(false);
                          }}
                        >
                          {date === 'all' && 'All Dates'}
                          {date === 'last30' && 'Last 30 Days'}
                          {date === 'expiring' && 'Expiring Soon'}
                          {date === 'expired' && 'Expired'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="clp-filter-actions-bottom">
                    <button 
                      className="clp-btn-clear-filters"
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

          {/* Results Header */}
          <div className="clp-results-header">
            <span className="clp-results-count">
              Showing {filteredContracts.length} of {propContracts.length} grants
            </span>
            <span className="clp-results-value">
              Total Value: {formatCurrency(metrics.totalValue)}
            </span>
          </div>

          {/* Contracts Content */}
          <div className="clp-contracts-content">
            {loading ? (
              <div className="clp-loading-state">
                <RefreshCw className="clp-spinner" />
                <p>Loading contracts...</p>
              </div>
            ) : filteredContracts.length > 0 ? (
              <>
                {activeView === 'list' ? (
                  <div className="clp-contracts-table-container">
                    <table className="clp-contracts-table">
                      <thead>
                        <tr>
                          <th className="clp-table-header">Grant Name</th>
                          <th className="clp-table-header">Grant ID</th>
                          <th className="clp-table-header">Grantor</th>
                          <th className="clp-table-header">Amount</th>
                          <th className="clp-table-header">Upload Date</th>
                          <th className="clp-table-header">End Date</th>
                          <th className="clp-table-header">Status</th>
                          <th className="clp-table-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContracts.map(renderContractRow)}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="clp-contracts-grid">
                    {filteredContracts.map(renderContractCard)}
                  </div>
                )}
              </>
            ) : (
              <div className="clp-empty-state">
                <FileText size={48} />
                <h3>No contracts found</h3>
                <p>{searchTerm ? 'Try adjusting your search' : 'Upload your first contract to get started'}</p>
                {!searchTerm && (
                  <button 
                    className="clp-btn-upload-main"
                    onClick={() => navigate('/upload')}
                  >
                    <Upload size={20} />
                    Upload First Contract
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractsListPage;