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

function Dashboard({ contracts, loading, refreshContracts, user }) {
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

  const [activeView, setActiveView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [normalizedContracts, setNormalizedContracts] = useState([]);

  useEffect(() => {
    if (contracts && Array.isArray(contracts)) {
      const normalized = contracts
        .map((contract, index) => {
          return normalizeContractData(contract);
        })
        .filter(contract => contract !== null);
      
      setNormalizedContracts(normalized);
      calculateStats(normalized);
    } else {
      setNormalizedContracts([]);
      resetStats();
    }
  }, [contracts]);

  const normalizeContractData = (contract) => {
    if (!contract) return null;
    
    const contractId = contract.id || contract.contract_id || contract.contractId;
    
    if (!contractId) return null;
    
    const normalized = {
      id: contractId,
      filename: contract.filename || contract.Filename || 'Unnamed Contract',
      uploaded_at: contract.uploaded_at || contract.uploadedAt || contract.upload_date,
      status: contract.status || contract.Status || 'processed',
      investment_id: contract.investment_id || contract.investmentId,
      project_id: contract.project_id || contract.projectId,
      grant_id: contract.grant_id || contract.grantId,
      extracted_reference_ids: contract.extracted_reference_ids || [],
      comprehensive_data: contract.comprehensive_data || contract.comprehensiveData || null
    };
    
    const safeGet = (obj, prop, altProp) => {
      return obj[prop] || obj[altProp] || obj[prop?.toLowerCase?.()] || 
             obj[prop?.toUpperCase?.()] || null;
    };
    
    normalized.grant_name = safeGet(contract, 'grant_name', 'grantName') || 
                           safeGet(contract, 'filename', 'Filename') || 
                           'Unnamed Contract';
    
    normalized.grantor = safeGet(contract, 'grantor', 'Grantor') || 'Unknown Grantor';
    normalized.grantee = safeGet(contract, 'grantee', 'Grantee') || 'Unknown Grantee';
    normalized.total_amount = safeGet(contract, 'total_amount', 'totalAmount') || 
                             safeGet(contract, 'totalAmount', 'total_amount') || 
                             0;
    normalized.contract_number = safeGet(contract, 'contract_number', 'contractNumber');
    normalized.start_date = safeGet(contract, 'start_date', 'startDate');
    normalized.end_date = safeGet(contract, 'end_date', 'endDate');
    normalized.purpose = safeGet(contract, 'purpose', 'Purpose');
    
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
      
      // Store payment schedule data
      normalized.payment_schedule = financial.payment_schedule || financial.paymentSchedule;
    }
    
    if (!normalized.grant_name || normalized.grant_name === 'Unnamed Contract') {
      normalized.grant_name = normalized.filename || 'Unnamed Contract';
    }
    
    return normalized;
  };

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

  const calculateStats = (contractsData) => {
    let totalAmount = 0;
    let fundsReceived = 0;
    let fundsRemaining = 0;
    let upcomingDeadlines = 0;
    let highRiskCount = 0;
    const today = new Date();
    
    contractsData.forEach(contract => {
      const amount = contract.total_amount || 0;
      totalAmount += amount;
      
      // Calculate actual received amount from payment schedule
      let received = calculateReceivedAmount(contract);
      
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

    const completionRate = contractsData.length > 0 
      ? Math.round((contractsData.filter(c => c.status === 'processed').length / contractsData.length) * 100)
      : 0;

    const riskLevel = highRiskCount > 3 ? 'High' : highRiskCount > 0 ? 'Medium' : 'Low';

    setStats({
      totalGrants: contractsData.length,
      totalAmount,
      activeContracts: contractsData.filter(c => c.status === 'processed').length,
      upcomingDeadlines,
      fundsReceived,
      fundsRemaining,
      completionRate,
      riskLevel
    });
  };

  const calculateReceivedAmount = (contract) => {
    let received = 0;
    const today = new Date();
    
    // Check comprehensive data first
    if (contract.comprehensive_data) {
      const compData = contract.comprehensive_data;
      const paymentSchedule = compData.financial_details?.payment_schedule || 
                             compData.financialDetails?.payment_schedule;
      
      if (paymentSchedule) {
        // Check installments
        if (paymentSchedule.installments && Array.isArray(paymentSchedule.installments)) {
          paymentSchedule.installments.forEach(installment => {
            if (installment.due_date && installment.amount) {
              try {
                const dueDate = new Date(installment.due_date);
                if (!isNaN(dueDate.getTime()) && dueDate <= today) {
                  received += parseFloat(installment.amount) || 0;
                }
              } catch (e) {
                console.error('Error parsing installment date:', installment.due_date);
              }
            }
          });
        }
        
        // Check milestones
        if (paymentSchedule.milestones && Array.isArray(paymentSchedule.milestones)) {
          paymentSchedule.milestones.forEach(milestone => {
            if (milestone.due_date && milestone.amount) {
              try {
                const dueDate = new Date(milestone.due_date);
                if (!isNaN(dueDate.getTime()) && dueDate <= today) {
                  received += parseFloat(milestone.amount) || 0;
                }
              } catch (e) {
                console.error('Error parsing milestone date:', milestone.due_date);
              }
            }
          });
        }
      }
    }
    
    return received;
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

  const formatCurrencyWithDecimals = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
    if (!contract) return 'Unknown';
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.id || 'Unknown'}`;
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

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const filteredContracts = normalizedContracts.filter(contract => 
    searchTerm === '' || 
    (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderContractRow = (contract) => {
    if (!contract) return null;
    
    const totalAmount = contract.total_amount || 0;
    const fundsReceived = calculateReceivedAmount(contract);
    const progressPercentage = totalAmount > 0 ? Math.round((fundsReceived / totalAmount) * 100) : 0;
    
    return (
      <tr key={contract.id} className="contract-row">
        <td>
          <div className="contract-info">
            <div className="contract-name-only">
              {contract.grant_name || contract.filename || 'Unnamed Grant'}
            </div>
          </div>
        </td>
        <td>
          <div className="contract-id-only">
            {getContractDisplayId(contract)}
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
            <span>{contract.uploaded_at ? new Date(contract.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
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
          <div className="progress-cell">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${progressPercentage}%`,
                    backgroundColor: getProgressColor(progressPercentage)
                  }}
                ></div>
              </div>
              <div className="progress-text">
                {progressPercentage}%
              </div>
            </div>
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
            <button 
              className="btn-action"
              title="Download"
              onClick={() => {}}
            >
              <Download size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderContractCard = (contract) => {
    if (!contract) return null;
    
    const totalAmount = contract.total_amount || 0;
    const fundsReceived = calculateReceivedAmount(contract);
    const progressPercentage = totalAmount > 0 ? Math.round((fundsReceived / totalAmount) * 100) : 0;
    
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
            {contract.grant_name || contract.filename || 'Unnamed Grant'}
          </h3>
          <p className="contract-id-small">
            ID: {getContractDisplayId(contract)}
          </p>

          <div className="contract-meta">
            <div className="meta-item">
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="meta-item">
              <span>{contract.uploaded_at ? new Date(contract.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
            </div>
          </div>

          <div className="contract-amount">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>

          <div className="contract-progress">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${progressPercentage}%`,
                    backgroundColor: getProgressColor(progressPercentage)
                  }}
                ></div>
              </div>
              <div className="progress-text">
                <span>Progress: {progressPercentage}%</span>
              </div>
            </div>
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
    <div className="dashboard">
      <div className="metrics-container">
        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{stats.totalGrants}</div>
              <div className="metric-label">Total Grants</div>
            </div>
          </div>
        </div>

        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{formatCurrency(stats.totalAmount)}</div>
              <div className="metric-label">Total Value</div>
            </div>
          </div>
        </div>

        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{stats.activeContracts}</div>
              <div className="metric-label">Active</div>
            </div>
          </div>
        </div>

        <div className="metric-card-tall">
          <div className="metric-content">
            <div className="metric-info">
              <div className="metric-value">{stats.upcomingDeadlines}</div>
              <div className="metric-label">Deadlines</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Grants Section */}
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

            <button 
              className="btn-view-all"
              onClick={() => navigate('/contracts')}
            >
              View All
            </button>
          </div>
        </div>

        {/* Grants Content */}
        <div className="contracts-content">
          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spinner" />
              <p>Loading grants...</p>
            </div>
          ) : filteredContracts.length > 0 ? (
            <>
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
                        <th className="table-header-large">Progress</th>
                        <th className="table-header-large">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.slice(0, 5).map(renderContractRow)}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="contracts-grid">
                  {filteredContracts.slice(0, 6).map(renderContractCard)}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No grants found</h3>
              <p>{searchTerm ? 'Try adjusting your search' : 'Upload your first grant to get started'}</p>
              {!searchTerm && (
                <button 
                  className="btn-upload-main"
                  onClick={() => navigate('/upload')}
                >
                  <Upload size={20} />
                  Upload First Grant
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Financial & Deadlines Summary */}
      <div className="summary-container">
        <div className="summary-card">
          <div className="summary-header">
            <h3 className="summary-title-large">Financial Summary</h3>
          </div>
          <div className="financial-summary">
            {normalizedContracts.slice(0, 3).map((contract) => {
              const totalAmount = contract.total_amount || 0;
              const fundsReceived = calculateReceivedAmount(contract);
              const progressPercentage = totalAmount > 0 ? Math.round((fundsReceived / totalAmount) * 100) : 0;
              
              if (!contract.id) return null;
              
              return (
                <div key={contract.id} className="contract-financial-item">
                  <div className="contract-financial-header">
                    <h4 className="contract-financial-name">
                      {contract.grant_name || contract.filename || 'Unnamed Grant'}
                    </h4>
                    <div className="contract-financial-id">
                      {getContractDisplayId(contract)}
                    </div>
                  </div>
                  
                  <div className="contract-financial-details">
                    <div className="financial-item">
                      <span className="item-label">Total Value</span>
                      <span className="item-value total">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="financial-item">
                      <span className="item-label">Funds Received</span>
                      <span className="item-value received">{formatCurrencyWithDecimals(fundsReceived)}</span>
                    </div>
                  </div>
                  
                  <div className="progress-container contract-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${progressPercentage}%`,
                          backgroundColor: getProgressColor(progressPercentage)
                        }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      <span>Progress: {progressPercentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="overall-progress">
              <div className="financial-item">
                <span className="item-label">Total Value (All)</span>
                <span className="item-value total">{formatCurrency(stats.totalAmount)}</span>
              </div>
              <div className="financial-item">
                <span className="item-label">Funds Received (All)</span>
                <span className="item-value received">{formatCurrencyWithDecimals(stats.fundsReceived)}</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${stats.totalAmount > 0 ? Math.round((stats.fundsReceived / stats.totalAmount * 100)) : 0}%`,
                      backgroundColor: getProgressColor(stats.totalAmount > 0 ? Math.round((stats.fundsReceived / stats.totalAmount * 100)) : 0)
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  <span>Overall Progress: {stats.totalAmount > 0 ? Math.round((stats.fundsReceived / stats.totalAmount * 100)) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-header">
            <h3 className="summary-title-large">Upcoming Deadlines</h3>
            <span className="deadline-count">{stats.upcomingDeadlines}</span>
          </div>
          
          {normalizedContracts.filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired')).length > 0 ? (
            <div className="deadlines-list">
              {normalizedContracts
                .filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired') && !getDaysRemaining(c.end_date).includes('Invalid'))
                .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
                .slice(0, 3)
                .map((contract) => (
                  <div key={contract.id} className="deadline-item">
                    <div className="deadline-info">
                      <h4 className="deadline-title">{contract.grant_name || 'Unnamed Grant'}</h4>
                      <div className="deadline-details">
                        <span className="detail">
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
              <p>No upcoming deadlines</p>
            </div>
          )}
          
          {normalizedContracts.filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired')).length > 0 && (
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
    </div>
  );
}

export default Dashboard;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   FileText,
//   DollarSign,
//   TrendingUp,
//   CheckCircle,
//   Clock,
//   AlertCircle,
//   Calendar,
//   Building,
//   ChevronRight,
//   Upload,
//   RefreshCw,
//   BarChart3,
//   Users,
//   Target,
//   ArrowRight,
//   Eye,
//   Download,
//   MoreVertical,
//   PieChart,
//   Activity,
//   ChevronDown,
//   Filter,
//   Search
// } from 'lucide-react';
// import './styles/Dashboard.css';

// function Dashboard({ contracts, loading, refreshContracts, user }) {
//   const navigate = useNavigate();
//   const [stats, setStats] = useState({
//     totalGrants: 0,
//     totalAmount: 0,
//     activeContracts: 0,
//     upcomingDeadlines: 0,
//     fundsReceived: 0,
//     fundsRemaining: 0,
//     completionRate: 0,
//     riskLevel: 'Low'
//   });

//   const [activeView, setActiveView] = useState('list');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [normalizedContracts, setNormalizedContracts] = useState([]);

//   useEffect(() => {
//     if (contracts && Array.isArray(contracts)) {
//       const normalized = contracts
//         .map((contract, index) => {
//           return normalizeContractData(contract);
//         })
//         .filter(contract => contract !== null);
      
//       setNormalizedContracts(normalized);
//       calculateStats(normalized);
//     } else {
//       setNormalizedContracts([]);
//       resetStats();
//     }
//   }, [contracts]);

//   const normalizeContractData = (contract) => {
//     if (!contract) return null;
    
//     const contractId = contract.id || contract.contract_id || contract.contractId;
    
//     if (!contractId) return null;
    
//     const normalized = {
//       id: contractId,
//       filename: contract.filename || contract.Filename || 'Unnamed Contract',
//       uploaded_at: contract.uploaded_at || contract.uploadedAt || contract.upload_date,
//       status: contract.status || contract.Status || 'processed',
//       investment_id: contract.investment_id || contract.investmentId,
//       project_id: contract.project_id || contract.projectId,
//       grant_id: contract.grant_id || contract.grantId,
//       extracted_reference_ids: contract.extracted_reference_ids || [],
//       comprehensive_data: contract.comprehensive_data || contract.comprehensiveData || null
//     };
    
//     const safeGet = (obj, prop, altProp) => {
//       return obj[prop] || obj[altProp] || obj[prop?.toLowerCase?.()] || 
//              obj[prop?.toUpperCase?.()] || null;
//     };
    
//     normalized.grant_name = safeGet(contract, 'grant_name', 'grantName') || 
//                            safeGet(contract, 'filename', 'Filename') || 
//                            'Unnamed Contract';
    
//     normalized.grantor = safeGet(contract, 'grantor', 'Grantor') || 'Unknown Grantor';
//     normalized.grantee = safeGet(contract, 'grantee', 'Grantee') || 'Unknown Grantee';
//     normalized.total_amount = safeGet(contract, 'total_amount', 'totalAmount') || 
//                              safeGet(contract, 'totalAmount', 'total_amount') || 
//                              0;
//     normalized.contract_number = safeGet(contract, 'contract_number', 'contractNumber');
//     normalized.start_date = safeGet(contract, 'start_date', 'startDate');
//     normalized.end_date = safeGet(contract, 'end_date', 'endDate');
//     normalized.purpose = safeGet(contract, 'purpose', 'Purpose');
    
//     if (normalized.comprehensive_data && typeof normalized.comprehensive_data === 'object') {
//       const compData = normalized.comprehensive_data;
//       const contractDetails = compData.contract_details || compData.contractDetails || {};
//       const parties = compData.parties || compData.Parties || {};
//       const financial = compData.financial_details || compData.financialDetails || {};
      
//       normalized.grant_name = contractDetails.grant_name || 
//                              contractDetails.grantName || 
//                              normalized.grant_name;
      
//       normalized.grantor = parties.grantor?.organization_name || 
//                           parties.grantor?.organizationName || 
//                           normalized.grantor;
      
//       normalized.grantee = parties.grantee?.organization_name || 
//                           parties.grantee?.organizationName || 
//                           normalized.grantee;
      
//       normalized.total_amount = financial.total_grant_amount || 
//                                financial.totalGrantAmount || 
//                                normalized.total_amount;
//     }
    
//     if (!normalized.grant_name || normalized.grant_name === 'Unnamed Contract') {
//       normalized.grant_name = normalized.filename || 'Unnamed Contract';
//     }
    
//     return normalized;
//   };

//   const resetStats = () => {
//     setStats({
//       totalGrants: 0,
//       totalAmount: 0,
//       activeContracts: 0,
//       upcomingDeadlines: 0,
//       fundsReceived: 0,
//       fundsRemaining: 0,
//       completionRate: 0,
//       riskLevel: 'Low'
//     });
//   };

//   const calculateStats = (contractsData) => {
//     let totalAmount = 0;
//     let fundsReceived = 0;
//     let fundsRemaining = 0;
//     let upcomingDeadlines = 0;
//     let highRiskCount = 0;
//     const today = new Date();
    
//     contractsData.forEach(contract => {
//       const amount = contract.total_amount || 0;
//       totalAmount += amount;
      
//       // Fixed: Use actual received amount from payment schedule if available
//       let received = 0;
//       if (contract.payment_schedule && typeof contract.payment_schedule === 'object') {
//         // Try to extract paid amounts from payment schedule
//         const payments = Object.values(contract.payment_schedule);
//         received = payments.reduce((sum, payment) => {
//           if (payment && payment.paid === true && payment.amount) {
//             return sum + (parseFloat(payment.amount) || 0);
//           }
//           return sum;
//         }, 0);
//       } else {
//         // Fallback to 50% if no payment schedule
//         received = amount * 0.5;
//       }
      
//       fundsReceived += received;
//       fundsRemaining += (amount - received);
      
//       if (contract.end_date) {
//         try {
//           const endDate = new Date(contract.end_date);
//           if (!isNaN(endDate.getTime())) {
//             const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
//             if (daysDiff > 0 && daysDiff <= 30) {
//               upcomingDeadlines++;
//               if (daysDiff <= 7) highRiskCount++;
//             }
//           }
//         } catch (e) {
//           console.error('Error parsing date:', contract.end_date);
//         }
//       }
//     });

//     const completionRate = contractsData.length > 0 
//       ? Math.round((contractsData.filter(c => c.status === 'processed').length / contractsData.length) * 100)
//       : 0;

//     const riskLevel = highRiskCount > 3 ? 'High' : highRiskCount > 0 ? 'Medium' : 'Low';

//     setStats({
//       totalGrants: contractsData.length,
//       totalAmount,
//       activeContracts: contractsData.filter(c => c.status === 'processed').length,
//       upcomingDeadlines,
//       fundsReceived,
//       fundsRemaining,
//       completionRate,
//       riskLevel
//     });
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

//   const formatCurrencyWithDecimals = (amount) => {
//     if (!amount && amount !== 0) return '-';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(amount);
//   };

//   const getDaysRemaining = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       const today = new Date();
//       const targetDate = new Date(dateString);
//       if (isNaN(targetDate.getTime())) return 'Invalid date';
      
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
//       return 'Invalid date';
//     }
//   };

//   const getContractDisplayId = (contract) => {
//     if (!contract) return 'Unknown';
//     if (contract.investment_id) return `INV-${contract.investment_id}`;
//     if (contract.project_id) return `PRJ-${contract.project_id}`;
//     if (contract.grant_id) return `GRANT-${contract.grant_id}`;
//     return `CONT-${contract.id || 'Unknown'}`;
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'processed':
//         return <CheckCircle size={14} className="status-icon processed" />;
//       case 'processing':
//         return <RefreshCw size={14} className="status-icon processing" />;
//       case 'error':
//         return <AlertCircle size={14} className="status-icon error" />;
//       default:
//         return <Clock size={14} className="status-icon default" />;
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

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'processed': return 'processed';
//       case 'processing': return 'processing';
//       case 'error': return 'error';
//       default: return 'default';
//     }
//   };

//   const getProgressColor = (percentage) => {
//     if (percentage >= 80) return '#22c55e';
//     if (percentage >= 50) return '#f59e0b';
//     return '#ef4444';
//   };

//   const filteredContracts = normalizedContracts.filter(contract => 
//     searchTerm === '' || 
//     (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
//     (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
//     (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

// const renderContractRow = (contract) => {
//   if (!contract) return null;
  
//   return (
//     <tr key={contract.id} className="contract-row">
//       <td>
//         <div className="contract-info">
//           <div className="contract-name-only">
//             {contract.grant_name || contract.filename || 'Unnamed Grant'}
//           </div>
//         </div>
//       </td>
//       <td>
//         <div className="contract-id-only">
//           {getContractDisplayId(contract)}
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
//           <span>{contract.uploaded_at ? new Date(contract.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
//         </div>
//       </td>
//       <td>
//         <div className="date-cell">
//           <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
//         </div>
//       </td>
//       <td>
//         <div className="status-cell">
//           {getStatusIcon(contract.status)}
//           <span className={`status-text ${getStatusColor(contract.status)}`}>
//             {contract.status || 'unknown'}
//           </span>
//         </div>
//       </td>
//       <td>
//       <td>
//   <div className="action-buttons">
//     <button 
//       className="btn-action"
//       onClick={() => navigate(`/contracts/${contract.id}`)}
//       title="View details"
//     >
//       <Eye size={16} />
//     </button>
//     <button 
//       className="btn-action"
//       title="Download"
//       onClick={() => {}}
//     >
//       <Download size={16} />
//     </button>
    
//   </div>
// </td>
//       </td>
//     </tr>
//   );
// };

//   const renderContractCard = (contract) => {
//     if (!contract) return null;
    
//     return (
//       <div key={contract.id} className="contract-card">
//         <div className="card-header">
//           <div className="contract-status">
//             {getStatusIcon(contract.status)}
//             <span className={`status-text ${contract.status}`}>
//               {contract.status || 'unknown'}
//             </span>
//           </div>
//           {/* <button className="card-menu">
//             <MoreVertical size={16} />
//           </button> */}
//         </div>

//         <div className="card-content">
//           <h3 className="contract-name-small">
//             {contract.grant_name || contract.filename || 'Unnamed Grant'}
//           </h3>
//           <p className="contract-id-small">
//             ID: {getContractDisplayId(contract)}
//           </p>

//           <div className="contract-meta">
//             <div className="meta-item">
//               <span>{contract.grantor || 'No grantor'}</span>
//             </div>
//             <div className="meta-item">
//               <span>{contract.uploaded_at ? new Date(contract.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
//             </div>
//           </div>

//           <div className="contract-amount">
//             <span>{formatCurrency(contract.total_amount)}</span>
//           </div>

//           <div className="contract-timeline">
//             <div className="timeline-item">
//               <span className="timeline-label">Ends in</span>
//               <span className={`timeline-value ${getDaysColor(getDaysRemaining(contract.end_date))}`}>
//                 {getDaysRemaining(contract.end_date)}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="card-footer">
//           <div className="action-buttons">
//             <button 
//               className="btn-action"
//               onClick={() => navigate(`/contracts/${contract.id}`)}
//               title="View details"
//             >
//               <Eye size={16} />
//             </button>
//             <button className="btn-action" title="Download">
//               <Download size={16} />
//             </button>
//             <button className="btn-action" title="More">
//               <MoreVertical size={16} />
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="dashboard">
      
//       <div className="metrics-container">
//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{stats.totalGrants}</div>
//               <div className="metric-label">Total Grants</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{formatCurrency(stats.totalAmount)}</div>
//               <div className="metric-label">Total Value</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{stats.activeContracts}</div>
//               <div className="metric-label">Active</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card-tall">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{stats.upcomingDeadlines}</div>
//               <div className="metric-label">Deadlines</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Recent Grants Section */}
//       <div className="recent-contracts">
//         {/* <div className="section-header">
//           <h2 className="section-title-large">Recent Grants</h2>
//         </div> */}

//         {/* Controls with search on left, buttons on right */}
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

//             <button 
//               className="btn-view-all"
//               onClick={() => navigate('/contracts')}
//             >
//               View All
//             </button>
//           </div>
//         </div>

//         {/* Grants Content */}
//         <div className="contracts-content">
//           {loading ? (
//             <div className="loading-state">
//               <RefreshCw className="spinner" />
//               <p>Loading grants...</p>
//             </div>
//           ) : filteredContracts.length > 0 ? (
//             <>
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
//                       {filteredContracts.slice(0, 5).map(renderContractRow)}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="contracts-grid">
//                   {filteredContracts.slice(0, 6).map(renderContractCard)}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="empty-state">
//               <FileText size={48} />
//               <h3>No grants found</h3>
//               <p>{searchTerm ? 'Try adjusting your search' : 'Upload your first grant to get started'}</p>
//               {!searchTerm && (
//                 <button 
//                   className="btn-upload-main"
//                   onClick={() => navigate('/upload')}
//                 >
//                   <Upload size={20} />
//                   Upload First Grant
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Financial & Deadlines Summary */}
//       <div className="summary-container">
//         <div className="summary-card">
//           <div className="summary-header">
//             <h3 className="summary-title-large">Financial Summary</h3>
//           </div>
//           <div className="financial-summary">
//             {normalizedContracts.slice(0, 3).map((contract) => {
//               const totalAmount = contract.total_amount || 0;
              
//               // Fixed: Get actual received amount from payment schedule
//               let fundsReceived = 0;
//               if (contract.payment_schedule && typeof contract.payment_schedule === 'object') {
//                 const payments = Object.values(contract.payment_schedule);
//                 fundsReceived = payments.reduce((sum, payment) => {
//                   if (payment && payment.paid === true && payment.amount) {
//                     return sum + (parseFloat(payment.amount) || 0);
//                   }
//                   return sum;
//                 }, 0);
//               } else {
//                 fundsReceived = totalAmount * 0.5; // Fallback
//               }
              
//               const progressPercentage = totalAmount > 0 ? Math.round((fundsReceived / totalAmount) * 100) : 0;
              
//               if (!contract.id) return null;
              
//               return (
//                 <div key={contract.id} className="contract-financial-item">
//                   <div className="contract-financial-header">
//                     <h4 className="contract-financial-name">
//                       {contract.grant_name || contract.filename || 'Unnamed Grant'}
//                     </h4>
//                     <div className="contract-financial-id">
//                       {getContractDisplayId(contract)}
//                     </div>
//                   </div>
                  
//                   <div className="contract-financial-details">
//                     <div className="financial-item">
//                       <span className="item-label">Total Value</span>
//                       <span className="item-value total">{formatCurrency(totalAmount)}</span>
//                     </div>
//                     <div className="financial-item">
//                       <span className="item-label">Funds Received</span>
//                       <span className="item-value received">{formatCurrencyWithDecimals(fundsReceived)}</span>
//                     </div>
//                   </div>
                  
//                   <div className="progress-container contract-progress">
//                     <div className="progress-bar">
//                       <div 
//                         className="progress-fill"
//                         style={{ 
//                           width: `${progressPercentage}%`,
//                           backgroundColor: getProgressColor(progressPercentage)
//                         }}
//                       ></div>
//                     </div>
//                     <div className="progress-text">
//                       <span>Progress: {progressPercentage}%</span>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
            
//             <div className="overall-progress">
//               <div className="financial-item">
//                 <span className="item-label">Total Value (All)</span>
//                 <span className="item-value total">{formatCurrency(stats.totalAmount)}</span>
//               </div>
//               <div className="progress-container">
//                 <div className="progress-bar">
//                   <div 
//                     className="progress-fill"
//                     style={{ width: `${stats.totalAmount > 0 ? Math.round((stats.fundsReceived / stats.totalAmount * 100)) : 0}%` }}
//                   ></div>
//                 </div>
//                 <div className="progress-text">
//                   <span>Overall Progress: {stats.totalAmount > 0 ? Math.round((stats.fundsReceived / stats.totalAmount * 100)) : 0}%</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="summary-card">
//           <div className="summary-header">
//             <h3 className="summary-title-large">Upcoming Deadlines</h3>
//             <span className="deadline-count">{stats.upcomingDeadlines}</span>
//           </div>
          
//           {normalizedContracts.filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired')).length > 0 ? (
//             <div className="deadlines-list">
//               {normalizedContracts
//                 .filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired') && !getDaysRemaining(c.end_date).includes('Invalid'))
//                 .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
//                 .slice(0, 3)
//                 .map((contract) => (
//                   <div key={contract.id} className="deadline-item">
//                     <div className="deadline-info">
//                       <h4 className="deadline-title">{contract.grant_name || 'Unnamed Grant'}</h4>
//                       <div className="deadline-details">
//                         <span className="detail">
//                           {contract.grantor || 'No grantor'}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="deadline-right">
//                       <span className={`deadline-days ${getDaysColor(getDaysRemaining(contract.end_date))}`}>
//                         {getDaysRemaining(contract.end_date)}
//                       </span>
//                       <button 
//                         className="btn-action-small"
//                         onClick={() => navigate(`/contracts/${contract.id}`)}
//                       >
//                         <ChevronRight size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           ) : (
//             <div className="empty-deadlines">
//               <p>No upcoming deadlines</p>
//             </div>
//           )}
          
//           {normalizedContracts.filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired')).length > 0 && (
//             <button 
//               className="btn-view-more"
//               onClick={() => navigate('/contracts')}
//             >
//               <span>View All Deadlines</span>
//               <ArrowRight size={16} />
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;