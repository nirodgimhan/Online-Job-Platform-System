const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/recent', auth, async (req, res) => {
    try {
        const messages = [
            { _id: '1', from: 'Tech Corp', message: 'Interview scheduled', time: '1 hour ago', unread: true }
        ];
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;