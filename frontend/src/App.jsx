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
// import API_CONFIG from './config';
// import './styles/App.css';

// function App() {
//   const [contracts, setContracts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   const fetchContracts = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(API_CONFIG.ENDPOINTS.CONTRACTS);
//       if (response.ok) {
//         const data = await response.json();
//         setContracts(data);
//       }
//     } catch (error) {
//       console.error('Error fetching contracts:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchContracts();
//   }, []);

//   const handleUploadComplete = (newContract) => {
//     setContracts([newContract, ...contracts]);
//   };

//   const toggleMobileMenu = () => {
//     setIsMobileMenuOpen(!isMobileMenuOpen);
//   };

//   const handleMobileMenuClose = () => {
//     setIsMobileMenuOpen(false);
//   };

//   return (
//     <Router>
//       <div className="app-container">
//         <Sidebar />
//         <div className="main-content">
//           <TopBar />
//           <div className="content-area">
//             <Routes>
//               <Route path="/" element={<Navigate to="/dashboard" />} />
//               <Route 
//                 path="/dashboard" 
//                 element={
//                   <Dashboard 
//                     contracts={contracts} 
//                     loading={loading} 
//                     refreshContracts={fetchContracts}
//                   />
//                 } 
//               />
//               <Route 
//                 path="/upload" 
//                 element={
//                   <UploadPage 
//                     setLoading={setLoading} 
//                     onUploadComplete={handleUploadComplete} 
//                   />
//                 } 
//               />
//               <Route 
//                 path="/contracts" 
//                 element={<ContractsListPage contracts={contracts} />} 
//               />
//               <Route 
//                 path="/contracts/:id" 
//                 element={<ContractDetailsPage />} 
//               />
//               {/* Add more routes as needed */}
//               <Route path="/analytics" element={<div>Analytics Page</div>} />
//               <Route path="/reports" element={<div>Reports Page</div>} />
//               <Route path="/settings" element={<div>Settings Page</div>} />
//             </Routes>
//           </div>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;
