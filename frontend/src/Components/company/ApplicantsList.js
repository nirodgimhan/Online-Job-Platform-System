import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUsers, 
  FaBriefcase, 
  FaSyncAlt,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserGraduate,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaFileAlt,
  FaStar,
  FaDownload,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes,
  FaExclamationTriangle,
  FaBuilding,
  FaComment,
  FaFilter,
  FaRedo,
  FaFilePdf,
  FaFileWord,
  FaExternalLinkAlt,
  FaSpinner
} from 'react-icons/fa';

const ApplicantsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State management
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiCallCompleted, setApiCallCompleted] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    jobId: searchParams.get('job') || '',
    status: '',
    dateRange: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // Modal states
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interviewed: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0
  });

  // Timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !apiCallCompleted) {
        console.log('⚠️ Loading timeout - forcing error state');
        setError('Loading timeout. Please check if backend is running.');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [loading, apiCallCompleted]);

  // Initial data fetch
  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    if (applications.length > 0) {
      applyFilters();
      calculateStats();
    }
  }, [applications, searchTerm, filters]);

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem('token');
    console.log('🔍 Token check:', token ? 'Present' : 'Missing');

    if (!token) {
      setError('Please login to view applications');
      toast.error('Please login first');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      setApiCallCompleted(true);
      return;
    }

    if (!user) {
      setError('User data not found. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      setApiCallCompleted(true);
      return;
    }

    if (user.role !== 'company') {
      setError('Access denied. Only companies can view applications.');
      setTimeout(() => navigate('/'), 2000);
      setLoading(false);
      setApiCallCompleted(true);
      return;
    }

    await fetchJobs();
  };

  const fetchJobs = async () => {
    try {
      console.log('📡 Fetching company jobs...');
      
      const response = await API.get('/companies/jobs');
      console.log('✅ Jobs response:', response.data);
      
      if (response.data && response.data.success) {
        const jobsData = response.data.jobs || [];
        setJobs(jobsData);
        await fetchApplications();
      } else {
        setError('Failed to load jobs');
        setLoading(false);
        setApiCallCompleted(true);
      }
    } catch (err) {
      console.error('❌ Error fetching jobs:', err);
      handleError(err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching applications...');
      
      const response = await API.get('/applications/company');
      console.log('✅ Applications response:', response.data);
      
      if (response.data && response.data.success) {
        const applicationsData = response.data.applications || [];
        console.log(`📊 Found ${applicationsData.length} applications`);
        setApplications(applicationsData);
        setFilteredApplications(applicationsData);
        
        if (applicationsData.length === 0) {
          toast.info('No applications found');
        } else {
          toast.success(`Found ${applicationsData.length} application(s)`);
        }
      } else {
        setError('Failed to load applications');
      }
    } catch (err) {
      console.error('❌ Error fetching applications:', err);
      handleError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setApiCallCompleted(true);
    }
  };

  const handleError = (err) => {
    if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
    } else if (err.response) {
      if (err.response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response.status === 403) {
        setError('You are not authorized to view applications.');
      } else if (err.response.status === 404) {
        setApplications([]);
        setFilteredApplications([]);
        toast.info('No applications found');
        setError(null);
      } else {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      }
    } else if (err.request) {
      setError('No response from server. Please check if backend is running.');
    } else {
      setError('Error: ' + err.message);
    }
    setLoading(false);
    setApiCallCompleted(true);
  };

  const calculateStats = () => {
    const newStats = {
      total: filteredApplications.length,
      pending: filteredApplications.filter(app => app.status === 'pending').length,
      reviewed: filteredApplications.filter(app => app.status === 'reviewed').length,
      shortlisted: filteredApplications.filter(app => app.status === 'shortlisted').length,
      interviewed: filteredApplications.filter(app => app.status === 'interview').length,
      accepted: filteredApplications.filter(app => app.status === 'accepted').length,
      rejected: filteredApplications.filter(app => app.status === 'rejected').length,
      withdrawn: filteredApplications.filter(app => app.status === 'withdrawn').length
    };
    setStats(newStats);
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.studentId?.userId?.name?.toLowerCase().includes(term) ||
        app.studentId?.userId?.email?.toLowerCase().includes(term) ||
        app.jobId?.title?.toLowerCase().includes(term) ||
        app.jobId?.companyId?.companyName?.toLowerCase().includes(term)
      );
    }

    if (filters.jobId) {
      filtered = filtered.filter(app => app.jobId?._id === filters.jobId);
    }

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
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
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
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
        comparison = (a.studentId?.userId?.name || '').localeCompare(b.studentId?.userId?.name || '');
      } else if (filters.sortBy === 'job') {
        comparison = (a.jobId?.title || '').localeCompare(b.jobId?.title || '');
      } else if (filters.sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
    setApiCallCompleted(false);
    fetchApplications();
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setApiCallCompleted(false);
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

  const handleViewCV = async (studentId) => {
    if (!studentId) {
      toast.error('Student ID not found');
      return;
    }

    setCvLoading(true);
    try {
      // Fetch student's CVs using the student ID
      const response = await API.get(`/cv/student/${studentId}`);
      if (response.data.success && response.data.cvs.length > 0) {
        setSelectedCV(response.data.cvs);
        setShowCVModal(true);
      } else {
        toast.info('No CV found for this applicant');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
      
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this CV');
      } else if (error.response?.status === 404) {
        toast.info('No CV found for this applicant');
      } else {
        toast.error('Failed to load CV. Please try again.');
      }
    } finally {
      setCvLoading(false);
    }
  };

  const handleDownloadCV = (cv) => {
    if (!cv || !cv.filePath) return;
    
    // Open in new tab for viewing
    window.open(`http://localhost:5000/${cv.filePath}`, '_blank');
  };

  const handleDirectDownload = async (cvId, filename) => {
    try {
      const response = await API.get(`/cv/download/${cvId}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('CV download started');
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Failed to download CV');
    }
  };

  const handleContactApplicant = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FaFileAlt />;
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="text-danger" />;
    if (ext === 'doc' || ext === 'docx') return <FaFileWord className="text-primary" />;
    return <FaFileAlt className="text-secondary" />;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { class: 'bg-warning text-dark', icon: <FaClock />, label: 'Pending' },
      'reviewed': { class: 'bg-info text-white', icon: <FaEye />, label: 'Reviewed' },
      'shortlisted': { class: 'bg-primary text-white', icon: <FaStar />, label: 'Shortlisted' },
      'interview': { class: 'bg-success text-white', icon: <FaCalendarAlt />, label: 'Interview' },
      'accepted': { class: 'bg-success text-white', icon: <FaCheckCircle />, label: 'Accepted' },
      'rejected': { class: 'bg-danger text-white', icon: <FaTimesCircle />, label: 'Rejected' },
      'withdrawn': { class: 'bg-secondary text-white', icon: <FaTimesCircle />, label: 'Withdrawn' }
    };
    
    const badge = statusMap[status] || statusMap.pending;
    
    return (
      <span className={`badge ${badge.class} p-2`}>
        <span className="me-1">{badge.icon}</span>
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

  console.log('🔄 Render state:', { 
    loading, 
    error, 
    applicationsCount: applications.length,
    filteredCount: filteredApplications.length,
    apiCallCompleted 
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-4 text-primary">Loading applications...</h5>
          <p className="text-muted">Please wait while we fetch your applicants</p>
          <button 
            className="btn btn-sm btn-outline-secondary mt-3"
            onClick={handleRetry}
          >
            <FaRedo className="me-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-danger shadow">
              <div className="card-header bg-danger text-white">
                <h4 className="mb-0">
                  <FaExclamationTriangle className="me-2" />
                  Error Loading Applications
                </h4>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <FaExclamationTriangle className="text-danger" size={50} />
                </div>
                <p className="text-danger text-center mb-4">{error}</p>
                
                <div className="bg-light p-3 rounded mb-4">
                  <h6>Debug Information:</h6>
                  <ul className="mb-0 small">
                    <li>Token in localStorage: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</li>
                    <li>User in localStorage: {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</li>
                    <li>User role: {user?.role || 'Not available'}</li>
                    <li>Backend URL: http://localhost:5000</li>
                    <li>Backend status: <a href="http://localhost:5000/api/health" target="_blank" rel="noreferrer">Check Health</a></li>
                  </ul>
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <button className="btn btn-primary" onClick={handleRetry}>
                    <FaSyncAlt className="me-2" />
                    Try Again
                  </button>
                  <button className="btn btn-outline-secondary" onClick={handleGoToLogin}>
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaUsers className="me-2 text-primary" />
            Job Applications
          </h2>
          <p className="text-muted mb-0">Review and manage all your job applications</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSyncAlt className={`me-2 ${refreshing ? 'fa-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {filteredApplications.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white h-100">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-1">Total</h6>
                  <h3 className="mb-0">{stats.total}</h3>
                </div>
                <FaUsers size={30} className="text-white-50" />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark h-100">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-dark-50 mb-1">Pending</h6>
                  <h3 className="mb-0">{stats.pending}</h3>
                </div>
                <FaClock size={30} className="text-dark-50" />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white h-100">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-1">Reviewed</h6>
                  <h3 className="mb-0">{stats.reviewed}</h3>
                </div>
                <FaEye size={30} className="text-white-50" />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white h-100">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-1">Interview</h6>
                  <h3 className="mb-0">{stats.interviewed}</h3>
                </div>
                <FaCalendarAlt size={30} className="text-white-50" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch className="text-primary" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search applicants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="jobId"
                value={filters.jobId}
                onChange={handleFilterChange}
              >
                <option value="">All Jobs</option>
                {jobs.map(job => (
                  <option key={job._id} value={job._id}>
                    {job.title} ({job.applicantsCount || 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
              >
                <option value="">All Time</option>
                <option value="today">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
              </select>
            </div>
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="job">Sort by Job</option>
                  <option value="status">Sort by Status</option>
                </select>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                  }))}
                >
                  {filters.sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={clearFilters}
                  title="Clear Filters"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3">
            <p className="text-muted mb-0">
              Showing <strong>{filteredApplications.length}</strong> of <strong>{applications.length}</strong> applications
            </p>
          </div>
        </div>
      </div>

      {/* Applications Display */}
      {applications.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <FaUsers className="text-muted mb-3" size={50} />
            <h4 className="mb-3">No Applications Yet</h4>
            <p className="text-muted mb-4">
              You haven't received any applications yet. Applications will appear here when candidates apply to your jobs.
            </p>
            <Link to="/company/post-job" className="btn btn-primary">
              <FaBriefcase className="me-2" />
              Post a Job
            </Link>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <FaSearch className="text-muted mb-3" size={50} />
            <h4 className="mb-3">No Matching Applications</h4>
            <p className="text-muted mb-4">No applications match your search criteria.</p>
            <button 
              className="btn btn-outline-primary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {filteredApplications.map((app) => (
            <div key={app._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm hover-shadow">
                <div className="card-body">
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex">
                      <div className="applicant-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{ width: '50px', height: '50px' }}>
                        <FaUserGraduate className="text-primary" size={25} />
                      </div>
                      <div>
                        <h6 className="mb-1">{app.studentId?.userId?.name || 'Unknown Applicant'}</h6>
                        <small className="text-muted">
                          <FaEnvelope className="me-1" size={10} />
                          {app.studentId?.userId?.email || 'No email'}
                        </small>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  {/* Job Details */}
                  <div className="bg-light p-3 rounded mb-3">
                    <h6 className="mb-2">
                      <FaBriefcase className="me-2 text-primary" />
                      {app.jobId?.title || 'Unknown Position'}
                    </h6>
                    <p className="small text-muted mb-0">
                      <FaBuilding className="me-1" />
                      {app.jobId?.companyId?.companyName || 'Your Company'}
                    </p>
                  </div>

                  {/* Application Details */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <small className="text-muted">
                        <FaCalendarAlt className="me-1" />
                        Applied: {formatDate(app.appliedAt)}
                      </small>
                      {app.jobId?.location?.city && (
                        <small className="text-muted">
                          <FaMapMarkerAlt className="me-1" />
                          {app.jobId.location.city}
                        </small>
                      )}
                    </div>

                    {/* Cover Letter Preview */}
                    {app.coverLetter && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <small className="text-muted d-block mb-1">
                          <FaFileAlt className="me-1 text-primary" />
                          Cover Letter:
                        </small>
                        <p className="small mb-0">
                          {app.coverLetter.length > 100 
                            ? `${app.coverLetter.substring(0, 100)}...` 
                            : app.coverLetter}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-grow-1"
                      onClick={() => handleViewDetails(app)}
                    >
                      <FaEye className="me-1" /> Details
                    </button>
                    
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleViewCV(app.studentId?._id)}
                      disabled={cvLoading}
                      title="View CV"
                    >
                      {cvLoading ? <FaSpinner className="fa-spin" /> : <FaFileAlt />}
                    </button>
                    
                    <select
                      className="form-select form-select-sm w-auto"
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                      disabled={actionLoading}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-2 d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary flex-grow-1"
                      onClick={() => handleContactApplicant(app.studentId?.userId?.email)}
                    >
                      <FaEnvelope className="me-1" /> Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaEye className="me-2" />
                  Application Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedApplication(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Applicant Info */}
                  <div className="col-md-4 text-center mb-3">
                    <div className="applicant-avatar-large bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                         style={{ width: '100px', height: '100px' }}>
                      <FaUserGraduate className="text-primary" size={50} />
                    </div>
                    <h5 className="mb-1">{selectedApplication.studentId?.userId?.name}</h5>
                    {getStatusBadge(selectedApplication.status)}
                    
                    {/* CV Button in Modal */}
                    <button
                      className="btn btn-outline-primary btn-sm mt-2 w-100"
                      onClick={() => handleViewCV(selectedApplication.studentId?._id)}
                    >
                      <FaFileAlt className="me-2" />
                      View CV
                    </button>
                  </div>

                  <div className="col-md-8">
                    <h6 className="mb-3">Contact Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th style={{ width: '120px' }}>Email:</th>
                          <td>
                            <a href={`mailto:${selectedApplication.studentId?.userId?.email}`}>
                              {selectedApplication.studentId?.userId?.email}
                            </a>
                          </td>
                        </tr>
                        {selectedApplication.studentId?.userId?.phoneNumber && (
                          <tr>
                            <th>Phone:</th>
                            <td>
                              <a href={`tel:${selectedApplication.studentId?.userId?.phoneNumber}`}>
                                {selectedApplication.studentId?.userId?.phoneNumber}
                              </a>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <th>Applied For:</th>
                          <td>{selectedApplication.jobId?.title}</td>
                        </tr>
                        <tr>
                          <th>Applied Date:</th>
                          <td>{formatDate(selectedApplication.appliedAt)}</td>
                        </tr>
                        <tr>
                          <th>Last Updated:</th>
                          <td>{formatDate(selectedApplication.updatedAt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div className="mt-3">
                    <h6 className="mb-2">
                      <FaFileAlt className="me-2 text-primary" />
                      Cover Letter
                    </h6>
                    <div className="bg-light p-3 rounded">
                      <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Interview Details */}
                {selectedApplication.interviewDate && (
                  <div className="mt-3">
                    <h6 className="mb-2">
                      <FaCalendarAlt className="me-2 text-success" />
                      Interview Details
                    </h6>
                    <div className="bg-light p-3 rounded">
                      <p className="mb-1">
                        <strong>Date:</strong> {formatDate(selectedApplication.interviewDate)}
                      </p>
                      {selectedApplication.interviewFeedback && (
                        <p className="mb-0">
                          <strong>Feedback:</strong> {selectedApplication.interviewFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <select
                  className="form-select w-auto me-auto"
                  value={selectedApplication.status}
                  onChange={(e) => handleStatusUpdate(selectedApplication._id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedApplication(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CV Modal */}
      {showCVModal && selectedCV && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <FaFileAlt className="me-2" />
                  Applicant CV / Resume
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowCVModal(false);
                    setSelectedCV(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {selectedCV.length > 0 ? (
                  <div className="cv-list">
                    {selectedCV.map((cv, index) => (
                      <div key={cv._id || index} className="cv-item p-3 mb-3 border rounded">
                        <div className="d-flex align-items-center">
                          <div className="cv-icon me-3">
                            {getFileIcon(cv.filename)}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{cv.title || cv.filename || 'CV Document'}</h6>
                            <div className="d-flex flex-wrap gap-3 mb-1">
                              <small className="text-muted">
                                <FaCalendarAlt className="me-1" size={12} />
                                Uploaded: {formatDate(cv.uploadedAt || cv.createdAt)}
                              </small>
                              <small className="text-muted">
                                <FaFileAlt className="me-1" size={12} />
                                {formatFileSize(cv.fileSize)}
                              </small>
                              {cv.isPrimary && (
                                <span className="badge bg-success">Primary CV</span>
                              )}
                            </div>
                            
                            {/* AI Analysis Summary */}
                            {cv.aiAnalysis && (
                              <div className="mt-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge bg-info">ATS Score: {cv.aiAnalysis.atsCompatibility || cv.aiAnalysis.overallScore}%</span>
                                  {cv.aiAnalysis.skillsScore && (
                                    <span className="badge bg-secondary">Skills: {cv.aiAnalysis.skillsScore}%</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="cv-actions">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => window.open(`http://localhost:5000/${cv.filePath}`, '_blank')}
                              title="View CV"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleDirectDownload(cv._id, cv.filename)}
                              title="Download CV"
                            >
                              <FaDownload />
                            </button>
                          </div>
                        </div>
                        
                        {/* Parsed Content Preview */}
                        {cv.parsedContent && (
                          <div className="mt-2 pt-2 border-top">
                            <div className="row">
                              {cv.parsedContent.skills && cv.parsedContent.skills.length > 0 && (
                                <div className="col-12 mb-2">
                                  <small className="text-muted d-block mb-1">Skills:</small>
                                  <div className="d-flex flex-wrap gap-1">
                                    {cv.parsedContent.skills.slice(0, 5).map((skill, i) => (
                                      <span key={i} className="badge bg-light text-dark">{skill}</span>
                                    ))}
                                    {cv.parsedContent.skills.length > 5 && (
                                      <span className="badge bg-light text-dark">+{cv.parsedContent.skills.length - 5} more</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FaFileAlt className="text-muted mb-3" size={40} />
                    <p className="text-muted">No CV found for this applicant</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCVModal(false);
                    setSelectedCV(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantsList;