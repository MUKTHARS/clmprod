import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/platform/dashboard" },
  { label: "Tenants", path: "/platform/tenants" },
  { label: "Create Tenant", path: "/platform/tenants/create" },
];

function PlatformSidebar({ onLogout }) {
  const location = useLocation();

  return (
    <div style={{
      width: 240,
      height: "100vh",
      background: "#1e1b4b",
      position: "fixed",
      top: 0, left: 0,
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
    }}>
      <div style={{ padding: "0 24px 32px", color: "#fff", fontSize: 20, fontWeight: 700 }}>
        Saple AI
        <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 400 }}>Platform Admin</div>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "block",
              padding: "12px 24px",
              color: location.pathname === item.path ? "#fff" : "#a5b4fc",
              background: location.pathname === item.path ? "#4338ca" : "transparent",
              textDecoration: "none",
              fontWeight: location.pathname === item.path ? 600 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={onLogout}
        style={{
          margin: "0 24px",
          padding: "10px",
          background: "transparent",
          border: "1px solid #4338ca",
          color: "#a5b4fc",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default PlatformSidebar;