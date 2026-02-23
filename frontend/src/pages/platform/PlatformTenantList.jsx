import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API_CONFIG from "../../config";

function PlatformTenantList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const toggleTenant = async (tenantId, isActive) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_CONFIG.BASE_URL}/api/tenants/${tenantId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTenants(); // Refresh
    } catch (err) {
      alert("Failed to update tenant status");
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Tenants</h2>
        <Link to="/platform/tenants/create" style={{
          padding: "10px 20px",
          background: "#4f46e5",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
        }}>
          + Create Tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <p style={{ color: "#666", marginTop: 32 }}>No tenants yet. Create your first one!</p>
      ) : (
        <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              {["Organization", "Domain", "Admin Email", "Setup", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: "#666", fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "14px 16px", fontWeight: 600 }}>{tenant.name}</td>
                <td style={{ padding: "14px 16px", color: "#666" }}>{tenant.domain}</td>
                <td style={{ padding: "14px 16px", color: "#666" }}>{tenant.admin_email}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: tenant.setup_completed ? "#dcfce7" : "#fef9c3",
                    color: tenant.setup_completed ? "#16a34a" : "#854d0e",
                  }}>
                    {tenant.setup_completed ? "Complete" : "Pending"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: tenant.is_active ? "#dcfce7" : "#fee2e2",
                    color: tenant.is_active ? "#16a34a" : "#dc2626",
                  }}>
                    {tenant.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button
                    onClick={() => toggleTenant(tenant.id, tenant.is_active)}
                    style={{
                      padding: "6px 14px",
                      background: tenant.is_active ? "#fee2e2" : "#dcfce7",
                      color: tenant.is_active ? "#dc2626" : "#16a34a",
                      border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    {tenant.is_active ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PlatformTenantList;