import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  BellRing,
  Upload,
  FileCheck,
  Clock,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';
import './TopBar.css';
import API_CONFIG from '../../config';

// Status-change notification types that require a PM login popup
const STATUS_CHANGE_TYPES = ['modification_requested', 'status_rejected', 'status_reviewed', 'status_approved'];

const TopBar = ({ user = null }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const pollIntervalRef = useRef(null);
  const [loginAlerts, setLoginAlerts] = useState([]);   // status-change notifs to show on login
  const [showLoginPopup, setShowLoginPopup] = useState(false);


  const getNotificationIcon = (type) => {
    switch (type) {
      case 'grant_uploaded':           return <Upload size={16} />;
      case 'pgm_assigned':
      case 'director_assigned':        return <UserPlus size={16} />;
      case 'agreement_published':      return <Eye size={16} />;
      case 'status_under_review':      return <Clock size={16} />;
      case 'status_reviewed':          return <FileCheck size={16} />;
      case 'status_approved':          return <ThumbsUp size={16} />;
      case 'status_rejected':          return <ThumbsDown size={16} />;
      case 'modification_requested':   return <AlertTriangle size={16} />;
      default:                         return <Bell size={16} />;
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.slice(0, 10));
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      // silent fail - notifications are non-critical
    }
  };

  const handleMarkAsRead = async (notifId, contractId) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { /* ignore */ }
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    setShowNotifications(false);
    if (contractId) {
      navigate(`/app/contracts/${contractId}`);
    }
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { /* ignore */ }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    pollIntervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollIntervalRef.current);
  }, [user]);

  // On login, check for unread status-change notifications and show popup
  useEffect(() => {
    if (!user) {
      // Reset popup state on logout so it shows again on next login
      setShowLoginPopup(false);
      setLoginAlerts([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_CONFIG.BASE_URL}/api/notifications?unread_only=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const alerts = (data || []).filter(n => STATUS_CHANGE_TYPES.includes(n.type));
        if (alerts.length > 0) {
          setLoginAlerts(alerts);
          setShowLoginPopup(true);
        }
      })
      .catch(() => {});
  }, [user]);

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


  const handleDismissLoginPopup = async () => {
    setShowLoginPopup(false);
    const token = localStorage.getItem('token');
    if (!token) return;
    // Mark each alert notification as read
    for (const n of loginAlerts) {
      try {
        await fetch(`${API_CONFIG.BASE_URL}/api/notifications/${n.id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (_) { /* ignore */ }
    }
    // Refresh notification list
    fetchNotifications();
  };

  const getLoginAlertIcon = (type) => {
    switch (type) {
      case 'modification_requested': return <AlertTriangle size={18} style={{ color: '#f97316' }} />;
      case 'status_rejected':        return <ThumbsDown size={18} style={{ color: '#ef4444' }} />;
      case 'status_reviewed':        return <FileCheck size={18} style={{ color: '#3b82f6' }} />;
      case 'status_approved':        return <ThumbsUp size={18} style={{ color: '#22c55e' }} />;
      default:                       return <Bell size={18} />;
    }
  };

  if (!user) {
    return (
      <header className="tb-topbar">
        <div className="tb-topbar-left">
          <div className="tb-brand">
            <span className="tb-brand-logo">GrantOS</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
    <header className="tb-topbar">
      <div className="tb-topbar-left">
        <div className="tb-brand">
          <span className="tb-brand-logo">GrantOS</span>
        </div>
      </div>

      <div className="tb-topbar-right">
        <div className="tb-actions-container">
          {/* Copilot Assistant - Simple navigation */}
          <button 
            className="tb-ai-assistant-btn"
            onClick={() => navigate('/app/copilot')}
          >
            <span className="tb-ai-icon">
              <Sparkles size={12} />
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
                {unreadCount > 0 ? <BellRing size={14} /> : <Bell size={14} />}
              </span>
              {unreadCount > 0 && (
                <span className="tb-alert-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="tb-alert-dropdown">
                <div className="tb-dropdown-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button className="tb-mark-read" onClick={handleMarkAllRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="tb-notification-list">
                  {notifications.length === 0 ? (
                    <div className="tb-notification-empty">
                      <Bell size={32} />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`tb-notification-item${!notif.is_read ? ' tb-unread' : ''}`}
                        onClick={() => handleMarkAsRead(notif.id, notif.contract_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="tb-notification-icon">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="tb-notification-content">
                          <p className="tb-notification-title">{notif.title}</p>
                          <p className="tb-notification-desc">{notif.message}</p>
                          <span className="tb-notification-time">{getTimeAgo(notif.created_at)}</span>
                        </div>
                        {!notif.is_read && <div className="tb-unread-dot" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>

    {/* Login status-change popup — rendered via portal to avoid stacking context issues */}
    {showLoginPopup && loginAlerts.length > 0 && ReactDOM.createPortal(
      <div className="tb-login-popup-overlay">
        <div className="tb-login-popup">
          <div className="tb-login-popup-header">
            <BellRing size={20} />
            <h3>Updates While You Were Away</h3>
            <button className="tb-login-popup-close" onClick={handleDismissLoginPopup}>
              <X size={18} />
            </button>
          </div>
          <div className="tb-login-popup-body">
            {loginAlerts.map(n => (
              <div
                key={n.id}
                className="tb-login-popup-item"
                onClick={() => {
                  handleDismissLoginPopup();
                  if (n.contract_id) navigate(`/app/contracts/${n.contract_id}`);
                }}
              >
                <div className="tb-login-popup-icon">{getLoginAlertIcon(n.type)}</div>
                <div className="tb-login-popup-text">
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                  <small>{getTimeAgo(n.created_at)}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="tb-login-popup-footer">
            <button className="tb-login-popup-btn" onClick={handleDismissLoginPopup}>
              Got it
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
};

export default TopBar;