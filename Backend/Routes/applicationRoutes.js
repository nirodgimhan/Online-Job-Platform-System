const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Application = require('../Models/Application');
const Student = require('../models/Student');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');

// @route   POST api/applications
// @desc    Apply for a job
// @access  Private/Student
router.post('/', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('📝 Creating new application:', req.body);
        
        const { jobId, coverLetter } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        // Allow re‑application if previous is Withdrawn or Rejected
        const existingApplication = await Application.findOne({
            jobId,
            studentId: student._id
        });

        if (existingApplication) {
            if (['Withdrawn', 'Rejected'].includes(existingApplication.status)) {
                console.log(`🗑️ Deleting previous ${existingApplication.status} application for job ${jobId}`);
                student.appliedJobs = student.appliedJobs.filter(
                    app => app.applicationId?.toString() !== existingApplication._id.toString()
                );
                await student.save();
                await Application.findByIdAndDelete(existingApplication._id);
            } else {
                return res.status(400).json({ success: false, message: 'Already applied for this job' });
            }
        }

        const newApplication = new Application({
            jobId,
            studentId: student._id,
            companyId: job.companyId,
            coverLetter: coverLetter || '',
            status: 'Pending',
            appliedDate: new Date()
        });

        const application = await newApplication.save();
        console.log('✅ Application created:', application._id);

        student.appliedJobs.push({
            jobId,
            applicationId: application._id,
            appliedDate: new Date()
        });
        await student.save();

        job.applications = (job.applications || 0) + 1;
        await job.save();

        res.json({ success: true, application });

    } catch (error) {
        console.error('❌ Error creating application:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/applications/student
// @desc    Get student's applications
// @access  Private/Student
router.get('/student', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('📊 Fetching student applications for user:', req.user.id);
        
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.json({ success: true, applications: [] });
        }

        const applications = await Application.find({ studentId: student._id })
            .populate({
                path: 'jobId',
                populate: {
                    path: 'companyId',
                    select: 'companyName companyLogo industry location'
                }
            })
            .sort({ appliedDate: -1 });

        res.json({ success: true, applications });

    } catch (error) {
        console.error('❌ Error fetching student applications:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/applications/company
// @desc    Get applications for company's jobs
// @access  Private/Company (and Admin)
router.get('/company', auth, auth.authorize('company', 'admin'), async (req, res) => {
    try {
        console.log('📊 Fetching company applications for user:', req.user.id);
        
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            if (req.user.role === 'admin') {
                return res.json({ success: true, applications: [] });
            }
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        const applications = await Application.find({ companyId: company._id })
            .populate({
                path: 'jobId',
                select: 'title employmentType workMode location salary'
            })
            .populate({
                path: 'studentId',
                populate: {
                    path: 'userId',
                    select: 'name email phoneNumber profilePicture'
                }
            })
            .sort({ appliedDate: -1 });

        const formattedApplications = applications.map(app => ({
            _id: app._id,
            status: app.status,
            appliedAt: app.appliedDate,
            coverLetter: app.coverLetter,
            jobId: app.jobId,
            companyId: app.companyId,
            studentId: app.studentId,
            studentName: app.studentId?.userId?.name || 'Unknown',
            studentEmail: app.studentId?.userId?.email || 'No email',
            studentPhone: app.studentId?.userId?.phoneNumber || ''
        }));
        
        res.json({ success: true, applications: formattedApplications });

    } catch (error) {
        console.error('❌ Error fetching company applications:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// ==================== NEW: ADMIN ENDPOINTS ====================

// @route   GET api/applications/admin/all
// @desc    Get ALL applications (admin only)
// @access  Private/Admin
router.get('/admin/all', auth, auth.authorize('admin'), async (req, res) => {
    try {
        console.log('📊 Admin fetching all applications');

        const applications = await Application.find({})
            .populate({
                path: 'jobId',
                select: 'title employmentType workMode location salary'
            })
            .populate({
                path: 'studentId',
                populate: {
                    path: 'userId',
                    select: 'name email phoneNumber profilePicture'
                }
            })
            .populate({
                path: 'companyId',
                select: 'companyName companyLogo industry'
            })
            .sort({ appliedDate: -1 });

        const formattedApplications = applications.map(app => ({
            _id: app._id,
            status: app.status,
            appliedAt: app.appliedDate,
            coverLetter: app.coverLetter,
            jobId: app.jobId,
            companyId: app.companyId,
            studentId: app.studentId,
            studentName: app.studentId?.userId?.name || 'Unknown',
            studentEmail: app.studentId?.userId?.email || 'No email',
            studentPhone: app.studentId?.userId?.phoneNumber || '',
            companyName: app.companyId?.companyName || 'Unknown'
        }));

        res.json({ success: true, applications: formattedApplications });

    } catch (error) {
        console.error('❌ Error fetching all applications for admin:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/applications/admin/statistics
// @desc    Get application statistics for admin dashboard
// @access  Private/Admin
router.get('/admin/statistics', auth, auth.authorize('admin'), async (req, res) => {
    try {
        const applications = await Application.find({});
        
        const statistics = {
            total: applications.length,
            pending: applications.filter(app => app.status === 'Pending').length,
            reviewed: applications.filter(app => app.status === 'Reviewed').length,
            shortlisted: applications.filter(app => app.status === 'Shortlisted').length,
            interview: applications.filter(app => app.status === 'Interview').length,
            offered: applications.filter(app => app.status === 'Offered').length,
            accepted: applications.filter(app => app.status === 'Accepted').length,
            rejected: applications.filter(app => app.status === 'Rejected').length,
            withdrawn: applications.filter(app => app.status === 'Withdrawn').length
        };

        res.json({ success: true, statistics });

    } catch (error) {
        console.error('Error fetching admin statistics:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ==================== END ADMIN ENDPOINTS ====================

// @route   GET api/applications/job/:jobId
// @desc    Get applications for a specific job
// @access  Private/Company
router.get('/job/:jobId', auth, auth.authorize('company'), async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        const job = await Job.findOne({ _id: jobId, companyId: company._id });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found or not authorized' });
        }

        const applications = await Application.find({ jobId })
            .populate({
                path: 'studentId',
                populate: {
                    path: 'userId',
                    select: 'name email phoneNumber profilePicture'
                }
            })
            .sort({ appliedDate: -1 });

        res.json({ success: true, applications });

    } catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate({
                path: 'jobId',
                populate: {
                    path: 'companyId',
                    select: 'companyName companyLogo industry'
                }
            })
            .populate({
                path: 'studentId',
                populate: {
                    path: 'userId',
                    select: 'name email phoneNumber profilePicture'
                }
            });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const user = await User.findById(req.user.id);
        if (user.role === 'student' && application.studentId.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        if (user.role === 'company') {
            const company = await Company.findOne({ userId: req.user.id });
            if (application.companyId.toString() !== company._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        }

        res.json({ success: true, application });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT api/applications/:id/status
// @desc    Update application status
// @access  Private (Company or Student for withdrawal)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status, interviewDetails, feedback } = req.body;
        let application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Student withdrawal
        if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user.id });
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }

            if (application.studentId.toString() !== student._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized to modify this application' });
            }

            if (status !== 'Withdrawn') {
                return res.status(403).json({ success: false, message: 'Students can only withdraw their application' });
            }

            application.status = 'Withdrawn';
            application.updatedAt = Date.now();
            await application.save();

            const studentDoc = await Student.findOne({ userId: req.user.id });
            if (studentDoc) {
                const appliedIndex = studentDoc.appliedJobs.findIndex(job => job.applicationId?.toString() === application._id.toString());
                if (appliedIndex !== -1) {
                    studentDoc.appliedJobs[appliedIndex].status = 'Withdrawn';
                    await studentDoc.save();
                }
            }

            const job = await Job.findById(application.jobId);
            if (job && job.applications > 0) {
                job.applications -= 1;
                await job.save();
            }

            return res.json({ success: true, application });
        }

        // Company update
        if (req.user.role !== 'company') {
            return res.status(403).json({ success: false, message: 'Access denied. Only companies can update application status.' });
        }

        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        if (application.companyId.toString() !== company._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const updateFields = { 
            status, 
            updatedAt: Date.now() 
        };
        
        if (status === 'Reviewed') {
            updateFields.reviewedDate = Date.now();
        }
        
        if (interviewDetails) {
            updateFields.interviewDetails = interviewDetails;
            if (status === 'Interview') {
                updateFields.interviewDate = interviewDetails.date;
            }
        }
        
        if (feedback) {
            updateFields.feedback = {
                ...feedback,
                providedBy: req.user.id,
                providedDate: Date.now()
            };
        }

        application = await Application.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        res.json({ success: true, application });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET api/applications/student/applied
// @desc    Get student's applied jobs with details
// @access  Private/Student
router.get('/student/applied', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('📊 Fetching student applied jobs for user:', req.user.id);
        
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student profile not found' 
            });
        }

        const applications = await Application.find({ studentId: student._id })
            .populate({
                path: 'jobId',
                populate: {
                    path: 'companyId',
                    select: 'companyName companyLogo industry location'
                }
            })
            .sort({ appliedDate: -1 });

        res.json({ 
            success: true, 
            applications,
            count: applications.length
        });

    } catch (error) {
        console.error('❌ Error fetching student applications:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// @route   GET api/applications/statistics
// @desc    Get application statistics for company
// @access  Private/Company
router.get('/statistics', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        const applications = await Application.find({ companyId: company._id });
        
        const statistics = {
            total: applications.length,
            pending: applications.filter(app => app.status === 'Pending').length,
            reviewed: applications.filter(app => app.status === 'Reviewed').length,
            shortlisted: applications.filter(app => app.status === 'Shortlisted').length,
            interview: applications.filter(app => app.status === 'Interview').length,
            offered: applications.filter(app => app.status === 'Offered').length,
            accepted: applications.filter(app => app.status === 'Accepted').length,
            rejected: applications.filter(app => app.status === 'Rejected').length,
            withdrawn: applications.filter(app => app.status === 'Withdrawn').length
        };

        res.json({ success: true, statistics });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;