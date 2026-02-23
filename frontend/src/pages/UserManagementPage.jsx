import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import API_CONFIG from '../config';
import './UserManagementPage.css';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  director: 'Director',
  program_manager: 'Program Manager',
  project_manager: 'Project Manager',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function UserManagementPage({ user }) {
  const [pending, setPending] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);

  // Invite form state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('project_manager');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setPending(data.pending || []);
      setActive(data.active || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this user?')) return;
    setRemoving(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove user');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setRemoving(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    setInviteResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/tenants/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invite failed');
      setInviteResult(data);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('project_manager');
      fetchUsers();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const UserTable = ({ users, emptyMsg }) => (
    <table className="ump-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Last Login</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan={6} className="ump-empty">{emptyMsg}</td>
          </tr>
        ) : (
          users.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="ump-name-cell">
                  <div className="ump-avatar">{(u.full_name || u.email).charAt(0).toUpperCase()}</div>
                  <span>{u.full_name || '—'}</span>
                </div>
              </td>
              <td className="ump-email">{u.email}</td>
              <td>
                <span className={`ump-role-badge ump-role-${u.role}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </td>
              <td className="ump-muted">{formatDate(u.last_login)}</td>
              <td>
                <span className={`ump-status ${u.invitation_status === 'pending' ? 'ump-status-pending' : 'ump-status-active'}`}>
                  {u.invitation_status === 'pending' ? 'Pending' : 'Active'}
                </span>
              </td>
              <td>
                <button
                  className="ump-remove-btn"
                  onClick={() => handleRemove(u.id)}
                  disabled={removing === u.id}
                  title="Remove user"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div className="ump-container">
      <div className="ump-header">
        <div className="ump-title-row">
          <Users size={24} />
          <h1>User Management</h1>
        </div>
        <div className="ump-header-actions">
          <button className="ump-refresh-btn" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'ump-spin' : ''} />
            Refresh
          </button>
          <button className="ump-invite-btn" onClick={() => { setShowInvite(!showInvite); setInviteResult(null); setInviteError(''); }}>
            <UserPlus size={16} />
            Invite User
          </button>
        </div>
      </div>

      {showInvite && (
        <div className="ump-invite-panel">
          <h3>Invite a New User</h3>
          {inviteResult && (
            <div className="ump-invite-success">
              <p>User invited! Temporary password: <strong>{inviteResult.temp_password}</strong></p>
              <p className="ump-invite-note">Share this password with {inviteResult.email} — they can change it after first login.</p>
            </div>
          )}
          {inviteError && (
            <div className="ump-invite-error">
              <AlertCircle size={16} /> {inviteError}
            </div>
          )}
          <form onSubmit={handleInvite} className="ump-invite-form">
            <div className="ump-form-row">
              <div className="ump-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="ump-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div className="ump-form-group">
                <label>Role *</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="project_manager">Project Manager</option>
                  <option value="program_manager">Program Manager</option>
                  <option value="director">Director</option>
                </select>
              </div>
            </div>
            <button type="submit" className="ump-invite-submit" disabled={inviting}>
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="ump-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="ump-loading">Loading users...</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="ump-section">
              <h2 className="ump-section-title">Pending Invites <span className="ump-count">{pending.length}</span></h2>
              <UserTable users={pending} emptyMsg="No pending invites" />
            </div>
          )}

          <div className="ump-section">
            <h2 className="ump-section-title">Active Members <span className="ump-count">{active.length}</span></h2>
            <UserTable users={active} emptyMsg="No active members yet" />
          </div>
        </>
      )}
    </div>
  );
}
