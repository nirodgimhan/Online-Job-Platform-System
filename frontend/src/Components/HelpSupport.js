import React, { useState, useRef, useEffect } from 'react';
import { useAuth, API } from '../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaQuestionCircle, FaEnvelope, FaPhone, FaComments, 
  FaChevronDown, FaChevronUp, FaPaperPlane, FaBookOpen,
  FaHeadset, FaClock, FaCheckCircle, FaTimes, FaUserCircle,
  FaRobot, FaSpinner, FaCommentDots
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

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatEndRef = useRef(null);
  const [chatLoading, setChatLoading] = useState(false);

  // FAQ data
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

  // Auto-reply logic (keyword matching)
  const getBotReply = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('job') && (msg.includes('apply') || msg.includes('application'))) {
      return '📌 To apply for a job:\n1. Browse jobs from the "Browse Jobs" page.\n2. Click on a job to view details.\n3. Press the "Apply" button.\n4. Upload your CV and optionally write a cover letter.\n\nNeed more help? Let me know!';
    } else if (msg.includes('post job') || msg.includes('post a job')) {
      return '🏢 Companies can post jobs from their dashboard:\n1. Go to Company Dashboard.\n2. Click "Post New Job".\n3. Fill in all details and submit.\n4. Your job will be reviewed and published.';
    } else if (msg.includes('verify') || msg.includes('verification')) {
      return '✅ Company verification usually takes 24–48 hours. You will receive an email once your account is verified.';
    } else if (msg.includes('reset password') || msg.includes('forgot password')) {
      return '🔐 On the login page, click "Forgot Password", enter your email, and you will receive a password reset link.';
    } else if (msg.includes('contact') || msg.includes('support') || msg.includes('help')) {
      return '📞 You can reach us at:\n- Email: support@jobportal.com\n- Phone: +94 11 234 5678\n- Or use the contact form on this page.\n\nOur team is available 24/7.';
    } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return '👋 Hello! Welcome to JobPortal Support. How can I assist you today?';
    } else {
      return '🤖 I am still learning. Please try one of these keywords:\n- apply for job\n- post job\n- verification\n- reset password\n- contact support\n\nOr use the contact form for more detailed help.';
    }
  };

  // Start chat session
  const startChat = async () => {
    setShowChat(true);
    setChatLoading(true);
    try {
      // Try to create a session on backend (optional)
      const response = await API.post('/chat/start', {
        name: user?.name || 'Guest',
        email: user?.email || ''
      }).catch(() => ({ data: { sessionId: 'local_' + Date.now() } }));
      const newSessionId = response.data.sessionId || 'local_' + Date.now();
      setSessionId(newSessionId);

      // Welcome message
      setChatMessages([
        {
          id: Date.now(),
          sender: 'bot',
          text: '👋 Hi! I am JobPortal Bot. How can I help you today?\n\nYou can ask me about:\n• Applying for jobs\n• Posting jobs\n• Account verification\n• Password reset\n• Contacting support',
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      // Fallback – chat works without backend
      setChatMessages([
        {
          id: Date.now(),
          sender: 'bot',
          text: '👋 Hi! I am JobPortal Bot. How can I help you today?\n\nYou can ask me about:\n• Applying for jobs\n• Posting jobs\n• Account verification\n• Password reset\n• Contacting support',
          timestamp: new Date()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Send user message and get bot reply
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Get bot reply (local logic)
    setTimeout(() => {
      const replyText = getBotReply(chatInput);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: replyText,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);

    // Optional: send to backend for storage
    if (sessionId && !sessionId.startsWith('local_')) {
      try {
        await API.post('/chat/message', {
          sessionId,
          message: chatInput,
          sender: 'user'
        });
      } catch (err) {
        console.warn('Backend chat save failed', err);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const closeChat = () => {
    setShowChat(false);
    setChatMessages([]);
    setSessionId(null);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // FAQ toggle
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
      </div>

      {/* Live Chat Bot Button */}
      <button className="hs-chat-bot-button" onClick={startChat}>
        <FaCommentDots />
        <span>Chat with us</span>
      </button>

      {/* Chat Bot Modal */}
      {showChat && (
        <div className="hs-chat-modal-overlay" onClick={closeChat}>
          <div className="hs-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hs-chat-header">
              <div className="hs-chat-header-info">
                <FaRobot className="hs-chat-icon" />
                <div>
                  <h3>JobPortal Bot</h3>
                  <p>Online • Instant replies</p>
                </div>
              </div>
              <button className="hs-chat-close" onClick={closeChat}>
                <FaTimes />
              </button>
            </div>
            <div className="hs-chat-messages">
              {chatLoading ? (
                <div className="hs-chat-loading">
                  <FaSpinner className="hs-spin" />
                  <p>Starting chat...</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`hs-chat-message ${msg.sender === 'user' ? 'hs-message-user' : 'hs-message-bot'}`}>
                      <div className="hs-message-avatar">
                        {msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}
                      </div>
                      <div className="hs-message-bubble">
                        <div className="hs-message-text">{msg.text}</div>
                        <div className="hs-message-time">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="hs-chat-typing">
                      <FaRobot />
                      <span>Bot is typing...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            <div className="hs-chat-input-area">
              <input
                type="text"
                placeholder="Type your question here..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={chatLoading}
              />
              <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}>
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;