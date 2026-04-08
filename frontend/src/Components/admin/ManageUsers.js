import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUsers, 
  FaUserGraduate, 
  FaBuilding, 
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaUserCheck,
  FaUserTimes,
  FaUserCog,
  FaBan,
  FaCheck,
  FaTimes
} from 'react-icons/fa';

const ManageUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    verified: '',
    status: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    companies: 0,
    admins: 0,
    verified: 0,
    unverified: 0,
    active: 0,
    inactive: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuthAndFetchUsers();
  }, [refreshKey]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filters]);

  const checkAuthAndFetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setTimeout(() => window.location.href = '/login', 2000);
      setLoading(false);
      return;
    }

    if (!user || user.role !== 'admin') {
      setError('Access denied. Admin only.');
      setTimeout(() => window.location.href = '/', 2000);
      setLoading(false);
      return;
    }

    await fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get('/users');
      
      if (response.data && response.data.success) {
        const usersData = response.data.users || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
        calculateStats(usersData);
      } else {
        setError(response.data?.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view this page.');
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    const newStats = {
      total: usersData.length,
      students: usersData.filter(u => u.role === 'student').length,
      companies: usersData.filter(u => u.role === 'company').length,
      admins: usersData.filter(u => u.role === 'admin').length,
      verified: usersData.filter(u => u.isVerified).length,
      unverified: usersData.filter(u => !u.isVerified && u.role !== 'admin').length,
      active: usersData.filter(u => u.isActive !== false).length,
      inactive: usersData.filter(u => u.isActive === false).length
    };
    setStats(newStats);
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phoneNumber?.toLowerCase().includes(term)
      );
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.verified) {
      const isVerified = filters.verified === 'verified';
      filtered = filtered.filter(user => user.isVerified === isVerified);
    }

    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(user => (user.isActive !== false) === isActive);
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ role: '', verified: '', status: '' });
  };
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };
  const handleCloseModal = () => {
    setShowUserModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleVerifyUser = async (userId) => {
    if (!window.confirm('Are you sure you want to verify this user?')) return;
    setActionLoading(true);
    try {
      const response = await API.put(`/users/${userId}/verify`);
      if (response.data.success) {
        toast.success('User verified successfully');
        handleRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify user');
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus === false ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    setActionLoading(true);
    try {
      const response = await API.put(`/users/${userId}/toggle-status`);
      if (response.data.success) {
        toast.success(`User ${action}d successfully`);
        handleRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      const response = await API.delete(`/users/${userId}`);
      if (response.data.success) {
        toast.success('User deleted successfully');
        handleRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      student: { class: 'mu-badge-success', icon: <FaUserGraduate />, text: 'Student' },
      company: { class: 'mu-badge-primary', icon: <FaBuilding />, text: 'Company' },
      admin: { class: 'mu-badge-danger', icon: <FaShieldAlt />, text: 'Admin' }
    };
    const b = badges[role] || badges.student;
    return (
      <span className={`mu-badge ${b.class}`}>
        {b.icon} {b.text}
      </span>
    );
  };

  const getVerificationBadge = (isVerified) => {
    return isVerified ? (
      <span className="mu-badge mu-badge-success"><FaCheckCircle /> Verified</span>
    ) : (
      <span className="mu-badge mu-badge-warning"><FaTimesCircle /> Pending</span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive !== false ? (
      <span className="mu-badge mu-badge-success"><FaCheckCircle /> Active</span>
    ) : (
      <span className="mu-badge mu-badge-secondary"><FaBan /> Inactive</span>
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
      <div className="mu-loading-container">
        <div className="mu-spinner"></div>
        <h4>Loading Users...</h4>
        <p>Please wait while we fetch user data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mu-error-container">
        <FaTimesCircle className="mu-error-icon" />
        <h4>Error Loading Users</h4>
        <p>{error}</p>
        <button className="mu-btn mu-btn-primary" onClick={handleRefresh}>
          <FaSyncAlt /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mu-manage-users">
      {/* Header */}
      <div className="mu-page-header">
        <div className="mu-header-left">
          <div className="mu-header-icon-wrapper">
            <FaUsers />
          </div>
          <div>
            <h1>Manage Users</h1>
            <p className="mu-header-subtitle">
              Total {stats.total} users ({stats.students} students, {stats.companies} companies, {stats.admins} admins)
            </p>
          </div>
        </div>
        <button className="mu-icon-btn" onClick={handleRefresh} title="Refresh">
          <FaSyncAlt />
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="mu-stats-grid">
        <div className="mu-stat-card">
          <div className="mu-stat-info">
            <h3>{stats.total}</h3>
            <p>Total Users</p>
          </div>
          <div className="mu-stat-icon mu-stat-icon-primary"><FaUsers /></div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-info">
            <h3>{stats.students}</h3>
            <p>Students</p>
          </div>
          <div className="mu-stat-icon mu-stat-icon-success"><FaUserGraduate /></div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-info">
            <h3>{stats.companies}</h3>
            <p>Companies</p>
          </div>
          <div className="mu-stat-icon mu-stat-icon-info"><FaBuilding /></div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-info">
            <h3>{stats.unverified}</h3>
            <p>Pending Verification</p>
          </div>
          <div className="mu-stat-icon mu-stat-icon-warning"><FaTimesCircle /></div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mu-card mu-filters-card">
        <div className="mu-card-body">
          <div className="mu-filters-row">
            <div className="mu-search-wrapper">
              <div className="mu-search-input-group">
                <FaSearch className="mu-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="mu-filter-group">
              <label>Role</label>
              <select name="role" value={filters.role} onChange={handleFilterChange}>
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="company">Companies</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="mu-filter-group">
              <label>Verification</label>
              <select name="verified" value={filters.verified} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div className="mu-filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className="mu-btn mu-btn-outline-secondary" onClick={clearFilters}>
              <FaTimes /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mu-results-count">
        <p>Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users</p>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="mu-card">
          <div className="mu-card-body mu-empty-state">
            <FaUsers className="mu-empty-icon" />
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="mu-btn mu-btn-outline-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="mu-card">
          <div className="mu-table-responsive">
            <table className="mu-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(userItem => (
                  <tr key={userItem._id}>
                    <td>
                      <div className="mu-user-info">
                        <div className="mu-user-avatar-small">
                          {userItem.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{userItem.name}</strong>
                          <br />
                          <small className="mu-text-muted">ID: {userItem._id.slice(-6)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div><FaEnvelope className="mu-icon-sm" /> {userItem.email}</div>
                      {userItem.phoneNumber && (
                        <div className="mt-1"><FaPhone className="mu-icon-sm" /> {userItem.phoneNumber}</div>
                      )}
                    </td>
                    <td>{getRoleBadge(userItem.role)}</td>
                    <td>{getVerificationBadge(userItem.isVerified)}</td>
                    <td>{getStatusBadge(userItem.isActive)}</td>
                    <td><FaCalendarAlt className="mu-icon-sm" /> {formatDate(userItem.createdAt)}</td>
                    <td>
                      <div className="mu-action-buttons">
                        <button className="mu-icon-btn-sm" onClick={() => handleViewUser(userItem)} title="View Details">
                          <FaEye />
                        </button>
                        {userItem.role !== 'admin' && (
                          <>
                            {!userItem.isVerified && (
                              <button className="mu-icon-btn-sm mu-success" onClick={() => handleVerifyUser(userItem._id)} title="Verify" disabled={actionLoading}>
                                <FaUserCheck />
                              </button>
                            )}
                            <button className={`mu-icon-btn-sm ${userItem.isActive !== false ? 'mu-warning' : 'mu-success'}`}
                                    onClick={() => handleToggleStatus(userItem._id, userItem.isActive)}
                                    title={userItem.isActive !== false ? 'Deactivate' : 'Activate'}
                                    disabled={actionLoading}>
                              {userItem.isActive !== false ? <FaBan /> : <FaCheck />}
                            </button>
                            <button className="mu-icon-btn-sm mu-danger" onClick={() => handleDeleteUser(userItem._id)} title="Delete" disabled={actionLoading}>
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="mu-modal-overlay" onClick={handleCloseModal}>
          <div className="mu-modal mu-modal-large" onClick={e => e.stopPropagation()}>
            <div className="mu-modal-header">
              <h3><FaUserCog /> User Details</h3>
              <button className="mu-modal-close" onClick={handleCloseModal}><FaTimes /></button>
            </div>
            <div className="mu-modal-body">
              <div className="mu-user-detail-modal">
                <div className="mu-user-avatar-large-modal">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <h3>{selectedUser.name}</h3>
                {getRoleBadge(selectedUser.role)}

                <div className="mu-details-grid">
                  <div className="mu-detail-row">
                    <strong>Email:</strong> <span><FaEnvelope /> {selectedUser.email}</span>
                  </div>
                  <div className="mu-detail-row">
                    <strong>Phone:</strong> <span><FaPhone /> {selectedUser.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="mu-detail-row">
                    <strong>User ID:</strong> <span>{selectedUser._id}</span>
                  </div>
                  <div className="mu-detail-row">
                    <strong>Joined:</strong> <span><FaCalendarAlt /> {formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="mu-detail-row">
                    <strong>Verification:</strong> <span>{getVerificationBadge(selectedUser.isVerified)}</span>
                  </div>
                  <div className="mu-detail-row">
                    <strong>Account Status:</strong> <span>{getStatusBadge(selectedUser.isActive)}</span>
                  </div>
                  {selectedUser.address && (
                    <div className="mu-detail-row mu-full-width">
                      <strong>Address:</strong>
                      <span>
                        <FaMapMarkerAlt /> {[
                          selectedUser.address.street,
                          selectedUser.address.city,
                          selectedUser.address.state,
                          selectedUser.address.country,
                          selectedUser.address.zipCode
                        ].filter(Boolean).join(', ') || 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mu-modal-footer">
              {selectedUser.role !== 'admin' && (
                <>
                  {!selectedUser.isVerified && (
                    <button className="mu-btn mu-btn-success" onClick={() => handleVerifyUser(selectedUser._id)} disabled={actionLoading}>
                      <FaUserCheck /> Verify
                    </button>
                  )}
                  <button className={`mu-btn ${selectedUser.isActive !== false ? 'mu-btn-warning' : 'mu-btn-success'}`}
                          onClick={() => handleToggleStatus(selectedUser._id, selectedUser.isActive)}
                          disabled={actionLoading}>
                    {selectedUser.isActive !== false ? <><FaBan /> Deactivate</> : <><FaCheck /> Activate</>}
                  </button>
                  <button className="mu-btn mu-btn-danger" onClick={() => handleDeleteUser(selectedUser._id)} disabled={actionLoading}>
                    <FaTrash /> Delete
                  </button>
                </>
              )}
              <button className="mu-btn mu-btn-secondary" onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;