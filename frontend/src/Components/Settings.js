import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaTimesCircle, FaSave, FaEdit, FaBell, FaMoon, FaSun,
  FaExclamationTriangle, FaTrashAlt, FaPowerOff, FaSpinner, FaArrowLeft,
  FaKey, FaMobileAlt, FaPaperPlane, FaShieldAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Profile form
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ 
    score: 0, hasLength: false, hasNumber: false, 
    hasUpperCase: false, hasLowerCase: false, hasSpecialChar: false 
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Phone verification
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    newUserAlerts: true,
    companyVerificationAlerts: true,
    reportAlerts: true,
    systemUpdates: true
  });
  const [savingNotif, setSavingNotif] = useState(false);

  // Danger zone
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('settings-dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('settings-dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || { street: '', city: '', state: '', country: '', zipCode: '' }
      });
      setPhoneInput(user.phoneNumber || '');
      setPhoneVerified(!!user.phoneNumber);
      if (user.notificationPreferences) {
        setNotifications(user.notificationPreferences);
      }
    }
  }, [user]);

  // Password strength checker
  const checkStrength = (pwd) => {
    const strength = {
      score: 0,
      hasLength: pwd.length >= 8,
      hasNumber: /\d/.test(pwd),
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (name === 'newPassword') checkStrength(value);
    if (passwordErrors[name]) setPasswordErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password required';
    if (!passwordData.newPassword) errors.newPassword = 'New password required';
    else if (passwordData.newPassword.length < 8) errors.newPassword = 'Minimum 8 characters';
    else if (passwordStrength.score < 3) errors.newPassword = 'Password too weak';
    if (!passwordData.confirmPassword) errors.confirmPassword = 'Confirm your password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = validatePasswordForm();
    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setChangingPassword(true);
    try {
      await API.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Phone verification – send OTP
  const sendOtp = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setSendingOtp(true);
    setVerificationMessage('');
    try {
      const response = await API.post('/otp/send', { phone: phoneInput });
      if (response.data.success) {
        setShowOtpInput(true);
        setVerificationMessage(response.data.message || 'OTP sent. Enter the code below.');
        if (response.data.devOtp) {
          console.log('Dev OTP:', response.data.devOtp);
          toast.info(`Test OTP: ${response.data.devOtp} (check console)`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    try {
      // The OTP verification endpoint already updates the user's phone number
      const verifyResponse = await API.post('/otp/verify', { phone: phoneInput, otp: otpCode });
      if (verifyResponse.data.success) {
        toast.success('Phone number verified and updated!');
        setPhoneVerified(true);
        setShowOtpInput(false);
        setOtpCode('');
        // Update the local user object with the new phone number
        updateUser({ ...user, phoneNumber: phoneInput });
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Update profile (name, address)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const userId = user._id || user.id;
    if (!userId) {
      toast.error('User ID missing. Please refresh.');
      return;
    }
    setSavingProfile(true);
    try {
      const response = await API.put(`/users/${userId}`, {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        address: profile.address
      });
      if (response.data.success) {
        toast.success('Profile updated');
        updateUser({ ...user, ...response.data.user });
        setEditingProfile(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save notification preferences
  const saveNotifications = async () => {
    setSavingNotif(true);
    try {
      await API.put('/users/notifications', notifications);
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSavingNotif(false);
    }
  };

  // Danger zone
  const deactivateAccount = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? You can reactivate later by contacting support.')) return;
    setDeactivating(true);
    try {
      await API.put('/users/deactivate');
      toast.info('Account deactivated. You will be logged out.');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error('Failed to deactivate account');
    } finally {
      setDeactivating(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('WARNING: This action is permanent! All your data will be lost. Are you absolutely sure?')) return;
    setDeleting(true);
    try {
      await API.delete('/users/me');
      toast.error('Account deleted. Goodbye.');
      logout();
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const s = passwordStrength.score;
    if (s <= 2) return '#dc2626';
    if (s <= 3) return '#f59e0b';
    if (s <= 4) return '#3b82f6';
    return '#10b981';
  };
  const getPasswordStrengthText = () => {
    const s = passwordStrength.score;
    if (s <= 2) return 'Weak';
    if (s <= 3) return 'Fair';
    if (s <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <h1>Settings</h1>
        <button className="settings-dark-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      <div className="settings-grid">
        {/* Profile Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FaUser /> Profile Information
            {!editingProfile && (
              <button className="settings-edit-btn" onClick={() => setEditingProfile(true)}>
                <FaEdit /> Edit
              </button>
            )}
          </div>
          <div className="settings-card-body">
            {editingProfile ? (
              <form onSubmit={handleProfileSubmit}>
                <div className="settings-form-group">
                  <label>Full Name</label>
                  <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required />
                </div>
                <div className="settings-form-group">
                  <label>Email</label>
                  <input type="email" value={profile.email} disabled readOnly />
                  <small>Email cannot be changed</small>
                </div>
                <div className="settings-form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} />
                </div>
                <h4>Address</h4>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>Street</label>
                    <input type="text" value={profile.address.street} onChange={e => setProfile({...profile, address: {...profile.address, street: e.target.value}})} />
                  </div>
                  <div className="settings-form-group">
                    <label>City</label>
                    <input type="text" value={profile.address.city} onChange={e => setProfile({...profile, address: {...profile.address, city: e.target.value}})} />
                  </div>
                </div>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>State</label>
                    <input type="text" value={profile.address.state} onChange={e => setProfile({...profile, address: {...profile.address, state: e.target.value}})} />
                  </div>
                  <div className="settings-form-group">
                    <label>Country</label>
                    <input type="text" value={profile.address.country} onChange={e => setProfile({...profile, address: {...profile.address, country: e.target.value}})} />
                  </div>
                  <div className="settings-form-group">
                    <label>Zip Code</label>
                    <input type="text" value={profile.address.zipCode} onChange={e => setProfile({...profile, address: {...profile.address, zipCode: e.target.value}})} />
                  </div>
                </div>
                <div className="settings-form-actions">
                  <button type="submit" className="settings-btn-primary" disabled={savingProfile}>
                    {savingProfile ? <FaSpinner className="spin" /> : <FaSave />} Save Changes
                  </button>
                  <button type="button" className="settings-btn-outline" onClick={() => setEditingProfile(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="settings-profile-view">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Phone:</strong> {profile.phoneNumber || 'Not provided'}</p>
                <p><strong>Address:</strong> {profile.address.street ? `${profile.address.street}, ${profile.address.city}, ${profile.address.state}, ${profile.address.country} - ${profile.address.zipCode}` : 'Not provided'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Phone Verification */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FaMobileAlt /> Phone Verification
          </div>
          <div className="settings-card-body">
            <div className="settings-phone-status">
              {phoneVerified ? (
                <span className="settings-verified"><FaCheckCircle /> Verified</span>
              ) : (
                <span className="settings-unverified"><FaTimesCircle /> Not Verified</span>
              )}
            </div>
            <div className="settings-form-group">
              <label>Phone Number</label>
              <div className="settings-phone-input">
                <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="+94XXXXXXXXX" />
                <button onClick={sendOtp} disabled={sendingOtp}>
                  {sendingOtp ? <FaSpinner className="spin" /> : <FaPaperPlane />} Send OTP
                </button>
              </div>
            </div>
            {showOtpInput && (
              <div className="settings-form-group">
                <label>Enter OTP</label>
                <div className="settings-otp-input">
                  <input type="text" maxLength="6" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="6-digit code" />
                  <button onClick={verifyOtp} disabled={verifyingOtp}>
                    {verifyingOtp ? <FaSpinner className="spin" /> : <FaCheckCircle />} Verify
                  </button>
                </div>
                {verificationMessage && <small>{verificationMessage}</small>}
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FaKey /> Change Password
          </div>
          <div className="settings-card-body">
            <form onSubmit={handleChangePassword}>
              <div className="settings-form-group">
                <label>Current Password</label>
                <div className="settings-password-input">
                  <input type={showCurrent ? 'text' : 'password'} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <span className="settings-error">{passwordErrors.currentPassword}</span>}
              </div>
              <div className="settings-form-group">
                <label>New Password</label>
                <div className="settings-password-input">
                  <input type={showNew ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                  <button type="button" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordData.newPassword && (
                  <div className="settings-password-strength">
                    <div className="settings-strength-bar" style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: getPasswordStrengthColor() }}></div>
                    <span>Strength: <span style={{ color: getPasswordStrengthColor() }}>{getPasswordStrengthText()}</span></span>
                  </div>
                )}
                {passwordErrors.newPassword && <span className="settings-error">{passwordErrors.newPassword}</span>}
              </div>
              <div className="settings-form-group">
                <label>Confirm New Password</label>
                <div className="settings-password-input">
                  <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && <span className="settings-error">{passwordErrors.confirmPassword}</span>}
                {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                  <span className="settings-success"><FaCheckCircle /> Passwords match</span>
                )}
              </div>
              <button type="submit" className="settings-btn-primary" disabled={changingPassword}>
                {changingPassword ? <FaSpinner className="spin" /> : <FaSave />} Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FaBell /> Notification Preferences
          </div>
          <div className="settings-card-body">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="settings-switch-item">
                <label htmlFor={`notif-${key}`}>
                  {key === 'emailNotifications' && 'Email Notifications'}
                  {key === 'newUserAlerts' && 'New User Alerts'}
                  {key === 'companyVerificationAlerts' && 'Company Verification Alerts'}
                  {key === 'reportAlerts' && 'Report Alerts'}
                  {key === 'systemUpdates' && 'System Updates'}
                </label>
                <div className="settings-switch">
                  <input
                    type="checkbox"
                    id={`notif-${key}`}
                    checked={value}
                    onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                  />
                  <span className="settings-slider"></span>
                </div>
              </div>
            ))}
            <button className="settings-btn-primary" onClick={saveNotifications} disabled={savingNotif}>
              {savingNotif ? <FaSpinner className="spin" /> : <FaSave />} Save Preferences
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-card settings-danger-card">
          <div className="settings-card-header">
            <FaExclamationTriangle /> Danger Zone
          </div>
          <div className="settings-card-body">
            <div className="settings-danger-actions">
              <button onClick={deactivateAccount} disabled={deactivating} className="settings-btn-warning">
                <FaPowerOff /> {deactivating ? 'Deactivating...' : 'Deactivate Account'}
              </button>
              <button onClick={deleteAccount} disabled={deleting} className="settings-btn-danger">
                <FaTrashAlt /> {deleting ? 'Deleting...' : 'Delete Account Permanently'}
              </button>
            </div>
            <p className="settings-danger-note">⚠️ Deactivating hides your profile; deleting is irreversible.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;