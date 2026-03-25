import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUsers, FaBriefcase, FaSyncAlt, FaEye, FaCheckCircle, FaTimesCircle,
  FaClock, FaUserGraduate, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt,
  FaFileAlt, FaStar, FaDownload, FaSearch, FaSortUp, FaSortDown,
  FaTimes, FaExclamationTriangle, FaBuilding, FaFilter,
  FaRedo, FaFilePdf, FaFileWord, FaSpinner,
  FaUserCircle, FaCalendarPlus, FaVideo, FaMapMarkerAlt as FaLocation,
  FaExternalLinkAlt, FaArrowRight
} from 'react-icons/fa';

const ApplicantsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    jobId: searchParams.get('job') || '',
    status: '',
    dateRange: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    scheduledDate: '',
    duration: 60,
    mode: 'Online',
    meetingLink: '',
    location: { address: '', city: '', country: '' },
    interviewerName: '',
    interviewerEmail: '',
    notes: ''
  });
  const [interviewLoading, setInterviewLoading] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interviewed: 0,
    accepted: 0,
    rejected: 0
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      applyFilters();
      calculateStats();
    }
  }, [applications, searchTerm, filters]);

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Please login to view applications');
      toast.error('Please login first');
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

    if (user.role !== 'company') {
      setError('Access denied. Only companies can view applications.');
      setTimeout(() => navigate('/'), 2000);
      setLoading(false);
      return;
    }

    await fetchJobs();
  };

  const fetchJobs = async () => {
    try {
      const response = await API.get('/companies/jobs');
      
      if (response.data && response.data.success) {
        const jobsData = response.data.jobs || [];
        setJobs(jobsData);
        await fetchApplications();
      } else {
        setError('Failed to load jobs');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      handleError(err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get('/applications/company');
      
      if (response.data && response.data.success) {
        const applicationsData = response.data.applications || [];
        
        // Process applications to ensure we have student IDs
        const processedApps = applicationsData.map(app => ({
          ...app,
          studentIdObj: app.studentId || {},
          studentId: app.studentId?._id || app.studentId,
          studentName: app.studentId?.name || app.studentId?.userId?.name || 'Unknown',
          studentEmail: app.studentId?.email || app.studentId?.userId?.email || 'No email',
          appliedAt: app.appliedAt || app.appliedDate || app.createdAt
        }));
        
        setApplications(processedApps);
        setFilteredApplications(processedApps);
        
        if (processedApps.length === 0) {
          toast.info('No applications found');
        }
      } else {
        setError('Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      handleError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleError = (err) => {
    if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
    } else if (err.response) {
      if (err.response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response.status === 403) {
        setError('You are not authorized to view applications.');
      } else {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      }
    } else if (err.request) {
      setError('No response from server. Please check if backend is running.');
    } else {
      setError('Error: ' + err.message);
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const statusCount = {
      pending: 0, reviewed: 0, shortlisted: 0, interviewed: 0, accepted: 0, rejected: 0
    };
    
    filteredApplications.forEach(app => {
      const status = app.status?.toLowerCase() || 'pending';
      if (statusCount[status] !== undefined) statusCount[status]++;
    });
    
    setStats({
      total: filteredApplications.length,
      pending: statusCount.pending,
      reviewed: statusCount.reviewed,
      shortlisted: statusCount.shortlisted,
      interviewed: statusCount.interviewed,
      accepted: statusCount.accepted,
      rejected: statusCount.rejected
    });
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        (app.studentName || '').toLowerCase().includes(term) ||
        (app.studentEmail || '').toLowerCase().includes(term) ||
        (app.jobId?.title || '').toLowerCase().includes(term)
      );
    }

    if (filters.jobId) {
      filtered = filtered.filter(app => app.jobId?._id === filters.jobId);
    }

    if (filters.status) {
      filtered = filtered.filter(app => app.status?.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch(filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          filtered = filtered.filter(app => new Date(app.appliedAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(app => new Date(app.appliedAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(app => new Date(app.appliedAt) >= filterDate);
          break;
        default:
          break;
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (filters.sortBy === 'date') {
        comparison = new Date(a.appliedAt) - new Date(b.appliedAt);
      } else if (filters.sortBy === 'name') {
        comparison = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (filters.sortBy === 'job') {
        comparison = (a.jobId?.title || '').localeCompare(b.jobId?.title || '');
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      jobId: '',
      status: '',
      dateRange: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchJobs();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setActionLoading(true);
    try {
      const response = await API.put(`/applications/${applicationId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        toast.success(`Application status updated to ${newStatus}`);
        fetchApplications();
        setShowDetailsModal(false);
        setSelectedApplication(null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleScheduleInterview = (application) => {
    setSelectedApplication(application);
    setInterviewData({
      scheduledDate: '',
      duration: 60,
      mode: 'Online',
      meetingLink: '',
      location: { address: '', city: '', country: '' },
      interviewerName: user?.name || '',
      interviewerEmail: user?.email || '',
      notes: ''
    });
    setShowInterviewModal(true);
  };

  const handleCreateInterview = async () => {
    if (!interviewData.scheduledDate) {
      toast.error('Please select a date and time');
      return;
    }

    const selectedDate = new Date(interviewData.scheduledDate);
    const now = new Date();
    
    if (selectedDate <= now) {
      toast.error('Interview date must be in the future');
      return;
    }

    if (!selectedApplication || !selectedApplication._id) {
      toast.error('Application information is missing');
      return;
    }

    // Get the actual student ID from the application
    const studentId = selectedApplication.studentIdObj?._id || 
                      selectedApplication.studentId || 
                      selectedApplication.studentIdObj;
    
    if (!studentId) {
      console.error('Student ID not found in application:', selectedApplication);
      toast.error('Student information missing for this application. Please contact support.');
      return;
    }

    setInterviewLoading(true);
    try {
      const interviewPayload = {
        applicationId: selectedApplication._id,
        scheduledDate: interviewData.scheduledDate,
        duration: interviewData.duration,
        mode: interviewData.mode,
        meetingLink: interviewData.mode === 'Online' ? interviewData.meetingLink : '',
        location: interviewData.mode === 'In-person' ? {
          address: interviewData.location.address,
          city: interviewData.location.city,
          country: interviewData.location.country
        } : {},
        interviewerName: interviewData.interviewerName || user?.name,
        interviewerEmail: interviewData.interviewerEmail || user?.email,
        notes: interviewData.notes
      };

      console.log('Sending interview payload:', interviewPayload);
      
      const response = await API.post('/interviews', interviewPayload);
      
      if (response.data.success) {
        toast.success('Interview scheduled successfully!');
        setShowInterviewModal(false);
        
        setInterviewData({
          scheduledDate: '',
          duration: 60,
          mode: 'Online',
          meetingLink: '',
          location: { address: '', city: '', country: '' },
          interviewerName: user?.name || '',
          interviewerEmail: user?.email || '',
          notes: ''
        });
        
        await fetchApplications();
        setShowDetailsModal(false);
        setSelectedApplication(null);
      } else {
        toast.error(response.data.message || 'Failed to schedule interview');
      }
    } catch (err) {
      console.error('Error creating interview:', err);
      
      if (err.response) {
        const errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
        toast.error(errorMessage);
      } else if (err.request) {
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else {
        toast.error('Failed to schedule interview: ' + err.message);
      }
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleViewCV = async (studentId) => {
    if (!studentId) {
      toast.error('Student ID not found');
      return;
    }

    setCvLoading(true);
    try {
      console.log('Fetching CV for student ID:', studentId);
      const response = await API.get(`/cv/student/${studentId}`);
      
      if (response.data.success && response.data.cvs && response.data.cvs.length > 0) {
        setSelectedCV(response.data.cvs);
        setShowCVModal(true);
      } else {
        toast.info('No CV found for this applicant');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
      if (error.response?.status === 404) {
        toast.info('No CV uploaded by this applicant');
      } else {
        toast.error('Failed to load CV');
      }
    } finally {
      setCvLoading(false);
    }
  };

  const handleDownloadCV = (cv) => {
    const filePath = cv.filePath || cv.path;
    if (filePath) {
      window.open(`http://localhost:5000/${filePath}`, '_blank');
    } else {
      toast.error('CV file not found');
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FaFileAlt />;
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="ds-file-icon-pdf" />;
    if (ext === 'doc' || ext === 'docx') return <FaFileWord className="ds-file-icon-word" />;
    return <FaFileAlt />;
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    const statusMap = {
      'pending': { class: 'ds-status-pending', icon: <FaClock />, label: 'Pending' },
      'reviewed': { class: 'ds-status-reviewed', icon: <FaEye />, label: 'Reviewed' },
      'shortlisted': { class: 'ds-status-shortlisted', icon: <FaStar />, label: 'Shortlisted' },
      'interview': { class: 'ds-status-interview', icon: <FaCalendarAlt />, label: 'Interview' },
      'accepted': { class: 'ds-status-accepted', icon: <FaCheckCircle />, label: 'Accepted' },
      'rejected': { class: 'ds-status-rejected', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    
    const badge = statusMap[statusLower] || statusMap.pending;
    
    return (
      <span className={`ds-status-badge ${badge.class}`}>
        {badge.icon}
        {badge.label}
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading applications...</h4>
        <p>Please wait while we fetch your applicants</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ds-error-container">
        <div className="ds-error-card">
          <FaExclamationTriangle className="ds-error-icon" />
          <h3>Error Loading Applications</h3>
          <p>{error}</p>
          <div className="ds-error-actions">
            <button className="ds-btn ds-btn-primary" onClick={handleRetry}>
              <FaRedo /> Try Again
            </button>
            <button className="ds-btn ds-btn-outline-secondary" onClick={handleGoToLogin}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-applicants-list">
      <div className="ds-container">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-header-left">
            <div className="ds-header-icon-wrapper">
              <FaUsers className="ds-header-icon" />
            </div>
            <div>
              <h1>Job Applications</h1>
              <p className="ds-header-subtitle">Review and manage all your job applications</p>
            </div>
          </div>
          <div className="ds-header-actions">
            <Link to="/company/interviews" className="ds-btn ds-btn-outline-primary">
              <FaCalendarAlt /> Manage Interviews
            </Link>
            <button className="ds-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              <FaSyncAlt className={refreshing ? 'ds-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {filteredApplications.length > 0 && (
          <div className="ds-stats-grid">
            <div className="ds-stat-card ds-stat-total">
              <div className="ds-stat-icon"><FaUsers /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{stats.total}</span>
                <span className="ds-stat-label">Total</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-pending">
              <div className="ds-stat-icon"><FaClock /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{stats.pending}</span>
                <span className="ds-stat-label">Pending</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-review">
              <div className="ds-stat-icon"><FaEye /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{stats.reviewed}</span>
                <span className="ds-stat-label">Reviewed</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-interview">
              <div className="ds-stat-icon"><FaCalendarAlt /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{stats.interviewed}</span>
                <span className="ds-stat-label">Interview</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="ds-filters-card">
          <div className="ds-filters-content">
            <div className="ds-search-wrapper">
              <div className="ds-search-input-group">
                <FaSearch className="ds-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="ds-filters-row">
              <div className="ds-filter-group">
                <label>Job</label>
                <select name="jobId" value={filters.jobId} onChange={handleFilterChange}>
                  <option value="">All Jobs</option>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
              </div>
              <div className="ds-filter-group">
                <label>Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="ds-filter-group">
                <label>Date Range</label>
                <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
                  <option value="">All Time</option>
                  <option value="today">Last 24 Hours</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              <div className="ds-filter-group">
                <label>Sort By</label>
                <div className="ds-sort-wrapper">
                  <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="job">Job Title</option>
                  </select>
                  <button className="ds-sort-btn" onClick={() => setFilters(prev => ({
                    ...prev,
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                  }))}>
                    {filters.sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                  </button>
                </div>
              </div>
              <button className="ds-clear-filters" onClick={clearFilters}>
                <FaTimes /> Clear
              </button>
            </div>
            <div className="ds-results-info">
              <p>Showing <strong>{filteredApplications.length}</strong> of <strong>{applications.length}</strong> applications</p>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {applications.length === 0 ? (
          <div className="ds-empty-state">
            <div className="ds-empty-icon-wrapper">
              <FaUsers className="ds-empty-icon" />
            </div>
            <h3>No Applications Yet</h3>
            <p>You haven't received any applications yet. Applications will appear here when candidates apply.</p>
            <Link to="/company/post-job" className="ds-btn ds-btn-primary">
              <FaBriefcase /> Post a Job
            </Link>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="ds-empty-state">
            <div className="ds-empty-icon-wrapper">
              <FaSearch className="ds-empty-icon" />
            </div>
            <h3>No Matching Applications</h3>
            <p>No applications match your search criteria.</p>
            <button className="ds-btn ds-btn-outline-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="ds-applications-grid">
            {filteredApplications.map((app) => (
              <div key={app._id} className="ds-application-card">
                <div className="ds-card-header">
                  <div className="ds-applicant-info">
                    <div className="ds-applicant-avatar">
                      <FaUserCircle />
                    </div>
                    <div>
                      <h3>{app.studentName || 'Unknown Applicant'}</h3>
                      <p className="ds-applicant-email">
                        <FaEnvelope /> {app.studentEmail || 'No email'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                <div className="ds-job-details">
                  <h4>
                    <FaBriefcase /> {app.jobId?.title || 'Unknown Position'}
                  </h4>
                  <p className="ds-company-name">
                    <FaBuilding /> {app.jobId?.companyId?.companyName || 'Your Company'}
                  </p>
                </div>

                <div className="ds-application-meta">
                  <span>
                    <FaCalendarAlt /> Applied: {formatDate(app.appliedAt)}
                  </span>
                  {app.jobId?.location?.city && (
                    <span>
                      <FaMapMarkerAlt /> {app.jobId.location.city}
                    </span>
                  )}
                </div>

                {app.coverLetter && (
                  <div className="ds-cover-letter-preview">
                    <FaFileAlt />
                    <p>{app.coverLetter.length > 100 ? `${app.coverLetter.substring(0, 100)}...` : app.coverLetter}</p>
                  </div>
                )}

                <div className="ds-card-actions">
                  <button className="ds-btn ds-btn-outline-primary" onClick={() => handleViewDetails(app)}>
                    <FaEye /> View Details
                  </button>
                  <button className="ds-btn ds-btn-primary" onClick={() => handleScheduleInterview(app)}>
                    <FaCalendarPlus /> Schedule Interview
                  </button>
                  <button className="ds-btn ds-btn-outline-secondary" onClick={() => handleViewCV(app.studentIdObj?._id || app.studentId)} disabled={cvLoading}>
                    {cvLoading ? <FaSpinner className="ds-spin" /> : <FaFileAlt />} CV
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="ds-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <FaUserCircle className="ds-modal-icon" />
              <h3>Application Details</h3>
              <button className="ds-modal-close" onClick={() => setShowDetailsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-details-grid">
                <div className="ds-detail-row">
                  <strong>Applicant Name:</strong>
                  <span>{selectedApplication.studentName || 'Unknown'}</span>
                </div>
                <div className="ds-detail-row">
                  <strong>Email:</strong>
                  <a href={`mailto:${selectedApplication.studentEmail}`}>
                    {selectedApplication.studentEmail}
                  </a>
                </div>
                <div className="ds-detail-row">
                  <strong>Job Title:</strong>
                  <span>{selectedApplication.jobId?.title}</span>
                </div>
                <div className="ds-detail-row">
                  <strong>Applied Date:</strong>
                  <span>{formatDate(selectedApplication.appliedAt)}</span>
                </div>
                <div className="ds-detail-row">
                  <strong>Status:</strong>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                {selectedApplication.coverLetter && (
                  <div className="ds-detail-row ds-full-width">
                    <strong>Cover Letter:</strong>
                    <div className="ds-cover-letter-full">
                      {selectedApplication.coverLetter}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ds-modal-footer">
              <select
                className="ds-form-control ds-status-select"
                value={selectedApplication.status?.toLowerCase() || 'pending'}
                onChange={(e) => handleStatusUpdate(selectedApplication._id, e.target.value)}
                disabled={actionLoading}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="ds-btn ds-btn-primary" onClick={() => {
                setShowDetailsModal(false);
                handleScheduleInterview(selectedApplication);
              }}>
                <FaCalendarPlus /> Schedule Interview
              </button>
              <button className="ds-btn ds-btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && selectedApplication && (
        <div className="ds-modal-overlay" onClick={() => setShowInterviewModal(false)}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-success">
              <FaCalendarPlus className="ds-modal-icon" />
              <h3>Schedule Interview</h3>
              <button className="ds-modal-close" onClick={() => setShowInterviewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-interview-preview">
                <h4>{selectedApplication.studentName || 'Applicant'}</h4>
                <p>{selectedApplication.jobId?.title}</p>
              </div>

              <div className="ds-form-group">
                <label>Date & Time <span className="ds-required">*</span></label>
                <input
                  type="datetime-local"
                  value={interviewData.scheduledDate}
                  onChange={(e) => setInterviewData({...interviewData, scheduledDate: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label>Duration (minutes)</label>
                  <select
                    value={interviewData.duration}
                    onChange={(e) => setInterviewData({...interviewData, duration: parseInt(e.target.value)})}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>
                <div className="ds-form-group">
                  <label>Mode</label>
                  <select
                    value={interviewData.mode}
                    onChange={(e) => setInterviewData({...interviewData, mode: e.target.value})}
                  >
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
              </div>

              {interviewData.mode === 'Online' && (
                <div className="ds-form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={interviewData.meetingLink}
                    onChange={(e) => setInterviewData({...interviewData, meetingLink: e.target.value})}
                  />
                </div>
              )}

              {interviewData.mode === 'In-person' && (
                <div className="ds-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="Address"
                    value={interviewData.location.address}
                    onChange={(e) => setInterviewData({
                      ...interviewData,
                      location: {...interviewData.location, address: e.target.value}
                    })}
                  />
                  <div className="ds-form-row">
                    <input
                      type="text"
                      placeholder="City"
                      value={interviewData.location.city}
                      onChange={(e) => setInterviewData({
                        ...interviewData,
                        location: {...interviewData.location, city: e.target.value}
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={interviewData.location.country}
                      onChange={(e) => setInterviewData({
                        ...interviewData,
                        location: {...interviewData.location, country: e.target.value}
                      })}
                    />
                  </div>
                </div>
              )}

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label>Interviewer Name</label>
                  <input
                    type="text"
                    value={interviewData.interviewerName}
                    onChange={(e) => setInterviewData({...interviewData, interviewerName: e.target.value})}
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div className="ds-form-group">
                  <label>Interviewer Email</label>
                  <input
                    type="email"
                    value={interviewData.interviewerEmail}
                    onChange={(e) => setInterviewData({...interviewData, interviewerEmail: e.target.value})}
                    placeholder="interviewer@company.com"
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label>Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})}
                  placeholder="Add any additional notes or instructions for the candidate..."
                />
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={() => setShowInterviewModal(false)}>
                Cancel
              </button>
              <button className="ds-btn ds-btn-primary" onClick={handleCreateInterview} disabled={interviewLoading}>
                {interviewLoading ? <><FaSpinner className="ds-spin" /> Scheduling...</> : <><FaCalendarPlus /> Schedule Interview</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Modal */}
      {showCVModal && selectedCV && (
        <div className="ds-modal-overlay" onClick={() => setShowCVModal(false)}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-info">
              <FaFileAlt className="ds-modal-icon" />
              <h3>Applicant CV / Resume</h3>
              <button className="ds-modal-close" onClick={() => setShowCVModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              {selectedCV.length > 0 ? (
                <div className="ds-cv-list">
                  {selectedCV.map((cv, index) => (
                    <div key={cv._id || index} className="ds-cv-item">
                      <div className="ds-cv-icon">
                        {getFileIcon(cv.filename || cv.fileName)}
                      </div>
                      <div className="ds-cv-info">
                        <h4>{cv.title || cv.filename || cv.fileName || 'CV Document'}</h4>
                        <div className="ds-cv-meta">
                          <span><FaCalendarAlt /> Uploaded: {formatDate(cv.uploadedAt || cv.createdAt)}</span>
                          <span><FaFileAlt /> {formatFileSize(cv.fileSize)}</span>
                          {cv.isPrimary && <span className="ds-primary-badge">Primary CV</span>}
                        </div>
                      </div>
                      <div className="ds-cv-actions">
                        <button className="ds-btn-icon" onClick={() => handleDownloadCV(cv)} title="View CV">
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ds-empty-state-small">
                  <FaFileAlt className="ds-empty-icon" />
                  <p>No CV found for this applicant</p>
                </div>
              )}
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={() => setShowCVModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantsList;