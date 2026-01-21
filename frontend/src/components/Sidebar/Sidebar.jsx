import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  TrendingUp,
  BarChart3,
  Settings,
  User,
  LogOut,
  Shield,
  Users,
  FileCheck,
  Building,
  Wallet,
  PieChart,
  BookOpen,
  HelpCircle,
  FileBarChart,
  ShieldCheck,
  History,
  MessageSquare,
  Filter,
  Download
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    // Fetch user permissions
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4001/api/user/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };

    if (user) {
      fetchPermissions();
    }
  }, [user]);

  // Menu items based on permissions
  const getMenuItems = () => {
    const allItems = [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: LayoutDashboard, 
        path: '/dashboard', 
        permission: 'can_view_dashboard',
        roles: ['project_manager', 'director', 'program_manager']
      },
      { 
        id: 'contracts', 
        label: 'Contracts', 
        icon: FileText, 
        path: '/contracts', 
        permission: 'can_view_contracts',
        roles: ['project_manager', 'program_manager', 'director']
      },
      { 
        id: 'upload', 
        label: 'Upload', 
        icon: Upload, 
        path: '/upload', 
        permission: 'can_upload',
        roles: ['project_manager', 'director']
      },
      { 
        id: 'review', 
        label: 'Review', 
        icon: FileCheck, 
        path: '/review', 
        permission: 'can_review',
        roles: ['program_manager'],
        badge: true // Shows pending review count
      },
      { 
        id: 'analytics', 
        label: 'Analytics', 
        icon: PieChart, 
        path: '/analytics', 
        permission: 'can_view_analytics',
        roles: ['director', 'program_manager']
      },
      { 
        id: 'reports', 
        label: 'Reports', 
        icon: FileBarChart, 
        path: '/reports', 
        permission: 'can_view_reports',
        roles: ['director', 'program_manager']
      },
      { 
        id: 'risk', 
        label: 'Risk Analysis', 
        icon: ShieldCheck, 
        path: '/risk', 
        permission: 'can_view_risk',
        roles: ['director', 'program_manager']
      },
      { 
        id: 'organizations', 
        label: 'Organizations', 
        icon: Building, 
        path: '/organizations', 
        permission: 'can_view_organizations',
        roles: ['director']
      },
      { 
        id: 'grants', 
        label: 'Grants', 
        icon: Wallet, 
        path: '/grants', 
        permission: 'can_view_grants',
        roles: ['director', 'program_manager']
      },
      { 
        id: 'approvals', 
        label: 'Approvals', 
        icon: Shield, 
        path: '/approvals', 
        permission: 'can_approve',
        roles: ['director'],
        badge: true // Shows pending approvals count
      },
      { 
        id: 'users', 
        label: 'Users', 
        icon: Users, 
        path: '/users', 
        permission: 'can_manage_users',
        roles: ['director']
      },
      { 
        id: 'activity', 
        label: 'Activity Logs', 
        icon: History, 
        path: '/activity', 
        permission: 'can_view_activity_logs',
        roles: ['director']
      },
      { 
        id: 'knowledge', 
        label: 'Knowledge Base', 
        icon: BookOpen, 
        path: '/knowledge', 
        permission: 'can_view_knowledge',
        roles: ['project_manager', 'program_manager', 'director']
      },
      { 
        id: 'help', 
        label: 'Help', 
        icon: HelpCircle, 
        path: '/help', 
        permission: 'can_view_help',
        roles: ['project_manager', 'program_manager', 'director']
      },
      { 
        id: 'settings', 
        label: 'Settings', 
        icon: Settings, 
        path: '/settings', 
        permission: 'can_manage_settings',
        roles: ['director']
      },
      // New workflow-specific items
      { 
        id: 'my-reviews', 
        label: 'My Reviews', 
        icon: MessageSquare, 
        path: '/my-reviews', 
        permission: 'can_review',
        roles: ['program_manager']
      },
      { 
        id: 'pending-approvals', 
        label: 'Pending Approvals', 
        icon: ShieldCheck, 
        path: '/pending-approvals', 
        permission: 'can_approve',
        roles: ['director']
      },

      { 
        id: 'exports', 
        label: 'Exports', 
        icon: Download, 
        path: '/exports', 
        permission: 'can_export',
        roles: ['project_manager', 'program_manager', 'director']
      },
      { 
        id: 'advanced-search', 
        label: 'Advanced Search', 
        icon: Filter, 
        path: '/advanced-search', 
        permission: 'can_view_contracts',
        roles: ['project_manager', 'program_manager', 'director']
      },
      { 
  id: 'director-decisions', 
  label: 'Director Decisions', 
  icon: Shield, 
  path: '/program-manager/director-decisions', 
  permission: 'can_review',
  roles: ['program_manager'],
  badge: true // Shows count of decisions
}
    ];
if (user?.role === 'director') {
    return allItems;
  }
    // Filter items based on user permissions
    return allItems.filter(item => {
      // Check if user has the required permission
      if (permissions[item.permission] !== undefined) {
        return permissions[item.permission];
      }
      // Fallback to role-based filtering
      return item.roles.includes(user?.role || '');
    });
  };

  // Get pending counts for badges
  const getPendingCounts = async (itemId) => {
    if (!itemId) return null;
    
    const token = localStorage.getItem('token');
    
    if (itemId === 'review') {
      try {
        const response = await fetch('http://localhost:4001/api/contracts/status/under_review', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          return data.length;
        }
      } catch (error) {
        console.error('Failed to fetch review count:', error);
      }
    }
    if (itemId === 'director-decisions') {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/program-manager/reviewed-by-director?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.total || data.summary?.total || 0;
    }
  } catch (error) {
    console.error('Failed to fetch director decisions count:', error);
  }
}
    
    if (itemId === 'approvals') {
      try {
        const response = await fetch('http://localhost:4001/api/contracts/status/reviewed', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          return data.length;
        }
      } catch (error) {
        console.error('Failed to fetch approval count:', error);
      }
    }
    
    return null;
  };

  const [badgeCounts, setBadgeCounts] = useState({});

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      const menuItems = getMenuItems();
      const counts = {};
      
      for (const item of menuItems) {
        if (item.badge) {
          const count = await getPendingCounts(item.id);
          if (count > 0) {
            counts[item.id] = count;
          }
        }
      }
      
      setBadgeCounts(counts);
    };
    
    if (user) {
      fetchBadgeCounts();
    }
  }, [user]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => handleNavigation('/dashboard')} title="Grant Analyzer">
          <div className="logo-text">
            <span className="logo-text-primary">GRANT</span>
            <span className="logo-text-secondary">ANALYZER</span>
          </div>
        </div>
      </div>

      <div className="user-profile-section">
        <div className="user-avatar">
          <User size={24} />
        </div>
        <div className="user-info">
          <div className="user-name">{user?.full_name || user?.username || 'Guest'}</div>
          <div className={`user-role role-${user?.role || 'guest'}`}>
            {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'GUEST'}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path || 
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const badgeCount = badgeCounts[item.id];
            
            return (
              <li key={item.id}>
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  title={item.label}
                >
                  <span className="nav-icon">
                    <IconComponent size={22} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {badgeCount && (
                    <span className="nav-badge">{badgeCount}</span>
                  )}
                  {isActive && <span className="nav-indicator" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
        <div className="sidebar-version">
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
