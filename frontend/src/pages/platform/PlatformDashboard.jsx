import React, { useState, useEffect } from "react";
import API_CONFIG from "../../config";

function PlatformDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const tenants = data.tenants || [];
          setStats({
            total: tenants.length,
            active: tenants.filter((t) => t.is_active).length,
            inactive: tenants.filter((t) => !t.is_active).length,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Tenants", value: stats.total, color: "#4f46e5" },
    { label: "Active", value: stats.active, color: "#16a34a" },
    { label: "Inactive", value: stats.inactive, color: "#dc2626" },
  ];

  return (
    <div style={{ padding: 40 }}>
      <h2>Platform Dashboard</h2>
      <p style={{ color: "#666" }}>Overview of all tenants on the platform.</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
          {cards.map((card) => (
            <div key={card.label} style={{
              flex: 1,
              padding: 24,
              borderRadius: 12,
              background: "#fff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 14, color: "#666" }}>{card.label}</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlatformDashboard;