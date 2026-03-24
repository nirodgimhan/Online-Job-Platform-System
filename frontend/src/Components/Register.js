import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';
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
  FaTimesCircle
} from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phoneNumber: ''
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
    
    // Calculate score
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
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Check password strength when password changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak. Please include uppercase, lowercase, numbers, and special characters.';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional)
    if (formData.phoneNumber && !/^[+]?[\d\s-]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Role validation
    if (!['student', 'company', 'admin'].includes(formData.role)) {
      newErrors.role = 'Please select a valid role';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Show first error as toast
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }

    setLoading(true);

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...userData } = formData;
    
    try {
      const result = await register(userData);
      
      if (result && result.success) {
        toast.success('Registration successful! Redirecting to dashboard...');
        const role = result.data.user.role;
        
        // Redirect based on role
        setTimeout(() => {
          switch(role) {
            case 'student':
              navigate('/student/dashboard');
              break;
            case 'company':
              navigate('/company/dashboard');
              break;
            case 'admin':
              navigate('/admin/dashboard');
              break;
            default:
              navigate('/');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setLoading(false);
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

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow-lg border-0 rounded-lg">
            {/* Card Header */}
            <div className="card-header bg-gradient-primary text-white text-center py-4">
              <h2 className="mb-0">Create an Account</h2>
              <p className="mb-0 mt-2 text-white-50">Join our platform today</p>
            </div>

            {/* Card Body */}
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit} noValidate>
                {/* Role Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Register as *</label>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div 
                        className={`role-card p-3 text-center border rounded-3 cursor-pointer ${
                          formData.role === 'student' ? 'border-primary bg-primary bg-opacity-10' : ''
                        }`}
                        onClick={() => setFormData({...formData, role: 'student'})}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaUserGraduate size={30} className={formData.role === 'student' ? 'text-primary' : 'text-secondary'} />
                        <h6 className={`mt-2 ${formData.role === 'student' ? 'text-primary' : ''}`}>Student</h6>
                        <small className="text-muted">Job Seeker</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div 
                        className={`role-card p-3 text-center border rounded-3 cursor-pointer ${
                          formData.role === 'company' ? 'border-primary bg-primary bg-opacity-10' : ''
                        }`}
                        onClick={() => setFormData({...formData, role: 'company'})}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaBuilding size={30} className={formData.role === 'company' ? 'text-primary' : 'text-secondary'} />
                        <h6 className={`mt-2 ${formData.role === 'company' ? 'text-primary' : ''}`}>Company</h6>
                        <small className="text-muted">Employer</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div 
                        className={`role-card p-3 text-center border rounded-3 cursor-pointer ${
                          formData.role === 'admin' ? 'border-primary bg-primary bg-opacity-10' : ''
                        }`}
                        onClick={() => setFormData({...formData, role: 'admin'})}
                        style={{ cursor: 'pointer' }}
                      >
                        <FaShieldAlt size={30} className={formData.role === 'admin' ? 'text-primary' : 'text-secondary'} />
                        <h6 className={`mt-2 ${formData.role === 'admin' ? 'text-primary' : ''}`}>Admin</h6>
                        <small className="text-muted">Administrator</small>
                      </div>
                    </div>
                  </div>
                  {errors.role && <div className="text-danger small mt-2">{errors.role}</div>}
                </div>

                {/* Name Field */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label fw-bold">
                    <FaUser className="me-2 text-primary" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-bold">
                    <FaEnvelope className="me-2 text-primary" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Password Field */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-bold">
                    <FaLock className="me-2 text-primary" />
                    Password *
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
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
                      <div className="row mt-2 g-2">
                        <div className="col-6">
                          <small className={passwordStrength.hasLength ? 'text-success' : 'text-muted'}>
                            {passwordStrength.hasLength ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                            8+ characters
                          </small>
                        </div>
                        <div className="col-6">
                          <small className={passwordStrength.hasNumber ? 'text-success' : 'text-muted'}>
                            {passwordStrength.hasNumber ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                            Contains number
                          </small>
                        </div>
                        <div className="col-6">
                          <small className={passwordStrength.hasUpperCase ? 'text-success' : 'text-muted'}>
                            {passwordStrength.hasUpperCase ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                            Uppercase letter
                          </small>
                        </div>
                        <div className="col-6">
                          <small className={passwordStrength.hasLowerCase ? 'text-success' : 'text-muted'}>
                            {passwordStrength.hasLowerCase ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                            Lowercase letter
                          </small>
                        </div>
                        <div className="col-6">
                          <small className={passwordStrength.hasSpecialChar ? 'text-success' : 'text-muted'}>
                            {passwordStrength.hasSpecialChar ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                            Special character
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label fw-bold">
                    <FaLock className="me-2 text-primary" />
                    Confirm Password *
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                  {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <small className="text-success">
                      <FaCheckCircle className="me-1" /> Passwords match
                    </small>
                  )}
                </div>

                {/* Phone Number (Optional) */}
                <div className="mb-4">
                  <label htmlFor="phoneNumber" className="form-label fw-bold">
                    <FaPhone className="me-2 text-primary" />
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    className={`form-control form-control-lg ${errors.phoneNumber ? 'is-invalid' : ''}`}
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    disabled={loading}
                  />
                  {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                </div>

                {/* Terms and Conditions */}
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="terms"
                      required
                    />
                    <label className="form-check-label" htmlFor="terms">
                      I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-4">
                <p className="mb-0">
                  Already have an account? <Link to="/login" className="text-primary fw-bold">Login here</Link>
                </p>
              </div>
            </div>

            {/* Role-specific info */}
            <div className="card-footer bg-light p-4">
              <div className="row">
                <div className="col-md-4 text-center">
                  <FaUserGraduate className="text-primary mb-2" size={24} />
                  <h6>Student</h6>
                  <small className="text-muted">Browse jobs, apply, track applications</small>
                </div>
                <div className="col-md-4 text-center">
                  <FaBuilding className="text-primary mb-2" size={24} />
                  <h6>Company</h6>
                  <small className="text-muted">Post jobs, manage applicants, hire talent</small>
                </div>
                <div className="col-md-4 text-center">
                  <FaShieldAlt className="text-primary mb-2" size={24} />
                  <h6>Admin</h6>
                  <small className="text-muted">Manage users, companies, platform settings</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;