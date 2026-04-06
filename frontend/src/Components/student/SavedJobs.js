import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaHeart, FaBriefcase, FaMapMarkerAlt, FaClock, FaDollarSign,
  FaBuilding, FaTrash, FaSearch, FaFilter, FaEye, FaCalendarAlt,
  FaSpinner, FaExclamationTriangle, FaChevronLeft, FaChevronRight,
  FaTimes
} from 'react-icons/fa';

const getBaseUrl = () => process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getBaseUrl()}${path}`;
};

const StudentSavedJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [limit] = useState(10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSavedJobs();
  }, [currentPage, sortBy]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const url = `/students/saved-jobs?page=${currentPage}&limit=${limit}&sort=${sortBy}`;
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

  const handleViewJob = (jobId) => navigate(`/job/${jobId}`);
  const handleApply = (jobId) => navigate(`/job/${jobId}`);

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
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: salary.currency || 'USD', minimumFractionDigits: 0 });
    if (salary.min && salary.max) return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
    if (salary.min) return `From ${formatter.format(salary.min)}`;
    if (salary.max) return `Up to ${formatter.format(salary.max)}`;
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
      <div className="ssj-loading-container">
        <div className="ssj-spinner"></div>
        <h4>Loading your saved jobs...</h4>
      </div>
    );
  }

  return (
    <div className="ssj-saved-jobs">
      <div className="ssj-container">
        {/* Combined Header + Filters Card */}
        <div className="ssj-filters-card">
          {/* Header part */}
          <div className="ssj-card-header">
            <div className="ssj-header-left">
              <div className="ssj-header-icon-wrapper">
                <FaHeart className="ssj-header-icon" />
              </div>
              <div>
                <h1>Saved Jobs</h1>
                <p className="ssj-header-subtitle">Jobs you've saved for later</p>
              </div>
            </div>
            <div className="ssj-stat-badge">
              <FaHeart className="ssj-stat-icon" />
              <span className="ssj-stat-number">{totalJobs}</span>
              <span className="ssj-stat-label">{totalJobs === 1 ? 'Job' : 'Jobs'} Saved</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="ssj-search-wrapper">
            <div className="ssj-search-input-group">
              <FaSearch className="ssj-search-icon" />
              <input
                type="text"
                placeholder="Search by job title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="ssj-clear-search" onClick={() => setSearchQuery('')}>
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
          
          {/* Filters row */}
          <div className="ssj-filters-row">
            <div className="ssj-filter-group">
              <label>Job Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            
            <div className="ssj-filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="company">Company Name</option>
                <option value="title">Job Title</option>
              </select>
            </div>

            <button 
              className="ssj-clear-filters-btn"
              onClick={() => { setSearchQuery(''); setFilterType('all'); setSortBy('newest'); }}
            >
              <FaFilter /> Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="ssj-results-info">
          <p>
            Showing <strong>{sortedJobs.length}</strong> of <strong>{totalJobs}</strong> saved jobs
            {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
          </p>
        </div>

        {/* Jobs List */}
        {sortedJobs.length === 0 ? (
          <div className="ssj-empty-state">
            <div className="ssj-empty-icon-wrapper">
              <FaHeart className="ssj-empty-icon" />
            </div>
            <h3>No saved jobs found</h3>
            <p>
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your filters to see more results' 
                : 'Start saving jobs you\'re interested in to see them here'}
            </p>
            <button className="ssj-btn ssj-btn-primary" onClick={() => navigate('/jobs')}>
              Browse Jobs
            </button>
          </div>
        ) : (
          <>
            <div className="ssj-jobs-grid">
              {sortedJobs.map((job) => (
                <div key={job._id} className="ssj-job-card">
                  {/* LEFT: Logo */}
                  <div className="ssj-card-logo">
                    {job.companyId?.companyLogo ? (
                      <img src={getFullImageUrl(job.companyId.companyLogo)} alt={job.companyId.companyName} />
                    ) : (
                      <div className="ssj-logo-placeholder"><FaBuilding /></div>
                    )}
                  </div>

                  {/* RIGHT: Content */}
                  <div className="ssj-card-content">
                    <div className="ssj-card-header-section">
                      <div className="ssj-job-title-section">
                        <h3 className="ssj-job-title">
                          <button onClick={() => handleViewJob(job._id)}>{job.title}</button>
                        </h3>
                        <p className="ssj-company-name">{job.companyId?.companyName}</p>
                        <div className="ssj-job-meta">
                          <span className="ssj-meta-badge"><FaBriefcase /> {job.employmentType || 'Full-time'}</span>
                          {job.location?.city && <span className="ssj-meta-badge"><FaMapMarkerAlt /> {job.location.city}{job.location.country ? `, ${job.location.country}` : ''}</span>}
                          <span className="ssj-meta-badge ssj-salary-badge"><FaDollarSign /> {formatSalary(job.salary)}</span>
                          <span className="ssj-meta-badge"><FaClock /> Posted {formatDate(job.postedAt)}</span>
                        </div>
                      </div>
                      <div className="ssj-card-actions-top">
                        <button className="ssj-remove-btn" onClick={() => handleRemoveClick(job)} disabled={removingId === job._id} title="Remove from saved">
                          {removingId === job._id ? <FaSpinner className="ssj-spin" /> : <FaTrash />}
                        </button>
                      </div>
                    </div>

                    {/* Job Description */}
                    {job.description && (
                      <div className="ssj-job-description">
                        <p>{job.description.length > 120 ? `${job.description.substring(0, 120)}...` : job.description}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="ssj-skills-list">
                        {job.skills.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="ssj-skill-tag">{typeof skill === 'string' ? skill : skill.name}</span>
                        ))}
                        {job.skills.length > 4 && <span className="ssj-skill-tag ssj-more-skills">+{job.skills.length - 4} more</span>}
                      </div>
                    )}

                    {/* Bottom Row: Actions + Deadline */}
                    <div className="ssj-card-bottom-row">
                      <div className="ssj-job-actions">
                        <button className="ssj-action-btn ssj-view-btn" onClick={() => handleViewJob(job._id)}><FaEye /> View</button>
                        <button className="ssj-action-btn ssj-apply-btn" onClick={() => handleApply(job._id)}>Apply Now</button>
                      </div>

                      {job.applicationDeadline && (
                        <div className={`ssj-deadline ${new Date(job.applicationDeadline) < new Date() ? 'ssj-expired' : ''}`}>
                          <FaCalendarAlt />
                          <span>
                            {new Date(job.applicationDeadline) < new Date() ? 'Expired: ' : 'Deadline: '}
                            {new Date(job.applicationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
              <div className="ssj-pagination">
                <button className={`ssj-page-btn ${currentPage === 1 ? 'ssj-disabled' : ''}`} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  <FaChevronLeft /> Previous
                </button>
                <div className="ssj-page-numbers">
                  {[...Array(totalPages).keys()].map(num => {
                    const pageNum = num + 1;
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                      return (
                        <button key={pageNum} className={`ssj-page-number ${currentPage === pageNum ? 'ssj-active' : ''}`} onClick={() => setCurrentPage(pageNum)}>
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                      return <span key={pageNum} className="ssj-page-dots">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button className={`ssj-page-btn ${currentPage === totalPages ? 'ssj-disabled' : ''}`} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                  Next <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && jobToDelete && (
        <div className="ssj-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="ssj-modal" onClick={e => e.stopPropagation()}>
            <div className="ssj-modal-header ssj-modal-danger">
              <FaExclamationTriangle className="ssj-modal-icon" />
              <h3>Remove Saved Job</h3>
              <button className="ssj-modal-close" onClick={() => setShowDeleteModal(false)}><FaTimes /></button>
            </div>
            <div className="ssj-modal-body">
              <p>Are you sure you want to remove this job from your saved list?</p>
              <div className="ssj-job-preview">
                <h4>{jobToDelete.title}</h4>
                <p className="ssj-company-preview">{jobToDelete.companyId?.companyName}</p>
              </div>
              <div className="ssj-warning-text"><FaExclamationTriangle /> This action cannot be undone.</div>
            </div>
            <div className="ssj-modal-footer">
              <button className="ssj-btn ssj-btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button className="ssj-btn ssj-btn-danger" onClick={handleConfirmRemove} disabled={deleting}>
                {deleting ? <><FaSpinner className="ssj-spin" /> Removing...</> : 'Remove Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSavedJobs;