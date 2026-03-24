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
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, mostViewed, mostApplicants
  
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
      const response = await API.delete(`/jobs/${jobToDelete._id}`);
      
      if (response.data.success) {
        toast.success('Job deleted successfully');
        fetchJobs();
        fetchStats();
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
        return <span className="badge bg-success"><FaCheckCircle className="me-1" /> Active</span>;
      case 'closed':
        return <span className="badge bg-secondary"><FaTimesCircle className="me-1" /> Closed</span>;
      case 'draft':
        return <span className="badge bg-warning text-dark"><FaFileAlt className="me-1" /> Draft</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
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
      <div className="loading-spinner text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your jobs...</p>
      </div>
    );
  }

  return (
    <div className="manage-jobs">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaBriefcase className="me-2 text-primary" />
          Manage Jobs
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/company/post-job')}
        >
          <FaPlus className="me-2" /> Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card stat-card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1">Total Jobs</h6>
                  <h2 className="mb-0">{stats.total || 0}</h2>
                </div>
                <FaBriefcase size={40} className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card stat-card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1">Active Jobs</h6>
                  <h2 className="mb-0">{stats.active || 0}</h2>
                </div>
                <FaCheckCircle size={40} className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card stat-card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1">Total Applicants</h6>
                  <h2 className="mb-0">{formatNumber(stats.totalApplicants || 0)}</h2>
                </div>
                <FaUsers size={40} className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card stat-card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1">Total Views</h6>
                  <h2 className="mb-0">{formatNumber(stats.totalViews || 0)}</h2>
                </div>
                <FaEye size={40} className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search jobs by title or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <select
                className="form-select"
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
            
            <div className="col-md-3 mb-3">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostViewed">Most Viewed</option>
                <option value="mostApplicants">Most Applicants</option>
              </select>
            </div>
            
            <div className="col-md-2 mb-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-2" /> Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {sortedJobs.length === 0 ? (
        <div className="text-center py-5">
          <FaBriefcase size={60} className="text-muted mb-3" />
          <h4>No jobs found</h4>
          <p className="text-muted">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Post your first job to start receiving applications'}
          </p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/company/post-job')}
          >
            <FaPlus className="me-2" /> Post a Job
          </button>
        </div>
      ) : (
        <div className="jobs-list">
          {sortedJobs.map((job) => (
            <div key={job._id} className="card mb-3 job-card">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <div className="d-flex align-items-start">
                      <div className="job-icon bg-light rounded p-3 me-3">
                        <FaBriefcase size={24} className="text-primary" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <h5 className="mb-0 me-3">{job.title}</h5>
                          {getStatusBadge(job.status)}
                        </div>
                        
                        <div className="job-meta mb-2">
                          {job.location?.city && (
                            <span className="me-3 text-muted">
                              <FaMapMarkerAlt className="me-1" size={12} />
                              {job.location.city}, {job.location.country || 'Remote'}
                            </span>
                          )}
                          <span className="me-3 text-muted">
                            <FaClock className="me-1" size={12} />
                            Posted {formatDate(job.postedAt)}
                          </span>
                          {job.employmentType && (
                            <span className="me-3 text-muted">
                              <FaBriefcase className="me-1" size={12} />
                              {job.employmentType}
                            </span>
                          )}
                          {job.salary?.min && (
                            <span className="me-3 text-muted">
                              <FaDollarSign className="me-1" size={12} />
                              {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="job-stats">
                          <span className="badge bg-light text-dark me-2">
                            <FaEye className="me-1" /> {job.viewsCount || 0} views
                          </span>
                          <span className="badge bg-light text-dark me-2">
                            <FaUsers className="me-1" /> {job.applicantsCount || 0} applicants
                          </span>
                          {job.applicationDeadline && (
                            <span className="badge bg-light text-dark">
                              <FaCalendarAlt className="me-1" /> 
                              Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="d-flex justify-content-end align-items-center h-100">
                      <button
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => navigate(`/job/${job._id}`)}
                        title="View Job"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn btn-outline-success btn-sm me-2"
                        onClick={() => navigate(`/company/edit-job/${job._id}`)}
                        title="Edit Job"
                      >
                        <FaEdit />
                      </button>
                      {job.status === 'active' ? (
                        <button
                          className="btn btn-outline-warning btn-sm me-2"
                          onClick={() => handleStatusChange(job._id, 'closed')}
                          title="Close Job"
                        >
                          <FaTimesCircle />
                        </button>
                      ) : job.status === 'closed' ? (
                        <button
                          className="btn btn-outline-success btn-sm me-2"
                          onClick={() => handleStatusChange(job._id, 'active')}
                          title="Reopen Job"
                        >
                          <FaCheckCircle />
                        </button>
                      ) : null}
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteClick(job)}
                        title="Delete Job"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="text-end mt-2">
                      <small className="text-muted">
                        <strong>Applicants:</strong> {job.applicantsCount || 0}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
            </li>
            
            {[...Array(totalPages).keys()].map(num => (
              <li key={num + 1} className={`page-item ${currentPage === num + 1 ? 'active' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(num + 1)}
                >
                  {num + 1}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <FaExclamationTriangle className="me-2" />
                  Delete Job
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this job?</p>
                <p className="fw-bold">{jobToDelete?.title}</p>
                <p className="text-danger small">
                  This action cannot be undone. All applications for this job will also be deleted.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Job'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .stat-card {
          transition: transform 0.3s;
          cursor: pointer;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .job-card {
          transition: all 0.3s;
        }
        .job-card:hover {
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .job-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .job-meta {
          font-size: 0.9rem;
        }
        .job-stats {
          font-size: 0.85rem;
        }
        @media (max-width: 768px) {
          .job-card .col-md-4 .d-flex {
            justify-content: flex-start !important;
            margin-top: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageJobs;