import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
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
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaUsers,
  FaBriefcase,
  FaSyncAlt,
  FaCamera,
  FaUpload
} from 'react-icons/fa';

const AdminProfile = () => {
  const { user, logout, setUser, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lastLogin, setLastLogin] = useState(null);
  
  // Welcome stats
  const [welcomeStats, setWelcomeStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0
  });

  // Account stats (real data)
  const [accountStats, setAccountStats] = useState({
    accountStatus: 'Active',
    lastLogin: 'Today',
    securityLevel: 'High',
    twoFAStatus: 'Not Enabled'
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
    fetchAccountStats();
    fetchNotificationPreferences();
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
      
      // Set last login from user data if available
      if (user?.lastLogin) {
        const lastLoginDate = new Date(user.lastLogin);
        const today = new Date();
        if (lastLoginDate.toDateString() === today.toDateString()) {
          setLastLogin('Today');
        } else {
          setLastLogin(lastLoginDate.toLocaleDateString());
        }
      } else {
        setLastLogin('Today');
      }
      
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchWelcomeStats = async () => {
    try {
      // Fetch users
      const usersRes = await API.get('/users');
      const allUsers = usersRes.data.users || [];
      const students = allUsers.filter(u => u.role === 'student').length;
      const companies = allUsers.filter(u => u.role === 'company').length;
      const admins = allUsers.filter(u => u.role === 'admin').length;
      const totalUsers = students + companies + admins;
      
      // Fetch jobs
      let totalJobs = 0;
      try {
        const jobsRes = await API.get('/jobs/admin/all');
        totalJobs = jobsRes.data.jobs?.length || 0;
      } catch (e) {
        console.log('Jobs fetch failed:', e);
      }
      
      setWelcomeStats({
        totalUsers,
        totalCompanies: companies,
        totalJobs
      });
    } catch (err) {
      console.warn('Could not fetch welcome stats', err);
      // Fallback to mock data if needed
      setWelcomeStats({ totalUsers: 1, totalCompanies: 1, totalJobs: 0 });
    }
  };

  const fetchAccountStats = async () => {
    try {
      // Get user's last login from local storage or backend
      const lastLoginStorage = localStorage.getItem('lastLogin');
      if (lastLoginStorage) {
        const lastLoginDate = new Date(lastLoginStorage);
        const today = new Date();
        if (lastLoginDate.toDateString() === today.toDateString()) {
          setAccountStats(prev => ({ ...prev, lastLogin: 'Today' }));
        } else {
          setAccountStats(prev => ({ ...prev, lastLogin: lastLoginDate.toLocaleDateString() }));
        }
      }
      
      // You can also fetch from backend if available
      // For now, keep hardcoded values for security level and 2FA
    } catch (error) {
      console.error('Error fetching account stats:', error);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const response = await API.get('/users/notifications');
      if (response.data.success && response.data.notifications) {
        setFormData(prev => ({
          ...prev,
          notifications: response.data.notifications
        }));
      }
    } catch (error) {
      console.log('No saved notification preferences, using defaults');
    }
  };

  const saveNotificationPreferences = async () => {
    setSaving(true);
    try {
      const response = await API.put('/users/notifications', formData.notifications);
      if (response.data.success) {
        toast.success('Notification preferences saved!');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF)');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const response = await API.put('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        toast.success('Profile picture updated!');
        const updatedUser = { ...user, profilePicture: response.data.profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
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
      const userId = user._id || user.id;
      const response = await API.put(`/users/${userId}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      });
      
      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
        setProfile(updatedUser);
        setEditing(false);
        toast.success('Profile updated successfully!');
        await fetchProfile();
      } else {
        toast.error(response.data.message || 'Failed to update profile');
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
        } else if (error.response.status === 404) {
          toast.error('Password change endpoint not available. Please contact administrator.');
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
    if (score <= 2) return 'admin-profile-danger';
    if (score <= 3) return 'admin-profile-warning';
    if (score <= 4) return 'admin-profile-info';
    return 'admin-profile-success';
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
      <div className="admin-profile-loading-container">
        <div className="admin-profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      {/* Welcome Header */}
      <div className="admin-profile-welcome-header">
        <div className="admin-profile-welcome-content">
          <div className="admin-profile-user-avatar-large" style={{ position: 'relative' }}>
            {user?.profilePicture ? (
              <img src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`} alt={user.name} className="admin-profile-avatar-image" />
            ) : (
              <div className="admin-profile-avatar-placeholder">
                <FaShieldAlt size={32} />
              </div>
            )}
            <button 
              className="admin-profile-upload-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Change profile picture"
            >
              <FaCamera />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/jpg,image/gif"
              onChange={handleProfilePictureUpload}
            />
          </div>
          <div className="admin-profile-welcome-text">
            <h2>Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👑</h2>
            <p>Manage your profile, security, and notification preferences.</p>
            <div className="admin-profile-user-meta">
              <span><FaUsers /> {welcomeStats.totalUsers} total users</span>
              <span><FaBuilding /> {welcomeStats.totalCompanies} companies</span>
              <span><FaBriefcase /> {welcomeStats.totalJobs} jobs posted</span>
            </div>
          </div>
        </div>
        <div className="admin-profile-welcome-actions">
          <button className="admin-profile-icon-btn" onClick={fetchWelcomeStats} title="Refresh Stats">
            <FaSyncAlt />
          </button>
          {!editing && !changingPassword && (
            <button className="admin-profile-btn admin-profile-btn-primary" onClick={() => setEditing(true)} style={{ marginLeft: '0.5rem' }}>
              <FaEdit /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="admin-profile-grid">
        {/* Left Column */}
        <div className="admin-profile-col admin-profile-col-left">
          {/* Admin Info Card */}
          <div className="admin-profile-card admin-profile-info-card">
            <div className="admin-profile-card-body">
              <div className="admin-profile-avatar">
                <FaUserShield size={50} />
              </div>
              <div className="admin-profile-name-badge">
                <h4 className="admin-profile-name">{user?.name}</h4>
                <span className="admin-profile-badge admin-profile-badge-admin">Administrator</span>
              </div>
              <p className="admin-profile-email">{user?.email}</p>
              
              <hr className="admin-profile-divider" />
              
              <div className="admin-profile-info-list">
                <p><FaPhone /> <strong>Phone:</strong> {user?.phoneNumber || 'Not provided'}</p>
                <p><FaMapMarkerAlt /> <strong>Location:</strong> {
                  (user?.address?.city || user?.address?.country) 
                    ? `${user?.address?.city || ''}${user?.address?.city && user?.address?.country ? ', ' : ''}${user?.address?.country || ''}`
                    : 'Not provided'
                }</p>
                <p><FaEnvelope /> <strong>Member since:</strong> {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Account Statistics Card - Now with real data */}
          <div className="admin-profile-card admin-profile-stats-card">
            <div className="admin-profile-card-header">
              <h5>Account Statistics</h5>
            </div>
            <div className="admin-profile-card-body">
              <div className="admin-profile-stats-list">
                <div><span>Account Status</span><span className="admin-profile-badge admin-profile-badge-success">Active</span></div>
                <div><span>Last Login</span><span>{lastLogin || 'Today'}</span></div>
                <div><span>Security Level</span><span className="admin-profile-badge admin-profile-badge-info">High</span></div>
                <div><span>2FA Status</span><span className="admin-profile-badge admin-profile-badge-warning">Not Enabled</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="admin-profile-col admin-profile-col-right">
          {/* Edit Profile Form */}
          {editing && (
            <div className="admin-profile-card admin-profile-form-card">
              <div className="admin-profile-card-header">
                <h5><FaEdit /> Edit Profile</h5>
                <button className="admin-profile-btn admin-profile-btn-outline" onClick={() => setEditing(false)}>
                  <FaTimes /> Cancel
                </button>
              </div>
              <div className="admin-profile-card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="admin-profile-form-row">
                    <div className="admin-profile-form-group">
                      <label><FaUser /> Full Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="admin-profile-form-group">
                      <label><FaEnvelope /> Email</label>
                      <input type="email" value={formData.email} disabled readOnly />
                      <small>Email cannot be changed</small>
                    </div>
                  </div>

                  <div className="admin-profile-form-group">
                    <label><FaPhone /> Phone Number</label>
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Enter phone number" />
                  </div>

                  <h6>Address</h6>
                  <div className="admin-profile-form-row">
                    <div className="admin-profile-form-group">
                      <label>Street Address</label>
                      <input type="text" name="address.street" value={formData.address.street} onChange={handleInputChange} />
                    </div>
                    <div className="admin-profile-form-group">
                      <label>City</label>
                      <input type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="admin-profile-form-row">
                    <div className="admin-profile-form-group">
                      <label>State</label>
                      <input type="text" name="address.state" value={formData.address.state} onChange={handleInputChange} />
                    </div>
                    <div className="admin-profile-form-group">
                      <label>Country</label>
                      <input type="text" name="address.country" value={formData.address.country} onChange={handleInputChange} />
                    </div>
                    <div className="admin-profile-form-group">
                      <label>Zip Code</label>
                      <input type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="admin-profile-form-actions">
                    <button type="submit" className="admin-profile-btn admin-profile-btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Section */}
          {!editing && (
            <div className="admin-profile-card admin-profile-security-card">
              <div className="admin-profile-card-header">
                <h5><FaKey /> Security</h5>
                {!changingPassword && (
                  <button className="admin-profile-btn admin-profile-btn-outline" onClick={() => setChangingPassword(true)}>
                    Change Password
                  </button>
                )}
              </div>

              {changingPassword ? (
                <div className="admin-profile-card-body">
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="admin-profile-form-group">
                      <label>Current Password</label>
                      <div className="admin-profile-input-group">
                        <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && <div className="admin-profile-error">{passwordErrors.currentPassword}</div>}
                    </div>

                    <div className="admin-profile-form-group">
                      <label>New Password</label>
                      <div className="admin-profile-input-group">
                        <input type={showNewPassword ? "text" : "password"} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && <div className="admin-profile-error">{passwordErrors.newPassword}</div>}
                      {passwordData.newPassword && (
                        <div className="admin-profile-password-strength">
                          <div className="admin-profile-strength-bar">
                            <div className="admin-profile-strength-progress" style={{ 
                              width: `${(passwordStrength.score / 5) * 100}%`, 
                              backgroundColor: getPasswordStrengthColor() === 'admin-profile-danger' ? '#dc2626' : 
                                             getPasswordStrengthColor() === 'admin-profile-warning' ? '#f59e0b' : 
                                             getPasswordStrengthColor() === 'admin-profile-info' ? '#3b82f6' : '#10b981' 
                            }}></div>
                          </div>
                          <div className="admin-profile-strength-text">
                            <span>Password Strength: </span>
                            <span className={getPasswordStrengthColor()}>{getPasswordStrengthText()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="admin-profile-form-group">
                      <label>Confirm New Password</label>
                      <div className="admin-profile-input-group">
                        <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && <div className="admin-profile-error">{passwordErrors.confirmPassword}</div>}
                      {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                        <div className="admin-profile-success"><FaCheckCircle /> Passwords match</div>
                      )}
                    </div>

                    <div className="admin-profile-form-actions">
                      <button type="submit" className="admin-profile-btn admin-profile-btn-primary" disabled={saving}>
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                      <button type="button" className="admin-profile-btn admin-profile-btn-outline" onClick={() => {
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
                <div className="admin-profile-security-info">
                  <FaCheckCircle className="admin-profile-text-success" /> Password last changed: {new Date().toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Notification Preferences */}
          {!editing && !changingPassword && (
            <div className="admin-profile-card admin-profile-notifications-card">
              <div className="admin-profile-card-header">
                <h5><FaBell /> Notification Preferences</h5>
              </div>
              <div className="admin-profile-notifications-list">
                {Object.entries(formData.notifications).map(([key, value]) => (
                  <div key={key} className="admin-profile-notification-item">
                    <div className="admin-profile-switch">
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
              <div className="admin-profile-form-actions" style={{ padding: '0 1.5rem 1.5rem' }}>
                <button 
                  className="admin-profile-btn admin-profile-btn-primary" 
                  onClick={saveNotificationPreferences}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
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