const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');      // adjust path if needed
const auth = require('../middleware/auth');
const User = require('../models/User');

// Helper to check admin role
const isAdmin = (req) => req.user && req.user.role === 'admin';

// @route   POST /api/feedback
// @desc    Submit new feedback (authenticated users only)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { comment, rating } = req.body;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment is required'
            });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Get user details (name might be from User model)
        const user = await User.findById(req.user.id).select('name');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const newFeedback = new Feedback({
            user: req.user.id,
            name: user.name,
            comment: comment.trim(),
            rating: parseInt(rating)
        });

        await newFeedback.save();

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: newFeedback
        });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        res.status(500).json({
            success: false,
            message: 'Server error, please try again later'
        });
    }
});

// @route   GET /api/feedback
// @desc    Get all feedback (public – for testimonials)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .sort({ createdAt: -1 })
            .limit(20);   // optional limit
        res.json({
            success: true,
            feedbacks
        });
    } catch (err) {
        console.error('Error fetching feedback:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback'
        });
    }
});

// @route   GET /api/feedback/featured
// @desc    Get featured feedback (max 3) – for homepage
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const featured = await Feedback.find({ isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(3);
        res.json({
            success: true,
            feedbacks: featured
        });
    } catch (err) {
        console.error('Error fetching featured feedback:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured feedback'
        });
    }
});

// ==================== ADMIN ONLY ROUTES ====================

// @route   PATCH /api/feedback/:id/toggle-feature
// @desc    Toggle featured status (admin only, max 3 featured)
// @access  Private/Admin
router.patch('/:id/toggle-feature', auth, async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        // If trying to feature (from false to true), enforce max 3 featured
        if (!feedback.isFeatured) {
            const featuredCount = await Feedback.countDocuments({ isFeatured: true });
            if (featuredCount >= 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Only 3 feedbacks can be featured at a time. Unfeature one first.'
                });
            }
        }

        feedback.isFeatured = !feedback.isFeatured;
        await feedback.save();

        res.json({
            success: true,
            message: feedback.isFeatured ? 'Feedback featured' : 'Feedback unfeatured',
            feedback
        });
    } catch (err) {
        console.error('Error toggling featured:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete a feedback (admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting feedback:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;