const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../Models/Application');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// ==================== CREATE JOB ====================
exports.createJob = async (req, res) => {
    try {
        console.log('📝 Creating new job for user:', req.user.id);

        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company profile not found. Please create your company profile first.'
            });
        }

        const jobData = { ...req.body, companyId: company._id };
        const job = new Job(jobData);
        await job.save();

        // Add job reference to company
        if (company.addJob) await company.addJob(job._id);
        else company.postedJobs.push(job._id) && await company.save();

        // NOTIFY ALL STUDENTS about the new job
        try {
            const students = await User.find({ role: 'student' });
            for (const student of students) {
                await createNotification(
                    student._id,
                    'new_job',
                    'New Job Posted',
                    `${job.title} at ${company.companyName}`,
                    `/student/job/${job._id}`
                );
            }
        } catch (notifError) {
            console.error('Error sending new job notifications:', notifError);
            // Do not fail job creation if notifications fail
        }

        console.log('✅ Job created:', job._id);
        res.status(201).json({ success: true, message: 'Job posted successfully', job });
    } catch (error) {
        console.error('❌ Create job error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Error creating job: ' + error.message });
    }
};

// ==================== GET ALL JOBS (PUBLIC) ====================
exports.getAllJobs = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, employmentType, workMode, location, minSalary, category, companyId } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { status: 'active' };
        if (search) query.title = { $regex: search, $options: 'i' };
        if (employmentType) query.employmentType = employmentType;
        if (workMode) query.workMode = workMode;
        if (location) query['location.city'] = { $regex: location, $options: 'i' };
        if (category) query.category = category;
        if (companyId) query.companyId = companyId;
        if (minSalary) query['salary.min'] = { $gte: parseInt(minSalary) };

        const jobs = await Job.find(query)
            .populate('companyId', 'companyName companyLogo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await Job.countDocuments(query);

        res.json({ success: true, jobs, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== GET JOB BY ID ====================
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('companyId', 'companyName companyLogo description industry location');
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        if (typeof job.incrementViews === 'function') await job.incrementViews();
        res.json({ success: true, job });
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== GET COMPANY'S JOBS ====================
exports.getCompanyJobs = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) return res.status(404).json({ success: false, message: 'Company profile not found' });
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { companyId: company._id };
        if (status) query.status = status;
        const jobs = await Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Job.countDocuments(query);
        res.json({ success: true, jobs, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total });
    } catch (error) {
        console.error('Get company jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== UPDATE JOB ====================
exports.updateJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
        const job = await Job.findOne({ _id: req.params.id, companyId: company._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found or not owned' });
        Object.assign(job, req.body);
        await job.save();
        res.json({ success: true, message: 'Job updated', job });
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== DELETE JOB ====================
exports.deleteJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
        const job = await Job.findOne({ _id: req.params.id, companyId: company._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        await Application.deleteMany({ jobId: job._id });
        company.postedJobs = company.postedJobs.filter(id => id.toString() !== job._id.toString());
        await company.save();
        await job.deleteOne();
        res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== CLOSE JOB ====================
exports.closeJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        const job = await Job.findOne({ _id: req.params.id, companyId: company._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        job.status = 'closed';
        await job.save();
        res.json({ success: true, message: 'Job closed' });
    } catch (error) {
        console.error('Close job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== REOPEN JOB ====================
exports.reopenJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        const job = await Job.findOne({ _id: req.params.id, companyId: company._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        job.status = 'active';
        await job.save();
        res.json({ success: true, message: 'Job reopened' });
    } catch (error) {
        console.error('Reopen job error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== GET SIMILAR JOBS ====================
exports.getSimilarJobs = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        const similar = await Job.find({
            _id: { $ne: job._id },
            status: 'active',
            $or: [
                { 'skills.name': { $in: job.skills?.map(s => s.name) || [] } },
                { category: job.category },
                { employmentType: job.employmentType }
            ]
        }).populate('companyId', 'companyName companyLogo').limit(5);
        res.json({ success: true, jobs: similar });
    } catch (error) {
        console.error('Similar jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== GET JOB STATS (COMPANY) ====================
exports.getJobStats = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
        const total = await Job.countDocuments({ companyId: company._id });
        const active = await Job.countDocuments({ companyId: company._id, status: 'active' });
        const closed = await Job.countDocuments({ companyId: company._id, status: 'closed' });
        res.json({ success: true, stats: { total, active, closed } });
    } catch (error) {
        console.error('Job stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== SEARCH JOBS (ADVANCED) ====================
exports.searchJobs = async (req, res) => {
    try {
        const { q, employmentType, workMode, location, minSalary, category, page = 1, limit = 20 } = req.query;
        const query = { status: 'active' };
        if (q) query.title = { $regex: q, $options: 'i' };
        if (employmentType) query.employmentType = employmentType;
        if (workMode) query.workMode = workMode;
        if (location) query['location.city'] = { $regex: location, $options: 'i' };
        if (category) query.category = category;
        if (minSalary) query['salary.min'] = { $gte: parseInt(minSalary) };
        const jobs = await Job.find(query).populate('companyId', 'companyName companyLogo').skip((page-1)*limit).limit(parseInt(limit));
        res.json({ success: true, jobs });
    } catch (error) {
        console.error('Search jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ==================== GET FEATURED JOBS ====================
exports.getFeaturedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'active', isFeatured: true }).limit(parseInt(req.query.limit) || 6);
        res.json({ success: true, jobs });
    } catch (error) {
        console.error('Featured jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};