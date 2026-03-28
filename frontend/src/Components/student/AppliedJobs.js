import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
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
  FaMedal,
  FaSpinner,
  FaExclamationTriangle
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
  const [withdrawing, setWithdrawing] = useState(false);

  const normalizeStatus = (status) => {
    if (!status) return 'Pending';
    const lower = status.toLowerCase();
    if (lower === 'pending') return 'Pending';
    if (lower === 'reviewed') return 'Reviewed';
    if (lower === 'shortlisted') return 'Shortlisted';
    if (lower === 'interview') return 'Interview';
    if (lower === 'accepted') return 'Accepted';
    if (lower === 'rejected') return 'Rejected';
    if (lower === 'withdrawn') return 'Withdrawn';
    return status;
  };

  useEffect(() => {
    checkAuthAndFetchApplications();
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      calculateStats(applications);
    } else {
      setStats({
        total: 0,
        pending: 0,
        reviewed: 0,
        shortlisted: 0,
        interview: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0
      });
    }
  }, [applications]);

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
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get('/applications/student');
      
      if (response.data && response.data.success) {
        const apps = response.data.applications || [];
        
        const processedApps = apps.map(app => ({
          ...app,
          appliedDate: app.appliedDate || app.appliedAt || app.createdAt,
          updatedAt: app.updatedAt || app.appliedDate || app.createdAt,
          jobId: app.jobId || {},
          interviewDetails: app.interviewDetails || {},
          feedback: app.feedback || null,
          coverLetter: app.coverLetter || '',
          status: normalizeStatus(app.status)
        }));
        
        setApplications(processedApps);
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

  const calculateStats = (apps) => {
    const newStats = {
      total: apps.length,
      pending: apps.filter(app => app.status === 'Pending').length,
      reviewed: apps.filter(app => app.status === 'Reviewed').length,
      shortlisted: apps.filter(app => app.status === 'Shortlisted').length,
      interview: apps.filter(app => app.status === 'Interview').length,
      accepted: apps.filter(app => app.status === 'Accepted').length,
      rejected: apps.filter(app => app.status === 'Rejected').length,
      withdrawn: apps.filter(app => app.status === 'Withdrawn').length
    };
    setStats(newStats);
  };

  const applyFilters = () => {
    let filtered = [...applications];
    
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

  // NEW: Withdraw application
  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(true);
    try {
      const response = await API.put(`/applications/${applicationId}/status`, { status: 'Withdrawn' });
      if (response.data.success) {
        toast.success('Application withdrawn successfully');
        
        // Remove the application from state
        const updatedApplications = applications.filter(app => app._id !== applicationId);
        setApplications(updatedApplications);
        // Stats will automatically recalculate because of the useEffect dependency on applications
      } else {
        toast.error(response.data.message || 'Failed to withdraw application');
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
      toast.error(err.response?.data?.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  const getCompanyLogoUrl = (company) => {
    if (!company || !company.companyLogo) return null;
    if (company.companyLogo.startsWith('http')) return company.companyLogo;
    return `http://localhost:5000${company.companyLogo}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { class: 'aj-status-pending', icon: <FaRegClock />, text: 'Pending' },
      'Reviewed': { class: 'aj-status-reviewed', icon: <FaEye />, text: 'Reviewed' },
      'Shortlisted': { class: 'aj-status-shortlisted', icon: <FaRegStar />, text: 'Shortlisted' },
      'Interview': { class: 'aj-status-interview', icon: <FaCalendarAlt />, text: 'Interview' },
      'Accepted': { class: 'aj-status-accepted', icon: <FaRegCheckCircle />, text: 'Accepted' },
      'Rejected': { class: 'aj-status-rejected', icon: <FaRegTimesCircle />, text: 'Rejected' },
      'Withdrawn': { class: 'aj-status-withdrawn', icon: <FaTimesCircle />, text: 'Withdrawn' }
    };
    
    const badge = badges[status];
    if (!badge) {
      return (
        <span className="aj-status-badge aj-status-pending">
          <FaRegClock /> {status}
        </span>
      );
    }
    
    return (
      <span className={`aj-status-badge ${badge.class}`}>
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
      <div className="aj-loading-container">
        <div className="aj-spinner"></div>
        <h4>Loading your applications...</h4>
        <p>Please wait while we fetch your data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aj-error-container">
        <div className="aj-error-card">
          <FaExclamationTriangle className="aj-error-icon" />
          <h3>Error Loading Applications</h3>
          <p>{error}</p>
          <div className="aj-error-actions">
            <button className="aj-btn aj-btn-primary" onClick={handleRetry}>
              <FaSyncAlt /> Try Again
            </button>
            <button className="aj-btn aj-btn-outline-secondary" onClick={handleGoToLogin}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="aj-empty-state">
        <div className="aj-empty-icon-wrapper">
          <FaBriefcase className="aj-empty-icon" />
        </div>
        <h3>No Applications Yet</h3>
        <p>You haven't applied to any jobs. Start your job search today!</p>
        <Link to="/student/jobs" className="aj-btn aj-btn-primary aj-btn-lg">
          <FaBriefcase /> Browse Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="aj-applied-jobs">
      <div className="aj-applied-jobs-container">
        {/* Header */}
        <div className="aj-page-header">
          <div className="aj-header-left">
            <div className="aj-header-icon-wrapper">
              <FaBriefcase className="aj-header-icon" />
            </div>
            <div>
              <h1>My Applications</h1>
              <p className="aj-header-subtitle">
                You have applied to {applications.length} job{applications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button className="aj-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? 'aj-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="aj-stats-grid">
          <div className="aj-stat-card aj-stat-total">
            <div className="aj-stat-icon"><FaBriefcase /></div>
            <div className="aj-stat-info">
              <span className="aj-stat-value">{stats.total}</span>
              <span className="aj-stat-label">Total Applications</span>
            </div>
          </div>
          <div className="aj-stat-card aj-stat-pending">
            <div className="aj-stat-icon"><FaClock /></div>
            <div className="aj-stat-info">
              <span className="aj-stat-value">{stats.pending}</span>
              <span className="aj-stat-label">Pending Review</span>
            </div>
          </div>
          <div className="aj-stat-card aj-stat-interview">
            <div className="aj-stat-icon"><FaCalendarAlt /></div>
            <div className="aj-stat-info">
              <span className="aj-stat-value">{stats.interview}</span>
              <span className="aj-stat-label">Interviews</span>
            </div>
          </div>
          <div className="aj-stat-card aj-stat-accepted">
            <div className="aj-stat-icon"><FaCheckCircle /></div>
            <div className="aj-stat-info">
              <span className="aj-stat-value">{stats.accepted}</span>
              <span className="aj-stat-label">Accepted</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="aj-filters-card">
          <div className="aj-filters-content">
            <div className="aj-filters-row">
              <div className="aj-filter-group">
                <label>Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>
              <div className="aj-filter-group">
                <label>Date Range</label>
                <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
                  <option value="">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                </select>
              </div>
              <button className="aj-clear-filters" onClick={handleClearFilters}>
                <FaFilter /> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="aj-results-info">
          <p>Showing <strong>{filteredApplications.length}</strong> of <strong>{applications.length}</strong> applications</p>
        </div>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="aj-empty-filters">
            <FaFilter className="aj-empty-icon" />
            <h4>No applications match your filters</h4>
            <p>Try adjusting your filters to see more results.</p>
            <button className="aj-btn aj-btn-outline-primary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="aj-applications-grid">
            {filteredApplications.map((app) => {
              const companyLogoUrl = getCompanyLogoUrl(app.jobId?.companyId);
              
              return (
                <div key={app._id} className="aj-application-card">
                  {/* Header */}
                  <div className="aj-card-header">
                    <div className="aj-company-logo">
                      {companyLogoUrl ? (
                        <img 
                          src={companyLogoUrl}
                          alt={app.jobId?.companyId?.companyName || 'Company Logo'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="aj-logo-placeholder" style={{ display: companyLogoUrl ? 'none' : 'flex' }}>
                        <FaBuilding />
                      </div>
                    </div>
                    <div className="aj-job-info">
                      <h3 className="aj-job-title">{app.jobId?.title || 'Unknown Position'}</h3>
                      <p className="aj-company-name">{app.jobId?.companyId?.companyName || 'Unknown Company'}</p>
                      <div className="aj-job-meta">
                        <span><FaMapMarkerAlt /> {app.jobId?.location?.city || 'Remote'}</span>
                        <span><FaBriefcase /> {app.jobId?.employmentType || 'Full-time'}</span>
                      </div>
                    </div>
                    <div className="aj-status-wrapper">
                      <div className="aj-status">
                        {getStatusBadge(app.status)}
                      </div>
                      {/* Withdraw button - only show for active (non‑final) statuses */}
                      {app.status !== 'Withdrawn' && app.status !== 'Rejected' && app.status !== 'Accepted' && (
                        <button 
                          className="aj-withdraw-btn"
                          onClick={() => handleWithdrawApplication(app._id)}
                          disabled={withdrawing}
                          title="Withdraw application"
                        >
                          <FaTimesCircle />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="aj-card-details">
                    <div className="aj-detail-item">
                      <FaCalendarAlt />
                      <div>
                        <span>Applied Date</span>
                        <strong>{formatDate(app.appliedDate)}</strong>
                      </div>
                    </div>
                    <div className="aj-detail-item">
                      <FaClock />
                      <div>
                        <span>Last Updated</span>
                        <strong>{formatDate(app.updatedAt || app.appliedDate)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  {app.coverLetter && (
                    <div className="aj-cover-letter">
                      <FaFileAlt />
                      <div>
                        <span>Cover Letter</span>
                        <p>{app.coverLetter.length > 120 ? `${app.coverLetter.substring(0, 120)}...` : app.coverLetter}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="aj-card-actions">
                    <Link to={`/student/job/${app.jobId?._id}`} className="aj-action-btn aj-view-btn">
                      <FaEye /> View Job
                    </Link>
                    {app.status === 'Interview' && app.interviewDetails && Object.keys(app.interviewDetails).length > 0 && (
                      <button className="aj-action-btn aj-interview-btn" onClick={() => handleViewInterviewDetails(app)}>
                        <FaCalendarAlt /> Interview
                      </button>
                    )}
                    {app.feedback && app.feedback.comments && (
                      <button className="aj-action-btn aj-feedback-btn" onClick={() => handleViewFeedback(app)}>
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
        <div className="aj-modal-overlay" onClick={handleCloseModals}>
          <div className="aj-modal aj-modal-interview" onClick={e => e.stopPropagation()}>
            <div className="aj-modal-header aj-modal-header-success">
              <FaCalendarAlt className="aj-modal-icon" />
              <h3>Interview Details</h3>
              <button className="aj-modal-close" onClick={handleCloseModals}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="aj-modal-body">
              <div className="aj-info-row">
                <label>Position</label>
                <p>{selectedApplication.jobId?.title || 'Unknown Position'}</p>
              </div>
              <div className="aj-info-row">
                <label>Company</label>
                <p>{selectedApplication.jobId?.companyId?.companyName || 'Unknown Company'}</p>
              </div>
              <div className="aj-info-row">
                <label>Date & Time</label>
                <p>{formatDate(selectedApplication.interviewDetails?.date || selectedApplication.interviewDate)}</p>
              </div>
              <div className="aj-info-row">
                <label>Mode</label>
                <p>
                  <span className={`aj-mode-badge ${selectedApplication.interviewDetails?.mode === 'Online' ? 'aj-online' : 'aj-inperson'}`}>
                    {selectedApplication.interviewDetails?.mode || 'Not specified'}
                  </span>
                </p>
              </div>
              {selectedApplication.interviewDetails?.mode === 'Online' && selectedApplication.interviewDetails?.link && (
                <div className="aj-info-row">
                  <label>Meeting Link</label>
                  <a href={selectedApplication.interviewDetails.link} target="_blank" rel="noopener noreferrer" className="aj-meeting-link">
                    <FaExternalLinkAlt /> Join Meeting
                  </a>
                </div>
              )}
              {selectedApplication.interviewDetails?.mode === 'In-person' && selectedApplication.interviewDetails?.address && (
                <div className="aj-info-row">
                  <label>Address</label>
                  <p>{selectedApplication.interviewDetails.address}</p>
                </div>
              )}
              {selectedApplication.interviewDetails?.notes && (
                <div className="aj-info-row">
                  <label>Additional Notes</label>
                  <p className="aj-notes">{selectedApplication.interviewDetails.notes}</p>
                </div>
              )}
            </div>
            <div className="aj-modal-footer">
              <button className="aj-btn aj-btn-secondary" onClick={handleCloseModals}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedApplication && (
        <div className="aj-modal-overlay" onClick={handleCloseModals}>
          <div className="aj-modal aj-modal-feedback" onClick={e => e.stopPropagation()}>
            <div className="aj-modal-header aj-modal-header-info">
              <FaComment className="aj-modal-icon" />
              <h3>Employer Feedback</h3>
              <button className="aj-modal-close" onClick={handleCloseModals}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="aj-modal-body">
              <div className="aj-info-row">
                <label>Position</label>
                <p>{selectedApplication.jobId?.title || 'Unknown Position'}</p>
              </div>
              <div className="aj-info-row">
                <label>Company</label>
                <p>{selectedApplication.jobId?.companyId?.companyName || 'Unknown Company'}</p>
              </div>
              <div className="aj-feedback-content">
                <label>Feedback</label>
                <div className="aj-feedback-text">
                  {selectedApplication.feedback?.comments || 'No feedback provided'}
                </div>
              </div>
              {selectedApplication.feedback?.rating && (
                <div className="aj-feedback-rating">
                  <label>Rating</label>
                  <div className="aj-rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={star <= selectedApplication.feedback.rating ? 'aj-star-filled' : 'aj-star-empty'}>
                        {star <= selectedApplication.feedback.rating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedApplication.feedback?.providedDate && (
                <div className="aj-feedback-date">
                  <small>Provided on: {formatDate(selectedApplication.feedback.providedDate)}</small>
                </div>
              )}
            </div>
            <div className="aj-modal-footer">
              <button className="aj-btn aj-btn-secondary" onClick={handleCloseModals}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppliedJobs;