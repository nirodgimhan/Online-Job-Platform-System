const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

        console.log('🔐 Auth middleware - Token:', token ? 'Present' : 'None');

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }

        // Verify JWT first (doesn't need database)
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (jwtError) {
            console.error('❌ JWT verification error:', jwtError.message);
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired' });
            }
            return res.status(401).json({ success: false, message: 'Authentication failed' });
        }

        // Check database connection before query
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ Database not connected (readyState:', mongoose.connection.readyState, ')');
            return res.status(503).json({ 
                success: false, 
                message: 'Connection lost. Please try again.',
                retry: true 
            });
        }

        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account deactivated' 
            });
        }

        req.user = {
            id: user._id,
            userId: user._id,
            role: user.role,
            name: user.name,
            email: user.email
        };

        console.log('✅ Auth success for:', user.email, 'Role:', user.role);
        next();
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        
        // Handle database timeout/network errors
        if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError') {
            return res.status(503).json({
                success: false,
                message: 'Connection lost. Please try again.',
                retry: true
            });
        }
        
        res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

// Add authorize method to auth function
auth.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Required role: ${roles.join(' or ')}` 
            });
        }
        next();
    };
};

module.exports = auth;