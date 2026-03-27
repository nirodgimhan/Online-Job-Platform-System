import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaClock, 
  FaUsers, 
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaChartBar,
  FaFileAlt,
  FaDollarSign,
  FaCalendarAlt
} from 'react-icons/fa';

const ManageJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    draft: 0,
    totalApplicants: 0,
    totalViews: 0
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [limit] = useState(10);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [currentPage, statusFilter, sortBy]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      let url = `/companies/jobs?page=${currentPage}&limit=${limit}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      const response = await API.get(url);
      
      if (response.data.success) {
        setJobs(response.data.jobs);
        setTotalPages(response.data.pages);
        setTotalJobs(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/companies/jobs/stats/overview');
      
      if (response.data.success) {
        setStats(response.data.stats.jobs);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    setDeleting(true);
    try {
      // Correct endpoint for deleting a job (company route)
      const response = await API.delete(`/jobs/${jobToDelete._id}`);
      
      if (response.data.success) {
        toast.success('Job deleted successfully');
        fetchJobs();
        fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(error.response?.data?.message || 'Failed to delete job');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setJobToDelete(null);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const response = await API.put(`/companies/jobs/${jobId}/status`, { status: newStatus });
      
      if (response.data.success) {
        toast.success(`Job ${newStatus} successfully`);
        fetchJobs();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error(error.response?.data?.message || 'Failed to update job status');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="mj-badge mj-badge-success"><FaCheckCircle className="mj-icon-sm" /> Active</span>;
      case 'closed':
        return <span className="mj-badge mj-badge-secondary"><FaTimesCircle className="mj-icon-sm" /> Closed</span>;
      case 'draft':
        return <span className="mj-badge mj-badge-warning"><FaFileAlt className="mj-icon-sm" /> Draft</span>;
      default:
        return <span className="mj-badge mj-badge-secondary">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      return job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             job.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             job.location?.country?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.postedAt) - new Date(a.postedAt);
      case 'oldest':
        return new Date(a.postedAt) - new Date(b.postedAt);
      case 'mostViewed':
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      case 'mostApplicants':
        return (b.applicantsCount || 0) - (a.applicantsCount || 0);
      default:
        return 0;
    }
  });

  if (loading && jobs.length === 0) {
    return (
      <div className="mj-loading-container">
        <div className="mj-spinner"></div>
        <p>Loading your jobs...</p>
      </div>
    );
  }

  return (
    <div className="mj-manage-jobs">
      {/* Header */}
      <div className="mj-header">
        <h2 className="mj-title">
          <FaBriefcase className="mj-title-icon" />
          Manage Jobs
        </h2>
        <button 
          className="mj-btn mj-btn-primary"
          onClick={() => navigate('/company/post-job')}
        >
          <FaPlus className="mj-icon" /> Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mj-stats-grid">
        <div className="mj-stat-card mj-stat-total">
          <div className="mj-stat-content">
            <div className="mj-stat-label">Total Jobs</div>
            <div className="mj-stat-value">{stats.total || 0}</div>
          </div>
          <div className="mj-stat-icon">
            <FaBriefcase />
          </div>
        </div>
        
        <div className="mj-stat-card mj-stat-active">
          <div className="mj-stat-content">
            <div className="mj-stat-label">Active Jobs</div>
            <div className="mj-stat-value">{stats.active || 0}</div>
          </div>
          <div className="mj-stat-icon">
            <FaCheckCircle />
          </div>
        </div>
        
        <div className="mj-stat-card mj-stat-applicants">
          <div className="mj-stat-content">
            <div className="mj-stat-label">Total Applicants</div>
            <div className="mj-stat-value">{formatNumber(stats.totalApplicants || 0)}</div>
          </div>
          <div className="mj-stat-icon">
            <FaUsers />
          </div>
        </div>
        
        <div className="mj-stat-card mj-stat-views">
          <div className="mj-stat-content">
            <div className="mj-stat-label">Total Views</div>
            <div className="mj-stat-value">{formatNumber(stats.totalViews || 0)}</div>
          </div>
          <div className="mj-stat-icon">
            <FaEye />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mj-filters-card">
        <div className="mj-filters-row">
          <div className="mj-search-wrapper">
            <div className="mj-search-input-group">
              <FaSearch className="mj-search-icon" />
              <input
                type="text"
                placeholder="Search jobs by title or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mj-form-control"
              />
            </div>
          </div>
          
          <div className="mj-filter-group">
            <select
              className="mj-form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <div className="mj-filter-group">
            <select
              className="mj-form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="mostViewed">Most Viewed</option>
              <option value="mostApplicants">Most Applicants</option>
            </select>
          </div>
          
          <div className="mj-filter-group">
            <button
              className="mj-btn mj-btn-outline-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="mj-icon" /> Filters
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {sortedJobs.length === 0 ? (
        <div className="mj-empty-state">
          <FaBriefcase className="mj-empty-icon" />
          <h3>No jobs found</h3>
          <p>
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Post your first job to start receiving applications'}
          </p>
          <button 
            className="mj-btn mj-btn-primary"
            onClick={() => navigate('/company/post-job')}
          >
            <FaPlus className="mj-icon" /> Post a Job
          </button>
        </div>
      ) : (
        <div className="mj-jobs-list">
          {sortedJobs.map((job) => (
            <div key={job._id} className="mj-job-card">
              <div className="mj-job-card-body">
                <div className="mj-job-card-row">
                  <div className="mj-job-main">
                    <div className="mj-job-icon">
                      <FaBriefcase />
                    </div>
                    <div className="mj-job-info">
                      <div className="mj-job-header">
                        <h5 className="mj-job-title">{job.title}</h5>
                        {getStatusBadge(job.status)}
                      </div>
                      
                      <div className="mj-job-meta">
                        {job.location?.city && (
                          <span>
                            <FaMapMarkerAlt className="mj-icon-sm" />
                            {job.location.city}, {job.location.country || 'Remote'}
                          </span>
                        )}
                        <span>
                          <FaClock className="mj-icon-sm" />
                          Posted {formatDate(job.postedAt)}
                        </span>
                        {job.employmentType && (
                          <span>
                            <FaBriefcase className="mj-icon-sm" />
                            {job.employmentType}
                          </span>
                        )}
                        {job.salary?.min && (
                          <span>
                            <FaDollarSign className="mj-icon-sm" />
                            {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="mj-job-stats">
                        <span className="mj-stat-badge">
                          <FaEye className="mj-icon-sm" /> {job.viewsCount || 0} views
                        </span>
                        <span className="mj-stat-badge">
                          <FaUsers className="mj-icon-sm" /> {job.applicantsCount || 0} applicants
                        </span>
                        {job.applicationDeadline && (
                          <span className="mj-stat-badge">
                            <FaCalendarAlt className="mj-icon-sm" /> 
                            Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mj-job-actions">
                    <button
                      className="mj-action-btn mj-action-view"
                      onClick={() => navigate(`/job/${job._id}`)}
                      title="View Job"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="mj-action-btn mj-action-edit"
                      onClick={() => navigate(`/company/edit-job/${job._id}`)}
                      title="Edit Job"
                    >
                      <FaEdit />
                    </button>
                    {job.status === 'active' ? (
                      <button
                        className="mj-action-btn mj-action-close"
                        onClick={() => handleStatusChange(job._id, 'closed')}
                        title="Close Job"
                      >
                        <FaTimesCircle />
                      </button>
                    ) : job.status === 'closed' ? (
                      <button
                        className="mj-action-btn mj-action-reopen"
                        onClick={() => handleStatusChange(job._id, 'active')}
                        title="Reopen Job"
                      >
                        <FaCheckCircle />
                      </button>
                    ) : null}
                    <button
                      className="mj-action-btn mj-action-delete"
                      onClick={() => handleDeleteClick(job)}
                      title="Delete Job"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mj-pagination">
          <button
            className={`mj-page-btn ${currentPage === 1 ? 'mj-disabled' : ''}`}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <FaChevronLeft /> Previous
          </button>
          <div className="mj-page-numbers">
            {[...Array(totalPages).keys()].map(num => (
              <button
                key={num + 1}
                className={`mj-page-number ${currentPage === num + 1 ? 'mj-active' : ''}`}
                onClick={() => setCurrentPage(num + 1)}
              >
                {num + 1}
              </button>
            ))}
          </div>
          <button
            className={`mj-page-btn ${currentPage === totalPages ? 'mj-disabled' : ''}`}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next <FaChevronRight />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="mj-modal-overlay">
          <div className="mj-modal">
            <div className="mj-modal-header mj-modal-header-danger">
              <FaExclamationTriangle className="mj-modal-icon" />
              <h3>Delete Job</h3>
              <button className="mj-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="mj-modal-body">
              <p>Are you sure you want to delete this job?</p>
              <p className="mj-job-preview">{jobToDelete?.title}</p>
              <p className="mj-warning-text">
                This action cannot be undone. All applications for this job will also be deleted.
              </p>
            </div>
            <div className="mj-modal-footer">
              <button
                className="mj-btn mj-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="mj-btn mj-btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <FaSpinner className="mj-spin" /> Deleting...
                  </>
                ) : (
                  'Delete Job'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;