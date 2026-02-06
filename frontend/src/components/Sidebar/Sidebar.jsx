import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Settings,
  User,
  LogOut,
  Shield,
  Users,
  FileCheck,
  Archive,
  FolderOpen,
  UserCheck,
  Key, // For super admin icon
  Users as UsersIcon, // For admin portal icon
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import './Sidebar.css';
import API_CONFIG from '../../config';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [permissions, setPermissions] = useState({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    draft: false,
    archive: false,
    admin: false
  });
  const [badgeCounts, setBadgeCounts] = useState({});
  const [isDraftSubmenuActive, setIsDraftSubmenuActive] = useState(false);

  // Memoize the getMenuItems function to prevent recreation on every render
  const getMenuItems = useCallback(() => {
    const userRole = user?.role || '';
    
    if (!userRole) {
      return { allItems: [], regularItems: [], draftParent: null, draftSubmenuItems: [], archiveItems: [], adminItems: [] };
    }

    const allItems = [
      // COMMON ITEMS FOR ALL USERS
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: LayoutDashboard, 
        path: '/dashboard', 
        permission: 'can_view_dashboard',
        roles: ['project_manager', 'director', 'program_manager', 'super_admin']  // Added super_admin
      },
      { 
        id: 'grants', 
        label: 'Grants', 
        icon: FileText, 
        path: '/contracts', 
        permission: 'can_view_contracts',
        roles: ['project_manager', 'program_manager', 'director', 'super_admin']  // Added super_admin
      },
      { 
        id: 'upload', 
        label: 'Upload', 
        icon: Upload, 
        path: '/upload', 
        permission: 'can_upload',
        roles: ['project_manager', 'director', 'super_admin']  // Added super_admin
      },
      
      // PROGRAM MANAGER SPECIFIC ITEMS
      { 
        id: 'review', 
        label: 'Review', 
        icon: FileCheck, 
        path: '/review', 
        permission: 'can_review',
        roles: ['program_manager'],
        badge: true
      },
      { 
        id: 'director-decisions', 
        label: 'Director Decisions', 
        icon: Shield, 
        path: '/program-manager/director-decisions', 
        permission: 'can_review',
        roles: ['program_manager'],
        badge: true
      },
      
      // DIRECTOR SPECIFIC ITEMS
      { 
        id: 'approvals', 
        label: 'Approvals', 
        icon: Shield, 
        path: '/approvals', 
        permission: 'can_approve',
        roles: ['director'],
        badge: true
      },
      { 
        id: 'users', 
        label: 'Users', 
        icon: Users, 
        path: '/users', 
        permission: 'can_manage_users',
        roles: ['director']
      },
      
      // SUPER ADMIN SPECIFIC ITEMS
      { 
        id: 'admin-portal', 
        label: 'Admin Portal', 
        icon: Key, 
        path: '/admin', 
        permission: 'can_manage_all_users',
        roles: ['super_admin'],
        isAdmin: true
      },

      // DRAFT SUBMENU ITEMS (Will be grouped under "Draft" parent)
      { 
        id: 'draft-parent', 
        label: 'Draft', 
        icon: FolderOpen, 
        path: '#', 
        permission: 'can_view_drafts',
        roles: ['project_manager'],
        isDraftParent: true,
        hasSubmenu: true
      },
      { 
        id: 'my-drafts', 
        label: 'My Drafts', 
        icon: null, // No icon for submenu items
        path: '/drafts/my', 
        permission: 'can_view_drafts',
        roles: ['project_manager'],
        isDraftSubmenu: true,
        parentId: 'draft-parent'
      },
      { 
        id: 'assigned-drafts', 
        label: 'Assigned to Me', 
        icon: null, // No icon for submenu items
        path: '/drafts/assigned', 
        permission: 'can_view_assigned_drafts',
        roles: ['project_manager'],
        isDraftSubmenu: true,
        parentId: 'draft-parent'
      },
      
      // ARCHIVE ITEMS
      { 
        id: 'archive', 
        label: 'Archive', 
        icon: Archive, 
        path: '/archive', 
        permission: 'can_view_archive',
        roles: ['project_manager', 'director'],
        isArchiveSection: true
      },
    ];

    // Filter items based on user role
    const filteredItems = allItems.filter(item => {
      // Dashboard is always visible to all roles
      if (item.id === 'dashboard') {
        return true;
      }
      
      // Contracts is always visible to all roles
      if (item.id === 'grants') {
        return true;
      }
      
      // Upload is for project_manager, director, and super_admin
      if (item.id === 'upload') {
        return userRole === 'project_manager' || userRole === 'director' || userRole === 'super_admin';
      }
      
      // Show role-specific items
      return item.roles.includes(userRole);
    });

    // Separate items
    const regularItems = filteredItems.filter(item => !item.isAdmin && !item.isDraftParent && !item.isDraftSubmenu && !item.isArchiveSection);
    const draftParent = filteredItems.find(item => item.isDraftParent);
    const draftSubmenuItems = filteredItems.filter(item => item.isDraftSubmenu);
    const archiveItems = filteredItems.filter(item => item.isArchiveSection);
    const adminItems = filteredItems.filter(item => item.isAdmin);

    return {
      allItems: filteredItems,
      regularItems,
      draftParent,
      draftSubmenuItems,
      archiveItems,
      adminItems
    };
  }, [user?.role]); // Only recreate when user role changes

  // Memoize the menu items
  const menuItems = useMemo(() => getMenuItems(), [getMenuItems]);

  // Get pending counts for badges
  const getPendingCounts = useCallback(async (itemId) => {
    if (!itemId) return null;
    
    const token = localStorage.getItem('token');
    
    try {
      // Use HTTP instead of HTTPS for local development to avoid SSL errors
      const baseUrl = API_CONFIG.BASE_URL.replace('https://', 'http://');
      
      if (itemId === 'review') {
        const response = await fetch(`${baseUrl}/api/contracts/status/under_review`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          return data.length;
        }
      }
      
      if (itemId === 'director-decisions') {
        const response = await fetch(`${baseUrl}/api/contracts/program-manager/reviewed-by-director?limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.total || data.summary?.total || 0;
        }
      }
      
      if (itemId === 'approvals') {
        const response = await fetch(`${baseUrl}/api/contracts/status/reviewed`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          return data.length;
        }
      }
    } catch (error) {
      console.error('Failed to fetch count:', error);
      return null;
    }
    
    return null;
  }, []);

  // Fetch user permissions - FIXED: Added proper dependencies
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        // Use HTTP instead of HTTPS for local development
        const baseUrl = API_CONFIG.BASE_URL.replace('https://', 'http://');
        const response = await fetch(`${baseUrl}/api/user/permissions`, {
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
        // Set default permissions based on user role
        if (user?.role) {
          const defaultPermissions = {
            project_manager: { can_upload: true, can_view_drafts: true },
            program_manager: { can_review: true },
            director: { can_approve: true, can_manage_users: true },
            super_admin: { can_manage_all_users: true }
          };
          setPermissions(defaultPermissions[user.role] || {});
        }
      }
    };

    if (user) {
      fetchPermissions();
    }
  }, [user]); // Only fetch when user changes

  // Fetch badge counts - FIXED: Added proper dependencies
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      const counts = {};
      
      // Only fetch counts for items that have badges
      const badgeItems = menuItems.allItems.filter(item => item.badge);
      
      for (const item of badgeItems) {
        const count = await getPendingCounts(item.id);
        if (count && count > 0) {
          counts[item.id] = count;
        }
      }
      
      setBadgeCounts(counts);
    };
    
    if (user && menuItems.allItems.length > 0) {
      fetchBadgeCounts();
    }
  }, [user, menuItems.allItems, getPendingCounts]); // Added dependencies

  // Check if draft submenu is active - FIXED: Moved inside useEffect
  useEffect(() => {
    const checkDraftSubmenuActive = () => {
      const isActive = menuItems.draftSubmenuItems?.some(item => 
        location.pathname === item.path || location.pathname.startsWith(item.path)
      );
      setIsDraftSubmenuActive(isActive);
      
      // Auto-expand draft menu if a submenu is active
      if (isActive && menuItems.draftParent) {
        setExpandedMenus(prev => ({
          ...prev,
          draft: true
        }));
      }
    };
    
    checkDraftSubmenuActive();
  }, [location.pathname, menuItems.draftSubmenuItems, menuItems.draftParent]);

  const handleNavigation = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const toggleMenu = useCallback((menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  }, []);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [onLogout, navigate]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => handleNavigation('/dashboard')} title="GrantOS">
          <div className="logo-text">
            <span className="logo-text-primary">GRANT</span>
            <span className="logo-text-secondary">OS</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {/* Regular Items */}
          {menuItems.regularItems.map((item) => {
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

          {/* Draft Parent Menu with Dropdown */}
          {menuItems.draftParent && (
            <>
              <div className="nav-section-divider">
                <div className="nav-section-label">DRAFT MANAGEMENT</div>
              </div>
              
              <li key={menuItems.draftParent.id}>
                <button
                  className={`nav-item draft-parent ${expandedMenus.draft || isDraftSubmenuActive ? 'active' : ''}`}
                  onClick={() => toggleMenu('draft')}
                  title={menuItems.draftParent.label}
                >
                  <span className="nav-icon">
                    <FolderOpen size={22} />
                  </span>
                  <span className="nav-label">{menuItems.draftParent.label}</span>
                  <span className="menu-arrow">
                    {expandedMenus.draft ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  {(expandedMenus.draft || isDraftSubmenuActive) && <span className="nav-indicator" />}
                </button>
                
                {/* Draft Submenu */}
                {expandedMenus.draft && menuItems.draftSubmenuItems?.length > 0 && (
                  <ul className="submenu">
                    {menuItems.draftSubmenuItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path || 
                                         location.pathname.startsWith(subItem.path);
                      
                      return (
                        <li key={subItem.id}>
                          <button
                            className={`nav-item submenu-item ${isSubActive ? 'active' : ''}`}
                            onClick={() => handleNavigation(subItem.path)}
                            title={subItem.label}
                          >
                            <span className="nav-icon">
                              {subItem.icon ? <subItem.icon size={18} /> : <div className="submenu-icon-placeholder" />}
                            </span>
                            <span className="nav-label">{subItem.label}</span>
                            {isSubActive && <span className="nav-indicator" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            </>
          )}

          {/* Archive Section */}
          {menuItems.archiveItems?.length > 0 && (
            <>
              <div className="nav-section-divider">
                <div className="nav-section-label">ARCHIVE</div>
              </div>
              
              {menuItems.archiveItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path || 
                                location.pathname.startsWith(item.path);
                
                return (
                  <li key={item.id}>
                    <button
                      className={`nav-item archive-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                      title={item.label}
                    >
                      <span className="nav-icon">
                        <IconComponent size={22} />
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {isActive && <span className="nav-indicator" />}
                    </button>
                  </li>
                );
              })}
            </>
          )}

          {/* Admin Portal Section - Only for super_admin */}
          {menuItems.adminItems?.length > 0 && (
            <>
              <div className="nav-section-divider">
                <div className="nav-section-label">ADMINISTRATION</div>
              </div>
              
              {menuItems.adminItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path || 
                                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                
                return (
                  <li key={item.id}>
                    <button
                      className={`nav-item admin-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                      title={item.label}
                    >
                      <span className="nav-icon">
                        <IconComponent size={22} />
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {isActive && <span className="nav-indicator" />}
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {/* ChatGPT-like user profile with dropdown */}
        <div 
          className="user-profile-bottom"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="user-avatar-bottom">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div className="user-info-bottom">
            <div className="user-name-bottom">{user?.full_name || user?.username || 'Guest User'}</div>
            <div className="user-email-bottom">{user?.email || ''}</div>
            <div className={`user-role-bottom role-${user?.role || 'guest'}`}>
              {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'GUEST'}
            </div>
          </div>
          <div className="user-menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>

          {showUserMenu && (
            <div className="user-dropdown-menu">
              <div className="dropdown-section">
                <button className="dropdown-item">
                  <User size={16} />
                  <span>Profile</span>
                </button>
                <button className="dropdown-item">
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
              </div>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="sidebar-version">
          {/* <span>v1.0.0</span> */}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;