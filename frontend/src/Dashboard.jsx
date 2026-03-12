import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileArchive,
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
import API_CONFIG from './config';

import './styles/Dashboard.css';
import { Link } from 'react-router-dom';

function Dashboard({ contracts: propContracts, loading: propLoading, refreshContracts, user }) {
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
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  
const getTileVariantClass = (variant) => {
  const variantMap = {
    // Project Manager variants
    'grants-action': 'dashtile-grants-action',
    'funds-risk': 'dashtile-funds-risk',
    'upcoming': 'dashtile-upcoming',
    'pending': 'dashtile-pending',
    'portfolio': 'dashtile-portfolio',
    
    // Program Manager variants
    'active-grants': 'dashtile-active-grants',
    'pm-submissions': 'dashtile-pm-submissions',
    'submitted': 'dashtile-submitted',
    'portfolio-value': 'dashtile-portfolio-value',
    'risk-grants': 'dashtile-risk-grants',
    
    // Director variants
    'total-portfolio': 'dashtile-total-portfolio',
    'portfolio-total': 'dashtile-portfolio-total',
    'awaiting': 'dashtile-awaiting',
    'track-percent': 'dashtile-track-percent',
    'high-risk': 'dashtile-high-risk',
    
    // Default
    'default': 'dashtile-default'
  };
  
  return variantMap[variant] || 'dashtile-default';
};

  const Tile = ({ title, value, variant = 'default' }) => {
    const variantClass = getTileVariantClass(variant);
    
    return (
      <div className={`metric-card-tall ${variantClass}`}>
        <div className="metric-value">{value}</div>
        <div className="metric-title">{title}</div>
      </div>
    );
  };

  const renderTiles = () => {
    if (metricsLoading) {
      return <div>Loading dashboard...</div>;
    }

    if (!metrics || Object.keys(metrics).length === 0) {
      return null;
    }

    // Project Manager
    if (metrics.grants_requiring_action !== undefined) {
      return (
        <>
          <Tile title="Grants Requiring Action" value={metrics.grants_requiring_action} variant="grants-action" />
          <Tile title="Funds At Risk" value={formatCurrency(metrics.funds_at_risk)} variant="funds-risk" />
          <Tile title="Upcoming Submissions" value={metrics.upcoming_submissions} variant="upcoming" />
          <Tile title="Pending Approvals" value={metrics.pending_approvals} variant="pending" />
          <Tile title="Portfolio On Track" value={metrics.portfolio_on_track} variant="portfolio" />
        </>
      );
    }

    // Program Manager
    if (metrics.total_active_grants !== undefined) {
      return (
        <>
          <Tile title="Total Active Grants" value={metrics.total_active_grants} variant="active-grants" />
          <Tile title="Pending PM Submissions" value={metrics.pending_pm_submissions} variant="pm-submissions" />
          <Tile title="Submitted To Director" value={metrics.submitted_to_director} variant="submitted" />
          <Tile title="Total Portfolio Value" value={formatCurrency(metrics.total_portfolio_value)} variant="portfolio-value" />
          <Tile title="At Risk Grants" value={metrics.at_risk_grants} variant="risk-grants" />
        </>
      );
    }

    // Director
    if (metrics.total_portfolio !== undefined) {
      return (
        <>
          <Tile title="Total Portfolio" value={metrics.total_portfolio} variant="total-portfolio" />
          <Tile title="Total Portfolio Value" value={formatCurrency(metrics.total_portfolio_value)} variant="portfolio-total" />
          <Tile title="Awaiting Director Approval" value={metrics.awaiting_director_approval} variant="awaiting" />
          <Tile title="Portfolio On Track %" value={`${metrics.portfolio_on_track_percent}%`} variant="track-percent" />
          <Tile title="High Risk Grants" value={metrics.high_risk_grants} variant="high-risk" />
        </>
      );
    }

    return null;
  };

  const [activeView, setActiveView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [normalizedContracts, setNormalizedContracts] = useState([]);

  // Fetch contracts from backend directly
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/contracts/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contracts");
      }

      const data = await response.json();
      
      // Normalize the contracts
      const normalized = Array.isArray(data) ? data
        .map((contract, index) => {
          return normalizeContractData(contract);
        })
        .filter(contract => contract !== null) : [];
      
      setContracts(normalized);
      setNormalizedContracts(normalized);
      calculateStats(normalized);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch fresh data from backend when component mounts
    fetchContracts();
    fetchDashboardMetrics();
  }, []); // Empty dependency array means this runs once on mount

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
      comprehensive_data: contract.comprehensive_data || contract.comprehensiveData || null,
      reporting_events_total: contract.reporting_events_total || 0,
      reporting_events_fully_approved: contract.reporting_events_fully_approved || 0,
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
      fundsRemaining += amount;

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

  const calculateProgress = (contract) => {
    const total = contract.reporting_events_total || 0;
    const approved = contract.reporting_events_fully_approved || 0;
    if (total === 0) return 0;
    return Math.round((approved / total) * 100);
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
    if (!contract) return 'Not Specified';
    // A real ID must contain at least one digit (fragments like "alidity", "oices" don't)
    const isRealId = (val) => val && /\d/.test(val);
    if (isRealId(contract.investment_id)) return contract.investment_id;
    if (isRealId(contract.project_id)) return contract.project_id;
    if (isRealId(contract.grant_id)) return contract.grant_id;
    return 'Not Specified';
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

  const getStatusColorForApproved = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':    return 'clp-approved';
      case 'draft':       return 'clp-draft';
      case 'under_review':return 'clp-under-review';
      case 'reviewed':    return 'clp-reviewed';
      case 'rejected':    return 'clp-rejected';
      case 'published':   return 'clp-published';
      case 'processed':   return 'clp-processed';
      case 'processing':  return 'clp-processing';
      case 'error':       return 'clp-error';
      default:            return 'clp-default';
    }
  };

  const getStatusIconForApproved = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':    return <CheckCircle size={14} className="clp-status-icon clp-approved" />;
      case 'draft':       return <FileText size={14} className="clp-status-icon clp-draft" />;
      case 'under_review':return <Clock size={14} className="clp-status-icon clp-under-review" />;
      case 'reviewed':    return <CheckCircle size={14} className="clp-status-icon clp-reviewed" />;
      case 'rejected':    return <AlertCircle size={14} className="clp-status-icon clp-rejected" />;
      case 'published':   return <CheckCircle size={14} className="clp-status-icon clp-published" />;
      case 'processed':   return <CheckCircle size={14} className="clp-status-icon clp-processed" />;
      case 'processing':  return <RefreshCw size={14} className="clp-status-icon clp-processing" />;
      case 'error':       return <AlertCircle size={14} className="clp-status-icon clp-error" />;
      default:            return <Clock size={14} className="clp-status-icon clp-default" />;
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      setMetricsLoading(true);
      const token = localStorage.getItem("token");
      console.log("Calling:", `${API_CONFIG.BASE_URL}/api/dashboard/metrics`);  
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/dashboard/metrics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard summary");
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const renderContractRow = (contract) => {
    if (!contract) return null;
    const displayId = getContractDisplayId(contract);
    return (
      <tr key={contract.id} className="clp-contract-row">
        <td>
          <div className="clp-contract-info">
            <div className="clp-contract-name">
              {contract.grant_name || contract.filename || 'Unnamed Grant'}
            </div>
          </div>
        </td>
        <td>
          <div className="clp-contract-id">{displayId}</div>
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
            <span>{contract.uploaded_at ? new Date(contract.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="clp-date-cell">
            <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="clp-status-cell">
            {getStatusIconForApproved(contract.status)}
            <span className={`clp-status-text ${getStatusColorForApproved(contract.status)}`}>
              {contract.status ? contract.status.replace('_', ' ') : 'unknown'}
            </span>
          </div>
        </td>
        <td>
          <div className="clp-action-buttons">
            <button className="clp-btn-action" onClick={() => navigate(`/app/contracts/${contract.id}`)} title="View details">
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
    if (!contract) return null;
    const displayId = getContractDisplayId(contract);
    const daysRemaining = getDaysRemaining(contract.end_date);
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
            {contract.grant_name || contract.filename || 'Unnamed Grant'}
          </h3>
          <p className="clp-contract-id-small">ID: {displayId}</p>

          <div className="clp-contract-meta">
            <div className="clp-meta-item">
              <span>{contract.grantor || 'No grantor'}</span>
            </div>
            <div className="clp-meta-item">
              <span>{contract.uploaded_at ? new Date(contract.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
            </div>
          </div>

          <div className="clp-contract-amount">
            <span>{formatCurrency(contract.total_amount)}</span>
          </div>

          <div className="clp-contract-timeline">
            <div className="clp-timeline-item">
              <span className="clp-timeline-label">Ends in</span>
              <span className={`clp-timeline-value ${getDaysColor(daysRemaining)}`}>
                {daysRemaining}
              </span>
            </div>
          </div>
        </div>

        <div className="clp-card-footer">
          <div className="clp-action-buttons">
            <button className="clp-btn-action" onClick={() => navigate(`/app/contracts/${contract.id}`)} title="View details">
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
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="metrics-container">
          {renderTiles()}
        </div>

        {/* Recent Grants Section */}
        <div className="recent-contracts">
          <div className="section-controlz">
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
                onClick={() => navigate('/app/contracts')}
              >
                View All
              </button>
            </div>
          </div>

          {/* Grants Content */}
          {/* <div className="contracts-content">
            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spinner" />
                <p>Loading grants...</p>
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
                        {filteredContracts.slice(0, 5).map(renderContractRow)}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="clp-contracts-grid">
                    {filteredContracts.slice(0, 6).map(renderContractCard)}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <FileText size={48} />
                <h3>No grants found</h3>
                <p>{searchTerm ? 'Try adjusting your search' : ''}</p>
                {!searchTerm && (
                  <button 
                    className="btn-upload-main"
                    onClick={() => navigate('/app/upload')}
                  >
                    <Upload size={16} strokeWidth={2} />
                    Upload Grant
                  </button>
                )}
              </div>
            )}
          </div> */}
        </div>

        {/* Financial & Deadlines Summary */}
        <div className="summary-container">
          <div className="summary-card">
            <div className="summary-header">
              <h3 className="summary-title-large">Financial Summary</h3>
            </div>
            <div className="financial-summary">
              {normalizedContracts.slice(0, 3).map((contract) => {
                const progressPercentage = calculateProgress(contract);
                
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
                        <span className="item-value total">{formatCurrency(contract.total_amount)}</span>
                      </div>
                      <div className="financial-item">
                        <span className="item-label">Reports Approved</span>
                        <span className="item-value received">{contract.reporting_events_fully_approved || 0} / {contract.reporting_events_total || 0}</span>
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
                {(() => {
                  const totalEvents = normalizedContracts.reduce((sum, c) => sum + (c.reporting_events_total || 0), 0);
                  const approvedEvents = normalizedContracts.reduce((sum, c) => sum + (c.reporting_events_fully_approved || 0), 0);
                  const overallPct = totalEvents > 0 ? Math.round((approvedEvents / totalEvents) * 100) : 0;
                  return (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${overallPct}%`,
                            backgroundColor: getProgressColor(overallPct)
                          }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        <span>Overall Progress: {overallPct}%</span>
                      </div>
                    </div>
                  );
                })()}
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
                          onClick={() => navigate(`/app/contracts/${contract.id}`)}
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
                onClick={() => navigate('/app/contracts')}
              >
                <span>View All Deadlines</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
