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
      
      console.log('📡 Fetching companies...');
      
      const response = await API.get('/companies');
      console.log('✅ Companies response:', response.data);
      
      if (response.data && response.data.success) {
        const companiesData = response.data.companies || [];
        setCompanies(companiesData);
        setFilteredCompanies(companiesData);
        
        if (companiesData.length === 0) {
          toast.info('No companies found');
        } else {
          toast.success(`Found ${companiesData.length} companies`);
        }
      } else {
        setError('Failed to load companies');
      }
    } catch (err) {
      console.error('❌ Error fetching companies:', err);
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.response.status === 403) {
          setError('You are not authorized to view companies.');
        } else if (err.response.status === 404) {
          setCompanies([]);
          toast.info('No companies found');
        } else {
          setError(err.response.data?.message || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check if backend is running.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company => 
        company.companyName?.toLowerCase().includes(term) ||
        company.industry?.toLowerCase().includes(term) ||
        company.userId?.email?.toLowerCase().includes(term) ||
        company.contactEmail?.toLowerCase().includes(term)
      );
    }

    // Apply verification filter
    if (filters.verified) {
      const isVerified = filters.verified === 'verified';
      filtered = filtered.filter(company => company.verified === isVerified);
    }

    // Apply status filter (you may need to add isActive to company model)
    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(company => company.isActive === isActive);
    }

    setFilteredCompanies(filtered);
  };

  const calculateStats = () => {
    const newStats = {
      total: companies.length,
      verified: companies.filter(c => c.verified).length,
      pending: companies.filter(c => !c.verified).length,
      active: companies.filter(c => c.isActive !== false).length,
      inactive: companies.filter(c => c.isActive === false).length
    };
    setStats(newStats);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      verified: '',
      status: ''
    });
  };

  const handleRefresh = () => {
    fetchCompanies();
  };

  const handleRetry = () => {
    fetchCompanies();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedCompany(null);
  };

  const handleVerifyCompany = async (userId) => {
    if (!window.confirm('Are you sure you want to verify this company?')) {
      return;
    }

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
    const action = currentStatus === false ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this company?`)) {
      return;
    }

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
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

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
      <span className="ds-badge ds-badge-success">
        <FaCheckCircle /> Verified
      </span>
    ) : (
      <span className="ds-badge ds-badge-warning">
        <FaTimesCircle /> Pending
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive !== false ? (
      <span className="ds-badge ds-badge-success">
        <FaCheckCircle /> Active
      </span>
    ) : (
      <span className="ds-badge ds-badge-secondary">
        <FaBan /> Inactive
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
          <button className="ds-btn ds-btn-primary" onClick={handleRetry}>
            <FaSyncAlt /> Try Again
          </button>
          <button className="ds-btn ds-btn-outline" onClick={handleGoToLogin}>
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
        <h2>
          <FaBuilding className="ds-header-icon" />
          Manage Companies
        </h2>
        <button className="ds-btn ds-btn-outline-primary" onClick={handleRefresh}>
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="ds-stats-grid">
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.total}</h3>
            <p>Total Companies</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-primary">
            <FaBuilding />
          </div>
        </div>
        
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-success">
            <FaCheckCircle />
          </div>
        </div>
        
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-warning">
            <FaTimesCircle />
          </div>
        </div>
        
        <div className="ds-stat-card">
          <div className="ds-stat-info">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
          <div className="ds-stat-icon ds-stat-icon-info">
            <FaUsers />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="ds-filters-card">
        <div className="ds-filter-row">
          <div className="ds-search-box">
            <FaSearch className="ds-search-icon" />
            <input
              type="text"
              placeholder="Search by company name, industry, email..."
              value={searchTerm}
              onChange={handleSearch}
              className="ds-search-input"
            />
          </div>
          
          <div className="ds-filter-group">
            <select
              name="verified"
              value={filters.verified}
              onChange={handleFilterChange}
              className="ds-filter-select"
            >
              <option value="">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="ds-filter-group">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="ds-filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button className="ds-btn ds-btn-outline" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="ds-results-count">
          Showing <strong>{filteredCompanies.length}</strong> of <strong>{companies.length}</strong> companies
        </div>
      </div>

      {/* Companies Table */}
      {filteredCompanies.length === 0 ? (
        <div className="ds-empty-state">
          <FaBuilding size={50} />
          <h3>No Companies Found</h3>
          <p>{searchTerm || filters.verified || filters.status ? 'No companies match your search criteria.' : 'No companies have registered yet.'}</p>
          {(searchTerm || filters.verified || filters.status) && (
            <button className="ds-btn ds-btn-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="ds-table-container">
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
                      <FaIndustry className="ds-icon" />
                      {company.industry || 'Not specified'}
                    </div>
                  </td>
                  <td>
                    <div className="ds-contact-info">
                      {company.contactEmail && (
                        <div><FaEnvelope className="ds-icon" /> {company.contactEmail}</div>
                      )}
                      {company.contactPhone && (
                        <div><FaPhone className="ds-icon" /> {company.contactPhone}</div>
                      )}
                      {company.website && (
                        <div><FaGlobe className="ds-icon" /> 
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
                        className="ds-btn ds-btn-sm ds-btn-outline-info"
                        onClick={() => handleViewCompany(company)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {!company.verified && (
                        <button
                          className="ds-btn ds-btn-sm ds-btn-outline-success"
                          onClick={() => handleVerifyCompany(company.userId?._id)}
                          title="Verify Company"
                        >
                          <FaUserCheck />
                        </button>
                      )}
                      <button
                        className="ds-btn ds-btn-sm ds-btn-outline-danger"
                        onClick={() => handleDeleteCompany(company.userId?._id)}
                        title="Delete Company"
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
      )}

      {/* Company Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-lg">
            <div className="ds-modal-header">
              <h5><FaBuilding /> Company Details</h5>
              <button className="ds-btn-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-company-details">
                <div className="ds-details-header">
                  <div className="ds-details-avatar">
                    {selectedCompany.companyName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ds-details-title">
                    <h3>{selectedCompany.companyName}</h3>
                    <p>{selectedCompany.industry || 'Industry not specified'}</p>
                    <div className="ds-details-badges">
                      {getVerificationBadge(selectedCompany.verified)}
                      {getStatusBadge(selectedCompany.isActive)}
                    </div>
                  </div>
                </div>

                <div className="ds-details-grid">
                  <div className="ds-details-section">
                    <h6>Contact Information</h6>
                    <p><FaEnvelope /> {selectedCompany.contactEmail || selectedCompany.userId?.email || 'N/A'}</p>
                    <p><FaPhone /> {selectedCompany.contactPhone || 'N/A'}</p>
                    {selectedCompany.website && (
                      <p><FaGlobe /> <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">{selectedCompany.website}</a></p>
                    )}
                  </div>

                  <div className="ds-details-section">
                    <h6>Company Details</h6>
                    <p><FaIndustry /> Industry: {selectedCompany.industry || 'N/A'}</p>
                    <p><FaUsers /> Size: {selectedCompany.companySize || 'N/A'}</p>
                    <p><FaCalendarAlt /> Founded: {selectedCompany.foundedYear || 'N/A'}</p>
                  </div>

                  {selectedCompany.description && (
                    <div className="ds-details-section ds-full-width">
                      <h6>About</h6>
                      <p>{selectedCompany.description}</p>
                    </div>
                  )}

                  {selectedCompany.locations && selectedCompany.locations.length > 0 && (
                    <div className="ds-details-section ds-full-width">
                      <h6>Locations</h6>
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

                  <div className="ds-details-section">
                    <h6>Account Information</h6>
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
                className="ds-btn ds-btn-outline-secondary"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ds-manage-companies {
          width: 100%;
        }

        .ds-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .ds-page-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.8rem;
          color: #2d3748;
        }

        .ds-header-icon {
          color: #667eea;
        }

        .ds-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .ds-filters-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .ds-filter-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .ds-search-box {
          flex: 2;
          min-width: 250px;
          position: relative;
        }

        .ds-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
        }

        .ds-search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
        }

        .ds-filter-group {
          flex: 1;
          min-width: 150px;
        }

        .ds-filter-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          background: white;
        }

        .ds-results-count {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          color: #a0aec0;
        }

        .ds-table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .ds-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ds-table th {
          background: #f7fafc;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #2d3748;
          border-bottom: 2px solid #e2e8f0;
        }

        .ds-table td {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }

        .ds-table tr:hover {
          background: #f7fafc;
        }

        .ds-company-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ds-company-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .ds-industry-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ds-contact-info {
          font-size: 0.9rem;
        }

        .ds-contact-info div {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .ds-contact-info a {
          color: #667eea;
          text-decoration: none;
        }

        .ds-contact-info a:hover {
          text-decoration: underline;
        }

        .ds-icon {
          color: #667eea;
          width: 14px;
        }

        .ds-action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .ds-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .ds-badge-success {
          background: #c6f6d5;
          color: #22543d;
        }

        .ds-badge-warning {
          background: #feebc8;
          color: #7b341e;
        }

        .ds-badge-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .ds-badge-info {
          background: #bee3f8;
          color: #1e3a8a;
        }

        /* Modal Styles */
        .ds-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1rem;
        }

        .ds-modal {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .ds-modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ds-modal-header h5 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1.2rem;
        }

        .ds-btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #a0aec0;
          padding: 0.25rem;
          line-height: 1;
        }

        .ds-modal-body {
          padding: 1.5rem;
        }

        .ds-modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .ds-company-details .ds-details-header {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .ds-details-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
          font-weight: 600;
        }

        .ds-details-title h3 {
          margin: 0 0 0.25rem;
          font-size: 1.5rem;
        }

        .ds-details-title p {
          color: #a0aec0;
          margin: 0 0 0.5rem;
        }

        .ds-details-badges {
          display: flex;
          gap: 0.5rem;
        }

        .ds-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .ds-details-section {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
        }

        .ds-details-section.ds-full-width {
          grid-column: span 2;
        }

        .ds-details-section h6 {
          margin: 0 0 0.75rem;
          color: #2d3748;
          font-size: 1rem;
          font-weight: 600;
        }

        .ds-details-section p {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.5rem 0;
          color: #4a5568;
          word-break: break-all;
        }

        .ds-location-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
        }

        .ds-location-item svg {
          color: #667eea;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .ds-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .ds-filter-row {
            flex-direction: column;
          }

          .ds-search-box,
          .ds-filter-group {
            width: 100%;
          }

          .ds-table {
            min-width: 800px;
          }

          .ds-details-grid {
            grid-template-columns: 1fr;
          }

          .ds-details-section.ds-full-width {
            grid-column: span 1;
          }

          .ds-details-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .ds-stats-grid {
            grid-template-columns: 1fr;
          }

          .ds-action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageCompanies;