// frontend/src/Components/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';
import { 
  FaTachometerAlt,
  FaUser,
  FaBriefcase,
  FaFileAlt,
  FaHeart,
  FaClipboardList,
  FaBuilding,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaQuestionCircle,
  FaPlusCircle,
  FaListAlt,
  FaUserGraduate,
  FaUserTie,
  FaShieldAlt,
  FaCheckCircle,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const Sidebar = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Student Sidebar Items
  const studentMenuItems = [
    { title: 'Dashboard', path: '/student/dashboard', icon: <FaTachometerAlt /> },
    { title: 'My Profile', path: '/student/profile', icon: <FaUser /> },
    { title: 'Browse Jobs', path: '/student/jobs', icon: <FaBriefcase /> },
    { title: 'My Applications', path: '/student/applied-jobs', icon: <FaClipboardList />, badge: 'new' },
    { title: 'Saved Jobs', path: '/student/saved-jobs', icon: <FaHeart /> },
    { title: 'CV Manager', path: '/student/cv-manager', icon: <FaFileAlt /> }
  ];

  // Company Sidebar Items
  const companyMenuItems = [
    { title: 'Dashboard', path: '/company/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Company Profile', path: '/company/profile', icon: <FaBuilding /> },
    { title: 'Post New Job', path: '/company/post-job', icon: <FaPlusCircle /> },
    { title: 'Manage Jobs', path: '/company/manage-jobs', icon: <FaListAlt /> },
    { title: 'Applications', path: '/company/applicants', icon: <FaUsers />, badge: 'new' }
  ];

  // Admin Sidebar Items
  const adminMenuItems = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Admin Profile', path: '/admin/profile', icon: <FaUserTie /> },
    { title: 'Manage Users', path: '/admin/users', icon: <FaUsers /> },
    { title: 'Manage Companies', path: '/admin/companies', icon: <FaBuilding /> },
    { title: 'Verification Requests', path: '/admin/verifications', icon: <FaCheckCircle />, badge: 'pending' }
  ];

  const getMenuItems = () => {
    if (!user) return [];
    switch(user.role) {
      case 'student': return studentMenuItems;
      case 'company': return companyMenuItems;
      case 'admin': return adminMenuItems;
      default: return [];
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="ds-dashboard-container">
      {/* Mobile Toggle Button */}
      <button className="ds-sidebar-toggle-btn" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div className={`ds-sidebar ${isOpen ? 'open' : ''}`}>
        {/* User Info */}
        <div className="ds-sidebar-user-info">
          <div className="ds-user-avatar-large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ds-user-details">
            <h4>{user?.name}</h4>
            <p>{user?.email}</p>
            <span className={`ds-role-badge ${user?.role}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="ds-sidebar-nav">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path} 
                  className={`ds-sidebar-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="ds-nav-icon">{item.icon}</span>
                  <span className="ds-nav-title">{item.title}</span>
                  {item.badge && (
                    <span className={`ds-nav-badge ${item.badge}`}>{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Menu */}
        <div className="ds-sidebar-footer">
          <ul>
            <li>
              <Link to="/settings" className="ds-sidebar-nav-link" onClick={() => setIsOpen(false)}>
                <span className="ds-nav-icon"><FaCog /></span>
                <span className="ds-nav-title">Settings</span>
              </Link>
            </li>
            <li>
              <Link to="/help" className="ds-sidebar-nav-link" onClick={() => setIsOpen(false)}>
                <span className="ds-nav-icon"><FaQuestionCircle /></span>
                <span className="ds-nav-title">Help</span>
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="ds-sidebar-nav-link ds-logout-btn">
                <span className="ds-nav-icon"><FaSignOutAlt /></span>
                <span className="ds-nav-title">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="ds-main-content">
        {children}
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="ds-sidebar-overlay" onClick={toggleSidebar}></div>}
    </div>
  );
};

export default Sidebar;