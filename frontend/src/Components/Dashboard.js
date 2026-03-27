import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaBriefcase, FaFileAlt, FaHeart, FaClock, FaCheckCircle, FaTimesCircle,
  FaBuilding, FaUsers, FaChartLine, FaUserGraduate, FaExclamationTriangle,
  FaEye, FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaRegFileAlt,
  FaSyncAlt, FaStar, FaUserTie, FaShieldAlt, FaBell, FaEnvelope,
  FaVideo, FaUserFriends, FaRegHeart, FaRegStar, FaRegClock, FaSpinner,
  FaComments, FaUserPlus, FaUserCheck, FaGraduationCap, FaCode,
  FaPost, FaNewspaper, FaChartBar, FaDownload, FaFilter
} from 'react-icons/fa';
import { API } from '../Components/context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    interviewedApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    upcomingInterviews: 0,
    completedInterviews: 0,
    totalViews: 0,
    companyFollowers: 0,
    notifications: 0,
    unreadMessages: 0,
    // Student specific
    savedJobs: 0,
    reviewedApplications: 0
  });
  
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [companyStats, setCompanyStats] = useState({
    profileViews: 0,
    jobViews: 0,
    applicationRate: 0,
    hireRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfilePicture();
      fetchAllDashboardData();
    }
  }, [user]);

  const loadProfilePicture = () => {
    if (user?.role === 'company') {
      if (user?.companyLogo) {
        const url = user.companyLogo.startsWith('http') ? user.companyLogo : `http://localhost:5000${user.companyLogo}`;
        setProfilePictureUrl(url);
        return;
      }
      // Fallback: try to get from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.companyLogo) {
            const url = parsedUser.companyLogo.startsWith('http') ? parsedUser.companyLogo : `http://localhost:5000${parsedUser.companyLogo}`;
            setProfilePictureUrl(url);
          }
        } catch (e) {}
      }
    } else if (user?.role === 'student') {
      if (user?.profilePicture) {
        const url = user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`;
        setProfilePictureUrl(url);
      }
    }
  };

  const fetchAllDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user?.role === 'student') {
        await fetchStudentDashboardData();
      } else if (user?.role === 'company') {
        await fetchCompanyDashboardData();
      }
      await fetchNotifications();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ==================== STUDENT DASHBOARD ====================
  const fetchStudentDashboardData = async () => {
    try {
      // 1. Fetch applications
      let applications = [];
      try {
        const appsRes = await API.get('/applications/student');
        applications = appsRes.data.applications || [];
      } catch (e) {
        console.log('Applications fetch failed:', e);
      }

      // 2. Fetch saved jobs
      let savedJobsList = [];
      try {
        const savedRes = await API.get('/students/saved-jobs');
        savedJobsList = savedRes.data.savedJobs || [];
      } catch (e) {
        console.log('Saved jobs fetch failed:', e);
      }

      // 3. Fetch upcoming interviews
      let interviews = [];
      try {
        const interviewsRes = await API.get('/interviews/student');
        interviews = interviewsRes.data.interviews || [];
      } catch (e) {
        console.log('Interviews fetch failed:', e);
      }

      // Compute stats from applications
      const pending = applications.filter(app => app.status === 'pending' || app.status === 'Pending').length;
      const reviewed = applications.filter(app => app.status === 'reviewed' || app.status === 'Reviewed').length;
      const shortlisted = applications.filter(app => app.status === 'shortlisted' || app.status === 'Shortlisted').length;
      const interviewed = applications.filter(app => app.status === 'interview' || app.status === 'Interview').length;
      const accepted = applications.filter(app => app.status === 'accepted' || app.status === 'Accepted').length;
      const rejected = applications.filter(app => app.status === 'rejected' || app.status === 'Rejected').length;

      const upcomingInterviewsList = interviews.filter(i => new Date(i.scheduledDate) > new Date() && i.status !== 'cancelled');
      const upcomingCount = upcomingInterviewsList.length;

      // Set recent applications (last 5)
      const recentApps = applications.slice(0, 5);
      setRecentApplications(recentApps);

      // Set upcoming interviews (first 3)
      setUpcomingInterviews(upcomingInterviewsList.slice(0, 3));

      // 4. Fetch recommended jobs (recent jobs)
      let recommendedJobs = [];
      try {
        const jobsRes = await API.get('/jobs?limit=3&sort=recent');
        recommendedJobs = jobsRes.data.jobs || [];
      } catch (e) {
        console.log('Recommended jobs fetch failed:', e);
      }
      setActiveJobs(recommendedJobs);

      // Update stats
      setStats({
        ...stats,
        totalApplications: applications.length,
        savedJobs: savedJobsList.length,
        pendingApplications: pending,
        reviewedApplications: reviewed,
        shortlistedApplications: shortlisted,
        interviewedApplications: interviewed,
        acceptedApplications: accepted,
        rejectedApplications: rejected,
        upcomingInterviews: upcomingCount,
        completedInterviews: interviews.filter(i => i.status === 'completed').length,
        notifications: 5, // placeholder
        unreadMessages: 3
      });

      // Also set companyStats for student (optional)
      setCompanyStats({
        profileViews: 0,
        jobViews: 0,
        applicationRate: applications.length ? Math.round((shortlisted / applications.length) * 100) : 0,
        hireRate: applications.length ? Math.round((accepted / applications.length) * 100) : 0
      });

    } catch (error) {
      console.error('Error in student dashboard:', error);
      throw error;
    }
  };

  // ==================== COMPANY DASHBOARD ====================
  const fetchCompanyDashboardData = async () => {
    try {
      // Fetch company profile
      let company = null;
      try {
        const profileRes = await API.get('/companies/profile');
        company = profileRes.data.company;
        if (company?.companyLogo) {
          const url = company.companyLogo.startsWith('http') ? company.companyLogo : `http://localhost:5000${company.companyLogo}`;
          setProfilePictureUrl(url);
        }
      } catch (e) {
        console.log('Company profile fetch failed:', e);
      }

      // Fetch jobs
      let jobs = [];
      try {
        const jobsRes = await API.get('/companies/jobs');
        jobs = jobsRes.data.jobs || [];
      } catch (e) {
        console.log('Jobs fetch failed:', e);
        jobs = [];
      }

      const activeJobsCount = jobs.filter(job => job.status === 'active' || job.status === 'open').length;

      // Fetch applications
      let applications = [];
      try {
        const applicationsRes = await API.get('/applications/company');
        applications = applicationsRes.data.applications || [];
      } catch (e) {
        console.log('Applications fetch failed:', e);
        applications = [];
      }

      const pending = applications.filter(app => app.status === 'pending' || app.status === 'Pending').length;
      const shortlisted = applications.filter(app => app.status === 'shortlisted' || app.status === 'Shortlisted').length;
      const interviewed = applications.filter(app => app.status === 'interview' || app.status === 'Interview').length;
      const accepted = applications.filter(app => app.status === 'accepted' || app.status === 'Accepted').length;
      const rejected = applications.filter(app => app.status === 'rejected' || app.status === 'Rejected').length;

      // Fetch interviews
      let interviews = [];
      try {
        const interviewsRes = await API.get('/interviews/company');
        interviews = interviewsRes.data.interviews || [];
      } catch (e) {
        console.log('Interviews fetch failed:', e);
        interviews = [];
      }

      const upcoming = interviews.filter(i => new Date(i.scheduledDate) > new Date() && i.status !== 'cancelled').length;
      const completed = interviews.filter(i => i.status === 'completed').length;

      // Set recent applications (last 5)
      const recentApps = applications.slice(0, 5);
      setRecentApplications(recentApps);

      // Set upcoming interviews
      const upcomingInterviewsList = interviews
        .filter(i => new Date(i.scheduledDate) > new Date() && i.status !== 'cancelled')
        .slice(0, 3);
      setUpcomingInterviews(upcomingInterviewsList);

      // Set active jobs
      const activeJobsList = jobs.filter(job => job.status === 'active' || job.status === 'open').slice(0, 3);
      setActiveJobs(activeJobsList);

      // Calculate stats
      const totalViews = applications.reduce((sum, app) => sum + (app.views || 0), 0);
      const applicationRate = applications.length > 0 ? Math.round((shortlisted / applications.length) * 100) : 0;
      const hireRate = applications.length > 0 ? Math.round((accepted / applications.length) * 100) : 0;

      setCompanyStats({
        profileViews: company?.profileViews || 0,
        jobViews: company?.jobViews || 0,
        applicationRate: applicationRate,
        hireRate: hireRate
      });

      setStats({
        totalJobs: jobs.length,
        activeJobs: activeJobsCount,
        totalApplications: applications.length,
        pendingApplications: pending,
        shortlistedApplications: shortlisted,
        interviewedApplications: interviewed,
        acceptedApplications: accepted,
        rejectedApplications: rejected,
        upcomingInterviews: upcoming,
        completedInterviews: completed,
        totalViews: totalViews,
        companyFollowers: company?.followers?.length || 0,
        notifications: 5,
        unreadMessages: 3
      });

    } catch (error) {
      console.error('Error in company dashboard:', error);
      throw error;
    }
  };

  const fetchNotifications = async () => {
    try {
      const endpoint = user?.role === 'student' ? '/notifications/student' : '/notifications/company';
      const response = await API.get(endpoint);
      setRecentNotifications(response.data.notifications?.slice(0, 5) || []);
    } catch (error) {
      // Fallback notifications
      setRecentNotifications([
        { _id: '1', message: 'New application received for Software Engineer position', time: '2 hours ago', read: false },
        { _id: '2', message: 'Your job post has been viewed 50 times', time: '1 day ago', read: false }
      ]);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'ds-badge ds-badge-warning', 'Pending': 'ds-badge ds-badge-warning',
      'reviewed': 'ds-badge ds-badge-info', 'Reviewed': 'ds-badge ds-badge-info',
      'shortlisted': 'ds-badge ds-badge-primary', 'Shortlisted': 'ds-badge ds-badge-primary',
      'interview': 'ds-badge ds-badge-success', 'Interview': 'ds-badge ds-badge-success',
      'accepted': 'ds-badge ds-badge-success', 'Accepted': 'ds-badge ds-badge-success',
      'rejected': 'ds-badge ds-badge-danger', 'Rejected': 'ds-badge ds-badge-danger'
    };
    return statusMap[status] || 'ds-badge ds-badge-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatInterviewDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const response = await API.put(`/applications/${applicationId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Application status updated to ${newStatus}`);
        fetchAllDashboardData();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading your dashboard...</h4>
        <p>Please wait while we fetch your data</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ds-error-container">
        <FaExclamationTriangle className="ds-error-icon" />
        <h4>Please Login</h4>
        <p>You need to login to view your dashboard</p>
        <button className="ds-btn ds-btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  // ==================== STUDENT DASHBOARD RENDER ====================
  if (user?.role === 'student') {
    return (
      <div className="ds-student-dashboard">
        {/* Welcome Header with User Logo */}
        <div className="ds-welcome-header">
          <div className="ds-welcome-content">
            <div className="ds-user-avatar-large">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={user.name} className="ds-avatar-image" />
              ) : (
                <div className="ds-avatar-placeholder">{getInitials(user.name)}</div>
              )}
            </div>
            <div className="ds-welcome-text">
              <h2>Welcome back, {user.name}! 👋</h2>
              <p>Your career journey continues here. Let's find your dream job!</p>
              <div className="ds-user-meta">
                <span><FaEye /> {stats.totalViews || 0} profile views</span>
                <span><FaUsers /> {stats.companyFollowers || 0} connections</span>
                <span><FaHeart /> {stats.savedJobs || 0} saved jobs</span>
              </div>
            </div>
          </div>
          <div className="ds-welcome-actions">
            <button className="ds-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <FaBell />
              {stats.notifications > 0 && <span className="ds-badge-notification">{stats.notifications}</span>}
            </button>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="ds-dropdown ds-notifications-dropdown">
            <div className="ds-dropdown-header">
              <h6>Notifications</h6>
              <Link to="/notifications" className="ds-link">View All</Link>
            </div>
            <div className="ds-dropdown-body">
              {recentNotifications.map(notif => (
                <div key={notif._id} className={`ds-notification-item ${!notif.read ? 'ds-unread' : ''}`}>
                  <div className="ds-notification-content">
                    <p>{notif.message}</p>
                    <small>{notif.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="ds-stats-grid">
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.totalApplications}</h3>
              <p>Total Applications</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-primary">
              <FaBriefcase />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.savedJobs}</h3>
              <p>Saved Jobs</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-success">
              <FaHeart />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.pendingApplications}</h3>
              <p>In Review</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-info">
              <FaClock />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.upcomingInterviews}</h3>
              <p>Upcoming Interviews</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-warning">
              <FaCalendarAlt />
            </div>
          </div>
        </div>

        {/* Application Status & Recommended Jobs */}
        <div className="ds-row">
          <div className="ds-col-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Application Status</h5>
              </div>
              <div className="ds-card-body">
                <div className="ds-status-item">
                  <span><FaCheckCircle className="ds-text-success" /> Accepted</span>
                  <span className="ds-status-value">{stats.acceptedApplications}</span>
                </div>
                <div className="ds-status-item">
                  <span><FaClock className="ds-text-warning" /> Pending</span>
                  <span className="ds-status-value">{stats.pendingApplications}</span>
                </div>
                <div className="ds-status-item">
                  <span><FaEye className="ds-text-info" /> Reviewed</span>
                  <span className="ds-status-value">{stats.reviewedApplications}</span>
                </div>
                <div className="ds-status-item">
                  <span><FaTimesCircle className="ds-text-danger" /> Rejected</span>
                  <span className="ds-status-value">{stats.rejectedApplications}</span>
                </div>
                <div className="ds-status-item">
                  <span><FaCalendarAlt className="ds-text-primary" /> Interview</span>
                  <span className="ds-status-value">{stats.interviewedApplications}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ds-col-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Recommended Jobs</h5>
              </div>
              <div className="ds-card-body">
                {activeJobs.length > 0 ? (
                  activeJobs.map(job => (
                    <div key={job._id} className="ds-recommended-item">
                      <div className="ds-recommended-content">
                        <h6>{job.title}</h6>
                        <p>{job.companyId?.companyName || 'Company'}</p>
                        <div className="ds-job-meta">
                          <span><FaMapMarkerAlt /> {job.location?.city || 'Remote'}</span>
                          <span><FaDollarSign /> {job.salary?.min ? `$${job.salary.min.toLocaleString()}` : 'Negotiable'}</span>
                        </div>
                      </div>
                      <Link to={`/student/job/${job._id}`} className="ds-btn ds-btn-sm ds-btn-outline-primary">
                        View
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="ds-empty-state">
                    <p>No recommended jobs found</p>
                    <Link to="/student/jobs" className="ds-btn ds-btn-primary ds-btn-sm">
                      Browse All Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="ds-quick-actions">
          <Link to="/student/jobs" className="ds-quick-action-card">
            <FaBriefcase />
            <h6>Browse Jobs</h6>
          </Link>
          <Link to="/student/cv-manager" className="ds-quick-action-card">
            <FaFileAlt />
            <h6>Manage CVs</h6>
          </Link>
          <Link to="/student/saved-jobs" className="ds-quick-action-card">
            <FaHeart />
            <h6>Saved Jobs</h6>
          </Link>
          <Link to="/student/profile" className="ds-quick-action-card">
            <FaUserGraduate />
            <h6>My Profile</h6>
          </Link>
          <Link to="/student/skill-tests" className="ds-quick-action-card">
            <FaCode />
            <h6>Skill Tests</h6>
          </Link>
          <Link to="/student/interviews" className="ds-quick-action-card">
            <FaCalendarAlt />
            <h6>Interviews</h6>
          </Link>
        </div>
      </div>
    );
  }

  // ==================== COMPANY DASHBOARD RENDER ====================
  if (user?.role === 'company') {
    return (
      <div className="ds-company-dashboard">
        {/* Welcome Header */}
        <div className="ds-welcome-header">
          <div className="ds-welcome-content">
            <div className="ds-user-avatar-large">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={user.companyName} className="ds-avatar-image" />
              ) : (
                <div className="ds-avatar-placeholder">
                  <FaBuilding size={32} />
                </div>
              )}
            </div>
            <div className="ds-welcome-text">
              <h2>Welcome back, {user.companyName || user.name}! 🏢</h2>
              <p>Find the best talent for your company. Post jobs and review applications.</p>
              <div className="ds-user-meta">
                <span><FaEye /> {companyStats.profileViews} profile views</span>
                <span><FaChartBar /> {companyStats.jobViews} job views</span>
                <span><FaUsers /> {stats.companyFollowers} followers</span>
              </div>
            </div>
          </div>
          <div className="ds-welcome-actions">
            <button className="ds-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <FaBell />
              {stats.notifications > 0 && <span className="ds-badge-notification">{stats.notifications}</span>}
            </button>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="ds-dropdown ds-notifications-dropdown">
            <div className="ds-dropdown-header">
              <h6>Notifications</h6>
              <Link to="/notifications" className="ds-link">View All</Link>
            </div>
            <div className="ds-dropdown-body">
              {recentNotifications.map(notif => (
                <div key={notif._id} className={`ds-notification-item ${!notif.read ? 'ds-unread' : ''}`}>
                  <div className="ds-notification-content">
                    <p>{notif.message}</p>
                    <small>{notif.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="ds-stats-grid">
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.activeJobs}</h3>
              <p>Active Jobs</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-primary">
              <FaBriefcase />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.totalApplications}</h3>
              <p>Total Applications</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-success">
              <FaFileAlt />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.shortlistedApplications}</h3>
              <p>Shortlisted</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-info">
              <FaStar />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.upcomingInterviews}</h3>
              <p>Upcoming Interviews</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-warning">
              <FaCalendarAlt />
            </div>
          </div>
        </div>

        {/* Company Stats Row */}
        <div className="ds-row">
          <div className="ds-col-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Application Pipeline</h5>
              </div>
              <div className="ds-card-body">
                <div className="ds-pipeline-grid">
                  <div className="ds-pipeline-item">
                    <h3>{stats.pendingApplications}</h3>
                    <p>Pending Review</p>
                  </div>
                  <div className="ds-pipeline-item">
                    <h3>{stats.shortlistedApplications}</h3>
                    <p>Shortlisted</p>
                  </div>
                  <div className="ds-pipeline-item">
                    <h3>{stats.interviewedApplications}</h3>
                    <p>Interviewed</p>
                  </div>
                  <div className="ds-pipeline-item">
                    <h3>{stats.acceptedApplications}</h3>
                    <p>Accepted</p>
                  </div>
                </div>
                <div className="ds-distribution">
                  <div>
                    <div className="ds-distribution-header">
                      <span>Application Rate</span>
                      <span>{companyStats.applicationRate}%</span>
                    </div>
                    <div className="ds-progress">
                      <div className="ds-progress-bar ds-bg-success" style={{ width: `${companyStats.applicationRate}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="ds-distribution-header">
                      <span>Hire Rate</span>
                      <span>{companyStats.hireRate}%</span>
                    </div>
                    <div className="ds-progress">
                      <div className="ds-progress-bar ds-bg-primary" style={{ width: `${companyStats.hireRate}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ds-col-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Recent Applications</h5>
                <Link to="/company/applicants" className="ds-btn ds-btn-link">View All</Link>
              </div>
              <div className="ds-card-body">
                {recentApplications.length > 0 ? (
                  recentApplications.map(app => (
                    <div key={app._id} className="ds-recommended-item">
                      <div className="ds-recommended-content">
                        <h6>{app.studentId?.name || 'Applicant'}</h6>
                        <p>{app.jobId?.title || 'Position'}</p>
                        <div className="ds-job-meta">
                          <span><FaClock /> {formatDate(app.appliedDate)}</span>
                          <span className={getStatusBadge(app.status)}>{app.status || 'Pending'}</span>
                        </div>
                      </div>
                      <Link to={`/company/applicants/${app._id}`} className="ds-btn ds-btn-sm ds-btn-outline-primary">
                        Review
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="ds-empty-state">
                    <p>No applications yet</p>
                    <Link to="/company/post-job" className="ds-btn ds-btn-primary ds-btn-sm">
                      Post a Job
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Interviews Section */}
        {upcomingInterviews.length > 0 && (
          <div className="ds-card ds-interviews-card">
            <div className="ds-card-header">
              <h5>
                <FaCalendarAlt className="ds-icon" />
                Upcoming Interviews
              </h5>
              <Link to="/company/interviews" className="ds-btn ds-btn-link">View All</Link>
            </div>
            <div className="ds-card-body">
              <div className="ds-interviews-list">
                {upcomingInterviews.map(interview => (
                  <div key={interview._id} className="ds-interview-item">
                    <div className="ds-interview-info">
                      <h6>{interview.jobId?.title || 'Position'}</h6>
                      <p className="ds-company-name">with {interview.studentId?.name || 'Candidate'}</p>
                      <div className="ds-interview-meta">
                        <span><FaCalendarAlt /> {formatInterviewDate(interview.scheduledDate)}</span>
                        <span className="ds-interview-mode">
                          {interview.mode === 'Online' ? <FaVideo /> : <FaBuilding />}
                          {interview.mode || 'Online'}
                        </span>
                      </div>
                    </div>
                    <div className="ds-interview-actions">
                      <Link to={`/company/interviews/${interview._id}`} className="ds-btn ds-btn-sm ds-btn-outline-primary">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Jobs Section */}
        {activeJobs.length > 0 && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h5>Active Jobs</h5>
              <Link to="/company/jobs" className="ds-btn ds-btn-link">Manage Jobs</Link>
            </div>
            <div className="ds-card-body">
              {activeJobs.map(job => (
                <div key={job._id} className="ds-recommended-item">
                  <div className="ds-recommended-content">
                    <h6>{job.title}</h6>
                    <p>{job.location?.city || 'Remote'} • {job.employmentType || 'Full-time'}</p>
                    <div className="ds-job-meta">
                      <span><FaUsers /> {job.applicationsCount || 0} applicants</span>
                      <span><FaEye /> {job.views || 0} views</span>
                      <span className="ds-badge ds-badge-success">Active</span>
                    </div>
                  </div>
                  <div className="ds-interview-actions">
                    <Link to={`/company/jobs/${job._id}/applications`} className="ds-btn ds-btn-sm ds-btn-outline-primary">
                      View Applicants
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions Buttons */}
        <div className="ds-quick-actions">
          <Link to="/company/post-job" className="ds-quick-action-card">
            <FaBriefcase />
            <h6>Post New Job</h6>
          </Link>
          <Link to="/company/jobs" className="ds-quick-action-card">
            <FaNewspaper />
            <h6>Manage Jobs</h6>
          </Link>
          <Link to="/company/applicants" className="ds-quick-action-card">
            <FaUsers />
            <h6>View Applicants</h6>
          </Link>
          <Link to="/company/profile" className="ds-quick-action-card">
            <FaBuilding />
            <h6>Company Profile</h6>
          </Link>
          <Link to="/company/interviews" className="ds-quick-action-card">
            <FaCalendarAlt />
            <h6>Interviews</h6>
          </Link>
          <Link to="/company/reports" className="ds-quick-action-card">
            <FaChartLine />
            <h6>Analytics</h6>
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;