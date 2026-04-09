const OTP = require('../models/OTP');
const User = require('../Models/User');

// Helper to generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Try to load Twilio (optional – will only be used if credentials are present)
let twilio;
try {
  twilio = require('twilio');
} catch (err) {
  console.log('⚠️ Twilio not installed – OTPs will be logged to console only');
}

// @desc    Send OTP to phone number
// @route   POST /api/otp/send
// @access  Private
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid phone number required' });
    }

    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({ phone, otp, expiresAt });

    // Send SMS if Twilio is configured
    let smsSent = false;
    if (twilio && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Your JobPortal verification code is: ${otp}`,
          to: phone,
          from: process.env.TWILIO_PHONE_NUMBER,
        });
        smsSent = true;
        console.log(`✅ SMS sent to ${phone}`);
      } catch (twilioErr) {
        console.error('❌ Twilio error:', twilioErr.message);
      }
    }

    // Log OTP to console for development (only if not production or SMS failed)
    if (process.env.NODE_ENV !== 'production' || !smsSent) {
      console.log(`📱 OTP for ${phone}: ${otp}`);
    }

    res.json({
      success: true,
      message: smsSent ? 'OTP sent via SMS' : 'OTP sent (development mode – check server console)',
      // Only send devOtp in non‑production environments
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// @desc    Verify OTP and update user's phone number
// @route   POST /api/otp/verify
// @access  Private
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

    const otpRecord = await OTP.findOne({ phone, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Update user's phone number
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phoneNumber: phone },
      { new: true }
    ).select('-password');

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Phone number verified and updated',
      user,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

module.exports = { sendOTP, verifyOTP };