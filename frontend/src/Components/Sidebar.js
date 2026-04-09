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

  // Dynamic badge counts
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [upcomingInterviewsCount, setUpcomingInterviewsCount] = useState(0);
  const [pendingCompanyVerificationsCount, setPendingCompanyVerificationsCount] = useState(0);
  const [unreadContactMessagesCount, setUnreadContactMessagesCount] = useState(0);

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

  // Fetch dynamic counts based on role
  const fetchCounts = async () => {
    if (!user) return;
    const role = user.role;
    try {
      if (role === 'student') {
        // Pending applications
        const appsRes = await API.get('/applications/student');
        const apps = appsRes.data.applications || [];
        const pending = apps.filter(app => app.status === 'pending' || app.status === 'Pending').length;
        setPendingApplicationsCount(pending);
        // Upcoming interviews
        const interviewsRes = await API.get('/interviews/student');
        const interviews = interviewsRes.data.interviews || [];
        const upcoming = interviews.filter(i => new Date(i.scheduledDate) > new Date() && i.status !== 'cancelled').length;
        setUpcomingInterviewsCount(upcoming);
      } else if (role === 'company') {
        // Pending applications for company
        const appsRes = await API.get('/applications/company');
        const apps = appsRes.data.applications || [];
        const pending = apps.filter(app => app.status === 'pending' || app.status === 'Pending').length;
        setPendingApplicationsCount(pending);
      } else if (role === 'admin') {
        // Pending company verifications (unverified companies)
        const usersRes = await API.get('/users');
        const companies = (usersRes.data.users || []).filter(u => u.role === 'company');
        const pendingVerifications = companies.filter(c => !c.isVerified).length;
        setPendingCompanyVerificationsCount(pendingVerifications);
        // Unread contact messages
        const contactRes = await API.get('/contact/admin?status=unread&limit=1');
        const totalUnread = contactRes.data.pagination?.total || 0;
        setUnreadContactMessagesCount(totalUnread);
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
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
    { title: 'My Applications', path: '/student/applied-jobs', icon: <FaClipboardList />, badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : null },
    { title: 'Saved Jobs', path: '/student/saved-jobs', icon: <FaHeart /> },
    { title: 'CV Manager', path: '/student/cv-manager', icon: <FaFileAlt /> },
    { title: 'My Interviews', path: '/student/interviews', icon: <FaCalendarAlt />, badge: upcomingInterviewsCount > 0 ? upcomingInterviewsCount : null },
  ];

  const companyMenuItems = [
    { title: 'Dashboard', path: '/company/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Company Profile', path: '/company/profile', icon: <FaBuilding /> },
    { title: 'Post New Job', path: '/company/post-job', icon: <FaPlusCircle /> },
    { title: 'Manage Jobs', path: '/company/manage-jobs', icon: <FaListAlt /> },
    { title: 'Applications', path: '/company/applicants', icon: <FaUsers />, badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : null },
    { title: 'Interviews', path: '/company/interviews', icon: <FaCalendarAlt /> },
    { title: 'Confirmed Interviews', path: '/company/confirmed-interviews', icon: <FaCheckCircle /> },
  ];

  const adminMenuItems = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: <FaTachometerAlt /> },
    { title: 'Admin Profile', path: '/admin/profile', icon: <FaUserTie /> },
    { title: 'Manage Users', path: '/admin/users', icon: <FaUsers /> },
    { title: 'Manage Companies', path: '/admin/companies', icon: <FaBuilding /> },
    { title: 'Verification Requests', path: '/admin/verifications', icon: <FaCheckCircle />, badge: pendingCompanyVerificationsCount > 0 ? pendingCompanyVerificationsCount : null },
    { title: 'Contact Messages', path: '/admin/contact-messages', icon: <FaEnvelope />, badge: unreadContactMessagesCount > 0 ? unreadContactMessagesCount : null },
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
                  {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                    <span className="sb-nav-badge sb-badge-count">{item.badge}</span>
                  )}
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