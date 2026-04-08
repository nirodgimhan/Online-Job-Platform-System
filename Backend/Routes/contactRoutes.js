const express = require('express');
const router = express.Router();
const {
  submitContact,
  getAllMessages,
  getMessageById,
  markAsRead,
  markAsReplied,
  deleteMessage,
} = require('../controllers/contactController');
const auth = require('../middleware/auth');

// Manual validation (no express-validator)
const validateContact = (req, res, next) => {
  const { name, email, subject, message } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters' });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!subject || subject.trim().length < 3 || subject.trim().length > 200) {
    errors.push({ field: 'subject', message: 'Subject must be between 3 and 200 characters' });
  }
  if (!message || message.trim().length < 10 || message.trim().length > 5000) {
    errors.push({ field: 'message', message: 'Message must be between 10 and 5000 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

// Public route
router.post('/', validateContact, submitContact);

// Admin routes
router.get('/admin', auth, auth.authorize('admin'), getAllMessages);
router.get('/admin/:id', auth, auth.authorize('admin'), getMessageById);
router.put('/admin/:id/read', auth, auth.authorize('admin'), markAsRead);
router.put('/admin/:id/replied', auth, auth.authorize('admin'), markAsReplied);
router.delete('/admin/:id', auth, auth.authorize('admin'), deleteMessage);

module.exports = router;