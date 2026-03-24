import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserShield, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaSave,
  FaEdit,
  FaTimes,
  FaKey,
  FaBell,
  FaShieldAlt,
  FaUser,
  FaBuilding,
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

const AdminProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    notifications: {
      emailNotifications: true,
      newUserAlerts: true,
      companyVerificationAlerts: true,
      reportAlerts: true,
      systemUpdates: true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasNumber: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false
  });

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (!user || user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }

    await fetchProfile();
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin profile...');
      
      // For admin, we can use the user data from auth context
      setProfile(user);
      
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        notifications: {
          emailNotifications: true,
          newUserAlerts: true,
          companyVerificationAlerts: true,
          reportAlerts: true,
          systemUpdates: true
        }
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else if (name.startsWith('notifications.')) {
      const notificationName = name.split('.')[1];
      setFormData({
        ...formData,
        notifications: {
          ...formData.notifications,
          [notificationName]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });

    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }

    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };

  const checkPasswordStrength = (password) => {
    const strength = {
      score: 0,
      hasLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    let score = 0;
    if (strength.hasLength) score++;
    if (strength.hasNumber) score++;
    if (strength.hasUpperCase) score++;
    if (strength.hasLowerCase) score++;
    if (strength.hasSpecialChar) score++;
    
    strength.score = score;
    setPasswordStrength(strength);
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      errors.newPassword = 'Password is too weak';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const validateProfileForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    return errors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    setSaving(true);

    try {
      // Update user profile
      const response = await API.put(`/users/${user.id}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      });
      
      if (response.data.success) {
        // Update local storage
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setProfile(updatedUser);
        setEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
          navigate('/login');
        } else if (error.response.status === 403) {
          toast.error('You are not authorized to update this profile');
        } else {
          toast.error(error.response.data?.message || 'Failed to update profile');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Error: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    setSaving(true);

    try {
      // Change password
      const response = await API.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully!');
        setChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Current password is incorrect');
        } else {
          toast.error(error.response.data?.message || 'Failed to change password');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Error: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const score = passwordStrength.score;
    if (score <= 2) return 'danger';
    if (score <= 3) return 'warning';
    if (score <= 4) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    const score = passwordStrength.score;
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <FaUserShield className="me-2 text-primary" />
                Admin Profile
              </h2>
              <p className="text-muted mb-0">Manage your account settings and preferences</p>
            </div>
            {!editing && !changingPassword && (
              <button 
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                <FaEdit className="me-2" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Card */}
          <div className="row">
            <div className="col-md-4">
              {/* Admin Info Card */}
              <div className="card shadow-sm mb-4">
                <div className="card-body text-center p-4">
                  <div className="admin-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                       style={{ width: '100px', height: '100px' }}>
                    <FaUserShield className="text-primary" size={50} />
                  </div>
                  <h4 className="mb-1">{user?.name}</h4>
                  <p className="text-muted mb-2">{user?.email}</p>
                  <span className="badge bg-danger px-3 py-2">
                    <FaShieldAlt className="me-1" />
                    Administrator
                  </span>
                  
                  <hr className="my-3" />
                  
                  <div className="text-start">
                    <p className="mb-2">
                      <FaPhone className="text-primary me-2" />
                      <strong>Phone:</strong> {user?.phoneNumber || 'Not provided'}
                    </p>
                    <p className="mb-2">
                      <FaMapMarkerAlt className="text-primary me-2" />
                      <strong>Location:</strong> {user?.address?.city || 'Not provided'}, {user?.address?.country || ''}
                    </p>
                    <p className="mb-0">
                      <FaEnvelope className="text-primary me-2" />
                      <strong>Member since:</strong> {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Stats */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Account Statistics</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Account Status</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Last Login</span>
                    <span className="text-muted">Today</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Security Level</span>
                    <span className="badge bg-info">High</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>2FA Status</span>
                    <span className="badge bg-warning">Not Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              {/* Edit Profile Form */}
              {editing && (
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <FaEdit className="me-2 text-primary" />
                      Edit Profile
                    </h5>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEditing(false)}
                    >
                      <FaTimes className="me-1" /> Cancel
                    </button>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleProfileSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold">
                            <FaUser className="me-2 text-primary" />
                            Full Name *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-bold">
                            <FaEnvelope className="me-2 text-primary" />
                            Email
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={formData.email}
                            disabled
                            readOnly
                          />
                          <small className="text-muted">Email cannot be changed</small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          <FaPhone className="me-2 text-primary" />
                          Phone Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <h6 className="fw-bold mb-3">
                        <FaMapMarkerAlt className="me-2 text-primary" />
                        Address
                      </h6>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Street Address</label>
                          <input
                            type="text"
                            className="form-control"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            className="form-control"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">State</label>
                          <input
                            type="text"
                            className="form-control"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Country</label>
                          <input
                            type="text"
                            className="form-control"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Zip Code</label>
                          <input
                            type="text"
                            className="form-control"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <FaSave className="me-2" /> Save Changes
                            </>
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => setEditing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Change Password Section */}
              {!editing && (
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <FaKey className="me-2 text-primary" />
                      Security
                    </h5>
                    {!changingPassword && (
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setChangingPassword(true)}
                      >
                        Change Password
                      </button>
                    )}
                  </div>
                  
                  {changingPassword ? (
                    <div className="card-body">
                      <form onSubmit={handlePasswordSubmit}>
                        {/* Current Password */}
                        <div className="mb-3">
                          <label className="form-label fw-bold">Current Password</label>
                          <div className="input-group">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {passwordErrors.currentPassword && (
                            <div className="text-danger small mt-1">{passwordErrors.currentPassword}</div>
                          )}
                        </div>

                        {/* New Password */}
                        <div className="mb-3">
                          <label className="form-label fw-bold">New Password</label>
                          <div className="input-group">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {passwordErrors.newPassword && (
                            <div className="text-danger small mt-1">{passwordErrors.newPassword}</div>
                          )}
                          
                          {/* Password Strength Meter */}
                          {passwordData.newPassword && (
                            <div className="mt-2">
                              <div className="d-flex justify-content-between mb-1">
                                <small>Password Strength:</small>
                                <small className={`text-${getPasswordStrengthColor()}`}>
                                  {getPasswordStrengthText()}
                                </small>
                              </div>
                              <div className="progress" style={{ height: '5px' }}>
                                <div 
                                  className={`progress-bar bg-${getPasswordStrengthColor()}`}
                                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-3">
                          <label className="form-label fw-bold">Confirm New Password</label>
                          <div className="input-group">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {passwordErrors.confirmPassword && (
                            <div className="text-danger small mt-1">{passwordErrors.confirmPassword}</div>
                          )}
                          {passwordData.newPassword && passwordData.confirmPassword && 
                           passwordData.newPassword === passwordData.confirmPassword && (
                            <div className="text-success small mt-1">
                              <FaCheckCircle className="me-1" /> Passwords match
                            </div>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={saving}
                          >
                            {saving ? 'Updating...' : 'Update Password'}
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setChangingPassword(false);
                              setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                              setPasswordErrors({});
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="card-body">
                      <p className="text-muted mb-0">
                        <FaCheckCircle className="text-success me-2" />
                        Password last changed: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Preferences */}
              {!editing && !changingPassword && (
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <FaBell className="me-2 text-primary" />
                      Notification Preferences
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="emailNotifications"
                          checked={formData.notifications.emailNotifications}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              emailNotifications: e.target.checked
                            }
                          })}
                        />
                        <label className="form-check-label" htmlFor="emailNotifications">
                          Email Notifications
                        </label>
                      </div>
                      <small className="text-muted ms-4">Receive email updates about your account</small>
                    </div>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="newUserAlerts"
                          checked={formData.notifications.newUserAlerts}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              newUserAlerts: e.target.checked
                            }
                          })}
                        />
                        <label className="form-check-label" htmlFor="newUserAlerts">
                          New User Alerts
                        </label>
                      </div>
                      <small className="text-muted ms-4">Get notified when new users register</small>
                    </div>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="companyVerificationAlerts"
                          checked={formData.notifications.companyVerificationAlerts}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              companyVerificationAlerts: e.target.checked
                            }
                          })}
                        />
                        <label className="form-check-label" htmlFor="companyVerificationAlerts">
                          Company Verification Alerts
                        </label>
                      </div>
                      <small className="text-muted ms-4">Get notified when companies need verification</small>
                    </div>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="reportAlerts"
                          checked={formData.notifications.reportAlerts}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              reportAlerts: e.target.checked
                            }
                          })}
                        />
                        <label className="form-check-label" htmlFor="reportAlerts">
                          Report Alerts
                        </label>
                      </div>
                      <small className="text-muted ms-4">Get notified about new reports</small>
                    </div>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="systemUpdates"
                          checked={formData.notifications.systemUpdates}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              systemUpdates: e.target.checked
                            }
                          })}
                        />
                        <label className="form-check-label" htmlFor="systemUpdates">
                          System Updates
                        </label>
                      </div>
                      <small className="text-muted ms-4">Receive important system announcements</small>
                    </div>

                    <button 
                      className="btn btn-primary mt-2"
                      onClick={async () => {
                        toast.success('Notification preferences saved!');
                        // Here you would save to backend
                      }}
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;