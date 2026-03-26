import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaUsers, FaBuilding, FaBriefcase, FaChartLine, FaCheckCircle, FaTimesCircle,
  FaClock, FaExclamationTriangle, FaSyncAlt, FaCalendarAlt, FaFileAlt,
  FaUserGraduate, FaUserTie, FaShieldAlt, FaRegBuilding, FaSpinner,
  FaEye, FaUserPlus
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCompanies: 0,
    totalAdmins: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalInterviews: 0,      // ← Added missing
    pendingVerifications: 0,
    verifiedCompanies: 0
  });

  // Recent data for tables
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);

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
    setError(null);
    try {
      const [
        usersRes,
        companiesRes,
        jobsRes,
        applicationsRes,
        interviewsRes
      ] = await Promise.allSettled([
        API.get('/admin/users'),
        API.get('/admin/companies'),
        API.get('/admin/jobs'),
        API.get('/admin/applications'),
        API.get('/admin/interviews')
      ]);

      // Process users
      if (usersRes.status === 'fulfilled') {
        const { students, companies, admins } = usersRes.value.data;
        setStats(prev => ({
          ...prev,
          totalUsers: (students?.length || 0) + (companies?.length || 0) + (admins?.length || 0),
          totalStudents: students?.length || 0,
          totalCompanies: companies?.length || 0,
          totalAdmins: admins?.length || 0
        }));
        setRecentUsers(students?.slice(0, 5) || []);
      }

      // Process companies
      if (companiesRes.status === 'fulfilled') {
        const { companies, pendingVerifications: pending, verified } = companiesRes.value.data;
        setStats(prev => ({
          ...prev,
          totalCompanies: companies?.length || 0,
          pendingVerifications: pending?.length || 0,
          verifiedCompanies: verified?.length || 0
        }));
        setRecentCompanies(companies?.slice(0, 5) || []);
        setPendingVerifications(pending?.slice(0, 5) || []);
      }

      // Process jobs
      if (jobsRes.status === 'fulfilled') {
        const { jobs, activeJobs } = jobsRes.value.data;
        setStats(prev => ({
          ...prev,
          totalJobs: jobs?.length || 0,
          activeJobs: activeJobs?.length || 0
        }));
        setRecentJobs(jobs?.slice(0, 5) || []);
      }

      // Process applications
      if (applicationsRes.status === 'fulfilled') {
        setStats(prev => ({
          ...prev,
          totalApplications: applicationsRes.value.data.totalApplications || 0
        }));
      }

      // Process interviews
      if (interviewsRes.status === 'fulfilled') {
        const { totalInterviews, recentInterviews } = interviewsRes.value.data;
        setStats(prev => ({ ...prev, totalInterviews: totalInterviews || 0 }));
        setRecentInterviews(recentInterviews?.slice(0, 5) || []);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
          <button className="admin-icon-btn" onClick={fetchAdminData} title="Refresh Data">
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {/* Statistics Cards - 8 cards */}
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
            <FaRegBuilding />
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
          <div className="admin-card">
            <div className="admin-card-header">
              <h5>Recent Users</h5>
              <Link to="/admin/users" className="admin-btn-link">View All</Link>
            </div>
            <div className="admin-card-body">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length > 0 ? (
                      recentUsers.map(user => (
                        <tr key={user._id}>
                          <td>
                            <div className="admin-user-info">
                              <div className="admin-user-avatar-small">
                                {user.profilePicture ? (
                                  <img src={`http://localhost:5000${user.profilePicture}`} alt={user.name} />
                                ) : (
                                  <span>{getInitials(user.name)}</span>
                                )}
                              </div>
                              <span>{user.name}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td><span className="admin-badge admin-badge-primary">Student</span></td>
                          <td>{formatDate(user.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="admin-empty-message">No recent users</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

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
                                {company.logo ? (
                                  <img src={`http://localhost:5000${company.logo}`} alt={company.companyName} />
                                ) : (
                                  <FaBuilding />
                                )}
                              </div>
                              <span>{company.companyName}</span>
                            </div>
                          </td>
                          <td>{company.industry || '—'}</td>
                          <td>
                            {company.verified ? (
                              <FaCheckCircle className="admin-text-success" />
                            ) : (
                              <FaTimesCircle className="admin-text-danger" />
                            )}
                          </td>
                          <td>{formatDate(company.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="admin-empty-message">No recent companies</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="admin-col-6">
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
                      <tr><td colSpan="4" className="admin-empty-message">No recent jobs</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {recentInterviews.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h5>Recent Interviews</h5>
                <Link to="/admin/interviews" className="admin-btn-link">View All</Link>
              </div>
              <div className="admin-card-body">
                {recentInterviews.map(interview => (
                  <div key={interview._id} className="admin-recommended-item">
                    <div className="admin-recommended-content">
                      <h6>{interview.jobTitle} - {interview.candidateName}</h6>
                      <p>{interview.companyName}</p>
                      <div className="admin-job-meta">
                        <span><FaCalendarAlt /> {new Date(interview.scheduledDate).toLocaleString()}</span>
                        <span className="admin-badge admin-badge-info">{interview.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Buttons */}
      <div className="admin-quick-actions">
        <Link to="/admin/users" className="admin-quick-action-card">
          <FaUsers />
          <h6>Manage Users</h6>
        </Link>
        <Link to="/admin/companies" className="admin-quick-action-card">
          <FaBuilding />
          <h6>Manage Companies</h6>
        </Link>
        <Link to="/admin/jobs" className="admin-quick-action-card">
          <FaBriefcase />
          <h6>Manage Jobs</h6>
        </Link>
        <Link to="/admin/verifications" className="admin-quick-action-card">
          <FaCheckCircle />
          <h6>Verifications</h6>
        </Link>
        <Link to="/admin/interviews" className="admin-quick-action-card">
          <FaCalendarAlt />
          <h6>Interviews</h6>
        </Link>
        <Link to="/admin/reports" className="admin-quick-action-card">
          <FaChartLine />
          <h6>Reports</h6>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;