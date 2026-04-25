import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUserGraduate, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,FaSpinner,
  FaBriefcase,
  FaCalendarAlt,
  FaFileAlt,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaStar,
  FaEye,
  FaPaperPlane,
  FaComment,
  FaArrowLeft,
  FaGraduationCap,
  FaCode,
  FaLanguage,
  FaCertificate,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaSave,
  FaEdit
} from 'react-icons/fa';

// Helper to get full image URL
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

const ApplicantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState({
    date: '',
    mode: 'Online',
    link: '',
    address: '',
    notes: ''
  });
  const [feedback, setFeedback] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    checkAuthAndFetchApplication();
  }, [id]);

  const checkAuthAndFetchApplication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    await fetchApplication();
  };

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get(`/applications/${id}`);
      if (response.data.success) {
        const app = response.data.application;
        // Ensure student data is properly extracted
        const studentObj = app.studentId || {};
        const studentUser = studentObj.userId || {};
        const processedApp = {
          ...app,
          studentId: studentObj,
          studentName: studentObj.name || studentUser.name || 'Unknown Applicant',
          studentEmail: studentObj.email || studentUser.email || 'No email',
          studentPhone: studentObj.phoneNumber || studentUser.phoneNumber || '',
          studentProfilePic: studentObj.profilePicture || studentUser.profilePicture,
          jobTitle: app.jobId?.title || 'Unknown Position',
          companyName: app.jobId?.companyId?.companyName || 'Unknown Company'
        };
        setApplication(processedApp);
        
        // Pre-fill interview details if they exist
        if (app.interviewDetails) {
          setInterviewDetails({
            date: app.interviewDetails.date || '',
            mode: app.interviewDetails.mode || 'Online',
            link: app.interviewDetails.link || '',
            address: app.interviewDetails.address || '',
            notes: app.interviewDetails.notes || ''
          });
        }
        if (app.feedback) {
          setFeedback(app.feedback.comments || '');
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        setError('You are not authorized to view this application');
      } else if (error.response?.status === 404) {
        setError('Application not found');
      } else {
        setError(error.response?.data?.message || 'Failed to load application');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await API.put(`/applications/${id}/status`, { status: newStatus });
      if (response.data.success) {
        setApplication(prev => ({
          ...prev,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }));
        toast.success(`Application status updated to ${newStatus}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewDetails.date) {
      toast.error('Please select interview date and time');
      return;
    }
    try {
      setUpdating(true);
      const response = await API.put(`/applications/${id}/status`, {
        status: 'Interview',
        interviewDetails: {
          ...interviewDetails,
          date: new Date(interviewDetails.date).toISOString()
        }
      });
      if (response.data.success) {
        setApplication(prev => ({
          ...prev,
          status: 'Interview',
          interviewDetails: { ...interviewDetails, date: new Date(interviewDetails.date).toISOString() }
        }));
        setShowInterviewModal(false);
        toast.success('Interview scheduled successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter feedback');
      return;
    }
    try {
      setUpdating(true);
      const response = await API.put(`/applications/${id}/status`, {
        feedback: {
          comments: feedback,
          providedBy: user?.id,
          providedDate: new Date().toISOString()
        }
      });
      if (response.data.success) {
        setApplication(prev => ({
          ...prev,
          feedback: { comments: feedback, providedBy: user?.id, providedDate: new Date().toISOString() }
        }));
        setShowFeedbackModal(false);
        toast.success('Feedback submitted successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadResume = () => {
    if (application?.resume?.path) {
      window.open(getFullImageUrl(application.resume.path), '_blank');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { class: 'ad-status-pending', icon: <FaClock />, label: 'Pending' },
      'Reviewed': { class: 'ad-status-reviewed', icon: <FaEye />, label: 'Reviewed' },
      'Shortlisted': { class: 'ad-status-shortlisted', icon: <FaStar />, label: 'Shortlisted' },
      'Interview': { class: 'ad-status-interview', icon: <FaCalendarAlt />, label: 'Interview' },
      'Accepted': { class: 'ad-status-accepted', icon: <FaCheckCircle />, label: 'Accepted' },
      'Rejected': { class: 'ad-status-rejected', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    const badge = badges[status] || badges['Pending'];
    return (
      <span className={`ad-status-badge ${badge.class}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="ad-loading-container">
        <div className="ad-spinner"></div>
        <h4>Loading applicant details...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-error-container">
        <div className="ad-error-card">
          <FaTimesCircle className="ad-error-icon" />
          <h3>Unable to Load Applicant Details</h3>
          <p>{error}</p>
          <div className="ad-error-actions">
            <button className="ad-btn ad-btn-primary" onClick={() => navigate('/company/applicants')}>
              <FaArrowLeft /> Back to Applicants
            </button>
            <button className="ad-btn ad-btn-outline-primary" onClick={fetchApplication}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="ad-error-container">
        <div className="ad-error-card">
          <h3>Application Not Found</h3>
          <p>The application you're looking for doesn't exist.</p>
          <Link to="/company/applicants" className="ad-btn ad-btn-primary">
            Back to Applicants
          </Link>
        </div>
      </div>
    );
  }

  const student = application.studentId || {};
  const studentUser = student.userId || {};

  return (
    <div className="ad-applicant-details">
      <div className="ad-container">
        {/* Header */}
        <div className="ad-page-header">
          <div className="ad-header-left">
            <div className="ad-header-icon-wrapper">
              <FaUserGraduate className="ad-header-icon" />
            </div>
            <div>
              <h1>Applicant Details</h1>
              <p className="ad-header-subtitle">
                Application for: <strong>{application.jobTitle}</strong> at {application.companyName}
              </p>
            </div>
          </div>
          <div className="ad-header-actions">
            <Link to="/company/applicants" className="ad-btn ad-btn-outline-primary">
              <FaArrowLeft /> Back to Applicants
            </Link>
            {getStatusBadge(application.status)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ad-quick-actions">
          <button
            className="ad-action-card"
            onClick={() => handleStatusUpdate('Reviewed')}
            disabled={updating || application.status !== 'Pending'}
          >
            <FaEye className="ad-action-icon" />
            <span>Mark as Reviewed</span>
          </button>
          <button
            className="ad-action-card"
            onClick={() => handleStatusUpdate('Shortlisted')}
            disabled={updating || !['Pending', 'Reviewed'].includes(application.status)}
          >
            <FaStar className="ad-action-icon" />
            <span>Shortlist</span>
          </button>
          <button
            className="ad-action-card"
            onClick={() => setShowInterviewModal(true)}
            disabled={updating || !['Shortlisted', 'Reviewed'].includes(application.status)}
          >
            <FaCalendarAlt className="ad-action-icon" />
            <span>Schedule Interview</span>
          </button>
          <button
            className="ad-action-card"
            onClick={() => setShowFeedbackModal(true)}
            disabled={updating}
          >
            <FaComment className="ad-action-icon" />
            <span>Add Feedback</span>
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="ad-details-grid">
          {/* Left Column - Applicant Info */}
          <div className="ad-left-column">
            {/* Profile Card */}
            <div className="ad-card">
              <div className="ad-card-body ad-profile-card">
                <div className="ad-avatar-large">
                  {application.studentProfilePic ? (
                    <img src={getFullImageUrl(application.studentProfilePic)} alt={application.studentName} />
                  ) : (
                    <FaUserGraduate className="ad-avatar-icon" />
                  )}
                </div>
                <h2>{application.studentName}</h2>
                <p className="ad-email"><FaEnvelope /> {application.studentEmail}</p>
                {application.studentPhone && (
                  <p className="ad-phone"><FaPhone /> {application.studentPhone}</p>
                )}
                <div className="ad-contact-info">
                  <h3>Contact Informations</h3>
                  <div className="ad-info-row">
                    <span>Email:</span>
                    <a href={`mailto:${application.studentEmail}`}>{application.studentEmail}</a>
                  </div>
                  {application.studentPhone && (
                    <div className="ad-info-row">
                      <span>Phone:</span>
                      <a href={`tel:${application.studentPhone}`}>{application.studentPhone}</a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Application Overview */}
            <div className="ad-card">
              <div className="ad-card-header">
                <h2>Application Overview</h2>
              </div>
              <div className="ad-card-body">
                <div className="ad-info-row">
                  <span>Applied:</span>
                  <span>{formatDate(application.appliedDate)}</span>
                </div>
                {application.reviewedDate && (
                  <div className="ad-info-row">
                    <span>Reviewed:</span>
                    <span>{formatDate(application.reviewedDate)}</span>
                  </div>
                )}
                {application.interviewDate && (
                  <div className="ad-info-row">
                    <span>Interview:</span>
                    <span>{formatDate(application.interviewDate)}</span>
                  </div>
                )}
                <div className="ad-info-row">
                  <span>Job:</span>
                  <span>{application.jobTitle}</span>
                </div>
                <div className="ad-info-row">
                  <span>Location:</span>
                  <span>{application.jobId?.location?.city || 'Remote'}, {application.jobId?.location?.country || ''}</span>
                </div>
              </div>
            </div>

            {/* Resume/CV */}
            {application.resume && (
              <div className="ad-card">
                <div className="ad-card-header">
                  <h2><FaFileAlt /> Resume/CV</h2>
                </div>
                <div className="ad-card-body">
                  <div className="ad-resume-item">
                    <FaFileAlt className="ad-resume-icon" />
                    <div>
                      <h4>{application.resume.filename || 'Resume'}</h4>
                      <button className="ad-btn ad-btn-outline-primary" onClick={handleDownloadResume}>
                        <FaDownload /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Detailed Info */}
          <div className="ad-right-column">
            {/* Tabs */}
            <div className="ad-card">
              <div className="ad-tabs">
                <button
                  className={`ad-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <FaUserGraduate /> Profile
                </button>
                <button
                  className={`ad-tab ${activeTab === 'coverLetter' ? 'active' : ''}`}
                  onClick={() => setActiveTab('coverLetter')}
                >
                  <FaFileAlt /> Cover Letter
                </button>
                <button
                  className={`ad-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                  onClick={() => setActiveTab('feedback')}
                >
                  <FaComment /> Feedback
                </button>
                {application.interviewDetails && (
                  <button
                    className={`ad-tab ${activeTab === 'interview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('interview')}
                  >
                    <FaCalendarAlt /> Interview
                  </button>
                )}
              </div>
              <div className="ad-card-body">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="ad-profile-tab">
                    {student.summary && (
                      <div className="ad-section">
                        <h3>Professional Summary</h3>
                        <p>{student.summary}</p>
                      </div>
                    )}

                    {/* Education */}
                    {student.education?.length > 0 && (
                      <div className="ad-section">
                        <h3><FaGraduationCap /> Education</h3>
                        {student.education.map((edu, idx) => (
                          <div key={idx} className="ad-edu-item">
                            <h4>{edu.degree} in {edu.fieldOfStudy}</h4>
                            <p>{edu.institution}</p>
                            <small>
                              {edu.startDate && new Date(edu.startDate).getFullYear()} -
                              {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                              {edu.grade && ` | Grade: ${edu.grade}`}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Experience */}
                    {student.experience?.length > 0 && (
                      <div className="ad-section">
                        <h3><FaBriefcase /> Work Experience</h3>
                        {student.experience.map((exp, idx) => (
                          <div key={idx} className="ad-exp-item">
                            <h4>{exp.jobTitle}</h4>
                            <p>{exp.company} - {exp.location}</p>
                            <small>
                              {new Date(exp.startDate).toLocaleDateString()} -
                              {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                            </small>
                            <p>{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {student.skills?.length > 0 && (
                      <div className="ad-section">
                        <h3><FaCode /> Skills</h3>
                        <div className="ad-skills-list">
                          {student.skills.map((skill, idx) => (
                            <span key={idx} className="ad-skill-tag">
                              {skill.name}
                              {skill.level && <span className="ad-skill-level">{skill.level}</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {student.languages?.length > 0 && (
                      <div className="ad-section">
                        <h3><FaLanguage /> Languages</h3>
                        <div className="ad-languages-list">
                          {student.languages.map((lang, idx) => (
                            <span key={idx} className="ad-language-tag">
                              {lang.language} - {lang.proficiency}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {student.certifications?.length > 0 && (
                      <div className="ad-section">
                        <h3><FaCertificate /> Certifications</h3>
                        {student.certifications.map((cert, idx) => (
                          <div key={idx} className="ad-cert-item">
                            <h4>{cert.name}</h4>
                            <p>{cert.issuingOrganization} • {new Date(cert.issueDate).getFullYear()}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Social Links */}
                    {student.socialLinks && Object.values(student.socialLinks).some(link => link) && (
                      <div className="ad-section">
                        <h3>Social Links</h3>
                        <div className="ad-social-links">
                          {student.socialLinks.linkedin && (
                            <a href={student.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                              <FaLinkedin /> LinkedIn
                            </a>
                          )}
                          {student.socialLinks.github && (
                            <a href={student.socialLinks.github} target="_blank" rel="noopener noreferrer">
                              <FaGithub /> GitHub
                            </a>
                          )}
                          {student.socialLinks.portfolio && (
                            <a href={student.socialLinks.portfolio} target="_blank" rel="noopener noreferrer">
                              <FaGlobe /> Portfolio
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cover Letter Tab */}
                {activeTab === 'coverLetter' && (
                  <div className="ad-cover-letter-tab">
                    {application.coverLetter ? (
                      <div className="ad-cover-letter-content">
                        <p>{application.coverLetter}</p>
                      </div>
                    ) : (
                      <p className="ad-empty-message">No cover letter provided</p>
                    )}
                  </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                  <div className="ad-feedback-tab">
                    {application.feedback ? (
                      <div className="ad-feedback-content">
                        <p>{application.feedback.comments}</p>
                        <small>Provided on {formatDate(application.feedback.providedDate)}</small>
                      </div>
                    ) : (
                      <p className="ad-empty-message">No feedback provided yet</p>
                    )}
                  </div>
                )}

                {/* Interview Tab */}
                {activeTab === 'interview' && application.interviewDetails && (
                  <div className="ad-interview-tab">
                    <div className="ad-interview-details">
                      <div className="ad-info-row">
                        <span>Date & Time:</span>
                        <span>{formatDate(application.interviewDetails.date)}</span>
                      </div>
                      <div className="ad-info-row">
                        <span>Mode:</span>
                        <span>{application.interviewDetails.mode}</span>
                      </div>
                      {application.interviewDetails.mode === 'Online' && application.interviewDetails.link && (
                        <div className="ad-info-row">
                          <span>Meeting Link:</span>
                          <a href={application.interviewDetails.link} target="_blank" rel="noopener noreferrer">
                            {application.interviewDetails.link}
                          </a>
                        </div>
                      )}
                      {application.interviewDetails.mode === 'In-person' && application.interviewDetails.address && (
                        <div className="ad-info-row">
                          <span>Address:</span>
                          <span>{application.interviewDetails.address}</span>
                        </div>
                      )}
                      {application.interviewDetails.notes && (
                        <div className="ad-info-row">
                          <span>Notes:</span>
                          <span>{application.interviewDetails.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Update Buttons */}
            <div className="ad-card">
              <div className="ad-card-header">
                <h2>Quick Status Update</h2>
              </div>
              <div className="ad-card-body">
                <div className="ad-quick-status-buttons">
                  <button
                    className="ad-btn ad-btn-success"
                    onClick={() => handleStatusUpdate('Accepted')}
                    disabled={updating || application.status === 'Accepted'}
                  >
                    <FaCheckCircle /> Accept
                  </button>
                  <button
                    className="ad-btn ad-btn-danger"
                    onClick={() => handleStatusUpdate('Rejected')}
                    disabled={updating || application.status === 'Rejected'}
                  >
                    <FaTimesCircle /> Reject
                  </button>
                  <button
                    className="ad-btn ad-btn-secondary"
                    onClick={() => handleStatusUpdate('Pending')}
                    disabled={updating || application.status === 'Pending'}
                  >
                    <FaClock /> Reset to Pending
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="ad-modal-overlay" onClick={() => setShowInterviewModal(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-modal-header">
              <FaCalendarAlt className="ad-modal-icon" />
              <h3>Schedule Interview</h3>
              <button className="ad-modal-close" onClick={() => setShowInterviewModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="ad-modal-body">
              <div className="ad-form-group">
                <label>Interview Date & Time <span className="ad-required">*</span></label>
                <input
                  type="datetime-local"
                  value={interviewDetails.date}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, date: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="ad-form-group">
                <label>Mode</label>
                <select
                  value={interviewDetails.mode}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, mode: e.target.value })}
                >
                  <option value="Online">Online</option>
                  <option value="In-person">In-person</option>
                </select>
              </div>
              {interviewDetails.mode === 'Online' ? (
                <div className="ad-form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={interviewDetails.link}
                    onChange={(e) => setInterviewDetails({ ...interviewDetails, link: e.target.value })}
                  />
                </div>
              ) : (
                <div className="ad-form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    placeholder="Office address"
                    value={interviewDetails.address}
                    onChange={(e) => setInterviewDetails({ ...interviewDetails, address: e.target.value })}
                  />
                </div>
              )}
              <div className="ad-form-group">
                <label>Additional Notes</label>
                <textarea
                  rows="3"
                  placeholder="Any additional instructions for the candidate..."
                  value={interviewDetails.notes}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="ad-modal-footer">
              <button className="ad-btn ad-btn-secondary" onClick={() => setShowInterviewModal(false)}>
                Cancel
              </button>
              <button className="ad-btn ad-btn-primary" onClick={handleScheduleInterview} disabled={updating}>
                {updating ? <FaSpinner className="ad-spin" /> : 'Schedule Interview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="ad-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-modal-header">
              <FaComment className="ad-modal-icon" />
              <h3>Add Feedback</h3>
              <button className="ad-modal-close" onClick={() => setShowFeedbackModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="ad-modal-body">
              <div className="ad-form-group">
                <label>Feedback Comments</label>
                <textarea
                  rows="5"
                  placeholder="Provide your feedback about this candidate..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>
            <div className="ad-modal-footer">
              <button className="ad-btn ad-btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                Cancel
              </button>
              <button className="ad-btn ad-btn-primary" onClick={handleSubmitFeedback} disabled={updating}>
                {updating ? <FaSpinner className="ad-spin" /> : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDetails;