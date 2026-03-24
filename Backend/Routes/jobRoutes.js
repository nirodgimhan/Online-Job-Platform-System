const express = require('express');
const router = express.Router();
const jobController = require('../Controllers/jobController');
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filters
 * @access  Public
 * @query   { page, limit, search, employmentType, workMode, location, experienceLevel, minSalary, skills, category, companyId }
 */
router.get('/', jobController.getAllJobs);

/**
 * @route   GET /api/jobs/featured
 * @desc    Get featured jobs
 * @access  Public
 * @query   { limit }
 */
router.get('/featured', jobController.getFeaturedJobs);

/**
 * @route   GET /api/jobs/search
 * @desc    Advanced job search
 * @access  Public
 * @query   { q, employmentType, workMode, location, experienceLevel, minSalary, maxSalary, skills, category, page, limit, sortBy }
 */
router.get('/search', jobController.searchJobs);

// ==================== IMPORTANT: This route MUST come before /:id ====================
/**
 * @route   GET /api/jobs/recommended
 * @desc    Get recommended jobs for a student based on their CV skills
 * @access  Private/Student
 */
router.get('/recommended', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('📡 GET /api/jobs/recommended');
        
        const limit = parseInt(req.query.limit) || 5;
        
        // Get student profile to extract skills
        const student = await Student.findOne({ userId: req.user.id });
        
        if (!student || !student.skills || student.skills.length === 0) {
            // If no skills, return recent jobs
            const recentJobs = await Job.find({ status: 'active' })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('companyId', 'companyName companyLogo');
            
            return res.json({ success: true, jobs: recentJobs });
        }
        
        // Get student's skills
        const studentSkills = student.skills.map(s => s.name?.toLowerCase());
        
        // Find jobs that match student's skills
        const jobs = await Job.find({
            status: 'active',
            'skills.name': { $in: studentSkills }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('companyId', 'companyName companyLogo');
        
        // Calculate match percentage for each job
        const jobsWithMatch = jobs.map(job => {
            const jobSkills = job.skills?.map(s => s.name?.toLowerCase()) || [];
            const matchedSkills = jobSkills.filter(skill => studentSkills.includes(skill));
            const matchPercentage = jobSkills.length > 0 
                ? Math.round((matchedSkills.length / jobSkills.length) * 100)
                : 0;
            
            return {
                ...job.toObject(),
                matchPercentage
            };
        });
        
        // Sort by match percentage
        jobsWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
        
        res.json({ success: true, jobs: jobsWithMatch });
        
    } catch (error) {
        console.error('❌ Error fetching recommended jobs:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Public
 */
router.get('/:id', jobController.getJobById);

/**
 * @route   GET /api/jobs/:id/similar
 * @desc    Get similar jobs
 * @access  Public
 */
router.get('/:id/similar', jobController.getSimilarJobs);

// ==================== COMPANY ROUTES ====================

/**
 * @route   POST /api/jobs
 * @desc    Create a new job
 * @access  Private/Company
 * @body    { title, description, employmentType, workMode, location, salary, experience, education, requirements, responsibilities, skills, benefits, category, tags, applicationDeadline }
 */
router.post('/', auth, auth.authorize('company'), jobController.createJob);

/**
 * @route   GET /api/jobs/company/all
 * @desc    Get company's jobs
 * @access  Private/Company
 * @query   { page, limit, status }
 */
router.get('/company/all', auth, auth.authorize('company'), jobController.getCompanyJobs);

/**
 * @route   GET /api/jobs/stats/company
 * @desc    Get job statistics for company
 * @access  Private/Company
 */
router.get('/stats/company', auth, auth.authorize('company'), jobController.getJobStats);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job
 * @access  Private/Company
 * @body    { title, description, employmentType, workMode, location, salary, experience, education, requirements, responsibilities, skills, benefits, category, tags, applicationDeadline, status }
 */
router.put('/:id', auth, auth.authorize('company'), jobController.updateJob);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job
 * @access  Private/Company
 */
router.delete('/:id', auth, auth.authorize('company'), jobController.deleteJob);

/**
 * @route   PUT /api/jobs/:id/close
 * @desc    Close job
 * @access  Private/Company
 */
router.put('/:id/close', auth, auth.authorize('company'), jobController.closeJob);

/**
 * @route   PUT /api/jobs/:id/reopen
 * @desc    Reopen job
 * @access  Private/Company
 */
router.put('/:id/reopen', auth, auth.authorize('company'), jobController.reopenJob);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/jobs/admin/all
 * @desc    Get all jobs (admin only)
 * @access  Private/Admin
 * @query   { page, limit, status, companyId }
 */
router.get('/admin/all', auth, auth.authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, companyId } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status) query.status = status;
        if (companyId) query.companyId = companyId;

        const jobs = await Job.find(query)
            .populate('companyId', 'companyName userId')
            .sort({ postedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Job.countDocuments(query);

        res.json({
            success: true,
            count: jobs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            jobs
        });
    } catch (error) {
        console.error('Error fetching all jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching jobs: ' + error.message
        });
    }
});

/**
 * @route   PUT /api/jobs/:id/feature
 * @desc    Feature/unfeature job (admin only)
 * @access  Private/Admin
 * @body    { isFeatured }
 */
router.put('/:id/feature', auth, auth.authorize('admin'), async (req, res) => {
    try {
        const { isFeatured } = req.body;
        
        const job = await Job.findByIdAndUpdate(
            req.params.id,
            { $set: { isFeatured } },
            { new: true }
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.json({
            success: true,
            message: `Job ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
            job
        });
    } catch (error) {
        console.error('Error featuring job:', error);
        res.status(500).json({
            success: false,
            message: 'Error featuring job: ' + error.message
        });
    }
});

/**
 * @route   DELETE /api/jobs/admin/:id
 * @desc    Force delete job (admin only)
 * @access  Private/Admin
 */
router.delete('/admin/:id', auth, auth.authorize('admin'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Delete all applications for this job
        await Application.deleteMany({ jobId: job._id });

        // Remove from company's jobs
        await Company.findByIdAndUpdate(job.companyId, {
            $pull: { postedJobs: job._id }
        });

        await job.deleteOne();

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting job: ' + error.message
        });
    }
});

module.exports = router;