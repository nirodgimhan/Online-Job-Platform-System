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
    <div className="lg-login-container">
      <div className="lg-login-wrapper">
        {/* Left Side - Sign In Form */}
        <div className="lg-login-form-side">
          <div className="lg-login-content">
            <h2 className="lg-login-title">Welcome Back!</h2>
            <p className="lg-login-subtitle">To keep connected with us please login with your personal info</p>
            
            {/* Social Icons - Inline Centered */}
            <div className="lg-social-icons">
              <button className="lg-social-icon lg-social-facebook">
                <FaFacebookF />
              </button>
              <button className="lg-social-icon lg-social-google">
                <FaGoogle />
              </button>
              <button className="lg-social-icon lg-social-linkedin">
                <FaLinkedinIn />
              </button>
            </div>
            
            <div className="lg-login-divider">
              <span>or use your email for registration</span>
            </div>
            
            <form onSubmit={handleSubmit} className="lg-login-form">
              <div className="lg-form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="lg-form-input"
                />
              </div>
              
              <div className="lg-form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="lg-form-input"
                />
              </div>
              
              <button 
                type="submit" 
                className="lg-login-btn"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'SIGN IN'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Side - Sign Up Info */}
        <div className="lg-signup-side">
          <div className="lg-signup-content">
            <h2 className="lg-signup-title">Welcome</h2>
            <p className="lg-signup-subtitle">Create Account</p>
            <Link to="/register" className="lg-signup-btn">
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;