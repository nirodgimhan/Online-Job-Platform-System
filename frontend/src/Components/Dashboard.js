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
  FaComments, FaUserPlus, FaUserCheck, FaGraduationCap, FaCode
} from 'react-icons/fa';
import { API } from '../Components/context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0, savedJobs: 0, notifications: 0, unreadMessages: 0,
    pendingApplications: 0, reviewedApplications: 0, interviewApplications: 0,
    acceptedApplications: 0, rejectedApplications: 0, withdrawnApplications: 0,
    upcomingInterviews: 0, completedInterviews: 0,
    connections: 0, followers: 0, following: 0, posts: 0, profileViews: 0, cvViews: 0
  });
  
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [skillTests, setSkillTests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllDashboardData();
      loadUserProfilePicture();
    }
  }, [user]);

  const loadUserProfilePicture = () => {
    if (user?.profilePicture) {
      const url = user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`;
      setProfilePictureUrl(url);
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.profilePicture) {
          const url = parsedUser.profilePicture.startsWith('http') ? parsedUser.profilePicture : `http://localhost:5000${parsedUser.profilePicture}`;
          setProfilePictureUrl(url);
        }
      } catch (e) {}
    }
  };

  const fetchAllDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchStudentDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDashboardData = async () => {
    try {
      let profile = null;
      try {
        const profileRes = await API.get('/students/profile');
        profile = profileRes.data.student;
        if (profile.profilePhoto) setProfilePictureUrl(`http://localhost:5000${profile.profilePhoto}`);
      } catch (e) {}

      let applications = [];
      try {
        const applicationsRes = await API.get('/applications/student');
        applications = applicationsRes.data.applications || [];
      } catch (e) {}

      const pending = applications.filter(app => app.status === 'pending' || app.status === 'Pending').length;
      const reviewed = applications.filter(app => app.status === 'reviewed' || app.status === 'Reviewed').length;
      const interview = applications.filter(app => app.status === 'interview' || app.status === 'Interview').length;
      const accepted = applications.filter(app => app.status === 'accepted' || app.status === 'Accepted').length;
      const rejected = applications.filter(app => app.status === 'rejected' || app.status === 'Rejected').length;

      let interviews = [];
      try {
        const interviewsRes = await API.get('/interviews/student');
        interviews = interviewsRes.data.interviews || [];
      } catch (e) {
        interviews = [
          { _id: '1', jobTitle: 'Senior Software Engineer', companyName: 'Tech Corp', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), mode: 'Video Call' }
        ];
      }

      const upcoming = interviews.filter(i => new Date(i.date) > new Date()).length;

      let connections = [];
      try {
        const connectionsRes = await API.get('/students/connections');
        connections = connectionsRes.data.connections || [];
      } catch (e) {}

      try {
        const jobsRes = await API.get('/jobs/recommended?limit=4');
        setRecommendedJobs(jobsRes.data.jobs || []);
      } catch (e) {
        setRecommendedJobs([
          { _id: '1', title: 'Senior Software Engineer', companyId: { companyName: 'Tech Corp' }, location: { city: 'Colombo' }, salary: { min: 80000 } }
        ]);
      }

      try {
        const testsRes = await API.get('/skill-tests/student');
        setSkillTests(testsRes.data.tests || []);
      } catch (e) {
        setSkillTests([]);
      }

      try {
        const achievementsRes = await API.get('/students/achievements');
        setAchievements(achievementsRes.data.achievements || []);
      } catch (e) {
        setAchievements([]);
      }

      setStats(prev => ({
        ...prev,
        totalApplications: applications.length,
        savedJobs: profile?.savedJobs?.length || 0,
        pendingApplications: pending,
        reviewedApplications: reviewed,
        interviewApplications: interview,
        acceptedApplications: accepted,
        rejectedApplications: rejected,
        upcomingInterviews: upcoming,
        connections: connections.length,
        followers: profile?.followers?.length || 0,
        following: profile?.following?.length || 0,
        profileViews: profile?.profileViews || 0,
        cvViews: profile?.cv?.views || 0,
        notifications: 3,
        unreadMessages: 2
      }));

      setUpcomingInterviews(interviews.slice(0, 3));

    } catch (error) {
      console.error('Error in student dashboard:', error);
      throw error;
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/notifications');
      setRecentNotifications(response.data.notifications?.slice(0, 5) || []);
    } catch (error) {
      setRecentNotifications([
        { _id: '1', message: 'Your application was viewed', time: '2 hours ago', read: false }
      ]);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'ds-badge ds-badge-warning', 'Pending': 'ds-badge ds-badge-warning',
      'reviewed': 'ds-badge ds-badge-info', 'Reviewed': 'ds-badge ds-badge-info',
      'interview': 'ds-badge ds-badge-success', 'Interview': 'ds-badge ds-badge-success',
      'accepted': 'ds-badge ds-badge-success', 'Accepted': 'ds-badge ds-badge-success',
      'rejected': 'ds-badge ds-badge-danger', 'Rejected': 'ds-badge ds-badge-danger'
    };
    return badges[status] || 'ds-badge ds-badge-secondary';
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

  // Student Dashboard
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
                <span><FaEye /> {stats.profileViews} profile views</span>
                <span><FaUsers /> {stats.connections} connections</span>
                <span><FaHeart /> {stats.savedJobs} saved jobs</span>
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
              <h3>{stats.interviewApplications}</h3>
              <p>Interviews</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-warning">
              <FaCalendarAlt />
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
              <Link to="/student/interviews" className="ds-btn ds-btn-link">View All</Link>
            </div>
            <div className="ds-card-body">
              <div className="ds-interviews-list">
                {upcomingInterviews.map(interview => (
                  <div key={interview._id} className="ds-interview-item">
                    <div className="ds-interview-info">
                      <h6>{interview.jobTitle}</h6>
                      <p className="ds-company-name">{interview.companyName}</p>
                      <div className="ds-interview-meta">
                        <span><FaCalendarAlt /> {new Date(interview.date).toLocaleDateString()}</span>
                        <span><FaClock /> {new Date(interview.date).toLocaleTimeString()}</span>
                        <span className="ds-interview-mode">
                          {interview.mode === 'Video Call' ? <FaVideo /> : <FaBuilding />}
                          {interview.mode}
                        </span>
                      </div>
                    </div>
                    <div className="ds-interview-actions">
                      <button className="ds-btn ds-btn-sm ds-btn-outline-primary">Join</button>
                      <button className="ds-btn ds-btn-sm ds-btn-outline-secondary">Reschedule</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Application Status & Recommended Jobs - ONLY THESE TWO BOXES */}
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
                  <span className="ds-status-value">{stats.interviewApplications}</span>
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
                {recommendedJobs.length > 0 ? (
                  recommendedJobs.map(job => (
                    <div key={job._id} className="ds-recommended-item">
                      <div className="ds-recommended-content">
                        <h6>{job.title}</h6>
                        <p>{job.companyId?.companyName}</p>
                        <div className="ds-job-meta">
                          <span><FaMapMarkerAlt /> {job.location?.city || 'Remote'}</span>
                          <span><FaDollarSign /> ${job.salary?.min?.toLocaleString() || 'Negotiable'}</span>
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

        {/* Skill Tests Section */}
        {skillTests.length > 0 && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h5>Recent Skill Tests</h5>
              <Link to="/student/skill-tests" className="ds-btn ds-btn-link">View All</Link>
            </div>
            <div className="ds-card-body">
              {skillTests.map(test => (
                <div key={test._id} className="ds-skill-test-item">
                  <div className="ds-test-info">
                    <h6>{test.name}</h6>
                    <div className="ds-test-score">
                      <span className="ds-score">{test.score}/{test.maxScore}</span>
                      <span className="ds-percentage">{Math.round((test.score / test.maxScore) * 100)}%</span>
                    </div>
                  </div>
                  <div className="ds-test-date">{formatDate(test.date)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h5>Achievements</h5>
            </div>
            <div className="ds-card-body">
              <div className="ds-achievements-grid">
                {achievements.map(ach => (
                  <div key={ach._id} className="ds-achievement-item">
                    <span className="ds-achievement-icon">{ach.icon}</span>
                    <div className="ds-achievement-info">
                      <h6>{ach.title}</h6>
                      <p>{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== QUICK ACTIONS BUTTONS ==================== */}
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

  return null;
};

export default Dashboard;