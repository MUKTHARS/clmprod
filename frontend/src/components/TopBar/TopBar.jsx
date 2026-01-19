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
  HelpCircle
} from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [pageIcon, setPageIcon] = useState(<Home size={20} />);

  // Function to get page title based on current route
  const getPageTitle = (pathname) => {
    const routes = {
      '/dashboard': { title: 'Dashboard', icon: <Home size={20} /> },
      '/contracts': { title: 'Contracts', icon: <FileText size={20} /> },
      '/risk': { title: 'Risk Analysis', icon: <ShieldCheck size={20} /> },
      '/compliance': { title: 'Compliance', icon: <Shield size={20} /> },
      '/grants': { title: 'Grants', icon: <Wallet size={20} /> },
      '/reports': { title: 'Reports', icon: <FileBarChart size={20} /> },
      '/analytics': { title: 'Analytics', icon: <PieChart size={20} /> },
      '/organizations': { title: 'Organizations', icon: <Building size={20} /> },
      '/users': { title: 'Users', icon: <Users size={20} /> },
      '/knowledge': { title: 'Knowledge Base', icon: <BookOpen size={20} /> },
      '/help': { title: 'Help & Support', icon: <HelpCircle size={20} /> },
      '/settings': { title: 'Settings', icon: <Settings size={20} /> },
      '/upload': { title: 'Upload', icon: <FileText size={20} /> },
    };

    // Find the matching route
    for (const [route, info] of Object.entries(routes)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        return info;
      }
    }

    // Default fallback
    return { title: 'Dashboard', icon: <Home size={20} /> };
  };

  // Update page title when route changes
  useEffect(() => {
    const pageInfo = getPageTitle(location.pathname);
    setPageTitle(pageInfo.title);
    setPageIcon(pageInfo.icon);
  }, [location.pathname]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-container">
          {/* <div className="page-icon">
            {pageIcon}
          </div> */}
          <div className="page-title-content">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">
              {/* {location.pathname === '/dashboard' 
                ? 'Welcome back! Here\'s what\'s happening with your contracts today.'
                : ''} */}
            </p>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="actions-container">
          {/* Copilot Assistant */}
          <button className="ai-assistant-btn">
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
          <div className="profile-container">
         
            
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;