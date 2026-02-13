import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckCircle,
  FileText,
  Upload,
  Settings,
  User,
  BarChart3,
  LogOut,
  Shield,
  FileCheck,
  Users,
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
  
  // Add this useEffect to refresh review badge when a new contract is submitted for review
  useEffect(() => {
    // Function to fetch review badge count specifically for program managers
    const fetchReviewBadgeCount = async () => {
      if (!user || user.role !== 'program_manager') return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const response = await fetch(`${baseUrl}/api/contracts/status/under_review`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle different response formats
          let contracts = [];
          if (Array.isArray(data)) {
            contracts = data;
          } else if (data.contracts && Array.isArray(data.contracts)) {
            contracts = data.contracts;
          } else if (data.data && Array.isArray(data.data)) {
            contracts = data.data;
          }
          
          // Filter to only show contracts assigned to this program manager
          const pendingOnly = contracts.filter(contract => {
            if (!contract || contract.status !== "under_review") return false;
            
            // Check assigned_pgm_users
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
            
            // Check comprehensive_data
            if (contract.comprehensive_data) {
              if (contract.comprehensive_data.assigned_users?.pgm_users) {
                return contract.comprehensive_data.assigned_users.pgm_users.includes(user.id);
              }
              if (contract.comprehensive_data.agreement_metadata?.assigned_pgm_users) {
                return contract.comprehensive_data.agreement_metadata.assigned_pgm_users.includes(user.id);
              }
            }
            
            return false;
          });
          
          setBadgeCounts(prev => ({
            ...prev,
            'review': pendingOnly.length
          }));
          
          console.log('Review badge count updated:', pendingOnly.length);
        }
      } catch (error) {
        console.error('Failed to fetch review badge count:', error);
      }
    };
    
    // If user is program manager, fetch review badge count
    if (user?.role === 'program_manager') {
      fetchReviewBadgeCount();
      
      // Set up a more frequent polling for review badge (every 10 seconds)
      const reviewIntervalId = setInterval(fetchReviewBadgeCount, 10000);
      
      // Also listen for contract submission events
      const handleContractSubmitted = () => {
        fetchReviewBadgeCount();
      };
      
      window.addEventListener('contract-submitted', handleContractSubmitted);
      
      return () => {
        clearInterval(reviewIntervalId);
        window.removeEventListener('contract-submitted', handleContractSubmitted);
      };
    }
  }, [user]);

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
        parentId: 'draft-parent',
        showIcon: false, // Added flag to indicate no icon
        badge: true // Added badge for drafts
      },
      { 
        id: 'assigned-drafts', 
        label: 'Assigned to Me', 
        icon: null, // No icon for submenu items
        path: '/drafts/assigned', 
        permission: 'can_view_assigned_drafts',
        roles: ['project_manager'],
        isDraftSubmenu: true,
        parentId: 'draft-parent',
        showIcon: false, // Added flag to indicate no icon
        badge: true // Added badge for assigned drafts
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

      { 
        id: 'approved-contracts', 
        label: 'Approved', 
        icon: CheckCircle, 
        path: '/approved-contracts', 
        permission: 'can_view_approved',
        roles: ['project_manager'],
        badge: true,
        isArchiveSection: false // Add this to separate from Archive
      },
      { 
        id: 'assigned-parent', 
        label: 'Assigned Agreements', 
        icon: UserCheck, 
        path: '#', 
        permission: 'can_view_assigned_agreements',
        roles: ['program_manager', 'director'],
        isAssignedParent: true,
        hasSubmenu: true
      },
      { 
        id: 'assigned-to-me', 
        label: 'Assigned to Me', 
        icon: null,
        path: '/agreements/assigned', 
        permission: 'can_view_assigned_agreements',
        roles: ['program_manager', 'director'],
        isAssignedSubmenu: true,
        parentId: 'assigned-parent',
        showIcon: false,
        badge: true 
      },
      { 
        id: 'assigned-by-me', 
        label: 'Assigned by Me', 
        icon: null,
        path: '/agreements/assigned-by-me', 
        permission: 'can_view_assigned_by_me',
        roles: ['program_manager', 'director'],
        isAssignedSubmenu: true,
        parentId: 'assigned-parent',
        badge: true,
        showIcon: false // Added flag to indicate no icon
      },
           
      { 
        id: 'reports', 
        label: 'Reports', 
        icon: BarChart3,  // Make sure BarChart3 is imported at the top
        path: '/reports', 
        permission: 'can_view_reports',
        roles: ['project_manager', 'program_manager', 'director', 'super_admin']
      }
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

  const getApprovedCount = useCallback(async () => {
    if (!user?.id || user.role !== 'project_manager') return null;
    
    const token = localStorage.getItem('token');
    
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      
      // Use the new endpoint for efficient counting
      const response = await fetch(`${baseUrl}/api/contracts/project-manager/approved-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.approved_count || 0;
      }
    } catch (error) {
      console.error('Failed to fetch approved count:', error);
    }
    
    return null;
  }, [user?.id, user?.role]);

  // NEW FUNCTION: Get draft counts for project managers
  const getDraftCounts = useCallback(async (type) => {
    if (!user?.id || user.role !== 'project_manager') return null;
    
    const token = localStorage.getItem('token');
    
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      
      // Fetch drafts based on type
      if (type === 'my-drafts') {
        // Fetch user's own drafts
        const response = await fetch(`${baseUrl}/api/agreements/drafts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter to only show drafts created by this user
          const myDrafts = data.filter(draft => {
            if (!draft) return false;
            const isCreator = draft.created_by === user?.id;
            const isOldCreator = draft.userId === user?.id;
            return isCreator || isOldCreator;
          });
          return myDrafts.length || 0;
        }
      } else if (type === 'assigned-drafts') {
        // Fetch drafts assigned to the user
        const response = await fetch(`${baseUrl}/api/agreements/assigned-drafts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.drafts?.length || 0;
        } else {
          // Fallback: try to get from main drafts endpoint
          const fallbackResponse = await fetch(`${baseUrl}/api/agreements/drafts`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (fallbackResponse.ok) {
            const assignedDrafts = await fallbackResponse.json();
            const userId = user?.id;
            const filteredDrafts = assignedDrafts.filter(draft => {
              if (!draft) return false;
              return (
                (draft.assigned_pm_users && Array.isArray(draft.assigned_pm_users) && draft.assigned_pm_users.includes(userId)) ||
                (draft.assigned_pgm_users && Array.isArray(draft.assigned_pgm_users) && draft.assigned_pgm_users.includes(userId)) ||
                (draft.assigned_director_users && Array.isArray(draft.assigned_director_users) && draft.assigned_director_users.includes(userId))
              );
            });
            return filteredDrafts.length || 0;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} count:`, error);
    }
    
    return null;
  }, [user?.id, user?.role]);

