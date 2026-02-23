import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_CONFIG from "../../config";

function PlatformCreateTenant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organization_name: "",
    domain: "",
    admin_name: "",
    admin_email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create tenant");

      setSuccess({
        tenant_id: data.tenant_id,
        email: form.admin_email,
        password: form.password,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 500, margin: "60px auto", padding: 40 }}>
        <div style={{
          padding: 24, background: "#f0fdf4",
          border: "1px solid #bbf7d0", borderRadius: 12,
        }}>
          <h3 style={{ color: "#16a34a" }}>✅ Tenant Created Successfully!</h3>
          <p>Share these credentials with the NGO admin:</p>
          <div style={{
            background: "#fff", padding: 16, borderRadius: 8,
            border: "1px solid #e5e7eb", marginTop: 12,
          }}>
            <p><strong>Login URL:</strong> {window.location.origin}/app/login</p>
            <p><strong>Email:</strong> {success.email}</p>
            <p><strong>Password:</strong> {success.password}</p>
            <p><strong>Tenant ID:</strong> {success.tenant_id}</p>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={() => navigate("/platform/tenants")}
              style={{
                flex: 1, padding: "10px",
                background: "#4f46e5", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer",
              }}
            >
              View All Tenants
            </button>
            <button
              onClick={() => { setSuccess(null); setForm({ organization_name: "", domain: "", admin_name: "", admin_email: "", password: "" }); }}
              style={{
                flex: 1, padding: "10px",
                background: "#fff", color: "#4f46e5",
                border: "1px solid #4f46e5", borderRadius: 8, cursor: "pointer",
              }}
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fields = [
    { name: "organization_name", label: "Organization Name", type: "text" },
    { name: "domain", label: "Domain (e.g. acme)", type: "text" },
    { name: "admin_name", label: "Admin Full Name", type: "text" },
    { name: "admin_email", label: "Admin Email", type: "email" },
    { name: "password", label: "Temporary Password", type: "password" },
  ];

  return (
    <div style={{ maxWidth: 500, margin: "60px auto", padding: 40 }}>
      <h2>Create New Tenant</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        This will create a new NGO tenant and their admin account.
      </p>

      {error && (
        <div style={{ color: "red", marginBottom: 16, padding: 12, background: "#fee2e2", borderRadius: 8 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {fields.map(({ name, label, type }) => (
          <div key={name} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
              {label}
            </label>
            <input
              type={type}
              name={name}
              value={form[name]}
              onChange={handleChange}
              required
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid #e5e7eb", borderRadius: 8,
                fontSize: 14, boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: "#4f46e5", color: "#fff",
            border: "none", borderRadius: 8,
            fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8,
          }}
        >
          {loading ? "Creating..." : "Create Tenant"}
        </button>
      </form>
    </div>
  );
}

export default PlatformCreateTenant;