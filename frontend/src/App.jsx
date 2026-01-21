import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import Dashboard from './Dashboard';
import UploadPage from './UploadPage';
import ContractsListPage from './ContractsListPage';
import ContractDetailsPage from './ContractDetailsPage';
import Login from './components/Auth/Login';
import PrivateRoute from './components/Auth/PrivateRoute';
import API_CONFIG from './config';
import './styles/App.css';
import Review from './components/workflow/Review';
import ProgramManagerReview from './components/workflow/ProgramManagerReview';
import ProgramManagerDashboard from './pages/ProgramManagerDashboard';
// import ContractReview from './components/Workflow/ContractReview';
import ContractApproval from './components/Workflow/ContractApproval';
// import AdvancedSearch from './components/AdvancedSearch/AdvancedSearch';
// import ActivityLogs from './components/Activity/ActivityLogs';
import ContractReview from './components/workflow/ContractReview';
import ProjectManagerActions from './components/workflow/ProjectManagerActions';
import ProjectManagerDashboard from './pages/ProjectManagerDashboard';

function App() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      fetchContracts();
    }
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Fetching contracts...', { token: !!token, user: userData });
      
      if (!token || !userData) {
        console.log('No token or user data, skipping fetch');
        return;
      }
      
      // IMPORTANT: Add trailing slash to match backend endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Contracts fetched successfully:', data);
        setContracts(data || []);
      } else if (response.status === 401) {
        console.log('Unauthorized, logging out');
        handleLogout();
      } else if (response.status === 405) {
        console.log('405 Method Not Allowed - trying without trailing slash');
        // Try without trailing slash as fallback
        const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setContracts(fallbackData || []);
        }
      } else {
        console.error('Failed to fetch contracts:', response.status);
      }
    } catch (error) {
      console.error('Network error fetching contracts:', error);
      // Don't logout on network errors
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    fetchContracts();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setContracts([]);
  };

  const handleUploadComplete = (newContract) => {
    setContracts([newContract, ...contracts]);
  };

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && user && (
          <>
            <Sidebar user={user} onLogout={handleLogout} />
            <div className="main-content">
              <TopBar user={user} />
              <div className="content-area">
                <Routes>
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute user={user} requiredRole="project_manager">
                        <Dashboard 
                          contracts={contracts} 
                          loading={loading} 
                          refreshContracts={fetchContracts}
                          user={user}
                        />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/upload" 
                    element={
                      <PrivateRoute user={user} requiredRole="project_manager">
                        <UploadPage 
                          setLoading={setLoading} 
                          onUploadComplete={handleUploadComplete}
                          user={user}
                        />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/contracts" 
                    element={
                      <PrivateRoute user={user}>
                        <ContractsListPage contracts={contracts} user={user} />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/contracts/:id" 
                    element={
                      <PrivateRoute user={user}>
                        <ContractDetailsPage user={user} />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/pm-dashboard" 
                    element={
                      <PrivateRoute user={user} requiredRole="project_manager">
                        <ProjectManagerDashboard user={user} />
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Program Manager Routes - MOVED INSIDE AUTHENTICATED BLOCK */}
                  <Route 
                    path="/review" 
                    element={
                      <PrivateRoute user={user} requiredRole="program_manager">
                        <Review />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/review-contract/:contractId" 
                    element={
                      <PrivateRoute user={user} requiredRole="program_manager">
                        <ProgramManagerReview />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/my-reviews" 
                    element={
                      <PrivateRoute user={user} requiredRole="program_manager">
                        <ProgramManagerDashboard />
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Director Routes */}
                  <Route 
                    path="/approvals" 
                    element={
                      <PrivateRoute user={user} requiredRole="director">
                        <ContractApproval />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/pending-approvals" 
                    element={
                      <PrivateRoute user={user} requiredRole="director">
                        <ContractApproval />
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Old review routes (keep for compatibility) */}
                  <Route 
                    path="/review-old" 
                    element={
                      <PrivateRoute user={user} requiredRole="program_manager">
                        <ContractReview />
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route path="/login" element={<Navigate to="/dashboard" />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          </>
        )}
        
        {!isAuthenticated && (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;

// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Sidebar from './components/Sidebar/Sidebar';
// import TopBar from './components/TopBar/TopBar';
// import Dashboard from './Dashboard';
// import UploadPage from './UploadPage';
// import ContractsListPage from './ContractsListPage';
// import ContractDetailsPage from './ContractDetailsPage';
// import Login from './components/Auth/Login';
// import PrivateRoute from './components/Auth/PrivateRoute';
// import API_CONFIG from './config';
// import './styles/App.css';
// import Review from './components/workflow/Review';
// import ProgramManagerReview from './components/workflow/ProgramManagerReview';
// import ProgramManagerDashboard from './pages/ProgramManagerDashboard';
// // import ContractReview from './components/Workflow/ContractReview';
// import ContractApproval from './components/Workflow/ContractApproval';
// // import AdvancedSearch from './components/AdvancedSearch/AdvancedSearch';
// // import ActivityLogs from './components/Activity/ActivityLogs';
// import ContractReview from './components/workflow/ContractReview';
// import ProjectManagerActions from './components/workflow/ProjectManagerActions';
// import ProjectManagerDashboard from './pages/ProjectManagerDashboard'; // ADD THIS IMPORT

// function App() {
//   const [contracts, setContracts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     // Check if user is logged in
//     const token = localStorage.getItem('token');
//     const userData = localStorage.getItem('user');
    
//     if (token && userData) {
//       setUser(JSON.parse(userData));
//       setIsAuthenticated(true);
//       fetchContracts();
//     }
//   }, []);

// const fetchContracts = async () => {
//   try {
//     setLoading(true);
//     const token = localStorage.getItem('token');
//     const userData = localStorage.getItem('user');
    
//     console.log('Fetching contracts...', { token: !!token, user: userData });
    
//     if (!token || !userData) {
//       console.log('No token or user data, skipping fetch');
//       return;
//     }
    
//     // IMPORTANT: Add trailing slash to match backend endpoint
//     const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       }
//     });
    
//     console.log('Response status:', response.status);
//     console.log('Response headers:', response.headers);
    
//     if (response.ok) {
//       const data = await response.json();
//       console.log('Contracts fetched successfully:', data);
//       setContracts(data || []);
//     } else if (response.status === 401) {
//       console.log('Unauthorized, logging out');
//       handleLogout();
//     } else if (response.status === 405) {
//       console.log('405 Method Not Allowed - trying without trailing slash');
//       // Try without trailing slash as fallback
//       const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/api/contracts`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (fallbackResponse.ok) {
//         const fallbackData = await fallbackResponse.json();
//         setContracts(fallbackData || []);
//       }
//     } else {
//       console.error('Failed to fetch contracts:', response.status);
//     }
//   } catch (error) {
//     console.error('Network error fetching contracts:', error);
//     // Don't logout on network errors
//   } finally {
//     setLoading(false);
//   }
// };

//   const handleLogin = (userData, token) => {
//     localStorage.setItem('token', token);
//     localStorage.setItem('user', JSON.stringify(userData));
//     setUser(userData);
//     setIsAuthenticated(true);
//     fetchContracts();
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setUser(null);
//     setIsAuthenticated(false);
//     setContracts([]);
//   };

//   const handleUploadComplete = (newContract) => {
//     setContracts([newContract, ...contracts]);
//   };

//   return (
//     <Router>
//       <div className="app-container">
//         {isAuthenticated && user && (
//           <>
//             <Sidebar user={user} onLogout={handleLogout} />
//             <div className="main-content">
//               <TopBar user={user} />
//               <div className="content-area">
//                 <Routes>
//                   <Route 
//                     path="/dashboard" 
//                     element={
//                       <PrivateRoute user={user} requiredRole="project_manager">
//                         <Dashboard 
//                           contracts={contracts} 
//                           loading={loading} 
//                           refreshContracts={fetchContracts}
//                           user={user}
//                         />
//                       </PrivateRoute>
//                     } 
//                   />
//                   <Route 
//                     path="/upload" 
//                     element={
//                       <PrivateRoute user={user} requiredRole="project_manager">
//                         <UploadPage 
//                           setLoading={setLoading} 
//                           onUploadComplete={handleUploadComplete}
//                           user={user}
//                         />
//                       </PrivateRoute>
//                     } 
//                   />
//                   <Route 
//                     path="/contracts" 
//                     element={
//                       <PrivateRoute user={user}>
//                         <ContractsListPage contracts={contracts} user={user} />
//                       </PrivateRoute>
//                     } 
//                   />
//                   <Route 
//                     path="/contracts/:id" 
//                     element={
//                       <PrivateRoute user={user}>
//                         <ContractDetailsPage user={user} />
//                       </PrivateRoute>
//                     } 
//                   />
//                   <Route 
//                     path="/pm-dashboard" 
//                     element={
//                       <PrivateRoute user={user} requiredRole="project_manager">
//                         <ProjectManagerDashboard user={user} />
//                       </PrivateRoute>
//                     } 
//                   />
//                   <Route path="/login" element={<Navigate to="/dashboard" />} />
//                   <Route path="/" element={<Navigate to="/dashboard" />} />
//                 </Routes>
//               </div>
//             </div>
//           </>
//         )}
        
//         {!isAuthenticated && (
//           <Routes>
//             <Route path="/login" element={<Login onLogin={handleLogin} />} />
//             <Route path="*" element={<Navigate to="/login" />} />
//             <Route 
//               path="/review" 
//               element={
//                 <PrivateRoute user={user} requiredRole="program_manager">
//                   <ContractReview />
//                 </PrivateRoute>
//               } 
//             />
//             <Route 
//               path="/approvals" 
//               element={
//                 <PrivateRoute user={user} requiredRole="director">
//                   <ContractApproval />
//                 </PrivateRoute>
//               } 
//             />
//             <Route 
//               path="/my-reviews" 
//               element={
//                 <PrivateRoute user={user} requiredRole="program_manager">
//                   <ContractReview />
//                 </PrivateRoute>
//               } 
//             />
//             <Route 
//               path="/pending-approvals" 
//               element={
//                 <PrivateRoute user={user} requiredRole="director">
//                   <ContractApproval />
//                 </PrivateRoute>
//               } 
//             />
// <Route 
//   path="/review-contract/:contractId" 
//   element={
//     <PrivateRoute user={user} requiredRole="program_manager">
//       <ProgramManagerReview />
//     </PrivateRoute>
//   } 
// />

// <Route 
//   path="/my-reviews" 
//   element={
//     <PrivateRoute user={user} requiredRole="program_manager">
//       <ProgramManagerDashboard />
//     </PrivateRoute>
//   } 
// />

//   <Route 
//     path="/review" 
//     element={
//       <PrivateRoute user={user} requiredRole="program_manager">
//         <Review />
//       </PrivateRoute>
//     } 
//   />
//           </Routes>
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;