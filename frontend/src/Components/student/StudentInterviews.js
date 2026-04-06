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
  FaBug, FaDatabase, FaTrash, FaEdit, FaPlus, FaHeart
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
  const [ensuringProfile, setEnsuringProfile] = useState(false);

  // ----------------------------------------------
  // Helper functions (same as original)
  // ----------------------------------------------
  const getStatusText = (status) => {
    const map = { scheduled: 'Scheduled', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
    return map[status?.toLowerCase()] || 'Scheduled';
  };
  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (s === 'scheduled') return <FaRegClock />;
    if (s === 'confirmed') return <FaRegCheckCircle />;
    if (s === 'completed') return <FaCheckCircle />;
    return <FaRegTimesCircle />;
  };
  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === 'scheduled') return '#f59e0b';
    if (s === 'confirmed') return '#10b981';
    if (s === 'completed') return '#3b82f6';
    return '#ef4444';
  };
  const getModeIcon = (mode) => {
    if (mode === 'Online') return <FaVideo />;
    if (mode === 'In-person') return <FaMapMarkerAlt />;
    if (mode === 'Phone') return <FaPhone />;
    return <FaVideo />;
  };
  const getModeClass = (mode) => {
    if (mode === 'Online') return 'si-mode-online';
    if (mode === 'In-person') return 'si-mode-inperson';
    return 'si-mode-phone';
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
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
    } catch { return ''; }
  };
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) stars.push(<FaStar key={i} className="si-star-filled" />);
      else if (i - 0.5 <= rating) stars.push(<FaStarHalfAlt key={i} className="si-star-half" />);
      else stars.push(<FaRegStar key={i} className="si-star-empty" />);
    }
    return stars;
  };

  // ----------------------------------------------
  // Data fetching (same logic as original)
  // ----------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login first'); navigate('/login'); return; }
    if (!user) { toast.error('User data not found'); navigate('/login'); return; }
    if (user.role !== 'student') { toast.error('Access denied'); navigate('/'); return; }
    ensureStudentProfile().then(() => fetchInterviews());
  }, []);

  const ensureStudentProfile = async () => {
    setEnsuringProfile(true);
    try {
      const res = await API.get('/students/profile');
      if (res.data.success) return true;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await API.post('/students/profile', {});
        } catch (e) { console.error(e); }
      }
    } finally { setEnsuringProfile(false); }
    return false;
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true); setRefreshing(true);
      const response = await API.get('/interviews/student');
      setDebugInfo({ user, responseStatus: response.status, interviewsCount: response.data.interviews?.length, timestamp: new Date().toISOString() });
      if (response.data.success) {
        let data = response.data.interviews || [];
        const processed = data.map(interview => {
          const scheduledDate = new Date(interview.scheduledDate);
          const now = new Date();
          return {
            ...interview,
            id: interview._id,
            jobTitle: interview.jobId?.title || interview.position || 'Position',
            companyName: interview.companyId?.companyName || interview.companyName || 'Company',
            companyLogo: interview.companyId?.companyLogo || null,
            scheduledDateObj: scheduledDate,
            scheduledDateFormatted: formatDate(interview.scheduledDate),
            scheduledDateRelative: getRelativeTime(interview.scheduledDate),
            isUpcoming: scheduledDate > now,
            isPast: scheduledDate <= now,
            canConfirm: interview.status === 'scheduled' && scheduledDate > now,
            canCancel: ['scheduled','confirmed'].includes(interview.status) && scheduledDate > now,
            canJoin: interview.status === 'confirmed' && interview.meetingLink && scheduledDate > now,
            statusText: getStatusText(interview.status),
            statusIcon: getStatusIcon(interview.status),
            statusColor: getStatusColor(interview.status),
            modeIcon: getModeIcon(interview.mode),
            modeText: interview.mode || 'Online',
            durationText: interview.duration ? `${interview.duration} min` : '60 min',
            meetingLink: interview.meetingLink || null,
            interviewerName: interview.interviewerName || null,
            interviewerEmail: interview.interviewerEmail || null,
            notes: interview.notes || null,
            location: interview.location || null,
            hasFeedback: interview.feedback && Object.keys(interview.feedback).length > 0,
            feedbackRating: interview.feedback?.rating || 0,
            feedbackComments: interview.feedback?.comments || '',
            feedbackRecommendation: interview.feedback?.recommendation || '',
            feedbackStrengths: interview.feedback?.strengths || [],
            feedbackWeaknesses: interview.feedback?.weaknesses || []
          };
        });
        setInterviews(processed);
        if (processed.length) toast.success(`Found ${processed.length} interview(s)`);
        else toast.info('No interviews found');
      } else setError(response.data.message || 'Failed');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Network error');
      toast.error('Failed to load interviews');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const createTestInterview = async () => {
    if (ensuringProfile) return toast.info('Setting up profile...');
    try {
      const apps = await API.get('/applications/student');
      if (!apps.data.success || !apps.data.applications.length) {
        toast.error('Apply to a job first');
        return;
      }
      const appId = apps.data.applications[0]._id;
      const testData = {
        applicationId: appId,
        scheduledDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        duration: 60,
        mode: 'Online',
        meetingLink: 'https://meet.google.com/test-interview',
        interviewerName: 'Test Interviewer',
        notes: 'Test interview for debugging'
      };
      await API.post('/interviews', testData);
      toast.success('Test interview created');
      fetchInterviews();
    } catch (err) {
      toast.error('Failed to create test interview');
    }
  };

  const handleConfirm = async (id) => {
    setConfirming(true);
    try {
      await API.put(`/interviews/${id}/confirm`);
      toast.success('Confirmed');
      fetchInterviews();
      setShowDetailsModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConfirming(false); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Reason required');
    setCancelling(true);
    try {
      await API.delete(`/interviews/${selectedInterview.id}`, { data: { reason: cancelReason } });
      toast.success('Cancelled');
      setShowCancelModal(false);
      setCancelReason('');
      fetchInterviews();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCancelling(false); }
  };

  const handleViewDetails = (i) => { setSelectedInterview(i); setShowDetailsModal(true); };
  const handleViewFeedback = (i) => { setSelectedInterview(i); setShowFeedbackModal(true); };
  const handleRefresh = () => fetchInterviews();
  const handleClearFilters = () => { setFilterStatus('all'); setSearchTerm(''); setSortBy('date'); };

  const getFilteredInterviews = () => {
    let filtered = [...interviews];
    if (selectedTab === 'upcoming') filtered = filtered.filter(i => i.isUpcoming && i.status !== 'cancelled');
    else if (selectedTab === 'past') filtered = filtered.filter(i => i.isPast || i.status === 'completed' || i.status === 'cancelled');
    if (filterStatus !== 'all') filtered = filtered.filter(i => i.status?.toLowerCase() === filterStatus);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => i.jobTitle.toLowerCase().includes(term) || i.companyName.toLowerCase().includes(term));
    }
    if (sortBy === 'date') filtered.sort((a,b) => a.scheduledDateObj - b.scheduledDateObj);
    else if (sortBy === 'date-desc') filtered.sort((a,b) => b.scheduledDateObj - a.scheduledDateObj);
    else if (sortBy === 'company') filtered.sort((a,b) => a.companyName.localeCompare(b.companyName));
    return filtered;
  };

  const filteredInterviews = getFilteredInterviews();
  const total = interviews.length;
  const upcoming = interviews.filter(i => i.isUpcoming && i.status !== 'cancelled').length;
  const confirmed = interviews.filter(i => i.status === 'confirmed' && i.isUpcoming).length;
  const completed = interviews.filter(i => i.status === 'completed').length;

  // ----------------------------------------------
  // Render
  // ----------------------------------------------
  if (loading && !refreshing) {
    return (
      <div className="si-loading-container">
        <div className="si-spinner"></div>
        <h4>Loading your interviews...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="si-error-container">
        <div className="si-error-card">
          <FaExclamationTriangle className="si-error-icon" />
          <h3>Error Loading Interviews</h3>
          <p>{error}</p>
          <button className="si-btn si-btn-primary" onClick={fetchInterviews}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="si-student-interviews">
      <div className="si-container">
        {/* Header */}
        <div className="si-page-header">
          <div className="si-header-left">
            <div className="si-header-icon-wrapper">
              <FaCalendarAlt className="si-header-icon" />
            </div>
            <div>
              <h1>My Interviews</h1>
              <p className="si-header-subtitle">Manage and track all your scheduled interviews</p>
            </div>
          </div>
          <div className="si-header-actions">
            <button className="si-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              <FaSyncAlt className={refreshing ? 'si-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="si-btn si-btn-outline-primary" onClick={() => setShowDebug(!showDebug)}>
              <FaBug /> {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && debugInfo && (
          <div className="si-debug-panel">
            <details open>
              <summary><FaDatabase /> Debug Info</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          </div>
        )}

        {/* Stats Cards */}
        {total > 0 && (
          <div className="si-stats-grid">
            <div className="si-stat-card si-stat-total">
              <div className="si-stat-icon"><FaCalendarAlt /></div>
              <div className="si-stat-info">
                <span className="si-stat-value">{total}</span>
                <span className="si-stat-label">Total</span>
              </div>
            </div>
            <div className="si-stat-card si-stat-upcoming">
              <div className="si-stat-icon"><FaClock /></div>
              <div className="si-stat-info">
                <span className="si-stat-value">{upcoming}</span>
                <span className="si-stat-label">Upcoming</span>
              </div>
            </div>
            <div className="si-stat-card si-stat-confirmed">
              <div className="si-stat-icon"><FaCheckCircle /></div>
              <div className="si-stat-info">
                <span className="si-stat-value">{confirmed}</span>
                <span className="si-stat-label">Confirmed</span>
              </div>
            </div>
            <div className="si-stat-card si-stat-completed">
              <div className="si-stat-icon"><FaStar /></div>
              <div className="si-stat-info">
                <span className="si-stat-value">{completed}</span>
                <span className="si-stat-label">Completed</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {total > 0 && (
          <div className="si-tabs">
            <button className={`si-tab ${selectedTab === 'upcoming' ? 'active' : ''}`} onClick={() => setSelectedTab('upcoming')}>
              <FaClock /> Upcoming
            </button>
            <button className={`si-tab ${selectedTab === 'past' ? 'active' : ''}`} onClick={() => setSelectedTab('past')}>
              <FaCalendarCheck /> Past
            </button>
          </div>
        )}

        {/* Filters */}
        {total > 0 && (
          <div className="si-filters-card">
            <div className="si-search-wrapper">
              <div className="si-search-input-group">
                <FaSearch className="si-search-icon" />
                <input type="text" placeholder="Search by job or company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="si-filters-row">
              <div className="si-filter-group">
                <label>Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="si-filter-group">
                <label>Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="date">Earliest First</option>
                  <option value="date-desc">Latest First</option>
                  <option value="company">Company Name</option>
                </select>
              </div>
              <button className="si-clear-filters" onClick={handleClearFilters}><FaFilter /> Clear</button>
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="si-results-info">
            Showing <strong>{filteredInterviews.length}</strong> of <strong>{total}</strong> interviews
          </div>
        )}

        {/* Empty / No Interviews */}
        {total === 0 ? (
          <div className="si-empty-state">
            <div className="si-empty-icon-wrapper"><FaCalendarAlt className="si-empty-icon" /></div>
            <h3>No Interviews Yet</h3>
            <p>You haven't been scheduled for any interviews.</p>
            <div className="si-empty-actions">
              <Link to="/student/jobs" className="si-btn si-btn-primary"><FaSearch /> Browse Jobs</Link>
              <button className="si-btn si-btn-outline-primary" onClick={createTestInterview} disabled={ensuringProfile}><FaPlus /> Test Interview</button>
            </div>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="si-empty-filters">
            <FaFilter className="si-empty-icon" />
            <h4>No interviews match</h4>
            <button className="si-btn si-btn-outline-primary" onClick={handleClearFilters}>Clear Filters</button>
          </div>
        ) : (
          <div className="si-interviews-grid">
            {filteredInterviews.map(interview => (
              <div key={interview.id} className="si-interview-card">
                {/* LEFT: Company Logo */}
                <div className="si-card-logo">
                  {interview.companyLogo ? (
                    <img src={interview.companyLogo} alt={interview.companyName} />
                  ) : (
                    <div className="si-logo-placeholder"><FaBuilding /></div>
                  )}
                </div>

                {/* RIGHT: Content */}
                <div className="si-card-content">
                  <div className="si-card-header-section">
                    <div className="si-job-title-section">
                      <h3 className="si-job-title">{interview.jobTitle}</h3>
                      <p className="si-company-name">{interview.companyName}</p>
                      <div className="si-job-meta">
                        <span><FaCalendarAlt /> {interview.scheduledDateFormatted}</span>
                        <span><FaClock /> {interview.scheduledDateRelative}</span>
                        <span className={getModeClass(interview.mode)}>{interview.modeIcon} {interview.modeText}</span>
                      </div>
                    </div>
                    <div className="si-status-section">
                      <span className="si-status-badge" style={{ backgroundColor: interview.statusColor }}>
                        {interview.statusIcon} {interview.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Additional info row */}
                  <div className="si-card-details">
                    {interview.interviewerName && (
                      <div className="si-detail-item"><FaUser /> <span>{interview.interviewerName}</span></div>
                    )}
                    {interview.durationText && (
                      <div className="si-detail-item"><FaClock /> <span>{interview.durationText}</span></div>
                    )}
                    {interview.meetingLink && interview.status !== 'cancelled' && (
                      <div className="si-detail-item"><FaVideo /> <a href={interview.meetingLink} target="_blank" rel="noopener">Join</a></div>
                    )}
                  </div>

                  {/* Feedback preview */}
                  {interview.hasFeedback && interview.status === 'completed' && (
                    <div className="si-feedback-preview" onClick={() => handleViewFeedback(interview)}>
                      <FaComment /> <span>Feedback</span>
                      <div className="si-feedback-rating-preview">{renderStars(interview.feedbackRating)}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="si-card-actions">
                    <button className="si-action-btn si-view-btn" onClick={() => handleViewDetails(interview)}>
                      <FaInfoCircle /> Details
                    </button>
                    {interview.canConfirm && (
                      <button className="si-action-btn si-confirm-btn" onClick={() => handleConfirm(interview.id)} disabled={confirming}>
                        {confirming ? <FaSpinner className="si-spin" /> : <FaCheckCircle />} Confirm
                      </button>
                    )}
                    {interview.canCancel && (
                      <button className="si-action-btn si-cancel-btn" onClick={() => { setSelectedInterview(interview); setShowCancelModal(true); }}>
                        <FaTimesCircle /> Cancel
                      </button>
                    )}
                    {interview.canJoin && (
                      <a href={interview.meetingLink} target="_blank" rel="noopener" className="si-action-btn si-join-btn">
                        <FaVideo /> Join
                      </a>
                    )}
                    {interview.hasFeedback && interview.status === 'completed' && (
                      <button className="si-action-btn si-feedback-btn" onClick={() => handleViewFeedback(interview)}>
                        <FaComment /> Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals: Details, Feedback, Cancel (same as original but styled with new classes) */}
      {showDetailsModal && selectedInterview && (
        <div className="si-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="si-modal si-modal-large" onClick={e => e.stopPropagation()}>
            <div className="si-modal-header"><FaInfoCircle /> <h3>Interview Details</h3><button className="si-modal-close" onClick={() => setShowDetailsModal(false)}><FaTimes /></button></div>
            <div className="si-modal-body">
              <div className="si-details-section"><h4>Job</h4><p><strong>Position:</strong> {selectedInterview.jobTitle}</p><p><strong>Company:</strong> {selectedInterview.companyName}</p></div>
              <div className="si-details-section"><h4>Schedule</h4><p><strong>Date:</strong> {selectedInterview.scheduledDateFormatted}</p><p><strong>Duration:</strong> {selectedInterview.durationText}</p><p><strong>Mode:</strong> {selectedInterview.modeText}</p></div>
              {selectedInterview.interviewerName && <div className="si-details-section"><h4>Interviewer</h4><p>{selectedInterview.interviewerName}</p>{selectedInterview.interviewerEmail && <a href={`mailto:${selectedInterview.interviewerEmail}`}>{selectedInterview.interviewerEmail}</a>}</div>}
              {selectedInterview.meetingLink && <div className="si-details-section"><h4>Meeting</h4><a href={selectedInterview.meetingLink} target="_blank" rel="noopener">Join Meeting <FaExternalLinkAlt /></a></div>}
              {selectedInterview.notes && <div className="si-details-section"><h4>Notes</h4><p>{selectedInterview.notes}</p></div>}
            </div>
            <div className="si-modal-footer">
              {selectedInterview.canConfirm && <button className="si-btn si-btn-success" onClick={() => handleConfirm(selectedInterview.id)}>Confirm</button>}
              {selectedInterview.canCancel && <button className="si-btn si-btn-danger" onClick={() => { setShowDetailsModal(false); setShowCancelModal(true); }}>Cancel</button>}
              <button className="si-btn si-btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedInterview && (
        <div className="si-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="si-modal" onClick={e => e.stopPropagation()}>
            <div className="si-modal-header si-modal-header-success"><FaComment /> <h3>Interview Feedback</h3><button className="si-modal-close" onClick={() => setShowFeedbackModal(false)}><FaTimes /></button></div>
            <div className="si-modal-body">
              <h4>{selectedInterview.jobTitle}</h4><p>{selectedInterview.companyName}</p>
              <div className="si-rating-large">{renderStars(selectedInterview.feedbackRating)} <span>{selectedInterview.feedbackRating}/5</span></div>
              {selectedInterview.feedbackComments && <div><label>Comments</label><div className="si-feedback-comments-box">{selectedInterview.feedbackComments}</div></div>}
              {selectedInterview.feedbackStrengths.length > 0 && <div><label>Strengths</label><ul>{selectedInterview.feedbackStrengths.map((s,i)=><li key={i}><FaCheckCircle /> {s}</li>)}</ul></div>}
              {selectedInterview.feedbackWeaknesses.length > 0 && <div><label>Areas for Improvement</label><ul>{selectedInterview.feedbackWeaknesses.map((w,i)=><li key={i}><FaTimesCircle /> {w}</li>)}</ul></div>}
              {selectedInterview.feedbackRecommendation && <div><label>Recommendation</label><strong>{selectedInterview.feedbackRecommendation}</strong></div>}
            </div>
            <div className="si-modal-footer"><button className="si-btn si-btn-secondary" onClick={() => setShowFeedbackModal(false)}>Close</button></div>
          </div>
        </div>
      )}

      {showCancelModal && selectedInterview && (
        <div className="si-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="si-modal" onClick={e => e.stopPropagation()}>
            <div className="si-modal-header si-modal-header-danger"><FaTimesCircle /> <h3>Cancel Interview</h3><button className="si-modal-close" onClick={() => setShowCancelModal(false)}><FaTimes /></button></div>
            <div className="si-modal-body">
              <p>Are you sure you want to cancel this interview?</p>
              <div className="si-job-preview"><h4>{selectedInterview.jobTitle}</h4><p>{selectedInterview.companyName}</p><small>{selectedInterview.scheduledDateFormatted}</small></div>
              <div className="si-form-group"><label>Reason *</label><textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows="3" placeholder="Please provide a reason..." /></div>
            </div>
            <div className="si-modal-footer">
              <button className="si-btn si-btn-secondary" onClick={() => setShowCancelModal(false)}>Keep</button>
              <button className="si-btn si-btn-danger" onClick={handleCancel} disabled={cancelling}>{cancelling ? <><FaSpinner className="si-spin" /> Cancelling...</> : 'Yes, Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInterviews;