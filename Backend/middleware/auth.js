const jwt = require('jsonwebtoken');
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (!user.isActive) {
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
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        
        res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

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

// In middleware/auth.js
module.exports = {
    auth: (req, res, next) => {
        // existing auth logic
    },
    authorize: (...roles) => {
        return (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
            next();
        };
    }
};
module.exports = auth;