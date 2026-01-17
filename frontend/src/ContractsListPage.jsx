import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ContractsListPage.css';

function ContractsListPage() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter, dateFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      // CORRECTED: Using the full backend URL with port 4001
      const response = await fetch('http://localhost:4001/contracts/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('Contracts fetched successfully:', data.length, 'contracts');
      setContracts(data);
      setFilteredContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      // Show user-friendly error message
      alert('Failed to load contracts. Please ensure the backend server is running on port 4001.');
    } finally {
      setLoading(false);
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

  const calculateFundsReceived = (contract) => {
    const total = contract.total_amount || 0;
    return total * 0.5;
  };

  const calculateFundsRemaining = (contract) => {
    const total = contract.total_amount || 0;
    const received = calculateFundsReceived(contract);
    return total - received;
  };

  const getContractDisplayId = (contract) => {
    // Use investment_id, project_id, or grant_id if available
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.id}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'status-processed';
      case 'processing': return 'status-processing';
      case 'error': return 'status-error';
      default: return 'status-default';
    }
  };

  const handleRetry = () => {
    fetchContracts();
  };

  return (
    <div className="contracts-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1>All Contracts</h1>
          <span className="contracts-count">
            {loading ? 'Loading...' : `${filteredContracts.length} contracts`}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleRetry} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn-primary" onClick={() => navigate('/upload')}>
            + Upload New Contract
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, grantor, ID, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-buttons">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="processed">Processed</option>
            <option value="processing">Processing</option>
            <option value="error">Error</option>
          </select>
          
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
            disabled={loading}
          >
            <option value="all">All Dates</option>
            <option value="last30">Last 30 Days</option>
            <option value="expiring">Expiring Soon (&lt;30 days)</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="contracts-table-container">
        {loading ? (
          <div className="loading-table">
            <div className="spinner"></div>
            <p>Loading contracts from backend...</p>
            <small>Make sure the FastAPI server is running on port 4001</small>
          </div>
        ) : (
          <>
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Grantor</th>
                  <th>Total Amount</th>
                  <th>Funds Received</th>
                  <th>Funds Remaining</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days Remaining</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => {
                  const fundsReceived = calculateFundsReceived(contract);
                  const fundsRemaining = calculateFundsRemaining(contract);
                  const daysRemaining = getDaysRemaining(contract.end_date);
                  const displayId = getContractDisplayId(contract);
                  
                  return (
                    <tr key={contract.id}>
                      <td>
                        <div className="contract-cell">
                          <div className="contract-name">{contract.grant_name || contract.filename || 'Unnamed Contract'}</div>
                          <div className="contract-meta">
                            <span className="contract-id">ID: {displayId}</span>
                            {contract.contract_number && (
                              <span className="contract-number">#{contract.contract_number}</span>
                            )}
                          </div>
                          <div className="contract-filename">
                            <small>{contract.filename}</small>
                          </div>
                        </div>
                      </td>
                      <td className="grantor-cell">{contract.grantor || 'N/A'}</td>
                      <td className="amount-cell total-amount">{formatCurrency(contract.total_amount)}</td>
                      <td className="amount-cell funds-received">{formatCurrency(fundsReceived)}</td>
                      <td className="amount-cell funds-remaining">{formatCurrency(fundsRemaining)}</td>
                      <td>{formatDate(contract.start_date)}</td>
                      <td>{formatDate(contract.end_date)}</td>
                      <td>
                        <span className={`days-remaining ${daysRemaining === 'Expired' ? 'expired' : daysRemaining === 'Today' ? 'today' : ''}`}>
                          {daysRemaining}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(contract.status)}`}>
                          {contract.status || 'unknown'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-view"
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                            title="View contract details"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredContracts.length === 0 && contracts.length > 0 && (
              <div className="no-results-message">
                <p>No contracts match your search criteria. Try adjusting your filters.</p>
              </div>
            )}
          </>
        )}

        {!loading && contracts.length === 0 && (
          <div className="empty-table">
            <div className="empty-icon">📋</div>
            <h3>No contracts found</h3>
            <p>No contracts have been uploaded yet, or the backend server is not responding.</p>
            <div className="empty-actions">
              <button className="btn-primary" onClick={() => navigate('/upload')}>
                Upload Your First Contract
              </button>
              <button className="btn-secondary" onClick={handleRetry}>
                Retry Loading
              </button>
            </div>
            <div className="server-check">
              <p><strong>Server Check:</strong></p>
              <p>Make sure your FastAPI backend is running on port 4001.</p>
              <p>You can test by visiting: <a href="http://localhost:4001/contracts/" target="_blank" rel="noopener noreferrer">http://localhost:4001/contracts/</a></p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {!loading && filteredContracts.length > 0 && (
        <div className="stats-footer">
          <div className="stat-item">
            <span className="stat-label">Total Contracts</span>
            <span className="stat-value">{filteredContracts.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">
              {formatCurrency(filteredContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0))}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Contracts</span>
            <span className="stat-value">
              {filteredContracts.filter(c => c.status === 'processed').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Expiring Soon</span>
            <span className="stat-value">
              {filteredContracts.filter(c => {
                const days = getDaysRemaining(c.end_date);
                return days !== 'N/A' && days !== 'Expired' && days !== 'Today' && parseInt(days) <= 30;
              }).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractsListPage;