const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/recent', auth, async (req, res) => {
    try {
        const activities = [
            { _id: '1', action: 'Applied for Software Engineer', time: '2 hours ago' }
        ];
        res.json({ success: true, activities });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;