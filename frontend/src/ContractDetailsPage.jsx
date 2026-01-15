import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComprehensiveView from './ComprehensiveView';
import API_CONFIG, { fetchAPI } from './config';

function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarContracts, setSimilarContracts] = useState([]);
  
  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      fetchContractData();
      fetchSimilarContracts();
    } else {
      console.error('Invalid contract ID:', id);
      setLoading(false);
    }
  }, [id]);

  const fetchContractData = async () => {
    const contractId = parseInt(id);
    if (!contractId || isNaN(contractId)) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Try comprehensive endpoint first
      const comprehensiveUrl = API_CONFIG.ENDPOINTS.COMPREHENSIVE(contractId);
      const response = await fetch(comprehensiveUrl);
      
      if (response.ok) {
        const data = await response.json();
        // Ensure contract_id is properly set
        if (data && !data.contract_id) {
          data.contract_id = contractId;
        }
        setContractData(data);
      } else {
        // Fallback to basic endpoint
        await fetchBasicContractData(contractId);
      }
    } catch (error) {
      console.error('Error fetching contract data:', error);
      await fetchBasicContractData(contractId);
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicContractData = async (contractId) => {
    try {
      const basicUrl = API_CONFIG.ENDPOINTS.CONTRACT_BY_ID(contractId);
      const response = await fetch(basicUrl);
      
      if (response.ok) {
        const basicData = await response.json();
        setContractData({
          contract_id: contractId,
          filename: basicData.filename || 'Unknown',
          basic_data: basicData,
          comprehensive_data: basicData.comprehensive_data || {}
        });
      }
    } catch (error) {
      console.error('Fallback fetch failed:', error);
      setContractData(null);
    }
  };

  const fetchSimilarContracts = async () => {
    const contractId = parseInt(id);
    if (!contractId || isNaN(contractId)) return;
    
    try {
      const similarUrl = API_CONFIG.ENDPOINTS.SIMILAR(contractId);
      const response = await fetch(`${similarUrl}?n_results=3`);
      if (response.ok) {
        const data = await response.json();
        setSimilarContracts(data.similar_contracts || []);
      }
    } catch (error) {
      console.error('Error fetching similar contracts:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contract?')) {
      return;
    }
    
    try {
      const contractId = parseInt(id);
      const response = await fetch(API_CONFIG.ENDPOINTS.CONTRACT_BY_ID(contractId), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to delete contract');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Error deleting contract');
    }
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

  // Add loading state
  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading contract details...</p>
        {!id && <p style={{color: 'red'}}>Error: No contract ID provided</p>}
      </div>
    );
  }

  if (!id || isNaN(parseInt(id))) {
    return (
      <div className="error-page">
        <h2>Invalid Contract ID</h2>
        <p>No valid contract ID was provided in the URL.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="error-page">
        <h2>Contract Not Found</h2>
        <p>The contract with ID {id} could not be found.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="contract-details-page">
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Contract Details</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/upload')}
          >
            Upload New
          </button>
          <button 
            className="btn-danger"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="contract-header-card">
        <div className="contract-basic-info">
          <div className="contract-title">
            <h2>{contractData.filename}</h2>
            <span className="contract-id">ID: #{contractData.contract_id}</span>
          </div>
          
          <div className="contract-stats">
            <div className="stat">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">
                {formatCurrency(contractData.basic_data?.total_amount)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Grantor</span>
              <span className="stat-value">{contractData.basic_data?.grantor || 'N/A'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Start Date</span>
              <span className="stat-value">{contractData.basic_data?.start_date || 'N/A'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">End Date</span>
              <span className="stat-value">{contractData.basic_data?.end_date || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="details-layout">
        <div className="main-content">
          <ComprehensiveView contractData={contractData} />
        </div>
        
        {similarContracts.length > 0 && (
          <div className="sidebar">
            <div className="similar-contracts">
              <h3>Similar Contracts</h3>
              {similarContracts.map((item, index) => (
                <div key={index} className="similar-contract">
                  <div className="similar-header">
                    <h4>{item.contract?.grant_name || 'Unnamed Grant'}</h4>
                    <span className="similarity-score">
                      {(item.similarity_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p><strong>Amount:</strong> {formatCurrency(item.contract?.total_amount)}</p>
                  <p><strong>Grantor:</strong> {item.contract?.grantor || 'N/A'}</p>
                  <button 
                    className="btn-small"
                    onClick={() => navigate(`/contracts/${item.contract?.id || item.contract_id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
            
            <div className="contract-actions-panel">
              <h3>Actions</h3>
              <button className="btn-action">
                📊 Generate Report
              </button>
              <button className="btn-action">
                📅 Add to Calendar
              </button>
              <button className="btn-action">
                📧 Share Contract
              </button>
              <button className="btn-action">
                🔍 Search Similar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractDetailsPage;

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import ComprehensiveView from './ComprehensiveView';

// function ContractDetailsPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [contractData, setContractData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [similarContracts, setSimilarContracts] = useState([]);


//    useEffect(() => {
//     console.log('Contract ID from URL:', id);
//     console.log('Type of ID:', typeof id);
//     console.log('Is ID valid?', id && !isNaN(id));
//   }, [id]);
//   useEffect(() => {
//     // Check if id exists before fetching
//     if (id && !isNaN(id)) {
//       fetchContractData();
//       fetchSimilarContracts();
//     } else {
//       console.error('Invalid contract ID:', id);
//       setLoading(false);
//     }
//   }, [id]); // Make sure dependency is on id

//   const fetchContractData = async () => {
//     if (!id || isNaN(id)) {
//       console.error('Invalid ID, cannot fetch data');
//       setLoading(false);
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/contracts/${id}/comprehensive`);
      
//       // Check if response is valid
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}`);
//       }
      
//       const data = await response.json();
//       setContractData(data);
//     } catch (error) {
//       console.error('Error fetching contract data:', error);
      
//       // Try basic endpoint as fallback
//       try {
//         const basicResponse = await fetch(`/api/contracts/${id}`);
//         if (basicResponse.ok) {
//           const basicData = await basicResponse.json();
//           setContractData({
//             contract_id: parseInt(id),
//             filename: basicData.filename || 'Unknown',
//             basic_data: basicData,
//             comprehensive_data: basicData.comprehensive_data || {}
//           });
//         }
//       } catch (fallbackError) {
//         console.error('Fallback also failed:', fallbackError);
//         setContractData(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSimilarContracts = async () => {
//     if (!id || isNaN(id)) return;
    
//     try {
//       const response = await fetch(`/api/contracts/${id}/similar?n_results=3`);
//       if (response.ok) {
//         const data = await response.json();
//         setSimilarContracts(data.similar_contracts || []);
//       }
//     } catch (error) {
//       console.error('Error fetching similar contracts:', error);
//     }
//   };

//   // Add a loading state that checks for id
//   if (loading) {
//     return (
//       <div className="loading-page">
//         <div className="spinner"></div>
//         <p>Loading contract details...</p>
//         {!id && <p style={{color: 'red'}}>Error: No contract ID provided</p>}
//       </div>
//     );
//   }

//   if (!id || isNaN(id)) {
//     return (
//       <div className="error-page">
//         <h2>Invalid Contract ID</h2>
//         <p>No valid contract ID was provided in the URL.</p>
//         <button className="btn-primary" onClick={() => navigate('/dashboard')}>
//           Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="contract-details-page">
//       <div className="page-header">
//         <div className="header-left">
//           <button className="btn-back" onClick={() => navigate('/dashboard')}>
//             ← Back to Dashboard
//           </button>
//           <h1>Contract Details</h1>
//         </div>
//         <div className="header-actions">
//           <button 
//             className="btn-secondary"
//             onClick={() => navigate('/upload')}
//           >
//             Upload New
//           </button>
//           <button 
//             className="btn-danger"
//             onClick={handleDelete}
//           >
//             Delete
//           </button>
//         </div>
//       </div>

//       <div className="contract-header-card">
//         <div className="contract-basic-info">
//           <div className="contract-title">
//             <h2>{contractData.filename}</h2>
//             <span className="contract-id">ID: #{contractData.contract_id}</span>
//           </div>
          
//           <div className="contract-stats">
//             <div className="stat">
//               <span className="stat-label">Total Amount</span>
//               <span className="stat-value">
//                 {formatCurrency(contractData.basic_data?.total_amount)}
//               </span>
//             </div>
//             <div className="stat">
//               <span className="stat-label">Grantor</span>
//               <span className="stat-value">{contractData.basic_data?.grantor || 'N/A'}</span>
//             </div>
//             <div className="stat">
//               <span className="stat-label">Start Date</span>
//               <span className="stat-value">{contractData.basic_data?.start_date || 'N/A'}</span>
//             </div>
//             <div className="stat">
//               <span className="stat-label">End Date</span>
//               <span className="stat-value">{contractData.basic_data?.end_date || 'N/A'}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="details-layout">
//         <div className="main-content">
//           <ComprehensiveView contractData={contractData} />
//         </div>
        
//         {similarContracts.length > 0 && (
//           <div className="sidebar">
//             <div className="similar-contracts">
//               <h3>Similar Contracts</h3>
//               {similarContracts.map((item, index) => (
//                 <div key={index} className="similar-contract">
//                   <div className="similar-header">
//                     <h4>{item.contract.grant_name || 'Unnamed Grant'}</h4>
//                     <span className="similarity-score">
//                       {(item.similarity_score * 100).toFixed(0)}% match
//                     </span>
//                   </div>
//                   <p><strong>Amount:</strong> {formatCurrency(item.contract.total_amount)}</p>
//                   <p><strong>Grantor:</strong> {item.contract.grantor || 'N/A'}</p>
//                   <button 
//                     className="btn-small"
//                     onClick={() => navigate(`/contracts/${item.contract.id}`)}
//                   >
//                     View
//                   </button>
//                 </div>
//               ))}
//             </div>
            
//             <div className="contract-actions-panel">
//               <h3>Actions</h3>
//               <button className="btn-action">
//                 📊 Generate Report
//               </button>
//               <button className="btn-action">
//                 📅 Add to Calendar
//               </button>
//               <button className="btn-action">
//                 📧 Share Contract
//               </button>
//               <button className="btn-action">
//                 🔍 Search Similar
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ContractDetailsPage;