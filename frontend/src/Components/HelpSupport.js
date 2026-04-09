import React, { useState } from 'react';
import { useAuth, API } from '../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaQuestionCircle, FaEnvelope, FaPhone, FaComments, 
  FaChevronDown, FaChevronUp, FaPaperPlane, FaBookOpen,
  FaHeadset, FaClock, FaCheckCircle
} from 'react-icons/fa';

const HelpSupport = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button in the top right corner. Choose your role (Student, Company, or Admin), fill in your details, and submit. You will receive a confirmation email.'
    },
    {
      question: 'How do I apply for a job?',
      answer: 'Browse jobs from the "Browse Jobs" page, click on a job to view details, then click the "Apply" button. You will need to upload a CV and optionally write a cover letter.'
    },
    {
      question: 'How do I post a job (for companies)?',
      answer: 'After logging in as a company, go to your dashboard and click "Post New Job". Fill in all the required details and submit. Your job will be reviewed and published.'
    },
    {
      question: 'How long does verification take?',
      answer: 'Company verification usually takes 24–48 hours. You will receive an email notification once your account is verified.'
    },
    {
      question: 'How can I reset my password?',
      answer: 'On the login page, click "Forgot Password". Enter your registered email, and you will receive a password reset link.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can use the contact form below, email us directly at support@jobportal.com, or call our hotline +94 11 234 5678.'
    }
  ];

  const handleFaqToggle = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      // Use the existing contact endpoint (same as ContactUs page)
      await API.post('/contact', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });
      setSubmitted(true);
      setFormData({ ...formData, subject: '', message: '' });
      toast.success('Message sent! Our support team will respond within 24 hours.');
    } catch (err) {
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hs-help-support">
      {/* Hero Section */}
      <div className="hs-hero">
        <div className="hs-container">
          <h1>Help & Support</h1>
          <p>We're here to help you every step of the way</p>
        </div>
      </div>

      <div className="hs-container">
        {/* Quick Contact Cards */}
        <div className="hs-quick-cards">
          <div className="hs-quick-card">
            <FaHeadset />
            <h3>24/7 Support</h3>
            <p>Our team is available around the clock</p>
          </div>
          <div className="hs-quick-card">
            <FaEnvelope />
            <h3>Email Us</h3>
            <p>support@jobportal.com</p>
          </div>
          <div className="hs-quick-card">
            <FaPhone />
            <h3>Call Us</h3>
            <p>+94 11 234 5678</p>
          </div>
          <div className="hs-quick-card">
            <FaClock />
            <h3>Response Time</h3>
            <p>Within 24 hours</p>
          </div>
        </div>

        <div className="hs-grid">
          {/* Left Column: FAQs */}
          <div className="hs-faq-section">
            <h2>Frequently Asked Questions</h2>
            <p>Find quick answers to common questions</p>
            <div className="hs-faq-list">
              {faqs.map((faq, idx) => (
                <div key={idx} className="hs-faq-item">
                  <div 
                    className="hs-faq-question"
                    onClick={() => handleFaqToggle(idx)}
                  >
                    <span>{faq.question}</span>
                    {openFaq === idx ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  {openFaq === idx && (
                    <div className="hs-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="hs-knowledge-base">
              <FaBookOpen />
              <div>
                <h4>Knowledge Base</h4>
                <p>Browse detailed guides and tutorials</p>
                <a href="/knowledge-base" className="hs-btn-outline">Visit Knowledge Base →</a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="hs-contact-form">
            <h2>Contact Support</h2>
            <p>Can't find what you're looking for? Send us a message.</p>
            {submitted ? (
              <div className="hs-success-message">
                <FaCheckCircle />
                <h3>Thank You!</h3>
                <p>Your message has been sent. We'll get back to you soon.</p>
                <button className="hs-btn-primary" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="hs-form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="hs-form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="hs-form-group">
                  <label>Subject *</label>
                  <input 
                    type="text" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g., Account issue, Technical problem"
                  />
                </div>
                <div className="hs-form-group">
                  <label>Message *</label>
                  <textarea 
                    name="message" 
                    rows="5" 
                    value={formData.message} 
                    onChange={handleChange} 
                    required 
                    placeholder="Describe your issue in detail..."
                  />
                </div>
                <button 
                  type="submit" 
                  className="hs-btn-primary" 
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : <><FaPaperPlane /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Live Chat CTA */}
        <div className="hs-live-chat">
          <div className="hs-live-chat-content">
            <FaComments />
            <div>
              <h3>Need instant help?</h3>
              <p>Chat with our support team in real-time</p>
            </div>
            <button className="hs-btn-primary">Start Live Chat</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;