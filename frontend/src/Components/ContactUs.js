import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
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
  FaQuestionCircle,
  FaArrowRight,
  FaBuilding
} from 'react-icons/fa';

const ContactUs = () => {
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

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      toast.success('Message sent successfully! We\'ll get back to you soon.');
    }, 1500);
  };

  return (
    <div className="ds-contact-us">
      {/* Hero Section */}
      <section className="ds-contact-hero">
        <div className="ds-container">
          <h1>Contact <span className="ds-highlight">Us</span></h1>
          <p className="ds-subtitle">
            Have questions? We're here to help! Reach out to us anytime.
          </p>
        </div>
      </section>

      {/* Info Cards */}
      <section className="ds-contact-info">
        <div className="ds-container">
          <div className="ds-contact-info-grid">
            {contactInfo.map((item, index) => (
              <div key={index} className="ds-contact-info-card">
                <div className="ds-contact-info-icon">{item.icon}</div>
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
      <section className="ds-contact-form-section">
        <div className="ds-container">
          <div className="ds-contact-form-grid">
            {/* Contact Form */}
            <div className="ds-contact-form-container">
              <h2>Send Us a Message</h2>
              <p>We'll get back to you within 24 hours</p>

              {submitted ? (
                <div className="ds-contact-success">
                  <FaCheckCircle />
                  <h3>Thank You!</h3>
                  <p>Your message has been sent successfully. We'll contact you soon.</p>
                  <button 
                    className="ds-btn ds-btn-primary"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="ds-form-group">
                    <label htmlFor="name">
                      <FaUser /> Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`ds-form-control ${errors.name ? 'ds-is-invalid' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <div className="ds-invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="ds-form-group">
                    <label htmlFor="email">
                      <FaEnvelope /> Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`ds-form-control ${errors.email ? 'ds-is-invalid' : ''}`}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                    {errors.email && <div className="ds-invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="ds-form-group">
                    <label htmlFor="subject">
                      <FaComment /> Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className={`ds-form-control ${errors.subject ? 'ds-is-invalid' : ''}`}
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                    />
                    {errors.subject && <div className="ds-invalid-feedback">{errors.subject}</div>}
                  </div>

                  <div className="ds-form-group">
                    <label htmlFor="message">
                      <FaComment /> Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      className={`ds-form-control ${errors.message ? 'ds-is-invalid' : ''}`}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Type your message here..."
                    />
                    {errors.message && <div className="ds-invalid-feedback">{errors.message}</div>}
                  </div>

                  <button 
                    type="submit" 
                    className="ds-btn ds-btn-primary ds-btn-block"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="ds-spinner-small"></span> 
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
            <div className="ds-contact-info-container">
              <div className="ds-contact-map">
                <div className="ds-map-placeholder">
                  <FaBuilding className="ds-map-icon" />
                  <p>Our Office Location</p>
                  <small>123 Business Avenue, Colombo 03, Sri Lanka</small>
                </div>
              </div>

              <div className="ds-contact-social">
                <h3>Connect With Us</h3>
                <div className="ds-contact-social-icons">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="ds-contact-social-icon facebook">
                    <FaFacebook />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="ds-contact-social-icon twitter">
                    <FaTwitter />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="ds-contact-social-icon linkedin">
                    <FaLinkedin />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="ds-contact-social-icon instagram">
                    <FaInstagram />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="ds-contact-social-icon youtube">
                    <FaYoutube />
                  </a>
                </div>
              </div>

              <div className="ds-contact-support">
                <FaHeadset />
                <h4>24/7 Customer Support</h4>
                <p>Our support team is always ready to help you with any questions or concerns.</p>
                <Link to="/faq" className="ds-btn ds-btn-outline-light">
                  <FaQuestionCircle /> Visit FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="ds-contact-faq">
        <div className="ds-container">
          <h2 className="ds-section-title">Frequently Asked Questions</h2>
          <p className="ds-section-subtitle">Quick answers to common questions</p>
          <div className="ds-contact-faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="ds-contact-faq-card">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="ds-contact-faq-more">
            <p>Didn't find what you're looking for?</p>
            <Link to="/faq" className="ds-btn ds-btn-outline-primary">
              View All FAQs <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="ds-contact-newsletter">
        <div className="ds-container">
          <div className="ds-contact-newsletter-content">
            <h2>Stay Updated</h2>
            <p>Subscribe to our newsletter for the latest job opportunities and career tips</p>
            <form className="ds-contact-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                className="ds-form-control"
              />
              <button type="submit" className="ds-btn ds-btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;