import React, { useState, useEffect } from "react";
import API_CONFIG from "../config";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "team",     label: "Team Members" },
  { id: "workflow", label: "Workflow Settings" },
  { id: "ai",       label: "AI & System" },
];

const ROLES = [
  { value: "director",        label: "Director" },
  { value: "program_manager", label: "Program Manager" },
  { value: "project_manager", label: "Project Manager" },
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

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const map = {
    director:        { bg: "#ede9fe", color: "#6d28d9" },
    program_manager: { bg: "#dbeafe", color: "#1d4ed8" },
    project_manager: { bg: "#dcfce7", color: "#15803d" },
    super_admin:     { bg: "#fef9c3", color: "#854d0e" },
  };
  const c = map[role] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>
      {role?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 48, height: 26, borderRadius: 13, cursor: "pointer",
      background: value ? "#4f46e5" : "#d1d5db",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3,
        left: value ? 24 : 4, transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// ─── Tab: Team Members ────────────────────────────────────────────────────────

function TeamTab() {
  const [form, setForm]               = useState({ email: "", role: "program_manager", full_name: "" });
  const [pendingUsers, setPending]    = useState([]);
  const [activeUsers, setActive]      = useState([]);
  const [inviting, setInviting]       = useState(false);
  const [inviteResult, setResult]     = useState(null);
  const [error, setError]             = useState("");

  const token = () => localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/users`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const d = await res.json();
        setPending(d.pending || []);
        setActive(d.active  || []);
      }
    } catch (_) {}
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to invite");
      setResult(data);
      setForm({ email: "", role: "program_manager", full_name: "" });
      fetchUsers();
    } catch (e) {
      setError(e.message);
    } finally { setInviting(false); }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_CONFIG.BASE_URL}/api/tenants/users/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
    });
    fetchUsers();
  };

  return (
    <div>
      {/* Invite form */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Invite New Member</h3>
        {error      && <div style={s.errorBox}>{error}</div>}
        {inviteResult && (
          <div style={s.successBox}>
            Invited! Share credentials — Email: <strong>{inviteResult.email}</strong> &nbsp;|&nbsp;
            Temp Password: <strong style={{ fontFamily: "monospace" }}>{inviteResult.temp_password}</strong>
          </div>
        )}
        <form onSubmit={handleInvite} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={s.label}>Email Address</label>
            <input type="email" required placeholder="member@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={s.input} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={s.label}>Full Name</label>
            <input type="text" placeholder="Optional"
              value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={s.input} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={s.label}>Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={s.input}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={inviting} style={{ ...s.btnPrimary, height: 40, alignSelf: "flex-end" }}>
            {inviting ? "Sending…" : "Send Invite"}
          </button>
        </form>
      </div>

      {/* Pending */}
      {pendingUsers.length > 0 && (
        <div style={{ ...s.card, marginTop: 16 }}>
          <h3 style={s.cardTitle}>Pending Invites</h3>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {["Email", "Name", "Role", "Status", ""].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {pendingUsers.map(u => (
                <tr key={u.id} style={s.trow}>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.full_name}</td>
                  <td style={s.td}><RoleBadge role={u.role} /></td>
                  <td style={s.td}><span style={s.badgeYellow}>Invitation Sent</span></td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <button onClick={() => handleDelete(u.id)} style={s.btnDanger}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active */}
      <div style={{ ...s.card, marginTop: 16 }}>
        <h3 style={s.cardTitle}>Active Team Members</h3>
        {activeUsers.length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>
            No active members yet. Invite someone above.
          </p>
        ) : (
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {["Name", "Email", "Role", "Last Active"].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {activeUsers.map(u => (
                <tr key={u.id} style={s.trow}>
                  <td style={s.td}>{u.full_name}</td>
                  <td style={{ ...s.td, color: "#6b7280" }}>{u.email}</td>
                  <td style={s.td}><RoleBadge role={u.role} /></td>
                  <td style={s.td}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Workflow ────────────────────────────────────────────────────────────

function WorkflowTab() {
  const [workflowType, setType]         = useState("standard");
  const [rules, setRules]               = useState(DEFAULT_RULES);
  const [escalationDays, setDays]       = useState(3);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  const token = () => localStorage.getItem("token");

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/tenants/workflow-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ type: workflowType, rules, escalation_days: escalationDays }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const workflows = [
    { id: "standard", label: "Standard (3 Levels)",  steps: ["PM", "Director", "Finance"],           colors: ["#3b82f6", "#8b5cf6", "#8b5cf6"] },
    { id: "extended", label: "Extended (5 Levels)",  steps: ["PM", "PGM", "Director", "Finance", "+"], colors: ["#3b82f6", "#a78bfa", "#f97316", "#6b7280", "#9ca3af"], note: "Additional levels for complex workflows" },
  ];

  const ruleLabels = {
    sequential:    "Require sequential approval",
    fast_track:    "Allow fast track approval for Directors",
    notify_pm:     "Notify Program Managers when decision is made",
    reminders:     "Send reminders for pending approvals",
    auto_escalate: "Automatically escalate overdue approvals",
  };

  return (
    <div>
      <div style={s.card}>
        <h3 style={s.cardTitle}>Select Approval Workflow</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {workflows.map(wf => (
            <div key={wf.id} onClick={() => setType(wf.id)} style={{
              padding: 20, borderRadius: 10, cursor: "pointer",
              border: `2px solid ${workflowType === wf.id ? "#4f46e5" : "#e5e7eb"}`,
              background: workflowType === wf.id ? "#f5f3ff" : "#fff",
              position: "relative",
            }}>
              {workflowType === wf.id && <span style={{ position: "absolute", top: 12, right: 12, color: "#4f46e5", fontSize: 18 }}>✓</span>}
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{wf.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                {wf.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: wf.colors[i], color: "#fff" }}>{step}</span>
                    {i < wf.steps.length - 1 && <span style={{ color: "#9ca3af", fontSize: 11 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
              {wf.note && <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>{wf.note}</div>}
            </div>
          ))}
        </div>
        <div onClick={() => setType("custom")} style={{
          padding: "14px 20px", borderRadius: 10, cursor: "pointer",
          border: `2px solid ${workflowType === "custom" ? "#4f46e5" : "#e5e7eb"}`,
          background: workflowType === "custom" ? "#f5f3ff" : "#fff",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontWeight: 600 }}>≡  Custom Workflow</span>
          <span style={{ color: "#4f46e5", fontSize: 14 }}>Configure Steps →</span>
        </div>
      </div>

      <div style={{ ...s.card, marginTop: 16 }}>
        <h3 style={s.cardTitle}>Workflow Rules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(ruleLabels).map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={rules[key]}
                  onChange={() => setRules(r => ({ ...r, [key]: !r[key] }))}
                  style={{ width: 18, height: 18, accentColor: "#4f46e5" }} />
                <span style={{ fontSize: 14 }}>{label}</span>
              </label>
            ))}
          </div>
          <div style={{ padding: "16px 20px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", minWidth: 200 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Escalation timer</div>
            <select value={escalationDays} onChange={e => setDays(Number(e.target.value))} style={s.input}>
              {[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
            </select>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Escalate pending approval after {escalationDays} day{escalationDays > 1 ? "s" : ""}.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, gap: 12, alignItems: "center" }}>
        {saved && <span style={{ color: "#16a34a", fontSize: 14, fontWeight: 600 }}>✓ Saved</span>}
        <button onClick={handleSave} disabled={saving} style={s.btnPrimary}>
          {saving ? "Saving…" : "Save Workflow Settings"}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: AI & System ─────────────────────────────────────────────────────────

function AITab() {
  const [aiEnabled, setEnabled]             = useState(true);
  const [aiModel, setModel]                 = useState("openai");
  const [promptEngineering, setPromptEng]   = useState(true);
  const [prompts, setPrompts]               = useState(DEFAULT_PROMPTS);
  const [editingIdx, setEditingIdx]         = useState(null);
  const [editText, setEditText]             = useState("");
  const [newPrompt, setNewPrompt]           = useState("");
  const [addingNew, setAddingNew]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [saved, setSaved]                   = useState(false);

  const token = () => localStorage.getItem("token");

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/tenants/ai-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ enabled: aiEnabled, model: aiModel, prompt_engineering: promptEngineering, prompts }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const startEdit  = (i) => { setEditingIdx(i); setEditText(prompts[i]); };
  const saveEdit   = () => { const p = [...prompts]; p[editingIdx] = editText; setPrompts(p); setEditingIdx(null); };
  const deleteP    = (i) => setPrompts(prompts.filter((_, idx) => idx !== i));
  const addPrompt  = () => { if (newPrompt.trim()) { setPrompts([...prompts, newPrompt.trim()]); setNewPrompt(""); setAddingNew(false); } };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
      {/* Left column */}
      <div>
        {/* Copilot toggle */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Copilot</h3>
              <p style={{ color: "#6b7280", fontSize: 14, margin: "6px 0 0" }}>Enable AI Copilot assistance for your organization.</p>
            </div>
            <Toggle value={aiEnabled} onChange={setEnabled} />
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {["Smart grant suggestions", "Risk and compliance analysis", "Document intelligence"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model selection */}
        <div style={{ ...s.card, marginTop: 16 }}>
          <h3 style={s.cardTitle}>AI Model Selection</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {AI_MODELS.map(m => (
              <button key={m.id} onClick={() => setModel(m.id)} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
                border: `2px solid ${aiModel === m.id ? "#4f46e5" : "#e5e7eb"}`,
                background: aiModel === m.id ? "#f5f3ff" : "#fff",
                color: aiModel === m.id ? "#4f46e5" : "#374151",
              }}>
                {m.icon} {m.label}
                {m.id !== "anthropic" && <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>}
              </button>
            ))}
            <button style={s.btnOutline}>Manage API Keys</button>
          </div>
        </div>

        {/* Prompt management */}
        <div style={{ ...s.card, marginTop: 16 }}>
          <h3 style={s.cardTitle}>Copilot Prompt Management</h3>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
            <input type="checkbox" checked={promptEngineering} onChange={() => setPromptEng(v => !v)}
              style={{ width: 18, height: 18, accentColor: "#4f46e5" }} />
            <div>
              <div style={{ fontWeight: 600 }}>Enable AI Prompt Engineering</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Customize Copilot instructions to align with your organization's goals.</div>
            </div>
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prompts.map((p, i) => (
              <div key={i} style={s.promptRow}>
                {editingIdx === i ? (
                  <input value={editText} onChange={e => setEditText(e.target.value)}
                    style={{ ...s.input, flex: 1 }} autoFocus
                    onKeyDown={e => e.key === "Enter" && saveEdit()} />
                ) : (
                  <span style={{ flex: 1, fontSize: 14 }}>{p}</span>
                )}
                <div style={{ display: "flex", gap: 4 }}>
                  {editingIdx === i
                    ? <button onClick={saveEdit} style={s.btnIconGreen}>✓</button>
                    : <button onClick={() => startEdit(i)} style={s.btnIcon}>✏</button>}
                  <button onClick={() => deleteP(i)} style={s.btnIconRed}>🗑</button>
                </div>
              </div>
            ))}
          </div>

          {addingNew ? (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
                placeholder="Enter new prompt…" style={{ ...s.input, flex: 1 }}
                autoFocus onKeyDown={e => e.key === "Enter" && addPrompt()} />
              <button onClick={addPrompt} style={s.btnPrimary}>Add</button>
              <button onClick={() => { setAddingNew(false); setNewPrompt(""); }} style={s.btnOutline}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingNew(true)} style={{ ...s.btnOutline, marginTop: 12 }}>
              + Add New Prompt
            </button>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, gap: 12, alignItems: "center" }}>
          {saved && <span style={{ color: "#16a34a", fontSize: 14, fontWeight: 600 }}>✓ Saved</span>}
          <button onClick={handleSave} disabled={saving} style={s.btnPrimary}>
            {saving ? "Saving…" : "Save AI Settings"}
          </button>
        </div>
      </div>

      {/* Right column – sample prompt */}
      <div style={{ ...s.card, position: "sticky", top: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Sample Copilot Prompt</div>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>
          Summarize key terms and conditions in grant agreements. Focus on compliance criteria and highlight any potential risks.
        </p>
        <button style={{ ...s.btnOutline, marginTop: 16, width: "100%" }}>Edit Prompts</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPortalPage({ user }) {
  const [activeTab, setActiveTab] = useState("team");

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Admin Portal</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
          Manage your team, workflow, and AI settings.
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: 28 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 24px", border: "none", background: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 14,
              color: activeTab === tab.id ? "#4f46e5" : "#6b7280",
              borderBottom: `2px solid ${activeTab === tab.id ? "#4f46e5" : "transparent"}`,
              marginBottom: -2,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "team"     && <TeamTab />}
      {activeTab === "workflow" && <WorkflowTab />}
      {activeTab === "ai"       && <AITab />}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const s = {
  card:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  cardTitle:   { fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 16px 0" },
  label:       { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input:       { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box" },
  table:       { width: "100%", borderCollapse: "collapse" },
  thead:       { borderBottom: "2px solid #f3f4f6" },
  trow:        { borderBottom: "1px solid #f9fafb" },
  th:          { padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#9ca3af", textAlign: "left" },
  td:          { padding: "12px 12px", fontSize: 14 },
  promptRow:   { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" },
  errorBox:    { background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 12 },
  successBox:  { background: "#f0fdf4", color: "#15803d", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 12, border: "1px solid #bbf7d0" },
  badgeYellow: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#fef9c3", color: "#854d0e" },
  btnPrimary:  { padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnOutline:  { padding: "10px 24px", background: "#fff", color: "#4f46e5", border: "1px solid #4f46e5", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnDanger:   { padding: "5px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnIcon:     { padding: "4px 8px", background: "#f3f4f6", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  btnIconGreen:{ padding: "4px 8px", background: "#dcfce7", color: "#16a34a", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  btnIconRed:  { padding: "4px 8px", background: "#fee2e2", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
};
