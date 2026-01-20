import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeContract } from './utils/contractUtils';
import API_CONFIG from './config';
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Upload,
  FileText,
  Building,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  MoreVertical,
  Download,
  Eye,
  BarChart3,
  Users,
  Target,
  Shield,
  Plus,
  X,
  ChevronDown,
  Filter as FilterIcon,
  Loader2,
  Send // Add this import for the submit button
} from 'lucide-react';
import './styles/ContractsListPage.css';

function ContractsListPage({ contracts, user }) { // Add user prop here
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState('grid'); // 'grid' or 'list'
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ContractsListPage mounted - fetching contracts');
    fetchContracts();
  }, []);

  useEffect(() => {
    if (contracts.length > 0 && contracts.every(c => c && c.id)) {
      console.log('Filtering valid contracts...', contracts.length);
      filterContracts();
    }
  }, [contracts, searchTerm, statusFilter, dateFilter]);

  const normalizeContractData = (contract) => {
    // If contract is malformed but we need to display something
    if (!contract || typeof contract !== 'object') {
      console.warn('Invalid contract data, creating minimal object');
      return {
        id: Math.floor(Math.random() * 1000),
        filename: 'Unknown Contract',
        grant_name: 'Unknown Contract',
        grantor: 'Unknown',
        total_amount: 0,
        status: 'unknown'
      };
    }
    
    // Check if it has any data at all
    const keys = Object.keys(contract);
    if (keys.length === 0) {
      console.error('Contract object is empty:', contract);
      return null;
    }
    
    // Get contract ID - check multiple possible properties
    const contractId = contract.id || contract.contract_id || 
                       (contract.basic_data && contract.basic_data.id) || 
                       (contract.comprehensive_data && contract.comprehensive_data.contract_id);
    
    if (!contractId) {
      console.warn('Contract has no ID property, but has data:', contract);
      // Still try to process it with a temporary ID
    }
    
    console.log(`Processing contract with ID: ${contractId || 'temporary'}`);
    
    // Check if we have comprehensive_data or basic fields
    const hasComprehensiveData = contract.comprehensive_data && 
                                typeof contract.comprehensive_data === 'object' &&
                                Object.keys(contract.comprehensive_data).length > 0;
    
    const hasBasicData = contract.grant_name || contract.grantor || contract.total_amount || 
                        (contract.basic_data && typeof contract.basic_data === 'object');
    
    // Build normalized contract object
    const normalized = {
      id: contractId || Math.random().toString(36).substr(2, 9), // Generate temp ID if needed
      filename: contract.filename || 'Unnamed Contract',
      uploaded_at: contract.uploaded_at,
      status: contract.status || 'processed',
      investment_id: contract.investment_id,
      project_id: contract.project_id,
      grant_id: contract.grant_id,
      extracted_reference_ids: contract.extracted_reference_ids || [],
      comprehensive_data: contract.comprehensive_data || null
    };
    
    // Extract from comprehensive_data if available
    if (hasComprehensiveData) {
      console.log(`Contract ${contractId} has comprehensive_data`);
      const compData = contract.comprehensive_data;
      
      // Extract contract details
      const contractDetails = compData.contract_details || {};
      if (contractDetails && typeof contractDetails === 'object') {
        normalized.grant_name = contractDetails.grant_name || 
                               contract.grant_name || 
                               contract.filename || 
                               'Unnamed Contract';
        
        normalized.contract_number = contractDetails.contract_number || 
                                    contract.contract_number;
        
        normalized.start_date = contractDetails.start_date || 
                               contract.start_date;
        
        normalized.end_date = contractDetails.end_date || 
                             contract.end_date;
        
        normalized.purpose = contractDetails.purpose || 
                            contract.purpose;
      } else {
        normalized.grant_name = contract.grant_name || 
                               contract.filename || 
                               'Unnamed Contract';
      }
      
      // Extract parties information
      const parties = compData.parties || {};
      if (parties && typeof parties === 'object') {
        normalized.grantor = parties.grantor?.organization_name || 
                            contract.grantor || 
                            'Unknown Grantor';
        
        normalized.grantee = parties.grantee?.organization_name || 
                            contract.grantee || 
                            'Unknown Grantee';
      } else {
        normalized.grantor = contract.grantor || 'Unknown Grantor';
        normalized.grantee = contract.grantee || 'Unknown Grantee';
      }
      
      // Extract financial information
      const financial = compData.financial_details || {};
      if (financial && typeof financial === 'object') {
        normalized.total_amount = financial.total_grant_amount || 
                                 contract.total_amount || 
                                 0;
        normalized.currency = financial.currency || 'USD';
      } else {
        normalized.total_amount = contract.total_amount || 0;
      }
      
    } else if (hasBasicData) {
      console.log(`Contract ${contractId} has basic fields`);
      // Use basic data fields
      normalized.grant_name = contract.grant_name || 
                             (contract.basic_data && contract.basic_data.grant_name) || 
                             contract.filename || 
                             'Unnamed Contract';
      
      normalized.grantor = contract.grantor || 
                          (contract.basic_data && contract.basic_data.grantor) || 
                          'Unknown Grantor';
      
      normalized.grantee = contract.grantee || 
                          (contract.basic_data && contract.basic_data.grantee) || 
                          'Unknown Grantee';
      
      normalized.total_amount = contract.total_amount || 
                               (contract.basic_data && contract.basic_data.total_amount) || 
                               0;
      
      normalized.contract_number = contract.contract_number || 
                                  (contract.basic_data && contract.basic_data.contract_number);
      
      normalized.start_date = contract.start_date || 
                             (contract.basic_data && contract.basic_data.start_date);
      
      normalized.end_date = contract.end_date || 
                           (contract.basic_data && contract.basic_data.end_date);
      
      normalized.purpose = contract.purpose || 
                          (contract.basic_data && contract.basic_data.purpose);
      
    } else {
      console.log(`Contract ${contractId} has limited data, using fallback`);
      // Fallback values
      normalized.grant_name = contract.filename || 'Unnamed Contract';
      normalized.grantor = 'Unknown Grantor';
      normalized.grantee = 'Unknown Grantee';
      normalized.total_amount = 0;
    }
    
    console.log(`Normalized contract ${normalized.id}:`, {
      grant_name: normalized.grant_name,
      grantor: normalized.grantor,
      total_amount: normalized.total_amount,
      hasComprehensiveData: hasComprehensiveData
    });
    
    return normalized;
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch contracts...');
      
      // Get authentication token
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // First, try the comprehensive endpoint that ContractDetailsPage uses
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
        headers: headers
      });
      
      console.log('Comprehensive API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Comprehensive contracts data received:', data);
        
        // Handle different response formats
        let contractsArray = [];
        
        if (Array.isArray(data)) {
          contractsArray = data;
        } else if (data && typeof data === 'object') {
          // If response is an object with contracts property
          if (data.contracts && Array.isArray(data.contracts)) {
            contractsArray = data.contracts;
          } else if (data.data && Array.isArray(data.data)) {
            contractsArray = data.data;
          } else {
            // Convert object values to array
            contractsArray = Object.values(data);
          }
        }
        
        console.log('Processed contracts array:', contractsArray.length);
        
        // DEBUG: Show what we're actually getting
        if (contractsArray.length > 0) {
          console.log('First contract raw structure:', {
            keys: Object.keys(contractsArray[0]),
            values: contractsArray[0]
          });
        }
        
        // Don't filter out empty objects immediately - try to normalize first
        const normalizedContracts = contractsArray
          .map((contract, index) => {
            // If contract appears empty, it might have hidden properties
            console.log(`Contract ${index}:`, contract);
            
            if (!contract || typeof contract !== 'object') {
              console.warn(`Contract ${index} is invalid, creating placeholder`);
              return {
                id: index + 1,
                filename: `Contract ${index + 1}`,
                grant_name: `Contract ${index + 1}`,
                grantor: 'Unknown',
                total_amount: 0,
                status: 'unknown'
              };
            }
            
            return normalizeContractData(contract);
          })
          .filter(contract => contract !== null);
        
        console.log('Final normalized contracts count:', normalizedContracts.length);
        
        if (normalizedContracts.length > 0) {
          console.log('First normalized contract:', normalizedContracts[0]);
        }
        
        setContracts(normalizedContracts);
        setFilteredContracts(normalizedContracts);
        
      } else {
        console.error('Failed to fetch contracts:', response.status);
        setContracts([]);
        setFilteredContracts([]);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      
      // Last resort: try the basic endpoint without auth
      try {
        const basicResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`);
        if (basicResponse.ok) {
          const basicData = await basicResponse.json();
          console.log('Basic no-auth contracts:', basicData);
          
          if (Array.isArray(basicData) && basicData.length > 0) {
            const normalized = basicData.map(contract => normalizeContractData(contract)).filter(c => c);
            setContracts(normalized);
            setFilteredContracts(normalized);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setContracts([]);
        setFilteredContracts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (contractId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/contracts/${contractId}/submit-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Contract submitted for review!');
        fetchContracts(); // Refresh the contracts list
      } else {
        const error = await response.json();
        alert(`Failed to submit: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit for review:', error);
      alert('Failed to submit for review');
    }
  };

  const filterContracts = () => {
    let filtered = [...contracts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.filename && contract.filename.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Date filter
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

  // Use the same formatting functions as Dashboard
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

  // Use same calculation as Dashboard
  const calculateFundsReceived = (contract) => {
    const total = contract.total_amount || 0;
    return total * 0.5; // Same as Dashboard's 50% assumption
  };

  const calculateFundsRemaining = (contract) => {
    const total = contract.total_amount || 0;
    const received = calculateFundsReceived(contract);
    return total - received;
  };

  // Use same ID logic as Dashboard
  const getContractDisplayId = (contract) => {
    if (!contract) return 'Unknown';
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.id}`;
  };

  // Use same status logic as Dashboard
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircle size={16} className="status-icon processed" />;
      case 'processing':
        return <Loader2 size={16} className="status-icon processing" />;
      case 'error':
        return <AlertCircle size={16} className="status-icon error" />;
      default:
        return <Clock size={16} className="status-icon default" />;
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

  // Use same metrics calculation as Dashboard
  const calculateMetrics = () => {
    const totalValue = filteredContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const activeContracts = filteredContracts.filter(c => c.status === 'processed').length;
    const expiringSoon = filteredContracts.filter(c => {
      const days = getDaysRemaining(c.end_date);
      return days !== 'N/A' && days !== 'Expired' && days !== 'Today' && parseInt(days) <= 30;
    }).length;
    const averageValue = filteredContracts.length > 0 ? totalValue / filteredContracts.length : 0;

    return {
      totalValue,
      totalContracts: filteredContracts.length,
      activeContracts,
      expiringSoon,
      averageValue
    };
  };

  const metrics = calculateMetrics();

  const renderContractCard = (contract) => {
    const fundsReceived = calculateFundsReceived(contract);
    const daysRemaining = getDaysRemaining(contract.end_date);
    const displayId = getContractDisplayId(contract);
    const isExpiring = daysRemaining !== 'N/A' && daysRemaining !== 'Expired' && 
                     daysRemaining !== 'Today' && parseInt(daysRemaining) <= 30;

    return (
      <div key={contract.id} className="contract-card">
        <div className="card-header">
          <div className="contract-badge">
            {getStatusIcon(contract.status)}
            <span className={`status-text ${getStatusColor(contract.status)}`}>
              {contract.status || 'unknown'}
            </span>
          </div>
          <button className="card-menu">
            <MoreVertical size={20} />
          </button>
        </div>

        <div className="card-content">
          <div className="contract-icon">
            <FileText size={24} />
          </div>
          <h3 className="contract-name">
            {contract.grant_name || contract.filename || 'Unnamed Contract'}
          </h3>
          <p className="contract-id">
            ID: {displayId}
            {contract.contract_number && (
              <span className="contract-number"> • #{contract.contract_number}</span>
            )}
          </p>

          <div className="contract-meta">
            <div className="meta-item">
              <Building size={14} />
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="meta-item">
              <Calendar size={14} />
              <span>{formatDate(contract.start_date)}</span>
            </div>
          </div>

          <div className="financial-metrics">
            <div className="financial-metric">
              <span className="metric-label">Total Amount</span>
              <span className="metric-value total">
                {formatCurrency(contract.total_amount)}
              </span>
            </div>
            <div className="financial-metric">
              <span className="metric-label">Funds Received</span>
              <span className="metric-value received">
                {formatCurrency(fundsReceived)}
              </span>
            </div>
          </div>

          <div className="timeline-section">
            <div className="timeline-item">
              <span className="timeline-label">End Date:</span>
              <span className="timeline-value">{formatDate(contract.end_date)}</span>
            </div>
            <div className="timeline-item">
              <span className="timeline-label">Days Remaining:</span>
              <span className={`timeline-value ${isExpiring ? 'expiring' : ''}`}>
                {daysRemaining}
              </span>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <button 
            className="btn-view"
            onClick={() => navigate(`/contracts/${contract.id}`)}
          >
            <Eye size={16} />
            <span>View Details</span>
            <ChevronRight size={16} />
          </button>
          
          {/* Project Manager quick actions */}
          {user && user.role === "project_manager" && (
            <div className="quick-actions">
              {(contract.status === 'draft' || contract.status === 'rejected') && (
                <button 
                  className="btn-submit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitForReview(contract.id);
                  }}
                  title="Submit for review"
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          )}
          
          <button className="btn-download">
            <Download size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderContractRow = (contract) => {
    const fundsReceived = calculateFundsReceived(contract);
    const daysRemaining = getDaysRemaining(contract.end_date);
    const displayId = getContractDisplayId(contract);

    return (
      <tr key={contract.id} className="contract-row">
        <td>
          <div className="contract-info">
            <div className="contract-icon-small">
              <FileText size={16} />
            </div>
            <div>
              <div className="contract-name-row">
                {contract.grant_name || contract.filename || 'Unnamed Contract'}
              </div>
              <div className="contract-id-row">
                ID: {displayId}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div className="grantor-cell">
            <Building size={14} />
            <span>{contract.grantor || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="amount-display">
            <DollarSign size={14} />
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>
        </td>
        <td>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: '50%' }} // Same as Dashboard's assumption
              ></div>
            </div>
            <span className="progress-text">50%</span>
          </div>
        </td>
        <td>
          <div className="timeline-cell">
            <Calendar size={14} />
            <span>{formatDate(contract.end_date)}</span>
          </div>
        </td>
        <td>
          <div className={`days-cell ${getDaysRemaining(contract.end_date) === 'Expired' ? 'expired' : ''}`}>
            <Clock size={14} />
            <span>{getDaysRemaining(contract.end_date)}</span>
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

  return (
    <div className="contracts-list-page">
      {/* Header Section - Uncommented to match Dashboard */}
      <div className="page-header">
        <div className="header-left">
          <h1>Contracts Library</h1>
          <p className="page-subtitle">
            Manage and analyze all your grant contracts in one place
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-icon"
            onClick={fetchContracts}
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/upload')}
          >
            <Plus size={20} />
            <span>Upload Contract</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview - Same structure as Dashboard */}
      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-value">{metrics.totalContracts}</span>
            <span className="metric-label">Total Contracts</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-value">{formatCurrency(metrics.totalValue)}</span>
            <span className="metric-label">Total Value</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-value">{metrics.activeContracts}</span>
            <span className="metric-label">Active</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-value">{metrics.expiringSoon}</span>
            <span className="metric-label">Expiring Soon</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-value">{formatCurrency(metrics.averageValue)}</span>
            <span className="metric-label">Average Value</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search contracts by name, grantor, ID, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="controls-container">
          <div className="view-toggle">
            <button 
              className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveView('grid')}
            >
              <span className="view-icon">⏹️</span>
              Grid
            </button>
            <button 
              className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
            >
              <span className="view-icon">☰</span>
              List
            </button>
          </div>

          <button 
            className="btn-filter"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon size={18} />
            <span>Filters</span>
            {showFilters ? <ChevronDown className="rotate-180" /> : <ChevronDown />}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={16} />
              Status
            </label>
            <div className="filter-options">
              {['all', 'processed', 'processing', 'error'].map((status) => (
                <button
                  key={status}
                  className={`filter-option ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Calendar size={16} />
              Date Range
            </label>
            <div className="filter-options">
              {['all', 'last30', 'expiring', 'expired'].map((date) => (
                <button
                  key={date}
                  className={`filter-option ${dateFilter === date ? 'active' : ''}`}
                  onClick={() => setDateFilter(date)}
                >
                  {date === 'all' && 'All Dates'}
                  {date === 'last30' && 'Last 30 Days'}
                  {date === 'expiring' && 'Expiring Soon (<30 days)'}
                  {date === 'expired' && 'Expired'}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="btn-secondary"
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Contracts Content */}
      <div className="contracts-content">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <h3>Loading Contracts</h3>
            <p>Fetching contract data from server...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="results-header">
              <span className="results-count">
                Showing {filteredContracts.length} of {contracts.length} contracts
              </span>
              <div className="results-sort">
                <span>Sorted by: Recent</span>
                <ChevronDown size={16} />
              </div>
            </div>

            {/* Contracts Grid/List */}
            {activeView === 'grid' ? (
              <div className="contracts-grid">
                {filteredContracts.map(renderContractCard)}
              </div>
            ) : (
              <div className="contracts-table-container">
                <table className="contracts-table">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th>Grantor</th>
                      <th>Total Amount</th>
                      <th>Progress</th>
                      <th>End Date</th>
                      <th>Days Left</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map(renderContractRow)}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {filteredContracts.length === 0 && contracts.length > 0 && (
              <div className="empty-results">
                <Search size={48} />
                <h3>No contracts found</h3>
                <p>Try adjusting your search or filters</p>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* No Contracts State */}
            {!loading && contracts.length === 0 && (
              <div className="empty-state">
                <FileText size={64} />
                <h3>No contracts yet</h3>
                <p>Upload your first contract to get started</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/upload')}
                >
                  <Upload size={20} />
                  <span>Upload First Contract</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ContractsListPage;