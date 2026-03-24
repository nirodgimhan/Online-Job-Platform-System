import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaSearch, 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaDollarSign,
  FaClock,
  FaHeart,
  FaRegHeart,
  FaFilter,
  FaTimes,
  FaBuilding,
  FaGlobe,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaRegStar,
  FaEye,
  FaCalendarAlt
} from 'react-icons/fa';

const JobSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    employmentType: '',
    workMode: '',
    minSalary: '',
    maxSalary: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchSavedJobs();
    } else {
      setSavedJobs(new Set());
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      if (filters.title) params.append('search', filters.title);
      if (filters.location) params.append('location', filters.location);
      if (filters.employmentType) params.append('employmentType', filters.employmentType);
      if (filters.workMode) params.append('workMode', filters.workMode);
      if (filters.minSalary) params.append('minSalary', filters.minSalary);
      if (filters.maxSalary) params.append('maxSalary', filters.maxSalary);
      if (filters.category) params.append('category', filters.category);
      
      const response = await axios.get(`http://localhost:5000/api/jobs?${params.toString()}`);
      
      if (response.data.success) {
        setJobs(response.data.jobs || []);
        setPagination({
          page: response.data.page || 1,
          pages: response.data.pages || 1,
          total: response.data.total || 0,
          limit: pagination.limit
        });
        
        const uniqueCategories = [...new Set(response.data.jobs.map(job => job.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    if (!user || user.role !== 'student') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/students/saved-jobs', {
        headers: {
          'x-auth-token': token
        }
      });
      if (response.data.success) {
        const savedJobIds = new Set(response.data.savedJobs.map(job => job._id || job));
        setSavedJobs(savedJobIds);
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      title: '',
      location: '',
      employmentType: '',
      workMode: '',
      minSalary: '',
      maxSalary: '',
      category: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSaveJob = async (jobId) => {
    if (!user) {
      toast.warning('Please login to save jobs');
      navigate('/login', { state: { from: '/student/jobs' } });
      return;
    }

    if (user.role !== 'student') {
      toast.error('Only students can save jobs');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    setSavingJobId(jobId);
    
    try {
      if (savedJobs.has(jobId)) {
        const response = await axios.delete(`http://localhost:5000/api/students/saved-jobs/${jobId}`, {
          headers: { 'x-auth-token': token }
        });
        
        if (response.data.success) {
          setSavedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
          toast.success('Job removed from saved');
        }
      } else {
        const response = await axios.post(`http://localhost:5000/api/students/saved-jobs/${jobId}`, {}, {
          headers: { 'x-auth-token': token }
        });
        
        if (response.data.success) {
          setSavedJobs(prev => new Set([...prev, jobId]));
          toast.success('Job saved successfully');
        }
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 404) {
          toast.error('Job not found');
        } else {
          toast.error(error.response.data?.message || 'Failed to update saved jobs');
        }
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check your connection.');
      } else {
        toast.error('Error: ' + error.message);
      }
    } finally {
      setSavingJobId(null);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (jobId) => {
    navigate(`/student/job/${jobId}`);
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
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getCompanyLogo = (company) => {
    if (!company) return null;
    
    if (company.companyLogo) {
      if (company.companyLogo.startsWith('http')) {
        return company.companyLogo;
      }
      return `http://localhost:5000${company.companyLogo}`;
    }
    return null;
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Finding the best jobs for you...</h4>
        <p>Please wait while we search for opportunities</p>
      </div>
    );
  }

  return (
    <div className="ds-job-search">
      <div className="ds-job-search-container">
        {/* Header */}
        <div className="ds-job-search-header">
          <div className="ds-header-left">
            <FaBriefcase className="ds-header-icon" />
            <h1>Find Your Dream Job</h1>
          </div>
          <button 
            className="ds-filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
          </button>
        </div>

        {/* Search and Filters Card */}
        <div className="ds-search-card">
          <div className="ds-search-form">
            <div className="ds-search-row">
              <div className="ds-search-input-group">
                <FaSearch className="ds-input-icon" />
                <input
                  type="text"
                  name="title"
                  placeholder="Job title or keywords"
                  value={filters.title}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="ds-search-input-group">
                <FaMapMarkerAlt className="ds-input-icon" />
                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={filters.location}
                  onChange={handleFilterChange}
                />
              </div>
              <select
                name="employmentType"
                value={filters.employmentType}
                onChange={handleFilterChange}
              >
                <option value="">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Temporary">Temporary</option>
              </select>
              <select
                name="workMode"
                value={filters.workMode}
                onChange={handleFilterChange}
              >
                <option value="">All Work Modes</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Advanced Filters */}
            <div className={`ds-advanced-filters ${showFilters ? 'ds-show' : ''}`}>
              <div className="ds-filter-group">
                <label>Salary Range</label>
                <div className="ds-salary-inputs">
                  <input
                    type="number"
                    name="minSalary"
                    placeholder="Min"
                    value={filters.minSalary}
                    onChange={handleFilterChange}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    name="maxSalary"
                    placeholder="Max"
                    value={filters.maxSalary}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              <div className="ds-filter-group">
                <label>Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button className="ds-clear-filters" onClick={clearFilters}>
                <FaTimes /> Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="ds-results-count">
          <p>Showing <strong>{jobs.length}</strong> of <strong>{pagination.total}</strong> jobs</p>
        </div>

        {/* Job Listings */}
        <div className="ds-jobs-grid">
          {jobs.length === 0 ? (
            <div className="ds-empty-state">
              <FaBriefcase className="ds-empty-icon" />
              <h3>No jobs found</h3>
              <p>Try adjusting your search filters or check back later.</p>
              <button className="ds-btn ds-btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            jobs.map(job => {
              const companyLogo = getCompanyLogo(job.companyId);
              const isSaved = savedJobs.has(job._id);
              
              return (
                <div key={job._id} className="ds-job-card">
                  <div className="ds-job-card-header">
                    <div className="ds-company-info">
                      {companyLogo ? (
                        <img 
                          src={companyLogo} 
                          alt={job.companyId?.companyName}
                          className="ds-company-logo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="ds-company-logo-placeholder" style={{ display: companyLogo ? 'none' : 'flex' }}>
                        <FaBuilding />
                      </div>
                      <div className="ds-job-title-info">
                        <h3>{job.title}</h3>
                        <p className="ds-company-name">{job.companyId?.companyName || 'Unknown Company'}</p>
                      </div>
                    </div>
                    {user?.role === 'student' && (
                      <button 
                        className={`ds-save-btn ${isSaved ? 'ds-saved' : ''}`}
                        onClick={() => handleSaveJob(job._id)}
                        disabled={savingJobId === job._id}
                        title={isSaved ? 'Remove from saved' : 'Save job'}
                      >
                        {savingJobId === job._id ? (
                          <FaSpinner className="ds-spin" />
                        ) : isSaved ? (
                          <FaHeart />
                        ) : (
                          <FaRegHeart />
                        )}
                      </button>
                    )}
                  </div>

                  <p className="ds-job-description">
                    {job.description?.length > 150 
                      ? `${job.description.substring(0, 150)}...` 
                      : job.description}
                  </p>

                  <div className="ds-job-meta">
                    {job.location?.city && (
                      <span className="ds-meta-badge">
                        <FaMapMarkerAlt /> {job.location.city}{job.location.country ? `, ${job.location.country}` : ''}
                      </span>
                    )}
                    <span className="ds-meta-badge">
                      <FaBriefcase /> {job.employmentType || 'Full-time'}
                    </span>
                    <span className="ds-meta-badge">
                      <FaGlobe /> {job.workMode || 'Remote'}
                    </span>
                    {job.salary && (job.salary.min || job.salary.max) && (
                      <span className="ds-meta-badge ds-salary-badge">
                        <FaDollarSign /> {formatSalary(job.salary)}
                      </span>
                    )}
                    <span className="ds-meta-badge">
                      <FaClock /> Posted {formatDate(job.postedAt || job.createdAt)}
                    </span>
                  </div>

                  <div className="ds-job-card-footer">
                    <button 
                      className="ds-btn ds-btn-primary"
                      onClick={() => handleViewDetails(job._id)}
                    >
                      <FaEye /> View Details
                    </button>
                    {job.applicationDeadline && (
                      <span className="ds-deadline">
                        <FaCalendarAlt /> Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="ds-pagination">
            <button
              className={`ds-page-btn ${pagination.page === 1 ? 'ds-disabled' : ''}`}
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <div className="ds-page-numbers">
              {[...Array(pagination.pages).keys()].map(num => {
                const pageNum = num + 1;
                if (
                  pageNum === 1 ||
                  pageNum === pagination.pages ||
                  (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`ds-page-number ${pagination.page === pageNum ? 'ds-active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === pagination.page - 3 ||
                  pageNum === pagination.page + 3
                ) {
                  return (
                    <span key={pageNum} className="ds-page-dots">...</span>
                  );
                }
                return null;
              })}
            </div>
            <button
              className={`ds-page-btn ${pagination.page === pagination.pages ? 'ds-disabled' : ''}`}
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;