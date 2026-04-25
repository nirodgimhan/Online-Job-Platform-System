import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../Components/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaBriefcase, FaFileAlt, FaHeart, FaClock, FaCheckCircle, FaTimesCircle,
  FaBuilding, FaUsers, FaChartLine, FaUserGraduate, FaExclamationTriangle,
  FaEye, FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaRegFileAlt,
  FaSyncAlt, FaStar, FaUserTie, FaShieldAlt, FaBell, FaEnvelope,
  FaVideo, FaUserFriends, FaRegHeart, FaRegStar, FaRegClock, FaSpinner,
  FaComments, FaUserPlus, FaUserCheck, FaGraduationCap, FaCode,
  FaPost, FaNewspaper, FaChartBar, FaDownload, FaFilter, FaChevronLeft,
  FaChevronRight, FaCircle, FaInstagram, FaFacebook, FaLinkedinIn
} from 'react-icons/fa';

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
    savedJobs: 0,
    reviewedApplications: 0
  });
  
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [companyStats, setCompanyStats] = useState({
    profileViews: 0,
    jobViews: 0,
    applicationRate: 0,
    hireRate: 0
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfilePicture();
      fetchAllDashboardData();
      fetchCalendarEvents();
      if (user.role === 'company') {
        fetchFollowersList();
      }
    }
  }, [user]);

  const loadProfilePicture = () => {
    if (user?.role === 'company') {
      if (user?.companyLogo) {
        const url = user.companyLogo.startsWith('http') ? user.companyLogo : `http://localhost:5000${user.companyLogo}`;
        setProfilePictureUrl(url);
        return;
      }
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
      let applications = [];
      try {
        const appsRes = await API.get('/applications/student');
        applications = appsRes.data.applications || [];
      } catch (e) {
        console.log('Applications fetch failed:', e);
      }

      let savedJobsList = [];
      try {
        const savedRes = await API.get('/students/saved-jobs');
        savedJobsList = savedRes.data.savedJobs || [];
      } catch (e) {
        console.log('Saved jobs fetch failed:', e);
      }

      let interviews = [];
      try {
        const interviewsRes = await API.get('/interviews/student');
        interviews = interviewsRes.data.interviews || [];
      } catch (e) {
        console.log('Interviews fetch failed:', e);
      }

      const pending = applications.filter(app => app.status === 'pending' || app.status === 'Pending').length;
      const reviewed = applications.filter(app => app.status === 'reviewed' || app.status === 'Reviewed').length;
      const shortlisted = applications.filter(app => app.status === 'shortlisted' || app.status === 'Shortlisted').length;
      const interviewed = applications.filter(app => app.status === 'interview' || app.status === 'Interview').length;
      const accepted = applications.filter(app => app.status === 'accepted' || app.status === 'Accepted').length;
      const rejected = applications.filter(app => app.status === 'rejected' || app.status === 'Rejected').length;

      const upcomingInterviewsList = interviews.filter(i => new Date(i.scheduledDate) > new Date() && i.status !== 'cancelled');
      const upcomingCount = upcomingInterviewsList.length;

      const recentApps = applications.slice(0, 5);
      setRecentApplications(recentApps);
      setUpcomingInterviews(upcomingInterviewsList.slice(0, 3));

      let recommendedJobs = [];
      try {
        const jobsRes = await API.get('/jobs?limit=3&sort=recent');
        recommendedJobs = jobsRes.data.jobs || [];
      } catch (e) {
        console.log('Recommended jobs fetch failed:', e);
      }
      setActiveJobs(recommendedJobs);

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
        notifications: 0,
        unreadMessages: 0
      });

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

      let jobs = [];
      try {
        const jobsRes = await API.get('/companies/jobs');
        jobs = jobsRes.data.jobs || [];
      } catch (e) {
        console.log('Jobs fetch failed:', e);
        jobs = [];
      }

      const activeJobsCount = jobs.filter(job => job.status === 'active' || job.status === 'open').length;

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

      const recentApps = applications.slice(0, 5);
      setRecentApplications(recentApps);

      const upcomingInterviewsList = interviews
        .filter(i => new Date(i.scheduledDate) > new Date() && i.status !== 'cancelled')
        .slice(0, 3);
      setUpcomingInterviews(upcomingInterviewsList);

      const activeJobsList = jobs.filter(job => job.status === 'active' || job.status === 'open').slice(0, 3);
      setActiveJobs(activeJobsList);

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
        notifications: 0,
        unreadMessages: 0
      });

    } catch (error) {
      console.error('Error in company dashboard:', error);
      throw error;
    }
  };

  // ==================== CALENDAR FUNCTIONS ====================
  const fetchCalendarEvents = async () => {
    try {
      const endpoint = user?.role === 'student' ? '/interviews/student' : '/interviews/company';
      const response = await API.get(endpoint);
      const interviews = response.data.interviews || [];
      const events = interviews.map(interview => ({
        id: interview._id,
        title: interview.jobId?.title || 'Interview',
        date: new Date(interview.scheduledDate),
        type: 'interview'
      }));
      setCalendarEvents(events);
    } catch (error) {
      console.log('Calendar events fetch failed:', error);
      setCalendarEvents([]);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const hasEventOnDate = (date) => {
    return calendarEvents.some(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  // ==================== FOLLOWERS LIST (COMPANY) ====================
  const fetchFollowersList = async () => {
    try {
      const response = await API.get('/companies/followers');
      setFollowersList(response.data.followers || []);
    } catch (error) {
      console.log('Fetch followers failed:', error);
      setFollowersList([]);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'jobdash-badge jobdash-badge-warning', 'Pending': 'jobdash-badge jobdash-badge-warning',
      'reviewed': 'jobdash-badge jobdash-badge-info', 'Reviewed': 'jobdash-badge jobdash-badge-info',
      'shortlisted': 'jobdash-badge jobdash-badge-primary', 'Shortlisted': 'jobdash-badge jobdash-badge-primary',
      'interview': 'jobdash-badge jobdash-badge-success', 'Interview': 'jobdash-badge jobdash-badge-success',
      'accepted': 'jobdash-badge jobdash-badge-success', 'Accepted': 'jobdash-badge jobdash-badge-success',
      'rejected': 'jobdash-badge jobdash-badge-danger', 'Rejected': 'jobdash-badge jobdash-badge-danger'
    };
    return statusMap[status] || 'jobdash-badge jobdash-badge-secondary';
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

  if (loading) {
    return (
      <div className="jobdash-loading-container">
        <div className="jobdash-spinner"></div>
        <h4>Loading your dashboard...</h4>
        <p>Please wait while we fetch your data</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="jobdash-error-container">
        <FaExclamationTriangle className="jobdash-error-icon" />
        <h4>Please Login</h4>
        <p>You need to login to view your dashboard</p>
        <button className="jobdash-btn jobdash-btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  // ==================== STUDENT DASHBOARD RENDER (unchanged) ====================
  if (user?.role === 'student') {
    return (
      <div className="jobdash-student-dashboard">
        <div className="jobdash-welcome-header" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")' }}>
          <div className="jobdash-welcome-overlay"></div>
          <div className="jobdash-welcome-content">
            <div className="jobdash-profile-logo">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={user.name} />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="jobdash-welcome-text">
              <h2>Welcome back, {user.name}! 👋</h2>
              <p>Your career journey continues here. Let's find your dream job!</p>
              <div className="jobdash-user-meta">
                <span><FaEye /> {stats.totalViews || 0} profile views</span>
                <span><FaUsers /> {stats.companyFollowers || 0} connections</span>
                <span><FaHeart /> {stats.savedJobs || 0} saved jobs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="jobdash-stats-grid">
          <div className="jobdash-stat-card">
            <div className="jobdash-stat-info"><h3>{stats.totalApplications}</h3><p>Total Applications</p></div>
            <div className="jobdash-stat-icon jobdash-stat-icon-primary"><FaBriefcase /></div>
          </div>
          <div className="jobdash-stat-card">
            <div className="jobdash-stat-info"><h3>{stats.savedJobs}</h3><p>Saved Jobs</p></div>
            <div className="jobdash-stat-icon jobdash-stat-icon-success"><FaHeart /></div>
          </div>
          <div className="jobdash-stat-card">
            <div className="jobdash-stat-info"><h3>{stats.pendingApplications}</h3><p>In Review</p></div>
            <div className="jobdash-stat-icon jobdash-stat-icon-info"><FaClock /></div>
          </div>
          <div className="jobdash-stat-card">
            <div className="jobdash-stat-info"><h3>{stats.upcomingInterviews}</h3><p>Upcoming Interviews</p></div>
            <div className="jobdash-stat-icon jobdash-stat-icon-warning"><FaCalendarAlt /></div>
          </div>
        </div>

        <div className="jobdash-three-col">
          <div className="jobdash-card">
            <div className="jobdash-card-header"><h5>Application Status</h5></div>
            <div className="jobdash-card-body">
              <div className="jobdash-status-item"><span><FaCheckCircle className="jobdash-text-success" /> Accepted</span><span className="jobdash-status-value">{stats.acceptedApplications}</span></div>
              <div className="jobdash-status-item"><span><FaClock className="jobdash-text-warning" /> Pending</span><span className="jobdash-status-value">{stats.pendingApplications}</span></div>
              <div className="jobdash-status-item"><span><FaEye className="jobdash-text-info" /> Reviewed</span><span className="jobdash-status-value">{stats.reviewedApplications}</span></div>
              <div className="jobdash-status-item"><span><FaTimesCircle className="jobdash-text-danger" /> Rejected</span><span className="jobdash-status-value">{stats.rejectedApplications}</span></div>
              <div className="jobdash-status-item"><span><FaCalendarAlt className="jobdash-text-primary" /> Interview</span><span className="jobdash-status-value">{stats.interviewedApplications}</span></div>
            </div>
          </div>

          <div className="jobdash-card">
            <div className="jobdash-card-header"><h5>Recommended Jobs</h5></div>
            <div className="jobdash-card-body">
              {activeJobs.length > 0 ? (
                activeJobs.map(job => (
                  <div key={job._id} className="jobdash-recommended-item">
                    <div className="jobdash-recommended-content">
                      <h6>{job.title}</h6>
                      <p>{job.companyId?.companyName || 'Company'}</p>
                      <div className="jobdash-job-meta"><span><FaMapMarkerAlt /> {job.location?.city || 'Remote'}</span><span><FaDollarSign /> {job.salary?.min ? `$${job.salary.min.toLocaleString()}` : 'Negotiable'}</span></div>
                    </div>
                    <Link to={`/student/job/${job._id}`} className="jobdash-btn jobdash-btn-sm jobdash-btn-outline-primary">View</Link>
                  </div>
                ))
              ) : (
                <div className="jobdash-empty-state"><p>No recommended jobs found</p><Link to="/student/jobs" className="jobdash-btn jobdash-btn-primary jobdash-btn-sm">Browse All Jobs</Link></div>
              )}
            </div>
          </div>

          <div className="jobdash-card jobdash-calendar-card">
            <div className="jobdash-card-header"><h5><FaCalendarAlt /> Calendar</h5><div className="jobdash-calendar-nav"><button onClick={handlePrevMonth} className="jobdash-icon-btn-sm"><FaChevronLeft /></button><span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={handleNextMonth} className="jobdash-icon-btn-sm"><FaChevronRight /></button></div></div>
            <div className="jobdash-card-body">
              <div className="jobdash-calendar">
                <div className="jobdash-calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="jobdash-calendar-weekday">{day}</div>)}</div>
                <div className="jobdash-calendar-days">
                  {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="jobdash-calendar-day jobdash-calendar-day-empty"></div>)}
                  {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const hasEvent = hasEventOnDate(dateObj);
                    const isToday = dateObj.toDateString() === new Date().toDateString();
                    return <div key={day} className={`jobdash-calendar-day ${isToday ? 'jobdash-calendar-day-today' : ''} ${hasEvent ? 'jobdash-calendar-day-event' : ''}`}>{day}{hasEvent && <FaCircle className="jobdash-event-dot" />}</div>;
                  })}
                </div>
              </div>
              <div className="jobdash-upcoming-events"><h6>Upcoming Events</h6>{calendarEvents.filter(e => e.date >= new Date()).slice(0, 3).map(event => <div key={event.id} className="jobdash-event-item"><FaCalendarAlt /><span>{event.title}</span><small>{event.date.toLocaleDateString()}</small></div>)}{calendarEvents.filter(e => e.date >= new Date()).length === 0 && <p className="jobdash-empty-text">No upcoming events</p>}</div>
            </div>
          </div>
        </div>

        <div className="jobdash-quick-actions-wrapper">
          <h5 className="jobdash-quick-actions-title"><FaRegClock /> Quick Actions</h5>
          <div className="jobdash-quick-actions">
            <Link to="/student/jobs" className="jobdash-quick-action-card"><FaBriefcase /><span>Browse Jobs</span></Link>
            <Link to="/student/cv-manager" className="jobdash-quick-action-card"><FaFileAlt /><span>Manage CVs</span></Link>
            <Link to="/student/saved-jobs" className="jobdash-quick-action-card"><FaHeart /><span>Saved Jobs</span></Link>
            <Link to="/student/profile" className="jobdash-quick-action-card"><FaUserGraduate /><span>My Profile</span></Link>
            <Link to="/student/skill-tests" className="jobdash-quick-action-card"><FaCode /><span>Skill Tests</span></Link>
            <Link to="/student/interviews" className="jobdash-quick-action-card"><FaCalendarAlt /><span>Interviews</span></Link>
          </div>
        </div>
      </div>
    );
  }

// ==================== COMPANY DASHBOARD RENDER (reordered) ====================
if (user?.role === 'company') {
  return (
    <div className="jobdash-company-dashboard">
      {/* Welcome Header */}
      <div className="jobdash-welcome-header" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")' }}>
        <div className="jobdash-welcome-overlay"></div>
        <div className="jobdash-welcome-content">
          <div className="jobdash-profile-logo">
            {profilePictureUrl ? <img src={profilePictureUrl} alt={user.companyName || user.name} /> : getInitials(user.companyName || user.name)}
          </div>
          <div className="jobdash-welcome-text">
            <h2>Welcome back, {user.companyName || user.name}! 🏢</h2>
            <p>Find the best talent for your company. Post jobs and review applications.</p>
            <div className="jobdash-user-meta">
              <span><FaEye /> {companyStats.profileViews} profile views</span>
              <span><FaChartBar /> {companyStats.jobViews} job views</span>
              <span><FaUsers /> {stats.companyFollowers} followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards (smaller) */}
      <div className="jobdash-stats-grid">
        <div className="jobdash-stat-card">
          <div className="jobdash-stat-info"><h3>{stats.activeJobs}</h3><p>Active Jobs</p></div>
          <div className="jobdash-stat-icon jobdash-stat-icon-primary"><FaBriefcase /></div>
        </div>
        <div className="jobdash-stat-card">
          <div className="jobdash-stat-info"><h3>{stats.totalApplications}</h3><p>Total Applications</p></div>
          <div className="jobdash-stat-icon jobdash-stat-icon-success"><FaFileAlt /></div>
        </div>
        <div className="jobdash-stat-card">
          <div className="jobdash-stat-info"><h3>{stats.shortlistedApplications}</h3><p>Shortlisted</p></div>
          <div className="jobdash-stat-icon jobdash-stat-icon-info"><FaStar /></div>
        </div>
        <div className="jobdash-stat-card">
          <div className="jobdash-stat-info"><h3>{stats.upcomingInterviews}</h3><p>Upcoming Interviews</p></div>
          <div className="jobdash-stat-icon jobdash-stat-icon-warning"><FaCalendarAlt /></div>
        </div>
      </div>

      {/* Equal‑height row: Application Pipeline | Recent Applications */}
      <div style={{ display: 'flex', gap: '28px', marginBottom: '32px' }}>
        <div style={{ flex: 1, display: 'flex' }}>
          <div className="jobdash-card" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="jobdash-card-header"><h5>Application Pipeline</h5></div>
            <div className="jobdash-card-body" style={{ flex: 1 }}>
              <div className="jobdash-pipeline-grid">
                <div className="jobdash-pipeline-item"><h3>{stats.pendingApplications}</h3><p>Pending Review</p></div>
                <div className="jobdash-pipeline-item"><h3>{stats.shortlistedApplications}</h3><p>Shortlisted</p></div>
                <div className="jobdash-pipeline-item"><h3>{stats.interviewedApplications}</h3><p>Interviewed</p></div>
                <div className="jobdash-pipeline-item"><h3>{stats.acceptedApplications}</h3><p>Accepted</p></div>
              </div>
              <div className="jobdash-distribution">
                <div><div className="jobdash-distribution-header"><span>Application Rate</span><span>{companyStats.applicationRate}%</span></div><div className="jobdash-progress"><div className="jobdash-progress-bar jobdash-bg-success" style={{ width: `${companyStats.applicationRate}%` }}></div></div></div>
                <div><div className="jobdash-distribution-header"><span>Hire Rate</span><span>{companyStats.hireRate}%</span></div><div className="jobdash-progress"><div className="jobdash-progress-bar jobdash-bg-primary" style={{ width: `${companyStats.hireRate}%` }}></div></div></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div className="jobdash-card" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="jobdash-card-header"><h5>Recent Applications</h5><Link to="/company/applicants" className="jobdash-btn jobdash-btn-link">View All</Link></div>
            <div className="jobdash-card-body" style={{ flex: 1 }}>
              {recentApplications.length > 0 ? (
                recentApplications.map(app => (
                  <div key={app._id} className="jobdash-recommended-item">
                    <div className="jobdash-recommended-content">
                      <h6>{app.studentId?.name || 'Applicant'}</h6>
                      <p>{app.jobId?.title || 'Position'}</p>
                      <div className="jobdash-job-meta"><span><FaClock /> {formatDate(app.appliedDate)}</span><span className={getStatusBadge(app.status)}>{app.status || 'Pending'}</span></div>
                    </div>
                    <Link to={`/company/applicants/${app._id}`} className="jobdash-btn jobdash-btn-sm jobdash-btn-outline-primary">Review</Link>
                  </div>
                ))
              ) : (
                <div className="jobdash-empty-state"><p>No applications yet</p><Link to="/company/post-job" className="jobdash-btn jobdash-btn-primary jobdash-btn-sm">Post a Job</Link></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Interviews + Active Jobs (two‑column row) */}
      <div className="jobdash-row" style={{ marginBottom: '32px' }}>
        <div className="jobdash-col-6">
          {upcomingInterviews.length > 0 && (
            <div className="jobdash-card jobdash-interviews-card">
              <div className="jobdash-card-header"><h5><FaCalendarAlt /> Upcoming Interviews</h5><Link to="/company/interviews" className="jobdash-btn jobdash-btn-link">View All</Link></div>
              <div className="jobdash-card-body">
                <div className="jobdash-interviews-list">
                  {upcomingInterviews.map(interview => (
                    <div key={interview._id} className="jobdash-interview-item">
                      <div className="jobdash-interview-info"><h6>{interview.jobId?.title || 'Position'}</h6><p className="jobdash-company-name">with {interview.studentId?.name || 'Candidate'}</p><div className="jobdash-interview-meta"><span><FaCalendarAlt /> {formatInterviewDate(interview.scheduledDate)}</span><span className="jobdash-interview-mode">{interview.mode === 'Online' ? <FaVideo /> : <FaBuilding />}{interview.mode || 'Online'}</span></div></div>
                      <div className="jobdash-interview-actions"><Link to={`/company/interviews/${interview._id}`} className="jobdash-btn jobdash-btn-sm jobdash-btn-outline-primary">View Details</Link></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="jobdash-col-6">
          {activeJobs.length > 0 && (
            <div className="jobdash-card">
              <div className="jobdash-card-header"><h5>Active Jobs</h5><Link to="/company/jobs" className="jobdash-btn jobdash-btn-link">Manage Jobs</Link></div>
              <div className="jobdash-card-body">
                {activeJobs.map(job => (
                  <div key={job._id} className="jobdash-recommended-item">
                    <div className="jobdash-recommended-content"><h6>{job.title}</h6><p>{job.location?.city || 'Remote'} • {job.employmentType || 'Full-time'}</p><div className="jobdash-job-meta"><span><FaUsers /> {job.applicationsCount || 0} applicants</span><span><FaEye /> {job.views || 0} views</span><span className="jobdash-badge jobdash-badge-success">Active</span></div></div>
                    <div className="jobdash-interview-actions"><Link to={`/company/jobs/${job._id}/applications`} className="jobdash-btn jobdash-btn-sm jobdash-btn-outline-primary">View Applicants</Link></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      

      {/* Sidebar: Calendar + Followers (inline side‑by‑side) */}
      <div className="jobdash-side-col">
        <div className="jobdash-card jobdash-calendar-card">
          <div className="jobdash-card-header"><h5><FaCalendarAlt /> Calendar</h5><div className="jobdash-calendar-nav"><button onClick={handlePrevMonth} className="jobdash-icon-btn-sm"><FaChevronLeft /></button><span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={handleNextMonth} className="jobdash-icon-btn-sm"><FaChevronRight /></button></div></div>
          <div className="jobdash-card-body">
            <div className="jobdash-calendar">
              <div className="jobdash-calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="jobdash-calendar-weekday">{day}</div>)}</div>
              <div className="jobdash-calendar-days">
                {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="jobdash-calendar-day jobdash-calendar-day-empty"></div>)}
                {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const hasEvent = hasEventOnDate(dateObj);
                  const isToday = dateObj.toDateString() === new Date().toDateString();
                  return <div key={day} className={`jobdash-calendar-day ${isToday ? 'jobdash-calendar-day-today' : ''} ${hasEvent ? 'jobdash-calendar-day-event' : ''}`}>{day}{hasEvent && <FaCircle className="jobdash-event-dot" />}</div>;
                })}
              </div>
            </div>
            <div className="jobdash-upcoming-events"><h6>Upcoming Events</h6>{calendarEvents.filter(e => e.date >= new Date()).slice(0, 3).map(event => <div key={event.id} className="jobdash-event-item"><FaCalendarAlt /><span>{event.title}</span><small>{event.date.toLocaleDateString()}</small></div>)}{calendarEvents.filter(e => e.date >= new Date()).length === 0 && <p className="jobdash-empty-text">No upcoming events</p>}</div>
          </div>
        </div>
        <div className="jobdash-card">
          <div className="jobdash-card-header"><h5><FaUserFriends /> Followers</h5></div>
          <div className="jobdash-card-body">
            {followersList.length > 0 ? (
              followersList.map(follower => (
                <div key={follower._id} className="jobdash-follow-item">
                  <div className="jobdash-follow-info"><div className="jobdash-follow-logo">{follower.profilePicture ? <img src={`http://localhost:5000${follower.profilePicture}`} alt={follower.name} /> : <div className="jobdash-follow-initials">{getInitials(follower.name)}</div>}</div><div className="jobdash-follow-details"><h6>{follower.name}</h6><p>{follower.email}</p></div></div>
                  <Link to={`/company/followers/${follower._id}`} className="jobdash-btn jobdash-btn-sm jobdash-btn-outline-primary">View Profile</Link>
                </div>
              ))
            ) : (
              <div className="jobdash-empty-state"><p>No followers yet</p></div>
            )}
          </div>
        </div>
        {/* Quick Actions – moved to the bottom (inside main column) */}
      <div className="jobdash-quick-actions-wrapper">
        <h5 className="jobdash-quick-actions-title"><FaRegClock /> Quick Actions</h5>
        <div className="jobdash-quick-actions">
          <Link to="/company/post-job" className="jobdash-quick-action-card"><FaBriefcase /><span>Post New Job</span></Link>
          <Link to="/company/jobs" className="jobdash-quick-action-card"><FaNewspaper /><span>Manage Jobs</span></Link>
          <Link to="/company/applicants" className="jobdash-quick-action-card"><FaUsers /><span>View Applicants</span></Link>
          <Link to="/company/profile" className="jobdash-quick-action-card"><FaBuilding /><span>Company Profile</span></Link>
          <Link to="/company/interviews" className="jobdash-quick-action-card"><FaCalendarAlt /><span>Interviews</span></Link>
          <Link to="/company/reports" className="jobdash-quick-action-card"><FaChartLine /><span>Analytics</span></Link>
        </div>
      </div>
      </div>
    </div>
  );
}

  return null;
};

export default Dashboard;