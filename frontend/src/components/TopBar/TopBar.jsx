import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/contracts') return 'Contracts';
    if (path === '/upload') return 'Upload Contract';
    if (path.startsWith('/contracts/')) return 'Contract Details';
    if (path === '/analytics') return 'Analytics';
    if (path === '/reports') return 'Reports';
    if (path === '/settings') return 'Settings';
    return 'Grant Analyzer';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="breadcrumb">
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <div className="actions-container">
          {/* Copilot Assistant */}
          <button className="action-btn copilot-btn">
            <span className="action-icon">🤖</span>
            <span className="action-label">Copilot</span>
          </button>

          {/* Notifications */}
          <div className="notification-container">
            <button 
              className="action-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="action-icon">🔔</span>
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
                    <div className="notification-icon">📅</div>
                    <div className="notification-content">
                      <p className="notification-title">Contract Expiring</p>
                      <p className="notification-desc">Grant #123 expires in 5 days</p>
                      <span className="notification-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="notification-item unread">
                    <div className="notification-icon">✅</div>
                    <div className="notification-content">
                      <p className="notification-title">Upload Complete</p>
                      <p className="notification-desc">New contract processed successfully</p>
                      <span className="notification-time">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="profile-container">
            <button 
              className="profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="profile-avatar">
                <span>👤</span>
              </div>
              <div className="profile-info">
                <span className="profile-name">John Doe</span>
                <span className="profile-role">Admin</span>
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showProfile && (
              <div className="profile-dropdown">
                <div className="dropdown-section">
                  <button className="dropdown-item">
                    <span className="item-icon">👤</span>
                    <span>My Profile</span>
                  </button>
                  <button className="dropdown-item">
                    <span className="item-icon">⚙️</span>
                    <span>Settings</span>
                  </button>
                  <button className="dropdown-item">
                    <span className="item-icon">🛡️</span>
                    <span>Security</span>
                  </button>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-section">
                  <button className="dropdown-item logout">
                    <span className="item-icon">🚪</span>
                    <span>Log Out</span>
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