import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  TrendingUp,
  BarChart3,
  Settings,
  User
} from 'lucide-react';
import './Sidebar.css';

// Import your square logo image
// Note: You need to add your actual logo image to your project
import logoImage from '../../assets/saple_favicon.png'
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'contracts', label: 'Contracts', icon: FileText, path: '/contracts' },
    { id: 'upload', label: 'Upload', icon: Upload, path: '/upload' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => handleNavigation('/dashboard')} title="Grant Analyzer">
          <div className="logo-image-container">
            <img 
              src={logoImage} 
              alt="Grant Analyzer Logo" 
              className="logo-image"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="logo-fallback">GA</span>';
              }}
            />
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  title={item.label}
                >
                  <span className="nav-icon">
                    <IconComponent size={22} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" title="John Doe - Admin">
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;