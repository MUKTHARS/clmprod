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
  const navigate = useNavigate();

  useEffect(() => {
    if (propContracts.length > 0) {
      filterContracts();
    }
  }, [propContracts, searchTerm, statusFilter, dateFilter]);

  const normalizeContractData = (contract) => {
    if (!contract || typeof contract !== 'object') {
      return {
        id: Math.floor(Math.random() * 1000),
        filename: 'Unknown Contract',
        grant_name: 'Unknown Contract',
        grantor: 'Unknown',
        total_amount: 0,
        status: 'unknown'
      };
    }
    
    const contractId = contract.id || contract.contract_id;
    
    const normalized = {
      id: contractId || Math.random().toString(36).substr(2, 9),
      filename: contract.filename || 'Unnamed Contract',
      uploaded_at: contract.uploaded_at,
      status: contract.status || 'processed',
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
    let filtered = [...propContracts].map(normalizeContractData);

    if (searchTerm) {
      filtered = filtered.filter(contract => 
        (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.filename && contract.filename.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      
      switch (dateFilter) {
        case 'last30':
          filtered = filtered.filter(contract => 
            new Date(contract.uploaded_at) > thirtyDaysAgo
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

    setFilteredContracts(filtered);
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

  const getStatusIcon = (status) => {
    switch (status) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'processed';
      case 'processing': return 'processing';
      case 'error': return 'error';
      default: return 'default';
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

  const calculateMetrics = () => {
    const contractsData = propContracts.map(normalizeContractData);
    const totalValue = contractsData.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const activeContracts = contractsData.filter(c => c.status === 'processed').length;
    const expiringSoon = contractsData.filter(c => {
      const days = getDaysRemaining(c.end_date);
      return days !== 'N/A' && days !== 'Expired' && days !== 'Today' && parseInt(days) <= 30;
    }).length;

    return {
      totalValue,
      totalContracts: contractsData.length,
      activeContracts,
      expiringSoon,
      averageValue: contractsData.length > 0 ? totalValue / contractsData.length : 0
    };
  };

  const metrics = calculateMetrics();

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
            {getStatusIcon(contract.status)}
            <span className={`status-text ${getStatusColor(contract.status)}`}>
              {contract.status || 'unknown'}
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
            {getStatusIcon(contract.status)}
            <span className={`status-text ${contract.status}`}>
              {contract.status || 'unknown'}
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
              <div className="metric-label">Total Contracts</div>
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
              placeholder="Search contracts..."
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
                onClick={() => navigate('/upload')}
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
                    {['all', 'processed', 'processing', 'error'].map((status) => (
                      <button
                        key={status}
                        className={`filter-option ${statusFilter === status ? 'active' : ''}`}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilters(false);
                        }}
                      >
                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                  Showing {filteredContracts.length} of {propContracts.length} contracts
                </span>
              </div>

              {activeView === 'list' ? (
                <div className="contracts-table-container">
                  <table className="contracts-table">
                    <thead>
                      <tr>
                        <th className="table-header-large">Contract Name</th>
                        <th className="table-header-large">Contract ID</th>
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
              <FileText size={48} />
              <h3>No contracts found</h3>
              <p>{searchTerm ? 'Try adjusting your search' : 'Upload your first contract to get started'}</p>
              {!searchTerm && (
                <button 
                  className="btn-upload-main"
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
  );
}

export default ContractsListPage;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { normalizeContract } from './utils/contractUtils';
// import API_CONFIG from './config';
// import {
//   Search,
//   Filter,
//   Calendar,
//   RefreshCw,
//   Upload,
//   FileText,
//   Building,
//   DollarSign,
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

// function ContractsListPage({ contracts, user }) {
//   const [filteredContracts, setFilteredContracts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [dateFilter, setDateFilter] = useState('all');
//   const [showFilters, setShowFilters] = useState(false);
//   const [activeView, setActiveView] = useState('grid');
//   const navigate = useNavigate();

//   useEffect(() => {
//     console.log('ContractsListPage mounted - fetching contracts');
//     fetchContracts();
//   }, []);

//   useEffect(() => {
//     if (contracts.length > 0 && contracts.every(c => c && c.id)) {
//       filterContracts();
//     }
//   }, [contracts, searchTerm, statusFilter, dateFilter]);

//   const normalizeContractData = (contract) => {
//     if (!contract || typeof contract !== 'object') {
//       return {
//         id: Math.floor(Math.random() * 1000),
//         filename: 'Unknown Contract',
//         grant_name: 'Unknown Contract',
//         grantor: 'Unknown',
//         total_amount: 0,
//         status: 'unknown'
//       };
//     }
    
//     const keys = Object.keys(contract);
//     if (keys.length === 0) {
//       return null;
//     }
    
//     const contractId = contract.id || contract.contract_id || 
//                        (contract.basic_data && contract.basic_data.id) || 
//                        (contract.comprehensive_data && contract.comprehensive_data.contract_id);
    
//     const normalized = {
//       id: contractId || Math.random().toString(36).substr(2, 9),
//       filename: contract.filename || 'Unnamed Contract',
//       uploaded_at: contract.uploaded_at,
//       status: contract.status || 'processed',
//       investment_id: contract.investment_id,
//       project_id: contract.project_id,
//       grant_id: contract.grant_id,
//       extracted_reference_ids: contract.extracted_reference_ids || [],
//       comprehensive_data: contract.comprehensive_data || null
//     };
    
//     const hasComprehensiveData = contract.comprehensive_data && 
//                                 typeof contract.comprehensive_data === 'object' &&
//                                 Object.keys(contract.comprehensive_data).length > 0;
    
//     const hasBasicData = contract.grant_name || contract.grantor || contract.total_amount || 
//                         (contract.basic_data && typeof contract.basic_data === 'object');
    
//     if (hasComprehensiveData) {
//       const compData = contract.comprehensive_data;
//       const contractDetails = compData.contract_details || {};
//       const parties = compData.parties || {};
//       const financial = compData.financial_details || {};
      
//       normalized.grant_name = contractDetails.grant_name || 
//                              contract.grant_name || 
//                              contract.filename || 
//                              'Unnamed Contract';
      
//       normalized.contract_number = contractDetails.contract_number || 
//                                   contract.contract_number;
      
//       normalized.start_date = contractDetails.start_date || 
//                              contract.start_date;
      
//       normalized.end_date = contractDetails.end_date || 
//                            contract.end_date;
      
//       normalized.purpose = contractDetails.purpose || 
//                           contract.purpose;
      
//       normalized.grantor = parties.grantor?.organization_name || 
//                           contract.grantor || 
//                           'Unknown Grantor';
      
//       normalized.grantee = parties.grantee?.organization_name || 
//                           contract.grantee || 
//                           'Unknown Grantee';
      
//       normalized.total_amount = financial.total_grant_amount || 
//                                contract.total_amount || 
//                                0;
//       normalized.currency = financial.currency || 'USD';
      
//     } else if (hasBasicData) {
//       normalized.grant_name = contract.grant_name || 
//                              (contract.basic_data && contract.basic_data.grant_name) || 
//                              contract.filename || 
//                              'Unnamed Contract';
      
//       normalized.grantor = contract.grantor || 
//                           (contract.basic_data && contract.basic_data.grantor) || 
//                           'Unknown Grantor';
      
//       normalized.grantee = contract.grantee || 
//                           (contract.basic_data && contract.basic_data.grantee) || 
//                           'Unknown Grantee';
      
//       normalized.total_amount = contract.total_amount || 
//                                (contract.basic_data && contract.basic_data.total_amount) || 
//                                0;
      
//       normalized.contract_number = contract.contract_number || 
//                                   (contract.basic_data && contract.basic_data.contract_number);
      
//       normalized.start_date = contract.start_date || 
//                              (contract.basic_data && contract.basic_data.start_date);
      
//       normalized.end_date = contract.end_date || 
//                            (contract.basic_data && contract.basic_data.end_date);
      
//       normalized.purpose = contract.purpose || 
//                           (contract.basic_data && contract.basic_data.purpose);
      
//     } else {
//       normalized.grant_name = contract.filename || 'Unnamed Contract';
//       normalized.grantor = 'Unknown Grantor';
//       normalized.grantee = 'Unknown Grantee';
//       normalized.total_amount = 0;
//     }
    
//     return normalized;
//   };

//   const fetchContracts = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const headers = {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       };
      
//       if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//       }
      
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
//         headers: headers
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         let contractsArray = [];
        
//         if (Array.isArray(data)) {
//           contractsArray = data;
//         } else if (data && typeof data === 'object') {
//           if (data.contracts && Array.isArray(data.contracts)) {
//             contractsArray = data.contracts;
//           } else if (data.data && Array.isArray(data.data)) {
//             contractsArray = data.data;
//           } else {
//             contractsArray = Object.values(data);
//           }
//         }
        
//         const normalizedContracts = contractsArray
//           .map((contract, index) => {
//             if (!contract || typeof contract !== 'object') {
//               return {
//                 id: index + 1,
//                 filename: `Contract ${index + 1}`,
//                 grant_name: `Contract ${index + 1}`,
//                 grantor: 'Unknown',
//                 total_amount: 0,
//                 status: 'unknown'
//               };
//             }
            
//             return normalizeContractData(contract);
//           })
//           .filter(contract => contract !== null);
        
//         setContracts(normalizedContracts);
//         setFilteredContracts(normalizedContracts);
        
//       } else {
//         console.error('Failed to fetch contracts:', response.status);
//         setContracts([]);
//         setFilteredContracts([]);
//       }
//     } catch (error) {
//       console.error('Error fetching contracts:', error);
//       try {
//         const basicResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`);
//         if (basicResponse.ok) {
//           const basicData = await basicResponse.json();
//           if (Array.isArray(basicData) && basicData.length > 0) {
//             const normalized = basicData.map(contract => normalizeContractData(contract)).filter(c => c);
//             setContracts(normalized);
//             setFilteredContracts(normalized);
//           }
//         }
//       } catch (fallbackError) {
//         console.error('Fallback also failed:', fallbackError);
//         setContracts([]);
//         setFilteredContracts([]);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterContracts = () => {
//     let filtered = [...contracts];

//     if (searchTerm) {
//       filtered = filtered.filter(contract => 
//         (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
//         (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
//         (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
//         (contract.filename && contract.filename.toLowerCase().includes(searchTerm.toLowerCase()))
//       );
//     }

//     if (statusFilter !== 'all') {
//       filtered = filtered.filter(contract => contract.status === statusFilter);
//     }

//     if (dateFilter !== 'all') {
//       const today = new Date();
//       const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      
//       switch (dateFilter) {
//         case 'last30':
//           filtered = filtered.filter(contract => 
//             new Date(contract.uploaded_at) > thirtyDaysAgo
//           );
//           break;
//         case 'expiring':
//           filtered = filtered.filter(contract => {
//             if (!contract.end_date) return false;
//             const endDate = new Date(contract.end_date);
//             const daysDiff = (endDate - new Date()) / (1000 * 60 * 60 * 24);
//             return daysDiff > 0 && daysDiff <= 30;
//           });
//           break;
//         case 'expired':
//           filtered = filtered.filter(contract => {
//             if (!contract.end_date) return false;
//             return new Date(contract.end_date) < new Date();
//           });
//           break;
//       }
//     }

//     setFilteredContracts(filtered);
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

//   const calculateFundsReceived = (contract) => {
//     const total = contract.total_amount || 0;
//     return total * 0.5;
//   };

//   const getContractDisplayId = (contract) => {
//     if (!contract) return 'Unknown';
//     if (contract.investment_id) return `INV-${contract.investment_id}`;
//     if (contract.project_id) return `PRJ-${contract.project_id}`;
//     if (contract.grant_id) return `GRANT-${contract.grant_id}`;
//     return `CONT-${contract.id}`;
//   };

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

//   const calculateMetrics = () => {
//     const totalValue = filteredContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
//     const activeContracts = filteredContracts.filter(c => c.status === 'processed').length;
//     const expiringSoon = filteredContracts.filter(c => {
//       const days = getDaysRemaining(c.end_date);
//       return days !== 'N/A' && days !== 'Expired' && days !== 'Today' && parseInt(days) <= 30;
//     }).length;
//     const averageValue = filteredContracts.length > 0 ? totalValue / filteredContracts.length : 0;

//     return {
//       totalValue,
//       totalContracts: filteredContracts.length,
//       activeContracts,
//       expiringSoon,
//       averageValue
//     };
//   };

//   const metrics = calculateMetrics();

//   const renderContractCard = (contract) => {
//     const fundsReceived = calculateFundsReceived(contract);
//     const daysRemaining = getDaysRemaining(contract.end_date);
//     const displayId = getContractDisplayId(contract);
//     const isExpiring = daysRemaining !== 'N/A' && daysRemaining !== 'Expired' && 
//                      daysRemaining !== 'Today' && parseInt(daysRemaining) <= 30;

//     return (
//       <div key={contract.id} className="contract-card">
//         <div className="card-header">
//           <div className="contract-badge">
//             {getStatusIcon(contract.status)}
//             <span className={`status-text ${getStatusColor(contract.status)}`}>
//               {contract.status || 'unknown'}
//             </span>
//           </div>
//           <button className="card-menu">
//             <MoreVertical size={16} />
//           </button>
//         </div>

//         <div className="card-content">
//           <h3 className="contract-name">
//             {contract.grant_name || contract.filename || 'Unnamed Contract'}
//           </h3>
//           <p className="contract-id">
//             ID: {displayId}
//             {contract.contract_number && (
//               <span className="contract-number"> • #{contract.contract_number}</span>
//             )}
//           </p>

//           <div className="contract-meta">
//             <div className="meta-item">
//               <span>{contract.grantor || 'No grantor'}</span>
//             </div>
//             <div className="meta-item">
//               <span>{formatDate(contract.start_date)}</span>
//             </div>
//           </div>

//           <div className="contract-amount">
//             <span>{formatCurrency(contract.total_amount)}</span>
//           </div>

//           <div className="contract-timeline">
//             <div className="timeline-item">
//               <span className="timeline-label">Ends in</span>
//               <span className={`timeline-value ${isExpiring ? 'expiring' : ''}`}>
//                 {daysRemaining}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="card-footer">
//           <button 
//             className="btn-view"
//             onClick={() => navigate(`/contracts/${contract.id}`)}
//           >
//             View Details
//             <ChevronRight size={14} />
//           </button>
//           <button className="btn-action">
//             <Download size={14} />
//           </button>
//         </div>
//       </div>
//     );
//   };

//   const renderContractRow = (contract) => {
//     const displayId = getContractDisplayId(contract);
//     const daysRemaining = getDaysRemaining(contract.end_date);

//     return (
//       <tr key={contract.id} className="contract-row">
//         <td>
//           <div className="contract-info">
//             <div>
//               <div className="contract-name">
//                 {contract.grant_name || contract.filename || 'Unnamed Contract'}
//               </div>
//               <div className="contract-id">
//                 ID: {displayId}
//               </div>
//             </div>
//           </div>
//         </td>
//         <td>
//           <div className="grantor-cell">
//             <span>{contract.grantor || 'N/A'}</span>
//           </div>
//         </td>
//         <td>
//           <div className="amount-cell">
//             <span>{formatCurrency(contract.total_amount)}</span>
//           </div>
//         </td>
//         <td>
//           <div className="date-cell">
//             <span>{formatDate(contract.end_date)}</span>
//           </div>
//         </td>
//         <td>
//           <div className={`days-cell ${daysRemaining === 'Expired' ? 'expired' : ''}`}>
//             <span>{daysRemaining}</span>
//           </div>
//         </td>
//         <td>
//           <div className="status-cell">
//             {getStatusIcon(contract.status)}
//             <span className={`status-text ${getStatusColor(contract.status)}`}>
//               {contract.status || 'unknown'}
//             </span>
//           </div>
//         </td>
//         <td>
//           <div className="action-buttons">
//             <button 
//               className="btn-action"
//               onClick={() => navigate(`/contracts/${contract.id}`)}
//               title="View details"
//             >
//               <Eye size={14} />
//             </button>
//             <button className="btn-action" title="Download">
//               <Download size={14} />
//             </button>
//           </div>
//         </td>
//       </tr>
//     );
//   };

//   return (
//     <div className="contracts-list-page">
//       {/* Search and Filters at top - similar to Dashboard */}
//       <div className="search-filters-section">
//         <div className="search-box">
//           <Search size={14} />
//           <input
//             type="text"
//             placeholder="Search contracts..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="search-input"
//           />
//         </div>
        
//         <div className="controls-right">
//           <div className="view-toggle">
//             <button 
//               className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
//               onClick={() => setActiveView('list')}
//             >
//               List
//             </button>
//             <button 
//               className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
//               onClick={() => setActiveView('grid')}
//             >
//               Grid
//             </button>
//           </div>

//           <button 
//             className="btn-upload"
//             onClick={() => navigate('/upload')}
//           >
//             <Upload size={14} />
//             Upload
//           </button>
          
//           <button 
//             className="btn-icon"
//             onClick={fetchContracts}
//             disabled={loading}
//             title="Refresh"
//           >
//             <RefreshCw size={14} className={loading ? 'spinning' : ''} />
//           </button>
//         </div>
//       </div>

//       {/* Metrics - same as Dashboard */}
//       <div className="metrics-container">
//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{metrics.totalContracts}</div>
//               <div className="metric-label">Total Contracts</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{formatCurrency(metrics.totalValue)}</div>
//               <div className="metric-label">Total Value</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{metrics.activeContracts}</div>
//               <div className="metric-label">Active</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{metrics.expiringSoon}</div>
//               <div className="metric-label">Deadlines</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filters dropdown */}
//       <div className="section-controls">
//         <button 
//           className="btn-filter"
//           onClick={() => setShowFilters(!showFilters)}
//         >
//           <Filter size={14} />
//           <span>Filters</span>
//           <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
//         </button>
//       </div>

//       {showFilters && (
//         <div className="advanced-filters">
//           <div className="filter-group">
//             <label className="filter-label">Status</label>
//             <div className="filter-options">
//               {['all', 'processed', 'processing', 'error'].map((status) => (
//                 <button
//                   key={status}
//                   className={`filter-option ${statusFilter === status ? 'active' : ''}`}
//                   onClick={() => setStatusFilter(status)}
//                 >
//                   {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="filter-group">
//             <label className="filter-label">Date Range</label>
//             <div className="filter-options">
//               {['all', 'last30', 'expiring', 'expired'].map((date) => (
//                 <button
//                   key={date}
//                   className={`filter-option ${dateFilter === date ? 'active' : ''}`}
//                   onClick={() => setDateFilter(date)}
//                 >
//                   {date === 'all' && 'All Dates'}
//                   {date === 'last30' && 'Last 30 Days'}
//                   {date === 'expiring' && 'Expiring Soon'}
//                   {date === 'expired' && 'Expired'}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="filter-actions">
//             <button 
//               className="btn-secondary"
//               onClick={() => {
//                 setStatusFilter('all');
//                 setDateFilter('all');
//               }}
//             >
//               Clear Filters
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Contracts Content */}
//       <div className="contracts-content">
//         {loading ? (
//           <div className="loading-state">
//             <RefreshCw className="spinner" />
//             <p>Loading contracts...</p>
//           </div>
//         ) : filteredContracts.length > 0 ? (
//           <>
//             <div className="results-header">
//               <span className="results-count">
//                 Showing {filteredContracts.length} of {contracts.length} contracts
//               </span>
//             </div>

//             {activeView === 'list' ? (
//               <div className="contracts-table-container">
//                 <table className="contracts-table">
//                   <thead>
//                     <tr>
//                       <th>Contract</th>
//                       <th>Grantor</th>
//                       <th>Amount</th>
//                       <th>End Date</th>
//                       <th>Days Left</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredContracts.map(renderContractRow)}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="contracts-grid">
//                 {filteredContracts.map(renderContractCard)}
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="empty-state">
//             <FileText size={48} />
//             <h3>No contracts found</h3>
//             <p>{searchTerm ? 'Try adjusting your search' : 'Upload your first contract to get started'}</p>
//             {!searchTerm && (
//               <button 
//                 className="btn-upload-main"
//                 onClick={() => navigate('/upload')}
//               >
//                 <Upload size={14} />
//                 Upload First Contract
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ContractsListPage;