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
  FaEyeSlash,
  FaUsers,
  FaBriefcase,
  FaSyncAlt
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
  
  // Welcome header stats
  const [welcomeStats, setWelcomeStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0
  });

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
    fetchWelcomeStats();
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

  const fetchWelcomeStats = async () => {
    try {
      const [usersRes, companiesRes, jobsRes] = await Promise.allSettled([
        API.get('/admin/users'),
        API.get('/admin/companies'),
        API.get('/admin/jobs')
      ]);

      let totalUsers = 0, totalCompanies = 0, totalJobs = 0;
      if (usersRes.status === 'fulfilled') {
        const { students, companies, admins } = usersRes.value.data;
        totalUsers = (students?.length || 0) + (companies?.length || 0) + (admins?.length || 0);
      }
      if (companiesRes.status === 'fulfilled') {
        totalCompanies = companiesRes.value.data.companies?.length || 0;
      }
      if (jobsRes.status === 'fulfilled') {
        totalJobs = jobsRes.value.data.jobs?.length || 0;
      }

      setWelcomeStats({ totalUsers, totalCompanies, totalJobs });
    } catch (err) {
      console.warn('Could not fetch welcome stats', err);
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
      const response = await API.put(`/users/${user.id}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      });
      
      if (response.data.success) {
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
    if (score <= 2) return 'ap-danger';
    if (score <= 3) return 'ap-warning';
    if (score <= 4) return 'ap-info';
    return 'ap-success';
  };

  const getPasswordStrengthText = () => {
    const score = passwordStrength.score;
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="ap-loading-container">
        <div className="ap-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="ap-container">
      {/* Welcome Header with Edit Profile Button */}
      <div className="ds-welcome-header">
        <div className="ds-welcome-content">
          <div className="ds-user-avatar-large">
            {user?.profilePicture ? (
              <img src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`} alt={user.name} className="ds-avatar-image" />
            ) : (
              <div className="ds-avatar-placeholder">
                <FaShieldAlt size={32} />
              </div>
            )}
          </div>
          <div className="ds-welcome-text">
            <h2>Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👑</h2>
            <p>Manage your profile, security, and notification preferences.</p>
            <div className="ds-user-meta">
              <span><FaUsers /> {welcomeStats.totalUsers} total users</span>
              <span><FaBuilding /> {welcomeStats.totalCompanies} companies</span>
              <span><FaBriefcase /> {welcomeStats.totalJobs} jobs posted</span>
            </div>
          </div>
        </div>
        <div className="ds-welcome-actions">
          {/* Refresh Stats Button */}
          <button className="ds-icon-btn" onClick={fetchWelcomeStats} title="Refresh Stats">
            <FaSyncAlt />
          </button>
          {/* Edit Profile Button */}
          {!editing && !changingPassword && (
            <button className="ap-btn ap-btn-primary" onClick={() => setEditing(true)} style={{ marginLeft: '0.5rem' }}>
              <FaEdit /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="ap-grid">
        {/* Left Column */}
        <div className="ap-col ap-col-left">
          {/* Admin Info Card */}
          <div className="ap-card ap-info-card">
            <div className="ap-card-body">
              <div className="ap-avatar">
                <FaUserShield size={50} />
              </div>
              <h4 className="ap-name">{user?.name}</h4>
              <p className="ap-email">{user?.email}</p>
              <span className="ap-badge ap-badge-admin">Administrator</span>
              
              <hr className="ap-divider" />
              
              <div className="ap-info-list">
                <p><FaPhone /> <strong>Phone:</strong> {user?.phoneNumber || 'Not provided'}</p>
                <p><FaMapMarkerAlt /> <strong>Location:</strong> {user?.address?.city || 'Not provided'}, {user?.address?.country || ''}</p>
                <p><FaEnvelope /> <strong>Member since:</strong> {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Account Statistics Card */}
          <div className="ap-card ap-stats-card">
            <div className="ap-card-header">
              <h5>Account Statistics</h5>
            </div>
            <div className="ap-card-body">
              <div className="ap-stats-list">
                <div><span>Account Status</span><span className="ap-badge ap-badge-success">Active</span></div>
                <div><span>Last Login</span><span>Today</span></div>
                <div><span>Security Level</span><span className="ap-badge ap-badge-info">High</span></div>
                <div><span>2FA Status</span><span className="ap-badge ap-badge-warning">Not Enabled</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="ap-col ap-col-right">
          {/* Edit Profile Form */}
          {editing && (
            <div className="ap-card ap-form-card">
              <div className="ap-card-header">
                <h5><FaEdit /> Edit Profile</h5>
                <button className="ap-btn ap-btn-outline" onClick={() => setEditing(false)}>
                  <FaTimes /> Cancel
                </button>
              </div>
              <div className="ap-card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="ap-form-row">
                    <div className="ap-form-group">
                      <label><FaUser /> Full Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="ap-form-group">
                      <label><FaEnvelope /> Email</label>
                      <input type="email" value={formData.email} disabled readOnly />
                      <small>Email cannot be changed</small>
                    </div>
                  </div>

                  <div className="ap-form-group">
                    <label><FaPhone /> Phone Number</label>
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Enter phone number" />
                  </div>

                  <h6>Address</h6>
                  <div className="ap-form-row">
                    <div className="ap-form-group">
                      <label>Street Address</label>
                      <input type="text" name="address.street" value={formData.address.street} onChange={handleInputChange} />
                    </div>
                    <div className="ap-form-group">
                      <label>City</label>
                      <input type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="ap-form-row">
                    <div className="ap-form-group">
                      <label>State</label>
                      <input type="text" name="address.state" value={formData.address.state} onChange={handleInputChange} />
                    </div>
                    <div className="ap-form-group">
                      <label>Country</label>
                      <input type="text" name="address.country" value={formData.address.country} onChange={handleInputChange} />
                    </div>
                    <div className="ap-form-group">
                      <label>Zip Code</label>
                      <input type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="ap-form-actions">
                    <button type="submit" className="ap-btn ap-btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security / Password Section */}
          {!editing && (
            <div className="ap-card ap-security-card">
              <div className="ap-card-header">
                <h5><FaKey /> Security</h5>
                {!changingPassword && (
                  <button className="ap-btn ap-btn-outline" onClick={() => setChangingPassword(true)}>
                    Change Password
                  </button>
                )}
              </div>

              {changingPassword ? (
                <div className="ap-card-body">
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="ap-form-group">
                      <label>Current Password</label>
                      <div className="ap-input-group">
                        <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && <div className="ap-error">{passwordErrors.currentPassword}</div>}
                    </div>

                    <div className="ap-form-group">
                      <label>New Password</label>
                      <div className="ap-input-group">
                        <input type={showNewPassword ? "text" : "password"} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && <div className="ap-error">{passwordErrors.newPassword}</div>}
                      {passwordData.newPassword && (
                        <div className="ap-password-strength">
                          <div className="ap-strength-bar">
                            <div className="ap-strength-progress" style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: `var(--ap-${getPasswordStrengthColor()})` }}></div>
                          </div>
                          <div className="ap-strength-text">
                            <span>Password Strength: </span>
                            <span className={`ap-${getPasswordStrengthColor()}`}>{getPasswordStrengthText()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ap-form-group">
                      <label>Confirm New Password</label>
                      <div className="ap-input-group">
                        <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && <div className="ap-error">{passwordErrors.confirmPassword}</div>}
                      {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                        <div className="ap-success"><FaCheckCircle /> Passwords match</div>
                      )}
                    </div>

                    <div className="ap-form-actions">
                      <button type="submit" className="ap-btn ap-btn-primary" disabled={saving}>
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                      <button type="button" className="ap-btn ap-btn-outline" onClick={() => {
                        setChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordErrors({});
                      }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="ap-security-info">
                  <FaCheckCircle className="ap-text-success" /> Password last changed: {new Date().toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Notification Preferences */}
          {!editing && !changingPassword && (
            <div className="ap-card ap-notifications-card">
              <div className="ap-card-header">
                <h5><FaBell /> Notification Preferences</h5>
              </div>
              <div className="ap-notifications-list">
                {Object.entries(formData.notifications).map(([key, value]) => (
                  <div key={key} className="ap-notification-item">
                    <div className="ap-switch">
                      <input
                        type="checkbox"
                        id={`notif-${key}`}
                        checked={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, [key]: e.target.checked }
                        })}
                      />
                      <label htmlFor={`notif-${key}`}>
                        {key === 'emailNotifications' && 'Email Notifications'}
                        {key === 'newUserAlerts' && 'New User Alerts'}
                        {key === 'companyVerificationAlerts' && 'Company Verification Alerts'}
                        {key === 'reportAlerts' && 'Report Alerts'}
                        {key === 'systemUpdates' && 'System Updates'}
                      </label>
                    </div>
                    <small>
                      {key === 'emailNotifications' && 'Receive email updates about your account'}
                      {key === 'newUserAlerts' && 'Get notified when new users register'}
                      {key === 'companyVerificationAlerts' && 'Get notified when companies need verification'}
                      {key === 'reportAlerts' && 'Get notified about new reports'}
                      {key === 'systemUpdates' && 'Receive important system announcements'}
                    </small>
                  </div>
                ))}
              </div>
              <div className="ap-form-actions" style={{ padding: '0 1.5rem 1.5rem' }}>
                <button className="ap-btn ap-btn-primary" onClick={() => toast.success('Notification preferences saved!')}>
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;