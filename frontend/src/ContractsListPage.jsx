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

function ContractsListPage({ contracts: propContracts = [], user }) {
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
  const navigate = useNavigate();

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
        return 'approved';
      case 'draft':
        return 'draft';
      case 'under_review':
        return 'under_review';
      case 'reviewed':
        return 'reviewed';
      case 'rejected':
        return 'rejected';
      case 'published':
        return 'published';
      case 'processed':
        return 'processed';
      case 'processing':
        return 'processing';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIconForApproved = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return <CheckCircle size={14} className="status-icon approved" />;
      case 'draft':
        return <FileText size={14} className="status-icon draft" />;
      case 'under_review':
        return <Clock size={14} className="status-icon under_review" />;
      case 'reviewed':
        return <CheckCircle size={14} className="status-icon reviewed" />;
      case 'rejected':
        return <AlertCircle size={14} className="status-icon rejected" />;
      case 'published':
        return <CheckCircle size={14} className="status-icon published" />;
      case 'processed':
        return <CheckCircle size={14} className="status-icon processed" />;
      case 'processing':
        return <Loader2 size={14} className="status-icon processing" />;
      case 'error':
        return <AlertCircle size={14} className="status-icon error" />;
      default:
        return <Clock size={14} className="status-icon default" />;
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

  // Handle click outside filter popup
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

  const renderContractRow = (contract) => {
    const displayId = getContractDisplayId(contract);
    const daysRemaining = getDaysRemaining(contract.end_date);

    return (
      <tr key={contract.id} className="contract-row">
        <td>
          <div className="contract-info">
            <div className="contract-name-only">
              {contract.grant_name || contract.filename || 'Unnamed Contract'}
            </div>
          </div>
        </td>
        <td>
          <div className="contract-id-only">
            {displayId}
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
            <span>{formatDate(contract.uploaded_at)}</span>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{formatDate(contract.end_date)}</span>
          </div>
        </td>
        <td>
          <div className="status-cell">
            {getStatusIconForApproved(contract.status)}
            <span className={`status-text ${getStatusColorForApproved(contract.status)}`}>
              {contract.status ? contract.status.replace('_', ' ') : 'Unknown'}
            </span>
          </div>
        </td>
        <td>
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => navigate(`/contracts/${contract.id}`)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            <button className="btn-action" title="Download">
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
      <div key={contract.id} className="contract-card">
        <div className="card-header">
          <div className="contract-status">
            {getStatusIconForApproved(contract.status)}
            <span className={`status-text ${getStatusColorForApproved(contract.status)}`}>
              {contract.status ? contract.status.replace('_', ' ') : 'unknown'}
            </span>
          </div>
        </div>

        <div className="card-content">
          <h3 className="contract-name-small">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </h3>
          <p className="contract-id-small">
            ID: {displayId}
          </p>

          <div className="contract-meta">
            <div className="meta-item">
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="meta-item">
              <span>{contract.uploaded_at ? formatDate(contract.uploaded_at) : 'No date'}</span>
            </div>
          </div>

          <div className="contract-amount">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>

          <div className="contract-timeline">
            <div className="timeline-item">
              <span className="timeline-label">Ends in</span>
              <span className={`timeline-value ${daysColor}`}>
                {daysRemaining}
              </span>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => navigate(`/contracts/${contract.id}`)}
              title="View details"
            >
              <Eye size={16} />
            </button>
            <button className="btn-action" title="Download">
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="contracts-list-page">
      {/* Metrics Container - Same as Dashboard */}
      <div className="metrics-container">
        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{metrics.totalContracts}</div>
              <div className="metric-label">Total Grants</div>
            </div>
          </div>
        </div>

        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{formatCurrency(metrics.totalValue)}</div>
              <div className="metric-label">Total Value</div>
            </div>
          </div>
        </div>

        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{metrics.activeContracts}</div>
              <div className="metric-label">Active</div>
            </div>
          </div>
        </div>

        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{metrics.expiringSoon}</div>
              <div className="metric-label">Deadlines</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls - Same as Dashboard */}
      <div className="recent-contracts">
        <div className="section-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search grants..."
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
              >
                List
              </button>
              <button 
                className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
                onClick={() => setActiveView('grid')}
              >
                Grid
              </button>
            </div>

            <div className="filter-actions">
              <button 
                className="btn-filter"
                onClick={() => setShowFilters(!showFilters)}
                title="Filter contracts"
              >
                <Filter size={16} />
                <span>Filter</span>
              </button>
              
              <button 
                className="btn-upload"
                onClick={() => navigate('/upload', { replace: false })}
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
              
              <button 
                className="btn-refresh"
                onClick={() => window.location.reload()}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
            </div>
          </div>

          {/* Filter Popup */}
          {showFilters && (
            <div className="filter-popup">
              <div className="filter-popup-header">
                <h3>Filter Contracts</h3>
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
                    {['all', 'approved', 'draft', 'under_review', 'reviewed', 'rejected', 'published'].map((status) => (
                      <button
                        key={status}
                        className={`filter-option ${statusFilter === status ? 'active' : ''}`}
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

                <div className="filter-group">
                  <label className="filter-label">Date Range</label>
                  <div className="filter-options">
                    {['all', 'last30', 'expiring', 'expired'].map((date) => (
                      <button
                        key={date}
                        className={`filter-option ${dateFilter === date ? 'active' : ''}`}
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

        {/* Contracts Content - Switch between views */}
        <div className="contracts-content">
          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spinner" />
              <p>Loading contracts...</p>
            </div>
          ) : filteredContracts.length > 0 ? (
            <>
              <div className="results-header">
                <span className="results-count">
                  Showing {filteredContracts.length} of {propContracts.length} grants
                </span>
                <span className="results-value">
                  Total Value: {formatCurrency(metrics.totalValue)}
                </span>
              </div>

              {activeView === 'list' ? (
                <div className="contracts-table-container">
                  <table className="contracts-table">
                    <thead>
                      <tr>
                        <th className="table-header-large">Grant Name</th>
                        <th className="table-header-large">Grant ID</th>
                        <th className="table-header-large">Grantor</th>
                        <th className="table-header-large">Amount</th>
                        <th className="table-header-large">Upload Date</th>
                        <th className="table-header-large">End Date</th>
                        <th className="table-header-large">Status</th>
                        <th className="table-header-large">Actions</th>
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
          ) : (
            <div className="empty-state">
              <FileText size={20} />
              <h3>No grants found</h3>
              <p>{searchTerm ? 'Try adjusting your search' : ''}</p>
              {!searchTerm && (
                <button 
                  className="btn-upload-main"
                  onClick={() => navigate('/upload')}
                >
                  <Upload size={20} />
                  Upload Grant
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContractsListPage;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Search,
//   Filter,
//   Calendar,
//   RefreshCw,
//   Upload,
//   FileText,
//   CheckCircle,
//   AlertCircle,
//   Clock,
//   ChevronRight,
//   MoreVertical,
//   Download,
//   Eye,
//   X,
//   ChevronDown,
//   Loader2
// } from 'lucide-react';
// import './styles/ContractsListPage.css';

// function ContractsListPage({ contracts: propContracts = [], user }) {
//   const [filteredContracts, setFilteredContracts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [dateFilter, setDateFilter] = useState('all');
//   const [showFilters, setShowFilters] = useState(false);
//   const [activeView, setActiveView] = useState('list');
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (propContracts.length > 0) {
//       filterContracts();
//     }
//   }, [propContracts, searchTerm, statusFilter, dateFilter]);

// const normalizeContractData = (contract) => {
//   if (!contract || typeof contract !== 'object') {
//     return null;
//   }
  
//   // Get status from multiple possible fields
//   const status = contract.status || contract.Status;
  
 
//   // if (!status || status.toLowerCase() !== 'approved') {
//   //   return null;
//   // }
  
//   const contractId = contract.id || contract.contract_id;
  
//   const normalized = {
//     id: contractId || Math.random().toString(36).substr(2, 9),
//     filename: contract.filename || 'Unnamed Contract',
//     uploaded_at: contract.uploaded_at,
//     status: status ? status.toLowerCase() : 'unknown', // Keep original status
//     investment_id: contract.investment_id,
//     project_id: contract.project_id,
//     grant_id: contract.grant_id,
//     extracted_reference_ids: contract.extracted_reference_ids || [],
//     comprehensive_data: contract.comprehensive_data || null
//   };
  
//   normalized.grant_name = contract.grant_name || 
//                          contract.filename || 
//                          'Unnamed Contract';
  
//   normalized.grantor = contract.grantor || 'Unknown Grantor';
//   normalized.grantee = contract.grantee || 'Unknown Grantee';
//   normalized.total_amount = contract.total_amount || 0;
//   normalized.contract_number = contract.contract_number;
//   normalized.start_date = contract.start_date;
//   normalized.end_date = contract.end_date;
//   normalized.purpose = contract.purpose;
  
//   if (normalized.comprehensive_data && typeof normalized.comprehensive_data === 'object') {
//     const compData = normalized.comprehensive_data;
//     const contractDetails = compData.contract_details || compData.contractDetails || {};
//     const parties = compData.parties || compData.Parties || {};
//     const financial = compData.financial_details || compData.financialDetails || {};
    
//     normalized.grant_name = contractDetails.grant_name || 
//                            contractDetails.grantName || 
//                            normalized.grant_name;
    
//     normalized.grantor = parties.grantor?.organization_name || 
//                         parties.grantor?.organizationName || 
//                         normalized.grantor;
    
//     normalized.grantee = parties.grantee?.organization_name || 
//                         parties.grantee?.organizationName || 
//                         normalized.grantee;
    
//     normalized.total_amount = financial.total_grant_amount || 
//                              financial.totalGrantAmount || 
//                              normalized.total_amount;
//   }
  
//   return normalized;
// };

// const filterContracts = () => {
  
//   console.log('DEBUG: All contracts found:', propContracts.length);
  
//   let filtered = propContracts.map(normalizeContractData).filter(Boolean);
  
//   if (searchTerm) {
//     filtered = filtered.filter(contract => 
//       (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (contract.contract_number && contract.contract_number.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (contract.filename && contract.filename.toLowerCase().includes(searchTerm.toLowerCase()))
//     );
//   }

//   if (statusFilter !== 'all') {
//     // Apply status filter based on user selection
//     filtered = filtered.filter(contract => 
//       contract.status && contract.status.toLowerCase() === statusFilter
//     );
//   }

//   if (dateFilter !== 'all') {
//     const today = new Date();
//     const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
//     switch (dateFilter) {
//       case 'last30':
//         filtered = filtered.filter(contract => 
//           contract.uploaded_at && new Date(contract.uploaded_at) > thirtyDaysAgo
//         );
//         break;
//       case 'expiring':
//         filtered = filtered.filter(contract => {
//           if (!contract.end_date) return false;
//           const endDate = new Date(contract.end_date);
//           const daysDiff = (endDate - new Date()) / (1000 * 60 * 60 * 24);
//           return daysDiff > 0 && daysDiff <= 30;
//         });
//         break;
//       case 'expired':
//         filtered = filtered.filter(contract => {
//           if (!contract.end_date) return false;
//           return new Date(contract.end_date) < new Date();
//         });
//         break;
//     }
//   }

//   console.log('DEBUG: Final filtered contracts:', filtered.length);
//   setFilteredContracts(filtered);
// };

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

//   const getDaysRemaining = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       const today = new Date();
//       const targetDate = new Date(dateString);
//       const diffTime = targetDate - today;
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       if (diffDays > 0) {
//         return `${diffDays} days`;
//       } else if (diffDays === 0) {
//         return 'Today';
//       } else {
//         return 'Expired';
//       }
//     } catch (e) {
//       return 'N/A';
//     }
//   };

//   const getContractDisplayId = (contract) => {
//     if (!contract) return 'Unknown';
//     if (contract.investment_id) return `INV-${contract.investment_id}`;
//     if (contract.project_id) return `PRJ-${contract.project_id}`;
//     if (contract.grant_id) return `GRANT-${contract.grant_id}`;
//     return `CONT-${contract.id}`;
//   };

// const getStatusColorForApproved = (status) => {
//   const statusLower = status?.toLowerCase();
//   switch (statusLower) {
//     case 'approved':
//       return 'approved';
//     case 'draft':
//       return 'draft';
//     case 'under_review':
//       return 'under_review';
//     case 'reviewed':
//       return 'reviewed';
//     case 'rejected':
//       return 'rejected';
//     case 'published':
//       return 'published';
//     case 'processed':
//       return 'processed';
//     case 'processing':
//       return 'processing';
//     case 'error':
//       return 'error';
//     default:
//       return 'default';
//   }
// };

// const getStatusIconForApproved = (status) => {
//   const statusLower = status?.toLowerCase();
//   switch (statusLower) {
//     case 'approved':
//       return <CheckCircle size={14} className="status-icon approved" />;
//     case 'draft':
//       return <FileText size={14} className="status-icon draft" />;
//     case 'under_review':
//       return <Clock size={14} className="status-icon under_review" />;
//     case 'reviewed':
//       return <FileCheck size={14} className="status-icon reviewed" />;
//     case 'rejected':
//       return <AlertCircle size={14} className="status-icon rejected" />;
//     case 'published':
//       return <CheckCircle size={14} className="status-icon published" />;
//     case 'processed':
//       return <CheckCircle size={14} className="status-icon processed" />;
//     case 'processing':
//       return <Loader2 size={14} className="status-icon processing" />;
//     case 'error':
//       return <AlertCircle size={14} className="status-icon error" />;
//     default:
//       return <Clock size={14} className="status-icon default" />;
//   }
// };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'processed':
//         return <CheckCircle size={14} className="status-icon processed" />;
//       case 'processing':
//         return <Loader2 size={14} className="status-icon processing" />;
//       case 'error':
//         return <AlertCircle size={14} className="status-icon error" />;
//       default:
//         return <Clock size={14} className="status-icon default" />;
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'processed': return 'processed';
//       case 'processing': return 'processing';
//       case 'error': return 'error';
//       default: return 'default';
//     }
//   };

//   const getDaysColor = (days) => {
//     if (days === 'Expired') return 'expired';
//     if (days === 'Today') return 'today';
//     if (days.includes('days')) {
//       const numDays = parseInt(days);
//       if (numDays <= 7) return 'critical';
//       if (numDays <= 30) return 'warning';
//     }
//     return 'normal';
//   };

// const calculateMetrics = () => {
//   // Filter for approved contracts only
//   const approvedContracts = propContracts.filter(contract => 
//     contract.status === 'approved' || contract.Status === 'approved'
//   );
  
//   const contractsData = approvedContracts.map(normalizeContractData).filter(Boolean);
//   const totalValue = contractsData.reduce((sum, c) => sum + (c.total_amount || 0), 0);
//   const activeContracts = contractsData.length; // All approved are active
//   const expiringSoon = contractsData.filter(c => {
//     const days = getDaysRemaining(c.end_date);
//     return days !== 'N/A' && days !== 'Expired' && days !== 'Today' && parseInt(days) <= 30;
//   }).length;

//   return {
//     totalValue,
//     totalContracts: contractsData.length,
//     activeContracts,
//     expiringSoon,
//     averageValue: contractsData.length > 0 ? totalValue / contractsData.length : 0
//   };
// };

//   const metrics = calculateMetrics();

//   // Handle click outside filter popup
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (showFilters && !event.target.closest('.filter-popup') && !event.target.closest('.btn-filter')) {
//         setShowFilters(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [showFilters]);

// const renderContractRow = (contract) => {
//   const displayId = getContractDisplayId(contract);
//   const daysRemaining = getDaysRemaining(contract.end_date);

//   return (
//     <tr key={contract.id} className="contract-row">
//       <td>
//         <div className="contract-info">
//           <div className="contract-name-only">
//             {contract.grant_name || contract.filename || 'Unnamed Contract'}
//           </div>
//         </div>
//       </td>
//       <td>
//         <div className="contract-id-only">
//           {displayId}
//         </div>
//       </td>
//       <td>
//         <div className="grantor-cell">
//           <span>{contract.grantor || 'N/A'}</span>
//         </div>
//       </td>
//       <td>
//         <div className="amount-cell">
//           <span>{formatCurrency(contract.total_amount)}</span>
//         </div>
//       </td>
//       <td>
//         <div className="date-cell">
//           <span>{formatDate(contract.uploaded_at)}</span>
//         </div>
//       </td>
//       <td>
//         <div className="date-cell">
//           <span>{formatDate(contract.end_date)}</span>
//         </div>
//       </td>
//       <td>
//   <div className="status-cell">
//     {getStatusIconForApproved(contract.status)}
//     <span className={`status-text ${getStatusColorForApproved(contract.status)}`}>
//       {contract.status ? contract.status.replace('_', ' ') : 'Unknown'}
//     </span>
//   </div>
// </td>
//       <td>
//         <div className="action-buttons">
//           <button 
//             className="btn-action"
//             onClick={() => navigate(`/contracts/${contract.id}`)}
//             title="View details"
//           >
//             <Eye size={16} />
//           </button>
//           <button className="btn-action" title="Download">
//             <Download size={16} />
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// };

// const renderContractCard = (contract) => {
//   const displayId = getContractDisplayId(contract);
//   const daysRemaining = getDaysRemaining(contract.end_date);
//   const daysColor = getDaysColor(daysRemaining);

//   return (
//     <div key={contract.id} className="contract-card">
//       <div className="card-header">
//         <div className="contract-status">
//           {getStatusIconForApproved(contract.status)} {/* CHANGED HERE */}
//           <span className={`status-text approved`}> {/* Hardcoded as approved */}
//             approved
//           </span>
//         </div>
//       </div>

//       <div className="card-content">
//         <h3 className="contract-name-small">
//           {contract.grant_name || contract.filename || 'Unnamed Contract'}
//         </h3>
//         <p className="contract-id-small">
//           ID: {displayId}
//         </p>

//         <div className="contract-meta">
//           <div className="meta-item">
//             <span>{contract.grantor || 'No grantor'}</span>
//           </div>
//           <div className="meta-item">
//             <span>{contract.uploaded_at ? formatDate(contract.uploaded_at) : 'No date'}</span>
//           </div>
//         </div>

//         <div className="contract-amount">
//           <span>{formatCurrency(contract.total_amount)}</span>
//         </div>

//         <div className="contract-timeline">
//           <div className="timeline-item">
//             <span className="timeline-label">Ends in</span>
//             <span className={`timeline-value ${daysColor}`}>
//               {daysRemaining}
//             </span>
//           </div>
//         </div>
//       </div>

//       <div className="card-footer">
//         <div className="action-buttons">
//           <button 
//             className="btn-action"
//             onClick={() => navigate(`/contracts/${contract.id}`)}
//             title="View details"
//           >
//             <Eye size={16} />
//           </button>
//           <button className="btn-action" title="Download">
//             <Download size={16} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

//   return (
//     <div className="contracts-list-page">
//       {/* Metrics Container - Same as Dashboard */}
//       <div className="metrics-container">
//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{metrics.totalContracts}</div>
//               <div className="metric-label">Total Grants</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{formatCurrency(metrics.totalValue)}</div>
//               <div className="metric-label">Total Value</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{metrics.activeContracts}</div>
//               <div className="metric-label">Active</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{metrics.expiringSoon}</div>
//               <div className="metric-label">Deadlines</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Search and Controls - Same as Dashboard */}
//       <div className="recent-contracts">
//         <div className="section-controls">
//           <div className="search-box">
//             <Search size={16} />
//             <input
//               type="text"
//               placeholder="Search grants..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//           </div>
          
//           <div className="controls-right">
//             <div className="view-toggle">
//               <button 
//                 className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
//                 onClick={() => setActiveView('list')}
//               >
//                 List
//               </button>
//               <button 
//                 className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
//                 onClick={() => setActiveView('grid')}
//               >
//                 Grid
//               </button>
//             </div>

//             <div className="filter-actions">
//               <button 
//                 className="btn-filter"
//                 onClick={() => setShowFilters(!showFilters)}
//                 title="Filter contracts"
//               >
//                 <Filter size={16} />
//                 <span>Filter</span>
//               </button>
              
//               <button 
//                 className="btn-upload"
//                onClick={() => navigate('/upload', { replace: false })}
//               >
//                 <Upload size={16} />
//                 <span>Upload</span>
//               </button>
              
//               <button 
//                 className="btn-refresh"
//                 onClick={() => window.location.reload()}
//                 disabled={loading}
//                 title="Refresh"
//               >
//                 <RefreshCw size={16} className={loading ? 'spinning' : ''} />
//               </button>
//             </div>
//           </div>

//           {/* Filter Popup */}
//           {showFilters && (
//             <div className="filter-popup">
//               <div className="filter-popup-header">
//                 <h3>Filter Contracts</h3>
//                 <button 
//                   className="filter-close"
//                   onClick={() => setShowFilters(false)}
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
              
//               <div className="filter-content">
// <div className="filter-group">
//   <label className="filter-label">Status</label>
//   <div className="filter-options">
//     {['all', 'approved', 'draft', 'under_review', 'reviewed', 'rejected', 'published'].map((status) => (
//       <button
//         key={status}
//         className={`filter-option ${statusFilter === status ? 'active' : ''}`}
//         onClick={() => {
//           setStatusFilter(status);
//           setShowFilters(false);
//         }}
//       >
//         {status === 'all' ? 'All Status' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
//       </button>
//     ))}
//   </div>
// </div>

//                 <div className="filter-group">
//                   <label className="filter-label">Date Range</label>
//                   <div className="filter-options">
//                     {['all', 'last30', 'expiring', 'expired'].map((date) => (
//                       <button
//                         key={date}
//                         className={`filter-option ${dateFilter === date ? 'active' : ''}`}
//                         onClick={() => {
//                           setDateFilter(date);
//                           setShowFilters(false);
//                         }}
//                       >
//                         {date === 'all' && 'All Dates'}
//                         {date === 'last30' && 'Last 30 Days'}
//                         {date === 'expiring' && 'Expiring Soon'}
//                         {date === 'expired' && 'Expired'}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="filter-actions-bottom">
//                   <button 
//                     className="btn-clear-filters"
//                     onClick={() => {
//                       setStatusFilter('all');
//                       setDateFilter('all');
//                       setShowFilters(false);
//                     }}
//                   >
//                     Clear Filters
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Contracts Content - Switch between views */}
//         <div className="contracts-content">
//           {loading ? (
//             <div className="loading-state">
//               <RefreshCw className="spinner" />
//               <p>Loading contracts...</p>
//             </div>
//           ) : filteredContracts.length > 0 ? (
//             <>
//               <div className="results-header">
//                 <span className="results-count">
//                   Showing {filteredContracts.length} of {propContracts.length} grants
//                 </span>
//               </div>

//               {activeView === 'list' ? (
//                 <div className="contracts-table-container">
//                   <table className="contracts-table">
//                     <thead>
//                       <tr>
//                         <th className="table-header-large">Grant Name</th>
//                         <th className="table-header-large">Grant ID</th>
//                         <th className="table-header-large">Grantor</th>
//                         <th className="table-header-large">Amount</th>
//                         <th className="table-header-large">Upload Date</th>
//                         <th className="table-header-large">End Date</th>
//                         <th className="table-header-large">Status</th>
//                         <th className="table-header-large">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {filteredContracts.map(renderContractRow)}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="contracts-grid">
//                   {filteredContracts.map(renderContractCard)}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="empty-state">
//               <FileText size={48} />
//               <h3>No contracts found</h3>
//               <p>{searchTerm ? 'Try adjusting your search' : 'Upload your first contract to get started'}</p>
//               {!searchTerm && (
//                 <button 
//                   className="btn-upload-main"
//                   onClick={() => navigate('/upload')}
//                 >
//                   <Upload size={20} />
//                   Upload First Contract
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ContractsListPage;

