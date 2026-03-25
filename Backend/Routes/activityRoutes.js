const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/activities/recent
// @desc    Get recent activities for the user
// @access  Private
router.get('/recent', auth, async (req, res) => {
    try {
        // Mock activities data
        const activities = [
            { _id: '1', action: 'Applied for Software Engineer', time: '2 hours ago' },
            { _id: '2', action: 'Saved Product Manager position', time: '5 hours ago' },
            { _id: '3', action: 'Updated profile', time: '1 day ago' }
        ];
        
        res.json({ success: true, activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;