const getPendingCounts = useCallback(async (itemId) => {
  if (!itemId) return null;
  
  const token = localStorage.getItem('token');
  if (!token) return 0;
  
  try {
    const baseUrl = API_CONFIG.BASE_URL;
    
    // ============ PROJECT MANAGER DRAFTS ============
    if (itemId === 'my-drafts') {
      const response = await fetch(`${baseUrl}/api/agreements/drafts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to only show drafts created by this user
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const myDrafts = data.filter(draft => 
          draft.created_by === user?.id || draft.userId === user?.id
        );
        return myDrafts.length || 0;
      }
      return 0;
    }
    
    if (itemId === 'assigned-drafts') {
      const response = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.total || data.drafts?.length || 0;
      }
      return 0;
    }
    
    // ============ PROGRAM MANAGER & DIRECTOR ASSIGNMENTS ============
    if (itemId === 'assigned-to-me') {
      const response = await fetch(`${baseUrl}/api/agreements/assigned-drafts?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.total || data.drafts?.length || 0;
      }
      return 0;
    }
    
    if (itemId === 'assigned-by-me') {
      const response = await fetch(`${baseUrl}/api/agreements/assigned-by-me?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.total || data.drafts?.length || 0;
      }
      return 0;
    }
    
// ============ PROGRAM MANAGER REVIEW ============
if (itemId === 'review') {
  const response = await fetch(`${baseUrl}/api/contracts/status/under_review`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    
    // Handle different response formats
    let contracts = [];
    if (Array.isArray(data)) {
      contracts = data;
    } else if (data.contracts && Array.isArray(data.contracts)) {
      contracts = data.contracts;
    } else if (data.data && Array.isArray(data.data)) {
      contracts = data.data;
    }
    
    // Filter to only show contracts assigned to this program manager
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const pendingOnly = contracts.filter(contract => {
      if (!contract || contract.status !== "under_review") return false;
      
      // Check if this program manager is assigned
      if (contract.assigned_pgm_users) {
        if (Array.isArray(contract.assigned_pgm_users)) {
          return contract.assigned_pgm_users.includes(user?.id);
        }
        if (typeof contract.assigned_pgm_users === 'string') {
          try {
            const pgmList = JSON.parse(contract.assigned_pgm_users);
            return Array.isArray(pgmList) && pgmList.includes(user?.id);
          } catch (e) {
            const pgmIds = contract.assigned_pgm_users.split(',').map(id => id.trim());
            return pgmIds.includes(String(user?.id));
          }
        }
      }
      
      // Also check comprehensive data for assignments
      if (contract.comprehensive_data) {
        if (contract.comprehensive_data.assigned_users?.pgm_users) {
          return contract.comprehensive_data.assigned_users.pgm_users.includes(user?.id);
        }
        if (contract.comprehensive_data.agreement_metadata?.assigned_pgm_users) {
          return contract.comprehensive_data.agreement_metadata.assigned_pgm_users.includes(user?.id);
        }
      }
      
      return false;
    });
    return pendingOnly.length;
  }
  return 0;
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
      return 0;
    }
    
    // ============ DIRECTOR APPROVALS ============
    if (itemId === 'approvals') {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 0;
      
      const user = JSON.parse(userStr);
      
      if (user.role === 'director') {
        const response = await fetch(`${baseUrl}/api/contracts/director/assigned-approvals-count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.assigned_approvals_count || 0;
        }
      }
      return 0;
    }
    
    // ============ PROJECT MANAGER APPROVED CONTRACTS ============
    if (itemId === 'approved-contracts') {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 0;
      
      const user = JSON.parse(userStr);
      
      if (user.role === 'project_manager') {
        const response = await fetch(`${baseUrl}/api/contracts/project-manager/approved-count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.approved_count || 0;
        }
      }
      return 0;
    }
    
  } catch (error) {
    console.error(`Failed to fetch count for ${itemId}:`, error);
    return 0;
  }
  
  return 0;
}, []);

// Add this useEffect near your other badge-related useEffect hooks
useEffect(() => {
  // Refresh review badge when on review page
  if (location.pathname === '/review' && user?.role === 'program_manager') {
    const refreshReviewBadge = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const baseUrl = API_CONFIG.BASE_URL;
      try {
        const response = await fetch(`${baseUrl}/api/contracts/status/under_review`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          let contracts = [];
          if (Array.isArray(data)) {
            contracts = data;
          } else if (data.contracts && Array.isArray(data.contracts)) {
            contracts = data.contracts;
          }
          
          const pendingOnly = contracts.filter(contract => 
            contract.status === "under_review" && 
            contract.assigned_pgm_users?.includes(user.id)
          );
          
          setBadgeCounts(prev => ({
            ...prev,
            'review': pendingOnly.length
          }));
        }
      } catch (error) {
        console.error('Failed to refresh review badge:', error);
      }
    };
    
    refreshReviewBadge();
  }
}, [location.pathname, user]);

// Fetch all badge counts including drafts
useEffect(() => {
  const fetchAllBadgeCounts = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    
    const baseUrl = API_CONFIG.BASE_URL;
    const newBadgeCounts = {...badgeCounts};
    
    try {
      // ============ PROJECT MANAGER DRAFTS ============
      if (user.role === 'project_manager') {
        // My Drafts count
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
        
        // Assigned to Me count (for Project Managers)
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
        
        // Approved Contracts count
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
      
      // ============ PROGRAM MANAGER ============
      if (user.role === 'program_manager') {
        // Assigned to Me count (for Program Managers)
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
        
        // Assigned by Me count
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
        
        // FIXED: Review count (contracts under review assigned to this program manager)
        try {
          const response = await fetch(`${baseUrl}/api/contracts/status/under_review`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Handle different response formats from backend
            let contracts = [];
            
            if (Array.isArray(data)) {
              // Case 1: Direct array of contracts
              contracts = data;
            } else if (data && typeof data === 'object') {
              // Case 2: Object with contracts property
              if (data.contracts && Array.isArray(data.contracts)) {
                contracts = data.contracts;
              }
              // Case 3: Object with data property (pagination wrapper)
              else if (data.data && Array.isArray(data.data)) {
                contracts = data.data;
              }
              // Case 4: Object with items property
              else if (data.items && Array.isArray(data.items)) {
                contracts = data.items;
              }
            }
            
            // Filter to only show contracts assigned to this program manager
            const pendingOnly = contracts.filter(contract => {
              if (!contract || contract.status !== "under_review") return false;
              
              // Check assigned_pgm_users field
              if (contract.assigned_pgm_users) {
                // If it's an array
                if (Array.isArray(contract.assigned_pgm_users)) {
                  return contract.assigned_pgm_users.includes(user.id);
                }
                // If it's a string (JSON array or comma-separated)
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
              
              // Check comprehensive_data for assignments
              if (contract.comprehensive_data) {
                // Check assigned_users.pgm_users
                if (contract.comprehensive_data.assigned_users) {
                  if (Array.isArray(contract.comprehensive_data.assigned_users.pgm_users)) {
                    return contract.comprehensive_data.assigned_users.pgm_users.includes(user.id);
                  }
                }
                // Check agreement_metadata.assigned_pgm_users
                if (contract.comprehensive_data.agreement_metadata) {
                  if (Array.isArray(contract.comprehensive_data.agreement_metadata.assigned_pgm_users)) {
                    return contract.comprehensive_data.agreement_metadata.assigned_pgm_users.includes(user.id);
                  }
                }
              }
              
              return false;
            });
            
            newBadgeCounts['review'] = pendingOnly.length;
            console.log(`Review badge count updated: ${pendingOnly.length} contracts assigned to ${user.username}`);
          } else {
            console.warn('Failed to fetch under_review contracts, status:', response.status);
            newBadgeCounts['review'] = 0;
          }
        } catch (error) {
          console.error('Failed to fetch review count:', error);
          newBadgeCounts['review'] = 0;
        }

        // Director Decisions count
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
      
      // ============ DIRECTOR ============
      if (user.role === 'director') {
        // Assigned to Me count (for Directors)
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
        
        // Assigned by Me count
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
        
        // Approvals count
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
    
    setBadgeCounts(newBadgeCounts);
  };
  
  if (user) {
    fetchAllBadgeCounts();
    
    // Set up polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(fetchAllBadgeCounts, 30000);
    return () => clearInterval(intervalId);
  }
}, [user]);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        // Use HTTP instead of HTTPS for local development
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
  }, [user]);

  // Check if draft submenu is active
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

  // Check if assigned submenu is active
  useEffect(() => {
    const checkAssignedSubmenuActive = () => {
      const isActive = menuItems.assignedSubmenuItems?.some(item => 
        location.pathname === item.path || location.pathname.startsWith(item.path)
      );
      setIsAssignedSubmenuActive(isActive);
      
      // Auto-expand assigned menu if a submenu is active
      if (isActive && menuItems.assignedParent) {
        setExpandedMenus(prev => ({
          ...prev,
          assigned: true
        }));
      }
    };
    
    checkAssignedSubmenuActive();
  }, [location.pathname, menuItems.assignedSubmenuItems, menuItems.assignedParent]);

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

  // Helper function to render icon safely
  const renderIcon = (item) => {
    const IconComponent = item.icon;
    
    // Check if we should show icon for this item
    if (item.showIcon === false) {
      return <div className="no-icon-placeholder" />;
    }
    
    // Check if IconComponent is a valid React component
    if (IconComponent && typeof IconComponent === 'function') {
      return <IconComponent size={item.isDraftSubmenu || item.isAssignedSubmenu ? 18 : 22} />;
    }
    
    // Fallback for invalid icons
    return <div className="no-icon-placeholder" />;
  };

  // Helper function to check if any submenu items have badge counts
  const hasSubmenuBadge = (submenuItems) => {
    if (!submenuItems) return false;
    return submenuItems.some(item => badgeCounts[item.id] > 0);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => handleNavigation('/dashboard')} title="GrantOS">
          <div className="logo-text">
            <span className="logo-text-primary">GrantOS</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">

          {menuItems.regularItems.map((item) => {
            // Special handling for Grants menu item
            let isActive = false;
            
            if (item.id === 'grants') {
              // For Grants tab, only active when:
              // 1. We're on /contracts (exact match)
              // 2. We're on /contracts/{id} but NOT from drafts
              const searchParams = new URLSearchParams(location.search);
              const isFromDrafts = searchParams.get('from') === 'drafts';
              
              isActive = (location.pathname === '/contracts' || 
                          location.pathname.startsWith('/contracts/')) && 
                         !isFromDrafts;
            } else {
              // For other items, use normal logic
              isActive = location.pathname === item.path || 
                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            }
            
            const badgeCount = badgeCounts[item.id];
            
            return (
              <li key={item.id}>
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  title={item.label}
                >
                  <span className="nav-icon">
                    {renderIcon(item)}
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {badgeCount > 0 && (
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
              
              <li key={menuItems.draftParent.id}>
                <button
                  className={`nav-item draft-parent ${(expandedMenus.draft || isDraftSubmenuActive) && !location.pathname.includes('/drafts/my') && !location.pathname.includes('/drafts/assigned') ? 'active' : ''}`} // FIX: Only active when NOT on submenu pages
                  onClick={() => toggleMenu('draft')}
                  title={menuItems.draftParent.label}
                >
                  <span className="nav-icon">
                    {renderIcon(menuItems.draftParent)}
                  </span>
                  <span className="nav-label">{menuItems.draftParent.label}</span>
                  {/* Add green dot indicator if submenu items have badge counts */}
                  {hasSubmenuBadge(menuItems.draftSubmenuItems) && !expandedMenus.draft && (
                    <span className="nav-green-dot"></span>
                  )}
                  <span className="menu-arrow">
                    {expandedMenus.draft ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  {(expandedMenus.draft || isDraftSubmenuActive) && !location.pathname.includes('/drafts/my') && !location.pathname.includes('/drafts/assigned') && <span className="nav-indicator" />}
                </button>
                
                {/* Draft Submenu */}
                {expandedMenus.draft && menuItems.draftSubmenuItems?.length > 0 && (
                  <ul className="submenu">
                    {menuItems.draftSubmenuItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path || 
                                         location.pathname.startsWith(subItem.path);
                      const badgeCount = badgeCounts[subItem.id] || 0;
                      
                      return (
                        <li key={subItem.id}>
                          <button
                            className={`nav-item submenu-item ${isSubActive ? 'active' : ''}`}
                            onClick={() => handleNavigation(subItem.path)}
                            title={subItem.label}
                          >
                            <span className="nav-icon">
                              {renderIcon(subItem)}
                            </span>
                            <span className="nav-label">{subItem.label}</span>
                            {badgeCount > 0 && (
                              <span className="nav-badge">{badgeCount}</span>
                            )}
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

          {/* Assigned Agreements for Program Managers and Directors */}
          {menuItems.assignedParent && (
            <>
              <li key={menuItems.assignedParent.id}>
                <button
                  className={`nav-item assigned-parent ${expandedMenus.assigned || isAssignedSubmenuActive ? 'active' : ''}`}
                  onClick={() => toggleMenu('assigned')}
                  title={menuItems.assignedParent.label}
                >
                  <span className="nav-icon">
                    {renderIcon(menuItems.assignedParent)}
                  </span>
                  <span className="nav-label">{menuItems.assignedParent.label}</span>
                  {/* Add green dot indicator if submenu items have badge counts */}
                  {hasSubmenuBadge(menuItems.assignedSubmenuItems) && !expandedMenus.assigned && (
                    <span className="nav-green-dot"></span>
                  )}
                  <span className="menu-arrow">
                    {expandedMenus.assigned ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  {(expandedMenus.assigned || isAssignedSubmenuActive) && <span className="nav-indicator" />}
                </button>
                
                {/* Assigned Submenu */}
                {expandedMenus.assigned && menuItems.assignedSubmenuItems?.length > 0 && (
                  <ul className="submenu">
                    {menuItems.assignedSubmenuItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path || 
                                         location.pathname.startsWith(subItem.path);
                      const badgeCount = badgeCounts[subItem.id] || 0;
                      
                      return (
                        <li key={subItem.id}>
                          <button
                            className={`nav-item submenu-item ${isSubActive ? 'active' : ''}`}
                            onClick={() => handleNavigation(subItem.path)}
                            title={subItem.label}
                          >
                            <span className="nav-icon">
                              {renderIcon(subItem)}
                            </span>
                            <span className="nav-label">{subItem.label}</span>
                            {badgeCount > 0 && (
                              <span className="nav-badge">{badgeCount}</span>
                            )}
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
              
              {menuItems.archiveItems.map((item) => {
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
                        {renderIcon(item)}
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
                        {renderIcon(item)}
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