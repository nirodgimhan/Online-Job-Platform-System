import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, FaClock, FaVideo, FaMapMarkerAlt, FaPhone,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle, FaTimes,
  FaBuilding, FaUser, FaEnvelope, FaExternalLinkAlt, FaInfoCircle,
  FaStar, FaRegStar, FaComment, FaThumbsUp, FaThumbsDown, FaUsers,
  FaArrowRight, FaSyncAlt, FaFilter, FaPlus, FaEdit, FaTrash
} from 'react-icons/fa';

const CompanyInterviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 3,
    comments: '',
    strengths: '',
    weaknesses: '',
    recommendation: 'Pending'
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [stats, setStats] = useState({ total: 0, scheduled: 0, completed: 0, cancelled: 0 });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/interviews');
      
      if (response.data.success) {
        const interviewData = response.data.interviews || [];
        setInterviews(interviewData);
        calculateStats(interviewData);
      } else {
        setError('Failed to load interviews');
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError(err.response?.data?.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (interviewData) => {
    const newStats = {
      total: interviewData.length,
      scheduled: interviewData.filter(i => i.status?.toLowerCase() === 'scheduled' || i.status?.toLowerCase() === 'confirmed').length,
      completed: interviewData.filter(i => i.status?.toLowerCase() === 'completed').length,
      cancelled: interviewData.filter(i => i.status?.toLowerCase() === 'cancelled').length
    };
    setStats(newStats);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    setCancelling(true);
    try {
      const response = await API.delete(`/interviews/${selectedInterview._id}`);
      if (response.data.success) {
        toast.success('Interview cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        fetchInterviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel interview');
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleReason.trim()) {
      toast.error('Please provide a reason for rescheduling');
      return;
    }
    if (!proposedDate) {
      toast.error('Please select a proposed date');
      return;
    }
    setRescheduling(true);
    try {
      const response = await API.put(`/interviews/${selectedInterview._id}`, {
        scheduledDate: proposedDate,
        notes: `Rescheduled: ${rescheduleReason}`
      });
      if (response.data.success) {
        toast.success('Interview rescheduled successfully');
        setShowRescheduleModal(false);
        setRescheduleReason('');
        setProposedDate('');
        fetchInterviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule interview');
    } finally {
      setRescheduling(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackData.comments.trim()) {
      toast.error('Please provide feedback comments');
      return;
    }
    setSubmitting(true);
    try {
      const response = await API.post(`/interviews/${selectedInterview._id}/feedback`, {
        rating: feedbackData.rating,
        comments: feedbackData.comments,
        strengths: feedbackData.strengths.split(',').map(s => s.trim()).filter(s => s),
        weaknesses: feedbackData.weaknesses.split(',').map(w => w.trim()).filter(w => w),
        recommendation: feedbackData.recommendation
      });
      if (response.data.success) {
        toast.success('Feedback submitted successfully');
        setShowFeedbackModal(false);
        setFeedbackData({ rating: 3, comments: '', strengths: '', weaknesses: '', recommendation: 'Pending' });
        fetchInterviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'scheduled';
    const badges = {
      'scheduled': { class: 'ci-status-scheduled', icon: <FaClock />, text: 'Scheduled' },
      'confirmed': { class: 'ci-status-confirmed', icon: <FaCheckCircle />, text: 'Confirmed' },
      'completed': { class: 'ci-status-completed', icon: <FaCheckCircle />, text: 'Completed' },
      'cancelled': { class: 'ci-status-cancelled', icon: <FaTimesCircle />, text: 'Cancelled' }
    };
    const badge = badges[statusLower] || badges['scheduled'];
    return <span className={`ci-status-badge ${badge.class}`}>{badge.icon}{badge.text}</span>;
  };

  const getModeIcon = (mode) => {
    switch(mode) {
      case 'Online': return <FaVideo />;
      case 'In-person': return <FaMapMarkerAlt />;
      case 'Phone': return <FaPhone />;
      default: return <FaVideo />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getFilteredInterviews = () => {
    let filtered = [...interviews];
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status?.toLowerCase() === filterStatus.toLowerCase());
    }
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    } else if (sortBy === 'student') {
      filtered.sort((a, b) => a.studentId?.userId?.name?.localeCompare(b.studentId?.userId?.name || ''));
    }
    return filtered;
  };

  const filteredInterviews = getFilteredInterviews();

  if (loading) {
    return (
      <div className="ci-loading-container">
        <div className="ci-spinner"></div>
        <h4>Loading interviews...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ci-error-container">
        <div className="ci-error-card">
          <FaExclamationTriangle className="ci-error-icon" />
          <h3>Error Loading Interviews</h3>
          <p>{error}</p>
          <button className="ci-btn ci-btn-primary" onClick={fetchInterviews}>
            <FaSyncAlt /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ci-company-interviews">
      <div className="ci-container">
        <div className="ci-page-header">
          <div className="ci-header-left">
            <div className="ci-header-icon-wrapper"><FaCalendarAlt className="ci-header-icon" /></div>
            <div><h1>Interview Management</h1><p>Schedule, manage and provide feedback for interviews</p></div>
          </div>
          <div className="ci-header-actions">
            <Link to="/company/applicants" className="ci-btn ci-btn-outline-primary"><FaUsers /> View Applicants</Link>
            <button className="ci-refresh-btn" onClick={fetchInterviews}><FaSyncAlt /> Refresh</button>
          </div>
        </div>

        {interviews.length > 0 && (
          <div className="ci-stats-grid">
            <div className="ci-stat-card"><div className="ci-stat-icon"><FaCalendarAlt /></div><div><span className="ci-stat-value">{stats.total}</span><span>Total</span></div></div>
            <div className="ci-stat-card"><div className="ci-stat-icon"><FaClock /></div><div><span className="ci-stat-value">{stats.scheduled}</span><span>Scheduled</span></div></div>
            <div className="ci-stat-card"><div className="ci-stat-icon"><FaCheckCircle /></div><div><span className="ci-stat-value">{stats.completed}</span><span>Completed</span></div></div>
            <div className="ci-stat-card"><div className="ci-stat-icon"><FaTimesCircle /></div><div><span className="ci-stat-value">{stats.cancelled}</span><span>Cancelled</span></div></div>
          </div>
        )}

        <div className="ci-filters-card">
          <div className="ci-filters-row">
            <div className="ci-filter-group">
              <label>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Interviews</option>
                <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="ci-filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Sort by Date</option><option value="student">Sort by Student</option>
              </select>
            </div>
            <div className="ci-results-info"><p>Showing <strong>{filteredInterviews.length}</strong> of <strong>{interviews.length}</strong> interviews</p></div>
          </div>
        </div>

        {filteredInterviews.length === 0 ? (
          <div className="ci-empty-state">
            <FaCalendarAlt className="ci-empty-icon" />
            <h3>No Interviews Found</h3>
            <Link to="/company/applicants" className="ci-btn ci-btn-primary">View Applicants</Link>
          </div>
        ) : (
          <div className="ci-interviews-grid">
            {filteredInterviews.map(interview => (
              <div key={interview._id} className="ci-interview-card">
                <div className="ci-card-header">
                  <div className="ci-student-info">
                    <div className="ci-student-avatar">{interview.studentId?.userId?.name?.charAt(0).toUpperCase() || 'S'}</div>
                    <div><h3>{interview.studentId?.userId?.name}</h3><p>{interview.studentId?.userId?.email}</p></div>
                  </div>
                  {getStatusBadge(interview.status)}
                </div>
                <div className="ci-card-body">
                  <h4>{interview.jobId?.title}</h4>
                  <div className="ci-interview-details">
                    <div className="ci-detail-item"><FaCalendarAlt /><div><span>Date & Time</span><strong>{formatDate(interview.scheduledDate)}</strong></div></div>
                    <div className="ci-detail-item">{getModeIcon(interview.mode)}<div><span>Mode</span><strong>{interview.mode}</strong></div></div>
                    {interview.duration && <div className="ci-detail-item"><FaClock /><div><span>Duration</span><strong>{interview.duration} min</strong></div></div>}
                  </div>
                  {interview.meetingLink && (
                    <div className="ci-meeting-link"><FaVideo /><a href={interview.meetingLink} target="_blank">Join Meeting <FaExternalLinkAlt /></a></div>
                  )}
                  {interview.notes && (
                    <div className="ci-notes"><FaInfoCircle /><div><span>Notes</span><p>{interview.notes}</p></div></div>
                  )}
                  {interview.feedback && (
                    <div className="ci-feedback-preview"><FaStar /><div><span>Feedback</span><p>Rating: {interview.feedback.rating}/5</p><p>{interview.feedback.recommendation}</p></div></div>
                  )}
                </div>
                <div className="ci-card-footer">
                  {(!interview.feedback || Object.keys(interview.feedback).length === 0) && interview.status?.toLowerCase() !== 'cancelled' && interview.status?.toLowerCase() !== 'completed' && (
                    <button className="ci-btn ci-btn-primary" onClick={() => { setSelectedInterview(interview); setShowFeedbackModal(true); }}><FaStar /> Add Feedback</button>
                  )}
                  {(interview.status?.toLowerCase() === 'scheduled' || interview.status?.toLowerCase() === 'confirmed') && (
                    <>
                      <button className="ci-btn ci-btn-outline-primary" onClick={() => { setSelectedInterview(interview); setShowRescheduleModal(true); }}><FaClock /> Reschedule</button>
                      <button className="ci-btn ci-btn-danger" onClick={() => { setSelectedInterview(interview); setShowCancelModal(true); }}><FaTimesCircle /> Cancel</button>
                    </>
                  )}
                  <button className="ci-btn ci-btn-link" onClick={() => navigate(`/company/applicant/${interview.applicationId?._id || interview.applicationId}`)}>View Application <FaArrowRight /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedInterview && (
        <div className="ci-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="ci-modal" onClick={e => e.stopPropagation()}>
            <div className="ci-modal-header ci-modal-header-danger"><FaTimesCircle /><h3>Cancel Interview</h3><button className="ci-modal-close" onClick={() => setShowCancelModal(false)}><FaTimes /></button></div>
            <div className="ci-modal-body">
              <p>Are you sure you want to cancel this interview?</p>
              <div className="ci-interview-preview"><h4>{selectedInterview.studentId?.userId?.name}</h4><p>{selectedInterview.jobId?.title}</p><small>{formatDate(selectedInterview.scheduledDate)}</small></div>
              <div className="ci-form-group"><label>Reason *</label><textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows="3" /></div>
            </div>
            <div className="ci-modal-footer"><button className="ci-btn ci-btn-secondary" onClick={() => setShowCancelModal(false)}>Cancel</button><button className="ci-btn ci-btn-danger" onClick={handleCancel} disabled={cancelling}>{cancelling ? <FaSpinner className="ci-spin" /> : 'Confirm Cancel'}</button></div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedInterview && (
        <div className="ci-modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="ci-modal" onClick={e => e.stopPropagation()}>
            <div className="ci-modal-header ci-modal-header-info"><FaClock /><h3>Reschedule Interview</h3><button className="ci-modal-close" onClick={() => setShowRescheduleModal(false)}><FaTimes /></button></div>
            <div className="ci-modal-body">
              <div className="ci-interview-preview"><h4>{selectedInterview.studentId?.userId?.name}</h4><p>{selectedInterview.jobId?.title}</p><small>Current: {formatDate(selectedInterview.scheduledDate)}</small></div>
              <div className="ci-form-group"><label>New Date & Time *</label><input type="datetime-local" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} /></div>
              <div className="ci-form-group"><label>Reason *</label><textarea value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} rows="3" /></div>
            </div>
            <div className="ci-modal-footer"><button className="ci-btn ci-btn-secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</button><button className="ci-btn ci-btn-primary" onClick={handleReschedule} disabled={rescheduling}>{rescheduling ? <FaSpinner className="ci-spin" /> : 'Confirm Reschedule'}</button></div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedInterview && (
        <div className="ci-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="ci-modal ci-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ci-modal-header ci-modal-header-success"><FaStar /><h3>Interview Feedback</h3><button className="ci-modal-close" onClick={() => setShowFeedbackModal(false)}><FaTimes /></button></div>
            <div className="ci-modal-body">
              <div className="ci-interview-preview"><h4>{selectedInterview.studentId?.userId?.name}</h4><p>{selectedInterview.jobId?.title}</p></div>
              <div className="ci-form-group"><label>Rating *</label><div className="ci-rating-input">{[1,2,3,4,5].map(star => (<button key={star} className={star <= feedbackData.rating ? 'ci-star-active' : ''} onClick={() => setFeedbackData({...feedbackData, rating: star})}>{star <= feedbackData.rating ? <FaStar /> : <FaRegStar />}</button>))}</div></div>
              <div className="ci-form-group"><label>Comments *</label><textarea value={feedbackData.comments} onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})} rows="4" /></div>
              <div className="ci-form-row"><div className="ci-form-group"><label>Strengths</label><input type="text" value={feedbackData.strengths} onChange={(e) => setFeedbackData({...feedbackData, strengths: e.target.value})} placeholder="Technical skills, Communication" /></div><div className="ci-form-group"><label>Areas to Improve</label><input type="text" value={feedbackData.weaknesses} onChange={(e) => setFeedbackData({...feedbackData, weaknesses: e.target.value})} placeholder="Experience, Technical depth" /></div></div>
              <div className="ci-form-group"><label>Recommendation *</label><select value={feedbackData.recommendation} onChange={(e) => setFeedbackData({...feedbackData, recommendation: e.target.value})}><option value="Hire">Hire</option><option value="Second Interview">Second Interview</option><option value="Reject">Reject</option><option value="Pending">Pending</option></select></div>
            </div>
            <div className="ci-modal-footer"><button className="ci-btn ci-btn-secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</button><button className="ci-btn ci-btn-primary" onClick={handleSubmitFeedback} disabled={submitting}>{submitting ? <FaSpinner className="ci-spin" /> : 'Submit Feedback'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyInterviews;