import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../Components/context/AuthContext';
import { 
  FaBriefcase, FaUserCircle, FaSignOutAlt, FaTachometerAlt,
  FaUser, FaCog, FaChevronDown, FaSearch, FaBell, FaEnvelope
} from 'react-icons/fa';

const getBaseUrl = () => process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null;
  if (profilePicture.startsWith('http')) return profilePicture;
  return `${getBaseUrl()}${profilePicture}`;
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'company') {
      fetchCompanyProfile();
    } else if (isAuthenticated) {
      setProfilePictureUrl(getProfilePictureUrl(user?.profilePicture));
    } else {
      setProfilePictureUrl(null);
    }
  }, [user, isAuthenticated]);

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
            <Link to="/contact" className="nc-nav-link">Contact</Link>
          </div>

          {/* Right Side */}
          <div className="nc-right">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="nc-icon-btn">
                  <FaBell />
                  <span className="nc-badge">3</span>
                </button>
                
                {/* Messages */}
                <button className="nc-icon-btn">
                  <FaEnvelope />
                  <span className="nc-badge">5</span>
                </button>

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