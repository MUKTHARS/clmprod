import React, { useState, useEffect } from "react";
import API_CONFIG from "../config";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Organization" },
  { id: 2, label: "Team Members" },
  { id: 3, label: "Workflows" },
  { id: 4, label: "AI & System" },
];

const ROLES = [
  { value: "director",         label: "Director" },
  { value: "program_manager",  label: "Program Manager" },
  { value: "project_manager",  label: "Project Manager" },
];

const DEFAULT_RULES = {
  sequential:    true,
  fast_track:    false,
  notify_pm:     true,
  reminders:     true,
  auto_escalate: true,
};

const DEFAULT_PROMPTS = [
  "Summarize key terms and conditions in grant agreements",
  "Assess compliance risks based on uploaded documents",
  "Provide suggestions to improve grant applications",
  "Analyze historical data to forecast grant outcomes",
];

const AI_MODELS = [
  { id: "openai",       label: "OpenAI",       icon: "⚡" },
  { id: "azure_openai", label: "Azure OpenAI", icon: "☁" },
  { id: "anthropic",    label: "Anthropic",    icon: "◎" },
];

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: step > s.id ? "#4f46e5" : step === s.id ? "#4f46e5" : "#e5e7eb",
              color: step >= s.id ? "#fff" : "#9ca3af",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14,
              boxShadow: step === s.id ? "0 0 0 4px #e0e7ff" : "none",
              transition: "all 0.2s",
            }}>
              {step > s.id ? "✓" : s.id}
            </div>
            <span style={{
              fontSize: 12, fontWeight: step === s.id ? 700 : 400,
              color: step === s.id ? "#4f46e5" : step > s.id ? "#6b7280" : "#9ca3af",
              whiteSpace: "nowrap",
            }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              height: 2, width: 80, marginBottom: 18,
              background: step > s.id ? "#4f46e5" : "#e5e7eb",
              transition: "background 0.2s",
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Step 1 – Organization ────────────────────────────────────────────────────

function StepOrganization({ user }) {
  const tenantName = (user?.full_name || "Your Organization");
  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <h2 style={styles.stepTitle}>Welcome to GrantOS</h2>
      <p style={styles.stepSubtitle}>
        Let's get your workspace set up in 4 quick steps.
      </p>

      <div style={{ ...styles.card, marginTop: 32 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={styles.orgIcon}>{tenantName[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{tenantName}</div>
            <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
              Tenant Admin Account
            </div>
          </div>
        </div>
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Email",  value: user?.email },
            { label: "Role",   value: "Super Admin" },
            { label: "Domain", value: user?.domain || "Configured" },
            { label: "Status", value: "Active" },
          ].map(({ label, value }) => (
            <div key={label} style={styles.infoItem}>
              <div style={styles.infoLabel}>{label}</div>
              <div style={styles.infoValue}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <p style={{ margin: 0, fontSize: 14, color: "#16a34a" }}>
          <strong>What you'll configure:</strong> Team members → Approval workflow → AI settings.
          You can change any of these later from your Settings.
        </p>
      </div>
    </div>
  );
}

// ─── Step 2 – Team Members ────────────────────────────────────────────────────

function StepTeamMembers({ pendingUsers, activeUsers, onInvite, onDelete, inviteResult, inviting, error }) {
  const [form, setForm] = useState({ email: "", role: "program_manager", full_name: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onInvite(form);
    setForm({ email: "", role: "program_manager", full_name: "" });
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={styles.stepTitle}>Invite Team Members</h2>
      <p style={styles.stepSubtitle}>Add your team to collaborate within your workspace.</p>

      {/* Invite Form */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Invite New Members</h3>
        {error && <div style={styles.errorBox}>{error}</div>}
        {inviteResult && (
          <div style={styles.successBox}>
            <strong>Invite sent!</strong> Share these credentials:
            <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 13 }}>
              Email: <strong>{inviteResult.email}</strong> &nbsp;|&nbsp;
              Temp Password: <strong>{inviteResult.temp_password}</strong>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email" required
              placeholder="member@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="Optional"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={styles.label}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={styles.input}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={inviting} style={{ ...styles.btnPrimary, height: 40, alignSelf: "flex-end" }}>
            {inviting ? "Sending…" : "Send Invite"}
          </button>
        </form>
      </div>

      {/* Pending Invites */}
      {pendingUsers.length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h3 style={styles.sectionTitle}>Pending Invites</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHead}>
                {["Email", "Role", "Status", ""].map(h => <th key={h} style={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(u => (
                <tr key={u.id} style={styles.tableRow}>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}><RoleBadge role={u.role} /></td>
                  <td style={styles.td}><span style={styles.badgePending}>Invitation Sent…</span></td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button onClick={() => onDelete(u.id)} style={styles.btnDanger}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active Members */}
      {activeUsers.length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h3 style={styles.sectionTitle}>Active Team Members</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHead}>
                {["Name", "Role", "Last Active"].map(h => <th key={h} style={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeUsers.map(u => (
                <tr key={u.id} style={styles.tableRow}>
                  <td style={styles.td}>{u.full_name}</td>
                  <td style={styles.td}><RoleBadge role={u.role} /></td>
                  <td style={styles.td}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingUsers.length === 0 && activeUsers.length === 0 && (
        <div style={{ ...styles.card, marginTop: 16, textAlign: "center", color: "#9ca3af", padding: 32 }}>
          No team members yet. You can skip this step and invite them later.
        </div>
      )}
    </div>
  );
}

// ─── Step 3 – Workflow ────────────────────────────────────────────────────────

function StepWorkflow({ workflowType, setWorkflowType, rules, setRules, escalationDays, setEscalationDays }) {
  const workflows = [
    {
      id: "standard",
      label: "Standard (3 Levels)",
      steps: ["PM", "Director", "Finance"],
      colors: ["#3b82f6", "#8b5cf6", "#8b5cf6"],
    },
    {
      id: "extended",
      label: "Extended (5 Levels)",
      steps: ["PM", "PGM", "Director", "Finance", "+"],
      colors: ["#3b82f6", "#a78bfa", "#f97316", "#6b7280", "#9ca3af"],
      description: "Additional levels for complex workflows",
    },
  ];

  const ruleLabels = {
    sequential:    "Require sequential approval",
    fast_track:    "Allow fast track approval for Directors",
    notify_pm:     "Notify Program Managers when decision is made",
    reminders:     "Send reminders for pending approvals",
    auto_escalate: "Automatically escalate overdue approvals",
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h2 style={styles.stepTitle}>Workflow Settings</h2>
      <p style={styles.stepSubtitle}>Define and customize your grant approval workflow.</p>

      {/* Workflow type selection */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Select Approval Workflow</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {workflows.map(wf => (
            <div
              key={wf.id}
              onClick={() => setWorkflowType(wf.id)}
              style={{
                padding: 20, borderRadius: 10, cursor: "pointer",
                border: `2px solid ${workflowType === wf.id ? "#4f46e5" : "#e5e7eb"}`,
                background: workflowType === wf.id ? "#f5f3ff" : "#fff",
                position: "relative",
              }}
            >
              {workflowType === wf.id && (
                <div style={{ position: "absolute", top: 12, right: 12, color: "#4f46e5", fontSize: 18 }}>✓</div>
              )}
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{wf.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                {wf.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: wf.colors[i], color: "#fff",
                    }}>{step}</span>
                    {i < wf.steps.length - 1 && <span style={{ color: "#9ca3af", fontSize: 12 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
              {wf.description && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>{wf.description}</div>
              )}
              {workflowType === wf.id && (
                <button style={{ ...styles.btnOutline, marginTop: 12, fontSize: 12, padding: "4px 12px" }}
                  onClick={e => e.stopPropagation()}>
                  ⚙ Customize Steps
                </button>
              )}
            </div>
          ))}
        </div>
        {/* Custom option */}
        <div
          onClick={() => setWorkflowType("custom")}
          style={{
            padding: "14px 20px", borderRadius: 10, cursor: "pointer",
            border: `2px solid ${workflowType === "custom" ? "#4f46e5" : "#e5e7eb"}`,
            background: workflowType === "custom" ? "#f5f3ff" : "#fff",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 18 }}>≡</span> Custom Workflow
          </div>
          <span style={{ color: "#4f46e5", fontSize: 14 }}>Configure Steps →</span>
        </div>
      </div>

      {/* Workflow rules */}
      <div style={{ ...styles.card, marginTop: 16 }}>
        <h3 style={styles.sectionTitle}>Workflow Rules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(ruleLabels).map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={rules[key]}
                  onChange={() => setRules(r => ({ ...r, [key]: !r[key] }))}
                  style={{ width: 18, height: 18, accentColor: "#4f46e5" }}
                />
                <span style={{ fontSize: 14 }}>{label}</span>
              </label>
            ))}
          </div>
          <div style={{
            padding: "16px 20px", background: "#f9fafb", borderRadius: 8,
            border: "1px solid #e5e7eb", alignSelf: "flex-start", minWidth: 180,
          }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Escalation timer</div>
            <select
              value={escalationDays}
              onChange={e => setEscalationDays(Number(e.target.value))}
              style={{ ...styles.input, marginBottom: 8 }}
            >
              {[1, 2, 3, 5, 7, 14].map(d => (
                <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Escalate pending approval to the next level after {escalationDays} day{escalationDays > 1 ? "s" : ""}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 – AI & System ─────────────────────────────────────────────────────

function StepAI({ aiEnabled, setAiEnabled, aiModel, setAiModel, promptEngineering, setPromptEngineering, prompts, setPrompts }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [addingNew, setAddingNew] = useState(false);

  const samplePrompt = "Summarize key terms and conditions in grant agreements. Focus on compliance criteria and highlight any potential risks.";

  const handleEdit = (i) => { setEditingIdx(i); setEditText(prompts[i]); };
  const handleSaveEdit = () => {
    const updated = [...prompts];
    updated[editingIdx] = editText;
    setPrompts(updated);
    setEditingIdx(null);
  };
  const handleDelete = (i) => setPrompts(prompts.filter((_, idx) => idx !== i));
  const handleAddPrompt = () => {
    if (newPrompt.trim()) { setPrompts([...prompts, newPrompt.trim()]); setNewPrompt(""); setAddingNew(false); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={styles.stepTitle}>AI Configuration</h2>
      <p style={styles.stepSubtitle}>Enable and customize AI to assist with your agreements and workflows.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Left column */}
        <div>
          {/* AI Copilot toggle */}
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Copilot</h3>
              <Toggle value={aiEnabled} onChange={setAiEnabled} />
            </div>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8, marginBottom: 16 }}>
              Enable AI Copilot assistance for your organization.
            </p>
            {["Smart grant suggestions", "Risk and compliance analysis", "Document intelligence"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* AI Model selection */}
          <div style={{ ...styles.card, marginTop: 16 }}>
            <h3 style={styles.sectionTitle}>AI Model Selection</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {AI_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setAiModel(m.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                    border: `2px solid ${aiModel === m.id ? "#4f46e5" : "#e5e7eb"}`,
                    background: aiModel === m.id ? "#f5f3ff" : "#fff",
                    color: aiModel === m.id ? "#4f46e5" : "#374151",
                    fontSize: 14,
                  }}
                >
                  <span>{m.icon}</span> {m.label}
                  {m.id !== "anthropic" && <span style={{ fontSize: 11, color: "#9ca3af" }}>▼</span>}
                </button>
              ))}
              <button style={{ ...styles.btnOutline, padding: "8px 16px" }}>Manage API Keys</button>
            </div>
          </div>

          {/* Prompt Management */}
          <div style={{ ...styles.card, marginTop: 16 }}>
            <h3 style={styles.sectionTitle}>Copilot Prompt Management</h3>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 8 }}>
              <input
                type="checkbox" checked={promptEngineering}
                onChange={() => setPromptEngineering(v => !v)}
                style={{ width: 18, height: 18, accentColor: "#4f46e5" }}
              />
              <span style={{ fontWeight: 600 }}>Enable AI Prompt Engineering</span>
            </label>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Customize Copilot instructions to align with your organization's goals.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prompts.map((p, i) => (
                <div key={i} style={styles.promptRow}>
                  {editingIdx === i ? (
                    <input
                      value={editText} onChange={e => setEditText(e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                      autoFocus
                    />
                  ) : (
                    <span style={{ flex: 1, fontSize: 14 }}>{p}</span>
                  )}
                  <div style={{ display: "flex", gap: 6 }}>
                    {editingIdx === i ? (
                      <button onClick={handleSaveEdit} style={styles.btnIconGreen}>✓</button>
                    ) : (
                      <button onClick={() => handleEdit(i)} style={styles.btnIcon}>✏</button>
                    )}
                    <button onClick={() => handleDelete(i)} style={styles.btnIconRed}>🗑</button>
                  </div>
                </div>
              ))}
            </div>

            {addingNew ? (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
                  placeholder="Enter new prompt…"
                  style={{ ...styles.input, flex: 1 }}
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleAddPrompt()}
                />
                <button onClick={handleAddPrompt} style={styles.btnPrimary}>Add</button>
                <button onClick={() => { setAddingNew(false); setNewPrompt(""); }} style={styles.btnOutline}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingNew(true)} style={{ ...styles.btnOutline, marginTop: 12 }}>
                + Add New Prompt
              </button>
            )}
          </div>
        </div>

        {/* Right column – sample prompt card */}
        <div style={{ ...styles.card, alignSelf: "flex-start" }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Sample Copilot Prompt</div>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{samplePrompt}</p>
          <button style={{ ...styles.btnOutline, marginTop: 16, width: "100%" }}>Edit Prompts</button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Component ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 26, borderRadius: 13, cursor: "pointer",
        background: value ? "#4f46e5" : "#d1d5db",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3,
        left: value ? 24 : 4, transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const colors = {
    director:        { bg: "#ede9fe", color: "#6d28d9" },
    program_manager: { bg: "#dbeafe", color: "#1d4ed8" },
    project_manager: { bg: "#dcfce7", color: "#15803d" },
  };
  const c = colors[role] || { bg: "#f3f4f6", color: "#374151" };
  const label = role?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>
      {label}
    </span>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function SetupWizard({ user }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 2
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers]   = useState([]);
  const [inviting, setInviting]         = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError]   = useState("");

  // Step 3
  const [workflowType, setWorkflowType]     = useState("standard");
  const [rules, setRules]                   = useState(DEFAULT_RULES);
  const [escalationDays, setEscalationDays] = useState(3);

  // Step 4
  const [aiEnabled, setAiEnabled]                 = useState(true);
  const [aiModel, setAiModel]                     = useState("openai");
  const [promptEngineering, setPromptEngineering] = useState(true);
  const [prompts, setPrompts]                     = useState(DEFAULT_PROMPTS);

  const token = () => localStorage.getItem("token");

  useEffect(() => { if (step === 2) fetchUsers(); }, [step]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/users`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data.pending || []);
        setActiveUsers(data.active  || []);
      }
    } catch (_) {}
  };

  const handleInvite = async (form) => {
    setInviting(true);
    setInviteError("");
    setInviteResult(null);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to invite");
      setInviteResult(data);
      fetchUsers();
    } catch (e) {
      setInviteError(e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/tenants/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      fetchUsers();
    } catch (_) {}
  };

  const handleNext = async () => {
    setError("");
    if (step === 3) {
      // Save workflow config silently
      try {
        await fetch(`${API_CONFIG.BASE_URL}/api/tenants/workflow-config`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ type: workflowType, rules, escalation_days: escalationDays }),
        });
      } catch (_) {}
    }
    setStep(s => s + 1);
  };

  const handleLaunch = async () => {
    setSaving(true);
    setError("");
    try {
      // Save AI config
      await fetch(`${API_CONFIG.BASE_URL}/api/tenants/ai-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ enabled: aiEnabled, model: aiModel, prompt_engineering: promptEngineering, prompts }),
      });

      // Mark setup complete
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/setup-complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed to complete setup");

      // Update localStorage then hard-reload for fresh React state
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.setup_completed = true;
      localStorage.setItem("user", JSON.stringify(userData));
      window.location.href = "/app/dashboard";
    } catch (e) {
      setError(e.message || "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0 }}>Saple AI</h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Workspace Setup</p>
        </div>

        <ProgressBar step={step} />

        {/* Step content */}
        {step === 1 && <StepOrganization user={user} />}
        {step === 2 && (
          <StepTeamMembers
            pendingUsers={pendingUsers} activeUsers={activeUsers}
            onInvite={handleInvite} onDelete={handleDeleteUser}
            inviteResult={inviteResult} inviting={inviting} error={inviteError}
          />
        )}
        {step === 3 && (
          <StepWorkflow
            workflowType={workflowType} setWorkflowType={setWorkflowType}
            rules={rules} setRules={setRules}
            escalationDays={escalationDays} setEscalationDays={setEscalationDays}
          />
        )}
        {step === 4 && (
          <StepAI
            aiEnabled={aiEnabled} setAiEnabled={setAiEnabled}
            aiModel={aiModel} setAiModel={setAiModel}
            promptEngineering={promptEngineering} setPromptEngineering={setPromptEngineering}
            prompts={prompts} setPrompts={setPrompts}
          />
        )}

        {/* Error */}
        {error && <div style={{ ...styles.errorBox, marginTop: 20, maxWidth: 500, margin: "20px auto 0" }}>{error}</div>}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, maxWidth: 900, margin: "40px auto 0" }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            style={{ ...styles.btnOutline, visibility: step === 1 ? "hidden" : "visible" }}
          >
            ← Back
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {step < 4 && (
              <>
                {step === 2 && (
                  <button onClick={handleNext} style={styles.btnOutline}>
                    Skip for now
                  </button>
                )}
                <button onClick={handleNext} style={styles.btnPrimary}>
                  {step === 3 ? "Save & Continue →" : "Continue →"}
                </button>
              </>
            )}
            {step === 4 && (
              <button onClick={handleLaunch} disabled={saving} style={{ ...styles.btnPrimary, padding: "12px 32px", fontSize: 16 }}>
                {saving ? "Setting up…" : "Launch Workspace →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 50%, #e0f2fe 100%)",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "40px 20px",
  },
  container: {
    background: "#fff", borderRadius: 16, padding: 48,
    width: "100%", maxWidth: 960,
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
  },
  stepTitle: { fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 8px 0", textAlign: "center" },
  stepSubtitle: { color: "#6b7280", fontSize: 15, textAlign: "center", margin: "0 0 24px 0" },
  card: {
    background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px 0" },
  infoItem: { background: "#f9fafb", borderRadius: 8, padding: "12px 16px" },
  infoLabel: { fontSize: 12, color: "#9ca3af", fontWeight: 500, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: 600, color: "#111827" },
  orgIcon: {
    width: 56, height: 56, borderRadius: 12,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, fontWeight: 800, flexShrink: 0,
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { borderBottom: "2px solid #f3f4f6" },
  tableRow: { borderBottom: "1px solid #f9fafb" },
  th: { padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#9ca3af", textAlign: "left" },
  td: { padding: "12px 12px", fontSize: 14 },
  promptRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa",
  },
  badgePending: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#fef9c3", color: "#854d0e" },
  errorBox: { background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 14 },
  successBox: { background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 16, border: "1px solid #bbf7d0" },
  btnPrimary: { padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnOutline: { padding: "10px 24px", background: "#fff", color: "#4f46e5", border: "1px solid #4f46e5", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnDanger: { padding: "5px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnIcon: { padding: "4px 8px", background: "#f3f4f6", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  btnIconGreen: { padding: "4px 8px", background: "#dcfce7", color: "#16a34a", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  btnIconRed: { padding: "4px 8px", background: "#fee2e2", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
};
