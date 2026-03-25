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
  FaTimes,
  FaCalendarAlt,
  FaVideo,
  FaComments,
  FaStar,
  FaRegStar,
  FaChartLine,
  FaEnvelope,
  FaBell,
  FaSearch,
  FaFilter
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

  // Student Sidebar Items (Browse Jobs REMOVED)
  const studentMenuItems = [
    { title: 'Dashboard', path: '/student/dashboard', icon: <FaTachometerAlt /> },
    { title: 'My Profile', path: '/student/profile', icon: <FaUser /> },
    { title: 'My Applications', path: '/student/applied-jobs', icon: <FaClipboardList />, badge: 'new' },
    { title: 'Saved Jobs', path: '/student/saved-jobs', icon: <FaHeart /> },
    { title: 'CV Manager', path: '/student/cv-manager', icon: <FaFileAlt /> },
    { title: 'My Interviews', path: '/student/interviews', icon: <FaCalendarAlt />, badge: 'new' }
  ];

  // Company Sidebar Items (Jobs related items are kept as is)
  const companyMenuItems = [
    { title: 'Dashboard', path: '/company/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Company Profile', path: '/company/profile', icon: <FaBuilding /> },
    { title: 'Post New Job', path: '/company/post-job', icon: <FaPlusCircle /> },
    { title: 'Manage Jobs', path: '/company/manage-jobs', icon: <FaListAlt /> },
    { title: 'Applications', path: '/company/applicants', icon: <FaUsers />, badge: 'new' },
    { title: 'Interviews', path: '/company/interviews', icon: <FaCalendarAlt /> }
  ];

  // Admin Sidebar Items
  const adminMenuItems = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Admin Profile', path: '/admin/profile', icon: <FaUserTie /> },
    { title: 'Manage Users', path: '/admin/users', icon: <FaUsers /> },
    { title: 'Manage Companies', path: '/admin/companies', icon: <FaBuilding /> },
    { title: 'Verification Requests', path: '/admin/verifications', icon: <FaCheckCircle />, badge: 'pending' },
    { title: 'Reports', path: '/admin/reports', icon: <FaChartLine /> }
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role color for badge
  const getRoleColor = () => {
    switch(user?.role) {
      case 'student': return '#48bb78';
      case 'company': return '#4299e1';
      case 'admin': return '#ed8936';
      default: return '#a0aec0';
    }
  };

  // Get role icon
  const getRoleIcon = () => {
    switch(user?.role) {
      case 'student': return <FaUserGraduate />;
      case 'company': return <FaBuilding />;
      case 'admin': return <FaShieldAlt />;
      default: return <FaUser />;
    }
  };

  return (
    <div className="app-dashboard-layout">
      {/* Mobile Toggle Button */}
      <button className="app-sidebar-toggle-btn" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* User Info */}
        <div className="app-sidebar-user-info">
          <div className="app-user-avatar-large" style={{ background: `linear-gradient(135deg, ${getRoleColor()}, ${getRoleColor()}cc)` }}>
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="app-avatar-image" />
            ) : (
              <div className="app-avatar-placeholder">
                {getUserInitials()}
              </div>
            )}
          </div>
          <div className="app-user-details">
            <h4>{user?.name || 'User'}</h4>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="app-sidebar-nav">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path} 
                  className={`app-sidebar-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="app-nav-icon">{item.icon}</span>
                  <span className="app-nav-title">{item.title}</span>
                  {item.badge && (
                    <span className={`app-nav-badge ${item.badge}`}>{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Menu */}
        <div className="app-sidebar-footer">
          <ul>
            <li>
              <Link to="/settings" className="app-sidebar-nav-link" onClick={() => setIsOpen(false)}>
                <span className="app-nav-icon"><FaCog /></span>
                <span className="app-nav-title">Settings</span>
              </Link>
            </li>
            <li>
              <Link to="/help" className="app-sidebar-nav-link" onClick={() => setIsOpen(false)}>
                <span className="app-nav-icon"><FaQuestionCircle /></span>
                <span className="app-nav-title">Help & Support</span>
              </Link>
            </li>
            <li className="app-divider"></li>
            <li>
              <button onClick={handleLogout} className="app-sidebar-nav-link app-logout-btn">
                <span className="app-nav-icon"><FaSignOutAlt /></span>
                <span className="app-nav-title">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-main-content">
        {children}
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="app-sidebar-overlay" onClick={toggleSidebar}></div>}
    </div>
  );
};

export default Sidebar;