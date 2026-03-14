import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import {
  TbLayoutDashboard,
  TbFileText,
  TbCloudUpload,
  TbClipboardCheck,
  TbCircleCheck,
  TbFolder,
  TbFilePencil,
  TbUserCheck,
  TbArchive,
  TbChecks,
  TbUsers,
  TbUserPlus,
  TbSettings2,
  TbUsersGroup,
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
} from 'react-icons/tb';
import './Sidebar.css';
import API_CONFIG from '../../config';
import { useModules } from "../../pages/ModuleContext";

const ITEM_ICONS = {
  'dashboard': TbLayoutDashboard,
  'grants': TbFileText,
  'upload': TbCloudUpload,
  'review': TbClipboardCheck,
  'approvals': TbCircleCheck,
  'draft-parent': TbFolder,
  'my-drafts': TbFilePencil,
  'assigned-drafts': TbUserCheck,
  'archive': TbArchive,
  'approved-contracts': TbChecks,
  'assigned-parent': TbUsers,
  'assigned-to-me': TbUserCheck,
  'assigned-by-me': TbUserPlus,
  'admin-portal': TbSettings2,
  'user-management': TbUsersGroup,
};

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const modules = useModules();
  const [permissions, setPermissions] = useState({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    draft: false,
    assigned: false,
    archive: false,
    admin: false
  });
  const [badgeCounts, setBadgeCounts] = useState({
    'my-drafts': 0,
    'assigned-drafts': 0,
    'review': 0,
    'director-decisions': 0,
    'approvals': 0,
    'approved-contracts': 0,
    'assigned-to-me': 0,
    'assigned-by-me': 0
  });
  const [isDraftSubmenuActive, setIsDraftSubmenuActive] = useState(false);
  const [isAssignedSubmenuActive, setIsAssignedSubmenuActive] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu function
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Function to fetch all badge counts
  const fetchAllBadgeCounts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    
    const baseUrl = API_CONFIG.BASE_URL;
    const newBadgeCounts = {...badgeCounts};
    
    try {
      if (user.role === 'project_manager') {
        try {
          const response = await fetch(`${baseUrl}/api/agreements/drafts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            const myDrafts = data.filter(draft => 
              draft.created_by === user.id || draft.userId === user.id
            );
            newBadgeCounts['my-drafts'] = myDrafts.length;
          }
        } catch (error) {
          console.error('Failed to fetch my drafts count:', error);
        }
        
        try {
          const response = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['assigned-drafts'] = data.total || data.drafts?.length || 0;
          }
        } catch (error) {
          console.error('Failed to fetch assigned drafts count:', error);
        }
        
        try {
          const response = await fetch(`${baseUrl}/api/contracts/project-manager/approved-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['approved-contracts'] = data.approved_count || 0;
          }
        } catch (error) {
          console.error('Failed to fetch approved count:', error);
        }
      }
      
      if (user.role === 'program_manager') {
        try {
          const response = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['assigned-to-me'] = data.total || data.drafts?.length || 0;
          }
        } catch (error) {
          console.error('Failed to fetch assigned to me count:', error);
        }
        
        try {
          const response = await fetch(`${baseUrl}/api/agreements/assigned-by-me?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['assigned-by-me'] = data.total || data.drafts?.length || 0;
          }
        } catch (error) {
          console.error('Failed to fetch assigned by me count:', error);
        }
        
        try {
          const response = await fetch(`${baseUrl}/api/contracts/status/under_review`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            let contracts = [];
            
            if (Array.isArray(data)) {
              contracts = data;
            } else if (data && typeof data === 'object') {
              if (data.contracts && Array.isArray(data.contracts)) {
                contracts = data.contracts;
              }
              else if (data.data && Array.isArray(data.data)) {
                contracts = data.data;
              }
              else if (data.items && Array.isArray(data.items)) {
                contracts = data.items;
              }
            }
            
            const pendingOnly = contracts.filter(contract => {
              if (!contract || contract.status !== "under_review") return false;
              
              if (contract.assigned_pgm_users) {
                if (Array.isArray(contract.assigned_pgm_users)) {
                  return contract.assigned_pgm_users.includes(user.id);
                }
                if (typeof contract.assigned_pgm_users === 'string') {
                  try {
                    const pgmList = JSON.parse(contract.assigned_pgm_users);
                    return Array.isArray(pgmList) && pgmList.includes(user.id);
                  } catch (e) {
                    const pgmIds = contract.assigned_pgm_users.split(',').map(id => id.trim());
                    return pgmIds.includes(String(user.id));
                  }
                }
              }
              
              if (contract.comprehensive_data) {
                if (contract.comprehensive_data.assigned_users) {
                  if (Array.isArray(contract.comprehensive_data.assigned_users.pgm_users)) {
                    return contract.comprehensive_data.assigned_users.pgm_users.includes(user.id);
                  }
                }
                if (contract.comprehensive_data.agreement_metadata) {
                  if (Array.isArray(contract.comprehensive_data.agreement_metadata.assigned_pgm_users)) {
                    return contract.comprehensive_data.agreement_metadata.assigned_pgm_users.includes(user.id);
                  }
                }
              }
              
              return false;
            });
            
            newBadgeCounts['review'] = pendingOnly.length;
          } else {
            newBadgeCounts['review'] = 0;
          }
        } catch (error) {
          console.error('Failed to fetch review count:', error);
          newBadgeCounts['review'] = 0;
        }

        try {
          const response = await fetch(`${baseUrl}/api/contracts/program-manager/reviewed-by-director?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['director-decisions'] = data.total || data.summary?.total || 0;
          }
        } catch (error) {
          console.error('Failed to fetch director decisions count:', error);
        }
      }
      
      if (user.role === 'director') {
        try {
          const response = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['assigned-to-me'] = data.total || data.drafts?.length || 0;
          }
        } catch (error) {
          console.error('Failed to fetch assigned to me count:', error);
        }
        
        try {
          const response = await fetch(`${baseUrl}/api/agreements/assigned-by-me?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['assigned-by-me'] = data.total || data.drafts?.length || 0;
          }
        } catch (error) {
          console.error('Failed to fetch assigned by me count:', error);
        }
        
        try {
          const response = await fetch(`${baseUrl}/api/contracts/director/assigned-approvals-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            newBadgeCounts['approvals'] = data.assigned_approvals_count || 0;
          }
        } catch (error) {
          console.error('Failed to fetch approvals count:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch badge counts:', error);
    }
    
    setBadgeCounts(prev => ({
      ...prev,
      ...newBadgeCounts
    }));
  }, [user]);
  useEffect(() => {
    if (!user) return;

    // Define event handler for contract status changes
    const handleContractStatusChange = (event) => {
      console.log('Contract status changed event received:', event.detail);
      
      // Immediately refresh badge counts
      fetchAllBadgeCounts();
    };

    // Define event handler for director approvals
    const handleDirectorApproval = (event) => {
      console.log('Director approval event received:', event.detail);
      
      // Immediately refresh badge counts
      fetchAllBadgeCounts();
    };

    // Define event handler for contract submissions
    const handleContractSubmitted = (event) => {
      console.log('Contract submitted event received:', event.detail);
      
      // Immediately refresh badge counts
      fetchAllBadgeCounts();
    };

    // Define event handler for review completions
    const handleReviewCompleted = (event) => {
      console.log('Review completed event received:', event.detail);
      
      // Immediately refresh badge counts
      fetchAllBadgeCounts();
    };

    // Define event handler for assignment changes
    const handleAssignmentChange = (event) => {
      console.log('Assignment change event received:', event.detail);
      
      // Immediately refresh badge counts
      fetchAllBadgeCounts();
    };

    // Register all event listeners
    window.addEventListener('contract-status-changed', handleContractStatusChange);
    window.addEventListener('director-approval', handleDirectorApproval);
    window.addEventListener('contract-submitted', handleContractSubmitted);
    window.addEventListener('review-completed', handleReviewCompleted);
    window.addEventListener('assignment-changed', handleAssignmentChange);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('contract-status-changed', handleContractStatusChange);
      window.removeEventListener('director-approval', handleDirectorApproval);
      window.removeEventListener('contract-submitted', handleContractSubmitted);
      window.removeEventListener('review-completed', handleReviewCompleted);
      window.removeEventListener('assignment-changed', handleAssignmentChange);
    };
  }, [user, fetchAllBadgeCounts]);

  // Add this useEffect to refresh review badge when location changes to review page
  useEffect(() => {
    if (location.pathname === '/review' && user?.role === 'program_manager') {
      fetchAllBadgeCounts();
    }
  }, [location.pathname, user, fetchAllBadgeCounts]);

  // Memoize the getMenuItems function to prevent recreation on every render
  const getMenuItems = useCallback(() => {
    const userRole = user?.role || '';
    
    if (!userRole) {
      return { allItems: [], regularItems: [], draftParent: null, draftSubmenuItems: [], archiveItems: [], adminItems: [], assignedParent: null, assignedSubmenuItems: [] };
    }
    
    const allItems = [
      // COMMON ITEMS FOR ALL USERS
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/app/dashboard',
        permission: 'can_view_dashboard',
        roles: ['project_manager', 'director', 'program_manager', 'super_admin']
      },
      {
        id: 'grants',
        label: 'Grants',
        path: '/app/contracts',
        permission: 'can_view_contracts',
        roles: ['project_manager', 'program_manager', 'director', 'super_admin']
      },
      {
        id: 'upload',
        label: 'Upload',
        path: '/app/upload',
        permission: 'can_upload',
        roles: ['project_manager', 'director', 'super_admin']
      },
      {
        id: 'review',
        label: 'Review',
        path: '/app/review',
        permission: 'can_review',
        roles: ['program_manager'],
        badge: true
      },
      {
        id: 'approvals',
        label: 'Approvals',
        path: '/app/approvals',
        permission: 'can_approve',
        roles: ['director'],
        badge: true
      },


      // SUPER ADMIN SPECIFIC ITEMS
      {
        id: 'admin-portal',
        label: 'Settings',
        path: '/app/admin',
        permission: 'can_manage_all_users',
        roles: ['super_admin'],
        isAdmin: true
      },
      {
        id: 'user-management',
        label: 'User Management',
        path: '/app/users',
        permission: 'can_manage_all_users',
        roles: ['super_admin'],
        isAdmin: true
      },

      // DRAFT SUBMENU ITEMS (Will be grouped under "Draft" parent)
      // {
      //   id: 'draft-parent',
      //   label: 'Draft',
      //   path: '#',
      //   permission: 'can_view_drafts',
      //   roles: ['project_manager'],
      //   isDraftParent: true,
      //   hasSubmenu: true
      // },
      {
        id: 'my-drafts',
        label: 'My Drafts',
        path: '/app/drafts/my',
        permission: 'can_view_drafts',
        roles: ['project_manager'],
        isDraftSubmenu: true,
        parentId: 'draft-parent',
        badge: true
      },
      {
        id: 'assigned-drafts',
        label: 'Assigned to Me',
        path: '/app/drafts/assigned',
        permission: 'can_view_assigned_drafts',
        roles: ['project_manager'],
        isDraftSubmenu: true,
        parentId: 'draft-parent',
        badge: true
      },

      // ARCHIVE ITEMS
      {
        id: 'archive',
        label: 'Archive',
        path: '/app/archive',
        permission: 'can_view_archive',
        roles: ['project_manager', 'director'],
        isArchiveSection: true
      },

      {
        id: 'approved-contracts',
        label: 'Approved',
        path: '/app/approved-contracts',
        permission: 'can_view_approved',
        roles: ['project_manager'],
        badge: true,
        isArchiveSection: false
      },
      // {
      //   id: 'assigned-parent',
      //   label: 'Assigned Agreements',
      //   path: '#',
      //   permission: 'can_view_assigned_agreements',
      //   roles: ['program_manager', 'director'],
      //   isAssignedParent: true,
      //   hasSubmenu: true
      // },
      {
        id: 'assigned-to-me',
        label: 'Assigned to Me',
        path: '/app/agreements/assigned',
        permission: 'can_view_assigned_agreements',
        roles: ['program_manager', 'director'],
        isAssignedSubmenu: true,
        parentId: 'assigned-parent',
        badge: true
      },
      {
        id: 'assigned-by-me',
        label: 'Assigned by Me',
        path: '/app/agreements/assigned-by-me',
        permission: 'can_view_assigned_by_me',
        roles: ['program_manager', 'director'],
        isAssignedSubmenu: true,
        parentId: 'assigned-parent',
        badge: true
      },
    ];
    
    // Filter items based on user role
    const filteredItems = allItems.filter(item => {
      // super_admin only sees admin section items
      if (userRole === 'super_admin') {
        return item.isAdmin === true;
      }
      if (item.id === 'dashboard') {
        return true;
      }
      if (item.id === 'grants') {
        return true;
      }
      if (item.id === 'upload') {
        return userRole === 'project_manager' || userRole === 'director';
      }
      return item.roles.includes(userRole);
    });

    // Separate items
    const regularItems = filteredItems.filter(item => !item.isAdmin && !item.isDraftParent && !item.isDraftSubmenu && !item.isArchiveSection && !item.isAssignedParent && !item.isAssignedSubmenu);
    const draftParent = filteredItems.find(item => item.isDraftParent);
    const draftSubmenuItems = filteredItems.filter(item => item.isDraftSubmenu);
    const archiveItems = filteredItems.filter(item => item.isArchiveSection);
    const adminItems = filteredItems.filter(item => item.isAdmin);
    const assignedParent = filteredItems.find(item => item.isAssignedParent);
    const assignedSubmenuItems = filteredItems.filter(item => item.isAssignedSubmenu);

    return {
      allItems: filteredItems,
      regularItems,
      draftParent,
      draftSubmenuItems,
      assignedParent,
      assignedSubmenuItems,
      archiveItems,
      adminItems
    };
  }, [user?.role]); 

  // Memoize the menu items
  const menuItems = useMemo(() => getMenuItems(), [getMenuItems]);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = API_CONFIG.BASE_URL;
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
  }, [user]);

  // Check if draft submenu is active
  useEffect(() => {
    const checkDraftSubmenuActive = () => {
      const isActive = menuItems.draftSubmenuItems?.some(item => 
        location.pathname === item.path || location.pathname.startsWith(item.path)
      );
      setIsDraftSubmenuActive(isActive);
      
      if (isActive && menuItems.draftParent) {
        setExpandedMenus(prev => ({
          ...prev,
          draft: true
        }));
      }
    };
    
    checkDraftSubmenuActive();
  }, [location.pathname, menuItems.draftSubmenuItems, menuItems.draftParent]);

  // Check if assigned submenu is active
  useEffect(() => {
    const checkAssignedSubmenuActive = () => {
      const isActive = menuItems.assignedSubmenuItems?.some(item => 
        location.pathname === item.path || location.pathname.startsWith(item.path)
      );
      setIsAssignedSubmenuActive(isActive);
      
      if (isActive && menuItems.assignedParent) {
        setExpandedMenus(prev => ({
          ...prev,
          assigned: true
        }));
      }
    };
    
    checkAssignedSubmenuActive();
  }, [location.pathname, menuItems.assignedSubmenuItems, menuItems.assignedParent]);

  // Initial fetch and periodic refresh (every 30 seconds)
  useEffect(() => {
    if (user) {
      fetchAllBadgeCounts();
      
      const intervalId = setInterval(fetchAllBadgeCounts, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user, fetchAllBadgeCounts]);

  const handleNavigation = useCallback((path) => {
    navigate(path);
    setMobileMenuOpen(false);
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

  const hasSubmenuBadge = (submenuItems) => {
    if (!submenuItems) return false;
    return submenuItems.some(item => badgeCounts[item.id] > 0);
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <button 
        className="sbr-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      <div 
        className={`sbr-overlay ${mobileMenuOpen ? 'sbr-overlay-active' : ''}`}
        onClick={closeMobileMenu}
      />

      <aside className={`sbr-sidebar ${mobileMenuOpen ? 'sbr-sidebar-open' : ''} ${isCollapsed ? 'sbr-sidebar-collapsed' : ''}`}>
        <div className="sbr-header">
          <button
            className="sbr-collapse-btn"
            onClick={() => setIsCollapsed(prev => !prev)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sbr-nav">
          <ul className="sbr-menu">
            {menuItems.regularItems.map((item) => {
              let isActive = false;
              
              if (item.id === 'grants') {
                const searchParams = new URLSearchParams(location.search);
                const isFromDrafts = searchParams.get('from') === 'drafts';
                
                isActive = (location.pathname === '/app/contracts' || 
                            location.pathname.startsWith('/app/contracts/')) && 
                           !isFromDrafts;
              } else {
                isActive = location.pathname === item.path || 
                          (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));
              }
              
              const badgeCount = badgeCounts[item.id];
              
              const RegularIcon = ITEM_ICONS[item.id];
              return (
                <li key={item.id}>
                  <button
                    className={`sbr-nav-item ${isActive ? 'sbr-nav-active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    title={item.label}
                  >
                    {RegularIcon && <span className="sbr-nav-icon"><RegularIcon size={18} /></span>}
                    <span className="sbr-nav-label">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="sbr-nav-badge">{badgeCount}</span>
                    )}
                    {isActive && <span className="sbr-nav-indicator" />}
                  </button>
                </li>
              );
            })}

            {/* Draft Parent Menu with Dropdown */}
            {menuItems.draftParent && (
              <li key={menuItems.draftParent.id}>
                <button
                  className={`sbr-nav-item sbr-draft-parent ${(expandedMenus.draft || isDraftSubmenuActive) ? 'sbr-nav-active' : ''}`}
                  onClick={() => toggleMenu('draft')}
                  title={menuItems.draftParent.label}
                >
                  {ITEM_ICONS['draft-parent'] && <span className="sbr-nav-icon">{React.createElement(ITEM_ICONS['draft-parent'], { size: 18 })}</span>}
                  <span className="sbr-nav-label">{menuItems.draftParent.label}</span>
                  {hasSubmenuBadge(menuItems.draftSubmenuItems) && !expandedMenus.draft && (
                    <span className="sbr-green-dot"></span>
                  )}
                  <span className="sbr-menu-arrow">
                    {expandedMenus.draft ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  {(expandedMenus.draft || isDraftSubmenuActive) && <span className="sbr-nav-indicator" />}
                </button>
                
                {/* Draft Submenu */}
                {expandedMenus.draft && menuItems.draftSubmenuItems?.length > 0 && (
                  <ul className="sbr-submenu">
                    {menuItems.draftSubmenuItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path || 
                                         location.pathname.startsWith(subItem.path);
                      const badgeCount = badgeCounts[subItem.id] || 0;
                      
                      return (
                        <li key={subItem.id}>
                          <button
                            className={`sbr-nav-item sbr-submenu-item ${isSubActive ? 'sbr-nav-active' : ''}`}
                            onClick={() => handleNavigation(subItem.path)}
                            title={subItem.label}
                          >
                            {ITEM_ICONS[subItem.id] && <span className="sbr-nav-icon">{React.createElement(ITEM_ICONS[subItem.id], { size: 16 })}</span>}
                            <span className="sbr-nav-label">{subItem.label}</span>
                            {badgeCount > 0 && (
                              <span className="sbr-nav-badge">{badgeCount}</span>
                            )}
                            {isSubActive && <span className="sbr-nav-indicator" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            )}

            {/* Assigned Agreements for Program Managers and Directors */}
            {menuItems.assignedParent && (
              <li key={menuItems.assignedParent.id}>
                <button
                  className={`sbr-nav-item sbr-assigned-parent ${expandedMenus.assigned || isAssignedSubmenuActive ? 'sbr-nav-active' : ''}`}
                  onClick={() => toggleMenu('assigned')}
                  title={menuItems.assignedParent.label}
                >
                  {ITEM_ICONS['assigned-parent'] && <span className="sbr-nav-icon">{React.createElement(ITEM_ICONS['assigned-parent'], { size: 18 })}</span>}
                  <span className="sbr-nav-label">{menuItems.assignedParent.label}</span>
                  {hasSubmenuBadge(menuItems.assignedSubmenuItems) && !expandedMenus.assigned && (
                    <span className="sbr-green-dot"></span>
                  )}
                  <span className="sbr-menu-arrow">
                    {expandedMenus.assigned ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  {(expandedMenus.assigned || isAssignedSubmenuActive) && <span className="sbr-nav-indicator" />}
                </button>
                
                {/* Assigned Submenu */}
                {expandedMenus.assigned && menuItems.assignedSubmenuItems?.length > 0 && (
                  <ul className="sbr-submenu">
                    {menuItems.assignedSubmenuItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path || 
                                         location.pathname.startsWith(subItem.path);
                      const badgeCount = badgeCounts[subItem.id] || 0;
                      
                      return (
                        <li key={subItem.id}>
                          <button
                            className={`sbr-nav-item sbr-submenu-item ${isSubActive ? 'sbr-nav-active' : ''}`}
                            onClick={() => handleNavigation(subItem.path)}
                            title={subItem.label}
                          >
                            {ITEM_ICONS[subItem.id] && <span className="sbr-nav-icon">{React.createElement(ITEM_ICONS[subItem.id], { size: 16 })}</span>}
                            <span className="sbr-nav-label">{subItem.label}</span>
                            {badgeCount > 0 && (
                              <span className="sbr-nav-badge">{badgeCount}</span>
                            )}
                            {isSubActive && <span className="sbr-nav-indicator" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            )}

            {/* Archive Section */}
            {menuItems.archiveItems?.length > 0 && (
              menuItems.archiveItems.map((item) => {
                const isActive = location.pathname === item.path || 
                                location.pathname.startsWith(item.path);
                
                return (
                  <li key={item.id}>
                    <button
                      className={`sbr-nav-item sbr-archive-item ${isActive ? 'sbr-nav-active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                      title={item.label}
                    >
                      {ITEM_ICONS[item.id] && <span className="sbr-nav-icon">{React.createElement(ITEM_ICONS[item.id], { size: 18 })}</span>}
                      <span className="sbr-nav-label">{item.label}</span>
                      {isActive && <span className="sbr-nav-indicator" />}
                    </button>
                  </li>
                );
              })
            )}

            {/* Admin Portal Section - Only for super_admin */}
            {menuItems.adminItems?.length > 0 && (
              <>
                <div className="sbr-section-divider">
                  <div className="sbr-section-label">ADMINISTRATION</div>
                </div>
                
                {menuItems.adminItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                                  (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));
                  
                  return (
                    <li key={item.id}>
                      <button
                        className={`sbr-nav-item sbr-admin-item ${isActive ? 'sbr-nav-active' : ''}`}
                        onClick={() => handleNavigation(item.path)}
                        title={item.label}
                      >
                        {ITEM_ICONS[item.id] && <span className="sbr-nav-icon">{React.createElement(ITEM_ICONS[item.id], { size: 18 })}</span>}
                        <span className="sbr-nav-label">{item.label}</span>
                        {isActive && <span className="sbr-nav-indicator" />}
                      </button>
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        </nav>

        <div className="sbr-footer">
          {/* Expanded: full user profile card */}
          <div
            className="sbr-user-profile"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="sbr-user-avatar">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="sbr-user-info">
              <div className="sbr-user-name">{user?.full_name || user?.username || 'Guest User'}</div>
              <div className="sbr-user-email">{user?.email || ''}</div>
              <div className={`sbr-user-role sbr-role-${user?.role || 'guest'}`}>
                {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'GUEST'}
              </div>
            </div>
            <div className="sbr-user-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>

            {showUserMenu && (
              <div className="sbr-dropdown-menu">
                <div className="sbr-dropdown-section">
                  <button className="sbr-dropdown-item">
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  <button className="sbr-dropdown-item">
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </div>
                <div className="sbr-dropdown-divider"></div>
                <button
                  className="sbr-dropdown-item sbr-logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>

          {/* Collapsed: icon-only actions */}
          <div className="sbr-collapsed-actions">
            <button className="sbr-collapsed-icon-btn" title="Profile">
              <User size={18} />
            </button>
            <button className="sbr-collapsed-icon-btn" title="Settings">
              <Settings size={18} />
            </button>
            <button className="sbr-collapsed-icon-btn sbr-collapsed-logout" title="Log out" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
            <div className="sbr-collapsed-avatar" title={user?.full_name || user?.username || 'Guest'}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'G'}
            </div>
          </div>

          <div className="sbr-version"></div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
