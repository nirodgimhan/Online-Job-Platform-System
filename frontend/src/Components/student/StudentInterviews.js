import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, FaClock, FaVideo, FaMapMarkerAlt, FaPhone,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle,
  FaBuilding, FaUser, FaEnvelope, FaExternalLinkAlt, FaInfoCircle, FaTimes,
  FaStar, FaRegStar, FaArrowRight, FaSyncAlt, FaFilter, FaSearch,
  FaFileAlt, FaDownload, FaComment, FaStarHalfAlt, FaRegClock,
  FaRegCheckCircle, FaRegTimesCircle, FaCalendarCheck, FaUsers,
  FaBug, FaDatabase, FaTrash, FaEdit, FaPlus
} from 'react-icons/fa';

const StudentInterviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    checkAuthAndFetchInterviews();
  }, []);

  const checkAuthAndFetchInterviews = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (!user) {
      toast.error('User data not found. Please login again.');
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      toast.error('Access denied. Only students can view interviews.');
      navigate('/');
      return;
    }

    await fetchInterviews();
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      console.log('Fetching interviews for student:', user?.id);
      console.log('User object:', user);
      
      const response = await API.get('/interviews');
      
      console.log('Interviews response:', response.data);
      console.log('Response status:', response.status);
      
      setDebugInfo({
        user: user,
        responseStatus: response.status,
        responseData: response.data,
        interviewsCount: response.data.interviews?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      if (response.data.success) {
        const interviewsData = response.data.interviews || [];
        
        if (interviewsData.length === 0) {
          console.log('No interviews found for student');
        } else {
          console.log(`Found ${interviewsData.length} interviews`);
        }
        
        const processedInterviews = interviewsData.map(interview => {
          const scheduledDate = new Date(interview.scheduledDate);
          const now = new Date();
          
          return {
            ...interview,
            id: interview._id,
            jobTitle: interview.jobId?.title || 'Position Not Available',
            companyName: interview.companyId?.companyName || interview.companyId?.name || 'Company',
            companyLogo: interview.companyId?.companyLogo || null,
            scheduledDateObj: scheduledDate,
            scheduledDateFormatted: formatDate(interview.scheduledDate),
            scheduledDateRelative: getRelativeTime(interview.scheduledDate),
            isUpcoming: scheduledDate > now,
            isPast: scheduledDate <= now,
            canConfirm: interview.status === 'scheduled' && scheduledDate > now,
            canCancel: ['scheduled', 'confirmed'].includes(interview.status) && scheduledDate > now,
            canJoin: interview.status === 'confirmed' && interview.meetingLink && scheduledDate > now,
            statusText: getStatusText(interview.status),
            statusIcon: getStatusIcon(interview.status),
            statusColor: getStatusColor(interview.status),
            modeIcon: getModeIcon(interview.mode),
            modeText: interview.mode || 'Online',
            durationText: interview.duration ? `${interview.duration} minutes` : '60 minutes',
            hasFeedback: interview.feedback && Object.keys(interview.feedback).length > 0,
            feedbackRating: interview.feedback?.rating || 0,
            feedbackComments: interview.feedback?.comments || '',
            feedbackRecommendation: interview.feedback?.recommendation || '',
            feedbackStrengths: interview.feedback?.strengths || [],
            feedbackWeaknesses: interview.feedback?.weaknesses || []
          };
        });
        
        setInterviews(processedInterviews);
        
        if (processedInterviews.length > 0) {
          toast.success(`Found ${processedInterviews.length} interview(s)`);
        } else {
          toast.info('No interviews found. Interviews will appear here when scheduled.');
        }
      } else {
        console.error('API returned success: false', response.data);
        setError(response.data.message || 'Failed to load interviews');
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        request: err.request
      });
      
      setDebugInfo({
        user: user,
        error: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        timestamp: new Date().toISOString()
      });
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view interviews.');
      } else if (err.response?.status === 404) {
        setError('Interviews endpoint not found. Please check API configuration.');
      } else if (err.request) {
        setError('No response from server. Please check if backend is running.');
      } else {
        setError('Error: ' + err.message);
      }
      
      toast.error('Failed to load interviews. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createTestInterview = async () => {
    try {
      toast.info('Creating test interview...');
      
      const applicationsResponse = await API.get('/applications/student');
      
      if (!applicationsResponse.data.success || applicationsResponse.data.applications.length === 0) {
        toast.error('Please apply to a job first before creating a test interview');
        return;
      }
      
      const application = applicationsResponse.data.applications[0];
      
      if (!application._id) {
        toast.error('Invalid application ID');
        return;
      }
      
      const testInterviewData = {
        applicationId: application._id,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        mode: 'Online',
        meetingLink: 'https://meet.google.com/test-interview',
        interviewerName: 'Test Interviewer',
        interviewerEmail: 'test@company.com',
        notes: 'This is a test interview created for debugging purposes.'
      };
      
      console.log('Creating test interview:', testInterviewData);
      
      const response = await API.post('/interviews', testInterviewData);
      
      if (response.data.success) {
        toast.success('Test interview created successfully!');
        await fetchInterviews();
      } else {
        toast.error(response.data.message || 'Failed to create test interview');
      }
    } catch (err) {
      console.error('Error creating test interview:', err);
      toast.error('Failed to create test interview: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirm = async (interviewId) => {
    if (!interviewId) {
      toast.error('Invalid interview ID');
      return;
    }

    setConfirming(true);
    try {
      console.log('Confirming interview:', interviewId);
      
      const response = await API.put(`/interviews/${interviewId}/confirm`);
      
      if (response.data.success) {
        toast.success('Interview confirmed successfully!');
        await fetchInterviews();
        setShowDetailsModal(false);
      } else {
        toast.error(response.data.message || 'Failed to confirm interview');
      }
    } catch (err) {
      console.error('Error confirming interview:', err);
      
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.status === 400) {
        toast.error('Cannot confirm this interview. It may have already passed or been cancelled.');
      } else {
        toast.error('Failed to confirm interview. Please try again.');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    
    if (!selectedInterview?.id) {
      toast.error('Invalid interview selection');
      return;
    }

    setCancelling(true);
    try {
      console.log('Cancelling interview:', selectedInterview.id, 'Reason:', cancelReason);
      
      const response = await API.delete(`/interviews/${selectedInterview.id}`, {
        data: { reason: cancelReason }
      });
      
      if (response.data.success) {
        toast.success('Interview cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedInterview(null);
        await fetchInterviews();
      } else {
        toast.error(response.data.message || 'Failed to cancel interview');
      }
    } catch (err) {
      console.error('Error cancelling interview:', err);
      
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.status === 400) {
        toast.error('Cannot cancel this interview. It may have already passed or been completed.');
      } else {
        toast.error('Failed to cancel interview. Please try again.');
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleViewDetails = (interview) => {
    setSelectedInterview(interview);
    setShowDetailsModal(true);
  };

  const handleViewFeedback = (interview) => {
    setSelectedInterview(interview);
    setShowFeedbackModal(true);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'Scheduled',
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'Scheduled';
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || 'scheduled';
    switch(statusLower) {
      case 'scheduled': return <FaRegClock />;
      case 'confirmed': return <FaRegCheckCircle />;
      case 'completed': return <FaCheckCircle />;
      case 'cancelled': return <FaRegTimesCircle />;
      default: return <FaRegClock />;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'scheduled';
    switch(statusLower) {
      case 'scheduled': return '#ff9800';
      case 'confirmed': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getModeIcon = (mode) => {
    switch(mode) {
      case 'Online': return <FaVideo />;
      case 'In-person': return <FaMapMarkerAlt />;
      case 'Phone': return <FaPhone />;
      default: return <FaVideo />;
    }
  };

  const getModeClass = (mode) => {
    switch(mode) {
      case 'Online': return 'ds-mode-online';
      case 'In-person': return 'ds-mode-inperson';
      case 'Phone': return 'ds-mode-phone';
      default: return 'ds-mode-online';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date - now;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMs < 0) return 'Passed';
      if (diffMins < 60) return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
      if (diffHours < 24) return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } catch (e) {
      return '';
    }
  };

  const getFilteredInterviews = () => {
    let filtered = [...interviews];
    
    if (selectedTab === 'upcoming') {
      filtered = filtered.filter(i => i.isUpcoming && i.status !== 'cancelled');
    } else if (selectedTab === 'past') {
      filtered = filtered.filter(i => i.isPast || i.status === 'completed' || i.status === 'cancelled');
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status?.toLowerCase() === filterStatus.toLowerCase());
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.jobTitle?.toLowerCase().includes(term) || 
        i.companyName?.toLowerCase().includes(term) ||
        i.interviewerName?.toLowerCase().includes(term)
      );
    }
    
    if (sortBy === 'date') {
      filtered.sort((a, b) => a.scheduledDateObj - b.scheduledDateObj);
    } else if (sortBy === 'date-desc') {
      filtered.sort((a, b) => b.scheduledDateObj - a.scheduledDateObj);
    } else if (sortBy === 'company') {
      filtered.sort((a, b) => a.companyName.localeCompare(b.companyName));
    }
    
    return filtered;
  };

  const filteredInterviews = getFilteredInterviews();
  const totalInterviews = interviews.length;
  const upcomingInterviews = interviews.filter(i => i.isUpcoming && i.status !== 'cancelled').length;
  const completedInterviews = interviews.filter(i => i.status === 'completed').length;
  const confirmedInterviews = interviews.filter(i => i.status === 'confirmed' && i.isUpcoming).length;
  const scheduledInterviews = interviews.filter(i => i.status === 'scheduled' && i.isUpcoming).length;

  const handleRetry = () => {
    fetchInterviews();
  };

  const handleRefresh = () => {
    fetchInterviews();
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSearchTerm('');
    setSortBy('date');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="ds-star-filled" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} className="ds-star-half" />);
      } else {
        stars.push(<FaRegStar key={i} className="ds-star-empty" />);
      }
    }
    return stars;
  };

  if (loading && !refreshing) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading your interviews...</h4>
        <p>Please wait while we fetch your interview schedule</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ds-error-container">
        <div className="ds-error-card">
          <FaExclamationTriangle className="ds-error-icon" />
          <h3>Error Loading Interviews</h3>
          <p>{error}</p>
          <div className="ds-error-actions">
            <button className="ds-btn ds-btn-primary" onClick={handleRetry}>
              <FaSyncAlt /> Try Again
            </button>
            <button className="ds-btn ds-btn-outline-secondary" onClick={() => navigate('/student/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-student-interviews">
      <div className="ds-container">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-header-left">
            <div className="ds-header-icon-wrapper">
              <FaCalendarAlt className="ds-header-icon" />
            </div>
            <div>
              <h1>My Interviews</h1>
              <p className="ds-header-subtitle">
                Manage and track all your scheduled interviews
              </p>
            </div>
          </div>
          <div className="ds-header-actions">
            <button 
              className="ds-refresh-btn" 
              onClick={handleRefresh} 
              disabled={refreshing}
            >
              <FaSyncAlt className={refreshing ? 'ds-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              className="ds-btn ds-btn-outline-primary"
              onClick={() => setShowDebug(!showDebug)}
              style={{ marginLeft: '10px' }}
            >
              <FaBug /> {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
          </div>
        </div>

        {/* Debug Info Panel */}
        {showDebug && (
          <div className="ds-debug-panel" style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '12px',
            fontFamily: 'monospace',
            overflow: 'auto'
          }}>
            <details open>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#4ec9b0' }}>
                <FaDatabase /> Debug Information
              </summary>
              <div style={{ marginTop: '10px' }}>
                <p><strong style={{ color: '#569cd6' }}>User ID:</strong> {user?.id}</p>
                <p><strong style={{ color: '#569cd6' }}>User Role:</strong> {user?.role}</p>
                <p><strong style={{ color: '#569cd6' }}>Total Interviews:</strong> {interviews.length}</p>
                <p><strong style={{ color: '#569cd6' }}>API Response:</strong></p>
                <pre style={{ background: '#2d2d2d', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Statistics Cards */}
        {interviews.length > 0 && (
          <div className="ds-stats-grid">
            <div className="ds-stat-card ds-stat-total">
              <div className="ds-stat-icon"><FaCalendarAlt /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{totalInterviews}</span>
                <span className="ds-stat-label">Total Interviews</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-upcoming">
              <div className="ds-stat-icon"><FaClock /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{upcomingInterviews}</span>
                <span className="ds-stat-label">Upcoming</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-confirmed">
              <div className="ds-stat-icon"><FaCheckCircle /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{confirmedInterviews}</span>
                <span className="ds-stat-label">Confirmed</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-completed">
              <div className="ds-stat-icon"><FaStar /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{completedInterviews}</span>
                <span className="ds-stat-label">Completed</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {interviews.length > 0 && (
          <div className="ds-tabs">
            <button 
              className={`ds-tab ${selectedTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setSelectedTab('upcoming')}
            >
              <FaClock /> Upcoming Interviews
              {scheduledInterviews > 0 && <span className="ds-badge">{scheduledInterviews}</span>}
            </button>
            <button 
              className={`ds-tab ${selectedTab === 'past' ? 'active' : ''}`}
              onClick={() => setSelectedTab('past')}
            >
              <FaCalendarCheck /> Past Interviews
            </button>
          </div>
        )}

        {/* Filters Bar */}
        {interviews.length > 0 && (
          <div className="ds-filters-card">
            <div className="ds-filters-content">
              <div className="ds-search-wrapper">
                <div className="ds-search-input-group">
                  <FaSearch className="ds-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by job title or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="ds-filters-row">
                <div className="ds-filter-group">
                  <label>Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="ds-filter-group">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date">Date (Earliest First)</option>
                    <option value="date-desc">Date (Latest First)</option>
                    <option value="company">Company Name</option>
                  </select>
                </div>
                <button className="ds-clear-filters" onClick={handleClearFilters}>
                  <FaFilter /> Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {interviews.length > 0 && (
          <div className="ds-results-info">
            <p>Showing <strong>{filteredInterviews.length}</strong> of <strong>{interviews.length}</strong> interviews</p>
          </div>
        )}

        {/* Main Content - Interviews Grid */}
        {interviews.length === 0 ? (
          <div className="ds-empty-state">
            <div className="ds-empty-icon-wrapper">
              <FaCalendarAlt className="ds-empty-icon" />
            </div>
            <h3>No Interviews Yet</h3>
            <p>You haven't been scheduled for any interviews yet.</p>
            <div className="ds-empty-actions">
              <Link to="/student/jobs" className="ds-btn ds-btn-primary">
                <FaSearch /> Browse Jobs
              </Link>
              <button 
                className="ds-btn ds-btn-outline-primary"
                onClick={createTestInterview}
                style={{ marginLeft: '10px' }}
              >
                <FaPlus /> Create Test Interview
              </button>
            </div>
            <div className="ds-empty-help" style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px' }}>💡 How to get interviews?</h4>
              <ul style={{ textAlign: 'left', marginBottom: 0 }}>
                <li>1. Apply to jobs that match your skills</li>
                <li>2. Keep your profile updated with latest experience</li>
                <li>3. Companies will review your application</li>
                <li>4. If shortlisted, they'll schedule an interview</li>
                <li>5. You'll see all scheduled interviews here</li>
              </ul>
            </div>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="ds-empty-filters">
            <FaFilter className="ds-empty-icon" />
            <h4>No interviews match your filters</h4>
            <p>Try adjusting your filters to see more results.</p>
            <button className="ds-btn ds-btn-outline-primary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="ds-interviews-grid">
            {filteredInterviews.map(interview => (
              <div key={interview.id} className="ds-interview-card">
                {/* Card Header */}
                <div className="ds-card-header">
                  <div className="ds-company-info">
                    <div className="ds-company-logo">
                      {interview.companyLogo ? (
                        <img src={interview.companyLogo} alt={interview.companyName} />
                      ) : (
                        <div className="ds-logo-placeholder">
                          <FaBuilding />
                        </div>
                      )}
                    </div>
                    <div className="ds-company-details">
                      <h3>{interview.jobTitle}</h3>
                      <p>{interview.companyName}</p>
                      {interview.interviewerName && (
                        <span className="ds-interviewer-name">
                          <FaUser /> {interview.interviewerName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div 
                    className="ds-status-badge" 
                    style={{ backgroundColor: interview.statusColor }}
                  >
                    {interview.statusIcon}
                    {interview.statusText}
                  </div>
                </div>

                {/* Card Body */}
                <div className="ds-card-body">
                  {/* Date and Time */}
                  <div className="ds-interview-datetime">
                    <div className="ds-datetime-icon">
                      <FaCalendarAlt />
                    </div>
                    <div className="ds-datetime-info">
                      <div className="ds-date">{interview.scheduledDateFormatted}</div>
                      {interview.isUpcoming && interview.status !== 'cancelled' && (
                        <div className="ds-relative-time">{interview.scheduledDateRelative}</div>
                      )}
                    </div>
                  </div>

                  {/* Interview Details Grid */}
                  <div className="ds-details-grid">
                    <div className="ds-detail-item">
                      <div className="ds-detail-icon">{interview.modeIcon}</div>
                      <div className="ds-detail-content">
                        <span className="ds-detail-label">Mode</span>
                        <strong className={getModeClass(interview.mode)}>
                          {interview.modeText}
                        </strong>
                      </div>
                    </div>
                    
                    <div className="ds-detail-item">
                      <div className="ds-detail-icon"><FaClock /></div>
                      <div className="ds-detail-content">
                        <span className="ds-detail-label">Duration</span>
                        <strong>{interview.durationText}</strong>
                      </div>
                    </div>

                    {interview.interviewerEmail && (
                      <div className="ds-detail-item">
                        <div className="ds-detail-icon"><FaEnvelope /></div>
                        <div className="ds-detail-content">
                          <span className="ds-detail-label">Contact</span>
                          <a href={`mailto:${interview.interviewerEmail}`}>
                            {interview.interviewerEmail}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meeting Link */}
                  {interview.meetingLink && interview.status !== 'cancelled' && (
                    <div className="ds-meeting-link">
                      <FaVideo />
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Meeting <FaExternalLinkAlt />
                      </a>
                    </div>
                  )}

                  {/* Notes */}
                  {interview.notes && (
                    <div className="ds-notes">
                      <FaInfoCircle />
                      <div className="ds-notes-content">
                        <span className="ds-notes-label">Additional Notes</span>
                        <p>{interview.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Feedback Preview */}
                  {interview.hasFeedback && interview.status === 'completed' && (
                    <div className="ds-feedback-preview" onClick={() => handleViewFeedback(interview)}>
                      <div className="ds-feedback-header">
                        <FaComment />
                        <span>Interview Feedback</span>
                      </div>
                      <div className="ds-feedback-rating-preview">
                        {renderStars(interview.feedbackRating)}
                        <span className="ds-rating-value">{interview.feedbackRating}/5</span>
                      </div>
                      {interview.feedbackComments && (
                        <p className="ds-feedback-preview-text">
                          {interview.feedbackComments.length > 100 
                            ? `${interview.feedbackComments.substring(0, 100)}...` 
                            : interview.feedbackComments}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="ds-card-footer">
                  <button 
                    className="ds-btn ds-btn-outline-primary"
                    onClick={() => handleViewDetails(interview)}
                  >
                    <FaInfoCircle /> View Details
                  </button>
                  
                  {interview.canConfirm && (
                    <button 
                      className="ds-btn ds-btn-success" 
                      onClick={() => handleConfirm(interview.id)}
                      disabled={confirming}
                    >
                      {confirming ? <FaSpinner className="ds-spin" /> : <FaCheckCircle />}
                      Confirm
                    </button>
                  )}
                  
                  {interview.canCancel && (
                    <button 
                      className="ds-btn ds-btn-danger" 
                      onClick={() => { 
                        setSelectedInterview(interview); 
                        setShowCancelModal(true); 
                      }}
                    >
                      <FaTimesCircle /> Cancel
                    </button>
                  )}
                  
                  {interview.canJoin && (
                    <a 
                      href={interview.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ds-btn ds-btn-primary"
                    >
                      <FaVideo /> Join Now
                    </a>
                  )}
                  
                  {interview.hasFeedback && interview.status === 'completed' && (
                    <button 
                      className="ds-btn ds-btn-info"
                      onClick={() => handleViewFeedback(interview)}
                    >
                      <FaComment /> View Feedback
                    </button>
                  )}
                  
                  <button 
                    className="ds-btn ds-btn-link" 
                    onClick={() => navigate(`/student/job/${interview.jobId?._id}`)}
                  >
                    Job Details <FaArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Details Modal */}
      {showDetailsModal && selectedInterview && (
        <div className="ds-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <FaInfoCircle className="ds-modal-icon" />
              <h3>Interview Details</h3>
              <button className="ds-modal-close" onClick={() => setShowDetailsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-details-container">
                <div className="ds-details-section">
                  <h4>Job Information</h4>
                  <div className="ds-detail-row">
                    <strong>Position:</strong>
                    <span>{selectedInterview.jobTitle}</span>
                  </div>
                  <div className="ds-detail-row">
                    <strong>Company:</strong>
                    <span>{selectedInterview.companyName}</span>
                  </div>
                </div>

                <div className="ds-details-section">
                  <h4>Interview Information</h4>
                  <div className="ds-detail-row">
                    <strong>Date & Time:</strong>
                    <span>{selectedInterview.scheduledDateFormatted}</span>
                  </div>
                  <div className="ds-detail-row">
                    <strong>Duration:</strong>
                    <span>{selectedInterview.durationText}</span>
                  </div>
                  <div className="ds-detail-row">
                    <strong>Mode:</strong>
                    <span className={getModeClass(selectedInterview.mode)}>
                      {selectedInterview.modeText}
                    </span>
                  </div>
                  <div className="ds-detail-row">
                    <strong>Status:</strong>
                    <span style={{ color: selectedInterview.statusColor }}>
                      {selectedInterview.statusIcon} {selectedInterview.statusText}
                    </span>
                  </div>
                </div>

                {(selectedInterview.interviewerName || selectedInterview.interviewerEmail) && (
                  <div className="ds-details-section">
                    <h4>Interviewer Details</h4>
                    {selectedInterview.interviewerName && (
                      <div className="ds-detail-row">
                        <strong>Name:</strong>
                        <span>{selectedInterview.interviewerName}</span>
                      </div>
                    )}
                    {selectedInterview.interviewerEmail && (
                      <div className="ds-detail-row">
                        <strong>Email:</strong>
                        <a href={`mailto:${selectedInterview.interviewerEmail}`}>
                          {selectedInterview.interviewerEmail}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {selectedInterview.meetingLink && (
                  <div className="ds-details-section">
                    <h4>Meeting Details</h4>
                    <div className="ds-detail-row">
                      <strong>Meeting Link:</strong>
                      <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer">
                        {selectedInterview.meetingLink} <FaExternalLinkAlt />
                      </a>
                    </div>
                  </div>
                )}

                {selectedInterview.location?.address && (
                  <div className="ds-details-section">
                    <h4>Location</h4>
                    <div className="ds-detail-row">
                      <strong>Address:</strong>
                      <span>
                        {selectedInterview.location.address}
                        {selectedInterview.location.city && `, ${selectedInterview.location.city}`}
                        {selectedInterview.location.country && `, ${selectedInterview.location.country}`}
                      </span>
                    </div>
                  </div>
                )}

                {selectedInterview.notes && (
                  <div className="ds-details-section">
                    <h4>Additional Notes</h4>
                    <div className="ds-notes-full">
                      <p>{selectedInterview.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ds-modal-footer">
              {selectedInterview.canConfirm && (
                <button 
                  className="ds-btn ds-btn-success" 
                  onClick={() => handleConfirm(selectedInterview.id)}
                  disabled={confirming}
                >
                  {confirming ? <FaSpinner className="ds-spin" /> : <FaCheckCircle />}
                  Confirm Interview
                </button>
              )}
              {selectedInterview.canCancel && (
                <button 
                  className="ds-btn ds-btn-danger" 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowCancelModal(true);
                  }}
                >
                  <FaTimesCircle /> Cancel Interview
                </button>
              )}
              <button className="ds-btn ds-btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedInterview && selectedInterview.hasFeedback && (
        <div className="ds-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-success">
              <FaComment className="ds-modal-icon" />
              <h3>Interview Feedback</h3>
              <button className="ds-modal-close" onClick={() => setShowFeedbackModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-feedback-full">
                <div className="ds-feedback-header">
                  <h4>{selectedInterview.jobTitle}</h4>
                  <p>{selectedInterview.companyName}</p>
                </div>

                <div className="ds-feedback-rating-section">
                  <label>Overall Rating</label>
                  <div className="ds-rating-large">
                    {renderStars(selectedInterview.feedbackRating)}
                    <span className="ds-rating-value-large">{selectedInterview.feedbackRating}/5</span>
                  </div>
                </div>

                {selectedInterview.feedbackComments && (
                  <div className="ds-feedback-comments-section">
                    <label>Comments</label>
                    <div className="ds-feedback-comments-box">
                      <p>{selectedInterview.feedbackComments}</p>
                    </div>
                  </div>
                )}

                {selectedInterview.feedbackStrengths && selectedInterview.feedbackStrengths.length > 0 && (
                  <div className="ds-feedback-strengths-section">
                    <label>Strengths</label>
                    <ul className="ds-strengths-list">
                      {selectedInterview.feedbackStrengths.map((strength, idx) => (
                        <li key={idx}>
                          <FaCheckCircle className="ds-check-icon" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedInterview.feedbackWeaknesses && selectedInterview.feedbackWeaknesses.length > 0 && (
                  <div className="ds-feedback-weaknesses-section">
                    <label>Areas for Improvement</label>
                    <ul className="ds-weaknesses-list">
                      {selectedInterview.feedbackWeaknesses.map((weakness, idx) => (
                        <li key={idx}>
                          <FaTimesCircle className="ds-times-icon" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedInterview.feedbackRecommendation && (
                  <div className={`ds-feedback-recommendation ds-${selectedInterview.feedbackRecommendation.toLowerCase()}`}>
                    <label>Recommendation</label>
                    <div className="ds-recommendation-box">
                      <strong>{selectedInterview.feedbackRecommendation}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedInterview && (
        <div className="ds-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-danger">
              <FaTimesCircle className="ds-modal-icon" />
              <h3>Cancel Interview</h3>
              <button className="ds-modal-close" onClick={() => setShowCancelModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <p>Are you sure you want to cancel this interview?</p>
              <div className="ds-interview-preview">
                <h4>{selectedInterview.jobTitle}</h4>
                <p>{selectedInterview.companyName}</p>
                <small>{selectedInterview.scheduledDateFormatted}</small>
              </div>
              <div className="ds-form-group">
                <label>Reason for cancellation *</label>
                <textarea 
                  value={cancelReason} 
                  onChange={(e) => setCancelReason(e.target.value)} 
                  rows="3"
                  placeholder="Please provide a reason for cancelling this interview..."
                />
              </div>
            </div>
            <div className="ds-modal-footer">
              <button 
                className="ds-btn ds-btn-secondary" 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Interview
              </button>
              <button 
                className="ds-btn ds-btn-danger" 
                onClick={handleCancel} 
                disabled={cancelling}
              >
                {cancelling ? <><FaSpinner className="ds-spin" /> Cancelling...</> : 'Yes, Cancel Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInterviews;