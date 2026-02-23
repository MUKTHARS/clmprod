import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_CONFIG from "../config";

const WORKFLOW_STEPS = [
  { key: "upload", label: "Upload Contract", role: "project_manager" },
  { key: "review", label: "Program Manager Review", role: "program_manager" },
  { key: "approval", label: "Director Approval", role: "director" },
];

const WorkflowSetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFinish = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      // Mark setup as completed
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/setup-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to complete setup");

      // ✅ Update localStorage so App.jsx knows setup is done
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.setup_completed = true;
      localStorage.setItem("user", JSON.stringify(userData));

      navigate("/app/dashboard");
    } catch (err) {
      console.error(err);
      setError("Error completing setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: 40 }}>
      <h2>Review Workflow Setup</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        This is your default approval workflow. You can customize it later.
      </p>

      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}

      {WORKFLOW_STEPS.map((step, index) => (
        <div
          key={step.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px",
            marginBottom: 12,
            border: "2px solid #e5e7eb",
            borderRadius: 8,
            background: "#f9fafb",
          }}
        >
          <div style={{
            width: 32, height: 32,
            borderRadius: "50%",
            background: "#4f46e5",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {index + 1}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{step.label}</div>
            <div style={{ fontSize: 13, color: "#666" }}>Role: {step.role}</div>
          </div>
        </div>
      ))}

      <button
        onClick={handleFinish}
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
        {loading ? "Finishing..." : "Finish Setup →"}
      </button>
    </div>
  );
};

export default WorkflowSetupPage;