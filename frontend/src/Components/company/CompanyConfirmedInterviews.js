import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, FaClock, FaVideo, FaMapMarkerAlt, FaPhone,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle,
  FaBuilding, FaUser, FaEnvelope, FaExternalLinkAlt, FaInfoCircle, FaTimes,
  FaArrowRight, FaSyncAlt, FaUsers, FaBriefcase
} from 'react-icons/fa';

const CompanyConfirmedInterviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

    if (user.role !== 'company') {
      toast.error('Access denied. Only companies can view interviews.');
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
      
      // Fetch all interviews for the company (already filtered by companyId in backend)
      const response = await API.get('/interviews/company');
      
      if (response.data.success) {
        let interviewsData = response.data.interviews || [];
        
        // Filter only confirmed interviews
        const confirmed = interviewsData.filter(interview => interview.status === 'confirmed');
        
        // Process interviews for display
        const processed = confirmed.map(interview => {
          const scheduledDate = new Date(interview.scheduledDate);
          const now = new Date();
          
          const jobTitle = interview.jobId?.title || 
                           interview.job?.title || 
                           interview.position || 
                           'Position Not Available';
          const studentName = interview.studentId?.name || 
                             interview.studentId?.userId?.name || 
                             'Student';
          const studentEmail = interview.studentId?.email || 
                              interview.studentId?.userId?.email || 
                              'No email';
          const meetingLink = interview.meetingLink || interview.link || null;
          const interviewerName = interview.interviewerName || user?.companyName || user?.name;
          const interviewerEmail = interview.interviewerEmail || user?.email;
          const notes = interview.notes || null;
          const location = interview.location || null;
          
          return {
            ...interview,
            id: interview._id,
            jobTitle,
            studentName,
            studentEmail,
            scheduledDateObj: scheduledDate,
            scheduledDateFormatted: formatDate(interview.scheduledDate),
            scheduledDateRelative: getRelativeTime(interview.scheduledDate),
            isUpcoming: scheduledDate > now,
            isPast: scheduledDate <= now,
            canJoin: meetingLink && scheduledDate > now,
            modeIcon: getModeIcon(interview.mode),
            modeText: interview.mode || 'Online',
            durationText: interview.duration ? `${interview.duration} minutes` : '60 minutes',
            meetingLink,
            interviewerName,
            interviewerEmail,
            notes,
            location
          };
        });
        
        setInterviews(processed);
        
        if (processed.length === 0) {
          toast.info('No confirmed interviews found.');
        } else {
          toast.success(`Found ${processed.length} confirmed interview(s).`);
        }
      } else {
        setError(response.data.message || 'Failed to load interviews');
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
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

  const handleViewDetails = (interview) => {
    setSelectedInterview(interview);
    setShowDetailsModal(true);
  };

  const handleViewApplication = (applicationId) => {
    navigate(`/company/applicant/${applicationId}`);
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
      case 'Online': return 'cci-mode-online';
      case 'In-person': return 'cci-mode-inperson';
      case 'Phone': return 'cci-mode-phone';
      default: return 'cci-mode-online';
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

  const handleRefresh = () => {
    fetchInterviews();
  };

  if (loading && !refreshing) {
    return (
      <div className="cci-loading-container">
        <div className="cci-spinner"></div>
        <h4>Loading confirmed interviews...</h4>
        <p>Please wait while we fetch your confirmed interviews</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cci-error-container">
        <div className="cci-error-card">
          <FaExclamationTriangle className="cci-error-icon" />
          <h3>Error Loading Interviews</h3>
          <p>{error}</p>
          <div className="cci-error-actions">
            <button className="cci-btn cci-btn-primary" onClick={fetchInterviews}>
              <FaSyncAlt /> Try Again
            </button>
            <button className="cci-btn cci-btn-outline-secondary" onClick={() => navigate('/company/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cci-company-confirmed-interviews">
      <div className="cci-container">
        {/* Header */}
        <div className="cci-page-header">
          <div className="cci-header-left">
            <div className="cci-header-icon-wrapper">
              <FaCheckCircle className="cci-header-icon" />
            </div>
            <div>
              <h1>Confirmed Interviews</h1>
              <p className="cci-header-subtitle">
                Interviews that have been confirmed by students
              </p>
            </div>
          </div>
          <div className="cci-header-actions">
            <button 
              className="cci-refresh-btn" 
              onClick={handleRefresh} 
              disabled={refreshing}
            >
              <FaSyncAlt className={refreshing ? 'cci-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link to="/company/interviews" className="cci-btn cci-btn-outline-primary">
              <FaCalendarAlt /> View All Interviews
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {interviews.length > 0 && (
          <div className="cci-stats-grid">
            <div className="cci-stat-card cci-stat-total">
              <div className="cci-stat-icon"><FaCheckCircle /></div>
              <div className="cci-stat-info">
                <span className="cci-stat-value">{interviews.length}</span>
                <span className="cci-stat-label">Confirmed</span>
              </div>
            </div>
            <div className="cci-stat-card cci-stat-upcoming">
              <div className="cci-stat-icon"><FaClock /></div>
              <div className="cci-stat-info">
                <span className="cci-stat-value">{interviews.filter(i => i.isUpcoming).length}</span>
                <span className="cci-stat-label">Upcoming</span>
              </div>
            </div>
            <div className="cci-stat-card cci-stat-past">
              <div className="cci-stat-icon"><FaCalendarAlt /></div>
              <div className="cci-stat-info">
                <span className="cci-stat-value">{interviews.filter(i => i.isPast).length}</span>
                <span className="cci-stat-label">Past</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Interviews Grid */}
        {interviews.length === 0 ? (
          <div className="cci-empty-state">
            <div className="cci-empty-icon-wrapper">
              <FaCheckCircle className="cci-empty-icon" />
            </div>
            <h3>No Confirmed Interviews</h3>
            <p>No students have confirmed interviews yet. When a student confirms an interview, it will appear here.</p>
            <Link to="/company/interviews" className="cci-btn cci-btn-primary">
              <FaCalendarAlt /> View All Interviews
            </Link>
          </div>
        ) : (
          <div className="cci-interviews-grid">
            {interviews.map(interview => (
              <div key={interview.id} className="cci-interview-card">
                {/* Card Header */}
                <div className="cci-card-header">
                  <div className="cci-interview-info">
                    <div className="cci-job-icon">
                      <FaBriefcase />
                    </div>
                    <div className="cci-interview-details">
                      <h3>{interview.jobTitle}</h3>
                      <p className="cci-student-name">
                        <FaUser /> {interview.studentName}
                      </p>
                    </div>
                  </div>
                  <div className="cci-status-badge cci-status-confirmed">
                    <FaCheckCircle /> Confirmed
                  </div>
                </div>

                {/* Card Body */}
                <div className="cci-card-body">
                  {/* Date and Time */}
                  <div className="cci-interview-datetime">
                    <div className="cci-datetime-icon">
                      <FaCalendarAlt />
                    </div>
                    <div className="cci-datetime-info">
                      <div className="cci-date">{interview.scheduledDateFormatted}</div>
                      {interview.isUpcoming && (
                        <div className="cci-relative-time">{interview.scheduledDateRelative}</div>
                      )}
                    </div>
                  </div>

                  {/* Interview Details Grid */}
                  <div className="cci-details-grid">
                    <div className="cci-detail-item">
                      <div className="cci-detail-icon">{interview.modeIcon}</div>
                      <div className="cci-detail-content">
                        <span className="cci-detail-label">Mode</span>
                        <strong className={getModeClass(interview.mode)}>
                          {interview.modeText}
                        </strong>
                      </div>
                    </div>
                    
                    <div className="cci-detail-item">
                      <div className="cci-detail-icon"><FaClock /></div>
                      <div className="cci-detail-content">
                        <span className="cci-detail-label">Duration</span>
                        <strong>{interview.durationText}</strong>
                      </div>
                    </div>

                    {interview.studentEmail && (
                      <div className="cci-detail-item">
                        <div className="cci-detail-icon"><FaEnvelope /></div>
                        <div className="cci-detail-content">
                          <span className="cci-detail-label">Student Email</span>
                          <a href={`mailto:${interview.studentEmail}`}>
                            {interview.studentEmail}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meeting Link */}
                  {interview.meetingLink && (
                    <div className="cci-meeting-link">
                      <FaVideo />
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Meeting <FaExternalLinkAlt />
                      </a>
                    </div>
                  )}

                  {/* Location for In-person */}
                  {interview.mode === 'In-person' && interview.location && (
                    <div className="cci-location">
                      <FaMapMarkerAlt />
                      <div>
                        <span>Location</span>
                        <p>
                          {interview.location.address}
                          {interview.location.city && `, ${interview.location.city}`}
                          {interview.location.country && `, ${interview.location.country}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {interview.notes && (
                    <div className="cci-notes">
                      <FaInfoCircle />
                      <div className="cci-notes-content">
                        <span className="cci-notes-label">Additional Notes</span>
                        <p>{interview.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="cci-card-footer">
                  <button 
                    className="cci-btn cci-btn-outline-primary"
                    onClick={() => handleViewDetails(interview)}
                  >
                    <FaInfoCircle /> View Details
                  </button>
                  
                  {interview.canJoin && (
                    <a 
                      href={interview.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="cci-btn cci-btn-primary"
                    >
                      <FaVideo /> Join Now
                    </a>
                  )}
                  
                  <button 
                    className="cci-btn cci-btn-link" 
                    onClick={() => handleViewApplication(interview.applicationId?._id || interview.applicationId)}
                  >
                    View Application <FaArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Details Modal */}
      {showDetailsModal && selectedInterview && (
        <div className="cci-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="cci-modal cci-modal-large" onClick={e => e.stopPropagation()}>
            <div className="cci-modal-header">
              <FaInfoCircle className="cci-modal-icon" />
              <h3>Interview Details</h3>
              <button className="cci-modal-close" onClick={() => setShowDetailsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="cci-modal-body">
              <div className="cci-details-container">
                <div className="cci-details-section">
                  <h4>Job & Student Information</h4>
                  <div className="cci-detail-row">
                    <strong>Position:</strong>
                    <span>{selectedInterview.jobTitle}</span>
                  </div>
                  <div className="cci-detail-row">
                    <strong>Student Name:</strong>
                    <span>{selectedInterview.studentName}</span>
                  </div>
                  <div className="cci-detail-row">
                    <strong>Student Email:</strong>
                    <a href={`mailto:${selectedInterview.studentEmail}`}>{selectedInterview.studentEmail}</a>
                  </div>
                </div>

                <div className="cci-details-section">
                  <h4>Interview Information</h4>
                  <div className="cci-detail-row">
                    <strong>Date & Time:</strong>
                    <span>{selectedInterview.scheduledDateFormatted}</span>
                  </div>
                  <div className="cci-detail-row">
                    <strong>Duration:</strong>
                    <span>{selectedInterview.durationText}</span>
                  </div>
                  <div className="cci-detail-row">
                    <strong>Mode:</strong>
                    <span className={getModeClass(selectedInterview.mode)}>
                      {selectedInterview.modeText}
                    </span>
                  </div>
                </div>

                {(selectedInterview.interviewerName || selectedInterview.interviewerEmail) && (
                  <div className="cci-details-section">
                    <h4>Interviewer Details</h4>
                    {selectedInterview.interviewerName && (
                      <div className="cci-detail-row">
                        <strong>Name:</strong>
                        <span>{selectedInterview.interviewerName}</span>
                      </div>
                    )}
                    {selectedInterview.interviewerEmail && (
                      <div className="cci-detail-row">
                        <strong>Email:</strong>
                        <a href={`mailto:${selectedInterview.interviewerEmail}`}>
                          {selectedInterview.interviewerEmail}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {selectedInterview.meetingLink && (
                  <div className="cci-details-section">
                    <h4>Meeting Details</h4>
                    <div className="cci-detail-row">
                      <strong>Meeting Link:</strong>
                      <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer">
                        {selectedInterview.meetingLink} <FaExternalLinkAlt />
                      </a>
                    </div>
                  </div>
                )}

                {selectedInterview.location?.address && (
                  <div className="cci-details-section">
                    <h4>Location</h4>
                    <div className="cci-detail-row">
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
                  <div className="cci-details-section">
                    <h4>Additional Notes</h4>
                    <div className="cci-notes-full">
                      <p>{selectedInterview.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="cci-modal-footer">
              <button className="cci-btn cci-btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyConfirmedInterviews;