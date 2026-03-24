// frontend/src/Components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';
import { 
  FaBriefcase,
  FaUserCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUser,
  FaCog,
  FaChevronDown
} from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch(user?.role) {
      case 'student': return '/student/dashboard';
      case 'company': return '/company/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  const getProfileLink = () => {
    if (!user) return '/';
    switch(user?.role) {
      case 'student': return '/student/profile';
      case 'company': return '/company/profile';
      case 'admin': return '/admin/profile';
      default: return '/';
    }
  };

  return (
    <nav className="ds-navbar">
      <div className="ds-navbar-container">
        {/* Logo */}
        <Link to="/" className="ds-navbar-logo">
          <FaBriefcase className="ds-logo-icon" />
          <span>JobPortal</span>
        </Link>

        {/* Center Navigation */}
        <div className="ds-navbar-menu">
          <Link to="/" className="ds-nav-link">Home</Link>
          <Link to="/about" className="ds-nav-link">About Us</Link>
          <Link to="/services" className="ds-nav-link">Services</Link>
          <Link to="/featured" className="ds-nav-link">Featured</Link>
          <Link to="/contact" className="ds-nav-link">Contact</Link>
        </div>

        {/* Right Section */}
        <div className="ds-navbar-right">
          {isAuthenticated ? (
            <div className="ds-user-dropdown">
              <button
                className="ds-user-dropdown-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <FaUserCircle className="ds-user-icon" />
                <span className="ds-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
                <FaChevronDown className={`ds-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="ds-dropdown-menu">
                  <div className="ds-dropdown-header">
                    <div className="ds-dropdown-user-name">{user?.name}</div>
                    <div className="ds-dropdown-user-email">{user?.email}</div>
                    <div className={`ds-role-badge ${user?.role}`}>
                      {user?.role}
                    </div>
                  </div>

                  <Link to={getDashboardLink()} className="ds-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <FaTachometerAlt /> Dashboard
                  </Link>

                  <Link to={getProfileLink()} className="ds-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <FaUser /> My Profile
                  </Link>

                  <Link to="/settings" className="ds-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <FaCog /> Settings
                  </Link>

                  <div className="ds-dropdown-divider"></div>

                  <button onClick={handleLogout} className="ds-dropdown-item logout">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ds-auth-buttons">
              <Link to="/login" className="ds-btn-login">Login</Link>
              <Link to="/register" className="ds-btn-register">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;