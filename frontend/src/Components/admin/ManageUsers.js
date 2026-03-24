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
      
      console.log('📡 Fetching users...');
      
      const response = await API.get('/users');
      console.log('✅ Users response:', response.data);
      
      if (response.data && response.data.success) {
        const usersData = response.data.users || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
        calculateStats(usersData);
      } else {
        setError(response.data?.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => window.location.href = '/login', 2000);
        } else if (err.response.status === 403) {
          setError('You are not authorized to view this page.');
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

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phoneNumber?.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Apply verification filter
    if (filters.verified) {
      const isVerified = filters.verified === 'verified';
      filtered = filtered.filter(user => user.isVerified === isVerified);
    }

    // Apply status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(user => user.isActive !== false === isActive);
    }

    setFilteredUsers(filtered);
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
      role: '',
      verified: '',
      status: ''
    });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
    if (!window.confirm('Are you sure you want to verify this user?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await API.put(`/users/${userId}/verify`);
      
      if (response.data.success) {
        toast.success('User verified successfully');
        handleRefresh();
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      toast.error(err.response?.data?.message || 'Failed to verify user');
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus === false ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await API.put(`/users/${userId}/toggle-status`);
      
      if (response.data.success) {
        toast.success(`User ${action}d successfully`);
        handleRefresh();
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await API.delete(`/users/${userId}`);
      
      if (response.data.success) {
        toast.success('User deleted successfully');
        handleRefresh();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      'student': { class: 'bg-success', icon: <FaUserGraduate />, text: 'Student' },
      'company': { class: 'bg-primary', icon: <FaBuilding />, text: 'Company' },
      'admin': { class: 'bg-danger', icon: <FaShieldAlt />, text: 'Admin' }
    };
    const badge = badges[role] || badges['student'];
    return (
      <span className={`badge ${badge.class} p-2`}>
        <span className="me-1">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const getVerificationBadge = (isVerified) => {
    return isVerified ? (
      <span className="badge bg-success p-2">
        <FaCheckCircle className="me-1" /> Verified
      </span>
    ) : (
      <span className="badge bg-warning text-dark p-2">
        <FaTimesCircle className="me-1" /> Pending
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive !== false ? (
      <span className="badge bg-success p-2">
        <FaCheckCircle className="me-1" /> Active
      </span>
    ) : (
      <span className="badge bg-secondary p-2">
        <FaBan className="me-1" /> Inactive
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-4 text-primary">Loading users...</h5>
          <p className="text-muted">Please wait while we fetch user data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-danger shadow">
              <div className="card-header bg-danger text-white">
                <h4 className="mb-0">
                  <FaTimesCircle className="me-2" />
                  Error Loading Users
                </h4>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <FaTimesCircle className="text-danger" size={50} />
                </div>
                <p className="text-danger text-center mb-4">{error}</p>
                
                <div className="bg-light p-3 rounded mb-4">
                  <h6>Debug Information:</h6>
                  <ul className="mb-0 small">
                    <li>Token in localStorage: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</li>
                    <li>User in localStorage: {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</li>
                    <li>User role: {user?.role || 'Not available'}</li>
                    <li>Backend URL: http://localhost:5000</li>
                    <li>Backend status: <a href="http://localhost:5000/api/health" target="_blank" rel="noreferrer">Check Health</a></li>
                  </ul>
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <button className="btn btn-primary" onClick={handleRefresh}>
                    <FaSyncAlt className="me-2" />
                    Try Again
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => window.location.href = '/admin/dashboard'}>
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FaUsers className="me-2 text-primary" />
            Manage Users
          </h2>
          <p className="text-muted mb-0">
            Total {stats.total} users ({stats.students} students, {stats.companies} companies, {stats.admins} admins)
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={handleRefresh}>
          <FaSyncAlt className="me-2" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-white-50 mb-1">Total Users</h6>
                <h3 className="mb-0">{stats.total}</h3>
              </div>
              <FaUsers size={30} className="text-white-50" />
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-white-50 mb-1">Students</h6>
                <h3 className="mb-0">{stats.students}</h3>
              </div>
              <FaUserGraduate size={30} className="text-white-50" />
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-white-50 mb-1">Companies</h6>
                <h3 className="mb-0">{stats.companies}</h3>
              </div>
              <FaBuilding size={30} className="text-white-50" />
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-dark-50 mb-1">Pending Verification</h6>
                <h3 className="mb-0">{stats.unverified}</h3>
              </div>
              <FaTimesCircle size={30} className="text-dark-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch className="text-primary" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="company">Companies</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="verified"
                value={filters.verified}
                onChange={handleFilterChange}
              >
                <option value="">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-3">
        <p className="text-muted">
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
        </p>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <FaUsers className="text-muted mb-3" size={50} />
            <h5>No users found</h5>
            <p className="text-muted">Try adjusting your search or filters</p>
            <button className="btn btn-outline-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => (
                  <tr key={userItem._id}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                             style={{ width: '40px', height: '40px' }}>
                          <span className="text-primary fw-bold">
                            {userItem.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <strong>{userItem.name}</strong>
                          <br />
                          <small className="text-muted">ID: {userItem._id.slice(-6)}</small>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <FaEnvelope className="text-primary me-2" size={12} />
                        {userItem.email}
                      </div>
                      {userItem.phoneNumber && (
                        <div className="mt-1">
                          <FaPhone className="text-primary me-2" size={12} />
                          {userItem.phoneNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(userItem.role)}
                    </td>
                    <td className="px-4 py-3">
                      {getVerificationBadge(userItem.isVerified)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(userItem.isActive)}
                    </td>
                    <td className="px-4 py-3">
                      <FaCalendarAlt className="text-primary me-2" size={12} />
                      {formatDate(userItem.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleViewUser(userItem)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {userItem.role !== 'admin' && (
                          <>
                            {!userItem.isVerified && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleVerifyUser(userItem._id)}
                                title="Verify User"
                                disabled={actionLoading}
                              >
                                <FaUserCheck />
                              </button>
                            )}
                            <button
                              className={`btn btn-sm ${userItem.isActive !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => handleToggleStatus(userItem._id, userItem.isActive)}
                              title={userItem.isActive !== false ? 'Deactivate' : 'Activate'}
                              disabled={actionLoading}
                            >
                              {userItem.isActive !== false ? <FaBan /> : <FaCheck />}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(userItem._id)}
                              title="Delete User"
                              disabled={actionLoading}
                            >
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaUserCog className="me-2" />
                  User Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    <div className="avatar-large bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto"
                         style={{ width: '100px', height: '100px' }}>
                      <span className="text-primary" style={{ fontSize: '2.5rem' }}>
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h5 className="mt-3 mb-1">{selectedUser.name}</h5>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="fw-bold text-muted small">Email</label>
                        <p><FaEnvelope className="text-primary me-2" />{selectedUser.email}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="fw-bold text-muted small">Phone</label>
                        <p><FaPhone className="text-primary me-2" />{selectedUser.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="fw-bold text-muted small">User ID</label>
                        <p className="text-muted">{selectedUser._id}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="fw-bold text-muted small">Joined Date</label>
                        <p><FaCalendarAlt className="text-primary me-2" />{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="fw-bold text-muted small">Verification Status</label>
                        <p>{getVerificationBadge(selectedUser.isVerified)}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="fw-bold text-muted small">Account Status</label>
                        <p>{getStatusBadge(selectedUser.isActive)}</p>
                      </div>
                      {selectedUser.address && (
                        <div className="col-12 mb-3">
                          <label className="fw-bold text-muted small">Address</label>
                          <p><FaMapMarkerAlt className="text-primary me-2" />
                            {[
                              selectedUser.address.street,
                              selectedUser.address.city,
                              selectedUser.address.state,
                              selectedUser.address.country,
                              selectedUser.address.zipCode
                            ].filter(Boolean).join(', ') || 'Not provided'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {selectedUser.role !== 'admin' && (
                  <>
                    {!selectedUser.isVerified && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleVerifyUser(selectedUser._id)}
                        disabled={actionLoading}
                      >
                        <FaUserCheck className="me-2" />
                        Verify User
                      </button>
                    )}
                    <button
                      className={`btn ${selectedUser.isActive !== false ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggleStatus(selectedUser._id, selectedUser.isActive)}
                      disabled={actionLoading}
                    >
                      {selectedUser.isActive !== false ? (
                        <><FaBan className="me-2" /> Deactivate User</>
                      ) : (
                        <><FaCheck className="me-2" /> Activate User</>
                      )}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteUser(selectedUser._id)}
                      disabled={actionLoading}
                    >
                      <FaTrash className="me-2" />
                      Delete User
                    </button>
                  </>
                )}
                <button className="btn btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;