import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaUsers, FaUserGraduate, FaBuilding, FaShieldAlt,
  FaBriefcase, FaFileAlt, FaCalendarAlt, FaClock,
  FaCheckCircle, FaTimesCircle, FaSyncAlt, FaEye,
  FaSearch, FaEdit, FaTrash, FaUserCheck, FaUserTimes,
  FaBan, FaCheck, FaChartLine, FaEnvelope, FaPhone,
  FaMapMarkerAlt, FaSpinner, FaExclamationTriangle
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCompanies: 0,
    totalAdmins: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalInterviews: 0,
    pendingVerifications: 0,
    verifiedCompanies: 0,
    totalPosts: 0
  });

  // Recent data for tables
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
      loadProfilePicture();
    }
  }, [user]);

  const loadProfilePicture = () => {
    if (user?.profilePicture) {
      const url = user.profilePicture.startsWith('http')
        ? user.profilePicture
        : `http://localhost:5000${user.profilePicture}`;
      setProfilePictureUrl(url);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const [usersRes, jobsRes, postsRes] = await Promise.allSettled([
        API.get('/users'),
        API.get('/jobs/admin/all'),
        API.get('/posts/admin/all')
      ]);

      if (usersRes.status === 'fulfilled') {
        const usersData = usersRes.value.data;
        const allUsers = usersData.users || usersData.data?.users || [];

        const students = allUsers.filter(u => u.role === 'student');
        const companies = allUsers.filter(u => u.role === 'company');
        const admins = allUsers.filter(u => u.role === 'admin');

        const pendingCompanies = companies.filter(c => !c.isVerified);
        const verifiedCompanies = companies.filter(c => c.isVerified);

        setStats(prev => ({
          ...prev,
          totalUsers: allUsers.length,
          totalStudents: students.length,
          totalCompanies: companies.length,
          totalAdmins: admins.length,
          pendingVerifications: pendingCompanies.length,
          verifiedCompanies: verifiedCompanies.length
        }));

        setRecentUsers(students.slice(0, 5));
        setRecentCompanies(companies.slice(0, 5));
        setPendingVerifications(pendingCompanies.slice(0, 5));
      } else {
        console.error('Failed to fetch users:', usersRes.reason);
        toast.error('Failed to load user data');
      }

      if (jobsRes.status === 'fulfilled') {
        const jobsData = jobsRes.value.data;
        const jobs = jobsData.jobs || jobsData.data?.jobs || [];
        const activeJobs = jobs.filter(j => j.status === 'active');

        setStats(prev => ({
          ...prev,
          totalJobs: jobs.length,
          activeJobs: activeJobs.length
        }));
        setRecentJobs(jobs.slice(0, 5));
      } else {
        console.error('Failed to fetch jobs:', jobsRes.reason);
        toast.error('Failed to load job data');
      }

      if (postsRes.status === 'fulfilled') {
        const postsData = postsRes.value.data;
        const posts = postsData.posts || postsData.data?.posts || [];

        setStats(prev => ({
          ...prev,
          totalPosts: posts.length
        }));
        setRecentPosts(posts.slice(0, 5));
      } else {
        console.error('Failed to fetch posts:', postsRes.reason);
        toast.error('Failed to load post data');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner"></div>
        <h4>Loading Admin Dashboard...</h4>
        <p>Please wait while we fetch platform data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-container">
        <FaExclamationTriangle className="admin-error-icon" />
        <h4>Error Loading Dashboard</h4>
        <p>{error}</p>
        <button className="admin-btn admin-btn-primary" onClick={fetchAdminData}>
          <FaSyncAlt /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Welcome Header */}
      <div className="admin-welcome-header">
        <div className="admin-welcome-content">
          <div className="admin-user-avatar-large">
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt={user?.name} className="admin-avatar-image" />
            ) : (
              <div className="admin-avatar-placeholder">
                <FaShieldAlt size={32} />
              </div>
            )}
          </div>
          <div className="admin-welcome-text">
            <h2>Welcome, Admin {user?.name?.split(' ')[0] || ''}! 👑</h2>
            <p>You have full control over the platform. Monitor users, companies, jobs, and more.</p>
            <div className="admin-user-meta">
              <span><FaUsers /> {stats.totalUsers} total users</span>
              <span><FaBuilding /> {stats.totalCompanies} companies</span>
              <span><FaBriefcase /> {stats.totalJobs} jobs posted</span>
            </div>
          </div>
        </div>
        <div className="admin-welcome-actions">
          <button 
            className="admin-icon-btn" 
            onClick={fetchAdminData} 
            disabled={refreshing}
            title="Refresh Data"
          >
            <FaSyncAlt className={refreshing ? 'admin-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-primary">
            <FaUsers />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Students</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-info">
            <FaUserGraduate />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.totalCompanies}</h3>
            <p>Companies</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-success">
            <FaBuilding />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.totalJobs}</h3>
            <p>Total Jobs</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-warning">
            <FaBriefcase />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-primary">
            <FaBriefcase />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.totalApplications}</h3>
            <p>Applications</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-info">
            <FaFileAlt />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.totalInterviews}</h3>
            <p>Interviews</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-success">
            <FaCalendarAlt />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>{stats.pendingVerifications}</h3>
            <p>Pending Verifications</p>
          </div>
          <div className="admin-stat-icon admin-stat-icon-warning">
            <FaClock />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="admin-row">
        {/* Left Column */}
        <div className="admin-col-6">
          {/* Recent Users */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h5>Recent Users (Students)</h5>
              <Link to="/admin/users" className="admin-btn-link">View All</Link>
            </div>
            <div className="admin-card-body">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length > 0 ? (
                      recentUsers.map(userItem => (
                        <tr key={userItem._id}>
                          <td>
                            <div className="admin-user-info">
                              <div className="admin-user-avatar-small">
                                {userItem.profilePicture ? (
                                  <img src={getFullImageUrl(userItem.profilePicture)} alt={userItem.name} />
                                ) : (
                                  <span>{getInitials(userItem.name)}</span>
                                )}
                              </div>
                              <span>{userItem.name}</span>
                            </div>
                          </td>
                          <td>{userItem.email}</td>
                          <td>{formatDate(userItem.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="admin-empty-message">No recent users</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Companies */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h5>Recent Companies</h5>
              <Link to="/admin/companies" className="admin-btn-link">View All</Link>
            </div>
            <div className="admin-card-body">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Industry</th>
                      <th>Verified</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCompanies.length > 0 ? (
                      recentCompanies.map(company => (
                        <tr key={company._id}>
                          <td>
                            <div className="admin-user-info">
                              <div className="admin-user-avatar-small">
                                {company.companyLogo ? (
                                  <img src={getFullImageUrl(company.companyLogo)} alt={company.companyName} />
                                ) : (
                                  <FaBuilding />
                                )}
                              </div>
                              <span>{company.companyName}</span>
                            </div>
                          </td>
                          <td>{company.industry || '—'}</td>
                          <td>
                            {company.isVerified ? (
                              <FaCheckCircle className="admin-text-success" />
                            ) : (
                              <FaTimesCircle className="admin-text-danger" />
                            )}
                          </td>
                          <td>{formatDate(company.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="admin-empty-message">No recent companies</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="admin-col-6">
          {/* Pending Verification Requests */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h5>Pending Verification Requests</h5>
              <Link to="/admin/verifications" className="admin-btn-link">Manage</Link>
            </div>
            <div className="admin-card-body">
              {pendingVerifications.length > 0 ? (
                pendingVerifications.map(company => (
                  <div key={company._id} className="admin-recommended-item">
                    <div className="admin-recommended-content">
                      <h6>{company.companyName}</h6>
                      <p>{company.email}</p>
                      <div className="admin-job-meta">
                        <span><FaClock /> Requested {formatDate(company.createdAt)}</span>
                      </div>
                    </div>
                    <div className="admin-interview-actions">
                      <Link to={`/admin/companies/${company._id}/verify`} className="admin-btn admin-btn-sm admin-btn-primary">
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state">
                  <FaCheckCircle className="admin-empty-icon" />
                  <p>All companies are verified</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h5>Recent Job Posts</h5>
              <Link to="/admin/jobs" className="admin-btn-link">View All</Link>
            </div>
            <div className="admin-card-body">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Posted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.length > 0 ? (
                      recentJobs.map(job => (
                        <tr key={job._id}>
                          <td>{job.title}</td>
                          <td>{job.companyId?.companyName || 'Unknown'}</td>
                          <td>
                            <span className={`admin-badge ${job.status === 'active' ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                              {job.status === 'active' ? 'Active' : 'Closed'}
                            </span>
                          </td>
                          <td>{formatDate(job.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="admin-empty-message">No recent jobs</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Posts */}
          {recentPosts.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h5>Recent Posts</h5>
                <Link to="/admin/posts" className="admin-btn-link">View All</Link>
              </div>
              <div className="admin-card-body">
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Author</th>
                        <th>Content Preview</th>
                        <th>Posted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPosts.map(post => (
                        <tr key={post._id}>
                          <td>{post.userId?.name || 'Unknown'}</td>
                          <td>{post.content?.substring(0, 60)}{post.content?.length > 60 ? '...' : ''}</td>
                          <td>{formatDate(post.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Buttons */}
      <div className="admin-quick-actions-wrapper">
        <h5 className="admin-quick-actions-title">Quick Actions</h5>
        <div className="admin-quick-actions">
          <Link to="/admin/users" className="admin-quick-action-card">
            <FaUsers />
            <span>Manage Users</span>
          </Link>
          <Link to="/admin/companies" className="admin-quick-action-card">
            <FaBuilding />
            <span>Manage Companies</span>
          </Link>
          <Link to="/admin/jobs" className="admin-quick-action-card">
            <FaBriefcase />
            <span>Manage Jobs</span>
          </Link>
          <Link to="/admin/verifications" className="admin-quick-action-card">
            <FaCheckCircle />
            <span>Verifications</span>
          </Link>
          <Link to="/admin/interviews" className="admin-quick-action-card">
            <FaCalendarAlt />
            <span>Interviews</span>
          </Link>
          <Link to="/admin/reports" className="admin-quick-action-card">
            <FaChartLine />
            <span>Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;