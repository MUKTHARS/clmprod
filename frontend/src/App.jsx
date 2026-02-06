// C:\saple.ai\POC\frontend\src\App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import ContractReview from './components/workflow/ContractReview';
import ContractApproval from './components/workflow/ContractApproval';
import ProjectManagerActions from './components/workflow/ProjectManagerActions';
import ProjectManagerDashboard from './pages/ProjectManagerDashboard';
import ViewProgramManagerReviews from './components/workflow/ViewProgramManagerReviews';
import DirectorApproval from './components/workflow/DirectorApproval';
import ProgramManagerDirectorDecisions from './components/workflow/ProgramManagerDirectorDecisions';
import CopilotPage from './components/copilot/CopilotPage';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import ViewDraftsPage from './components/workflow/ViewDraftsPage';
import DraftManagementPage from './pages/DraftManagementPage';
// import ArchivePage from './pages/ArchivePage';
function AppContent({ user, isAuthenticated, loading, contracts, onLogin, onLogout, onUploadComplete, fetchContracts }) {
  const location = useLocation();
  
  // Don't show app layout on login page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        <TopBar user={user} />
        <div className="content-area">
          <Routes>
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute user={user}>
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
                <PrivateRoute user={user} requiredRoles={['project_manager', 'program_manager','director']}>
                  <UploadPage 
                    setLoading={() => {}} 
                    onUploadComplete={onUploadComplete}
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
            
            {/* <Route 
  path="/drafts" 
  element={
    <PrivateRoute user={user} requiredRole="project_manager">
      <DraftManagementPage user={user} />
    </PrivateRoute>
  } 
/> */}
            {/* Program Manager Routes */}
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
            <Route path="/drafts" element={<ViewDraftsPage user={user} />} />
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
                  <DirectorApproval />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/pending-approvals" 
              element={
                <PrivateRoute user={user} requiredRole="director">
                  <DirectorApproval />
                </PrivateRoute>
              } 
            />
 <Route 
    path="/drafts/my" 
    element={
      user?.role === "project_manager" ? (
        <DraftManagementPage user={user} />
      ) : (
        <Navigate to="/dashboard" replace />
      )
    } 
  />
  <Route 
    path="/drafts/assigned" 
    element={
      user?.role === "project_manager" ? (
        <DraftManagementPage user={user} />
      ) : (
        <Navigate to="/dashboard" replace />
      )
    } 
  />
{/* <Route path="/archive" element={
  user ? (
    <Layout>
      <div className="archive-page" style={{ padding: '24px' }}>
        <h1>Archive</h1>
        <p>Archive functionality coming soon...</p>
      </div>
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  )
} /> */}
            {/* Old review routes (keep for compatibility) */}
            <Route 
              path="/review-old" 
              element={
                <PrivateRoute user={user} requiredRole="program_manager">
                  <ContractReview />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/program-manager/director-decisions" 
              element={
                <PrivateRoute user={user} requiredRole="program_manager">
                  <ProgramManagerDirectorDecisions />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/director-approval" 
              element={
                <PrivateRoute user={user} requiredRole="director">
                  <DirectorApproval />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/contracts/:contractId/reviews" 
              element={
                <PrivateRoute user={user} requiredRole="project_manager">
                  <ViewProgramManagerReviews />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/admin" 
              element={
                <PrivateRoute user={user} requiredRole="super_admin">
                  <SuperAdminDashboard user={user} />
                </PrivateRoute>
              } 
            />
            
            {/* Redirect / to dashboard ONLY if user is on root path */}
            <Route 
              path="/" 
              element={
                location.pathname === "/" ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <PrivateRoute user={user}>
                    <Dashboard 
                      contracts={contracts} 
                      loading={loading} 
                      refreshContracts={fetchContracts}
                      user={user}
                    />
                  </PrivateRoute>
                )
              } 
            />
            
            {/* Catch-all route - preserve current path */}
            <Route 
              path="*" 
              element={
                <PrivateRoute user={user}>
                  {/* Don't redirect, just show 404 or current page */}
                  <div className="not-found">
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                    <button onClick={() => window.history.back()}>Go Back</button>
                  </div>
                </PrivateRoute>
              } 
            />
            
            <Route 
  path="/copilot" 
  element={
    <PrivateRoute user={user}>
      <CopilotPage />
    </PrivateRoute>
  } 
/>
          </Routes>

          
        </div>
      </div>
    </>
  );
}

function App() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Only fetch contracts if needed for current page
          const currentPath = window.location.pathname;
          if (currentPath === '/dashboard' || 
              currentPath.startsWith('/contracts') ||
              currentPath === '/') {
            fetchContracts();
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
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

  // Show loading state while initializing auth
  if (isInitializing) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <AppContent 
          user={user}
          isAuthenticated={isAuthenticated}
          loading={loading}
          contracts={contracts}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onUploadComplete={handleUploadComplete}
          fetchContracts={fetchContracts}
        />
      </div>
    </Router>
  );
}

export default App;