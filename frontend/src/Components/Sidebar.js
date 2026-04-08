import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, API } from '../Components/context/AuthContext';
import { 
  FaTachometerAlt, FaUser, FaBriefcase, FaFileAlt, FaHeart,
  FaClipboardList, FaBuilding, FaUsers, FaCog, FaSignOutAlt,
  FaQuestionCircle, FaPlusCircle, FaListAlt, FaUserGraduate,
  FaUserTie, FaShieldAlt, FaCheckCircle, FaBars, FaTimes,
  FaCalendarAlt, FaVideo, FaComments, FaStar, FaRegStar,
  FaChartLine, FaEnvelope, FaBell, FaSearch, FaFilter
} from 'react-icons/fa';

const getBaseUrl = () => process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Sidebar = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (user?.role === 'student') {
        if (user.profilePicture) {
          setProfilePicture(user.profilePicture);
        } else {
          try {
            const response = await API.get('/students/profile');
            if (response.data.success) {
              const studentData = response.data.student;
              setStudentProfile(studentData);
              setProfilePicture(studentData.profilePhoto || null);
            } else setProfilePicture(null);
          } catch (error) {
            console.error(error);
            setProfilePicture(null);
          }
        }
        return;
      }
      if (user?.role === 'company') {
        if (user.companyLogo) {
          setProfilePicture(user.companyLogo);
          return;
        }
        try {
          const response = await API.get('/companies/profile');
          if (response.data.success) {
            const company = response.data.company;
            setCompanyProfile(company);
            setProfilePicture(company.companyLogo || user?.profilePicture || null);
          } else setProfilePicture(user?.profilePicture || null);
        } catch (error) {
          console.error(error);
          setProfilePicture(user?.profilePicture || null);
        }
        return;
      }
      if (user?.role === 'admin' && user.profilePicture) {
        setProfilePicture(user.profilePicture);
      } else setProfilePicture(null);
    };
    if (user) loadProfilePicture();
  }, [user]);

  const handleLogout = () => logout();
  const toggleSidebar = () => setIsOpen(!isOpen);
  const getProfilePictureUrl = () => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') ? profilePicture : `${getBaseUrl()}${profilePicture}`;
  };

  const studentMenuItems = [
    { title: 'Dashboard', path: '/student/dashboard', icon: <FaTachometerAlt /> },
    { title: 'My Profile', path: '/student/profile', icon: <FaUser /> },
    { title: 'My Applications', path: '/student/applied-jobs', icon: <FaClipboardList />, badge: 'new' },
    { title: 'Saved Jobs', path: '/student/saved-jobs', icon: <FaHeart /> },
    { title: 'CV Manager', path: '/student/cv-manager', icon: <FaFileAlt /> },
    { title: 'My Interviews', path: '/student/interviews', icon: <FaCalendarAlt />, badge: 'new' },
  ];

  const companyMenuItems = [
    { title: 'Dashboard', path: '/company/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Company Profile', path: '/company/profile', icon: <FaBuilding /> },
    { title: 'Post New Job', path: '/company/post-job', icon: <FaPlusCircle /> },
    { title: 'Manage Jobs', path: '/company/manage-jobs', icon: <FaListAlt /> },
    { title: 'Applications', path: '/company/applicants', icon: <FaUsers />, badge: 'new' },
    { title: 'Interviews', path: '/company/interviews', icon: <FaCalendarAlt /> },
    { title: 'Confirmed Interviews', path: '/company/confirmed-interviews', icon: <FaCheckCircle /> },
  ];

  const adminMenuItems = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Admin Profile', path: '/admin/profile', icon: <FaUserTie /> },
    { title: 'Manage Users', path: '/admin/users', icon: <FaUsers /> },
    { title: 'Manage Companies', path: '/admin/companies', icon: <FaBuilding /> },
    { title: 'Verification Requests', path: '/admin/verifications', icon: <FaCheckCircle />, badge: 'pending' },
    { title: 'Contact Messages', path: '/admin/contact-messages', icon: <FaEnvelope />, badge: 'new' },  // <-- ADDED
    { title: 'Reports', path: '/admin/reports', icon: <FaChartLine /> },
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
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  };
  const getRoleColor = () => {
    switch(user?.role) {
      case 'student': return '#48bb78';
      case 'company': return '#4299e1';
      case 'admin': return '#ed8936';
      default: return '#a0aec0';
    }
  };

  return (
    <div className="sb-dashboard-layout">
      <button className="sb-toggle-btn" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className={`sb-sidebar ${isOpen ? 'sb-open' : ''}`}>
        <div className="sb-user-info">
          <div className="sb-user-avatar" style={{ background: `linear-gradient(135deg, ${getRoleColor()}, ${getRoleColor()}cc)` }}>
            {getProfilePictureUrl() ? (
              <img src={getProfilePictureUrl()} alt={user?.name} className="sb-avatar-img" />
            ) : (
              <div className="sb-avatar-placeholder">{getUserInitials()}</div>
            )}
          </div>
          <div className="sb-user-details">
            <h4>{user?.name || 'User'}</h4>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        <nav className="sb-nav">
          <ul>
            {menuItems.map((item, idx) => (
              <li key={idx}>
                <Link 
                  to={item.path} 
                  className={`sb-nav-link ${isActive(item.path) ? 'sb-active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sb-nav-icon">{item.icon}</span>
                  <span className="sb-nav-title">{item.title}</span>
                  {item.badge && <span className={`sb-nav-badge sb-badge-${item.badge}`}>{item.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sb-footer">
          <ul>
            <li>
              <Link to="/settings" className="sb-nav-link" onClick={() => setIsOpen(false)}>
                <span className="sb-nav-icon"><FaCog /></span>
                <span className="sb-nav-title">Settings</span>
              </Link>
            </li>
            <li>
              <Link to="/help" className="sb-nav-link" onClick={() => setIsOpen(false)}>
                <span className="sb-nav-icon"><FaQuestionCircle /></span>
                <span className="sb-nav-title">Help & Support</span>
              </Link>
            </li>
            <li className="sb-divider"></li>
            <li>
              <button onClick={handleLogout} className="sb-nav-link sb-logout-btn">
                <span className="sb-nav-icon"><FaSignOutAlt /></span>
                <span className="sb-nav-title">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="sb-main-content">
        {children}
      </div>

      {isOpen && <div className="sb-overlay" onClick={toggleSidebar}></div>}
    </div>
  );
};

export default Sidebar;