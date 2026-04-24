const express = require('express');
const router = express.Router();
const ChatSession = require('../models/Chat');
const auth = require('../middleware/auth');

// Helper: generate a unique session ID
const generateSessionId = () => {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Bot reply logic (keyword matching)
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

// @route   POST /api/chat/start
// @desc    Start a new chat session
// @access  Public
router.post('/start', async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    const sessionId = generateSessionId();

    const session = new ChatSession({
      sessionId,
      userId: userId || null,
      userName: name || 'Guest',
      userEmail: email || '',
      messages: []
    });

    await session.save();

    // Add welcome message (system/bot)
    const welcomeMessage = {
      sender: 'bot',
      text: '👋 Hi! I am JobPortal Bot. How can I help you today?\n\nYou can ask me about:\n• Applying for jobs\n• Posting jobs\n• Account verification\n• Password reset\n• Contacting support',
      timestamp: new Date()
    };
    session.messages.push(welcomeMessage);
    await session.save();

    res.status(201).json({
      success: true,
      sessionId: session.sessionId,
      messages: session.messages
    });
  } catch (err) {
    console.error('Error starting chat:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/chat/message
// @desc    Send a message (user -> bot reply)
// @access  Public
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message, sender = 'user' } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ success: false, message: 'Missing sessionId or message' });
    }

    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    // Save user message
    session.messages.push({
      sender,
      text: message,
      timestamp: new Date()
    });

    // Generate and save bot reply
    const botReplyText = getBotReply(message);
    const botMessage = {
      sender: 'bot',
      text: botReplyText,
      timestamp: new Date()
    };
    session.messages.push(botMessage);

    await session.save();

    res.json({
      success: true,
      userMessage: session.messages[session.messages.length - 2],
      supportMessage: botMessage
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/chat/:sessionId/messages
// @desc    Get all messages of a chat session
// @access  Public
router.get('/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }
    res.json({ success: true, messages: session.messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =============== ADMIN ENDPOINTS (require authentication) ===============

// @route   GET /api/chat/sessions
// @desc    Get all active chat sessions (admin only)
// @access  Admin
router.get('/sessions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const sessions = await ChatSession.find({ status: 'active' })
      .sort({ lastActivity: -1 })
      .select('-messages'); // exclude messages for list view
    res.json({ success: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/chat/session/:sessionId
// @desc    Get full chat session including messages (admin)
// @access  Admin
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/chat/resolve/:sessionId
// @desc    Mark a chat session as resolved (admin)
// @access  Admin
router.post('/resolve/:sessionId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    session.status = 'resolved';
    await session.save();
    res.json({ success: true, message: 'Chat resolved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;