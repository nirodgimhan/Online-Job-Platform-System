const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../Controllers/otpController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.post('/send', sendOTP);
router.post('/verify', verifyOTP);

module.exports = router;