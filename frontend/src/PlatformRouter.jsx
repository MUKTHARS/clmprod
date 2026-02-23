import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* Temporary inline components so nothing crashes */

function PlatformDashboard() {
  return <div style={{ padding: 40 }}>Platform Dashboard</div>;
}

function TenantListPage() {
  return <div style={{ padding: 40 }}>Tenant List Page</div>;
}

function CreateTenantPage() {
  return <div style={{ padding: 40 }}>Create Tenant Page</div>;
}

function PlatformRouter() {
  return (
    <Routes>
      <Route path="dashboard" element={<PlatformDashboard />} />
      <Route path="tenants" element={<TenantListPage />} />
      <Route path="tenants/create" element={<CreateTenantPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

export default PlatformRouter;