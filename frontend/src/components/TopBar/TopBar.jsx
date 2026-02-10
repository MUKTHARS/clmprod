import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Bell,
  User,
  Settings,
  Shield,
  ChevronDown,
  Calendar,
  CheckCircle,
  FileText,
  AlertCircle,
  Sparkles,
  BellRing,
  Home,
  FileBarChart,
  ShieldCheck,
  Users,
  Building,
  Wallet,
  PieChart,
  BookOpen,
  HelpCircle,
  Upload, 
  FileCheck, 
  Key, 
  FolderOpen,
  Archive, 
  UserCheck 
} from 'lucide-react';
import './TopBar.css';

const TopBar = ({ user = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [pageIcon, setPageIcon] = useState(<Home size={20} />);


const getPageTitle = (pathname) => {
  const routes = {
    '/dashboard': { title: 'Dashboard', icon: <Home size={20} /> },
    '/contracts': { title: 'Grants', icon: <FileText size={20} /> },
    '/upload': { title: 'Upload', icon: <Upload size={20} /> }, // Make sure to import Upload icon
    '/review': { title: 'Review', icon: <FileCheck size={20} /> }, // Import FileCheck
    '/program-manager/director-decisions': { title: 'Director Decisions', icon: <Shield size={20} /> },
    '/approvals': { title: 'Approvals', icon: <Shield size={20} /> },
    '/users': { title: 'Users', icon: <Users size={20} /> },
    '/admin': { title: 'Admin Portal', icon: <Key size={20} /> }, // Import Key
    '/drafts/my': { title: 'My Drafts', icon: <FolderOpen size={20} /> },
    '/drafts/assigned': { title: 'Assigned to Me', icon: <FolderOpen size={20} /> },
    '/archive': { title: 'Archive', icon: <Archive size={20} /> }, // Import Archive
    '/approved-contracts': { title: 'Approved', icon: <CheckCircle size={20} /> },
    '/agreements/assigned': { title: 'Assigned to Me', icon: <UserCheck size={20} /> }, // Import UserCheck
    '/agreements/assigned-by-me': { title: 'Assigned by Me', icon: <UserCheck size={20} /> },
    '/copilot': { title: 'AI Copilot', icon: <Sparkles size={20} /> },
    '/settings': { title: 'Settings', icon: <Settings size={20} /> },
  };

  // Find the matching route (checking for exact matches or startsWith)
  for (const [route, info] of Object.entries(routes)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return info;
    }
  }

  // Default fallback - extract from pathname if possible
  const pathSegments = pathname.split('/').filter(seg => seg);
  if (pathSegments.length > 0) {
    // Format: "My Drafts" instead of "my-drafts"
    const formattedTitle = pathSegments[pathSegments.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return { 
      title: formattedTitle, 
      icon: <FileText size={20} /> // Default icon
    };
  }

  return { title: 'Dashboard', icon: <Home size={20} /> };
};

  // Update page title when route changes
  useEffect(() => {
    const pageInfo = getPageTitle(location.pathname);
    setPageTitle(pageInfo.title);
    setPageIcon(pageInfo.icon);
  }, [location.pathname]);

if (!user) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-container">
          <h1 className="page-title">Grant OS</h1>
        </div>
      </div>
    </header>
  );
}
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-container">
          <div className="page-title-content">
             <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">
            </p>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="actions-container">
          {/* Copilot Assistant - Simple navigation */}
          <button 
            className="ai-assistant-btn"
            onClick={() => navigate('/copilot')}
          >
            <span className="ai-icon">
              <Sparkles size={20} />
            </span>
            <span className="ai-label">Copilot</span>
          </button>

          {/* Notifications */}
          <div className="alert-container">
            <button 
              className="alert-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="alert-icon">
                <BellRing size={20} />
              </span>
              <span className="alert-badge">3</span>
            </button>
            
            {showNotifications && (
              <div className="alert-dropdown">
                <div className="dropdown-header">
                  <h4>Notifications</h4>
                  <button className="mark-read">Mark all as read</button>
                </div>
                <div className="notification-list">
                  <div className="notification-item unread">
                    <div className="notification-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">Contract Expiring</p>
                      <p className="notification-desc">Grant #123 expires in 5 days</p>
                      <span className="notification-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="notification-item unread">
                    <div className="notification-icon">
                      <CheckCircle size={18} />
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">Upload Complete</p>
                      <p className="notification-desc">New contract processed successfully</p>
                      <span className="notification-time">1 day ago</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-icon">
                      <AlertCircle size={18} />
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">Analysis Complete</p>
                      <p className="notification-desc">Risk assessment ready for review</p>
                      <span className="notification-time">2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          {/* <div className="profile-container">
            <button 
              className="profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <User size={20} />
            </button>
            
            {showProfile && (
              <div className="profile-dropdown">
                <div className="dropdown-section">
                  <button className="dropdown-item">
                    <span className="item-icon">
                      <User size={18} />
                    </span>
                    Profile Settings
                  </button>
                  <button className="dropdown-item">
                    <span className="item-icon">
                      <Settings size={18} />
                    </span>
                    Account Settings
                  </button>
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-section">
                  <button className="dropdown-item">
                    <span className="item-icon">
                      <Shield size={18} />
                    </span>
                    Privacy & Security
                  </button>
                  <button className="dropdown-item">
                    <span className="item-icon">
                      <FileText size={18} />
                    </span>
                    Documentation
                  </button>
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-section">
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/login')}
                  >
                    <span className="item-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default TopBar;