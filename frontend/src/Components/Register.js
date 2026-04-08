import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaPhone, 
  FaUserGraduate, 
  FaBuilding, 
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaFacebookF,
  FaGoogle,
  FaLinkedinIn
} from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phoneNumber: '',
    // Company-specific fields
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    description: '',
    // Admin-specific field
    adminSecretKey: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasNumber: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false
  });
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength checker
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak. Please include uppercase, lowercase, numbers, and special characters.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phoneNumber && !/^[+]?[\d\s-]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Company-specific validations
    if (formData.role === 'company') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!formData.industry.trim()) {
        newErrors.industry = 'Industry is required';
      }
    }

    // Admin-specific validations
    if (formData.role === 'admin') {
      if (!formData.adminSecretKey.trim()) {
        newErrors.adminSecretKey = 'Secret key is required for admin registration';
      }
    }

    return newErrors;
  };

  // Helper to create company profile after registration
  const createCompanyProfile = async (userId) => {
    try {
      const profileData = {
        companyName: formData.companyName,
        industry: formData.industry || null,
        companySize: formData.companySize || null,
        website: formData.website || null,
        description: formData.description || null,
        contactEmail: formData.email,
        contactPhone: formData.phoneNumber || null
      };
      await API.post('/companies/profile', profileData);
      console.log('Company profile created successfully');
    } catch (error) {
      console.error('Error creating company profile:', error);
      // We don't show an error to the user because registration already succeeded
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }

    setLoading(true);

    // Prepare data for backend
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phoneNumber: formData.phoneNumber
    };

    // If admin, add secret key
    if (formData.role === 'admin') {
      userData.adminSecretKey = formData.adminSecretKey;
    }
    
    try {
      const result = await register(userData);
      
      if (result && result.success) {
        toast.success('Registration successful! Redirecting...');
        
        // If company, create the profile now
        if (formData.role === 'company') {
          await createCompanyProfile(result.data.user.id);
        }
        
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const score = passwordStrength.score;
    if (score <= 2) return '#e53e3e';
    if (score <= 3) return '#ed8936';
    if (score <= 4) return '#4299e1';
    return '#48bb78';
  };

  const getPasswordStrengthText = () => {
    const score = passwordStrength.score;
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="rg-register-container">
      <div className="rg-register-wrapper">
        {/* Left Side - Sign Up Form */}
        <div className="rg-register-form-side">
          <div className="rg-register-content">
            <h2 className="rg-register-title">Create Account</h2>
            <p className="rg-register-subtitle">To keep connected with us please sign up with your personal info</p>
            
            {/* Social Icons - Inline Centered */}
            <div className="rg-social-icons">
              <button className="rg-social-icon rg-social-facebook">
                <FaFacebookF />
              </button>
              <button className="rg-social-icon rg-social-google">
                <FaGoogle />
              </button>
              <button className="rg-social-icon rg-social-linkedin">
                <FaLinkedinIn />
              </button>
            </div>
            
            <div className="rg-register-divider">
              <span>or use your email for registration</span>
            </div>
            
            <form onSubmit={handleSubmit} className="rg-register-form">
              {/* Role Selection - Compact Cards (Icon + Name only) */}
              <div className="rg-role-selection">
                <div 
                  className={`rg-role-card ${formData.role === 'student' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'student'})}
                >
                  <FaUserGraduate className="rg-role-icon" />
                  <h4>Student</h4>
                </div>
                <div 
                  className={`rg-role-card ${formData.role === 'company' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'company'})}
                >
                  <FaBuilding className="rg-role-icon" />
                  <h4>Company</h4>
                </div>
                <div 
                  className={`rg-role-card ${formData.role === 'admin' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'admin'})}
                >
                  <FaShieldAlt className="rg-role-icon" />
                  <h4>Admin</h4>
                </div>
              </div>
              
              {/* Common Fields */}
              <div className="rg-form-group">
                <input
                  type="text"
                  name="name"
                  placeholder={formData.role === 'student' ? "Full Name" : (formData.role === 'company' ? "Contact Person Name" : "Admin Name")}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`rg-form-input ${errors.name ? 'rg-error' : ''}`}
                  disabled={loading}
                />
                {errors.name && <span className="rg-error-text">{errors.name}</span>}
              </div>
              
              {formData.role === 'company' && (
                <>
                  <div className="rg-form-group">
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Company Name"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className={`rg-form-input ${errors.companyName ? 'rg-error' : ''}`}
                      disabled={loading}
                    />
                    {errors.companyName && <span className="rg-error-text">{errors.companyName}</span>}
                  </div>
                  <div className="rg-form-group">
                    <input
                      type="text"
                      name="industry"
                      placeholder="Industry (e.g., Technology, Healthcare)"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                      className={`rg-form-input ${errors.industry ? 'rg-error' : ''}`}
                      disabled={loading}
                    />
                    {errors.industry && <span className="rg-error-text">{errors.industry}</span>}
                  </div>
                  <div className="rg-form-row">
                    <div className="rg-form-group">
                      <select
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleChange}
                        className="rg-form-input"
                        disabled={loading}
                      >
                        <option value="">Company Size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                    <div className="rg-form-group">
                      <input
                        type="url"
                        name="website"
                        placeholder="Website (optional)"
                        value={formData.website}
                        onChange={handleChange}
                        className="rg-form-input"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="rg-form-group">
                    <textarea
                      name="description"
                      placeholder="Company Description (optional)"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="rg-form-input"
                      disabled={loading}
                    />
                  </div>
                </>
              )}
              
              {/* Email Field */}
              <div className="rg-form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`rg-form-input ${errors.email ? 'rg-error' : ''}`}
                  disabled={loading}
                />
                {errors.email && <span className="rg-error-text">{errors.email}</span>}
              </div>
              
              {/* Phone Number (Optional) */}
              <div className="rg-form-group">
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number (Optional)"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`rg-form-input ${errors.phoneNumber ? 'rg-error' : ''}`}
                  disabled={loading}
                />
                {errors.phoneNumber && <span className="rg-error-text">{errors.phoneNumber}</span>}
              </div>
              
              {/* Admin Secret Key Field (only for admin role) */}
              {formData.role === 'admin' && (
                <div className="rg-form-group">
                  <input
                    type="password"
                    name="adminSecretKey"
                    placeholder="Admin Secret Key"
                    value={formData.adminSecretKey}
                    onChange={handleChange}
                    required
                    className={`rg-form-input ${errors.adminSecretKey ? 'rg-error' : ''}`}
                    disabled={loading}
                  />
                  {errors.adminSecretKey && <span className="rg-error-text">{errors.adminSecretKey}</span>}
                  <small className="rg-form-hint">Please enter the admin registration key provided by the system administrator.</small>
                </div>
              )}
              
              {/* Password Field */}
              <div className="rg-form-group">
                <div className="rg-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`rg-form-input ${errors.password ? 'rg-error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="rg-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="rg-error-text">{errors.password}</span>}
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="rg-password-strength">
                    <div className="rg-strength-bar">
                      <div 
                        className="rg-strength-progress"
                        style={{ 
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          background: getPasswordStrengthColor()
                        }}
                      ></div>
                    </div>
                    <div className="rg-strength-text">
                      <span>Password Strength: </span>
                      <span style={{ color: getPasswordStrengthColor() }}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="rg-strength-requirements">
                      <span className={passwordStrength.hasLength ? 'rg-valid' : 'rg-invalid'}>
                        {passwordStrength.hasLength ? <FaCheckCircle /> : <FaTimesCircle />} 8+ characters
                      </span>
                      <span className={passwordStrength.hasNumber ? 'rg-valid' : 'rg-invalid'}>
                        {passwordStrength.hasNumber ? <FaCheckCircle /> : <FaTimesCircle />} Number
                      </span>
                      <span className={passwordStrength.hasUpperCase ? 'rg-valid' : 'rg-invalid'}>
                        {passwordStrength.hasUpperCase ? <FaCheckCircle /> : <FaTimesCircle />} Uppercase
                      </span>
                      <span className={passwordStrength.hasLowerCase ? 'rg-valid' : 'rg-invalid'}>
                        {passwordStrength.hasLowerCase ? <FaCheckCircle /> : <FaTimesCircle />} Lowercase
                      </span>
                      <span className={passwordStrength.hasSpecialChar ? 'rg-valid' : 'rg-invalid'}>
                        {passwordStrength.hasSpecialChar ? <FaCheckCircle /> : <FaTimesCircle />} Special char
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Confirm Password Field */}
              <div className="rg-form-group">
                <div className="rg-password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`rg-form-input ${errors.confirmPassword ? 'rg-error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="rg-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="rg-error-text">{errors.confirmPassword}</span>}
                {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <span className="rg-valid-text">
                    <FaCheckCircle /> Passwords match
                  </span>
                )}
              </div>
              
              {/* Terms and Conditions */}
              <div className="rg-terms">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="rg-terms-checkbox"
                />
                <label htmlFor="terms">
                  I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                </label>
              </div>
              
              <button 
                type="submit" 
                className="rg-register-btn"
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'SIGN UP'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Side - Sign In Info */}
        <div className="rg-signin-side">
          <div className="rg-signin-content">
            <h2 className="rg-signin-title">Welcome</h2>
            <p className="rg-signin-subtitle">Welcome Back!</p>
            <Link to="/login" className="rg-signin-btn">
              SIGN IN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;