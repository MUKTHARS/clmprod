import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  TrendingUp,
  BarChart3,
  Settings,
  User,
  LogOut,
  Shield,
  Users,
  FileCheck
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['project_manager', 'director'] },
      { id: 'contracts', label: 'Contracts', icon: FileText, path: '/contracts', roles: ['project_manager', 'program_manager', 'director'] },
      { id: 'upload', label: 'Upload', icon: Upload, path: '/upload', roles: ['project_manager'] },
    ];

    if (user.role === 'program_manager') {
      baseItems.push(
        { id: 'review', label: 'Review', icon: FileCheck, path: '/review', roles: ['program_manager'] }
      );
    }

    if (user.role === 'director') {
      baseItems.push(
        { id: 'approvals', label: 'Approvals', icon: Shield, path: '/approvals', roles: ['director'] },
        { id: 'users', label: 'Users', icon: Users, path: '/users', roles: ['director'] }
      );
    }

    return baseItems.filter(item => item.roles.includes(user.role));
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => handleNavigation('/dashboard')} title="Grant Analyzer">
  <div className="logo-text">
    <span className="logo-text-primary">GRANT</span>
    <span className="logo-text-secondary">ANALYZER</span>
  </div>
</div>
      </div>

      <div className="user-profile-section">
        <div className="user-avatar">
          <User size={24} />
        </div>
        <div className="user-info">
          <div className="user-name">{user?.full_name || user?.username}</div>
          <div className={`user-role role-${user?.role}`}>
            {user?.role?.replace('_', ' ').toUpperCase()}
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
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;


// import React from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import {
//   LayoutDashboard,
//   FileText,
//   Upload,
//   TrendingUp,
//   BarChart3,
//   Settings,
//   User
// } from 'lucide-react';
// import './Sidebar.css';

// // Import your square logo image
// // Note: You need to add your actual logo image to your project
// import logoImage from '../../assets/saple_favicon.png'
// const Sidebar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const menuItems = [
//     { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
//     { id: 'contracts', label: 'Contracts', icon: FileText, path: '/contracts' },
//     { id: 'upload', label: 'Upload', icon: Upload, path: '/upload' },
//     { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/analytics' },
//     { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
//     { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
//   ];

//   const handleNavigation = (path) => {
//     navigate(path);
//   };

//   return (
//     <aside className="sidebar">
//       <div className="sidebar-header">
//         <div className="logo-container" onClick={() => handleNavigation('/dashboard')} title="Grant Analyzer">
//           <div className="logo-image-container">
//             <img 
//               src={logoImage} 
//               alt="Grant Analyzer Logo" 
//               className="logo-image"
//               onError={(e) => {
//                 // Fallback if image fails to load
//                 e.target.style.display = 'none';
//                 e.target.parentElement.innerHTML = '<span class="logo-fallback">GA</span>';
//               }}
//             />
//           </div>
//         </div>
//       </div>

//       <nav className="sidebar-nav">
//         <ul className="nav-menu">
//           {menuItems.map((item) => {
//             const IconComponent = item.icon;
//             return (
//               <li key={item.id}>
//                 <button
//                   className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
//                   onClick={() => handleNavigation(item.path)}
//                   title={item.label}
//                 >
//                   <span className="nav-icon">
//                     <IconComponent size={22} />
//                   </span>
//                 </button>
//               </li>
//             );
//           })}
//         </ul>
//       </nav>

//       <div className="sidebar-footer">
//         <div className="user-profile" title="John Doe - Admin">
//           <div className="user-avatar">
//             <User size={20} />
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;