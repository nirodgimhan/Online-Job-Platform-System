import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../Components/context/AuthContext';
import DarkModeToggle from './DarkModeToggle';  // <-- ADD THIS IMPORT
import { 
  FaBriefcase, FaUserCircle, FaSignOutAlt, FaTachometerAlt,
  FaUser, FaCog, FaChevronDown, FaSearch, FaBell, FaEnvelope,
  FaCheckDouble, FaTrash
} from 'react-icons/fa';

const getBaseUrl = () => process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null;
  if (profilePicture.startsWith('http')) return profilePicture;
  return `${getBaseUrl()}${profilePicture}`;
};

// Simple relative time formatter (no external dependency)
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'company') {
      fetchCompanyProfile();
    } else if (isAuthenticated) {
      setProfilePictureUrl(getProfilePictureUrl(user?.profilePicture));
    } else {
      setProfilePictureUrl(null);
    }
  }, [user, isAuthenticated]);

  // Fetch notifications for any logged-in user
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await API.get('/companies/profile');
      if (response.data.success) {
        const company = response.data.company;
        setCompanyProfile(company);
        setProfilePictureUrl(getProfilePictureUrl(company.companyLogo || user?.profilePicture));
      } else {
        setProfilePictureUrl(getProfilePictureUrl(user?.profilePicture));
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
      setProfilePictureUrl(getProfilePictureUrl(user?.profilePicture));
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications?limit=10');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
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

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <>
      <nav className="nc-navbar">
        <div className="nc-container">
          {/* Logo */}
          <Link to="/" className="nc-logo">
            <FaBriefcase className="nc-logo-icon" />
            <span>JobPortal</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nc-nav-links">
            <Link to="/" className="nc-nav-link">Home</Link>
            <Link to="/jobs" className="nc-nav-link">Browse Jobs</Link>
            <Link to="/about" className="nc-nav-link">About Us</Link>
            <Link to="/services" className="nc-nav-link">Services</Link>
            <Link to="/contact" className="nc-nav-link">ContactUs</Link>
          </div>

          {/* Right Side */}
          <div className="nc-right">
            {/* Dark Mode Toggle Button */}
            <DarkModeToggle />

            {isAuthenticated ? (
              <>
                {/* Notifications Dropdown */}
                <div className="nc-notif-dropdown">
                  <button
                    className="nc-icon-btn"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <FaBell />
                    {unreadCount > 0 && <span className="nc-badge">{unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div className="nc-dropdown-menu nc-notif-menu">
                      <div className="nc-notif-header">
                        <strong>Notifications</strong>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="nc-notif-markall">
                            <FaCheckDouble /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="nc-notif-list">
                        {notifications.length === 0 ? (
                          <div className="nc-notif-item">No notifications</div>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif._id} className={`nc-notif-item ${!notif.isRead ? 'unread' : ''}`}>
                              <div className="nc-notif-content">
                                <div className="nc-notif-title">{notif.title}</div>
                                <div className="nc-notif-message">{notif.message}</div>
                                <div className="nc-notif-time">
                                  {formatRelativeTime(notif.createdAt)}
                                </div>
                              </div>
                              <div className="nc-notif-actions">
                                {!notif.isRead && (
                                  <button onClick={() => markAsRead(notif._id)} title="Mark as read">
                                    <FaCheckDouble />
                                  </button>
                                )}
                                <button onClick={() => deleteNotification(notif._id)} title="Delete">
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="nc-notif-footer">
                        <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                          View All
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="nc-dropdown">
                  <button
                    className="nc-dropdown-trigger"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="nc-avatar">
                      {profilePictureUrl ? (
                        <img src={profilePictureUrl} alt={user.name} />
                      ) : (
                        <span>{getUserInitials()}</span>
                      )}
                    </div>
                    <span className="nc-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
                    <FaChevronDown className={`nc-arrow ${isDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="nc-dropdown-menu">
                      <div className="nc-dropdown-header">
                        <div className="nc-dropdown-name">{user?.name}</div>
                        <div className="nc-dropdown-email">{user?.email}</div>
                        <div className={`nc-role-badge ${user?.role}`}>
                          {user?.role === 'student' ? 'Student' : user?.role === 'company' ? 'Company' : 'Admin'}
                        </div>
                      </div>

                      <Link to={getDashboardLink()} className="nc-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaTachometerAlt /> Dashboard
                      </Link>

                      <Link to={getProfileLink()} className="nc-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaUser /> My Profile
                      </Link>

                      <Link to="/jobs" className="nc-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaBriefcase /> Find Jobs
                      </Link>

                      <div className="nc-divider"></div>

                      <button onClick={handleLogout} className="nc-dropdown-item nc-logout-btn">
                        <FaSignOutAlt /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="nc-auth-buttons">
                <Link to="/register" className="nc-btn nc-btn-primary">Sign Up</Link>
                <Link to="/login" className="nc-btn nc-btn-outline">Sign In</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="nc-mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`nc-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nc-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/jobs" className="nc-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Browse Jobs</Link>
          <Link to="/about" className="nc-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
          <Link to="/services" className="nc-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
          <Link to="/contact" className="nc-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          
          {isAuthenticated ? (
            <>
              <div className="nc-mobile-user">
                <div className="nc-mobile-avatar">
                  {profilePictureUrl ? <img src={profilePictureUrl} alt={user.name} /> : <span>{getUserInitials()}</span>}
                </div>
                <div className="nc-mobile-info">
                  <div className="nc-mobile-name">{user?.name}</div>
                  <div className="nc-mobile-email">{user?.email}</div>
                </div>
              </div>
              <Link to={getDashboardLink()} className="nc-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link to={getProfileLink()} className="nc-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
              <button onClick={handleLogout} className="nc-mobile-link nc-mobile-logout">Sign Out</button>
            </>
          ) : (
            <div className="nc-mobile-auth">
              <Link to="/register" className="nc-mobile-btn nc-mobile-btn-primary" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
              <Link to="/login" className="nc-mobile-btn nc-mobile-btn-outline" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;