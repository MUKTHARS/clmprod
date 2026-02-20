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
      '/upload': { title: 'Upload', icon: <Upload size={20} /> },
      '/review': { title: 'Review', icon: <FileCheck size={20} /> },
      '/program-manager/director-decisions': { title: 'Director Decisions', icon: <Shield size={20} /> },
      '/approvals': { title: 'Approvals', icon: <Shield size={20} /> },
      '/users': { title: 'Users', icon: <Users size={20} /> },
      '/admin': { title: 'Admin Portal', icon: <Key size={20} /> },
      '/drafts/my': { title: 'My Drafts', icon: <FolderOpen size={20} /> },
      '/drafts/assigned': { title: 'Assigned to Me', icon: <FolderOpen size={20} /> },
      '/archive': { title: 'Archive', icon: <Archive size={20} /> },
      '/approved-contracts': { title: 'Approved', icon: <CheckCircle size={20} /> },
      '/agreements/assigned': { title: 'Assigned to Me', icon: <UserCheck size={20} /> },
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.tb-alert-container')) {
        setShowNotifications(false);
      }
      if (showProfile && !event.target.closest('.tb-profile-container')) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showProfile]);

  // Update page title when route changes
  useEffect(() => {
    const pageInfo = getPageTitle(location.pathname);
    setPageTitle(pageInfo.title);
    setPageIcon(pageInfo.icon);
  }, [location.pathname]);

  if (!user) {
    return (
      <header className="tb-topbar">
        <div className="tb-topbar-left">
          <div className="tb-page-title-container">
            <h1 className="tb-page-title">Grant OS</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="tb-topbar">
      <div className="tb-topbar-left">
        <div className="tb-page-title-container">
          <div className="tb-page-title-content">
            <h1 className="tb-page-title">{pageTitle}</h1>
            <p className="tb-page-subtitle"></p>
          </div>
        </div>
      </div>

      <div className="tb-topbar-right">
        <div className="tb-actions-container">
          {/* Copilot Assistant - Simple navigation */}
          <button 
            className="tb-ai-assistant-btn"
            onClick={() => navigate('/copilot')}
          >
            <span className="tb-ai-icon">
              <Sparkles size={20} />
            </span>
            <span className="tb-ai-label">Copilot</span>
          </button>

          {/* Notifications */}
          <div className="tb-alert-container">
            <button 
              className="tb-alert-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="tb-alert-icon">
                <BellRing size={20} />
              </span>
              <span className="tb-alert-badge">3</span>
            </button>
            
            {showNotifications && (
              <div className="tb-alert-dropdown">
                <div className="tb-dropdown-header">
                  <h4>Notifications</h4>
                  <button className="tb-mark-read">Mark all as read</button>
                </div>
                <div className="tb-notification-list">
                  <div className="tb-notification-item tb-unread">
                    <div className="tb-notification-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="tb-notification-content">
                      <p className="tb-notification-title">Contract Expiring</p>
                      <p className="tb-notification-desc">Grant #123 expires in 5 days</p>
                      <span className="tb-notification-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="tb-notification-item tb-unread">
                    <div className="tb-notification-icon">
                      <CheckCircle size={18} />
                    </div>
                    <div className="tb-notification-content">
                      <p className="tb-notification-title">Upload Complete</p>
                      <p className="tb-notification-desc">New contract processed successfully</p>
                      <span className="tb-notification-time">1 day ago</span>
                    </div>
                  </div>
                  <div className="tb-notification-item">
                    <div className="tb-notification-icon">
                      <AlertCircle size={18} />
                    </div>
                    <div className="tb-notification-content">
                      <p className="tb-notification-title">Analysis Complete</p>
                      <p className="tb-notification-desc">Risk assessment ready for review</p>
                      <span className="tb-notification-time">2 days ago</span>
                    </div>
                  </div>
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