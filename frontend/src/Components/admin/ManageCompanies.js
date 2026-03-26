import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaBuilding, 
  FaCheckCircle, 
  FaTimesCircle,
  FaEye,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaExclamationTriangle,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaIndustry,
  FaStar,
  FaTrash,
  FaBan,
  FaUserCheck
} from 'react-icons/fa';

const ManageCompanies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    verified: '',
    status: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    active: 0,
    inactive: 0
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAuthAndFetchCompanies();
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      filterCompanies();
      calculateStats();
    } else {
      // If no companies, reset filtered and stats
      setFilteredCompanies([]);
      setStats({
        total: 0,
        verified: 0,
        pending: 0,
        active: 0,
        inactive: 0
      });
    }
  }, [companies, searchTerm, filters]);

  const checkAuthAndFetchCompanies = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      return;
    }

    if (!user || user.role !== 'admin') {
      setError('Access denied. Admin only.');
      setTimeout(() => navigate('/'), 2000);
      setLoading(false);
      return;
    }

    await fetchCompanies();
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get('/companies');
      
      if (response.data && response.data.success) {
        const companiesData = response.data.companies || [];
        setCompanies(companiesData);
        setFilteredCompanies(companiesData);
        calculateStats(companiesData);
        
        if (companiesData.length === 0) {
          toast.info('No companies found');
        } else {
          toast.success(`Found ${companiesData.length} companies`);
        }
      } else {
        setError(response.data?.message || 'Failed to load companies');
        setCompanies([]);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view companies.');
      } else if (err.response?.status === 404) {
        setCompanies([]);
        toast.info('No companies found');
      } else {
        setError(err.response?.data?.message || 'Failed to load companies. Please try again.');
      }
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company => 
        company.companyName?.toLowerCase().includes(term) ||
        company.industry?.toLowerCase().includes(term) ||
        company.contactEmail?.toLowerCase().includes(term) ||
        company.userId?.email?.toLowerCase().includes(term)
      );
    }

    if (filters.verified) {
      const isVerified = filters.verified === 'verified';
      filtered = filtered.filter(company => company.verified === isVerified);
    }

    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(company => (company.isActive !== false) === isActive);
    }

    setFilteredCompanies(filtered);
  };

  const calculateStats = (data = companies) => {
    const newStats = {
      total: data.length,
      verified: data.filter(c => c.verified).length,
      pending: data.filter(c => !c.verified).length,
      active: data.filter(c => c.isActive !== false).length,
      inactive: data.filter(c => c.isActive === false).length
    };
    setStats(newStats);
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ verified: '', status: '' });
  };
  const handleRefresh = () => fetchCompanies();

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedCompany(null);
  };

  const handleVerifyCompany = async (userId) => {
    if (!userId) {
      toast.error('User ID not found for this company');
      return;
    }
    if (!window.confirm('Are you sure you want to verify this company?')) return;

    setActionLoading(true);
    try {
      const response = await API.put(`/users/${userId}/verify`);
      if (response.data.success) {
        toast.success('Company verified successfully');
        fetchCompanies();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error verifying company:', err);
      toast.error(err.response?.data?.message || 'Failed to verify company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!userId) {
      toast.error('User ID not found for this company');
      return;
    }
    const action = currentStatus === false ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this company?`)) return;

    setActionLoading(true);
    try {
      const response = await API.put(`/users/${userId}/toggle-status`);
      if (response.data.success) {
        toast.success(`Company ${action}d successfully`);
        fetchCompanies();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error toggling company status:', err);
      toast.error(err.response?.data?.message || `Failed to ${action} company`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompany = async (userId) => {
    if (!userId) {
      toast.error('User ID not found for this company');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      const response = await API.delete(`/users/${userId}`);
      if (response.data.success) {
        toast.success('Company deleted successfully');
        fetchCompanies();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error(err.response?.data?.message || 'Failed to delete company');
    } finally {
      setActionLoading(false);
    }
  };

  const getVerificationBadge = (verified) => {
    return verified ? (
      <span className="ds-badge ds-badge-success"><FaCheckCircle /> Verified</span>
    ) : (
      <span className="ds-badge ds-badge-warning"><FaTimesCircle /> Pending</span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive !== false ? (
      <span className="ds-badge ds-badge-success"><FaCheckCircle /> Active</span>
    ) : (
      <span className="ds-badge ds-badge-secondary"><FaBan /> Inactive</span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading companies...</h4>
        <p>Please wait while we fetch the data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ds-error-container">
        <FaExclamationTriangle className="ds-error-icon" />
        <h4 className="ds-error-title">Error Loading Companies</h4>
        <p className="ds-error-message">{error}</p>
        <div className="ds-error-actions">
          <button className="ds-btn ds-btn-primary" onClick={fetchCompanies}>
            <FaSyncAlt /> Try Again
          </button>
          <button className="ds-btn ds-btn-outline" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-manage-companies">
      {/* Header */}
      <div className="ds-page-header">
        <div className="ds-header-left">
          <div className="ds-header-icon-wrapper">
            <FaBuilding />
          </div>
          <div>
            <h1>Manage Companies</h1>
            <p className="ds-header-subtitle">
              {stats.total} companies total ({stats.verified} verified, {stats.pending} pending)
            </p>
          </div>
        </div>
        <button className="ds-icon-btn" onClick={handleRefresh} title="Refresh">
          <FaSyncAlt />
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="ds-stats-grid">
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.total}</h3>
            <p>Total Companies</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-primary"><FaBuilding /></div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-success"><FaCheckCircle /></div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-warning"><FaTimesCircle /></div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-info"><FaUsers /></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="ds-card ds-filters-card">
        <div className="ds-card-body">
          <div className="ds-filters-row">
            <div className="ds-search-wrapper">
              <div className="ds-search-input-group">
                <FaSearch className="ds-search-icon" />
                <input
                  type="text"
                  placeholder="Search by company name, industry, email..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="ds-filter-group">
              <label>Verification</label>
              <select name="verified" value={filters.verified} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="ds-filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className="ds-btn ds-btn-outline-secondary" onClick={clearFilters}>
              <FaTimes /> Clear Filters
            </button>
          </div>
          <div className="ds-results-count">
            Showing <strong>{filteredCompanies.length}</strong> of <strong>{companies.length}</strong> companies
          </div>
        </div>
      </div>

      {/* Companies Table */}
      {filteredCompanies.length === 0 ? (
        <div className="ds-card">
          <div className="ds-card-body ds-empty-state">
            <FaBuilding className="ds-empty-icon" />
            <h3>No Companies Found</h3>
            <p>
              {searchTerm || filters.verified || filters.status
                ? 'No companies match your search criteria.'
                : 'No companies have registered yet.'}
            </p>
            {(searchTerm || filters.verified || filters.status) && (
              <button className="ds-btn ds-btn-outline-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="ds-card">
          <div className="ds-table-responsive">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company._id}>
                    <td>
                      <div className="ds-company-info">
                        <div className="ds-company-avatar">
                          {company.companyName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{company.companyName}</strong>
                          <br />
                          <small className="ds-text-muted">ID: {company._id.slice(-6)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ds-industry-info">
                        <FaIndustry className="ds-icon-sm" />
                        {company.industry || 'Not specified'}
                      </div>
                    </td>
                    <td>
                      <div className="ds-contact-info">
                        {company.contactEmail && (
                          <div><FaEnvelope className="ds-icon-sm" /> {company.contactEmail}</div>
                        )}
                        {company.contactPhone && (
                          <div><FaPhone className="ds-icon-sm" /> {company.contactPhone}</div>
                        )}
                        {company.website && (
                          <div><FaGlobe className="ds-icon-sm" /> 
                            <a href={company.website} target="_blank" rel="noopener noreferrer">
                              {company.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(company.createdAt)}</td>
                    <td>{getVerificationBadge(company.verified)}</td>
                    <td>{getStatusBadge(company.isActive)}</td>
                    <td>
                      <div className="ds-action-buttons">
                        <button
                          className="ds-icon-btn-sm"
                          onClick={() => handleViewCompany(company)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {!company.verified && (
                          <button
                            className="ds-icon-btn-sm ds-success"
                            onClick={() => handleVerifyCompany(company.userId?._id)}
                            title="Verify Company"
                            disabled={actionLoading}
                          >
                            <FaUserCheck />
                          </button>
                        )}
                        <button
                          className="ds-icon-btn-sm ds-danger"
                          onClick={() => handleDeleteCompany(company.userId?._id)}
                          title="Delete Company"
                          disabled={actionLoading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="ds-modal-overlay" onClick={handleCloseModal}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <h3><FaBuilding /> Company Details</h3>
              <button className="ds-modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-company-detail">
                <div className="ds-detail-header">
                  <div className="ds-detail-avatar">
                    {selectedCompany.companyName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ds-detail-info">
                    <h3>{selectedCompany.companyName}</h3>
                    <p>{selectedCompany.industry || 'Industry not specified'}</p>
                    <div className="ds-detail-badges">
                      {getVerificationBadge(selectedCompany.verified)}
                      {getStatusBadge(selectedCompany.isActive)}
                    </div>
                  </div>
                </div>

                <div className="ds-detail-grid">
                  <div className="ds-detail-section">
                    <h4>Contact Information</h4>
                    <p><FaEnvelope /> {selectedCompany.contactEmail || selectedCompany.userId?.email || 'N/A'}</p>
                    <p><FaPhone /> {selectedCompany.contactPhone || 'N/A'}</p>
                    {selectedCompany.website && (
                      <p><FaGlobe /> <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">{selectedCompany.website}</a></p>
                    )}
                  </div>

                  <div className="ds-detail-section">
                    <h4>Company Details</h4>
                    <p><FaIndustry /> Industry: {selectedCompany.industry || 'N/A'}</p>
                    <p><FaUsers /> Size: {selectedCompany.companySize || 'N/A'}</p>
                    <p><FaCalendarAlt /> Founded: {selectedCompany.foundedYear || 'N/A'}</p>
                  </div>

                  {selectedCompany.description && (
                    <div className="ds-detail-section ds-full-width">
                      <h4>About</h4>
                      <p>{selectedCompany.description}</p>
                    </div>
                  )}

                  {selectedCompany.locations && selectedCompany.locations.length > 0 && (
                    <div className="ds-detail-section ds-full-width">
                      <h4>Locations</h4>
                      {selectedCompany.locations.map((loc, idx) => (
                        <div key={idx} className="ds-location-item">
                          <FaMapMarkerAlt />
                          <span>
                            {loc.city}{loc.state ? `, ${loc.state}` : ''}, {loc.country}
                            {loc.isHeadquarters && ' (Headquarters)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ds-detail-section">
                    <h4>Account Information</h4>
                    <p><FaEnvelope /> User Email: {selectedCompany.userId?.email}</p>
                    <p><FaCalendarAlt /> Joined: {formatDate(selectedCompany.createdAt)}</p>
                    <p><FaCalendarAlt /> Last Updated: {formatDate(selectedCompany.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="ds-modal-footer">
              {!selectedCompany.verified && (
                <button
                  className="ds-btn ds-btn-success"
                  onClick={() => handleVerifyCompany(selectedCompany.userId?._id)}
                  disabled={actionLoading}
                >
                  <FaUserCheck /> Verify Company
                </button>
              )}
              <button
                className="ds-btn ds-btn-secondary"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCompanies;