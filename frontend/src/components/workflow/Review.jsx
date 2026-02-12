import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Building,
  DollarSign,
  ChevronRight,
  Eye,
  Download,
  MessageSquare,
  Flag,
  RefreshCw,
  Loader2,
  Check,
  X,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  ChevronDown
} from 'lucide-react';
import API_CONFIG from '../../config';
import './Review.css';
import './Workflow.css';

function Review() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('under_review');
  const [stats, setStats] = useState({
    total: 0,
    flagged: 0,
    totalValue: 0,
    newThisWeek: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchContractsForReview();
  }, [selectedStatus]);

  useEffect(() => {
    calculateStats();
  }, [contracts]);

  const fetchContractsForReview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/status/${selectedStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = contracts.length;
    const flagged = contracts.filter(c => c.comprehensive_data?.review_flags?.length > 0).length;
    const totalValue = contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = contracts.filter(c => new Date(c.uploaded_at) > oneWeekAgo).length;

    setStats({
      total,
      flagged,
      totalValue,
      newThisWeek
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
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getDaysSince = (dateString) => {
    if (!dateString) return 'N/A';
    const now = new Date();
    const then = new Date(dateString);
    const diffTime = Math.abs(now - then);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getContractDisplayId = (contract) => {
    if (!contract) return 'Unknown';
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.id}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'under_review': return '#3b82f6'; // blue
      case 'reviewed': return '#f59e0b'; // amber
      case 'rejected': return '#ef4444'; // red
      case 'approved': return '#10b981'; // green
      case 'draft': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  const filteredContracts = contracts.filter(contract => 
    searchTerm === '' ||
    (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <Loader2 size={48} className="spinner" />
          <h3>Loading Review Contracts</h3>
          <p>Fetching contracts for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard review-dashboard">
      {/* Key Metrics - FIXED with pgmreview classes */}
     {/* Key Metrics - COMPACT DESIGN */}
<div className="pgmreview-metrics-compact">
  <div className="pgmreview-metric-card-compact">
    <div className="pgmreview-metric-content-compact">
      <div className="pgmreview-metric-info-compact">
        <div className="pgmreview-metric-value-compact">{stats.total}</div>
        <div className="pgmreview-metric-label-compact">Pending Review</div>
      </div>
    </div>
  </div>

  <div className="pgmreview-metric-card-compact">
    <div className="pgmreview-metric-content-compact">
      <div className="pgmreview-metric-info-compact">
        <div className="pgmreview-metric-value-compact">{formatCurrency(stats.totalValue)}</div>
        <div className="pgmreview-metric-label-compact">Total Value</div>
      </div>
    </div>
  </div>

  <div className="pgmreview-metric-card-compact">
    <div className="pgmreview-metric-content-compact">
      <div className="pgmreview-metric-info-compact">
        <div className="pgmreview-metric-value-compact">{stats.flagged}</div>
        <div className="pgmreview-metric-label-compact">With Flags</div>
      </div>
    </div>
  </div>

  <div className="pgmreview-metric-card-compact">
    <div className="pgmreview-metric-content-compact">
      <div className="pgmreview-metric-info-compact">
        <div className="pgmreview-metric-value-compact">{stats.newThisWeek}</div>
        <div className="pgmreview-metric-label-compact">New This Week</div>
      </div>
    </div>
  </div>
</div>

      {/* Contracts Section */}
      <div className="recent-contracts">
        {/* Controls */}
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
            <div className="review-controls-group">
              <div className="review-status-toggle">
                <button
                  className={`review-status-btn under-review ${selectedStatus === 'under_review' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('under_review')}
                >
                  Under Review
                </button>
                <button
                  className={`review-status-btn reviewed ${selectedStatus === 'reviewed' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('reviewed')}
                >
                  Reviewed
                </button>
                <button
                  className={`review-status-btn rejected ${selectedStatus === 'rejected' ? 'active' : ''}`}
                  onClick={() => setSelectedStatus('rejected')}
                >
                  Rejected
                </button>
              </div>
              
              <button 
                className="review-refresh-btn"
                onClick={fetchContractsForReview}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Contracts Content - FIXED with pgmreview classes */}
        <div className="contracts-content">
          {filteredContracts.length > 0 ? (
            <div className="pgmreview-contracts-grid">
              {filteredContracts.map((contract) => (
                <div key={contract.id} className="pgmreview-contract-card">
                  <div className="pgmreview-card-header">
                    <div className="pgmreview-contract-status">
                      <div 
                        className="pgmreview-status-indicator" 
                        style={{ backgroundColor: getStatusColor(contract.status) }}
                      />
                      <span className="pgmreview-status-text" style={{ color: getStatusColor(contract.status) }}>
                        {contract.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="pgmreview-card-meta">
                      <span className="pgmreview-meta-item">
                        <Clock size={12} />
                        {getDaysSince(contract.uploaded_at)}
                      </span>
                      {contract.comprehensive_data?.review_flags?.length > 0 && (
                        <span className="pgmreview-meta-item flagged">
                          <Flag size={12} />
                          {contract.comprehensive_data.review_flags.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pgmreview-card-content">
                    <div className="pgmreview-contract-icon">
                      <FileText size={20} />
                    </div>
                    <h3 className="pgmreview-contract-name">
                      {contract.grant_name || contract.filename || 'Unnamed Contract'}
                    </h3>
                    <p className="pgmreview-contract-id">
                      ID: {getContractDisplayId(contract)}
                      {contract.contract_number && (
                        <span className="pgmreview-contract-number"> • #{contract.contract_number}</span>
                      )}
                    </p>

                    <div className="pgmreview-contract-meta">
                      <div className="pgmreview-meta-item">
                        <Building size={12} />
                        <span>{contract.grantor || 'No grantor'}</span>
                      </div>
                      <div className="pgmreview-meta-item">
                        <DollarSign size={12} />
                        <span>{formatCurrency(contract.total_amount)}</span>
                      </div>
                    </div>

                    {contract.purpose && (
                      <div className="pgmreview-contract-purpose">
                        <p>{contract.purpose.length > 100 ? contract.purpose.substring(0, 100) + '...' : contract.purpose}</p>
                      </div>
                    )}
                  </div>

                  <div className="pgmreview-card-footer">
                    <button 
                      className="pgmreview-btn-view"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                    {contract.status === 'under_review' && (
                      <button 
                        className="pgmreview-btn-review"
                        onClick={() => navigate(`/review-contract/${contract.id}`)}
                      >
                        Start Review
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No grants found</h3>
              <p>{searchTerm ? 'Try adjusting your search' : `No contracts are currently ${selectedStatus.replace('_', ' ')}`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Review;

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Search,
//   Filter,
//   Calendar,
//   Clock,
//   AlertCircle,
//   CheckCircle,
//   FileText,
//   Building,
//   DollarSign,
//   ChevronRight,
//   Eye,
//   Download,
//   MessageSquare,
//   Flag,
//   RefreshCw,
//   Loader2,
//   Check,
//   X,
//   Users,
//   TrendingUp,
//   BarChart3,
//   Target,
//   ChevronDown
// } from 'lucide-react';
// import API_CONFIG from '../../config';
// import './Review.css';
// import './Workflow.css';

// function Review() {
//   const [contracts, setContracts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState('under_review');
//   const [stats, setStats] = useState({
//     total: 0,
//     flagged: 0,
//     totalValue: 0,
//     newThisWeek: 0
//   });
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchContractsForReview();
//   }, [selectedStatus]);

//   useEffect(() => {
//     calculateStats();
//   }, [contracts]);

//   const fetchContractsForReview = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/status/${selectedStatus}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setContracts(data || []);
//       }
//     } catch (error) {
//       console.error('Failed to fetch contracts:', error);
//       setContracts([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateStats = () => {
//     const total = contracts.length;
//     const flagged = contracts.filter(c => c.comprehensive_data?.review_flags?.length > 0).length;
//     const totalValue = contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
//     const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//     const newThisWeek = contracts.filter(c => new Date(c.uploaded_at) > oneWeekAgo).length;

//     setStats({
//       total,
//       flagged,
//       totalValue,
//       newThisWeek
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

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not specified';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric'
//       });
//     } catch (e) {
//       return dateString;
//     }
//   };

//   const getDaysSince = (dateString) => {
//     if (!dateString) return 'N/A';
//     const now = new Date();
//     const then = new Date(dateString);
//     const diffTime = Math.abs(now - then);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     if (diffDays === 0) return 'Today';
//     if (diffDays === 1) return 'Yesterday';
//     return `${diffDays} days ago`;
//   };

//   const getContractDisplayId = (contract) => {
//     if (!contract) return 'Unknown';
//     if (contract.investment_id) return `INV-${contract.investment_id}`;
//     if (contract.project_id) return `PRJ-${contract.project_id}`;
//     if (contract.grant_id) return `GRANT-${contract.grant_id}`;
//     return `CONT-${contract.id}`;
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'under_review': return '#3b82f6'; // blue
//       case 'reviewed': return '#f59e0b'; // amber
//       case 'rejected': return '#ef4444'; // red
//       case 'approved': return '#10b981'; // green
//       case 'draft': return '#6b7280'; // gray
//       default: return '#6b7280';
//     }
//   };

//   const filteredContracts = contracts.filter(contract => 
//     searchTerm === '' ||
//     (contract.grant_name && contract.grant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
//     (contract.grantor && contract.grantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
//     (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   if (loading) {
//     return (
//       <div className="dashboard">
//         <div className="loading-state">
//           <Loader2 size={48} className="spinner" />
//           <h3>Loading Review Contracts</h3>
//           <p>Fetching contracts for review...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="dashboard review-dashboard">
//       {/* Key Metrics - Same as Dashboard */}
//       <div className="metrics-container">
//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{stats.total}</div>
//               <div className="metric-label">Pending Review</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{formatCurrency(stats.totalValue)}</div>
//               <div className="metric-label">Total Value</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{stats.flagged}</div>
//               <div className="metric-label">With Flags</div>
//             </div>
//           </div>
//         </div>

//         <div className="metric-card">
//           <div className="metric-content">
//             <div className="metric-info">
//               <div className="metric-value">{stats.newThisWeek}</div>
//               <div className="metric-label">New This Week</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Contracts Section - Same as Dashboard */}
//       <div className="recent-contracts">
//         {/* <div className="section-header">
//           <h2>Contracts for Review</h2>
//           <p className="section-subtitle">Review and provide feedback on submitted contracts</p>
//         </div> */}

//         {/* Controls */}
//       {/* Controls */}
// <div className="section-controls">
//   <div className="search-box">
//     <Search size={16} />
//     <input
//       type="text"
//       placeholder="Search contracts..."
//       value={searchTerm}
//       onChange={(e) => setSearchTerm(e.target.value)}
//       className="search-input"
//     />
//   </div>
  
//   <div className="controls-right">
//     <div className="review-controls-group">
//       <div className="review-status-toggle">
//         <button
//           className={`review-status-btn under-review ${selectedStatus === 'under_review' ? 'active' : ''}`}
//           onClick={() => setSelectedStatus('under_review')}
//         >
//           Under Review
//         </button>
//         <button
//           className={`review-status-btn reviewed ${selectedStatus === 'reviewed' ? 'active' : ''}`}
//           onClick={() => setSelectedStatus('reviewed')}
//         >
//           Reviewed
//         </button>
//         <button
//           className={`review-status-btn rejected ${selectedStatus === 'rejected' ? 'active' : ''}`}
//           onClick={() => setSelectedStatus('rejected')}
//         >
//           Rejected
//         </button>
//       </div>
      
//       <button 
//         className="review-refresh-btn"
//         onClick={fetchContractsForReview}
//         disabled={loading}
//       >
//         <RefreshCw size={16} className={loading ? 'spinning' : ''} />
//         Refresh
//       </button>
//     </div>
//   </div>
// </div>

//         {/* Contracts Content */}
//         <div className="contracts-content">
//           {filteredContracts.length > 0 ? (
//             <div className="contracts-grid">
//               {filteredContracts.map((contract) => (
//                 <div key={contract.id} className="contract-card review-card">
//                   <div className="card-header">
//                     <div className="contract-status">
//                       <div 
//                         className="status-indicator" 
//                         style={{ backgroundColor: getStatusColor(contract.status) }}
//                       />
//                       <span className="status-text" style={{ color: getStatusColor(contract.status) }}>
//                         {contract.status.replace('_', ' ')}
//                       </span>
//                     </div>
//                     <div className="card-meta">
//                       <span className="meta-item">
//                         <Clock size={12} />
//                         {getDaysSince(contract.uploaded_at)}
//                       </span>
//                       {contract.comprehensive_data?.review_flags?.length > 0 && (
//                         <span className="meta-item flagged">
//                           <Flag size={12} />
//                           {contract.comprehensive_data.review_flags.length}
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   <div className="card-content">
//                     <div className="contract-icon">
//                       <FileText size={20} />
//                     </div>
//                     <h3 className="contract-name">
//                       {contract.grant_name || contract.filename || 'Unnamed Contract'}
//                     </h3>
//                     <p className="contract-id">
//                       ID: {getContractDisplayId(contract)}
//                       {contract.contract_number && (
//                         <span className="contract-number"> • #{contract.contract_number}</span>
//                       )}
//                     </p>

//                     <div className="contract-meta">
//                       <div className="meta-item">
//                         <Building size={12} />
//                         <span>{contract.grantor || 'No grantor'}</span>
//                       </div>
//                       <div className="meta-item">
//                         <DollarSign size={12} />
//                         <span>{formatCurrency(contract.total_amount)}</span>
//                       </div>
//                     </div>

//                     {contract.purpose && (
//                       <div className="contract-purpose">
//                         <p>{contract.purpose.length > 100 ? contract.purpose.substring(0, 100) + '...' : contract.purpose}</p>
//                       </div>
//                     )}
//                   </div>

//                   <div className="card-footer">
//                     <button 
//                       className="btn-view"
//                       onClick={() => navigate(`/contracts/${contract.id}`)}
//                     >
//                       <Eye size={14} />
//                       View Details
//                     </button>
//                     {contract.status === 'under_review' && (
//                       <button 
//                         className="btn-review"
//                         onClick={() => navigate(`/review-contract/${contract.id}`)}
//                       >
//                         Start Review
//                         <ChevronRight size={14} />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="empty-state">
//               <FileText size={48} />
//               <h3>No grants found</h3>
//               <p>{searchTerm ? 'Try adjusting your search' : `No contracts are currently ${selectedStatus.replace('_', ' ')}`}</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Review;
