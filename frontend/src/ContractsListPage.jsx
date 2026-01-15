import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      const response = await fetch('/api/contracts/');
      const data = await response.json();
      setContracts(data);
      setFilteredContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
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
        (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
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
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString) return 'N/A';
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Expired';
  };

  const calculateFundsReceived = (contract) => {
    // For demo purposes, calculate based on milestones or use 50%
    const total = contract.total_amount || 0;
    return total * 0.5; // Assume 50% received
  };

  const calculateFundsRemaining = (contract) => {
    const total = contract.total_amount || 0;
    const received = calculateFundsReceived(contract);
    return total - received;
  };

  return (
    <div className="contracts-list-page">
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>All Contracts</h1>
          <span className="contracts-count">{filteredContracts.length} contracts</span>
        </div>
        <button className="btn-primary" onClick={() => navigate('/upload')}>
          + Upload New Contract
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search contracts..."
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
          >
            <option value="all">All Dates</option>
            <option value="last30">Last 30 Days</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="contracts-table-container">
        {loading ? (
          <div className="loading-table">
            <div className="spinner"></div>
            <p>Loading contracts...</p>
          </div>
        ) : (
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
                
                return (
                  <tr key={contract.id}>
                    <td>
                      <div className="contract-cell">
                        <div className="contract-name">{contract.grant_name || 'Unnamed Grant'}</div>
                        <div className="contract-meta">
                          <span>ID: {contract.id}</span>
                          <span>{contract.contract_number ? `#${contract.contract_number}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td>{contract.grantor || 'N/A'}</td>
                    <td className="amount-cell">{formatCurrency(contract.total_amount)}</td>
                    <td className="funds-received">{formatCurrency(fundsReceived)}</td>
                    <td className="funds-remaining">{formatCurrency(fundsRemaining)}</td>
                    <td>{formatDate(contract.start_date)}</td>
                    <td>{formatDate(contract.end_date)}</td>
                    <td>
                      <span className={`days-remaining ${daysRemaining.includes('Expired') ? 'expired' : ''}`}>
                        {daysRemaining}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${contract.status}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                        >
                          View
                        </button>
                        <button 
                          className="btn-download"
                          onClick={() => {/* Add download functionality */}}
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && filteredContracts.length === 0 && (
          <div className="empty-table">
            <div className="empty-icon">📋</div>
            <h3>No contracts found</h3>
            <p>Try adjusting your filters or upload a new contract.</p>
            <button className="btn-primary" onClick={() => navigate('/upload')}>
              Upload Your First Contract
            </button>
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
                return days !== 'N/A' && !days.includes('Expired') && parseInt(days) <= 30;
              }).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractsListPage;