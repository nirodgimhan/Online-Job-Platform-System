const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/messages/recent
// @desc    Get recent messages
// @access  Private
router.get('/recent', auth, async (req, res) => {
    try {
        // Mock messages data
        const messages = [
            { _id: '1', from: 'Tech Corp', message: 'We would like to schedule an interview', time: '1 hour ago', unread: true },
            { _id: '2', from: 'Innovation Labs', message: 'Thank you for your application', time: '3 hours ago', unread: false }
        ];
        
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;