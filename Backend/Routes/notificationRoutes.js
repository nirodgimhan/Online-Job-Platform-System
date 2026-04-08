const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../Controllers/notificationController');
const auth = require('../middleware/auth'); // Your existing auth middleware

// All routes require authentication
router.use(auth);

// Get notifications (with pagination and filtering)
router.get('/', getNotifications);

// Mark a single notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;