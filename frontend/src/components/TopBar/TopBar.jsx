import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Removed getPageTitle function since we're not using it anymore

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo-container" onClick={() => navigate('/dashboard')}>
          {/* <div className="topbar-logo">
            <span className="logo-text">GA</span>
          </div> */}
          {/* Optional: Add logo text on desktop if you want */}
          <span className="logo-full-text">Saple Intelligence</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="actions-container">
          {/* Copilot Assistant */}
          <button className="action-btn copilot-btn">
            <span className="action-icon">
              <Bot size={18} />
            </span>
            <span className="action-label">Copilot</span>
          </button>

          {/* Notifications */}
          <div className="notification-container">
            <button 
              className="action-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="action-icon">
                <Bell size={18} />
              </span>
              <span className="badge">3</span>
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
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

          {/* User Profile */}
          <div className="profile-container">
            {/* <button 
              className="profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="profile-avatar">
                <User size={18} />
              </div>
              <div className="profile-info">
                <span className="profile-name">John Doe</span>
                <span className="profile-role">Admin</span>
              </div>
              <span className="dropdown-arrow">
                <ChevronDown size={14} />
              </span>
            </button> */}
            
            {showProfile && (
              <div className="profile-dropdown">
                <div className="dropdown-section">
                  <button className="dropdown-item">
                    <span className="item-icon">
                      <FileText size={18} />
                    </span>
                    <span>My Profile</span>
                  </button>
                  <button className="dropdown-item">
                    <span className="item-icon">
                      <Settings size={18} />
                    </span>
                    <span>Settings</span>
                  </button>
                  <button className="dropdown-item">
                    <span className="item-icon">
                      <Shield size={18} />
                    </span>
                    <span>Security</span>
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