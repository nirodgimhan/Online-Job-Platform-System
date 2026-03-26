import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaHeart, 
  FaRegHeart,
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaClock, 
  FaDollarSign,
  FaBuilding,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaCalendarAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaExternalLinkAlt,
  FaStar,
  FaRegStar,
  FaFileAlt
} from 'react-icons/fa';

// Helper to get base URL from environment or fallback
const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

// Helper to get full profile picture URL
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getBaseUrl()}${path}`;
};

const StudentSavedJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [limit] = useState(10);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Confirm delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSavedJobs();
  }, [currentPage, sortBy]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      
      let url = `/students/saved-jobs?page=${currentPage}&limit=${limit}&sort=${sortBy}`;
      const response = await API.get(url);
      
      if (response.data.success) {
        setSavedJobs(response.data.savedJobs || []);
        setTotalPages(response.data.pages || 1);
        setTotalJobs(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      toast.error('Failed to load saved jobs');
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (jobId) => {
    setRemovingId(jobId);
    try {
      const response = await API.delete(`/students/saved-jobs/${jobId}`);
      
      if (response.data.success) {
        setSavedJobs(savedJobs.filter(job => job._id !== jobId));
        toast.success('Job removed from saved');
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
      toast.error('Failed to remove job');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveClick = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!jobToDelete) return;
    
    setDeleting(true);
    await handleRemoveSaved(jobToDelete._id);
    setDeleting(false);
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const handleViewJob = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const handleApply = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return 'Not specified';
    if (salary.isNegotiable) return 'Negotiable';
    if (salary.min && salary.max) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: salary.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
    }
    if (salary.min) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: salary.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `From ${formatter.format(salary.min)}`;
    }
    if (salary.max) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: salary.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `Up to ${formatter.format(salary.max)}`;
    }
    return 'Not specified';
  };

  const filteredJobs = savedJobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || job.employmentType === filterType;
    
    return matchesSearch && matchesType;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.savedAt || b.postedAt) - new Date(a.savedAt || a.postedAt);
      case 'oldest':
        return new Date(a.savedAt || a.postedAt) - new Date(b.savedAt || b.postedAt);
      case 'company':
        return (a.companyId?.companyName || '').localeCompare(b.companyId?.companyName || '');
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });

  if (loading && savedJobs.length === 0) {
    return (
      <div className="saved-loading-container">
        <div className="saved-spinner"></div>
        <h4>Loading your saved jobs...</h4>
        <p>Please wait while we fetch your saved opportunities</p>
      </div>
    );
  }

  return (
    <div className="saved-saved-jobs">
      <div className="saved-saved-jobs-container">
        {/* Header Section */}
        <div className="saved-page-header">
          <div className="saved-header-left">
            <div className="saved-header-icon-wrapper">
              <FaHeart className="saved-header-icon" />
            </div>
            <div>
              <h1>Saved Jobs</h1>
              <p className="saved-header-subtitle">Jobs you've saved for later</p>
            </div>
          </div>
          <div className="saved-header-stats">
            <div className="saved-stat-badge">
              <FaHeart className="saved-stat-icon" />
              <span className="saved-stat-number">{totalJobs}</span>
              <span className="saved-stat-label">{totalJobs === 1 ? 'Job' : 'Jobs'} Saved</span>
            </div>
          </div>
        </div>

        {/* Search and Filters Card */}
        <div className="saved-filters-card">
          <div className="saved-filters-content">
            <div className="saved-search-wrapper">
              <div className="saved-search-input-group">
                <FaSearch className="saved-search-icon" />
                <input
                  type="text"
                  placeholder="Search by job title, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="saved-clear-search" onClick={() => setSearchQuery('')}>
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
            
            <div className="saved-filters-row">
              <div className="saved-filter-group">
                <label>Job Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              
              <div className="saved-filter-group">
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="company">Company Name</option>
                  <option value="title">Job Title</option>
                </select>
              </div>

              <button 
                className="saved-clear-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setSortBy('newest');
                }}
                title="Clear all filters"
              >
                <FaFilter /> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="saved-results-info">
          <p>
            Showing <strong>{sortedJobs.length}</strong> of <strong>{totalJobs}</strong> saved jobs
            {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
          </p>
        </div>

        {/* Jobs List */}
        {sortedJobs.length === 0 ? (
          <div className="saved-empty-state">
            <div className="saved-empty-icon-wrapper">
              <FaHeart className="saved-empty-icon" />
            </div>
            <h3>No saved jobs found</h3>
            <p>
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your filters to see more results' 
                : 'Start saving jobs you\'re interested in to see them here'}
            </p>
            <button 
              className="saved-btn saved-btn-primary saved-btn-lg"
              onClick={() => navigate('/jobs')}
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <>
            <div className="saved-jobs-grid">
              {sortedJobs.map((job) => (
                <div key={job._id} className="saved-job-card">
                  <div className="saved-job-card-header">
                    <div className="saved-company-logo-wrapper">
                      {job.companyId?.companyLogo ? (
                        <img 
                          src={getFullImageUrl(job.companyId.companyLogo)}
                          alt={job.companyId.companyName}
                          className="saved-company-logo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="saved-company-logo-placeholder" style={{ display: job.companyId?.companyLogo ? 'none' : 'flex' }}>
                        <FaBuilding />
                      </div>
                      <div className="saved-save-date">
                        <FaCalendarAlt />
                        <span>Saved {formatDate(job.savedAt)}</span>
                      </div>
                    </div>

                    <div className="saved-job-info">
                      <h3 className="saved-job-title">
                        <button onClick={() => handleViewJob(job._id)}>
                          {job.title}
                        </button>
                      </h3>
                      <p className="saved-company-name">{job.companyId?.companyName}</p>
                      
                      {/* Job Description */}
                      {job.description && (
                        <p className="saved-job-description">
                          {job.description.length > 120 
                            ? `${job.description.substring(0, 120)}...` 
                            : job.description}
                        </p>
                      )}
                      
                      <div className="saved-job-meta">
                        <span className="saved-meta-badge">
                          <FaBriefcase /> {job.employmentType || 'Full-time'}
                        </span>
                        {job.location?.city && (
                          <span className="saved-meta-badge">
                            <FaMapMarkerAlt /> {job.location.city}{job.location.country ? `, ${job.location.country}` : ''}
                          </span>
                        )}
                        <span className="saved-meta-badge saved-salary-badge">
                          <FaDollarSign /> {formatSalary(job.salary)}
                        </span>
                        <span className="saved-meta-badge">
                          <FaClock /> Posted {formatDate(job.postedAt)}
                        </span>
                      </div>

                      {job.skills && job.skills.length > 0 && (
                        <div className="saved-skills-list">
                          {job.skills.slice(0, 4).map((skill, index) => (
                            <span key={index} className="saved-skill-tag">
                              {typeof skill === 'string' ? skill : skill.name}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="saved-skill-tag saved-more-skills">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* NEW WRAPPER: bottom row with buttons and deadline */}
                    <div className="saved-card-bottom-row">
                      <div className="saved-job-actions">
                        <button 
                          className="saved-action-btn saved-view-btn"
                          onClick={() => handleViewJob(job._id)}
                          title="View Details"
                        >
                          <FaEye /> View
                        </button>
                        <button 
                          className="saved-action-btn saved-apply-btn"
                          onClick={() => handleApply(job._id)}
                          title="Apply Now"
                        >
                          Apply Now
                        </button>
                        <button 
                          className="saved-action-btn saved-remove-btn"
                          onClick={() => handleRemoveClick(job)}
                          disabled={removingId === job._id}
                          title="Remove from saved"
                        >
                          {removingId === job._id ? (
                            <FaSpinner className="saved-spin" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>

                      {job.applicationDeadline && (
                        <div className={`saved-deadline ${new Date(job.applicationDeadline) < new Date() ? 'saved-expired' : ''}`}>
                          <FaCalendarAlt />
                          <span>
                            {new Date(job.applicationDeadline) < new Date() ? 'Expired: ' : 'Deadline: '}
                            {new Date(job.applicationDeadline).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="saved-pagination">
                <button
                  className={`saved-page-btn ${currentPage === 1 ? 'saved-disabled' : ''}`}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft /> Previous
                </button>
                
                <div className="saved-page-numbers">
                  {[...Array(totalPages).keys()].map(num => {
                    const pageNum = num + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          className={`saved-page-number ${currentPage === pageNum ? 'saved-active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 3 ||
                      pageNum === currentPage + 3
                    ) {
                      return <span key={pageNum} className="saved-page-dots">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  className={`saved-page-btn ${currentPage === totalPages ? 'saved-disabled' : ''}`}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="saved-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="saved-modal" onClick={e => e.stopPropagation()}>
              <div className="saved-modal-header saved-modal-danger">
                <FaExclamationTriangle className="saved-modal-icon" />
                <h3>Remove Saved Job</h3>
                <button className="saved-modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="saved-modal-body">
                <p>Are you sure you want to remove this job from your saved list?</p>
                <div className="saved-job-preview">
                  <h4>{jobToDelete?.title}</h4>
                  <p className="saved-company-preview">{jobToDelete?.companyId?.companyName}</p>
                </div>
                <p className="saved-warning-text">This action cannot be undone.</p>
              </div>
              <div className="saved-modal-footer">
                <button
                  className="saved-btn saved-btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="saved-btn saved-btn-danger"
                  onClick={handleConfirmRemove}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <FaSpinner className="saved-spin" /> Removing...
                    </>
                  ) : (
                    'Remove Job'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSavedJobs;