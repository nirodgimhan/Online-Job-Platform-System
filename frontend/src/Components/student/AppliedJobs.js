import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  FaBriefcase, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaEye,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBuilding,
  FaStar,
  FaFilter,
  FaSyncAlt,
  FaFileAlt,
  FaDownload,
  FaComment,
  FaUserGraduate,
  FaArrowLeft,
  FaRegClock,
  FaRegCheckCircle,
  FaRegTimesCircle,
  FaRegStar,
  FaExternalLinkAlt,
  FaChartLine,
  FaTrophy,
  FaMedal
} from 'react-icons/fa';

const AppliedJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthAndFetchApplications();
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      calculateStats();
    }
  }, [applications, filters]);

  const checkAuthAndFetchApplications = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Please login to view your applications');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      return;
    }

    if (!user) {
      setError('User data not found. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      return;
    }

    if (user.role !== 'student') {
      setError('Access denied. Only students can view applications.');
      setTimeout(() => navigate('/'), 2000);
      setLoading(false);
      return;
    }

    await fetchApplications();
  };

  const fetchApplications = async () => {
    const token = localStorage.getItem('token');
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/applications/student', {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data && response.data.success) {
        const apps = response.data.applications || [];
        setApplications(apps);
        calculateStats(apps);
      } else {
        setError(response.data?.message || 'Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view these applications.');
      } else if (err.request) {
        setError('No response from server. Please check if backend is running.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (apps = applications) => {
    const filtered = applyFilters(apps);
    const newStats = {
      total: filtered.length,
      pending: filtered.filter(app => app.status === 'Pending').length,
      reviewed: filtered.filter(app => app.status === 'Reviewed').length,
      shortlisted: filtered.filter(app => app.status === 'Shortlisted').length,
      interview: filtered.filter(app => app.status === 'Interview').length,
      accepted: filtered.filter(app => app.status === 'Accepted').length,
      rejected: filtered.filter(app => app.status === 'Rejected').length,
      withdrawn: filtered.filter(app => app.status === 'Withdrawn').length
    };
    setStats(newStats);
  };

  const applyFilters = (apps = applications) => {
    let filtered = [...apps];
    
    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }
    
    if (filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch(filters.dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(app => new Date(app.appliedDate) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(app => new Date(app.appliedDate) >= filterDate);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(app => new Date(app.appliedDate) >= filterDate);
          break;
        default:
          break;
      }
    }
    
    return filtered;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleRetry = () => {
    fetchApplications();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleClearFilters = () => {
    setFilters({ status: '', dateRange: '' });
  };

  const handleViewInterviewDetails = (application) => {
    setSelectedApplication(application);
    setShowInterviewModal(true);
  };

  const handleViewFeedback = (application) => {
    setSelectedApplication(application);
    setShowFeedbackModal(true);
  };

  const handleCloseModals = () => {
    setShowInterviewModal(false);
    setShowFeedbackModal(false);
    setSelectedApplication(null);
  };

  const getCompanyLogoUrl = (company) => {
    if (!company || !company.companyLogo) return null;
    if (company.companyLogo.startsWith('http')) return company.companyLogo;
    return `http://localhost:5000${company.companyLogo}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { class: 'ds-status-pending', icon: <FaRegClock />, text: 'Pending' },
      'Reviewed': { class: 'ds-status-reviewed', icon: <FaEye />, text: 'Reviewed' },
      'Shortlisted': { class: 'ds-status-shortlisted', icon: <FaRegStar />, text: 'Shortlisted' },
      'Interview': { class: 'ds-status-interview', icon: <FaCalendarAlt />, text: 'Interview' },
      'Accepted': { class: 'ds-status-accepted', icon: <FaRegCheckCircle />, text: 'Accepted' },
      'Rejected': { class: 'ds-status-rejected', icon: <FaRegTimesCircle />, text: 'Rejected' },
      'Withdrawn': { class: 'ds-status-withdrawn', icon: <FaTimesCircle />, text: 'Withdrawn' }
    };
    
    const badge = badges[status] || badges['Pending'];
    
    return (
      <span className={`ds-status-badge ${badge.class}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const filteredApplications = applyFilters();

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading your applications...</h4>
        <p>Please wait while we fetch your data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ds-error-container">
        <div className="ds-error-card">
          <FaTimesCircle className="ds-error-icon" />
          <h3>Error Loading Applications</h3>
          <p>{error}</p>
          <div className="ds-error-actions">
            <button className="ds-btn ds-btn-primary" onClick={handleRetry}>
              <FaSyncAlt /> Try Again
            </button>
            <button className="ds-btn ds-btn-outline-secondary" onClick={handleGoToLogin}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="ds-empty-state">
        <div className="ds-empty-icon-wrapper">
          <FaBriefcase className="ds-empty-icon" />
        </div>
        <h3>No Applications Yet</h3>
        <p>You haven't applied to any jobs. Start your job search today!</p>
        <Link to="/student/jobs" className="ds-btn ds-btn-primary ds-btn-lg">
          <FaBriefcase /> Browse Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="ds-applied-jobs">
      <div className="ds-applied-jobs-container">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-header-left">
            <div className="ds-header-icon-wrapper">
              <FaBriefcase className="ds-header-icon" />
            </div>
            <div>
              <h1>My Applications</h1>
              <p className="ds-header-subtitle">
                You have applied to {applications.length} job{applications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button className="ds-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? 'ds-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="ds-stats-grid">
          <div className="ds-stat-card ds-stat-total">
            <div className="ds-stat-icon"><FaBriefcase /></div>
            <div className="ds-stat-info">
              <span className="ds-stat-value">{stats.total}</span>
              <span className="ds-stat-label">Total Applications</span>
            </div>
          </div>
          <div className="ds-stat-card ds-stat-pending">
            <div className="ds-stat-icon"><FaClock /></div>
            <div className="ds-stat-info">
              <span className="ds-stat-value">{stats.pending}</span>
              <span className="ds-stat-label">Pending Review</span>
            </div>
          </div>
          <div className="ds-stat-card ds-stat-interview">
            <div className="ds-stat-icon"><FaCalendarAlt /></div>
            <div className="ds-stat-info">
              <span className="ds-stat-value">{stats.interview}</span>
              <span className="ds-stat-label">Interviews</span>
            </div>
          </div>
          <div className="ds-stat-card ds-stat-accepted">
            <div className="ds-stat-icon"><FaCheckCircle /></div>
            <div className="ds-stat-info">
              <span className="ds-stat-value">{stats.accepted}</span>
              <span className="ds-stat-label">Accepted</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ds-filters-card">
          <div className="ds-filters-content">
            <div className="ds-filters-row">
              <div className="ds-filter-group">
                <label>Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="ds-filter-group">
                <label>Date Range</label>
                <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
                  <option value="">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                </select>
              </div>
              <button className="ds-clear-filters" onClick={handleClearFilters}>
                <FaFilter /> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="ds-results-info">
          <p>Showing <strong>{filteredApplications.length}</strong> of <strong>{applications.length}</strong> applications</p>
        </div>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="ds-empty-filters">
            <FaFilter className="ds-empty-icon" />
            <h4>No applications match your filters</h4>
            <p>Try adjusting your filters to see more results.</p>
            <button className="ds-btn ds-btn-outline-primary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="ds-applications-grid">
            {filteredApplications.map((app) => {
              const companyLogoUrl = getCompanyLogoUrl(app.jobId?.companyId);
              
              return (
                <div key={app._id} className="ds-application-card">
                  {/* Header */}
                  <div className="ds-card-header">
                    <div className="ds-company-logo">
                      {companyLogoUrl ? (
                        <img 
                          src={companyLogoUrl}
                          alt={app.jobId?.companyId?.companyName}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="ds-logo-placeholder" style={{ display: companyLogoUrl ? 'none' : 'flex' }}>
                        <FaBuilding />
                      </div>
                    </div>
                    <div className="ds-job-info">
                      <h3 className="ds-job-title">{app.jobId?.title || 'Unknown Position'}</h3>
                      <p className="ds-company-name">{app.jobId?.companyId?.companyName || 'Unknown Company'}</p>
                      <div className="ds-job-meta">
                        <span><FaMapMarkerAlt /> {app.jobId?.location?.city || 'Remote'}</span>
                        <span><FaBriefcase /> {app.jobId?.employmentType || 'Full-time'}</span>
                      </div>
                    </div>
                    <div className="ds-status">
                      {getStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="ds-card-details">
                    <div className="ds-detail-item">
                      <FaCalendarAlt />
                      <div>
                        <span>Applied Date</span>
                        <strong>{formatDate(app.appliedDate)}</strong>
                      </div>
                    </div>
                    <div className="ds-detail-item">
                      <FaClock />
                      <div>
                        <span>Last Updated</span>
                        <strong>{formatDate(app.updatedAt || app.appliedDate)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  {app.coverLetter && (
                    <div className="ds-cover-letter">
                      <FaFileAlt />
                      <div>
                        <span>Cover Letter</span>
                        <p>{app.coverLetter.length > 120 ? `${app.coverLetter.substring(0, 120)}...` : app.coverLetter}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="ds-card-actions">
                    <Link to={`/student/job/${app.jobId?._id}`} className="ds-action-btn ds-view-btn">
                      <FaEye /> View Job
                    </Link>
                    {app.status === 'Interview' && app.interviewDetails && (
                      <button className="ds-action-btn ds-interview-btn" onClick={() => handleViewInterviewDetails(app)}>
                        <FaCalendarAlt /> Interview
                      </button>
                    )}
                    {app.feedback && (
                      <button className="ds-action-btn ds-feedback-btn" onClick={() => handleViewFeedback(app)}>
                        <FaComment /> Feedback
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interview Modal */}
      {showInterviewModal && selectedApplication && (
        <div className="ds-modal-overlay" onClick={handleCloseModals}>
          <div className="ds-modal ds-modal-interview" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-success">
              <FaCalendarAlt className="ds-modal-icon" />
              <h3>Interview Details</h3>
              <button className="ds-modal-close" onClick={handleCloseModals}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-info-row">
                <label>Position</label>
                <p>{selectedApplication.jobId?.title}</p>
              </div>
              <div className="ds-info-row">
                <label>Company</label>
                <p>{selectedApplication.jobId?.companyId?.companyName}</p>
              </div>
              <div className="ds-info-row">
                <label>Date & Time</label>
                <p>{formatDate(selectedApplication.interviewDetails.date)}</p>
              </div>
              <div className="ds-info-row">
                <label>Mode</label>
                <p>
                  <span className={`ds-mode-badge ${selectedApplication.interviewDetails.mode === 'Online' ? 'ds-online' : 'ds-inperson'}`}>
                    {selectedApplication.interviewDetails.mode}
                  </span>
                </p>
              </div>
              {selectedApplication.interviewDetails.mode === 'Online' && selectedApplication.interviewDetails.link && (
                <div className="ds-info-row">
                  <label>Meeting Link</label>
                  <a href={selectedApplication.interviewDetails.link} target="_blank" rel="noopener noreferrer" className="ds-meeting-link">
                    <FaExternalLinkAlt /> Join Meeting
                  </a>
                </div>
              )}
              {selectedApplication.interviewDetails.mode === 'In-person' && selectedApplication.interviewDetails.address && (
                <div className="ds-info-row">
                  <label>Address</label>
                  <p>{selectedApplication.interviewDetails.address}</p>
                </div>
              )}
              {selectedApplication.interviewDetails.notes && (
                <div className="ds-info-row">
                  <label>Additional Notes</label>
                  <p className="ds-notes">{selectedApplication.interviewDetails.notes}</p>
                </div>
              )}
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={handleCloseModals}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedApplication && (
        <div className="ds-modal-overlay" onClick={handleCloseModals}>
          <div className="ds-modal ds-modal-feedback" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-info">
              <FaComment className="ds-modal-icon" />
              <h3>Employer Feedback</h3>
              <button className="ds-modal-close" onClick={handleCloseModals}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-info-row">
                <label>Position</label>
                <p>{selectedApplication.jobId?.title}</p>
              </div>
              <div className="ds-info-row">
                <label>Company</label>
                <p>{selectedApplication.jobId?.companyId?.companyName}</p>
              </div>
              <div className="ds-feedback-content">
                <label>Feedback</label>
                <div className="ds-feedback-text">
                  {selectedApplication.feedback.comments}
                </div>
              </div>
              {selectedApplication.feedback.providedDate && (
                <div className="ds-feedback-date">
                  <small>Provided on: {formatDate(selectedApplication.feedback.providedDate)}</small>
                </div>
              )}
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={handleCloseModals}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppliedJobs;