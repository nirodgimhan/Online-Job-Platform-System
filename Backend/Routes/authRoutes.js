const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // added for password hashing in change-password

console.log('✅ authRoutes.js loaded');

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role,
            name: user.name 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Register endpoint hit:', req.body);

        const { name, email, password, role, phoneNumber } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Create user
        const user = new User({
            name,
            email,
            password,
            role,
            phoneNumber: phoneNumber || null,
            isVerified: true,
            isActive: true
        });

        await user.save();
        console.log('✅ User saved:', user._id);

        // Create profile based on role
        if (role === 'student') {
            const student = new Student({ userId: user._id });
            await student.save();
            console.log('✅ Student profile created');
        } else if (role === 'company') {
            const company = new Company({ 
                userId: user._id, 
                companyName: name,
                contactEmail: email 
            });
            await company.save();
            console.log('✅ Company profile created');
        }

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        console.log('🔑 Login endpoint hit:', req.body.email);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Update last active
        user.lastActive = Date.now();
        await user.save();

        // Get profile data (skip for admin)
        let profileData = null;
        if (user.role !== 'admin') {
            if (user.role === 'student') {
                profileData = await Student.findOne({ userId: user._id });
            } else if (user.role === 'company') {
                profileData = await Company.findOne({ userId: user._id });
            }
        }

        // Generate token
        const token = generateToken(user);

        console.log('✅ Login successful for:', user.email, 'Role:', user.role);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                profile: profileData
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        console.log('👤 Get me endpoint hit for user:', req.user.id);

        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Get profile data
        let profileData = null;
        if (user.role !== 'admin') {
            if (user.role === 'student') {
                profileData = await Student.findOne({ userId: user._id });
            } else if (user.role === 'company') {
                profileData = await Company.findOne({ userId: user._id });
            }
        }

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                profile: profileData
            }
        });

    } catch (error) {
        console.error('❌ Get me error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
    try {
        if (req.user?.id) {
            await User.findByIdAndUpdate(req.user.id, { lastActive: Date.now() });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/auth/create-admin
// @desc    Create admin user (for testing)
// @access  Public (disable in production)
router.post('/create-admin', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin already exists' 
            });
        }

        const admin = new User({
            name: name || 'System Administrator',
            email: email || 'admin@jobportal.com',
            password: password || 'Admin@123',
            role: 'admin',
            isVerified: true,
            isActive: true
        });

        await admin.save();

        const token = generateToken(admin);

        res.status(201).json({
            success: true,
            message: 'Admin created',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ Create admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== NEW ROUTE: CHANGE PASSWORD ====================
// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters' 
            });
        }

        // Find user with password field included
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password and save
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        console.log('✅ Password changed for user:', user.email);

        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

module.exports = router;