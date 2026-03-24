const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        // Mock notifications data
        const notifications = [
            { _id: '1', message: 'Your application was viewed', time: '2 hours ago', read: false },
            { _id: '2', message: 'New job matching your skills', time: '5 hours ago', read: false }
        ];
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;