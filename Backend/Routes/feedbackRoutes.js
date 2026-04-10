const express = require('express');
const router = express.Router();
const Feedback = require('../Models/Feedback');

// 1. CREATE Feedback (User)
router.post('/', async (req, res) => {
    try {
        const newFeedback = new Feedback(req.body);
        const savedFeedback = await newFeedback.save();
        res.status(201).json(savedFeedback);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 2. GET ALL Feedback (Admin View)
router.get('/', async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. GET BEST 3 (Home Page View)
router.get('/featured', async (req, res) => {
    try {
        const featured = await Feedback.find({ isFeatured: true }).limit(3);
        res.json(featured);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. TOGGLE FEATURED (Admin Action)
router.patch('/feature/:id', async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        
        // Logic: If trying to feature, check if 3 already exist
        if (!feedback.isFeatured) {
            const count = await Feedback.countDocuments({ isFeatured: true });
            if (count >= 3) {
                return res.status(400).json({ message: "Only 3 feedbacks can be featured at once." });
            }
        }

        feedback.isFeatured = !feedback.isFeatured;
        await feedback.save();
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. DELETE Feedback
router.delete('/:id', async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: "Feedback deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;