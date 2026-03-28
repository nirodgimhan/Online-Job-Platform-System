const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Post = require('../models/Post');
const User = require('../models/User');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'companies');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'company-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// ==================== PROFILE MANAGEMENT ====================

/**
 * @route   GET /api/companies/profile
 * @desc    Get current company profile
 * @access  Private/Company
 */
router.get('/profile', auth, auth.authorize('company'), async (req, res) => {
    try {
        console.log('📊 Fetching company profile for user:', req.user.id);
        
        let company = await Company.findOne({ userId: req.user.id })
            .populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture'])
            .populate('postedJobs')
            .populate('posts');
        
        if (!company) {
            console.log('❌ Company profile not found, creating default...');
            // Create a default company profile if it doesn't exist
            const user = await User.findById(req.user.id);
            const newCompany = new Company({
                userId: req.user.id,
                companyName: user.name,
                contactEmail: user.email,
                verified: false,
                followers: [],
                following: [],
                postedJobs: [],
                posts: [],
                followersCount: 0,
                followingCount: 0,
                profileViews: 0,
                totalJobsPosted: 0,
                activeJobsCount: 0,
                postsCount: 0
            });
            await newCompany.save();
            
            company = await Company.findById(newCompany._id)
                .populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture']);
            
            return res.json({ 
                success: true, 
                message: 'Default company profile created',
                company 
            });
        }

        console.log('✅ Company profile found');
        
        // Combine user and company data
        const companyData = company.toObject();
        if (company.userId) {
            companyData.userName = company.userId.name;
            companyData.userEmail = company.userId.email;
            companyData.userPhone = company.userId.phoneNumber;
            companyData.userProfilePicture = company.userId.profilePicture;
        }

        res.json({ 
            success: true, 
            company: companyData 
        });
    } catch (error) {
        console.error('❌ Error fetching company profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   POST /api/companies/profile
 * @desc    Create or update company profile
 * @access  Private/Company
 */
router.post('/profile', auth, auth.authorize('company'), async (req, res) => {
    try {
        console.log('📝 Creating/updating company profile for user:', req.user.id);

        const {
            companyName,
            industry,
            companySize,
            foundedYear,
            website,
            description,
            shortDescription,
            tagline,
            locations,
            address,
            contactEmail,
            contactPhone,
            socialMedia,
            hiringTeam
        } = req.body;

        // Validate required fields
        if (!companyName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Company name is required' 
            });
        }

        // Build company profile object
        const companyFields = {
            userId: req.user.id,
            companyName,
            updatedAt: Date.now()
        };

        // Only add fields if they have valid values
        if (industry && industry.trim() !== '') companyFields.industry = industry;
        if (companySize && companySize.trim() !== '') companyFields.companySize = companySize;
        if (foundedYear && foundedYear.toString().trim() !== '') companyFields.foundedYear = foundedYear;
        if (website && website.trim() !== '') companyFields.website = website;
        if (description && description.trim() !== '') companyFields.description = description;
        if (shortDescription && shortDescription.trim() !== '') companyFields.shortDescription = shortDescription;
        if (tagline && tagline.trim() !== '') companyFields.tagline = tagline;
        if (contactEmail && contactEmail.trim() !== '') companyFields.contactEmail = contactEmail;
        if (contactPhone && contactPhone.trim() !== '') companyFields.contactPhone = contactPhone;
        
        // Handle locations array
        if (locations && Array.isArray(locations) && locations.length > 0) {
            companyFields.locations = locations.filter(loc => 
                loc.city || loc.country || loc.address
            );
        }
        
        // Handle address object
        if (address) {
            const cleanAddress = {};
            if (address.street && address.street.trim() !== '') cleanAddress.street = address.street;
            if (address.city && address.city.trim() !== '') cleanAddress.city = address.city;
            if (address.state && address.state.trim() !== '') cleanAddress.state = address.state;
            if (address.country && address.country.trim() !== '') cleanAddress.country = address.country;
            if (address.zipCode && address.zipCode.trim() !== '') cleanAddress.zipCode = address.zipCode;
            
            if (Object.keys(cleanAddress).length > 0) {
                companyFields.address = cleanAddress;
            }
        }
        
        // Handle socialMedia object
        if (socialMedia) {
            const cleanSocialMedia = {};
            if (socialMedia.linkedin && socialMedia.linkedin.trim() !== '') cleanSocialMedia.linkedin = socialMedia.linkedin;
            if (socialMedia.twitter && socialMedia.twitter.trim() !== '') cleanSocialMedia.twitter = socialMedia.twitter;
            if (socialMedia.facebook && socialMedia.facebook.trim() !== '') cleanSocialMedia.facebook = socialMedia.facebook;
            if (socialMedia.instagram && socialMedia.instagram.trim() !== '') cleanSocialMedia.instagram = socialMedia.instagram;
            if (socialMedia.youtube && socialMedia.youtube.trim() !== '') cleanSocialMedia.youtube = socialMedia.youtube;
            if (socialMedia.github && socialMedia.github.trim() !== '') cleanSocialMedia.github = socialMedia.github;
            
            if (Object.keys(cleanSocialMedia).length > 0) {
                companyFields.socialMedia = cleanSocialMedia;
            }
        }
        
        // Handle hiringTeam array
        if (hiringTeam && Array.isArray(hiringTeam) && hiringTeam.length > 0) {
            companyFields.hiringTeam = hiringTeam.filter(member => 
                member.name && member.name.trim() !== ''
            );
        }

        console.log('Company fields to update:', companyFields);

        // Find and update or create
        let company = await Company.findOne({ userId: req.user.id });

        if (company) {
            // Update existing company
            console.log('Updating existing company profile');
            company = await Company.findOneAndUpdate(
                { userId: req.user.id },
                { $set: companyFields },
                { new: true, runValidators: true }
            ).populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture']);
            
            console.log('✅ Company profile updated successfully');
        } else {
            // Create new company
            console.log('Creating new company profile');
            company = new Company(companyFields);
            await company.save();
            company = await Company.findById(company._id)
                .populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture']);
            console.log('✅ New company profile created');
        }

        // Update the user's contact info if provided
        if (contactPhone && contactPhone.trim() !== '') {
            await User.findByIdAndUpdate(
                req.user.id,
                { 
                    $set: { 
                        phoneNumber: contactPhone,
                        updatedAt: Date.now()
                    } 
                }
            );
        }

        res.json({ 
            success: true, 
            message: 'Company profile updated successfully',
            company 
        });

    } catch (error) {
        console.error('❌ Error saving company profile:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(', ') 
            });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Duplicate field value entered' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   POST /api/companies/logo
 * @desc    Upload company logo
 * @access  Private/Company
 */
router.post('/logo', auth, auth.authorize('company'), upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const company = await Company.findOne({ userId: req.user.id });
        
        // Delete old logo if exists
        if (company && company.companyLogo) {
            const oldLogoPath = path.join(__dirname, '..', company.companyLogo.replace(/^\//, ''));
            if (fs.existsSync(oldLogoPath)) {
                fs.unlinkSync(oldLogoPath);
            }
        }

        const logoUrl = `/uploads/companies/${req.file.filename}`;
        
        const updatedCompany = await Company.findOneAndUpdate(
            { userId: req.user.id },
            { 
                $set: { 
                    companyLogo: logoUrl,
                    updatedAt: Date.now()
                } 
            },
            { new: true, upsert: true }
        );

        res.json({ 
            success: true, 
            message: 'Logo uploaded successfully',
            logo: logoUrl,
            company: updatedCompany 
        });

    } catch (error) {
        console.error('❌ Error uploading logo:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   POST /api/companies/cover
 * @desc    Upload cover photo
 * @access  Private/Company
 */
router.post('/cover', auth, auth.authorize('company'), upload.single('cover'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const company = await Company.findOne({ userId: req.user.id });
        
        // Delete old cover if exists
        if (company && company.coverPhoto) {
            const oldCoverPath = path.join(__dirname, '..', company.coverPhoto.replace(/^\//, ''));
            if (fs.existsSync(oldCoverPath)) {
                fs.unlinkSync(oldCoverPath);
            }
        }

        const coverUrl = `/uploads/companies/${req.file.filename}`;
        
        const updatedCompany = await Company.findOneAndUpdate(
            { userId: req.user.id },
            { 
                $set: { 
                    coverPhoto: coverUrl,
                    updatedAt: Date.now()
                } 
            },
            { new: true, upsert: true }
        );

        res.json({ 
            success: true, 
            message: 'Cover photo uploaded successfully',
            cover: coverUrl,
            company: updatedCompany 
        });

    } catch (error) {
        console.error('❌ Error uploading cover photo:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// ==================== JOB MANAGEMENT ROUTES ====================

/**
 * @route   GET /api/companies/jobs
 * @desc    Get all jobs posted by company
 * @access  Private/Company
 */
router.get('/jobs', auth, auth.authorize('company'), async (req, res) => {
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
        
        // Get job statistics
        const activeJobs = await Job.countDocuments({ 
            companyId: company._id, 
            status: 'active' 
        });
        
        const totalApplicants = await Job.aggregate([
            { $match: { companyId: company._id } },
            { $group: { _id: null, total: { $sum: '$applicantsCount' } } }
        ]);

        res.json({
            success: true,
            count: jobs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            stats: {
                total: await Job.countDocuments({ companyId: company._id }),
                active: activeJobs,
                closed: await Job.countDocuments({ companyId: company._id, status: 'closed' }),
                draft: await Job.countDocuments({ companyId: company._id, status: 'draft' }),
                totalApplicants: totalApplicants[0]?.total || 0
            },
            jobs
        });

    } catch (error) {
        console.error('❌ Error fetching company jobs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   GET /api/companies/jobs/:jobId
 * @desc    Get specific job details
 * @access  Private/Company
 */
router.get('/jobs/:jobId', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company profile not found' 
            });
        }

        const job = await Job.findOne({ 
            _id: req.params.jobId, 
            companyId: company._id 
        }).populate('applications');

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        res.json({
            success: true,
            job
        });

    } catch (error) {
        console.error('❌ Error fetching job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   PUT /api/companies/jobs/:jobId/status
 * @desc    Update job status (active/closed)
 * @access  Private/Company
 */
router.put('/jobs/:jobId/status', auth, auth.authorize('company'), async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['active', 'closed', 'draft'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company profile not found' 
            });
        }

        const job = await Job.findOne({ 
            _id: req.params.jobId, 
            companyId: company._id 
        });

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        // Update job status
        job.status = status;
        await job.save();

        // Update company's active jobs count
        if (status === 'active') {
            company.activeJobsCount += 1;
        } else if (status === 'closed' && job.status === 'active') {
            company.activeJobsCount = Math.max(0, company.activeJobsCount - 1);
        }
        await company.save();

        res.json({
            success: true,
            message: `Job ${status} successfully`,
            job
        });

    } catch (error) {
        console.error('❌ Error updating job status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   GET /api/companies/jobs/stats/overview
 * @desc    Get job statistics overview
 * @access  Private/Company
 */
router.get('/jobs/stats/overview', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company profile not found' 
            });
        }

        const jobStats = await Job.aggregate([
            { $match: { companyId: company._id } },
            {
                $group: {
                    _id: null,
                    totalJobs: { $sum: 1 },
                    activeJobs: { 
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
                    },
                    closedJobs: { 
                        $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } 
                    },
                    draftJobs: { 
                        $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } 
                    },
                    totalViews: { $sum: '$viewsCount' },
                    totalApplicants: { $sum: '$applicantsCount' }
                }
            }
        ]);

        const applicationStats = await Job.aggregate([
            { $match: { companyId: company._id } },
            { $unwind: '$applications' },
            {
                $group: {
                    _id: '$applications.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                jobs: jobStats[0] || {
                    totalJobs: 0,
                    activeJobs: 0,
                    closedJobs: 0,
                    draftJobs: 0,
                    totalViews: 0,
                    totalApplicants: 0
                },
                applications: applicationStats
            }
        });

    } catch (error) {
        console.error('❌ Error fetching job stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// ==================== POSTS MANAGEMENT ====================

/**
 * @route   GET /api/companies/posts
 * @desc    Get company posts
 * @access  Private/Company
 */
router.get('/posts', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company profile not found' 
            });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const posts = await Post.find({ 
            userId: req.user.id,
            userType: 'company'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await Post.countDocuments({ 
            userId: req.user.id,
            userType: 'company'
        });

        res.json({
            success: true,
            count: posts.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            posts
        });

    } catch (error) {
        console.error('❌ Error fetching posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   POST /api/companies/posts
 * @desc    Create a new post
 * @access  Private/Company
 */
router.post('/posts', auth, auth.authorize('company'), upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post content is required' 
            });
        }

        const company = await Company.findOne({ userId: req.user.id });
        
        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company profile not found' 
            });
        }

        const postData = {
            userId: req.user.id,
            userType: 'company',
            content,
            visibility: 'public'
        };

        if (req.file) {
            postData.media = [{
                type: 'image',
                url: `/uploads/companies/${req.file.filename}`
            }];
        }

        const post = new Post(postData);
        await post.save();

        // Add post to company's posts
        await company.addPost(post._id);

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post
        });

    } catch (error) {
        console.error('❌ Error creating post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// ==================== FOLLOWERS MANAGEMENT ====================

/**
 * @route   GET /api/companies/followers
 * @desc    Get company followers
 * @access  Private/Company
 */
router.get('/followers', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id })
            .populate({
                path: 'followers.userId',
                select: 'name email profilePicture'
            });

        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company not found' 
            });
        }

        const followers = company.followers.map(follower => ({
            id: follower.userId._id,
            name: follower.userId.name,
            email: follower.userId.email,
            profilePicture: follower.userId.profilePicture,
            followedAt: follower.followedAt
        }));

        res.json({
            success: true,
            count: followers.length,
            followers
        });

    } catch (error) {
        console.error('❌ Error fetching followers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   POST /api/companies/follow/:studentId
 * @desc    Follow a student
 * @access  Private/Company
 */
router.post('/follow/:studentId', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        const Student = require('../models/Student');
        
        const student = await Student.findOne({ userId: req.params.studentId });

        if (!company || !student) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if already following
        if (company.following.some(f => f.userId.toString() === req.params.studentId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already following this student' 
            });
        }

        // Add to company's following
        await company.followStudent(req.params.studentId);

        // Add to student's followers
        await student.addFollower(req.user.id);

        // Update user counts
        await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } });
        await User.findByIdAndUpdate(req.params.studentId, { $inc: { followersCount: 1 } });

        res.json({ 
            success: true, 
            message: 'Successfully following student',
            followingCount: company.followingCount
        });

    } catch (error) {
        console.error('❌ Error following student:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   DELETE /api/companies/follow/:studentId
 * @desc    Unfollow a student
 * @access  Private/Company
 */
router.delete('/follow/:studentId', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        const Student = require('../models/Student');
        
        const student = await Student.findOne({ userId: req.params.studentId });

        if (!company || !student) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Remove from company's following
        await company.unfollowStudent(req.params.studentId);

        // Remove from student's followers
        await student.removeFollower(req.user.id);

        // Update user counts
        await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(req.params.studentId, { $inc: { followersCount: -1 } });

        res.json({ 
            success: true, 
            message: 'Successfully unfollowed student',
            followingCount: company.followingCount
        });

    } catch (error) {
        console.error('❌ Error unfollowing student:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// ==================== STATISTICS ====================

/**
 * @route   GET /api/companies/stats
 * @desc    Get company statistics
 * @access  Private/Company
 */
router.get('/stats', auth, auth.authorize('company'), async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });

        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company not found' 
            });
        }

        // Get job statistics
        const jobStats = await Job.aggregate([
            { $match: { companyId: company._id } },
            {
                $group: {
                    _id: null,
                    totalJobs: { $sum: 1 },
                    activeJobs: { 
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
                    },
                    totalViews: { $sum: '$viewsCount' },
                    totalApplicants: { $sum: '$applicantsCount' }
                }
            }
        ]);

        // Get application statistics by status
        const applicationStats = await Job.aggregate([
            { $match: { companyId: company._id } },
            { $unwind: '$applications' },
            {
                $group: {
                    _id: '$applications.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get post statistics
        const postCount = await Post.countDocuments({ 
            userId: req.user.id, 
            userType: 'company' 
        });

        const stats = {
            profile: {
                views: company.profileViews,
                completeness: company.profileCompleteness,
                verified: company.verified
            },
            jobs: jobStats[0] || {
                totalJobs: 0,
                activeJobs: 0,
                totalViews: 0,
                totalApplicants: 0
            },
            applications: applicationStats,
            social: {
                followers: company.followersCount,
                following: company.followingCount,
                posts: postCount
            },
            subscription: {
                plan: company.billingInfo?.subscriptionPlan || 'free',
                jobsRemaining: company.jobsRemaining,
                canPostMore: company.canPostMoreJobs
            }
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/companies/public/:id
 * @desc    Get public company profile by user ID
 * @access  Public
 */
router.get('/public/:id', async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.params.id })
            .populate('userId', ['name'])
            .select('-billingInfo -hiringTeam -verificationDocuments -settings');

        if (!company) {
            return res.status(404).json({ 
                success: false, 
                message: 'Company not found' 
            });
        }

        // Get active jobs for this company
        const activeJobs = await Job.find({ 
            companyId: company._id, 
            status: 'active' 
        })
        .select('title employmentType workMode location salary postedAt')
        .limit(5);

        const companyData = company.toObject();
        companyData.activeJobs = activeJobs;
        companyData.activeJobsCount = await Job.countDocuments({ 
            companyId: company._id, 
            status: 'active' 
        });

        res.json({ 
            success: true, 
            company: companyData 
        });
    } catch (error) {
        console.error('❌ Error fetching public company profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   GET /api/companies/trending
 * @desc    Get trending companies
 * @access  Public
 */
router.get('/trending', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const companies = await Company.getTrending(parseInt(limit));

        res.json({ 
            success: true, 
            companies 
        });

    } catch (error) {
        console.error('❌ Error fetching trending companies:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   GET /api/companies/hiring
 * @desc    Get companies that are currently hiring
 * @access  Public
 */
router.get('/hiring', async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const companies = await Company.getHiringCompanies(parseInt(limit));

        res.json({ 
            success: true, 
            companies 
        });

    } catch (error) {
        console.error('❌ Error fetching hiring companies:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

/**
 * @route   GET /api/companies/search
 * @desc    Search companies
 * @access  Public
 */
router.get('/search', async (req, res) => {
    try {
        const { q, industry, location, verified, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filters = {
            industry,
            location,
            verified: verified === 'true'
        };

        const companies = await Company.search(q, filters, parseInt(limit), skip);
        const total = await Company.countDocuments({});

        res.json({
            success: true,
            count: companies.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            companies
        });

    } catch (error) {
        console.error('❌ Error searching companies:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error: ' + error.message 
        });
    }
});

module.exports = router;