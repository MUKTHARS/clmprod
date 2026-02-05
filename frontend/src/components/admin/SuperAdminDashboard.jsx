// C:\saple.ai\POC\frontend\src\components\admin\SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Settings,
  FileText,
  BarChart3,
  Activity,
  Key,
  Building,
  Mail,
  Phone,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  ChevronRight,
  UserPlus,
  Lock,
  Unlock,
  Home
} from 'lucide-react';
import API_CONFIG from '../../config';
import './SuperAdminDashboard.css';
function SuperAdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const perPage = 10;

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'modules') {
      fetchModules();
    }
  }, [activeTab, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/users?skip=${(page - 1) * perPage}&limit=${perPage}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleToggleActive = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="super-admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>GrantOS Admin Portal</h1>
          <p className="subtitle">System Administration & Management</p>
        </div>
        <div className="header-right">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            <Home size={16} />
            Back to Main Dashboard
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>4</h3>
            <p>Roles Defined</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>{modules.length}</h3>
            <p>System Modules</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>100%</h3>
            <p>System Status</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          User Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <Settings size={18} />
          Module Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Key size={18} />
          Role Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <BarChart3 size={18} />
          System Logs
        </button>
      </div>

      {/* Content Area */}
      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="users-management">
            <div className="section-header">
              <h2>User Management</h2>
              <div className="header-actions">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
                  />
                </div>
                <button className="btn-create" onClick={handleCreateUser}>
                  <UserPlus size={16} />
                  Create New User
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spinner" />
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>First Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>User Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id}>
                        <td>{(page - 1) * perPage + index + 1}</td>
                        <td>
                          <div className="user-info">
                            <div className="user-name">{user.first_name || 'N/A'}</div>
                          </div>
                        </td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className="user-type-badge">
                            {user.user_type}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action"
                              onClick={() => handleEditUser(user)}
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn-action"
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            <button
                              className="btn-action delete"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalUsers > perPage && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {page} of {Math.ceil(totalUsers / perPage)}
                    </span>
                    <button
                      className="page-btn"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(totalUsers / perPage)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="modules-management">
            <div className="section-header">
              <h2>Module Management</h2>
              <button className="btn-create" onClick={() => setShowModuleModal(true)}>
                <Plus size={16} />
                Add Module
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spinner" />
                <p>Loading modules...</p>
              </div>
            ) : (
              <div className="modules-grid">
                {modules.map((module) => (
                  <div key={module.id} className="module-card">
                    <div className="module-header">
                      <h3>{module.name}</h3>
                      <span className={`status-badge ${module.is_active ? 'active' : 'inactive'}`}>
                        {module.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="module-description">{module.description || 'No description'}</p>
                    <div className="module-footer">
                      <span className="module-date">
                        Created: {formatDate(module.created_at)}
                      </span>
                      <button className="btn-action">
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="roles-management">
            <h2>Role Management</h2>
            <p>Configure permissions for each role</p>
            {/* Role management implementation */}
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSuccess={fetchUsers}
        />
      )}

      {/* Create Module Modal */}
      {showModuleModal && (
        <ModuleModal
          onClose={() => setShowModuleModal(false)}
          onSuccess={fetchModules}
        />
      )}
    </div>
  );
}

// User Modal Component - UPDATED WITH PASSWORD FIELD
function UserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    email: '',
    phone: '',
    username: '',
    password: '', // Always include password field
    department: '',
    role: 'project_manager',
    user_type: 'internal'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company: user.company || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        password: '', // Leave password blank for existing users
        department: user.department || '',
        role: user.role || 'project_manager',
        user_type: user.user_type || 'internal'
      });
    } else {
      // Reset form for new user
      setFormData({
        first_name: '',
        last_name: '',
        company: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        department: '',
        role: 'project_manager',
        user_type: 'internal'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = user 
        ? `${API_CONFIG.BASE_URL}/api/admin/users/${user.id}`
        : `${API_CONFIG.BASE_URL}/api/admin/users`;
      
      const method = user ? 'PUT' : 'POST';

      // Prepare data for API
      const apiData = { ...formData };
      
      // If updating user and password is empty, remove it from the request
      if (user && !apiData.password) {
        delete apiData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
        alert(user ? 'User updated successfully!' : 'User created successfully!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{user ? 'Edit User' : 'Create New User'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              
              {/* Password field - ALWAYS SHOW */}
              <div className="form-group">
                <label>{user ? 'Password (Leave blank to keep current)' : 'Password *'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={user ? "Enter new password or leave blank" : "Enter password"}
                  required={!user} // Required only for new users
                />
                {user && (
                  <small className="form-hint">Leave blank if you don't want to change the password</small>
                )}
              </div>
              
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="project_manager">Project Manager</option>
                  <option value="program_manager">Program Manager</option>
                  <option value="director">Director</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>User Type *</label>
                <select
                  value={formData.user_type}
                  onChange={(e) => setFormData({...formData, user_type: e.target.value})}
                  required
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={14} className="spinning" />
                  {user ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                user ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Module Modal Component
function ModuleModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add New Module</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Module Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;

// // C:\saple.ai\POC\frontend\src\components\admin\SuperAdminDashboard.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Users,
//   Shield,
//   Settings,
//   FileText,
//   BarChart3,
//   Activity,
//   Key,
//   Building,
//   Mail,
//   Phone,
//   Edit,
//   Trash2,
//   Plus,
//   Search,
//   Filter,
//   RefreshCw,
//   CheckCircle,
//   XCircle,
//   Eye,
//   MoreVertical,
//   ChevronRight,
//   UserPlus,
//   Lock,
//   Unlock,
//   Home
// } from 'lucide-react';
// import API_CONFIG from '../../config';
// import './SuperAdminDashboard.css';
// function SuperAdminDashboard({ user }) {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('users');
//   const [users, setUsers] = useState([]);
//   const [modules, setModules] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showUserModal, setShowUserModal] = useState(false);
//   const [showModuleModal, setShowModuleModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [page, setPage] = useState(1);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const perPage = 10;

//   useEffect(() => {
//     if (activeTab === 'users') {
//       fetchUsers();
//     } else if (activeTab === 'modules') {
//       fetchModules();
//     }
//   }, [activeTab, page]);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `${API_CONFIG.BASE_URL}/api/admin/users?skip=${(page - 1) * perPage}&limit=${perPage}&search=${searchTerm}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.ok) {
//         const data = await response.json();
//         setUsers(data.users);
//         setTotalUsers(data.total);
//       }
//     } catch (error) {
//       console.error('Failed to fetch users:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchModules = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/modules`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setModules(data);
//       }
//     } catch (error) {
//       console.error('Failed to fetch modules:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateUser = () => {
//     setSelectedUser(null);
//     setShowUserModal(true);
//   };

//   const handleEditUser = (user) => {
//     setSelectedUser(user);
//     setShowUserModal(true);
//   };

//   const handleToggleActive = async (userId, currentStatus) => {
//     if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
//       return;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}/toggle-active`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         fetchUsers();
//       }
//     } catch (error) {
//       console.error('Failed to toggle user status:', error);
//     }
//   };

//   const handleDeleteUser = async (userId) => {
//     if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
//       return;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         fetchUsers();
//       }
//     } catch (error) {
//       console.error('Failed to delete user:', error);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   return (
//     <div className="super-admin-dashboard">
//       {/* Header */}
//       <div className="admin-header">
//         <div className="header-left">
//           <h1>GrantOS Admin Portal</h1>
//           <p className="subtitle">System Administration & Management</p>
//         </div>
//         <div className="header-right">
//           <button className="btn-back" onClick={() => navigate('/dashboard')}>
//             <Home size={16} />
//             Back to Main Dashboard
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="admin-stats">
//         <div className="stat-card">
//           <div className="stat-icon">
//             <Users size={24} />
//           </div>
//           <div className="stat-content">
//             <h3>{totalUsers}</h3>
//             <p>Total Users</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon">
//             <Shield size={24} />
//           </div>
//           <div className="stat-content">
//             <h3>4</h3>
//             <p>Roles Defined</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon">
//             <FileText size={24} />
//           </div>
//           <div className="stat-content">
//             <h3>{modules.length}</h3>
//             <p>System Modules</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon">
//             <Activity size={24} />
//           </div>
//           <div className="stat-content">
//             <h3>100%</h3>
//             <p>System Status</p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation Tabs */}
//       <div className="admin-tabs">
//         <button
//           className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
//           onClick={() => setActiveTab('users')}
//         >
//           <Users size={18} />
//           User Management
//         </button>
//         <button
//           className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
//           onClick={() => setActiveTab('modules')}
//         >
//           <Settings size={18} />
//           Module Management
//         </button>
//         <button
//           className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
//           onClick={() => setActiveTab('roles')}
//         >
//           <Key size={18} />
//           Role Management
//         </button>
//         <button
//           className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
//           onClick={() => setActiveTab('logs')}
//         >
//           <BarChart3 size={18} />
//           System Logs
//         </button>
//       </div>

//       {/* Content Area */}
//       <div className="admin-content">
//         {activeTab === 'users' && (
//           <div className="users-management">
//             <div className="section-header">
//               <h2>User Management</h2>
//               <div className="header-actions">
//                 <div className="search-box">
//                   <Search size={16} />
//                   <input
//                     type="text"
//                     placeholder="Search users..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
//                   />
//                 </div>
//                 <button className="btn-create" onClick={handleCreateUser}>
//                   <UserPlus size={16} />
//                   Create New User
//                 </button>
//               </div>
//             </div>

//             {loading ? (
//               <div className="loading-state">
//                 <RefreshCw className="spinner" />
//                 <p>Loading users...</p>
//               </div>
//             ) : (
//               <div className="users-table-container">
//                 <table className="users-table">
//                   <thead>
//                     <tr>
//                       <th>S.No</th>
//                       <th>First Name</th>
//                       <th>Username</th>
//                       <th>Email</th>
//                       <th>Role</th>
//                       <th>User Type</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {users.map((user, index) => (
//                       <tr key={user.id}>
//                         <td>{(page - 1) * perPage + index + 1}</td>
//                         <td>
//                           <div className="user-info">
//                             <div className="user-name">{user.first_name || 'N/A'}</div>
//                           </div>
//                         </td>
//                         <td>{user.username}</td>
//                         <td>{user.email}</td>
//                         <td>
//                           <span className={`role-badge ${user.role}`}>
//                             {user.role}
//                           </span>
//                         </td>
//                         <td>
//                           <span className="user-type-badge">
//                             {user.user_type}
//                           </span>
//                         </td>
//                         <td>
//                           <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
//                             {user.is_active ? 'Active' : 'Inactive'}
//                           </span>
//                         </td>
//                         <td>
//                           <div className="action-buttons">
//                             <button
//                               className="btn-action"
//                               onClick={() => handleEditUser(user)}
//                               title="Edit"
//                             >
//                               <Edit size={14} />
//                             </button>
//                             <button
//                               className="btn-action"
//                               onClick={() => handleToggleActive(user.id, user.is_active)}
//                               title={user.is_active ? 'Deactivate' : 'Activate'}
//                             >
//                               {user.is_active ? <Lock size={14} /> : <Unlock size={14} />}
//                             </button>
//                             <button
//                               className="btn-action delete"
//                               onClick={() => handleDeleteUser(user.id)}
//                               title="Delete"
//                             >
//                               <Trash2 size={14} />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>

//                 {/* Pagination */}
//                 {totalUsers > perPage && (
//                   <div className="pagination">
//                     <button
//                       className="page-btn"
//                       onClick={() => setPage(p => Math.max(1, p - 1))}
//                       disabled={page === 1}
//                     >
//                       Previous
//                     </button>
//                     <span className="page-info">
//                       Page {page} of {Math.ceil(totalUsers / perPage)}
//                     </span>
//                     <button
//                       className="page-btn"
//                       onClick={() => setPage(p => p + 1)}
//                       disabled={page >= Math.ceil(totalUsers / perPage)}
//                     >
//                       Next
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'modules' && (
//           <div className="modules-management">
//             <div className="section-header">
//               <h2>Module Management</h2>
//               <button className="btn-create" onClick={() => setShowModuleModal(true)}>
//                 <Plus size={16} />
//                 Add Module
//               </button>
//             </div>

//             {loading ? (
//               <div className="loading-state">
//                 <RefreshCw className="spinner" />
//                 <p>Loading modules...</p>
//               </div>
//             ) : (
//               <div className="modules-grid">
//                 {modules.map((module) => (
//                   <div key={module.id} className="module-card">
//                     <div className="module-header">
//                       <h3>{module.name}</h3>
//                       <span className={`status-badge ${module.is_active ? 'active' : 'inactive'}`}>
//                         {module.is_active ? 'Active' : 'Inactive'}
//                       </span>
//                     </div>
//                     <p className="module-description">{module.description || 'No description'}</p>
//                     <div className="module-footer">
//                       <span className="module-date">
//                         Created: {formatDate(module.created_at)}
//                       </span>
//                       <button className="btn-action">
//                         <Edit size={14} />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'roles' && (
//           <div className="roles-management">
//             <h2>Role Management</h2>
//             <p>Configure permissions for each role</p>
//             {/* Role management implementation */}
//           </div>
//         )}
//       </div>

//       {/* Create/Edit User Modal */}
//       {showUserModal && (
//         <UserModal
//           user={selectedUser}
//           onClose={() => {
//             setShowUserModal(false);
//             setSelectedUser(null);
//           }}
//           onSuccess={fetchUsers}
//         />
//       )}

//       {/* Create Module Modal */}
//       {showModuleModal && (
//         <ModuleModal
//           onClose={() => setShowModuleModal(false)}
//           onSuccess={fetchModules}
//         />
//       )}
//     </div>
//   );
// }

// // User Modal Component
// function UserModal({ user, onClose, onSuccess }) {
//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     company: '',
//     email: '',
//     phone: '',
//     username: '',
//     password: '',
//     department: '',
//     role: 'project_manager',
//     user_type: 'internal'
//   });
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (user) {
//       setFormData({
//         first_name: user.first_name || '',
//         last_name: user.last_name || '',
//         company: user.company || '',
//         email: user.email || '',
//         phone: user.phone || '',
//         username: user.username || '',
//         password: '',
//         department: user.department || '',
//         role: user.role || 'project_manager',
//         user_type: user.user_type || 'internal'
//       });
//     }
//   }, [user]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const token = localStorage.getItem('token');
//       const url = user 
//         ? `${API_CONFIG.BASE_URL}/api/admin/users/${user.id}`
//         : `${API_CONFIG.BASE_URL}/api/admin/users`;
      
//       const method = user ? 'PUT' : 'POST';

//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(formData)
//       });

//       if (response.ok) {
//         onSuccess();
//         onClose();
//       } else {
//         const error = await response.json();
//         alert(error.detail || 'Operation failed');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       alert('Operation failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <div className="modal-header">
//           <h3>{user ? 'Edit User' : 'Create New User'}</h3>
//           <button className="modal-close" onClick={onClose}>×</button>
//         </div>
        
//         <form onSubmit={handleSubmit}>
//           <div className="modal-body">
//             <div className="form-grid">
//               <div className="form-group">
//                 <label>First Name *</label>
//                 <input
//                   type="text"
//                   value={formData.first_name}
//                   onChange={(e) => setFormData({...formData, first_name: e.target.value})}
//                   required
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Last Name</label>
//                 <input
//                   type="text"
//                   value={formData.last_name}
//                   onChange={(e) => setFormData({...formData, last_name: e.target.value})}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Company</label>
//                 <input
//                   type="text"
//                   value={formData.company}
//                   onChange={(e) => setFormData({...formData, company: e.target.value})}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Email Address *</label>
//                 <input
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => setFormData({...formData, email: e.target.value})}
//                   required
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Phone</label>
//                 <input
//                   type="tel"
//                   value={formData.phone}
//                   onChange={(e) => setFormData({...formData, phone: e.target.value})}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Username *</label>
//                 <input
//                   type="text"
//                   value={formData.username}
//                   onChange={(e) => setFormData({...formData, username: e.target.value})}
//                   required
//                 />
//               </div>
              
//               {!user && (
//                 <div className="form-group">
//                   <label>Password *</label>
//                   <input
//                     type="password"
//                     value={formData.password}
//                     onChange={(e) => setFormData({...formData, password: e.target.value})}
//                     required={!user}
//                   />
//                 </div>
//               )}
              
//               <div className="form-group">
//                 <label>Department</label>
//                 <input
//                   type="text"
//                   value={formData.department}
//                   onChange={(e) => setFormData({...formData, department: e.target.value})}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label>Role *</label>
//                 <select
//                   value={formData.role}
//                   onChange={(e) => setFormData({...formData, role: e.target.value})}
//                   required
//                 >
//                   <option value="project_manager">Project Manager</option>
//                   <option value="program_manager">Program Manager</option>
//                   <option value="director">Director</option>
//                   <option value="super_admin">Super Admin</option>
//                 </select>
//               </div>
              
//               <div className="form-group">
//                 <label>User Type *</label>
//                 <select
//                   value={formData.user_type}
//                   onChange={(e) => setFormData({...formData, user_type: e.target.value})}
//                   required
//                 >
//                   <option value="internal">Internal</option>
//                   <option value="external">External</option>
//                 </select>
//               </div>
//             </div>
//           </div>
          
//           <div className="modal-actions">
//             <button type="button" className="btn-secondary" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn-primary" disabled={loading}>
//               {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Module Modal Component
// function ModuleModal({ onClose, onSuccess }) {
//   const [formData, setFormData] = useState({
//     name: '',
//     description: ''
//   });
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/modules`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(formData)
//       });

//       if (response.ok) {
//         onSuccess();
//         onClose();
//       }
//     } catch (error) {
//       console.error('Error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <div className="modal-header">
//           <h3>Add New Module</h3>
//           <button className="modal-close" onClick={onClose}>×</button>
//         </div>
        
//         <form onSubmit={handleSubmit}>
//           <div className="modal-body">
//             <div className="form-group">
//               <label>Module Name *</label>
//               <input
//                 type="text"
//                 value={formData.name}
//                 onChange={(e) => setFormData({...formData, name: e.target.value})}
//                 required
//               />
//             </div>
            
//             <div className="form-group">
//               <label>Description</label>
//               <textarea
//                 value={formData.description}
//                 onChange={(e) => setFormData({...formData, description: e.target.value})}
//                 rows={3}
//               />
//             </div>
//           </div>
          
//           <div className="modal-actions">
//             <button type="button" className="btn-secondary" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn-primary" disabled={loading}>
//               {loading ? 'Creating...' : 'Create Module'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default SuperAdminDashboard;