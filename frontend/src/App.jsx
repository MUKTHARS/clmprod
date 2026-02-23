import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar/Sidebar";
import TopBar from "./components/TopBar/TopBar";
import Login from "./components/Auth/Login";

import Dashboard from "./Dashboard";
import UploadPage from "./UploadPage";
import ContractsListPage from "./ContractsListPage";
import ContractDetailsPage from "./ContractDetailsPage";
import Review from "./components/workflow/Review";
import ProgramManagerReview from "./components/workflow/ProgramManagerReview";
import ProgramManagerDashboard from "./pages/ProgramManagerDashboard";
import ContractReview from "./components/workflow/ContractReview";
import DirectorApproval from "./components/workflow/DirectorApproval";
import ViewProgramManagerReviews from "./components/workflow/ViewProgramManagerReviews";
import CopilotPage from "./components/copilot/CopilotPage";
import ViewDraftsPage from "./components/workflow/ViewDraftsPage";
import Reports from "./Reports";
import DraftManagementPage from "./pages/DraftManagementPage";
import AssignedAgreementsPage from "./pages/AssignedAgreementsPage";
import AssignedByMePage from "./pages/AssignedByMePage";
import ApprovedContractsPage from "./pages/ApprovedContractsPage";
import ArchivePage from "./pages/ArchivePage";
import AdminPortalPage from "./pages/AdminPortalPage";
import UserManagementPage from "./pages/UserManagementPage";
import PlatformRouter from "./pages/PlatformRouter";
import PlatformLogin from "./components/Auth/PlatformLogin";
import TenantLogin from "./components/Auth/TenantLogin";


function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // ✅ FIXED: uncommented

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = (role) => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = role === "platform_admin" ? "/platform/login" : "/app/login";
  };

  if (isInitializing) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* PLATFORM LOGIN */}
        <Route path="/platform/login" element={<PlatformLogin onLogin={handleLogin} />} />

        {/* PLATFORM ADMIN */}
        <Route
          path="/platform/*"
          element={
            isAuthenticated && user?.role === "platform_admin"
              ? <PlatformRouter onLogout={() => handleLogout("platform_admin")} />
              : <Navigate to="/platform/login" replace />
          }
        />

        {/* TENANT LOGIN */}
        <Route path="/app/login" element={<TenantLogin onLogin={handleLogin} />} />

        {/* TENANT APP */}
        <Route
          path="/app/*"
          element={
            isAuthenticated && user?.role !== "platform_admin" && user?.tenant_id
              ? <TenantRouter user={user} onLogout={() => handleLogout(user?.role)} />
              : <Navigate to="/app/login" replace />
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/platform/login" />} />
      </Routes>
    </Router>
  );
}

function TenantRouter({ user, onLogout }) {
  return (
    <>
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        <TopBar user={user} />
        <div className="content-area">
          <Routes>
            <Route path="/admin" element={<AdminPortalPage user={user} />} />
            <Route path="/users" element={<UserManagementPage user={user} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/upload" element={<UploadPage user={user} />} />
            <Route path="/contracts" element={<ContractsListPage user={user} />} />
            <Route path="/contracts/:id" element={<ContractDetailsPage user={user} />} />
            <Route path="/review" element={<Review />} />
            <Route path="/review-contract/:contractId" element={<ProgramManagerReview />} />
            <Route path="/drafts" element={<ViewDraftsPage user={user} />} />
            <Route path="/my-reviews" element={<ProgramManagerDashboard />} />
            <Route path="/approvals" element={<DirectorApproval />} />
            <Route path="/drafts/my" element={<DraftManagementPage user={user} />} />
            <Route path="/drafts/assigned" element={<DraftManagementPage user={user} />} />
            <Route path="/approved-contracts" element={<ApprovedContractsPage user={user} />} />
            <Route path="/archive" element={<ArchivePage user={user} />} />
            <Route path="/review-old" element={<ContractReview />} />
            <Route path="/agreements/assigned" element={<AssignedAgreementsPage user={user} />} />
            <Route path="/agreements/assigned-by-me" element={<AssignedByMePage user={user} />} />
            <Route path="/contracts/:contractId/reviews" element={<ViewProgramManagerReviews />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;