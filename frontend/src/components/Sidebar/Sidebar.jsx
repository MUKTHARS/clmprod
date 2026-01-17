import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isMobileOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/dashboard' },
    { id: 'contracts', label: 'Contracts', icon: '📋', path: '/contracts' },
    { id: 'upload', label: 'Upload', icon: '📤', path: '/upload' },
    { id: 'analytics', label: 'Analytics', icon: '📊', path: '/analytics' },
    { id: 'reports', label: 'Reports', icon: '📄', path: '/reports' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 1024) {
      onClose?.();
    }
  };

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container" onClick={() => handleNavigation('/dashboard')}>
            <img 
              src="/assets/logo.svg" 
              alt="Grant Analyzer Logo" 
              className="logo"
            />
            {!isCollapsed && <span className="logo-text">Grant Analyzer</span>}
          </div>
          <button className="collapse-btn" onClick={toggleSidebar}>
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  {!isCollapsed && location.pathname === item.path && (
                    <span className="active-indicator"></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="user-profile">
              <div className="user-avatar">
                <span>👤</span>
              </div>
              <div className="user-info">
                <p className="user-name">John Doe</p>
                <p className="user-role">Admin</p>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      {/* Mobile overlay */}
{isMobileOpen && window.innerWidth <= 1024 && !isCollapsed && (
        <div className={`mobile-overlay ${isMobileOpen ? 'active' : ''}`} onClick={onClose} />
      )}
    </>
  );
};

export default Sidebar;