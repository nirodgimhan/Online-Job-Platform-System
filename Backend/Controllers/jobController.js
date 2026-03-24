const Job = require('../Models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private/Company
exports.createJob = async (req, res) => {
    try {
        console.log('📝 Creating new job for user:', req.user.id);

        // Check if company profile exists
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            console.log('❌ Company profile not found for user:', req.user.id);
            return res.status(404).json({
                success: false,
                message: 'Company profile not found. Please create your company profile first.'
            });
        }

        // Prepare job data
        const jobData = {
            ...req.body,
            companyId: company._id
        };

        // Create job
        const job = new Job(jobData);
        await job.save();

        // Add job reference to company
        await company.addJob(job._id);

        console.log('✅ Job created successfully:', job._id);

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            job
        });

    } catch (error) {
        console.error('❌ Error creating job:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating job: ' + error.message
        });
    }
};

// @desc    Get all jobs (with filters)
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search,
            employmentType,
            workMode,
            location,
            experienceLevel,
            minSalary,
            skills,
            category,
            companyId
        } = req.query;

        const filters = {
            employmentType,
            workMode,
            location,
            experienceLevel,
            minSalary: minSalary ? parseInt(minSalary) : null,
            skills: skills ? skills.split(',') : null,
            category,
            companyId
        };

        const jobs = await Job.search(search, filters, parseInt(page), parseInt(limit));
        
        const total = await Job.countDocuments({ status: 'active' });

        res.json({
            success: true,
            count: jobs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            jobs
        });

    } catch (error) {
        console.error('❌ Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching jobs: ' + error.message
        });
    }
};

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
exports.getFeaturedJobs = async (req, res) => {
    try {
        const { limit = 6 } = req.query;

        const jobs = await Job.find({ 
            status: 'active',
            isFeatured: true,
            expiresAt: { $gt: new Date() }
        })
        .populate('companyId', 'companyName companyLogo industry')
        .sort({ postedAt: -1 })
        .limit(parseInt(limit));

        res.json({
            success: true,
            count: jobs.length,
            jobs
        });

    } catch (error) {
        console.error('❌ Error fetching featured jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching featured jobs: ' + error.message
        });
    }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('companyId', 'companyName companyLogo industry description location website');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Increment view count
        await job.incrementViews();

        res.json({
            success: true,
            job: job.getPublicData()
        });

    } catch (error) {
        console.error('❌ Error fetching job:', error);
        
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching job: ' + error.message
        });
    }
};

// @desc    Get company jobs
// @route   GET /api/jobs/company
// @access  Private/Company
exports.getCompanyJobs = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { companyId: company._id };
        if (status) {
            query.status = status;
        }

        const jobs = await Job.find(query)
            .sort({ postedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Job.countDocuments(query);

        // Get statistics
        const stats = await Job.getStats(company._id);

        res.json({
            success: true,
            count: jobs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            stats,
            jobs
        });

    } catch (error) {
        console.error('❌ Error fetching company jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company jobs: ' + error.message
        });
    }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Company
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if company owns this job
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company || job.companyId.toString() !== company._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this job'
            });
        }

        // Update job
        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        console.log('✅ Job updated successfully:', job._id);

        res.json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob
        });

    } catch (error) {
        console.error('❌ Error updating job:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating job: ' + error.message
        });
    }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Company
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if company owns this job
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company || job.companyId.toString() !== company._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this job'
            });
        }

        // Check if there are applications
        const applicationsCount = await Application.countDocuments({ jobId: job._id });
        
        if (applicationsCount > 0) {
            // Instead of deleting, just mark as closed
            job.status = 'closed';
            await job.save();
            
            // Remove from company's active jobs
            await company.removeJob(job._id, true);

            return res.json({
                success: true,
                message: 'Job closed successfully. Applications are preserved.'
            });
        }

        // No applications, safe to delete
        await job.deleteOne();
        
        // Remove from company's jobs
        await company.removeJob(job._id, false);

        console.log('✅ Job deleted successfully:', job._id);

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting job:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting job: ' + error.message
        });
    }
};

// @desc    Close job
// @route   PUT /api/jobs/:id/close
// @access  Private/Company
exports.closeJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if company owns this job
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company || job.companyId.toString() !== company._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to close this job'
            });
        }

        await job.close();

        console.log('✅ Job closed successfully:', job._id);

        res.json({
            success: true,
            message: 'Job closed successfully',
            job
        });

    } catch (error) {
        console.error('❌ Error closing job:', error);
        res.status(500).json({
            success: false,
            message: 'Error closing job: ' + error.message
        });
    }
};

// @desc    Reopen job
// @route   PUT /api/jobs/:id/reopen
// @access  Private/Company
exports.reopenJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if company owns this job
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company || job.companyId.toString() !== company._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to reopen this job'
            });
        }

        await job.reopen();

        console.log('✅ Job reopened successfully:', job._id);

        res.json({
            success: true,
            message: 'Job reopened successfully',
            job
        });

    } catch (error) {
        console.error('❌ Error reopening job:', error);
        res.status(500).json({
            success: false,
            message: 'Error reopening job: ' + error.message
        });
    }
};

// @desc    Get similar jobs
// @route   GET /api/jobs/:id/similar
// @access  Public
exports.getSimilarJobs = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Find similar jobs based on skills, category, employment type
        const similarJobs = await Job.find({
            _id: { $ne: job._id },
            status: 'active',
            $or: [
                { 'skills.name': { $in: job.skills.map(s => s.name) } },
                { category: job.category },
                { employmentType: job.employmentType }
            ]
        })
        .populate('companyId', 'companyName companyLogo')
        .limit(5)
        .sort({ postedAt: -1 });

        res.json({
            success: true,
            count: similarJobs.length,
            jobs: similarJobs
        });

    } catch (error) {
        console.error('❌ Error fetching similar jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching similar jobs: ' + error.message
        });
    }
};

// @desc    Get job statistics for company
// @route   GET /api/jobs/stats/company
// @access  Private/Company
exports.getJobStats = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
        }

        const stats = await Job.getStats(company._id);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Error fetching job stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching job stats: ' + error.message
        });
    }
};

// @desc    Search jobs (advanced)
// @route   GET /api/jobs/search
// @access  Public
exports.searchJobs = async (req, res) => {
    try {
        const { 
            q,
            employmentType,
            workMode,
            location,
            experienceLevel,
            minSalary,
            maxSalary,
            skills,
            category,
            page = 1,
            limit = 20,
            sortBy = 'relevance' // relevance, date, salary
        } = req.query;

        const filters = {
            employmentType,
            workMode,
            location,
            experienceLevel,
            minSalary: minSalary ? parseInt(minSalary) : null,
            maxSalary: maxSalary ? parseInt(maxSalary) : null,
            skills: skills ? skills.split(',') : null,
            category
        };

        let jobs = await Job.search(q, filters, parseInt(page), parseInt(limit));

        // Apply sorting
        if (sortBy === 'date') {
            jobs = jobs.sort((a, b) => b.postedAt - a.postedAt);
        } else if (sortBy === 'salary') {
            jobs = jobs.sort((a, b) => (b.salary.max || 0) - (a.salary.max || 0));
        }

        const total = await Job.countDocuments({ status: 'active' });

        res.json({
            success: true,
            count: jobs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            jobs
        });

    } catch (error) {
        console.error('❌ Error searching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching jobs: ' + error.message
        });
    }
};