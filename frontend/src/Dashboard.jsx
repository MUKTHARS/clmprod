import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Building,
  ChevronRight,
  Upload,
  RefreshCw,
  BarChart3,
  Users,
  Target,
  ArrowRight,
  Eye,
  Download,
  MoreVertical,
  PieChart,
  Activity,
  ChevronDown,
  Filter,
  Search
} from 'lucide-react';
import './styles/Dashboard.css';

function Dashboard({ contracts, loading, refreshContracts }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGrants: 0,
    totalAmount: 0,
    activeContracts: 0,
    upcomingDeadlines: 0,
    fundsReceived: 0,
    fundsRemaining: 0,
    completionRate: 0,
    riskLevel: 'Low'
  });

  const [activeView, setActiveView] = useState('list'); // 'list' as default
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (contracts.length > 0) {
      calculateStats();
    } else {
      resetStats();
    }
  }, [contracts]);

  const resetStats = () => {
    setStats({
      totalGrants: 0,
      totalAmount: 0,
      activeContracts: 0,
      upcomingDeadlines: 0,
      fundsReceived: 0,
      fundsRemaining: 0,
      completionRate: 0,
      riskLevel: 'Low'
    });
  };

  const calculateStats = () => {
    let totalAmount = 0;
    let fundsReceived = 0;
    let fundsRemaining = 0;
    let upcomingDeadlines = 0;
    let highRiskCount = 0;
    const today = new Date();
    
    contracts.forEach(contract => {
      const amount = contract.total_amount || 0;
      totalAmount += amount;
      
      const received = amount * 0.5;
      fundsReceived += received;
      fundsRemaining += (amount - received);
      
      if (contract.end_date) {
        try {
          const endDate = new Date(contract.end_date);
          if (!isNaN(endDate.getTime())) {
            const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            if (daysDiff > 0 && daysDiff <= 30) {
              upcomingDeadlines++;
              if (daysDiff <= 7) highRiskCount++;
            }
          }
        } catch (e) {
          console.error('Error parsing date:', contract.end_date);
        }
      }
    });

    const completionRate = contracts.length > 0 
      ? Math.round((contracts.filter(c => c.status === 'processed').length / contracts.length) * 100)
      : 0;

    const riskLevel = highRiskCount > 3 ? 'High' : highRiskCount > 0 ? 'Medium' : 'Low';

    setStats({
      totalGrants: contracts.length,
      totalAmount,
      activeContracts: contracts.filter(c => c.status === 'processed').length,
      upcomingDeadlines,
      fundsReceived,
      fundsRemaining,
      completionRate,
      riskLevel
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

  const getDaysRemaining = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const today = new Date();
      const targetDate = new Date(dateString);
      if (isNaN(targetDate.getTime())) return 'Invalid date';
      
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
      return 'Invalid date';
    }
  };

  const getContractDisplayId = (contract) => {
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
        return <RefreshCw size={14} className="status-icon processing" />;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'processed';
      case 'processing': return 'processing';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const filteredContracts = contracts.filter(contract => 
    searchTerm === '' || 
    (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p className="header-subtitle">Overview of your grant contracts and analytics</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={refreshContracts}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/upload')}
          >
            <Upload size={18} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-container">
        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon">
              <FileText size={20} />
            </div>
            <div className="metric-info">
              <div className="metric-value">{stats.totalGrants}</div>
              <div className="metric-label">Total Contracts</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon">
              <DollarSign size={20} />
            </div>
            <div className="metric-info">
              <div className="metric-value">{formatCurrency(stats.totalAmount)}</div>
              <div className="metric-label">Total Value</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon">
              <CheckCircle size={20} />
            </div>
            <div className="metric-info">
              <div className="metric-value">{stats.activeContracts}</div>
              <div className="metric-label">Active</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <div className="metric-icon">
              <AlertCircle size={20} />
            </div>
            <div className="metric-info">
              <div className="metric-value">{stats.upcomingDeadlines}</div>
              <div className="metric-label">Deadlines</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Contracts Section */}
      <div className="recent-contracts">
        <div className="section-header">
          <div className="section-title">
            <h2>Recent Contracts</h2>
            <p className="section-subtitle">Latest contracts added to the system</p>
          </div>
          
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
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                <span className="view-icon">☰</span>
                List
              </button>
              <button 
                className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
                onClick={() => setActiveView('grid')}
              >
                <span className="view-icon">⏹️</span>
                Grid
              </button>
            </div>

            <button 
              className="btn-view-all"
              onClick={() => navigate('/contracts')}
            >
              <span>View All</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Contracts Content */}
        <div className="contracts-content">
          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spinner" />
              <p>Loading contracts...</p>
            </div>
          ) : filteredContracts.length > 0 ? (
            <>
              {activeView === 'list' ? (
                <div className="contracts-table-container">
                  <table className="contracts-table">
                    <thead>
                      <tr>
                        <th>Contract</th>
                        <th>Grantor</th>
                        <th>Amount</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.slice(0, 5).map((contract) => (
                        <tr key={contract.id} className="contract-row">
                          <td>
                            <div className="contract-info">
                              <div className="contract-icon-small">
                                <FileText size={16} />
                              </div>
                              <div>
                                <div className="contract-name">
                                  {contract.grant_name || contract.filename || 'Unnamed Contract'}
                                </div>
                                <div className="contract-id">
                                  ID: {getContractDisplayId(contract)}
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
                            <div className="amount-cell">
                              <DollarSign size={14} />
                              <span>{formatCurrency(contract.total_amount)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              <Calendar size={14} />
                              <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="status-cell">
                              {getStatusIcon(contract.status)}
                              <span className={`status-text ${getStatusColor(contract.status)}`}>
                                {contract.status}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="contracts-grid">
                  {filteredContracts.slice(0, 6).map((contract) => (
                    <div key={contract.id} className="contract-card">
                      <div className="card-header">
                        <div className="contract-status">
                          {getStatusIcon(contract.status)}
                          <span className={`status-text ${contract.status}`}>
                            {contract.status}
                          </span>
                        </div>
                        <button className="card-menu">
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      <div className="card-content">
                        <div className="contract-icon">
                          <FileText size={20} />
                        </div>
                        <h3 className="contract-name">
                          {contract.grant_name || contract.filename || 'Unnamed Contract'}
                        </h3>
                        <p className="contract-id">
                          ID: {getContractDisplayId(contract)}
                        </p>

                        <div className="contract-meta">
                          <div className="meta-item">
                            <Building size={14} />
                            <span>{contract.grantor || 'No grantor'}</span>
                          </div>
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span>{contract.start_date ? new Date(contract.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
                          </div>
                        </div>

                        <div className="contract-amount">
                          <DollarSign size={16} />
                          <span>{formatCurrency(contract.total_amount)}</span>
                        </div>

                        <div className="contract-timeline">
                          <div className="timeline-item">
                            <span className="timeline-label">Ends in</span>
                            <span className={`timeline-value ${getDaysColor(getDaysRemaining(contract.end_date))}`}>
                              {getDaysRemaining(contract.end_date)}
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
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
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
                  className="btn-primary"
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

      {/* Financial & Deadlines Summary */}
      <div className="summary-container">
        {/* Financial Summary */}
        <div className="summary-card">
          <div className="summary-header">
            <DollarSign size={20} />
            <h3>Financial Summary</h3>
          </div>
          <div className="financial-summary">
            <div className="financial-item">
              <span className="item-label">Total Value</span>
              <span className="item-value">{formatCurrency(stats.totalAmount)}</span>
            </div>
            <div className="financial-item">
              <span className="item-label">Funds Received</span>
              <span className="item-value received">{formatCurrency(stats.fundsReceived)}</span>
            </div>
            {/* <div className="financial-item">
              <span className="item-label">Funds Remaining</span>
              <span className="item-value remaining">{formatCurrency(stats.fundsRemaining)}</span>
            </div> */}
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${stats.totalAmount > 0 ? (stats.fundsReceived / stats.totalAmount * 100) : 0}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span>Progress: {stats.totalAmount > 0 ? Math.round((stats.fundsReceived / stats.totalAmount * 100)) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="summary-card">
          <div className="summary-header">
            <Calendar size={20} />
            <h3>Upcoming Deadlines</h3>
            <span className="deadline-count">{stats.upcomingDeadlines}</span>
          </div>
          
          {contracts.filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired')).length > 0 ? (
            <div className="deadlines-list">
              {contracts
                .filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired') && !getDaysRemaining(c.end_date).includes('Invalid'))
                .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
                .slice(0, 3)
                .map((contract) => (
                  <div key={contract.id} className="deadline-item">
                    <div className="deadline-info">
                      <h4>{contract.grant_name || 'Unnamed Grant'}</h4>
                      <div className="deadline-details">
                        <span className="detail">
                          <Building size={12} />
                          {contract.grantor || 'No grantor'}
                        </span>
                      </div>
                    </div>
                    <div className="deadline-right">
                      <span className={`deadline-days ${getDaysColor(getDaysRemaining(contract.end_date))}`}>
                        {getDaysRemaining(contract.end_date)}
                      </span>
                      <button 
                        className="btn-action-small"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-deadlines">
              <Calendar size={24} />
              <p>No upcoming deadlines</p>
            </div>
          )}
          
          {contracts.filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired')).length > 0 && (
            <button 
              className="btn-view-more"
              onClick={() => navigate('/contracts')}
            >
              <span>View All Deadlines</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/upload')}
          >
            <div className="action-icon">
              <Upload size={24} />
            </div>
            <div className="action-content">
              <h4>Upload Contract</h4>
              <p>Add new contracts for analysis</p>
            </div>
          </button>

          <button 
            className="action-card"
            onClick={() => navigate('/contracts')}
          >
            <div className="action-icon">
              <FileText size={24} />
            </div>
            <div className="action-content">
              <h4>View All Contracts</h4>
              <p>Browse your contracts library</p>
            </div>
          </button>

          <button className="action-card">
            <div className="action-icon">
              <BarChart3 size={24} />
            </div>
            <div className="action-content">
              <h4>Generate Report</h4>
              <p>Create analytics report</p>
            </div>
          </button>

          <button className="action-card">
            <div className="action-icon">
              <Users size={24} />
            </div>
            <div className="action-content">
              <h4>Team Access</h4>
              <p>Manage permissions</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;