import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PlatformDashboard from "./platform/PlatformDashboard";
import PlatformTenantList from "./platform/PlatformTenantList";
import PlatformCreateTenant from "./platform/PlatformCreateTenant";
import PlatformSidebar from "../components/platform/PlatformSidebar";

function PlatformRouter({ onLogout }) {
  return (
    <div style={{ display: "flex" }}>
      <PlatformSidebar onLogout={onLogout} />
      <div style={{ flex: 1, marginLeft: 240 }}>
        <Routes>
          <Route path="dashboard" element={<PlatformDashboard />} />
          <Route path="tenants" element={<PlatformTenantList />} />
          <Route path="tenants/create" element={<PlatformCreateTenant />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default PlatformRouter;
