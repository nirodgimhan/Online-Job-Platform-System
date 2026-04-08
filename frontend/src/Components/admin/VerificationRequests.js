import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../../Components/context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaMapMarkerAlt,
  FaIndustry,
  FaUsers,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaSyncAlt,
  FaCheck,
  FaTimes,
  FaEye
} from 'react-icons/fa';

const VerificationRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthAndFetchRequests();
  }, []);

  const checkAuthAndFetchRequests = async () => {
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

    await fetchPendingCompanies();
  };

  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      // Get all users
      const usersRes = await API.get('/users');
      if (!usersRes.data.success) {
        throw new Error(usersRes.data.message || 'Failed to load users');
      }

      const allUsers = usersRes.data.users || [];
      const companyUsers = allUsers.filter(u => u.role === 'company' && !u.isVerified);
      
      if (companyUsers.length === 0) {
        setPendingCompanies([]);
        toast.info('No pending verification requests');
        return;
      }

      // Fetch full profile for each pending company
      const companyPromises = companyUsers.map(async (companyUser) => {
        try {
          const profileRes = await API.get(`/companies/public/${companyUser._id}`);
          if (profileRes.data.success && profileRes.data.company) {
            return {
              ...profileRes.data.company,
              userId: companyUser,
              verified: false,
              createdAt: companyUser.createdAt,
              updatedAt: companyUser.updatedAt
            };
          } else {
            // Fallback if profile not found
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
              verified: false,
              createdAt: companyUser.createdAt,
              updatedAt: companyUser.updatedAt,
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch profile for company ${companyUser._id}:`, err);
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
            verified: false,
            createdAt: companyUser.createdAt,
            updatedAt: companyUser.updatedAt,
          };
        }
      });

      const companiesData = await Promise.all(companyPromises);
      setPendingCompanies(companiesData);
      
    } catch (err) {
      console.error('Error fetching pending companies:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view verification requests.');
      } else {
        setError(err.response?.data?.message || 'Failed to load verification requests. Please try again.');
      }
      setPendingCompanies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVerifyCompany = async (company) => {
    if (!company.userId?._id) {
      toast.error('User ID missing');
      return;
    }
    if (!window.confirm(`Are you sure you want to verify "${company.companyName}"?`)) return;

    setActionLoading(true);
    try {
      const response = await API.put(`/users/${company.userId._id}/verify`);
      if (response.data.success) {
        toast.success(`${company.companyName} has been verified successfully`);
        // Remove from list
        setPendingCompanies(prev => prev.filter(c => c._id !== company._id));
        if (selectedCompany && selectedCompany._id === company._id) {
          setSelectedCompany(null);
          setShowDetailsModal(false);
        }
      }
    } catch (err) {
      console.error('Error verifying company:', err);
      toast.error(err.response?.data?.message || 'Failed to verify company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedCompany(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="vr-loading-container">
        <div className="vr-spinner"></div>
        <h4>Loading verification requests...</h4>
        <p>Please wait while we fetch pending company verifications</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vr-error-container">
        <FaExclamationTriangle className="vr-error-icon" />
        <h4 className="vr-error-title">Error Loading Requests</h4>
        <p className="vr-error-message">{error}</p>
        <div className="vr-error-actions">
          <button className="vr-btn vr-btn-primary" onClick={fetchPendingCompanies}>
            <FaSyncAlt /> Try Again
          </button>
          <button className="vr-btn vr-btn-outline" onClick={() => navigate('/admin/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vr-verification-requests">
      {/* Header */}
      <div className="vr-page-header">
        <div className="vr-header-left">
          <div className="vr-header-icon-wrapper">
            <FaCheckCircle />
          </div>
          <div>
            <h1>Verification Requests</h1>
            <p className="vr-header-subtitle">
              {pendingCompanies.length} company{pendingCompanies.length !== 1 ? 'ies' : ''} awaiting verification
            </p>
          </div>
        </div>
        <button className="vr-icon-btn" onClick={fetchPendingCompanies} disabled={refreshing} title="Refresh">
          <FaSyncAlt className={refreshing ? 'vr-spin' : ''} />
        </button>
      </div>

      {/* Requests Grid */}
      {pendingCompanies.length === 0 ? (
        <div className="vr-card">
          <div className="vr-card-body vr-empty-state">
            <FaCheckCircle className="vr-empty-icon" />
            <h3>No Pending Requests</h3>
            <p>All companies are verified. New registrations will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="vr-requests-grid">
          {pendingCompanies.map(company => (
            <div key={company._id} className="vr-request-card">
              <div className="vr-card-header">
                <div className="vr-company-logo">
                  {company.companyLogo ? (
                    <img 
                      src={company.companyLogo.startsWith('http') ? company.companyLogo : `http://localhost:5000${company.companyLogo}`} 
                      alt={company.companyName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="vr-logo-placeholder" style={{ display: company.companyLogo ? 'none' : 'flex' }}>
                    <FaBuilding />
                  </div>
                </div>
                <div className="vr-company-info">
                  <h3>{company.companyName}</h3>
                  <p className="vr-email"><FaEnvelope /> {company.contactEmail || company.userId?.email}</p>
                  {company.industry && <p><FaIndustry /> {company.industry}</p>}
                </div>
                <div className="vr-status-badge vr-pending">
                  <FaTimesCircle /> Pending
                </div>
              </div>

              {company.description && (
                <div className="vr-description">
                  <p>{company.description.length > 150 ? `${company.description.substring(0, 150)}...` : company.description}</p>
                </div>
              )}

              <div className="vr-card-footer">
                <button 
                  className="vr-btn vr-btn-outline-primary" 
                  onClick={() => handleViewDetails(company)}
                >
                  <FaEye /> View Details
                </button>
                <button 
                  className="vr-btn vr-btn-success" 
                  onClick={() => handleVerifyCompany(company)}
                  disabled={actionLoading}
                >
                  <FaCheck /> Verify Company
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="vr-modal-overlay" onClick={handleCloseModal}>
          <div className="vr-modal vr-modal-large" onClick={e => e.stopPropagation()}>
            <div className="vr-modal-header">
              <h3><FaBuilding /> Company Details</h3>
              <button className="vr-modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="vr-modal-body">
              <div className="vr-company-detail">
                <div className="vr-detail-header">
                  <div className="vr-detail-avatar">
                    {selectedCompany.companyName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="vr-detail-info">
                    <h3>{selectedCompany.companyName}</h3>
                    <p>{selectedCompany.industry || 'Industry not specified'}</p>
                  </div>
                </div>

                <div className="vr-detail-grid">
                  <div className="vr-detail-section">
                    <h4>Contact Information</h4>
                    <p><FaEnvelope /> {selectedCompany.contactEmail || selectedCompany.userId?.email || 'N/A'}</p>
                    <p><FaPhone /> {selectedCompany.contactPhone || 'N/A'}</p>
                    {selectedCompany.website && (
                      <p><FaGlobe /> <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">{selectedCompany.website}</a></p>
                    )}
                  </div>

                  <div className="vr-detail-section">
                    <h4>Company Details</h4>
                    <p><FaIndustry /> Industry: {selectedCompany.industry || 'N/A'}</p>
                    <p><FaUsers /> Size: {selectedCompany.companySize || 'N/A'}</p>
                    <p><FaCalendarAlt /> Founded: {selectedCompany.foundedYear || 'N/A'}</p>
                  </div>

                  {selectedCompany.description && (
                    <div className="vr-detail-section vr-full-width">
                      <h4>About</h4>
                      <p>{selectedCompany.description}</p>
                    </div>
                  )}

                  {selectedCompany.locations && selectedCompany.locations.length > 0 && (
                    <div className="vr-detail-section vr-full-width">
                      <h4>Locations</h4>
                      {selectedCompany.locations.map((loc, idx) => (
                        <div key={idx} className="vr-location-item">
                          <FaMapMarkerAlt />
                          <span>
                            {loc.city}{loc.state ? `, ${loc.state}` : ''}, {loc.country}
                            {loc.isHeadquarters && ' (Headquarters)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="vr-detail-section">
                    <h4>Account Information</h4>
                    <p><FaCalendarAlt /> Registered: {formatDate(selectedCompany.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="vr-modal-footer">
              <button
                className="vr-btn vr-btn-success"
                onClick={() => handleVerifyCompany(selectedCompany)}
                disabled={actionLoading}
              >
                <FaCheck /> Verify Company
              </button>
              <button
                className="vr-btn vr-btn-secondary"
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

export default VerificationRequests;