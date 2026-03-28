import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaDollarSign,
  FaClock,
  FaBuilding,
  FaGlobe,
  FaGraduationCap,
  FaCode,
  FaHeart,
  FaRegHeart,
  FaCalendarAlt,
  FaUsers,
  FaEye,
  FaShare,
  FaFileAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUpload,
  FaFilePdf,
  FaFileWord,
  FaTrash,
  FaTimes,
  FaSpinner,
  FaArrowLeft,
  FaStar,
  FaRegStar,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaEnvelope,
  FaWhatsapp,
  FaDownload,
  FaPlus
} from 'react-icons/fa';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);
  
  // CV related states
  const [userCVs, setUserCVs] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [showCVUploadModal, setShowCVUploadModal] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const [fetchingCVs, setFetchingCVs] = useState(false);
  const [deletingCV, setDeletingCV] = useState(false);
  const [ensuringProfile, setEnsuringProfile] = useState(false);
  const [profileCreationAttempted, setProfileCreationAttempted] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    checkAuthAndFetchData();
  }, [id]);

  useEffect(() => {
    if (showApplyForm && user?.role === 'student') {
      ensureStudentProfileAndFetchCVs();
    }
  }, [showApplyForm]);

  const checkAuthAndFetchData = () => {
    const token = localStorage.getItem('token');
    if (token && user?.role === 'student') {
      checkIfSaved();
      checkIfApplied();
    }
  };

  const ensureStudentProfileAndFetchCVs = async () => {
    setEnsuringProfile(true);
    setProfileCreationAttempted(false);
    try {
      await ensureStudentProfile();
      await fetchUserCVs();
    } catch (error) {
      console.error('Error ensuring student profile:', error);
      toast.error('Please complete your student profile before applying.');
      setShowApplyForm(false);
    } finally {
      setEnsuringProfile(false);
    }
  };

  const ensureStudentProfile = async (retry = true) => {
    try {
      const response = await API.get('/students/profile');
      if (response.data.success) {
        return true;
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Student profile not found, creating one...');
        try {
          const createResponse = await API.post('/students/profile', {});
          if (createResponse.data.success) {
            console.log('Student profile created successfully');
            return true;
          }
        } catch (createError) {
          console.error('Failed to create student profile:', createError);
          if (retry) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return ensureStudentProfile(false);
          }
          throw new Error('Could not create student profile');
        }
      }
      throw error;
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/jobs/${id}`);
      if (response.data.success) {
        setJob(response.data.job);
        if (response.data.job.category) {
          fetchSimilarJobs(response.data.job.category);
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      if (error.response?.status === 404) {
        toast.error('Job not found');
        navigate('/student/jobs');
      } else {
        toast.error('Failed to load job details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarJobs = async (category) => {
    try {
      const response = await API.get(`/jobs?category=${category}&limit=3`);
      if (response.data.success) {
        const similar = response.data.jobs.filter(j => j._id !== id);
        setSimilarJobs(similar);
      }
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await API.get('/students/saved-jobs');
      if (response.data.success) {
        const savedJobs = response.data.savedJobs || [];
        setSaved(savedJobs.some(job => job._id === id));
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  // ========== MODIFIED ==========
  const checkIfApplied = async () => {
    try {
      const response = await API.get('/applications/student');
      if (response.data.success) {
        const applications = response.data.applications || [];
        // Only consider applications that are NOT Withdrawn or Rejected
        const activeApplications = applications.filter(app => 
          app.status !== 'Withdrawn' && app.status !== 'Rejected'
        );
        setHasApplied(activeApplications.some(app => app.jobId?._id === id));
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };
  // ========== END MODIFIED ==========

  const fetchUserCVs = async () => {
    setFetchingCVs(true);
    try {
      const response = await API.get('/cv');
      if (response.data.success) {
        setUserCVs(response.data.cvs || []);
        if (response.data.cvs && response.data.cvs.length > 0) {
          const primaryCV = response.data.cvs.find(cv => cv.isPrimary);
          setSelectedCV(primaryCV?._id || response.data.cvs[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching CVs:', error);
      if (error.response?.status === 404) {
        toast.info('No CV found. Please upload your first CV.');
      } else {
        toast.error('Failed to load your CVs');
      }
    } finally {
      setFetchingCVs(false);
    }
  };

  const handleSaveJob = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Please login to save jobs');
      navigate('/login', { state: { from: `/student/job/${id}` } });
      return;
    }

    if (user?.role !== 'student') {
      toast.info('Only students can save jobs');
      return;
    }

    try {
      if (saved) {
        await API.delete(`/students/saved-jobs/${id}`);
        setSaved(false);
        toast.success('Job removed from saved');
      } else {
        await API.post(`/students/saved-jobs/${id}`);
        setSaved(true);
        toast.success('Job saved successfully');
      }
    } catch (error) {
      console.error('Error toggling save job:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to update saved jobs');
      }
    }
  };

  const handleApplyClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Please login to apply for jobs');
      navigate('/login', { state: { from: `/student/job/${id}` } });
      return;
    }

    if (user?.role !== 'student') {
      toast.info('Only students can apply for jobs');
      return;
    }

    if (hasApplied) {
      toast.info('You have already applied for this job');
      return;
    }

    setShowApplyForm(true);
  };

  const handleCVFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload PDF or Word document only');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setCvFile(file);
    setCvFileName(file.name);
  };

  const handleCVUpload = async () => {
    if (!cvFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploadingCV(true);
    const formData = new FormData();
    formData.append('cv', cvFile);

    try {
      const response = await API.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('CV uploaded successfully');
        setShowCVUploadModal(false);
        setCvFile(null);
        setCvFileName('');
        await ensureStudentProfileAndFetchCVs();
      }
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error(error.response?.data?.message || 'Failed to upload CV');
    } finally {
      setUploadingCV(false);
    }
  };

  const handleDeleteCV = async (cvId) => {
    if (!window.confirm('Are you sure you want to delete this CV?')) return;
    
    setDeletingCV(true);
    try {
      const response = await API.delete(`/cv/${cvId}`);
      if (response.data.success) {
        toast.success('CV deleted successfully');
        if (selectedCV === cvId) {
          setSelectedCV(null);
        }
        await fetchUserCVs();
      }
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Failed to delete CV');
    } finally {
      setDeletingCV(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }

    try {
      await ensureStudentProfile();
    } catch (error) {
      console.error('Profile creation failed:', error);
      toast.error('Unable to create your student profile. Please try again later.');
      setShowApplyForm(false);
      return;
    }

    if (userCVs.length === 0) {
      toast.error('Please upload a CV first');
      setShowCVUploadModal(true);
      return;
    }

    if (!selectedCV) {
      toast.error('Please select a CV to apply with');
      return;
    }

    setApplying(true);

    try {
      const response = await API.post('/applications', {
        jobId: id,
        coverLetter: coverLetter.trim(),
        cvId: selectedCV
      });

      if (response.data.success) {
        toast.success('Application submitted successfully!');
        setHasApplied(true);
        setShowApplyForm(false);
        setCoverLetter('');
        
        setJob(prev => ({
          ...prev,
          applications: (prev.applications || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        
        if (status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          navigate('/login');
        } else if (status === 400 && message?.includes('already applied')) {
          toast.error('You have already applied for this job');
          setHasApplied(true);
        } else if (status === 404 && message?.includes('Student not found')) {
          toast.info('Completing your profile...');
          try {
            await ensureStudentProfile();
            const retryResponse = await API.post('/applications', {
              jobId: id,
              coverLetter: coverLetter.trim(),
              cvId: selectedCV
            });
            if (retryResponse.data.success) {
              toast.success('Application submitted successfully!');
              setHasApplied(true);
              setShowApplyForm(false);
              setCoverLetter('');
              setJob(prev => ({ ...prev, applications: (prev.applications || 0) + 1 }));
            }
          } catch (retryError) {
            toast.error('Please complete your student profile first.');
            setShowApplyForm(false);
          }
        } else {
          toast.error(message || 'Failed to apply for job');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Error: ' + error.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleShareJob = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Job link copied to clipboard!');
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return 'Not specified';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
    } else if (salary.min) {
      return `From ${formatter.format(salary.min)}`;
    } else if (salary.max) {
      return `Up to ${formatter.format(salary.max)}`;
    }
    
    return 'Not specified';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="jd-file-icon-pdf" />;
    if (ext === 'doc' || ext === 'docx') return <FaFileWord className="jd-file-icon-word" />;
    return <FaFileAlt className="jd-file-icon-default" />;
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
      <div className="jd-loading-container">
        <div className="jd-spinner"></div>
        <h4>Loading job details...</h4>
        <p>Please wait while we fetch the job information</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="jd-error-container">
        <div className="jd-error-card">
          <FaExclamationTriangle className="jd-error-icon" />
          <h3>Job Not Found</h3>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <Link to="/student/jobs" className="jd-btn jd-btn-primary">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="jd-job-details">
      <div className="jd-job-details-container">
        {/* Navigation */}
        <div className="jd-back-nav">
          <Link to="/student/jobs" className="jd-back-link">
            <FaArrowLeft /> Back to Jobs
          </Link>
        </div>

        <div className="jd-job-details-grid">
          {/* Main Content */}
          <div className="jd-job-main">
            {/* Job Header Card */}
            <div className="jd-job-header-card">
              <div className="jd-job-header-content">
                <div className="jd-company-section">
                  <div className="jd-company-logo-wrapper">
                    {job.companyId?.companyLogo ? (
                      <img 
                        src={job.companyId.companyLogo.startsWith('http') ? job.companyId.companyLogo : `http://localhost:5000${job.companyId.companyLogo}`}
                        alt={job.companyId.companyName}
                        className="jd-company-logo"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="jd-company-logo-placeholder" style={{ display: job.companyId?.companyLogo ? 'none' : 'flex' }}>
                      <FaBuilding />
                    </div>
                  </div>
                  <div className="jd-job-title-section">
                    <h1>{job.title}</h1>
                    <p className="jd-company-name">{job.companyId?.companyName}</p>
                    <div className="jd-job-meta-tags">
                      <span className="jd-meta-tag"><FaMapMarkerAlt /> {job.location?.city || 'Remote'}</span>
                      <span className="jd-meta-tag"><FaBriefcase /> {job.employmentType}</span>
                      <span className="jd-meta-tag"><FaGlobe /> {job.workMode}</span>
                    </div>
                  </div>
                </div>
                
                <div className="jd-job-actions">
                  {user?.role === 'student' && (
                    <button 
                      className={`jd-save-job-btn ${saved ? 'jd-saved' : ''}`}
                      onClick={handleSaveJob}
                      title={saved ? 'Remove from saved' : 'Save job'}
                    >
                      {saved ? <FaHeart /> : <FaRegHeart />}
                      <span>{saved ? 'Saved' : 'Save'}</span>
                    </button>
                  )}
                  <button 
                    className="jd-share-job-btn"
                    onClick={handleShareJob}
                    title="Share job"
                  >
                    <FaShare /> Share
                  </button>
                </div>
              </div>

              {/* Key Stats */}
              <div className="jd-job-stats-grid">
                <div className="jd-stat-item">
                  <FaDollarSign className="jd-stat-icon jd-salary-icon" />
                  <div>
                    <span className="jd-stat-label">Salary</span>
                    <span className="jd-stat-value">{formatSalary(job.salary)}</span>
                  </div>
                </div>
                <div className="jd-stat-item">
                  <FaClock className="jd-stat-icon jd-exp-icon" />
                  <div>
                    <span className="jd-stat-label">Experience</span>
                    <span className="jd-stat-value">{job.experience?.min || 0} - {job.experience?.max || 0} years</span>
                  </div>
                </div>
                <div className="jd-stat-item">
                  <FaUsers className="jd-stat-icon jd-applicants-icon" />
                  <div>
                    <span className="jd-stat-label">Applicants</span>
                    <span className="jd-stat-value">{job.applications || 0}</span>
                  </div>
                </div>
                <div className="jd-stat-item">
                  <FaEye className="jd-stat-icon jd-views-icon" />
                  <div>
                    <span className="jd-stat-label">Views</span>
                    <span className="jd-stat-value">{job.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* Deadline Alert */}
              {job.applicationDeadline && (
                <div className={`jd-deadline-alert ${new Date(job.applicationDeadline) < new Date() ? 'jd-expired' : 'jd-active'}`}>
                  <FaCalendarAlt />
                  <span>
                    <strong>Application Deadline:</strong> {formatDate(job.applicationDeadline)}
                    {new Date(job.applicationDeadline) < new Date() && ' (Expired)'}
                  </span>
                </div>
              )}

              {/* Apply Button or Status */}
              {user?.role === 'student' && !hasApplied && !showApplyForm && (
                <button 
                  className="jd-apply-btn jd-btn-primary"
                  onClick={handleApplyClick}
                  disabled={job.applicationDeadline && new Date(job.applicationDeadline) < new Date()}
                >
                  <FaPaperPlane /> Apply for this Position
                </button>
              )}

              {hasApplied && (
                <div className="jd-applied-alert">
                  <FaCheckCircle />
                  <div>
                    <strong>You have already applied for this job!</strong>
                    <p>Track your application status in <Link to="/student/applied-jobs">My Applications</Link></p>
                  </div>
                </div>
              )}

              {/* Apply Form */}
              {showApplyForm && (
                <div className="jd-apply-form">
                  <div className="jd-apply-form-header">
                    <h3>Apply for this Position</h3>
                    <button className="jd-upload-cv-btn" onClick={() => setShowCVUploadModal(true)}>
                      <FaUpload /> Upload New CV
                    </button>
                  </div>
                  
                  <form onSubmit={handleApplySubmit}>
                    {/* CV Selection */}
                    <div className="jd-form-group">
                      <label className="jd-form-label">Select CV/Resume <span className="jd-required">*</span></label>
                      
                      {ensuringProfile ? (
                        <div className="jd-loading-cvs">
                          <FaSpinner className="jd-spin" /> Loading your profile...
                        </div>
                      ) : fetchingCVs ? (
                        <div className="jd-loading-cvs">
                          <FaSpinner className="jd-spin" /> Loading your CVs...
                        </div>
                      ) : userCVs.length > 0 ? (
                        <div className="jd-cv-list">
                          {userCVs.map((cv) => (
                            <div 
                              key={cv._id} 
                              className={`jd-cv-item ${selectedCV === cv._id ? 'jd-selected' : ''}`}
                              onClick={() => setSelectedCV(cv._id)}
                            >
                              <div className="jd-cv-item-icon">
                                {getFileIcon(cv.filename)}
                              </div>
                              <div className="jd-cv-item-info">
                                <div className="jd-cv-item-name">{cv.filename}</div>
                                <div className="jd-cv-item-meta">
                                  <span>{formatFileSize(cv.fileSize)}</span>
                                  <span>Uploaded: {new Date(cv.uploadedAt).toLocaleDateString()}</span>
                                  {cv.isPrimary && <span className="jd-primary-badge">Primary</span>}
                                </div>
                              </div>
                              <div className="jd-cv-item-actions">
                                <button 
                                  type="button"
                                  className="jd-delete-cv-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCV(cv._id);
                                  }}
                                  disabled={deletingCV}
                                  title="Delete CV"
                                >
                                  <FaTrash />
                                </button>
                                <div className="jd-radio-select">
                                  <input 
                                    type="radio" 
                                    name="cvSelection" 
                                    checked={selectedCV === cv._id}
                                    onChange={() => setSelectedCV(cv._id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="jd-no-cv-warning">
                          <FaExclamationTriangle />
                          <p>No CV found. Please upload your first CV.</p>
                          <button 
                            type="button"
                            className="jd-btn jd-btn-outline-primary"
                            onClick={() => setShowCVUploadModal(true)}
                          >
                            <FaUpload /> Upload CV
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cover Letter */}
                    <div className="jd-form-group">
                      <label className="jd-form-label">Cover Letter <span className="jd-optional">(Optional)</span></label>
                      <textarea
                        className="jd-form-control"
                        rows="5"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Write a brief cover letter explaining why you're a good fit for this position..."
                      />
                      <small className="jd-form-hint">
                        A well-written cover letter increases your chances of getting hired.
                      </small>
                    </div>

                    {/* Form Actions */}
                    <div className="jd-form-actions">
                      <button 
                        type="submit" 
                        className="jd-btn jd-btn-primary"
                        disabled={applying || userCVs.length === 0 || !selectedCV || ensuringProfile}
                      >
                        {applying ? (
                          <>
                            <FaSpinner className="jd-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane /> Submit Application
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="jd-btn jd-btn-outline-secondary"
                        onClick={() => setShowApplyForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="jd-info-card">
              <h3>Job Description</h3>
              <div className="jd-job-description">
                <p>{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="jd-info-card">
                <h3>Requirements</h3>
                <ul className="jd-list-check">
                  {job.requirements.map((req, index) => (
                    <li key={index}><FaCheckCircle /> {req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="jd-info-card">
                <h3>Responsibilities</h3>
                <ul className="jd-list-check">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index}><FaCheckCircle /> {resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="jd-info-card">
                <h3><FaCode /> Required Skills</h3>
                <div className="jd-skills-list">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="jd-skill-badge">
                      {skill.name}
                      {skill.importance && (
                        <span className={`jd-skill-importance jd-${skill.importance.toLowerCase()}`}>
                          {skill.importance}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="jd-info-card">
                <h3>Benefits</h3>
                <div className="jd-benefits-grid">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="jd-benefit-item">
                      <FaHeart /> {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="jd-job-sidebar">
            {/* Company Info */}
            <div className="jd-info-card">
              <h3>About the Company</h3>
              <div className="jd-company-info">
                <h4>{job.companyId?.companyName}</h4>
                {job.companyId?.industry && (
                  <p className="jd-company-industry"><FaBuilding /> {job.companyId.industry}</p>
                )}
                {job.companyId?.description && (
                  <p className="jd-company-description">{job.companyId.description.substring(0, 200)}...</p>
                )}
                {job.companyId?.website && (
                  <a 
                    href={job.companyId.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="jd-company-website"
                  >
                    <FaGlobe /> Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Job Overview */}
            <div className="jd-info-card">
              <h3>Job Overview</h3>
              <div className="jd-overview-list">
                <div className="jd-overview-item">
                  <FaCalendarAlt />
                  <div>
                    <span>Posted Date</span>
                    <strong>{formatDate(job.postedDate || job.createdAt)}</strong>
                  </div>
                </div>
                <div className="jd-overview-item">
                  <FaMapMarkerAlt />
                  <div>
                    <span>Location</span>
                    <strong>{job.location?.city || 'Remote'}, {job.location?.country || ''}</strong>
                  </div>
                </div>
                <div className="jd-overview-item">
                  <FaBriefcase />
                  <div>
                    <span>Job Type</span>
                    <strong>{job.employmentType}</strong>
                  </div>
                </div>
                <div className="jd-overview-item">
                  <FaGlobe />
                  <div>
                    <span>Work Mode</span>
                    <strong>{job.workMode}</strong>
                  </div>
                </div>
                <div className="jd-overview-item">
                  <FaClock />
                  <div>
                    <span>Experience</span>
                    <strong>{job.experience?.min || 0} - {job.experience?.max || 0} years</strong>
                  </div>
                </div>
                {job.education?.level && (
                  <div className="jd-overview-item">
                    <FaGraduationCap />
                    <div>
                      <span>Education</span>
                      <strong>{job.education.level} {job.education.field && `in ${job.education.field}`}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="jd-info-card">
                <h3>Similar Jobs</h3>
                <div className="jd-similar-jobs">
                  {similarJobs.map(similarJob => (
                    <div 
                      key={similarJob._id} 
                      className="jd-similar-job"
                      onClick={() => navigate(`/student/job/${similarJob._id}`)}
                    >
                      <h4>{similarJob.title}</h4>
                      <p className="jd-similar-company">{similarJob.companyId?.companyName}</p>
                      <div className="jd-similar-meta">
                        <span><FaMapMarkerAlt /> {similarJob.location?.city || 'Remote'}</span>
                        <span><FaBriefcase /> {similarJob.employmentType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CV Upload Modal */}
      {showCVUploadModal && (
        <div className="jd-modal-overlay" onClick={() => { setShowCVUploadModal(false); setCvFile(null); setCvFileName(''); }}>
          <div className="jd-modal" onClick={e => e.stopPropagation()}>
            <div className="jd-modal-header">
              <FaUpload className="jd-modal-icon" />
              <h3>Upload CV/Resume</h3>
              <button className="jd-modal-close" onClick={() => { setShowCVUploadModal(false); setCvFile(null); setCvFileName(''); }}>
                <FaTimes />
              </button>
            </div>
            <div className="jd-modal-body">
              <div className="jd-upload-area">
                <input
                  type="file"
                  id="cvFile"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVFileChange}
                  className="jd-file-input"
                />
                <label htmlFor="cvFile" className="jd-upload-label">
                  <FaUpload />
                  <span>Choose File</span>
                </label>
                
                {cvFileName && (
                  <div className="jd-selected-file">
                    {getFileIcon(cvFileName)}
                    <span>{cvFileName}</span>
                    <button className="jd-remove-file" onClick={() => { setCvFile(null); setCvFileName(''); }}>
                      <FaTrash />
                    </button>
                  </div>
                )}
                
                <p className="jd-upload-hint">
                  Supported formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
            </div>
            <div className="jd-modal-footer">
              <button className="jd-btn jd-btn-secondary" onClick={() => { setShowCVUploadModal(false); setCvFile(null); setCvFileName(''); }}>
                Cancel
              </button>
              <button className="jd-btn jd-btn-primary" onClick={handleCVUpload} disabled={uploadingCV || !cvFile}>
                {uploadingCV ? <><FaSpinner className="jd-spin" /> Uploading...</> : <><FaUpload /> Upload CV</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;