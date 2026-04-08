import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';  // <-- ADDED
import { toast } from 'react-toastify';
import { 
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt, FaGithub,
  FaClock,
  FaUser,
  FaComment,
  FaPaperPlane,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaCheckCircle,
  FaHeadset,
  FaQuestionCircle, FaBriefcase,
  FaArrowRight,
  FaBuilding
} from 'react-icons/fa';

const ContactUs = () => {
  const { submitContact } = useAuth();  // <-- ADDED

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt />,
      title: 'Visit Us',
      details: ['123 Business Avenue', 'Colombo 03', 'Sri Lanka']
    },
    {
      icon: <FaEnvelope />,
      title: 'Email Us',
      details: ['support@jobportal.com', 'info@jobportal.com']
    },
    {
      icon: <FaPhone />,
      title: 'Call Us',
      details: ['+94 11 234 5678', '+94 77 123 4567']
    },
    {
      icon: <FaClock />,
      title: 'Working Hours',
      details: ['Monday - Friday: 9AM - 6PM', 'Saturday: 10AM - 2PM', 'Sunday: Closed']
    }
  ];

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on the "Register" button and fill in your details. You can register as a student or a company.'
    },
    {
      question: 'Is JobPortal free for students?',
      answer: 'Yes, JobPortal is completely free for students. You can search and apply for jobs without any cost.'
    },
    {
      question: 'How do I post a job?',
      answer: 'Companies need to create a company profile first. Once verified, you can post jobs from your dashboard.'
    },
    {
      question: 'How long does verification take?',
      answer: 'Company verification typically takes 24-48 hours. We\'ll notify you once your profile is verified.'
    }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setSubmitting(true);

    // --- REPLACED SIMULATED API CALL WITH REAL BACKEND ---
    const result = await submitContact({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message
    });

    if (result.success) {
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      // Toast success is already shown inside submitContact, but we keep the original behavior
    } else {
      // Error toast is already shown inside submitContact
      // Keep original error handling style
    }
    setSubmitting(false);
  };

  return (
    <div className="cu-contact-us">
      {/* Hero Section */}
      <section className="cu-hero">
        <div className="cu-container">
          <h1>Contact <span className="cu-highlight">Us</span></h1>
          <p className="cu-subtitle">
            Have questions? We're here to help! Reach out to us anytime.
          </p>
        </div>
      </section>

      {/* Info Cards */}
      <section className="cu-info-section">
        <div className="cu-container">
          <div className="cu-info-grid">
            {contactInfo.map((item, index) => (
              <div key={index} className="cu-info-card">
                <div className="cu-info-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                {item.details.map((detail, i) => (
                  <p key={i}>{detail}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="cu-form-section">
        <div className="cu-container">
          <div className="cu-form-grid">
            {/* Contact Form */}
            <div className="cu-form-container">
              <h2>Send Us a Message</h2>
              <p>We'll get back to you within 24 hours</p>

              {submitted ? (
                <div className="cu-success-message">
                  <FaCheckCircle />
                  <h3>Thank You!</h3>
                  <p>Your message has been sent successfully. We'll contact you soon.</p>
                  <button 
                    className="cu-btn cu-btn-primary"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="cu-form-group">
                    <label htmlFor="name">
                      <FaUser /> Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`cu-form-control ${errors.name ? 'cu-is-invalid' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <div className="cu-invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="cu-form-group">
                    <label htmlFor="email">
                      <FaEnvelope /> Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`cu-form-control ${errors.email ? 'cu-is-invalid' : ''}`}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                    {errors.email && <div className="cu-invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="cu-form-group">
                    <label htmlFor="subject">
                      <FaComment /> Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className={`cu-form-control ${errors.subject ? 'cu-is-invalid' : ''}`}
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                    />
                    {errors.subject && <div className="cu-invalid-feedback">{errors.subject}</div>}
                  </div>

                  <div className="cu-form-group">
                    <label htmlFor="message">
                      <FaComment /> Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      className={`cu-form-control ${errors.message ? 'cu-is-invalid' : ''}`}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Type your message here..."
                    />
                    {errors.message && <div className="cu-invalid-feedback">{errors.message}</div>}
                  </div>

                  <button 
                    type="submit" 
                    className="cu-btn cu-btn-primary cu-btn-block"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="cu-spinner-small"></span> 
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Map & Info */}
            <div className="cu-info-container">
              <div className="cu-map-placeholder">
                <FaBuilding className="cu-map-icon" />
                <p>Our Office Location</p>
                <small>123 Business Avenue, Colombo 03, Sri Lanka</small>
              </div>

              <div className="cu-social-section">
                <h3>Connect With Us</h3>
                <div className="cu-social-icons">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="cu-social-icon cu-facebook">
                    <FaFacebook />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="cu-social-icon cu-twitter">
                    <FaTwitter />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="cu-social-icon cu-linkedin">
                    <FaLinkedin />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="cu-social-icon cu-instagram">
                    <FaInstagram />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="cu-social-icon cu-youtube">
                    <FaYoutube />
                  </a>
                </div>
              </div>

              <div className="cu-support-box">
                <FaHeadset />
                <h4>24/7 Customer Support</h4>
                <p>Our support team is always ready to help you with any questions or concerns.</p>
                <Link to="/faq" className="cu-btn cu-btn-outline-light">
                  <FaQuestionCircle /> Visit FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="cu-faq-section">
        <div className="cu-container">
          <h2 className="cu-section-title">Frequently Asked Questions</h2>
          <p className="cu-section-subtitle">Quick answers to common questions</p>
          <div className="cu-faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="cu-faq-card">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="cu-faq-more">
            <p>Didn't find what you're looking for?</p>
            <Link to="/faq" className="cu-btn cu-btn-outline-primary">
              View All FAQs <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="cu-newsletter">
        <div className="cu-container">
          <div className="cu-newsletter-content">
            <h2>Stay Updated</h2>
            <p>Subscribe to our newsletter for the latest job opportunities and career tips</p>
            <form className="cu-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                className="cu-form-control"
              />
              <button type="submit" className="cu-btn cu-btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="cu-footer">
        <div className="cu-container">
          <div className="cu-footer-grid">
            <div className="cu-footer-col">
              <div className="cu-footer-logo">
                <FaBriefcase className="cu-logo-icon" />
                <span>JobPortal</span>
              </div>
              <p>Connecting talented professionals with forward-thinking companies since 2020.</p>
              <div className="cu-social-links">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <FaLinkedin />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <FaTwitter />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <FaFacebook />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <FaGithub />
                </a>
              </div>
            </div>

            <div className="cu-footer-col">
              <h4>For Job Seekers</h4>
              <ul>
                <li><Link to="/student/jobs">Browse Jobs</Link></li>
                <li><Link to="/student/cv-manager">CV Manager</Link></li>
                <li><Link to="/student/job-alerts">Job Alerts</Link></li>
                <li><Link to="/student/saved-jobs">Saved Jobs</Link></li>
              </ul>
            </div>

            <div className="cu-footer-col">
              <h4>For Employers</h4>
              <ul>
                <li><Link to="/company/post-job">Post a Job</Link></li>
                <li><Link to="/company/manage-jobs">Manage Jobs</Link></li>
                <li><Link to="/company/applicants">Browse Candidates</Link></li>
                <li><Link to="/company/pricing">Pricing</Link></li>
              </ul>
            </div>

            <div className="cu-footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="cu-footer-bottom">
            <p>&copy; 2024 JobPortal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;