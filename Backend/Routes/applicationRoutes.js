const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Job = require('../models/Job');
const Company = require('../models/Company');

// @route   POST api/applications
// @desc    Apply for a job
// @access  Private/Student
router.post('/', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('📝 Creating new application:', req.body);
        
        const { jobId, coverLetter } = req.body;

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // Get student profile
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        // Check if already applied
        const existingApplication = await Application.findOne({
            jobId,
            studentId: student._id
        });

        if (existingApplication) {
            return res.status(400).json({ success: false, message: 'Already applied for this job' });
        }

        // Create application
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

        // Update student's applied jobs
        student.appliedJobs.push({
            jobId,
            applicationId: application._id,
            appliedDate: new Date()
        });
        await student.save();

        // Update job applications count
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
            console.log('❌ Student profile not found');
            return res.json({ success: true, applications: [] }); // Return empty array instead of error
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

        console.log(`✅ Found ${applications.length} applications`);
        res.json({ success: true, applications });

    } catch (error) {
        console.error('❌ Error fetching student applications:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/applications/company
// @desc    Get applications for company's jobs
// @access  Private/Company
router.get('/company', auth, auth.authorize('company'), async (req, res) => {
    try {
        console.log('📊 Fetching company applications for user:', req.user.id);
        
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            console.log('❌ Company profile not found');
            return res.json({ success: true, applications: [] }); // Return empty array instead of error
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

        console.log(`✅ Found ${applications.length} applications`);
        res.json({ success: true, applications });

    } catch (error) {
        console.error('❌ Error fetching company applications:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

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

        // Verify job belongs to company
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

        // Check authorization
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
// @access  Private/Company
router.put('/:id/status', auth, auth.authorize('company'), async (req, res) => {
    try {
        const { status, interviewDetails, feedback } = req.body;

        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        let application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Check if application belongs to company
        if (application.companyId.toString() !== company._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update fields
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

// @route   GET api/applications/student
// @desc    Get student's applications
// @access  Private/Student
router.get('/student', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('📊 Fetching student applications for user:', req.user.id);
        
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            console.log('❌ Student profile not found');
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

        console.log(`✅ Found ${applications.length} applications for student`);
        
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

module.exports = router;