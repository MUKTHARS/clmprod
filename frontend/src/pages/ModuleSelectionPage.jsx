import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_CONFIG from "../config";

const AVAILABLE_MODULES = [
  { key: "grant_tracking", label: "Grant Tracking", description: "Track and manage grants" },
  { key: "contract_management", label: "Contract Management", description: "Manage contracts and agreements" },
  { key: "deliverables_sow", label: "Deliverables & SOW", description: "Track deliverables and scope of work" },
  { key: "invoice_claims", label: "Invoice & Claims", description: "Handle invoices and claims" },
  { key: "budget_expense", label: "Budget & Expense", description: "Monitor budgets and expenses" },
  { key: "ai_copilot", label: "AI Copilot", description: "AI-powered assistant" },
  { key: "risk_compliance", label: "Risk & Compliance", description: "Manage risk and compliance" },
];

const ModuleSelectionPage = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState({
    grant_tracking: true,
    contract_management: true,
    deliverables_sow: true,
    invoice_claims: true,
    budget_expense: false,
    ai_copilot: true,
    risk_compliance: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleModule = (key) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token"); // ✅ Fixed key
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/modules/configure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modules }),
      });

      if (!response.ok) throw new Error("Failed to configure modules");

      navigate("/app/setup/workflow"); // ✅ Fixed path
    } catch (err) {
      console.error(err);
      setError("Error saving module configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: 40 }}>
      <h2>Select Your Modules</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Choose the modules you want to enable for your organization.
      </p>

      {error && (
        <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
      )}

      {AVAILABLE_MODULES.map(({ key, label, description }) => (
        <div
          key={key}
          onClick={() => toggleModule(key)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            marginBottom: 12,
            border: `2px solid ${modules[key] ? "#4f46e5" : "#e5e7eb"}`,
            borderRadius: 8,
            cursor: "pointer",
            background: modules[key] ? "#f5f3ff" : "#fff",
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 13, color: "#666" }}>{description}</div>
          </div>
          <input
            type="checkbox"
            checked={modules[key]}
            onChange={() => toggleModule(key)}
            style={{ width: 18, height: 18 }}
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          marginTop: 24,
          width: "100%",
          padding: "12px",
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Saving..." : "Save & Continue →"}
      </button>
    </div>
  );
};

export default ModuleSelectionPage;