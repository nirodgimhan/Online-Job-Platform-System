import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaBriefcase, 
  FaFileAlt, 
  FaHeart, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaBuilding,
  FaUsers,
  FaChartLine,
  FaUserGraduate,
  FaExclamationTriangle,
  FaEye,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaDollarSign,
  FaRegFileAlt,
  FaSyncAlt,
  FaStar,
  FaUserTie,
  FaShieldAlt,
  FaBell,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaArrowRight,
  FaPlusCircle,
  FaListAlt,
  FaUserCog,
  FaSignOutAlt,
  FaRegCalendarAlt,
  FaVideo,
  FaUserFriends,
  FaRegHeart,
  FaRegStar,
  FaRegClock,
  FaSpinner,
  FaComments,
  FaUserPlus,
  FaUserCheck,
  FaFilter,
  FaSearch,
  FaThumbsUp,
  FaComment,
  FaShare,
  FaExternalLinkAlt,
  FaGraduationCap,
  FaCode,
  FaCertificate,
  FaLanguage,
  FaProjectDiagram,
  FaAward,
  FaMedal,
  FaTrophy,
  FaRocket,
  FaBullseye,
  FaTarget,
  FaRegComment,
  FaRegHeart as FaRegHeartOutline,
  FaRegClock as FaRegClockOutline,
  FaUserCircle
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // User profile picture URL
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  
  const [stats, setStats] = useState({
    // Common
    totalApplications: 0,
    savedJobs: 0,
    notifications: 0,
    unreadMessages: 0,
    
    // Student specific
    pendingApplications: 0,
    reviewedApplications: 0,
    interviewApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    withdrawnApplications: 0,
    upcomingInterviews: 0,
    completedInterviews: 0,
    interviewFeedback: 0,
    connections: 0,
    followers: 0,
    following: 0,
    posts: 0,
    profileViews: 0,
    cvViews: 0,
    
    // Company specific
    totalJobs: 0,
    activeJobs: 0,
    draftJobs: 0,
    closedJobs: 0,
    totalApplicants: 0,
    newApplicants: 0,
    shortlistedApplicants: 0,
    interviewedApplicants: 0,
    hiredApplicants: 0,
    rejectedApplicants: 0,
    scheduledInterviews: 0,
    pendingReviews: 0,
    
    // Admin specific
    totalUsers: 0,
    totalStudents: 0,
    totalCompanies: 0,
    totalAdmins: 0,
    pendingVerifications: 0,
    reportedPosts: 0,
    reportedJobs: 0,
    reportedUsers: 0,
    activeReports: 0
  });
  
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [trendingJobs, setTrendingJobs] = useState([]);
  const [skillTests, setSkillTests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchAllDashboardData();
      loadUserProfilePicture();
    }
  }, [user, retryCount]);

  const loadUserProfilePicture = () => {
    // Check user object from auth context
    if (user?.profilePicture) {
      if (user.profilePicture.startsWith('http')) {
        setProfilePictureUrl(user.profilePicture);
      } else {
        setProfilePictureUrl(`http://localhost:5000${user.profilePicture}`);
      }
      return;
    }

    // Try to get from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.profilePicture) {
          if (parsedUser.profilePicture.startsWith('http')) {
            setProfilePictureUrl(parsedUser.profilePicture);
          } else {
            setProfilePictureUrl(`http://localhost:5000${parsedUser.profilePicture}`);
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // If still no profile picture, try to fetch from backend based on role
    fetchUserProfilePicture();
  };

  const fetchUserProfilePicture = async () => {
    try {
      if (user?.role === 'student') {
        const response = await axios.get('http://localhost:5000/api/students/profile', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        if (response.data.success && response.data.student.profilePhoto) {
          const photoUrl = `http://localhost:5000${response.data.student.profilePhoto}`;
          setProfilePictureUrl(photoUrl);
          
          // Update user in localStorage
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          userData.profilePicture = response.data.student.profilePhoto;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else if (user?.role === 'company') {
        const response = await axios.get('http://localhost:5000/api/companies/profile', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        if (response.data.success && response.data.company.companyLogo) {
          const logoUrl = `http://localhost:5000${response.data.company.companyLogo}`;
          setProfilePictureUrl(logoUrl);
          
          // Update user in localStorage
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          userData.profilePicture = response.data.company.companyLogo;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
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
      } else if (user?.role === 'admin') {
        await fetchAdminDashboardData();
      }
      
      // Fetch common data for all roles
      await fetchNotifications();
      await fetchMessages();
      await fetchActivities();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load some dashboard data. Click retry to try again.');
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDashboardData = async () => {
    try {
      // Fetch student profile
      let profile = null;
      try {
        const profileRes = await axios.get('http://localhost:5000/api/students/profile', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        profile = profileRes.data.student;
        
        // Update profile picture if available
        if (profile.profilePhoto) {
          setProfilePictureUrl(`http://localhost:5000${profile.profilePhoto}`);
        }
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      // Fetch applications
      let applications = [];
      try {
        const applicationsRes = await axios.get('http://localhost:5000/api/applications/student', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        applications = applicationsRes.data.applications || [];
      } catch (appError) {
        console.error('Error fetching applications:', appError);
      }
      
      // Calculate application stats
      const pending = applications.filter(app => app.status === 'pending' || app.status === 'Pending').length;
      const reviewed = applications.filter(app => app.status === 'reviewed' || app.status === 'Reviewed').length;
      const interview = applications.filter(app => app.status === 'interview' || app.status === 'Interview').length;
      const accepted = applications.filter(app => app.status === 'accepted' || app.status === 'Accepted').length;
      const rejected = applications.filter(app => app.status === 'rejected' || app.status === 'Rejected').length;
      const withdrawn = applications.filter(app => app.status === 'withdrawn' || app.status === 'Withdrawn').length;
      
      // Fetch upcoming interviews
      let interviews = [];
      try {
        const interviewsRes = await axios.get('http://localhost:5000/api/interviews/student', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        interviews = interviewsRes.data.interviews || [];
      } catch (interviewError) {
        console.error('Error fetching interviews:', interviewError);
        // Mock data for interviews
        interviews = [
          {
            _id: '1',
            jobTitle: 'Senior Software Engineer',
            companyName: 'Tech Corp',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            mode: 'Video Call',
            status: 'scheduled'
          },
          {
            _id: '2',
            jobTitle: 'Product Manager',
            companyName: 'Innovation Labs',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            mode: 'In Person',
            status: 'scheduled'
          }
        ];
      }
      
      const upcoming = interviews.filter(i => new Date(i.date) > new Date()).length;
      const completed = interviews.filter(i => new Date(i.date) < new Date()).length;
      
      // Fetch connections/followers
      let connections = [];
      try {
        const connectionsRes = await axios.get('http://localhost:5000/api/students/connections', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        connections = connectionsRes.data.connections || [];
      } catch (connError) {
        console.error('Error fetching connections:', connError);
      }
      
      // Fetch suggested connections
      try {
        const suggestedRes = await axios.get('http://localhost:5000/api/students/suggestions', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setSuggestedConnections(suggestedRes.data.suggestions || []);
      } catch (suggestError) {
        console.error('Error fetching suggestions:', suggestError);
        // Mock data
        setSuggestedConnections([
          { _id: '1', name: 'John Doe', role: 'Software Engineer', company: 'Tech Corp', mutual: 5 },
          { _id: '2', name: 'Sarah Johnson', role: 'Product Manager', company: 'Innovation Labs', mutual: 3 },
          { _id: '3', name: 'Mike Chen', role: 'Data Scientist', company: 'DataWorks', mutual: 2 }
        ]);
      }
      
      // Fetch skill tests
      try {
        const testsRes = await axios.get('http://localhost:5000/api/skill-tests/student', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setSkillTests(testsRes.data.tests || []);
      } catch (testsError) {
        console.error('Error fetching skill tests:', testsError);
        // Mock data
        setSkillTests([
          { _id: '1', name: 'JavaScript Assessment', score: 85, maxScore: 100, date: new Date().toISOString() },
          { _id: '2', name: 'React Developer Test', score: 92, maxScore: 100, date: new Date().toISOString() }
        ]);
      }
      
      // Fetch achievements
      try {
        const achievementsRes = await axios.get('http://localhost:5000/api/students/achievements', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setAchievements(achievementsRes.data.achievements || []);
      } catch (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        // Mock data
        setAchievements([
          { _id: '1', title: 'Top Performer', description: 'Completed 10 applications', icon: '🏆' },
          { _id: '2', title: 'Skill Master', description: 'Completed 5 skill tests', icon: '⭐' }
        ]);
      }
      
      // Fetch recommended jobs
      try {
        const jobsRes = await axios.get('http://localhost:5000/api/jobs/recommended?limit=4', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setRecommendedJobs(jobsRes.data.jobs || []);
        setTrendingJobs(jobsRes.data.trending || []);
      } catch (jobsError) {
        console.error('Error fetching recommended jobs:', jobsError);
        // Mock data
        setRecommendedJobs([
          { _id: '1', title: 'Senior Software Engineer', companyId: { companyName: 'Tech Corp' }, location: { city: 'Colombo' }, salary: { min: 80000 } },
          { _id: '2', title: 'Product Manager', companyId: { companyName: 'Innovation Labs' }, location: { city: 'Remote' }, salary: { min: 70000 } }
        ]);
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
        withdrawnApplications: withdrawn,
        upcomingInterviews: upcoming,
        completedInterviews: completed,
        connections: connections.length,
        followers: profile?.followers?.length || 0,
        following: profile?.following?.length || 0,
        posts: profile?.posts?.length || 0,
        profileViews: profile?.profileViews || 0,
        cvViews: profile?.cv?.views || 0,
        notifications: 3,
        unreadMessages: 2
      }));

      setRecentApplications(applications.slice(0, 5));
      setUpcomingInterviews(interviews.slice(0, 3));

    } catch (error) {
      console.error('Error in student dashboard data:', error);
      throw error;
    }
  };

  const fetchCompanyDashboardData = async () => {
    try {
      // Fetch company profile
      let company = null;
      try {
        const profileRes = await axios.get('http://localhost:5000/api/companies/profile', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        company = profileRes.data.company;
        
        // Update profile picture if available
        if (company.companyLogo) {
          setProfilePictureUrl(`http://localhost:5000${company.companyLogo}`);
        }
      } catch (profileError) {
        console.error('Error fetching company profile:', profileError);
      }
      
      // Fetch jobs
      let jobs = [];
      try {
        const jobsRes = await axios.get('http://localhost:5000/api/companies/jobs', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        jobs = jobsRes.data.jobs || [];
      } catch (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }
      
      // Fetch applications
      let applications = [];
      try {
        const applicationsRes = await axios.get('http://localhost:5000/api/applications/company', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        applications = applicationsRes.data.applications || [];
      } catch (appError) {
        console.error('Error fetching applications:', appError);
      }
      
      // Calculate stats
      const activeJobs = jobs.filter(job => job.status === 'active').length;
      const draftJobs = jobs.filter(job => job.status === 'draft').length;
      const closedJobs = jobs.filter(job => job.status === 'closed').length;
      
      const newApps = applications.filter(app => app.status === 'pending' || app.status === 'Pending').length;
      const shortlisted = applications.filter(app => app.status === 'shortlisted' || app.status === 'Shortlisted').length;
      const interviewed = applications.filter(app => app.status === 'interview' || app.status === 'Interview').length;
      const hired = applications.filter(app => app.status === 'accepted' || app.status === 'Accepted').length;
      const rejected = applications.filter(app => app.status === 'rejected' || app.status === 'Rejected').length;
      
      // Fetch scheduled interviews
      let interviews = [];
      try {
        const interviewsRes = await axios.get('http://localhost:5000/api/interviews/company', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        interviews = interviewsRes.data.interviews || [];
      } catch (interviewError) {
        console.error('Error fetching interviews:', interviewError);
        // Mock data
        interviews = [
          {
            _id: '1',
            applicantName: 'John Doe',
            jobTitle: 'Senior Software Engineer',
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            mode: 'Video Call',
            status: 'scheduled'
          },
          {
            _id: '2',
            applicantName: 'Sarah Johnson',
            jobTitle: 'Product Manager',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            mode: 'In Person',
            status: 'scheduled'
          }
        ];
      }
      
      setStats(prev => ({
        ...prev,
        totalJobs: jobs.length,
        activeJobs: activeJobs,
        draftJobs: draftJobs,
        closedJobs: closedJobs,
        totalApplicants: applications.length,
        newApplicants: newApps,
        shortlistedApplicants: shortlisted,
        interviewedApplicants: interviewed,
        hiredApplicants: hired,
        rejectedApplicants: rejected,
        scheduledInterviews: interviews.length,
        pendingReviews: applications.filter(app => app.status === 'reviewed' || app.status === 'Reviewed').length,
        notifications: 3,
        unreadMessages: 2
      }));

      setRecentApplications(applications.slice(0, 5));
      setUpcomingInterviews(interviews.slice(0, 3));

      // Fetch suggested candidates
      try {
        const suggestedRes = await axios.get('http://localhost:5000/api/companies/suggestions', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setSuggestedConnections(suggestedRes.data.suggestions || []);
      } catch (suggestError) {
        console.error('Error fetching suggestions:', suggestError);
        // Mock data
        setSuggestedConnections([
          { _id: '1', name: 'John Doe', skills: ['React', 'Node.js'], experience: '5 years', match: 95 },
          { _id: '2', name: 'Sarah Johnson', skills: ['Product Management', 'Agile'], experience: '7 years', match: 88 },
          { _id: '3', name: 'Mike Chen', skills: ['Python', 'ML'], experience: '4 years', match: 82 }
        ]);
      }

    } catch (error) {
      console.error('Error in company dashboard data:', error);
      throw error;
    }
  };

  const fetchAdminDashboardData = async () => {
    try {
      // Fetch users
      let users = [];
      try {
        const usersRes = await axios.get('http://localhost:5000/api/users', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        users = usersRes.data.users || [];
      } catch (usersError) {
        console.error('Error fetching users:', usersError);
      }
      
      // Fetch companies
      let companies = [];
      try {
        const companiesRes = await axios.get('http://localhost:5000/api/companies', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        companies = companiesRes.data.companies || [];
      } catch (compError) {
        console.error('Error fetching companies:', compError);
      }
      
      // Fetch jobs
      let jobs = { total: 0 };
      try {
        const jobsRes = await axios.get('http://localhost:5000/api/jobs', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        jobs = jobsRes.data;
      } catch (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }
      
      // Fetch reports
      let reports = [];
      try {
        const reportsRes = await axios.get('http://localhost:5000/api/admin/reports', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        reports = reportsRes.data.reports || [];
      } catch (reportsError) {
        console.error('Error fetching reports:', reportsError);
      }
      
      const students = users.filter(u => u.role === 'student').length;
      const companyUsers = users.filter(u => u.role === 'company').length;
      const admins = users.filter(u => u.role === 'admin').length;
      const pendingVerifications = users.filter(u => !u.isVerified && u.role !== 'admin').length;
      
      const reportedPosts = reports.filter(r => r.type === 'post').length;
      const reportedJobs = reports.filter(r => r.type === 'job').length;
      const reportedUsers = reports.filter(r => r.type === 'user').length;
      
      setStats(prev => ({
        ...prev,
        totalUsers: users.length,
        totalStudents: students,
        totalCompanies: companyUsers,
        totalAdmins: admins,
        pendingVerifications: pendingVerifications,
        reportedPosts: reportedPosts,
        reportedJobs: reportedJobs,
        reportedUsers: reportedUsers,
        activeReports: reports.length,
        activeJobs: jobs.total || 0,
        notifications: 5,
        unreadMessages: 3
      }));

    } catch (error) {
      console.error('Error in admin dashboard data:', error);
      throw error;
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setRecentNotifications(response.data.notifications?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Mock data
      setRecentNotifications([
        { _id: '1', type: 'application', message: 'Your application was viewed', time: '2 hours ago', read: false },
        { _id: '2', type: 'interview', message: 'Interview scheduled for tomorrow', time: '5 hours ago', read: false },
        { _id: '3', type: 'message', message: 'New message from Tech Corp', time: '1 day ago', read: true }
      ]);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/messages/recent', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setRecentMessages(response.data.messages?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Mock data
      setRecentMessages([
        { _id: '1', from: 'Tech Corp', message: 'We would like to schedule an interview', time: '1 hour ago', unread: true },
        { _id: '2', from: 'Innovation Labs', message: 'Thank you for your application', time: '3 hours ago', unread: false }
      ]);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/activities/recent', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setRecentActivities(response.data.activities?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Mock data
      setRecentActivities([
        { _id: '1', action: 'Applied for Senior Software Engineer', time: '2 hours ago' },
        { _id: '2', action: 'Saved Product Manager position', time: '5 hours ago' },
        { _id: '3', action: 'Updated profile', time: '1 day ago' }
      ]);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'ds-badge ds-badge-warning',
      'Pending': 'ds-badge ds-badge-warning',
      'reviewed': 'ds-badge ds-badge-info',
      'Reviewed': 'ds-badge ds-badge-info',
      'shortlisted': 'ds-badge ds-badge-primary',
      'Shortlisted': 'ds-badge ds-badge-primary',
      'interview': 'ds-badge ds-badge-success',
      'Interview': 'ds-badge ds-badge-success',
      'accepted': 'ds-badge ds-badge-success',
      'Accepted': 'ds-badge ds-badge-success',
      'rejected': 'ds-badge ds-badge-danger',
      'Rejected': 'ds-badge ds-badge-danger',
      'withdrawn': 'ds-badge ds-badge-secondary',
      'Withdrawn': 'ds-badge ds-badge-secondary'
    };
    return badges[status] || 'ds-badge ds-badge-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

  if (error) {
    return (
      <div className="ds-error-container">
        <FaSyncAlt className="ds-error-icon" />
        <h4 className="ds-error-title">Unable to Load Complete Data</h4>
        <p className="ds-error-message">{error}</p>
        <p className="ds-error-help">Don't worry! You can still use all features. Some statistics may be temporarily unavailable.</p>
        <div className="ds-error-actions">
          <button className="ds-btn ds-btn-primary" onClick={handleRetry}>
            <FaSyncAlt /> Retry Loading
          </button>
          <Link to="/" className="ds-btn ds-btn-outline">
            Go to Home
          </Link>
        </div>
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
                <div className="ds-avatar-placeholder">
                  {getInitials(user.name)}
                </div>
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
            <button className="ds-icon-btn" onClick={() => setShowMessages(!showMessages)}>
              <FaEnvelope />
              {stats.unreadMessages > 0 && <span className="ds-badge-notification">{stats.unreadMessages}</span>}
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
              {recentNotifications.length > 0 ? (
                recentNotifications.map(notif => (
                  <div key={notif._id} className={`ds-notification-item ${!notif.read ? 'ds-unread' : ''}`}>
                    <div className="ds-notification-content">
                      <p>{notif.message}</p>
                      <small>{notif.time}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ds-empty-message">No notifications</p>
              )}
            </div>
          </div>
        )}

        {/* Messages Dropdown */}
        {showMessages && (
          <div className="ds-dropdown ds-messages-dropdown">
            <div className="ds-dropdown-header">
              <h6>Messages</h6>
              <Link to="/messages" className="ds-link">View All</Link>
            </div>
            <div className="ds-dropdown-body">
              {recentMessages.length > 0 ? (
                recentMessages.map(msg => (
                  <div key={msg._id} className={`ds-message-item ${msg.unread ? 'ds-unread' : ''}`}>
                    <div className="ds-message-content">
                      <strong>{msg.from}</strong>
                      <p>{msg.message}</p>
                      <small>{msg.time}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ds-empty-message">No messages</p>
              )}
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
                  <span className="ds-status-value">{stats.interviewApplications}</span>
                </div>
              </div>
            </div>

            {/* Skill Tests */}
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

            {/* Achievements */}
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
          </div>
        </div>

        {/* Recent Applications */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h5>Recent Applications</h5>
            <Link to="/student/applied-jobs" className="ds-btn ds-btn-link">View All</Link>
          </div>
          <div className="ds-card-body">
            {recentApplications.length > 0 ? (
              <div className="ds-table-responsive">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map(app => (
                      <tr key={app._id}>
                        <td>{app.jobId?.title || 'N/A'}</td>
                        <td>{app.jobId?.companyId?.companyName || 'N/A'}</td>
                        <td>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A'}</td>
                        <td><span className={getStatusBadge(app.status)}>{app.status || 'Pending'}</span></td>
                        <td>
                          <Link to={`/student/job/${app.jobId?._id}`} className="ds-btn ds-btn-sm ds-btn-outline-primary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ds-empty-state">
                <p>No applications yet.</p>
                <Link to="/student/jobs" className="ds-btn ds-btn-primary">
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Connections */}
        {suggestedConnections.length > 0 && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h5>People You May Know</h5>
            </div>
            <div className="ds-card-body">
              <div className="ds-suggestions-grid">
                {suggestedConnections.map(person => (
                  <div key={person._id} className="ds-suggestion-item">
                    <div className="ds-suggestion-avatar">
                      <FaUserCircle />
                    </div>
                    <div className="ds-suggestion-info">
                      <h6>{person.name}</h6>
                      <p>{person.role} at {person.company}</p>
                      <small>{person.mutual} mutual connections</small>
                    </div>
                    <button className="ds-btn ds-btn-sm ds-btn-outline-primary">
                      <FaUserPlus /> Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
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

  // Company Dashboard
  if (user?.role === 'company') {
    return (
      <div className="ds-company-dashboard">
        <div className="ds-welcome-header">
          <div className="ds-welcome-content">
            <div className="ds-user-avatar-large">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={user.name} className="ds-avatar-image" />
              ) : (
                <div className="ds-avatar-placeholder">
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <div className="ds-welcome-text">
              <h2>Welcome back, {user.name}! 🏢</h2>
              <p>Manage your job postings and find the best talent</p>
              <div className="ds-user-meta">
                <span><FaBriefcase /> {stats.activeJobs} active jobs</span>
                <span><FaUsers /> {stats.totalApplicants} applicants</span>
                <span><FaCalendarAlt /> {stats.scheduledInterviews} interviews</span>
              </div>
            </div>
          </div>
          <div className="ds-welcome-actions">
            <button className="ds-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <FaBell />
              {stats.notifications > 0 && <span className="ds-badge-notification">{stats.notifications}</span>}
            </button>
            <button className="ds-icon-btn" onClick={() => setShowMessages(!showMessages)}>
              <FaEnvelope />
              {stats.unreadMessages > 0 && <span className="ds-badge-notification">{stats.unreadMessages}</span>}
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
              {recentNotifications.length > 0 ? (
                recentNotifications.map(notif => (
                  <div key={notif._id} className={`ds-notification-item ${!notif.read ? 'ds-unread' : ''}`}>
                    <div className="ds-notification-content">
                      <p>{notif.message}</p>
                      <small>{notif.time}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ds-empty-message">No notifications</p>
              )}
            </div>
          </div>
        )}

        {/* Messages Dropdown */}
        {showMessages && (
          <div className="ds-dropdown ds-messages-dropdown">
            <div className="ds-dropdown-header">
              <h6>Messages</h6>
              <Link to="/messages" className="ds-link">View All</Link>
            </div>
            <div className="ds-dropdown-body">
              {recentMessages.length > 0 ? (
                recentMessages.map(msg => (
                  <div key={msg._id} className={`ds-message-item ${msg.unread ? 'ds-unread' : ''}`}>
                    <div className="ds-message-content">
                      <strong>{msg.from}</strong>
                      <p>{msg.message}</p>
                      <small>{msg.time}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ds-empty-message">No messages</p>
              )}
            </div>
          </div>
        )}

        <div className="ds-stats-grid">
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.totalJobs}</h3>
              <p>Total Jobs</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-primary">
              <FaBriefcase />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.activeJobs}</h3>
              <p>Active Jobs</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-success">
              <FaCheckCircle />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.totalApplicants}</h3>
              <p>Total Applicants</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-info">
              <FaUsers />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.newApplicants}</h3>
              <p>New Applicants</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-warning">
              <FaUserGraduate />
            </div>
          </div>
        </div>

        {/* Upcoming Interviews Section */}
        {upcomingInterviews.length > 0 && (
          <div className="ds-card ds-interviews-card">
            <div className="ds-card-header">
              <h5>
                <FaCalendarAlt className="ds-icon" />
                Scheduled Interviews
              </h5>
              <Link to="/company/interviews" className="ds-btn ds-btn-link">Manage Interviews</Link>
            </div>
            <div className="ds-card-body">
              <div className="ds-interviews-list">
                {upcomingInterviews.map(interview => (
                  <div key={interview._id} className="ds-interview-item">
                    <div className="ds-interview-info">
                      <h6>{interview.applicantName}</h6>
                      <p className="ds-job-title">{interview.jobTitle}</p>
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
                      <button className="ds-btn ds-btn-sm ds-btn-outline-primary">Start</button>
                      <button className="ds-btn ds-btn-sm ds-btn-outline-secondary">Reschedule</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="ds-row">
          <div className="ds-col-8">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Hiring Pipeline</h5>
              </div>
              <div className="ds-card-body">
                <div className="ds-pipeline-grid">
                  <div className="ds-pipeline-item">
                    <h3 className="ds-text-primary">{stats.newApplicants}</h3>
                    <p>New</p>
                  </div>
                  <div className="ds-pipeline-item">
                    <h3 className="ds-text-info">{stats.shortlistedApplicants}</h3>
                    <p>Shortlisted</p>
                  </div>
                  <div className="ds-pipeline-item">
                    <h3 className="ds-text-warning">{stats.interviewedApplicants}</h3>
                    <p>Interviewed</p>
                  </div>
                  <div className="ds-pipeline-item">
                    <h3 className="ds-text-success">{stats.hiredApplicants}</h3>
                    <p>Hired</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ds-col-4">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Quick Stats</h5>
              </div>
              <div className="ds-card-body">
                <div className="ds-quick-stats">
                  <div>
                    <span>Active Jobs</span>
                    <span className="ds-stat-value">{stats.activeJobs}/{stats.totalJobs}</span>
                  </div>
                  <div>
                    <span>Avg. Applications/Job</span>
                    <span className="ds-stat-value">
                      {stats.activeJobs > 0 ? (stats.totalApplicants / stats.activeJobs).toFixed(1) : 0}
                    </span>
                  </div>
                  <div>
                    <span>Hiring Rate</span>
                    <span className="ds-stat-value">
                      {stats.totalApplicants > 0 ? ((stats.hiredApplicants / stats.totalApplicants) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div>
                    <span>Interview Rate</span>
                    <span className="ds-stat-value">
                      {stats.totalApplicants > 0 ? ((stats.interviewedApplicants / stats.totalApplicants) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <h5>Recent Applications</h5>
            <Link to="/company/applicants" className="ds-btn ds-btn-link">View All</Link>
          </div>
          <div className="ds-card-body">
            {recentApplications.length > 0 ? (
              <div className="ds-table-responsive">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Job Title</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map(app => (
                      <tr key={app._id}>
                        <td>
                          <div>
                            <strong>{app.studentId?.userId?.name || 'N/A'}</strong>
                            <br />
                            <small>{app.studentId?.userId?.email || 'N/A'}</small>
                          </div>
                        </td>
                        <td>{app.jobId?.title || 'N/A'}</td>
                        <td>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A'}</td>
                        <td><span className={getStatusBadge(app.status)}>{app.status || 'Pending'}</span></td>
                        <td>
                          <Link to={`/company/applicant/${app._id}`} className="ds-btn ds-btn-sm ds-btn-outline-primary">
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ds-empty-state">
                <p>No applications received yet</p>
                <Link to="/company/post-job" className="ds-btn ds-btn-primary">
                  Post a Job
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Candidates */}
        {suggestedConnections.length > 0 && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h5>Suggested Candidates</h5>
            </div>
            <div className="ds-card-body">
              <div className="ds-suggestions-grid">
                {suggestedConnections.map(candidate => (
                  <div key={candidate._id} className="ds-suggestion-item">
                    <div className="ds-suggestion-avatar">
                      <FaUserGraduate />
                    </div>
                    <div className="ds-suggestion-info">
                      <h6>{candidate.name}</h6>
                      <p>{candidate.skills?.slice(0, 2).join(' • ')}</p>
                      <small>{candidate.experience} experience</small>
                      <div className="ds-match-score">{candidate.match}% match</div>
                    </div>
                    <button className="ds-btn ds-btn-sm ds-btn-outline-primary">
                      <FaEye /> View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="ds-quick-actions">
          <Link to="/company/post-job" className="ds-quick-action-card">
            <FaRegFileAlt />
            <h6>Post New Job</h6>
          </Link>
          <Link to="/company/manage-jobs" className="ds-quick-action-card">
            <FaBriefcase />
            <h6>Manage Jobs</h6>
          </Link>
          <Link to="/company/applicants" className="ds-quick-action-card">
            <FaUsers />
            <h6>View Applicants</h6>
          </Link>
          <Link to="/company/interviews" className="ds-quick-action-card">
            <FaCalendarAlt />
            <h6>Interviews</h6>
          </Link>
          <Link to="/company/profile" className="ds-quick-action-card">
            <FaBuilding />
            <h6>Company Profile</h6>
          </Link>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (user?.role === 'admin') {
    return (
      <div className="ds-admin-dashboard">
        <div className="ds-welcome-header">
          <div className="ds-welcome-content">
            <div className="ds-user-avatar-large">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={user.name} className="ds-avatar-image" />
              ) : (
                <div className="ds-avatar-placeholder">
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <div className="ds-welcome-text">
              <h2>Welcome back, Admin {user.name}! 👑</h2>
              <p>Monitor and manage the entire platform</p>
              <div className="ds-user-meta">
                <span><FaUsers /> {stats.totalUsers} users</span>
                <span><FaBuilding /> {stats.totalCompanies} companies</span>
                <span><FaExclamationTriangle /> {stats.pendingVerifications} pending</span>
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

        <div className="ds-stats-grid">
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-primary">
              <FaUsers />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.totalStudents}</h3>
              <p>Students</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-success">
              <FaUserGraduate />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.totalCompanies}</h3>
              <p>Companies</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-info">
              <FaBuilding />
            </div>
          </div>
          
          <div className="ds-stat-card">
            <div className="ds-stat-info">
              <h3>{stats.pendingVerifications}</h3>
              <p>Pending Verifications</p>
            </div>
            <div className="ds-stat-icon ds-stat-icon-warning">
              <FaClock />
            </div>
          </div>
        </div>

        <div className="ds-row">
          <div className="ds-col-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Platform Overview</h5>
              </div>
              <div className="ds-card-body">
                <div className="ds-overview-stats">
                  <div>
                    <span>Total Jobs Posted</span>
                    <span className="ds-stat-value">{stats.activeJobs}</span>
                  </div>
                  <div>
                    <span>Total Applications</span>
                    <span className="ds-stat-value">{stats.totalApplications}</span>
                  </div>
                  <div>
                    <span>Active Companies</span>
                    <span className="ds-stat-value">{stats.totalCompanies}</span>
                  </div>
                  <div>
                    <span>Active Students</span>
                    <span className="ds-stat-value">{stats.totalStudents}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Active Reports</h5>
                <Link to="/admin/reports" className="ds-btn ds-btn-link">Manage</Link>
              </div>
              <div className="ds-card-body">
                <div className="ds-reports-stats">
                  <div className="ds-report-item">
                    <span><FaFileAlt /> Reported Posts</span>
                    <span className="ds-badge ds-badge-danger">{stats.reportedPosts}</span>
                  </div>
                  <div className="ds-report-item">
                    <span><FaBriefcase /> Reported Jobs</span>
                    <span className="ds-badge ds-badge-danger">{stats.reportedJobs}</span>
                  </div>
                  <div className="ds-report-item">
                    <span><FaUsers /> Reported Users</span>
                    <span className="ds-badge ds-badge-danger">{stats.reportedUsers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ds-col-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>User Distribution</h5>
              </div>
              <div className="ds-card-body">
                <div className="ds-distribution">
                  <div>
                    <div className="ds-distribution-header">
                      <span>Students</span>
                      <span>{stats.totalUsers > 0 ? ((stats.totalStudents / stats.totalUsers) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="ds-progress">
                      <div className="ds-progress-bar ds-bg-success" style={{width: `${stats.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="ds-distribution-header">
                      <span>Companies</span>
                      <span>{stats.totalUsers > 0 ? ((stats.totalCompanies / stats.totalUsers) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="ds-progress">
                      <div className="ds-progress-bar ds-bg-info" style={{width: `${stats.totalUsers > 0 ? (stats.totalCompanies / stats.totalUsers) * 100 : 0}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="ds-distribution-header">
                      <span>Admins</span>
                      <span>{stats.totalUsers > 0 ? ((stats.totalAdmins / stats.totalUsers) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="ds-progress">
                      <div className="ds-progress-bar ds-bg-warning" style={{width: `${stats.totalUsers > 0 ? (stats.totalAdmins / stats.totalUsers) * 100 : 0}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="ds-card">
              <div className="ds-card-header">
                <h5>Recent Activities</h5>
              </div>
              <div className="ds-card-body">
                <div className="ds-activities-list">
                  {recentActivities.map(activity => (
                    <div key={activity._id} className="ds-activity-item">
                      <p>{activity.action}</p>
                      <small>{activity.time}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ds-quick-actions">
          <Link to="/admin/users" className="ds-quick-action-card">
            <FaUsers />
            <h6>Manage Users</h6>
          </Link>
          <Link to="/admin/companies" className="ds-quick-action-card">
            <FaBuilding />
            <h6>Manage Companies</h6>
          </Link>
          <Link to="/admin/verifications" className="ds-quick-action-card">
            <FaCheckCircle />
            <h6>Verifications</h6>
          </Link>
          <Link to="/admin/reports" className="ds-quick-action-card">
            <FaExclamationTriangle />
            <h6>Reports</h6>
          </Link>
          <Link to="/admin/settings" className="ds-quick-action-card">
            <FaUserCog />
            <h6>Settings</h6>
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;