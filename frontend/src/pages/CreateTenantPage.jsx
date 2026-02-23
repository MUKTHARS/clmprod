import React, { useState } from "react";
import "./CreateTenantPage.css";
import API_CONFIG from "../config";
import { useNavigate } from "react-router-dom";


const CreateTenantPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    organization_name: "",
    domain: "",
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      setLoading(true);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/platform/tenants/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create tenant");
      }

      // Store JWT
      //localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(true);
      setUser(data.user);
      // Redirect immediately (no need for delay unless you want animation)
      navigate("/setup/modules");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-page">
      <div className="tenant-card">
        <h1>Let’s Set Up Your Organization</h1>
        <p className="tenant-subtitle">
          Fill out the details to create your GrantOS workspace.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Organization Info */}
          <div className="section">
            <h3>Organization Information</h3>

            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                name="organization_name"
                placeholder="Enter your organization name"
                value={formData.organization_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group domain-group">
              <label>Workspace Domain</label>
              <div className="domain-input">
                <input
                  type="text"
                  name="domain"
                  placeholder="yourdomain"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                />
                <span>.saple.ai</span>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="section">
            <h3>Admin Details</h3>

            <div className="form-group">
              <label>Admin Name</label>
              <input
                type="text"
                name="admin_name"
                placeholder="Admin full name"
                value={formData.admin_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Admin Email</label>
              <input
                type="email"
                name="admin_email"
                placeholder="admin@example.com"
                value={formData.admin_email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter a secure password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Admin Phone</label>
              <input
                type="text"
                name="admin_phone"
                placeholder="Enter phone number"
                value={formData.admin_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {success && (
            <div className="success">
              🎉 Workspace created successfully!
            </div>
          )}

          <button className="create-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTenantPage;