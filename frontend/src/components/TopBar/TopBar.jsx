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
  AlertCircle,
  Sparkles, // New icon for Copilot
  BellRing // New icon for Notifications
} from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo-container" onClick={() => navigate('/dashboard')}>
          <span className="logo-full-text">Saple Intelligence</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="actions-container">
          {/* Copilot Assistant - New Design */}
          <button className="ai-assistant-btn">
            <span className="ai-icon">
              <Sparkles size={20} />
            </span>
            <span className="ai-label">Copilot</span>
          </button>

          {/* Notifications - New Design */}
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
        </div>
      </div>
    </header>
  );
};

export default TopBar;