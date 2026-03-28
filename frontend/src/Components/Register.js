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
  FaLinkedinIn,
  FaIndustry,
  FaUsers,
  FaGlobe
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
    <div className="ds-register-container">
      <div className="ds-register-wrapper">
        {/* Left Side - Sign Up Form */}
        <div className="ds-register-form-side">
          <div className="ds-register-content">
            <h2 className="ds-register-title">Create Account</h2>
            <p className="ds-register-subtitle">To keep connected with us please sign up with your personal info</p>
            
            {/* Social Buttons */}
            <button className="ds-social-btn ds-social-facebook">
              <FaFacebookF /> Sign up with Facebook
            </button>
            <button className="ds-social-btn ds-social-google">
              <FaGoogle /> Sign up with Google
            </button>
            <button className="ds-social-btn ds-social-linkedin">
              <FaLinkedinIn /> Sign up with LinkedIn
            </button>
            
            <div className="ds-register-divider">
              <span>or use your email for registration</span>
            </div>
            
            <form onSubmit={handleSubmit} className="ds-register-form">
              {/* Role Selection - Inline Centered */}
              <div className="ds-role-selection">
                <div 
                  className={`ds-role-card ${formData.role === 'student' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'student'})}
                >
                  <FaUserGraduate className="ds-role-icon" />
                  <h4>Student</h4>
                  <p>Looking for job opportunities</p>
                </div>
                <div 
                  className={`ds-role-card ${formData.role === 'company' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'company'})}
                >
                  <FaBuilding className="ds-role-icon" />
                  <h4>Company</h4>
                  <p>Hiring talent</p>
                </div>
                <div 
                  className={`ds-role-card ${formData.role === 'admin' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'admin'})}
                >
                  <FaShieldAlt className="ds-role-icon" />
                  <h4>Admin</h4>
                  <p>Platform administrator</p>
                </div>
              </div>
              
              {/* Common Fields */}
              <div className="ds-form-group">
                <input
                  type="text"
                  name="name"
                  placeholder={formData.role === 'student' ? "Full Name" : (formData.role === 'company' ? "Contact Person Name" : "Admin Name")}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`ds-form-input ${errors.name ? 'ds-error' : ''}`}
                  disabled={loading}
                />
                {errors.name && <span className="ds-error-text">{errors.name}</span>}
              </div>
              
              {formData.role === 'company' && (
                <>
                  <div className="ds-form-group">
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Company Name"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className={`ds-form-input ${errors.companyName ? 'ds-error' : ''}`}
                      disabled={loading}
                    />
                    {errors.companyName && <span className="ds-error-text">{errors.companyName}</span>}
                  </div>
                  <div className="ds-form-group">
                    <input
                      type="text"
                      name="industry"
                      placeholder="Industry (e.g., Technology, Healthcare)"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                      className={`ds-form-input ${errors.industry ? 'ds-error' : ''}`}
                      disabled={loading}
                    />
                    {errors.industry && <span className="ds-error-text">{errors.industry}</span>}
                  </div>
                  <div className="ds-form-row">
                    <div className="ds-form-group">
                      <select
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleChange}
                        className="ds-form-input"
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
                    <div className="ds-form-group">
                      <input
                        type="url"
                        name="website"
                        placeholder="Website (optional)"
                        value={formData.website}
                        onChange={handleChange}
                        className="ds-form-input"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="ds-form-group">
                    <textarea
                      name="description"
                      placeholder="Company Description (optional)"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="ds-form-input"
                      disabled={loading}
                    />
                  </div>
                </>
              )}
              
              {/* Email Field */}
              <div className="ds-form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`ds-form-input ${errors.email ? 'ds-error' : ''}`}
                  disabled={loading}
                />
                {errors.email && <span className="ds-error-text">{errors.email}</span>}
              </div>
              
              {/* Phone Number (Optional) */}
              <div className="ds-form-group">
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number (Optional)"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`ds-form-input ${errors.phoneNumber ? 'ds-error' : ''}`}
                  disabled={loading}
                />
                {errors.phoneNumber && <span className="ds-error-text">{errors.phoneNumber}</span>}
              </div>
              
              {/* Admin Secret Key Field (only for admin role) */}
              {formData.role === 'admin' && (
                <div className="ds-form-group">
                  <input
                    type="password"
                    name="adminSecretKey"
                    placeholder="Admin Secret Key"
                    value={formData.adminSecretKey}
                    onChange={handleChange}
                    required
                    className={`ds-form-input ${errors.adminSecretKey ? 'ds-error' : ''}`}
                    disabled={loading}
                  />
                  {errors.adminSecretKey && <span className="ds-error-text">{errors.adminSecretKey}</span>}
                  <small className="ds-form-hint">Please enter the admin registration key provided by the system administrator.</small>
                </div>
              )}
              
              {/* Password Field */}
              <div className="ds-form-group">
                <div className="ds-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`ds-form-input ${errors.password ? 'ds-error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="ds-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="ds-error-text">{errors.password}</span>}
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="ds-password-strength">
                    <div className="ds-strength-bar">
                      <div 
                        className="ds-strength-progress"
                        style={{ 
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          background: getPasswordStrengthColor()
                        }}
                      ></div>
                    </div>
                    <div className="ds-strength-text">
                      <span>Password Strength: </span>
                      <span style={{ color: getPasswordStrengthColor() }}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="ds-strength-requirements">
                      <span className={passwordStrength.hasLength ? 'ds-valid' : 'ds-invalid'}>
                        {passwordStrength.hasLength ? <FaCheckCircle /> : <FaTimesCircle />} 8+ characters
                      </span>
                      <span className={passwordStrength.hasNumber ? 'ds-valid' : 'ds-invalid'}>
                        {passwordStrength.hasNumber ? <FaCheckCircle /> : <FaTimesCircle />} Number
                      </span>
                      <span className={passwordStrength.hasUpperCase ? 'ds-valid' : 'ds-invalid'}>
                        {passwordStrength.hasUpperCase ? <FaCheckCircle /> : <FaTimesCircle />} Uppercase
                      </span>
                      <span className={passwordStrength.hasLowerCase ? 'ds-valid' : 'ds-invalid'}>
                        {passwordStrength.hasLowerCase ? <FaCheckCircle /> : <FaTimesCircle />} Lowercase
                      </span>
                      <span className={passwordStrength.hasSpecialChar ? 'ds-valid' : 'ds-invalid'}>
                        {passwordStrength.hasSpecialChar ? <FaCheckCircle /> : <FaTimesCircle />} Special char
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Confirm Password Field */}
              <div className="ds-form-group">
                <div className="ds-password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`ds-form-input ${errors.confirmPassword ? 'ds-error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="ds-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="ds-error-text">{errors.confirmPassword}</span>}
                {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <span className="ds-valid-text">
                    <FaCheckCircle /> Passwords match
                  </span>
                )}
              </div>
              
              {/* Terms and Conditions */}
              <div className="ds-terms">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="ds-terms-checkbox"
                />
                <label htmlFor="terms">
                  I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                </label>
              </div>
              
              <button 
                type="submit" 
                className="ds-register-btn"
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'SIGN UP'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Side - Sign In Info */}
        <div className="ds-signin-side">
          <div className="ds-signin-content">
            <h2 className="ds-signin-title">Welcome</h2>
            <p className="ds-signin-subtitle">Welcome Back!</p>
            <Link to="/login" className="ds-signin-btn">
              SIGN IN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;