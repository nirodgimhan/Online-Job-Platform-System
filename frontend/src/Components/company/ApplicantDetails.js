import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUserGraduate, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
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
      
      console.log('Fetching application details for ID:', id);
      
      const response = await API.get(`/applications/${id}`);
      console.log('Application response:', response.data);
      
      if (response.data.success) {
        setApplication(response.data.application);
        
        // Pre-fill interview details if they exist
        if (response.data.application.interviewDetails) {
          setInterviewDetails({
            date: response.data.application.interviewDetails.date || '',
            mode: response.data.application.interviewDetails.mode || 'Online',
            link: response.data.application.interviewDetails.link || '',
            address: response.data.application.interviewDetails.address || '',
            notes: response.data.application.interviewDetails.notes || ''
          });
        }
        
        // Pre-fill feedback if it exists
        if (response.data.application.feedback) {
          setFeedback(response.data.application.feedback.comments || '');
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/login');
        } else if (error.response.status === 403) {
          setError('You are not authorized to view this application');
          toast.error('Not authorized');
        } else if (error.response.status === 404) {
          setError('Application not found');
          toast.error('Application not found');
        } else {
          setError(error.response.data?.message || 'Failed to load application');
          toast.error(error.response.data?.message || 'Failed to load application');
        }
      } else if (error.request) {
        setError('No response from server. Please check your connection.');
        toast.error('No response from server. Please check your connection.');
      } else {
        setError('Error: ' + error.message);
        toast.error('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      
      const response = await API.put(`/applications/${id}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setApplication(prev => ({
          ...prev,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }));
        toast.success(`Application status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
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
          interviewDetails: interviewDetails,
          updatedAt: new Date().toISOString()
        }));
        setShowInterviewModal(false);
        toast.success('Interview scheduled successfully');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
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
          feedback: {
            comments: feedback,
            providedBy: user?.id,
            providedDate: new Date().toISOString()
          }
        }));
        setShowFeedbackModal(false);
        toast.success('Feedback submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadResume = () => {
    if (application?.resume?.path) {
      window.open(`http://localhost:5000/${application.resume.path}`, '_blank');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { class: 'bg-warning text-dark', icon: <FaClock /> },
      'Reviewed': { class: 'bg-info text-white', icon: <FaEye /> },
      'Shortlisted': { class: 'bg-primary text-white', icon: <FaStar /> },
      'Interview': { class: 'bg-success text-white', icon: <FaCalendarAlt /> },
      'Accepted': { class: 'bg-success text-white', icon: <FaCheckCircle /> },
      'Rejected': { class: 'bg-danger text-white', icon: <FaTimesCircle /> }
    };
    
    const badge = badges[status] || { class: 'bg-secondary text-white', icon: <FaClock /> };
    
    return (
      <span className={`badge ${badge.class} p-2`}>
        <span className="me-1">{badge.icon}</span>
        {status}
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
      <div className="loading-spinner text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading applicant details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body text-center p-5">
            <div className="mb-4">
              <FaTimesCircle className="text-danger" size={60} />
            </div>
            <h3 className="mb-3">Unable to Load Applicant Details</h3>
            <p className="text-muted mb-4">{error}</p>
            <div className="d-flex justify-content-center gap-3">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/company/applicants')}
              >
                <FaArrowLeft className="me-2" /> Back to Applicants
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={fetchApplication}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body text-center p-5">
            <h3>Application Not Found</h3>
            <p className="text-muted">The application you're looking for doesn't exist.</p>
            <Link to="/company/applicants" className="btn btn-primary mt-3">
              Back to Applicants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const student = application.studentId;
  const job = application.jobId;

  return (
    <div className="applicant-details">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/company/applicants" className="text-decoration-none mb-2 d-block">
            <FaArrowLeft className="me-2" /> Back to Applicants
          </Link>
          <h2 className="mb-1">Applicant Details</h2>
          <p className="text-muted mb-0">
            Application for: <strong>{job?.title}</strong> at {job?.companyId?.companyName}
          </p>
        </div>
        {getStatusBadge(application.status)}
      </div>

      {/* Quick Actions */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <button 
            className="btn btn-outline-primary w-100 py-3"
            onClick={() => handleStatusUpdate('Reviewed')}
            disabled={updating || application.status !== 'Pending'}
          >
            <FaEye className="mb-2" size={20} />
            <div>Mark as Reviewed</div>
          </button>
        </div>
        <div className="col-md-3">
          <button 
            className="btn btn-outline-success w-100 py-3"
            onClick={() => handleStatusUpdate('Shortlisted')}
            disabled={updating || !['Pending', 'Reviewed'].includes(application.status)}
          >
            <FaStar className="mb-2" size={20} />
            <div>Shortlist</div>
          </button>
        </div>
        <div className="col-md-3">
          <button 
            className="btn btn-outline-info w-100 py-3"
            onClick={() => setShowInterviewModal(true)}
            disabled={updating || !['Shortlisted', 'Reviewed'].includes(application.status)}
          >
            <FaCalendarAlt className="mb-2" size={20} />
            <div>Schedule Interview</div>
          </button>
        </div>
        <div className="col-md-3">
          <button 
            className="btn btn-outline-warning w-100 py-3"
            onClick={() => setShowFeedbackModal(true)}
            disabled={updating}
          >
            <FaComment className="mb-2" size={20} />
            <div>Add Feedback</div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Left Column - Applicant Info */}
        <div className="col-lg-4">
          {/* Profile Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-body text-center p-4">
              <div className="applicant-avatar-large bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                   style={{ width: '100px', height: '100px' }}>
                <FaUserGraduate className="text-primary" size={50} />
              </div>
              <h4 className="mb-1">{student?.userId?.name || 'Unknown'}</h4>
              <p className="text-muted mb-3">Applicant ID: {student?._id?.slice(-6) || 'N/A'}</p>
              
              <div className="contact-info text-start">
                <h6 className="mb-3">Contact Information</h6>
                <p className="mb-2">
                  <FaEnvelope className="text-primary me-2" />
                  <a href={`mailto:${student?.userId?.email}`}>{student?.userId?.email || 'N/A'}</a>
                </p>
                {student?.userId?.phoneNumber && (
                  <p className="mb-2">
                    <FaPhone className="text-primary me-2" />
                    <a href={`tel:${student?.userId?.phoneNumber}`}>{student?.userId?.phoneNumber}</a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Application Overview */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Application Overview</h5>
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li className="mb-3">
                  <FaCalendarAlt className="text-primary me-2" />
                  <strong>Applied:</strong> {formatDate(application.appliedDate)}
                </li>
                {application.reviewedDate && (
                  <li className="mb-3">
                    <FaEye className="text-primary me-2" />
                    <strong>Reviewed:</strong> {formatDate(application.reviewedDate)}
                  </li>
                )}
                {application.interviewDate && (
                  <li className="mb-3">
                    <FaCalendarAlt className="text-success me-2" />
                    <strong>Interview:</strong> {formatDate(application.interviewDate)}
                  </li>
                )}
                <li className="mb-3">
                  <FaBriefcase className="text-primary me-2" />
                  <strong>Job:</strong> {job?.title}
                </li>
                <li className="mb-3">
                  <FaMapMarkerAlt className="text-primary me-2" />
                  <strong>Location:</strong> {job?.location?.city || 'Remote'}, {job?.location?.country || ''}
                </li>
              </ul>
            </div>
          </div>

          {/* Resume/CV */}
          {application.resume && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  <FaFileAlt className="me-2 text-primary" />
                  Resume/CV
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FaFileAlt className="text-primary me-3" size={30} />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{application.resume.filename || 'Resume'}</h6>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleDownloadResume}
                    >
                      <FaDownload className="me-2" /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Detailed Info */}
        <div className="col-lg-8">
          {/* Tabs */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <FaUserGraduate className="me-2" /> Profile
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'coverLetter' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coverLetter')}
                  >
                    <FaFileAlt className="me-2" /> Cover Letter
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                  >
                    <FaComment className="me-2" /> Feedback
                  </button>
                </li>
                {application.interviewDetails && (
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'interview' ? 'active' : ''}`}
                      onClick={() => setActiveTab('interview')}
                    >
                      <FaCalendarAlt className="me-2" /> Interview
                    </button>
                  </li>
                )}
              </ul>
            </div>
            <div className="card-body">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="profile-tab">
                  {/* Summary */}
                  {student?.summary && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Professional Summary</h6>
                      <p>{student.summary}</p>
                    </div>
                  )}

                  {/* Education */}
                  {student?.education && student.education.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">
                        <FaGraduationCap className="me-2 text-primary" />
                        Education
                      </h6>
                      {student.education.map((edu, index) => (
                        <div key={index} className="mb-3 pb-3 border-bottom">
                          <h6 className="mb-1">{edu.degree} in {edu.fieldOfStudy}</h6>
                          <p className="text-muted mb-1">{edu.institution}</p>
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
                  {student?.experience && student.experience.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">
                        <FaBriefcase className="me-2 text-primary" />
                        Work Experience
                      </h6>
                      {student.experience.map((exp, index) => (
                        <div key={index} className="mb-3 pb-3 border-bottom">
                          <h6 className="mb-1">{exp.jobTitle}</h6>
                          <p className="text-muted mb-1">{exp.company} - {exp.location}</p>
                          <small className="d-block mb-2">
                            {new Date(exp.startDate).toLocaleDateString()} - 
                            {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                          </small>
                          <p className="small">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {student?.skills && student.skills.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">
                        <FaCode className="me-2 text-primary" />
                        Skills
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {student.skills.map((skill, index) => (
                          <span key={index} className="badge bg-light text-dark p-2">
                            {skill.name}
                            {skill.level && (
                              <span className="ms-2 badge bg-primary">
                                {skill.level}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {student?.languages && student.languages.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">
                        <FaLanguage className="me-2 text-primary" />
                        Languages
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {student.languages.map((lang, index) => (
                          <span key={index} className="badge bg-light text-dark p-2">
                            {lang.language} - {lang.proficiency}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {student?.certifications && student.certifications.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">
                        <FaCertificate className="me-2 text-primary" />
                        Certifications
                      </h6>
                      {student.certifications.map((cert, index) => (
                        <div key={index} className="mb-2">
                          <h6 className="mb-1">{cert.name}</h6>
                          <p className="text-muted small mb-0">
                            {cert.issuingOrganization} • {new Date(cert.issueDate).getFullYear()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Social Links */}
                  {student?.socialLinks && Object.values(student.socialLinks).some(link => link) && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Social Links</h6>
                      <div className="d-flex gap-2">
                        {student.socialLinks.linkedin && (
                          <a href={student.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                            <FaLinkedin className="me-2" /> LinkedIn
                          </a>
                        )}
                        {student.socialLinks.github && (
                          <a href={student.socialLinks.github} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-dark">
                            <FaGithub className="me-2" /> GitHub
                          </a>
                        )}
                        {student.socialLinks.portfolio && (
                          <a href={student.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-success">
                            <FaGlobe className="me-2" /> Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cover Letter Tab */}
              {activeTab === 'coverLetter' && (
                <div className="cover-letter-tab">
                  {application.coverLetter ? (
                    <div>
                      <h6 className="fw-bold mb-3">Cover Letter</h6>
                      <div className="p-4 bg-light rounded">
                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                          {application.coverLetter}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">
                      No cover letter provided
                    </p>
                  )}
                </div>
              )}

              {/* Feedback Tab */}
              {activeTab === 'feedback' && (
                <div className="feedback-tab">
                  {application.feedback ? (
                    <div>
                      <h6 className="fw-bold mb-3">Feedback</h6>
                      <div className="p-4 bg-light rounded">
                        <p className="mb-2">{application.feedback.comments}</p>
                        <small className="text-muted">
                          Provided on {formatDate(application.feedback.providedDate)}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">
                      No feedback provided yet
                    </p>
                  )}
                </div>
              )}

              {/* Interview Tab */}
              {activeTab === 'interview' && application.interviewDetails && (
                <div className="interview-tab">
                  <h6 className="fw-bold mb-3">Interview Details</h6>
                  <div className="p-4 bg-light rounded">
                    <p className="mb-2">
                      <strong>Date & Time:</strong> {formatDate(application.interviewDetails.date)}
                    </p>
                    <p className="mb-2">
                      <strong>Mode:</strong> {application.interviewDetails.mode}
                    </p>
                    {application.interviewDetails.mode === 'Online' && application.interviewDetails.link && (
                      <p className="mb-2">
                        <strong>Meeting Link:</strong>{' '}
                        <a href={application.interviewDetails.link} target="_blank" rel="noopener noreferrer">
                          {application.interviewDetails.link}
                        </a>
                      </p>
                    )}
                    {application.interviewDetails.mode === 'In-person' && application.interviewDetails.address && (
                      <p className="mb-2">
                        <strong>Address:</strong> {application.interviewDetails.address}
                      </p>
                    )}
                    {application.interviewDetails.notes && (
                      <p className="mb-0">
                        <strong>Notes:</strong> {application.interviewDetails.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Status Update */}
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Quick Status Update</h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-4">
                  <button 
                    className="btn btn-outline-success w-100"
                    onClick={() => handleStatusUpdate('Accepted')}
                    disabled={updating || application.status === 'Accepted'}
                  >
                    <FaCheckCircle className="me-2" /> Accept
                  </button>
                </div>
                <div className="col-md-4">
                  <button 
                    className="btn btn-outline-danger w-100"
                    onClick={() => handleStatusUpdate('Rejected')}
                    disabled={updating || application.status === 'Rejected'}
                  >
                    <FaTimesCircle className="me-2" /> Reject
                  </button>
                </div>
                <div className="col-md-4">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => handleStatusUpdate('Pending')}
                    disabled={updating || application.status === 'Pending'}
                  >
                    <FaClock className="me-2" /> Reset to Pending
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Schedule Interview</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowInterviewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={interviewDetails.date}
                    onChange={(e) => setInterviewDetails({ ...interviewDetails, date: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Mode</label>
                  <select
                    className="form-select"
                    value={interviewDetails.mode}
                    onChange={(e) => setInterviewDetails({ ...interviewDetails, mode: e.target.value })}
                  >
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                  </select>
                </div>
                {interviewDetails.mode === 'Online' ? (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Meeting Link</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://meet.google.com/..."
                      value={interviewDetails.link}
                      onChange={(e) => setInterviewDetails({ ...interviewDetails, link: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Office address"
                      value={interviewDetails.address}
                      onChange={(e) => setInterviewDetails({ ...interviewDetails, address: e.target.value })}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-bold">Additional Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Any additional instructions for the candidate..."
                    value={interviewDetails.notes}
                    onChange={(e) => setInterviewDetails({ ...interviewDetails, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowInterviewModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleScheduleInterview}
                  disabled={updating}
                >
                  {updating ? 'Scheduling...' : 'Schedule Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Feedback</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowFeedbackModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Feedback Comments</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Provide your feedback about this candidate..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSubmitFeedback}
                  disabled={updating}
                >
                  {updating ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDetails;