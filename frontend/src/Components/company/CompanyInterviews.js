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
      'scheduled': { class: 'ds-status-scheduled', icon: <FaClock />, text: 'Scheduled' },
      'confirmed': { class: 'ds-status-confirmed', icon: <FaCheckCircle />, text: 'Confirmed' },
      'completed': { class: 'ds-status-completed', icon: <FaCheckCircle />, text: 'Completed' },
      'cancelled': { class: 'ds-status-cancelled', icon: <FaTimesCircle />, text: 'Cancelled' }
    };
    const badge = badges[statusLower] || badges['scheduled'];
    return <span className={`ds-status-badge ${badge.class}`}>{badge.icon}{badge.text}</span>;
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
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading interviews...</h4>
      </div>
    );
  }

  return (
    <div className="ds-company-interviews">
      <div className="ds-container">
        <div className="ds-page-header">
          <div className="ds-header-left">
            <div className="ds-header-icon-wrapper"><FaCalendarAlt className="ds-header-icon" /></div>
            <div><h1>Interview Management</h1><p>Schedule, manage and provide feedback for interviews</p></div>
          </div>
          <div className="ds-header-actions">
            <Link to="/company/applicants" className="ds-btn ds-btn-outline-primary"><FaUsers /> View Applicants</Link>
            <button className="ds-refresh-btn" onClick={fetchInterviews}><FaSyncAlt /> Refresh</button>
          </div>
        </div>

        {interviews.length > 0 && (
          <div className="ds-stats-grid">
            <div className="ds-stat-card"><div className="ds-stat-icon"><FaCalendarAlt /></div><div><span className="ds-stat-value">{stats.total}</span><span>Total</span></div></div>
            <div className="ds-stat-card"><div className="ds-stat-icon"><FaClock /></div><div><span className="ds-stat-value">{stats.scheduled}</span><span>Scheduled</span></div></div>
            <div className="ds-stat-card"><div className="ds-stat-icon"><FaCheckCircle /></div><div><span className="ds-stat-value">{stats.completed}</span><span>Completed</span></div></div>
            <div className="ds-stat-card"><div className="ds-stat-icon"><FaTimesCircle /></div><div><span className="ds-stat-value">{stats.cancelled}</span><span>Cancelled</span></div></div>
          </div>
        )}

        <div className="ds-filters-card">
          <div className="ds-filters-row">
            <div className="ds-filter-group">
              <label>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Interviews</option>
                <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="ds-filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Sort by Date</option><option value="student">Sort by Student</option>
              </select>
            </div>
            <div className="ds-results-info"><p>Showing <strong>{filteredInterviews.length}</strong> of <strong>{interviews.length}</strong> interviews</p></div>
          </div>
        </div>

        {filteredInterviews.length === 0 ? (
          <div className="ds-empty-state">
            <FaCalendarAlt className="ds-empty-icon" />
            <h3>No Interviews Found</h3>
            <Link to="/company/applicants" className="ds-btn ds-btn-primary">View Applicants</Link>
          </div>
        ) : (
          <div className="ds-interviews-grid">
            {filteredInterviews.map(interview => (
              <div key={interview._id} className="ds-interview-card">
                <div className="ds-card-header">
                  <div className="ds-student-info">
                    <div className="ds-student-avatar">{interview.studentId?.userId?.name?.charAt(0).toUpperCase() || 'S'}</div>
                    <div><h3>{interview.studentId?.userId?.name}</h3><p>{interview.studentId?.userId?.email}</p></div>
                  </div>
                  {getStatusBadge(interview.status)}
                </div>
                <div className="ds-card-body">
                  <h4>{interview.jobId?.title}</h4>
                  <div className="ds-interview-details">
                    <div className="ds-detail-item"><FaCalendarAlt /><div><span>Date & Time</span><strong>{formatDate(interview.scheduledDate)}</strong></div></div>
                    <div className="ds-detail-item">{getModeIcon(interview.mode)}<div><span>Mode</span><strong>{interview.mode}</strong></div></div>
                    {interview.duration && <div className="ds-detail-item"><FaClock /><div><span>Duration</span><strong>{interview.duration} min</strong></div></div>}
                  </div>
                  {interview.meetingLink && (
                    <div className="ds-meeting-link"><FaVideo /><a href={interview.meetingLink} target="_blank">Join Meeting <FaExternalLinkAlt /></a></div>
                  )}
                  {interview.notes && (
                    <div className="ds-notes"><FaInfoCircle /><div><span>Notes</span><p>{interview.notes}</p></div></div>
                  )}
                  {interview.feedback && (
                    <div className="ds-feedback-preview"><FaStar /><div><span>Feedback</span><p>Rating: {interview.feedback.rating}/5</p><p>{interview.feedback.recommendation}</p></div></div>
                  )}
                </div>
                <div className="ds-card-footer">
                  {(!interview.feedback || Object.keys(interview.feedback).length === 0) && interview.status?.toLowerCase() !== 'cancelled' && interview.status?.toLowerCase() !== 'completed' && (
                    <button className="ds-btn ds-btn-primary" onClick={() => { setSelectedInterview(interview); setShowFeedbackModal(true); }}><FaStar /> Add Feedback</button>
                  )}
                  {(interview.status?.toLowerCase() === 'scheduled' || interview.status?.toLowerCase() === 'confirmed') && (
                    <>
                      <button className="ds-btn ds-btn-outline-primary" onClick={() => { setSelectedInterview(interview); setShowRescheduleModal(true); }}><FaClock /> Reschedule</button>
                      <button className="ds-btn ds-btn-danger" onClick={() => { setSelectedInterview(interview); setShowCancelModal(true); }}><FaTimesCircle /> Cancel</button>
                    </>
                  )}
                  <button className="ds-btn ds-btn-link" onClick={() => navigate(`/company/applicant/${interview.applicationId?._id || interview.applicationId}`)}>View Application <FaArrowRight /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedInterview && (
        <div className="ds-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-danger"><FaTimesCircle /><h3>Cancel Interview</h3><button className="ds-modal-close" onClick={() => setShowCancelModal(false)}><FaTimes /></button></div>
            <div className="ds-modal-body">
              <p>Are you sure you want to cancel this interview?</p>
              <div className="ds-interview-preview"><h4>{selectedInterview.studentId?.userId?.name}</h4><p>{selectedInterview.jobId?.title}</p><small>{formatDate(selectedInterview.scheduledDate)}</small></div>
              <div className="ds-form-group"><label>Reason *</label><textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows="3" /></div>
            </div>
            <div className="ds-modal-footer"><button className="ds-btn ds-btn-secondary" onClick={() => setShowCancelModal(false)}>Cancel</button><button className="ds-btn ds-btn-danger" onClick={handleCancel} disabled={cancelling}>{cancelling ? <FaSpinner className="ds-spin" /> : 'Confirm Cancel'}</button></div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedInterview && (
        <div className="ds-modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-info"><FaClock /><h3>Reschedule Interview</h3><button className="ds-modal-close" onClick={() => setShowRescheduleModal(false)}><FaTimes /></button></div>
            <div className="ds-modal-body">
              <div className="ds-interview-preview"><h4>{selectedInterview.studentId?.userId?.name}</h4><p>{selectedInterview.jobId?.title}</p><small>Current: {formatDate(selectedInterview.scheduledDate)}</small></div>
              <div className="ds-form-group"><label>New Date & Time *</label><input type="datetime-local" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} /></div>
              <div className="ds-form-group"><label>Reason *</label><textarea value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} rows="3" /></div>
            </div>
            <div className="ds-modal-footer"><button className="ds-btn ds-btn-secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</button><button className="ds-btn ds-btn-primary" onClick={handleReschedule} disabled={rescheduling}>{rescheduling ? <FaSpinner className="ds-spin" /> : 'Confirm Reschedule'}</button></div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedInterview && (
        <div className="ds-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-success"><FaStar /><h3>Interview Feedback</h3><button className="ds-modal-close" onClick={() => setShowFeedbackModal(false)}><FaTimes /></button></div>
            <div className="ds-modal-body">
              <div className="ds-interview-preview"><h4>{selectedInterview.studentId?.userId?.name}</h4><p>{selectedInterview.jobId?.title}</p></div>
              <div className="ds-form-group"><label>Rating *</label><div className="ds-rating-input">{[1,2,3,4,5].map(star => (<button key={star} className={star <= feedbackData.rating ? 'ds-star-active' : ''} onClick={() => setFeedbackData({...feedbackData, rating: star})}>{star <= feedbackData.rating ? <FaStar /> : <FaRegStar />}</button>))}</div></div>
              <div className="ds-form-group"><label>Comments *</label><textarea value={feedbackData.comments} onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})} rows="4" /></div>
              <div className="ds-form-row"><div className="ds-form-group"><label>Strengths</label><input type="text" value={feedbackData.strengths} onChange={(e) => setFeedbackData({...feedbackData, strengths: e.target.value})} placeholder="Technical skills, Communication" /></div><div className="ds-form-group"><label>Areas to Improve</label><input type="text" value={feedbackData.weaknesses} onChange={(e) => setFeedbackData({...feedbackData, weaknesses: e.target.value})} placeholder="Experience, Technical depth" /></div></div>
              <div className="ds-form-group"><label>Recommendation *</label><select value={feedbackData.recommendation} onChange={(e) => setFeedbackData({...feedbackData, recommendation: e.target.value})}><option value="Hire">Hire</option><option value="Second Interview">Second Interview</option><option value="Reject">Reject</option><option value="Pending">Pending</option></select></div>
            </div>
            <div className="ds-modal-footer"><button className="ds-btn ds-btn-secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</button><button className="ds-btn ds-btn-primary" onClick={handleSubmitFeedback} disabled={submitting}>{submitting ? <FaSpinner className="ds-spin" /> : 'Submit Feedback'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyInterviews;