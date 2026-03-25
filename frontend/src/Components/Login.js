import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';
import { FaFacebookF, FaGoogle, FaLinkedinIn } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData);
    
    if (result.success) {
      const role = result.data.user.role;
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
    }
    
    setLoading(false);
  };

  return (
    <div className="ds-login-container">
      <div className="ds-login-wrapper">
        {/* Left Side - Sign In Form */}
        <div className="ds-login-form-side">
          <div className="ds-login-content">
            <h2 className="ds-login-title">Welcome Back!</h2>
            <p className="ds-login-subtitle">To keep connected with us please login with your personal info</p>
            
            <button className="ds-social-btn ds-social-facebook">
              <FaFacebookF /> Sign in with Facebook
            </button>
            <button className="ds-social-btn ds-social-google">
              <FaGoogle /> Sign in with Google
            </button>
            <button className="ds-social-btn ds-social-linkedin">
              <FaLinkedinIn /> Sign in with LinkedIn
            </button>
            
            <div className="ds-login-divider">
              <span>or use your email for registration</span>
            </div>
            
            <form onSubmit={handleSubmit} className="ds-login-form">
              <div className="ds-form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="ds-form-input"
                />
              </div>
              
              <div className="ds-form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="ds-form-input"
                />
              </div>
              
              <button 
                type="submit" 
                className="ds-login-btn"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'SIGN IN'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Side - Sign Up Info */}
        <div className="ds-signup-side">
          <div className="ds-signup-content">
            <h2 className="ds-signup-title">Welcome </h2>
            <p className="ds-signup-subtitle">Create Account</p>
            <Link to="/register" className="ds-signup-btn">
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;