import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../Components/context/AuthContext';
import { 
  FaBriefcase,
  FaUserCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUser,
  FaCog,
  FaChevronDown,
  FaSearch,
  FaBell,
  FaEnvelope
} from 'react-icons/fa';

// Helper to get base URL from environment or fallback
const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

// Helper to get full profile picture URL
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

  // Fetch company profile if user is a company
  useEffect(() => {
    if (isAuthenticated && user?.role === 'company') {
      fetchCompanyProfile();
    } else if (isAuthenticated) {
      // For students and admins, use user.profilePicture
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
        if (company.companyLogo) {
          setProfilePictureUrl(getProfilePictureUrl(company.companyLogo));
        } else if (user?.profilePicture) {
          setProfilePictureUrl(getProfilePictureUrl(user.profilePicture));
        } else {
          setProfilePictureUrl(null);
        }
      } else {
        // Fallback
        if (user?.profilePicture) {
          setProfilePictureUrl(getProfilePictureUrl(user.profilePicture));
        } else {
          setProfilePictureUrl(null);
        }
      }
    } catch (error) {
      console.error('Error fetching company profile for navbar:', error);
      if (user?.profilePicture) {
        setProfilePictureUrl(getProfilePictureUrl(user.profilePicture));
      } else {
        setProfilePictureUrl(null);
      }
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

  const getBrowseJobsLink = () => {
    return '/jobs';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // For user initials fallback
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <>
      <nav className="jobline-navbar">
        <div className="jobline-navbar-container">
          {/* Logo */}
          <Link to="/" className="jobline-logo">
            <FaBriefcase className="jobline-logo-icon" />
            <span>JobPortal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="jobline-nav-menu">
            <Link to="/" className="jobline-nav-link">Home</Link>
            <Link to="/jobs" className="jobline-nav-link">Browse Jobs</Link>
            <Link to="/about" className="jobline-nav-link">About Us</Link>
            <Link to="/services" className="jobline-nav-link">Services</Link>
            <Link to="/contact" className="jobline-nav-link">Contact</Link>
          </div>

          {/* Right Section */}
          <div className="jobline-nav-right">
            {isAuthenticated ? (
              <>
                {/* Notification Icon */}
                <button className="jobline-icon-btn">
                  <FaBell />
                  <span className="jobline-badge">3</span>
                </button>
                
                {/* Messages Icon */}
                <button className="jobline-icon-btn">
                  <FaEnvelope />
                  <span className="jobline-badge">5</span>
                </button>

                {/* User Dropdown */}
                <div className="jobline-user-dropdown">
                  <button
                    className="jobline-user-btn"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="jobline-user-avatar">
                      {profilePictureUrl ? (
                        <img src={profilePictureUrl} alt={user.name} />
                      ) : (
                        <span>{getUserInitials()}</span>
                      )}
                    </div>
                    <span className="jobline-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
                    <FaChevronDown className={`jobline-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="jobline-dropdown-menu">
                      <div className="jobline-dropdown-header">
                        <div className="jobline-dropdown-user-name">{user?.name}</div>
                        <div className="jobline-dropdown-user-email">{user?.email}</div>
                        <div className={`jobline-role-badge ${user?.role}`}>
                          {user?.role === 'student' ? 'Student' : user?.role === 'company' ? 'Company' : 'Admin'}
                        </div>
                      </div>

                      <Link to={getDashboardLink()} className="jobline-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaTachometerAlt /> Dashboard
                      </Link>

                      <Link to={getProfileLink()} className="jobline-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaUser /> My Profile
                      </Link>

                      <Link to={getBrowseJobsLink()} className="jobline-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaBriefcase /> Find Jobs
                      </Link>

                      <div className="jobline-dropdown-divider"></div>

                      <button onClick={handleLogout} className="jobline-dropdown-item jobline-logout-btn">
                        <FaSignOutAlt /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="jobline-auth-buttons">
                <Link to="/register" className="jobline-btn jobline-btn-primary">Sign Up</Link>
                <Link to="/login" className="jobline-btn jobline-btn-outline">Sign In</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="jobline-mobile-menu-btn" onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`jobline-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="jobline-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/jobs" className="jobline-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Browse Jobs</Link>
          <Link to="/about" className="jobline-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
          <Link to="/services" className="jobline-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
          <Link to="/contact" className="jobline-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>  
          
          {isAuthenticated ? (
            <>
              <div className="jobline-mobile-user-info">
                <div className="jobline-mobile-user-avatar">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt={user.name} />
                  ) : (
                    <span>{getUserInitials()}</span>
                  )}
                </div>
                <div className="jobline-mobile-user-details">
                  <div className="jobline-mobile-user-name">{user?.name}</div>
                  <div className="jobline-mobile-user-email">{user?.email}</div>
                </div>
              </div>
              <Link to={getDashboardLink()} className="jobline-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to={getProfileLink()} className="jobline-mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                My Profile
              </Link>
              <button onClick={handleLogout} className="jobline-mobile-nav-link jobline-mobile-logout">
                Sign Out
              </button>
            </>
          ) : (
            <div className="jobline-mobile-auth">
              <Link to="/register" className="jobline-mobile-btn jobline-mobile-btn-primary" onClick={() => setIsMobileMenuOpen(false)}>
                Sign Up
              </Link>
              <Link to="/login" className="jobline-mobile-btn jobline-mobile-btn-outline" onClick={() => setIsMobileMenuOpen(false)}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;