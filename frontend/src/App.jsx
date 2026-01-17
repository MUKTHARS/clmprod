import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import Dashboard from './Dashboard';
import UploadPage from './UploadPage';
import ContractsListPage from './ContractsListPage';
import ContractDetailsPage from './ContractDetailsPage';
import API_CONFIG from './config';
import './styles/App.css';

function App() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_CONFIG.ENDPOINTS.CONTRACTS);
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleUploadComplete = (newContract) => {
    setContracts([newContract, ...contracts]);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <TopBar />
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    contracts={contracts} 
                    loading={loading} 
                    refreshContracts={fetchContracts}
                  />
                } 
              />
              <Route 
                path="/upload" 
                element={
                  <UploadPage 
                    setLoading={setLoading} 
                    onUploadComplete={handleUploadComplete} 
                  />
                } 
              />
              <Route 
                path="/contracts" 
                element={<ContractsListPage contracts={contracts} />} 
              />
              <Route 
                path="/contracts/:id" 
                element={<ContractDetailsPage />} 
              />
              {/* Add more routes as needed */}
              <Route path="/analytics" element={<div>Analytics Page</div>} />
              <Route path="/reports" element={<div>Reports Page</div>} />
              <Route path="/settings" element={<div>Settings Page</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;

// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Dashboard from './Dashboard';
// import UploadPage from './UploadPage';
// import ContractsListPage from './ContractsListPage';
// import ContractDetailsPage from './ContractDetailsPage';
// import API_CONFIG from './config';
// import './styles.css';

// function App() {
//   const [contracts, setContracts] = useState([]);
//   const [loading, setLoading] = useState(false);

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
//     // Add the new contract to the beginning of the list
//     setContracts([newContract, ...contracts]);
//   };

//   return (
//     <Router>
//       <div className="app">
//         <Routes>
//           <Route path="/" element={<Navigate to="/dashboard" />} />
//           <Route 
//             path="/dashboard" 
//             element={
//               <Dashboard 
//                 contracts={contracts} 
//                 loading={loading} 
//                 refreshContracts={fetchContracts}
//               />
//             } 
//           />
//           <Route 
//             path="/upload" 
//             element={
//               <UploadPage 
//                 setLoading={setLoading} 
//                 onUploadComplete={handleUploadComplete} 
//               />
//             } 
//           />
//           <Route 
//             path="/contracts" 
//             element={<ContractsListPage contracts={contracts} />} 
//           />
//           <Route 
//             path="/contracts/:id" 
//             element={<ContractDetailsPage />} 
//           />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
