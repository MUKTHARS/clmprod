import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ contracts, loading, refreshContracts }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGrants: 0,
    totalAmount: 0,
    activeContracts: 0,
    upcomingDeadlines: 0,
    fundsReceived: 0,
    fundsRemaining: 0
  });

  useEffect(() => {
    if (contracts.length > 0) {
      calculateStats();
    } else {
      setStats({
        totalGrants: 0,
        totalAmount: 0,
        activeContracts: 0,
        upcomingDeadlines: 0,
        fundsReceived: 0,
        fundsRemaining: 0
      });
    }
  }, [contracts]);

  const calculateStats = () => {
    let totalAmount = 0;
    let fundsReceived = 0;
    let fundsRemaining = 0;
    let upcomingDeadlines = 0;
    const today = new Date();
    
    contracts.forEach(contract => {
      const amount = contract.total_amount || 0;
      totalAmount += amount;
      
      // Calculate funds received (assuming 50% for demo)
      const received = amount * 0.5;
      fundsReceived += received;
      fundsRemaining += (amount - received);
      
      // Check upcoming deadlines (within 30 days)
      if (contract.end_date) {
        try {
          const endDate = new Date(contract.end_date);
          if (!isNaN(endDate.getTime())) {
            const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            if (daysDiff > 0 && daysDiff <= 30) {
              upcomingDeadlines++;
            }
          }
        } catch (e) {
          console.error('Error parsing date:', contract.end_date);
        }
      }
    });

    setStats({
      totalGrants: contracts.length,
      totalAmount,
      activeContracts: contracts.filter(c => c.status === 'processed').length,
      upcomingDeadlines,
      fundsReceived,
      fundsRemaining
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
      return diffDays > 0 ? `${diffDays} days` : 'Expired';
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Grant Contract Dashboard</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={refreshContracts}>
            ↻ Refresh
          </button>
          <button className="btn-primary" onClick={() => navigate('/upload')}>
            + Upload New Contract
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          {/* <div className="kpi-icon">📋</div> */}
          <div className="kpi-content">
            <h3>{stats.totalGrants}</h3>
            <p>Total Grants</p>
          </div>
        </div>
        
        <div className="kpi-card">
          {/* <div className="kpi-icon">💰</div> */}
          <div className="kpi-content">
            <h3>{formatCurrency(stats.totalAmount)}</h3>
            <p>Total Contract Value</p>
          </div>
        </div>
        
        <div className="kpi-card">
          {/* <div className="kpi-icon">📈</div> */}
          <div className="kpi-content">
            <h3>{formatCurrency(stats.fundsReceived)}</h3>
            <p>Funds Received</p>
          </div>
        </div>
        
        {/* <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <h3>{formatCurrency(stats.fundsRemaining)}</h3>
            <p>Funds Remaining</p>
          </div>
        </div> */}
        
        <div className="kpi-card">
          {/* <div className="kpi-icon">✅</div> */}
          <div className="kpi-content">
            <h3>{stats.activeContracts}</h3>
            <p>Active Contracts</p>
          </div>
        </div>
        
        <div className="kpi-card">
          {/* <div className="kpi-icon">⏰</div> */}
          <div className="kpi-content">
            <h3>{stats.upcomingDeadlines}</h3>
            <p>Upcoming Deadlines</p>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="contracts-table-section">
        <div className="section-header">
          <h2>Recent Contracts</h2>
          <div>
            <button className="btn-secondary" onClick={refreshContracts}>
              ↻ Refresh
            </button>
            <button className="btn-secondary" onClick={() => navigate('/contracts')}>
              View All Contracts
            </button>
          </div>
        </div>
        
        <div className="contracts-table">
          {loading ? (
            <div className="loading-table">
              <div className="spinner"></div>
              <p>Loading contracts...</p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Contract ID</th>
                    <th>Grant Name</th>
                    <th>Grantor</th>
                    <th>Total Amount</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.slice(0, 5).map((contract) => (
                    <tr key={contract.id}>
                      <td>#{contract.id}</td>
                      <td className="grant-name">{contract.grant_name || 'Unnamed Grant'}</td>
                      <td>{contract.grantor || 'Not specified'}</td>
                      <td className="amount">{formatCurrency(contract.total_amount)}</td>
                      <td>{contract.start_date || 'N/A'}</td>
                      <td>{contract.end_date || 'N/A'}</td>
                      <td>
                        <span className={`days-remaining ${getDaysRemaining(contract.end_date).includes('Expired') ? 'expired' : ''}`}>
                          {getDaysRemaining(contract.end_date)}
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
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contracts.length === 0 && (
                <div className="empty-table">
                  <p>No contracts available. Upload your first contract to get started.</p>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/upload')}
                  >
                    Upload First Contract
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {contracts.length > 0 && (
        <div className="deadlines-section">
          <h2>Upcoming Deadlines</h2>
          <div className="deadlines-grid">
            {contracts
              .filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired') && !getDaysRemaining(c.end_date).includes('Invalid'))
              .sort((a, b) => {
                try {
                  return new Date(a.end_date) - new Date(b.end_date);
                } catch (e) {
                  return 0;
                }
              })
              .slice(0, 3)
              .map((contract) => (
                <div key={contract.id} className="deadline-card">
                  <div className="deadline-header">
                    <h4>{contract.grant_name || 'Unnamed Grant'}</h4>
                    <span className="days-count">{getDaysRemaining(contract.end_date)}</span>
                  </div>
                  <p><strong>Grantor:</strong> {contract.grantor || 'Not specified'}</p>
                  <p><strong>End Date:</strong> {contract.end_date || 'N/A'}</p>
                  <p><strong>Amount:</strong> {formatCurrency(contract.total_amount)}</p>
                  <button 
                    className="btn-small"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    View Details
                  </button>
                </div>
              ))}
          </div>
          {contracts.filter(c => c.end_date && !getDaysRemaining(c.end_date).includes('Expired')).length === 0 && (
            <p className="no-deadlines">No upcoming deadlines</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// function Dashboard({ contracts, loading }) {
//   const navigate = useNavigate();
//   const [stats, setStats] = useState({
//     totalGrants: 0,
//     totalAmount: 0,
//     activeContracts: 0,
//     upcomingDeadlines: 0,
//     fundsReceived: 0,
//     fundsRemaining: 0
//   });

//   useEffect(() => {
//     if (contracts.length > 0) {
//       calculateStats();
//     }
//   }, [contracts]);

//   const calculateStats = () => {
//     let totalAmount = 0;
//     let fundsReceived = 0;
//     let fundsRemaining = 0;
//     let upcomingDeadlines = 0;
//     const today = new Date();
    
//     contracts.forEach(contract => {
//       const amount = contract.total_amount || 0;
//       totalAmount += amount;
      
//       // Calculate funds received (assuming 50% for demo)
//       const received = amount * 0.5;
//       fundsReceived += received;
//       fundsRemaining += (amount - received);
      
//       // Check upcoming deadlines (within 30 days)
//       if (contract.end_date) {
//         const endDate = new Date(contract.end_date);
//         const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
//         if (daysDiff > 0 && daysDiff <= 30) {
//           upcomingDeadlines++;
//         }
//       }
//     });

//     setStats({
//       totalGrants: contracts.length,
//       totalAmount,
//       activeContracts: contracts.filter(c => c.status === 'processed').length,
//       upcomingDeadlines,
//       fundsReceived,
//       fundsRemaining
//     });
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const getDaysRemaining = (dateString) => {
//     if (!dateString) return 'N/A';
//     const today = new Date();
//     const targetDate = new Date(dateString);
//     const diffTime = targetDate - today;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays > 0 ? `${diffDays} days` : 'Expired';
//   };

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <h1>Grant Contract Dashboard</h1>
//         <button className="btn-primary" onClick={() => navigate('/upload')}>
//           + Upload New Contract
//         </button>
//       </div>

//       {/* KPI Cards */}
//       <div className="kpi-grid">
//         <div className="kpi-card">
//           <div className="kpi-icon">📋</div>
//           <div className="kpi-content">
//             <h3>{stats.totalGrants}</h3>
//             <p>Total Grants</p>
//           </div>
//         </div>
        
//         <div className="kpi-card">
//           <div className="kpi-icon">💰</div>
//           <div className="kpi-content">
//             <h3>{formatCurrency(stats.totalAmount)}</h3>
//             <p>Total Contract Value</p>
//           </div>
//         </div>
        
//         <div className="kpi-card">
//           <div className="kpi-icon">📈</div>
//           <div className="kpi-content">
//             <h3>{formatCurrency(stats.fundsReceived)}</h3>
//             <p>Funds Received</p>
//           </div>
//         </div>
        
//         <div className="kpi-card">
//           <div className="kpi-icon">📊</div>
//           <div className="kpi-content">
//             <h3>{formatCurrency(stats.fundsRemaining)}</h3>
//             <p>Funds Remaining</p>
//           </div>
//         </div>
        
//         <div className="kpi-card">
//           <div className="kpi-icon">✅</div>
//           <div className="kpi-content">
//             <h3>{stats.activeContracts}</h3>
//             <p>Active Contracts</p>
//           </div>
//         </div>
        
//         <div className="kpi-card">
//           <div className="kpi-icon">⏰</div>
//           <div className="kpi-content">
//             <h3>{stats.upcomingDeadlines}</h3>
//             <p>Upcoming Deadlines</p>
//           </div>
//         </div>
//       </div>

//       {/* Contracts Table */}
//       <div className="contracts-table-section">
//         <div className="section-header">
//           <h2>Recent Contracts</h2>
//           <button className="btn-secondary" onClick={() => navigate('/contracts')}>
//             View All Contracts
//           </button>
//         </div>
        
//         <div className="contracts-table">
//           <table>
//             <thead>
//               <tr>
//                 <th>Contract ID</th>
//                 <th>Grant Name</th>
//                 <th>Grantor</th>
//                 <th>Total Amount</th>
//                 <th>Start Date</th>
//                 <th>End Date</th>
//                 <th>Days Remaining</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {contracts.slice(0, 5).map((contract) => (
//                 <tr key={contract.id}>
//                   <td>#{contract.id}</td>
//                   <td className="grant-name">{contract.grant_name || 'Unnamed Grant'}</td>
//                   <td>{contract.grantor || 'Not specified'}</td>
//                   <td className="amount">{formatCurrency(contract.total_amount)}</td>
//                   <td>{contract.start_date || 'N/A'}</td>
//                   <td>{contract.end_date || 'N/A'}</td>
//                   <td>
//                     <span className={`days-remaining ${getDaysRemaining(contract.end_date).includes('Expired') ? 'expired' : ''}`}>
//                       {getDaysRemaining(contract.end_date)}
//                     </span>
//                   </td>
//                   <td>
//                     <span className={`status-badge ${contract.status}`}>
//                       {contract.status}
//                     </span>
//                   </td>
//                   <td>
//                     <div className="action-buttons">
//                       <button 
//                         className="btn-view"
//                         onClick={() => navigate(`/contracts/${contract.id}`)}
//                       >
//                         View Details
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {contracts.length === 0 && (
//             <div className="empty-table">
//               <p>No contracts available. Upload your first contract to get started.</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Upcoming Deadlines */}
//       <div className="deadlines-section">
//         <h2>Upcoming Deadlines</h2>
//         <div className="deadlines-grid">
//           {contracts
//             .filter(c => c.end_date && getDaysRemaining(c.end_date) !== 'Expired')
//             .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
//             .slice(0, 3)
//             .map((contract) => (
//               <div key={contract.id} className="deadline-card">
//                 <div className="deadline-header">
//                   <h4>{contract.grant_name || 'Unnamed Grant'}</h4>
//                   <span className="days-count">{getDaysRemaining(contract.end_date)}</span>
//                 </div>
//                 <p><strong>Grantor:</strong> {contract.grantor}</p>
//                 <p><strong>End Date:</strong> {contract.end_date}</p>
//                 <p><strong>Amount:</strong> {formatCurrency(contract.total_amount)}</p>
//                 <button 
//                   className="btn-small"
//                   onClick={() => navigate(`/contracts/${contract.id}`)}
//                 >
//                   View Details
//                 </button>
//               </div>
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;