const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../Models/Student');
const Company = require('../models/Company');

// @route   GET api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', auth, auth.authorize('admin'), async (req, res) => {
    try {
        console.log('📊 Fetching all users...');
        
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        console.log(`✅ Found ${users.length} users`);
        
        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('📊 Fetching user by ID:', req.params.id);
        
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Check if user is requesting their own profile or is admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view this profile' 
            });
        }
        
        // Get role-specific data
        let profileData = null;
        if (user.role === 'student') {
            profileData = await Student.findOne({ userId: user._id });
        } else if (user.role === 'company') {
            profileData = await Company.findOne({ userId: user._id });
        }
        
        res.json({ 
            success: true, 
            user: {
                ...user.toObject(),
                profile: profileData
            }
        });
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        console.log('📝 Updating user:', req.params.id);
        console.log('Update data:', req.body);
        
        // Check if user is updating their own profile or is admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this profile' 
            });
        }

        const { name, phoneNumber, address } = req.body;
        
        // Build update object
        const updateFields = {};
        if (name) updateFields.name = name;
        if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
        if (address) updateFields.address = address;
        updateFields.updatedAt = Date.now();

        // Update user
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log('✅ User updated successfully:', user._id);

        res.json({ 
            success: true, 
            user,
            message: 'Profile updated successfully' 
        });

    } catch (error) {
        console.error('❌ Error updating user:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(', ') 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   DELETE api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, auth.authorize('admin'), async (req, res) => {
    try {
        console.log('🗑️ Deleting user:', req.params.id);
        
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Don't allow deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot delete admin users' 
            });
        }

        // Delete role-specific profile
        if (user.role === 'student') {
            await Student.findOneAndDelete({ userId: user._id });
        } else if (user.role === 'company') {
            await Company.findOneAndDelete({ userId: user._id });
        }

        // Delete user
        await user.deleteOne();

        console.log('✅ User deleted successfully');

        res.json({ 
            success: true, 
            message: 'User removed successfully' 
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   PUT api/users/:id/verify
// @desc    Verify user (Admin only)
// @access  Private/Admin
router.put('/:id/verify', auth, auth.authorize('admin'), async (req, res) => {
    try {
        console.log('✅ Verifying user:', req.params.id);
        
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Don't allow verifying admin users (they're already verified)
        if (user.role === 'admin') {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin users are already verified' 
            });
        }

        // Update user verification status
        user.isVerified = true;
        user.updatedAt = Date.now();
        await user.save();

        // If user is company, also update company verification
        if (user.role === 'company') {
            await Company.findOneAndUpdate(
                { userId: user._id },
                { $set: { verified: true } }
            );
        }

        console.log('✅ User verified successfully');

        res.json({ 
            success: true, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            },
            message: 'User verified successfully' 
        });
    } catch (error) {
        console.error('❌ Error verifying user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   PUT api/users/:id/toggle-status
// @desc    Toggle user active status (Admin only)
// @access  Private/Admin
router.put('/:id/toggle-status', auth, auth.authorize('admin'), async (req, res) => {
    try {
        console.log('🔄 Toggling user status:', req.params.id);
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Don't allow toggling admin users
        if (user.role === 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot modify admin users' 
            });
        }

        // Toggle isActive (default to true if not set)
        user.isActive = user.isActive === undefined ? false : !user.isActive;
        user.updatedAt = Date.now();
        await user.save();

        console.log(`✅ User ${user.isActive ? 'activated' : 'deactivated'} successfully`);

        res.json({ 
            success: true, 
            user: {
                id: user._id,
                isActive: user.isActive
            },
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` 
        });
    } catch (error) {
        console.error('❌ Error toggling user status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   GET api/users/stats/dashboard
// @desc    Get user statistics for dashboard (Admin only)
// @access  Private/Admin
router.get('/stats/dashboard', auth, auth.authorize('admin'), async (req, res) => {
    try {
        console.log('📊 Fetching user statistics...');
        
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalCompanies = await User.countDocuments({ role: 'company' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const unverifiedUsers = await User.countDocuments({ 
            isVerified: false, 
            role: { $ne: 'admin' } 
        });
        
        // Get recent users
        const recentUsers = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalStudents,
                totalCompanies,
                totalAdmins,
                verifiedUsers,
                unverifiedUsers
            },
            recentUsers
        });

    } catch (error) {
        console.error('❌ Error fetching user statistics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   GET api/users/search/:query
// @desc    Search users (Admin only)
// @access  Private/Admin
router.get('/search/:query', auth, auth.authorize('admin'), async (req, res) => {
    try {
        const { query } = req.params;
        
        console.log('🔍 Searching users for:', query);
        
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
        .select('-password')
        .limit(20);

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('❌ Error searching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

module.exports = router;