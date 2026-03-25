const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Mock notifications data
        const notifications = [
            { _id: '1', message: 'Your application was viewed', time: '2 hours ago', read: false },
            { _id: '2', message: 'Interview scheduled for tomorrow', time: '5 hours ago', read: false },
            { _id: '3', message: 'New message from Tech Corp', time: '1 day ago', read: true }
        ];
        
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;