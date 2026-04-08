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
      
      // Step 1: Get all users
      const usersResponse = await API.get('/users');
      if (!usersResponse.data.success) {
        throw new Error(usersResponse.data.message || 'Failed to load users');
      }

      const allUsers = usersResponse.data.users || [];
      const companyUsers = allUsers.filter(u => u.role === 'company');
      
      if (companyUsers.length === 0) {
        setCompanies([]);
        toast.info('No companies found');
        return;
      }

      // Step 2: For each company user, fetch their full profile
      const companyPromises = companyUsers.map(async (companyUser) => {
        try {
          // Fetch company profile from public endpoint
          const profileRes = await API.get(`/companies/public/${companyUser._id}`);
          if (profileRes.data.success && profileRes.data.company) {
            // Merge user data with company profile
            return {
              ...profileRes.data.company,
              userId: {
                ...companyUser,
                _id: companyUser._id,
                name: companyUser.name,
                email: companyUser.email,
                isVerified: companyUser.isVerified,
                isActive: companyUser.isActive
              },
              // Ensure verification status matches user's isVerified (since company.verified might be separate)
              verified: companyUser.isVerified || false,
              isActive: companyUser.isActive !== false,
              createdAt: companyUser.createdAt,
              updatedAt: companyUser.updatedAt,
              // Override contactEmail/Phone if not in profile
              contactEmail: profileRes.data.company.contactEmail || companyUser.email,
              contactPhone: profileRes.data.company.contactPhone || '',
            };
          } else {
            // No profile found – return basic user info
            return {
              _id: companyUser._id,
              companyName: companyUser.name,
              industry: '',
              description: '',
              companySize: '',
              foundedYear: '',
              website: '',
              contactEmail: companyUser.email,
              contactPhone: '',
              locations: [],
              userId: companyUser,
              verified: companyUser.isVerified || false,
              isActive: companyUser.isActive !== false,
              createdAt: companyUser.createdAt,
              updatedAt: companyUser.updatedAt,
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch profile for company ${companyUser._id}:`, err);
          // Return basic info
          return {
            _id: companyUser._id,
            companyName: companyUser.name,
            industry: '',
            description: '',
            companySize: '',
            foundedYear: '',
            website: '',
            contactEmail: companyUser.email,
            contactPhone: '',
            locations: [],
            userId: companyUser,
            verified: companyUser.isVerified || false,
            isActive: companyUser.isActive !== false,
            createdAt: companyUser.createdAt,
            updatedAt: companyUser.updatedAt,
          };
        }
      });

      const companiesData = await Promise.all(companyPromises);
      setCompanies(companiesData);
      
    } catch (err) {
      console.error('Error fetching companies:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view companies.');
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
      <span className="mc-badge mc-badge-success"><FaCheckCircle /> Verified</span>
    ) : (
      <span className="mc-badge mc-badge-warning"><FaTimesCircle /> Pending</span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive !== false ? (
      <span className="mc-badge mc-badge-success"><FaCheckCircle /> Active</span>
    ) : (
      <span className="mc-badge mc-badge-secondary"><FaBan /> Inactive</span>
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
      <div className="mc-loading-container">
        <div className="mc-spinner"></div>
        <h4>Loading companies...</h4>
        <p>Please wait while we fetch the data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mc-error-container">
        <FaExclamationTriangle className="mc-error-icon" />
        <h4 className="mc-error-title">Error Loading Companies</h4>
        <p className="mc-error-message">{error}</p>
        <div className="mc-error-actions">
          <button className="mc-btn mc-btn-primary" onClick={fetchCompanies}>
            <FaSyncAlt /> Try Again
          </button>
          <button className="mc-btn mc-btn-outline" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-manage-companies">
      {/* Header */}
      <div className="mc-page-header">
        <div className="mc-header-left">
          <div className="mc-header-icon-wrapper">
            <FaBuilding />
          </div>
          <div>
            <h1>Manage Companies</h1>
            <p className="mc-header-subtitle">
              {stats.total} companies total ({stats.verified} verified, {stats.pending} pending)
            </p>
          </div>
        </div>
        <button className="mc-icon-btn" onClick={handleRefresh} title="Refresh">
          <FaSyncAlt />
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="mc-stats-grid">
        <div className="mc-stat-card">
          <div className="mc-stat-info">
            <h3>{stats.total}</h3>
            <p>Total Companies</p>
          </div>
          <div className="mc-stat-icon mc-stat-icon-primary"><FaBuilding /></div>
        </div>
        <div className="mc-stat-card">
          <div className="mc-stat-info">
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
          <div className="mc-stat-icon mc-stat-icon-success"><FaCheckCircle /></div>
        </div>
        <div className="mc-stat-card">
          <div className="mc-stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
          <div className="mc-stat-icon mc-stat-icon-warning"><FaTimesCircle /></div>
        </div>
        <div className="mc-stat-card">
          <div className="mc-stat-info">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
          <div className="mc-stat-icon mc-stat-icon-info"><FaUsers /></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mc-card mc-filters-card">
        <div className="mc-card-body">
          <div className="mc-filters-row">
            <div className="mc-search-wrapper">
              <div className="mc-search-input-group">
                <FaSearch className="mc-search-icon" />
                <input
                  type="text"
                  placeholder="Search by company name, industry, email..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="mc-filter-group">
              <label>Verification</label>
              <select name="verified" value={filters.verified} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="mc-filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className="mc-btn mc-btn-outline-secondary" onClick={clearFilters}>
              <FaTimes /> Clear Filters
            </button>
          </div>
          <div className="mc-results-count">
            Showing <strong>{filteredCompanies.length}</strong> of <strong>{companies.length}</strong> companies
          </div>
        </div>
      </div>

      {/* Companies Table */}
      {filteredCompanies.length === 0 ? (
        <div className="mc-card">
          <div className="mc-card-body mc-empty-state">
            <FaBuilding className="mc-empty-icon" />
            <h3>No Companies Found</h3>
            <p>
              {searchTerm || filters.verified || filters.status
                ? 'No companies match your search criteria.'
                : 'No companies have registered yet.'}
            </p>
            {(searchTerm || filters.verified || filters.status) && (
              <button className="mc-btn mc-btn-outline-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mc-card">
          <div className="mc-table-responsive">
            <table className="mc-table">
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
                      <div className="mc-company-info">
                        <div className="mc-company-avatar">
                          {company.companyName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{company.companyName}</strong>
                          <br />
                          <small className="mc-text-muted">ID: {company._id.slice(-6)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mc-industry-info">
                        <FaIndustry className="mc-icon-sm" />
                        {company.industry || 'Not specified'}
                      </div>
                    </td>
                    <td>
                      <div className="mc-contact-info">
                        {company.contactEmail && (
                          <div><FaEnvelope className="mc-icon-sm" /> {company.contactEmail}</div>
                        )}
                        {company.contactPhone && (
                          <div><FaPhone className="mc-icon-sm" /> {company.contactPhone}</div>
                        )}
                        {company.website && (
                          <div><FaGlobe className="mc-icon-sm" /> 
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
                      <div className="mc-action-buttons">
                        <button
                          className="mc-icon-btn-sm"
                          onClick={() => handleViewCompany(company)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {!company.verified && (
                          <button
                            className="mc-icon-btn-sm mc-success"
                            onClick={() => handleVerifyCompany(company.userId?._id)}
                            title="Verify Company"
                            disabled={actionLoading}
                          >
                            <FaUserCheck />
                          </button>
                        )}
                        <button
                          className="mc-icon-btn-sm mc-danger"
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
        <div className="mc-modal-overlay" onClick={handleCloseModal}>
          <div className="mc-modal mc-modal-large" onClick={e => e.stopPropagation()}>
            <div className="mc-modal-header">
              <h3><FaBuilding /> Company Details</h3>
              <button className="mc-modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="mc-modal-body">
              <div className="mc-company-detail">
                <div className="mc-detail-header">
                  <div className="mc-detail-avatar">
                    {selectedCompany.companyName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="mc-detail-info">
                    <h3>{selectedCompany.companyName}</h3>
                    <p>{selectedCompany.industry || 'Industry not specified'}</p>
                    <div className="mc-detail-badges">
                      {getVerificationBadge(selectedCompany.verified)}
                      {getStatusBadge(selectedCompany.isActive)}
                    </div>
                  </div>
                </div>

                <div className="mc-detail-grid">
                  <div className="mc-detail-section">
                    <h4>Contact Information</h4>
                    <p><FaEnvelope /> {selectedCompany.contactEmail || selectedCompany.userId?.email || 'N/A'}</p>
                    <p><FaPhone /> {selectedCompany.contactPhone || 'N/A'}</p>
                    {selectedCompany.website && (
                      <p><FaGlobe /> <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">{selectedCompany.website}</a></p>
                    )}
                  </div>

                  <div className="mc-detail-section">
                    <h4>Company Details</h4>
                    <p><FaIndustry /> Industry: {selectedCompany.industry || 'N/A'}</p>
                    <p><FaUsers /> Size: {selectedCompany.companySize || 'N/A'}</p>
                    <p><FaCalendarAlt /> Founded: {selectedCompany.foundedYear || 'N/A'}</p>
                  </div>

                  {selectedCompany.description && (
                    <div className="mc-detail-section mc-full-width">
                      <h4>About</h4>
                      <p>{selectedCompany.description}</p>
                    </div>
                  )}

                  {selectedCompany.locations && selectedCompany.locations.length > 0 && (
                    <div className="mc-detail-section mc-full-width">
                      <h4>Locations</h4>
                      {selectedCompany.locations.map((loc, idx) => (
                        <div key={idx} className="mc-location-item">
                          <FaMapMarkerAlt />
                          <span>
                            {loc.city}{loc.state ? `, ${loc.state}` : ''}, {loc.country}
                            {loc.isHeadquarters && ' (Headquarters)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mc-detail-section">
                    <h4>Account Information</h4>
                    <p><FaEnvelope /> User Email: {selectedCompany.userId?.email}</p>
                    <p><FaCalendarAlt /> Joined: {formatDate(selectedCompany.createdAt)}</p>
                    <p><FaCalendarAlt /> Last Updated: {formatDate(selectedCompany.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mc-modal-footer">
              {!selectedCompany.verified && (
                <button
                  className="mc-btn mc-btn-success"
                  onClick={() => handleVerifyCompany(selectedCompany.userId?._id)}
                  disabled={actionLoading}
                >
                  <FaUserCheck /> Verify Company
                </button>
              )}
              <button
                className="mc-btn mc-btn-secondary"
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