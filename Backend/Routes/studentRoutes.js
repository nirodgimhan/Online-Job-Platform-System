const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Student = require('../Models/Student');
const User = require('../models/User');
const Job = require('../models/Job');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
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
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
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

// @route   GET api/students/profile
// @desc    Get current student profile
// @access  Private/Student
router.get('/profile', auth, auth.authorize('student'), async (req, res) => {
  try {
    console.log('Fetching student profile for user:', req.user.id);
    
    let student = await Student.findOne({ userId: req.user.id })
      .populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture'])
      .populate('savedJobs')
      .populate('appliedJobs.jobId');
    
    if (!student) {
      console.log('Student profile not found, creating one...');
      // Create a default profile if it doesn't exist
      const newStudent = new Student({
        userId: req.user.id,
        skills: [],
        education: [],
        experience: [],
        languages: [],
        certifications: []
      });
      await newStudent.save();
      
      // Populate after saving
      student = await Student.findById(newStudent._id)
        .populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture']);
    }

    console.log('Student profile found/created');
    
    // Combine student and user data
    const studentData = student.toObject();
    if (student.userId) {
      studentData.name = student.userId.name;
      studentData.email = student.userId.email;
      studentData.phoneNumber = student.userId.phoneNumber;
      studentData.profilePicture = student.userId.profilePicture;
    }

    res.json({ 
      success: true, 
      student: studentData
    });
  } catch (error) {
    console.error('Error fetching student profile:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   POST api/students/profile
// @desc    Create or update student profile
// @access  Private/Student
router.post('/profile', auth, auth.authorize('student'), async (req, res) => {
  try {
    const {
      summary,
      education,
      experience,
      skills,
      languages,
      certifications,
      portfolio,
      jobPreferences,
      socialLinks
    } = req.body;

    // Sanitize inputs - FIXED: Handle portfolio specially
    let sanitizedPortfolio = '';
    if (portfolio !== undefined) {
      // If portfolio is an array, convert to empty string
      if (Array.isArray(portfolio)) {
        sanitizedPortfolio = '';
      } else if (typeof portfolio === 'string') {
        sanitizedPortfolio = portfolio;
      } else {
        sanitizedPortfolio = '';
      }
    }

    // Build student profile object
    const updateData = {};
    
    if (summary !== undefined) updateData.summary = summary;
    if (education !== undefined) updateData.education = education;
    if (experience !== undefined) updateData.experience = experience;
    if (skills !== undefined) updateData.skills = skills;
    if (languages !== undefined) updateData.languages = languages;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (portfolio !== undefined) updateData.portfolio = sanitizedPortfolio;
    if (jobPreferences !== undefined) updateData.jobPreferences = jobPreferences;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    
    updateData.lastActive = Date.now();

    // Find and update, or create if doesn't exist
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    ).populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture']);

    // Update user's last active
    await User.findByIdAndUpdate(req.user.id, { lastActive: Date.now() });

    // Combine student and user data for response
    const studentData = student.toObject();
    if (student.userId) {
      studentData.name = student.userId.name;
      studentData.email = student.userId.email;
      studentData.phoneNumber = student.userId.phoneNumber;
      studentData.profilePicture = student.userId.profilePicture;
    }

    res.json({ 
      success: true, 
      student: studentData
    });

  } catch (error) {
    console.error('Error updating student profile:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   POST api/students/profile/photo
// @desc    Upload profile photo
// @access  Private/Student
router.post('/profile/photo', auth, auth.authorize('student'), upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Get the old profile picture to delete it
    const user = await User.findById(req.user.id);
    if (user.profilePicture) {
      const oldPhotoPath = path.join(__dirname, '..', user.profilePicture.replace(/^\//, ''));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update user's profile picture
    const photoUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: photoUrl },
      { new: true }
    ).select('-password');

    // Update student's last active
    await Student.findOneAndUpdate(
      { userId: req.user.id },
      { lastActive: Date.now() }
    );

    res.json({ 
      success: true, 
      profilePicture: photoUrl,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   POST api/students/profile/cover
// @desc    Upload cover photo
// @access  Private/Student
router.post('/profile/cover', auth, auth.authorize('student'), upload.single('coverPhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    
    // Update student's cover photo
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { 
        coverPhoto: photoUrl,
        lastActive: Date.now()
      },
      { new: true, upsert: true }
    );

    res.json({ 
      success: true, 
      coverPhoto: photoUrl,
      student
    });

  } catch (error) {
    console.error('Error uploading cover photo:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   GET api/students/saved-jobs
// @desc    Get student's saved jobs
// @access  Private/Student
router.get('/saved-jobs', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate({
        path: 'savedJobs',
        populate: {
          path: 'company',
          select: 'name logo location'
        }
      });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    res.json({ 
      success: true, 
      savedJobs: student.savedJobs 
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   POST api/students/saved-jobs/:jobId
// @desc    Save a job
// @access  Private/Student
router.post('/saved-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    // Check if job already saved
    if (student.savedJobs.includes(req.params.jobId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Job already saved' 
      });
    }

    student.savedJobs.push(req.params.jobId);
    await student.save();

    res.json({ 
      success: true, 
      savedJobs: student.savedJobs 
    });
  } catch (error) {
    console.error('Error saving job:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   DELETE api/students/saved-jobs/:jobId
// @desc    Remove saved job
// @access  Private/Student
router.delete('/saved-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    // Remove job from saved jobs
    student.savedJobs = student.savedJobs.filter(
      job => job.toString() !== req.params.jobId
    );
    await student.save();

    res.json({ 
      success: true, 
      savedJobs: student.savedJobs 
    });
  } catch (error) {
    console.error('Error removing saved job:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   GET api/students/applied-jobs
// @desc    Get student's applied jobs
// @access  Private/Student
router.get('/applied-jobs', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate({
        path: 'appliedJobs.jobId',
        populate: {
          path: 'company',
          select: 'name logo location'
        }
      });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    res.json({ 
      success: true, 
      appliedJobs: student.appliedJobs 
    });
  } catch (error) {
    console.error('Error fetching applied jobs:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   POST api/students/applied-jobs/:jobId
// @desc    Apply for a job
// @access  Private/Student
router.post('/applied-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    // Check if already applied
    const alreadyApplied = student.appliedJobs.some(
      job => job.jobId.toString() === req.params.jobId
    );

    if (alreadyApplied) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already applied for this job' 
      });
    }

    student.appliedJobs.push({
      jobId: req.params.jobId,
      appliedAt: Date.now(),
      status: 'pending'
    });
    await student.save();

    res.json({ 
      success: true, 
      appliedJobs: student.appliedJobs 
    });
  } catch (error) {
    console.error('Error applying for job:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   GET api/students/following
// @desc    Get students the current user is following
// @access  Private/Student
router.get('/following', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('following', 'name email profilePicture');
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    res.json({ 
      success: true, 
      following: student.following 
    });
  } catch (error) {
    console.error('Error fetching following:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   POST api/students/follow/:userId
// @desc    Follow another user
// @access  Private/Student
router.post('/follow/:userId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const targetStudent = await Student.findOne({ userId: req.params.userId });

    if (!student || !targetStudent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    // Check if already following
    if (student.following.includes(req.params.userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already following this user' 
      });
    }

    // Add to following
    student.following.push(req.params.userId);
    await student.save();

    // Add to followers of target
    targetStudent.followers.push(req.user.id);
    await targetStudent.save();

    res.json({ 
      success: true, 
      message: 'Successfully followed user' 
    });
  } catch (error) {
    console.error('Error following user:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   DELETE api/students/follow/:userId
// @desc    Unfollow a user
// @access  Private/Student
router.delete('/follow/:userId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const targetStudent = await Student.findOne({ userId: req.params.userId });

    if (!student || !targetStudent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    // Remove from following
    student.following = student.following.filter(
      id => id.toString() !== req.params.userId
    );
    await student.save();

    // Remove from followers of target
    targetStudent.followers = targetStudent.followers.filter(
      id => id.toString() !== req.user.id
    );
    await targetStudent.save();

    res.json({ 
      success: true, 
      message: 'Successfully unfollowed user' 
    });
  } catch (error) {
    console.error('Error unfollowing user:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   GET api/students/connections/count
// @desc    Get connections count (followers + following)
// @access  Private/Student
router.get('/connections/count', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.json({ 
        success: true, 
        count: 0 
      });
    }

    const count = student.followers.length + student.following.length;

    res.json({ 
      success: true, 
      count 
    });
  } catch (error) {
    console.error('Error fetching connections count:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});

// @route   POST api/students/profile/view
// @desc    Increment profile views
// @access  Private
router.post('/profile/view', auth, async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { profileViews: 1 } },
      { new: true }
    );

    res.json({ 
      success: true, 
      views: student?.profileViews || 0 
    });
  } catch (error) {
    console.error('Error incrementing profile views:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
});
// Add these routes to your existing studentRoutes.js

// ==================== FEED & POSTS ====================

// @route   GET api/students/feed
// @desc    Get student's feed (posts from followed companies)
// @access  Private/Student
router.get('/feed', auth, auth.authorize('student'), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const student = await Student.findOne({ userId: req.user.id });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        // Get IDs of followed users (companies and other students)
        const followingIds = student.following.map(f => f.userId);

        // Get posts from followed users and own posts
        const posts = await Post.find({
            $or: [
                { userId: req.user.id },
                { 
                    userId: { $in: followingIds },
                    visibility: { $in: ['public', 'followers'] }
                }
            ],
            isArchived: false,
            isReported: false
        })
        .populate('userId', 'name profilePicture role')
        .populate('comments.userId', 'name profilePicture')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

        const total = await Post.countDocuments({
            $or: [
                { userId: req.user.id },
                { 
                    userId: { $in: followingIds },
                    visibility: { $in: ['public', 'followers'] }
                }
            ],
            isArchived: false,
            isReported: false
        });

        // Check if each post is liked by the student
        const postsWithLikeStatus = posts.map(post => {
            const postObj = post.toObject();
            postObj.isLiked = post.likes.some(like => like.userId.toString() === req.user.id);
            return postObj;
        });

        res.json({
            success: true,
            posts: postsWithLikeStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching student feed:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== FOLLOWING COMPANIES ====================

// @route   POST api/students/follow-company/:companyId
// @desc    Follow a company
// @access  Private/Student
router.post('/follow-company/:companyId', auth, auth.authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.params.companyId });

        if (!student || !company) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already following
        if (student.following.some(f => f.userId.toString() === req.params.companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Already following this company'
            });
        }

        // Add to student's following
        await student.follow(req.params.companyId, 'company');

        // Add to company's followers
        await company.addFollower(req.user.id, 'student');

        // Update user counts
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { followingCount: 1 }
        });
        
        await User.findByIdAndUpdate(req.params.companyId, {
            $inc: { followersCount: 1 }
        });

        res.json({
            success: true,
            message: 'Successfully following company',
            followingCount: student.followingCount
        });

    } catch (error) {
        console.error('Error following company:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   DELETE api/students/follow-company/:companyId
// @desc    Unfollow a company
// @access  Private/Student
router.delete('/follow-company/:companyId', auth, auth.authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.params.companyId });

        if (!student || !company) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove from student's following
        await student.unfollow(req.params.companyId);

        // Remove from company's followers
        await company.removeFollower(req.user.id);

        // Update user counts
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { followingCount: -1 }
        });
        
        await User.findByIdAndUpdate(req.params.companyId, {
            $inc: { followersCount: -1 }
        });

        res.json({
            success: true,
            message: 'Successfully unfollowed company',
            followingCount: student.followingCount
        });

    } catch (error) {
        console.error('Error unfollowing company:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   GET api/students/following/companies
// @desc    Get companies a student is following
// @access  Private/Student
router.get('/following/companies', auth, auth.authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id })
            .populate({
                path: 'following.userId',
                model: 'User',
                select: 'name profilePicture'
            });

        // Get company details for each followed user
        const companies = await Promise.all(
            student.following
                .filter(f => f.userType === 'company')
                .map(async (follow) => {
                    const company = await Company.findOne({ userId: follow.userId._id })
                        .select('companyName industry companyLogo description');
                    return {
                        ...follow.toObject(),
                        companyDetails: company
                    };
                })
        );

        res.json({
            success: true,
            following: companies,
            count: companies.length
        });

    } catch (error) {
        console.error('Error fetching followed companies:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== FOLLOWERS ====================

// @route   GET api/students/followers
// @desc    Get student's followers
// @access  Private/Student
router.get('/followers', auth, auth.authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id })
            .populate({
                path: 'followers.userId',
                model: 'User',
                select: 'name profilePicture role'
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Separate companies and students
        const followers = await Promise.all(
            student.followers.map(async (follower) => {
                const followerData = {
                    ...follower.toObject(),
                    user: follower.userId
                };

                if (follower.userType === 'company') {
                    const company = await Company.findOne({ userId: follower.userId._id })
                        .select('companyName industry companyLogo');
                    followerData.companyDetails = company;
                } else if (follower.userType === 'student') {
                    const studentProfile = await Student.findOne({ userId: follower.userId._id })
                        .select('skills education summary');
                    followerData.studentDetails = studentProfile;
                }

                return followerData;
            })
        );

        res.json({
            success: true,
            followers,
            count: student.followersCount
        });

    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== SEARCH COMPANIES ====================

// @route   GET api/students/search/companies
// @desc    Search companies for student
// @access  Private/Student
router.get('/search/companies', auth, auth.authorize('student'), async (req, res) => {
    try {
        const { q, industry, location, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { isProfilePublic: true };
        
        if (q) {
            query.$or = [
                { companyName: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { industry: { $regex: q, $options: 'i' } },
                { tagline: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (industry) {
            query.industry = { $regex: industry, $options: 'i' };
        }
        
        if (location) {
            query.$or = [
                { 'address.city': { $regex: location, $options: 'i' } },
                { 'address.country': { $regex: location, $options: 'i' } },
                { 'locations.city': { $regex: location, $options: 'i' } }
            ];
        }

        const companies = await Company.find(query)
            .select('companyName industry description companyLogo website locations followersCount activeJobsCount verified')
            .populate('userId', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ followersCount: -1, verified: -1 });

        // Check if student is following each company
        const student = await Student.findOne({ userId: req.user.id });
        const followingIds = student ? student.following.map(f => f.userId.toString()) : [];

        const companiesWithFollowStatus = companies.map(company => {
            const companyObj = company.toObject();
            companyObj.isFollowing = followingIds.includes(company.userId._id.toString());
            return companyObj;
        });

        const total = await Company.countDocuments(query);

        res.json({
            success: true,
            companies: companiesWithFollowStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error searching companies:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== STUDENT STATS ====================

// @route   GET api/students/stats
// @desc    Get student statistics
// @access  Private/Student
router.get('/stats', auth, auth.authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get additional stats
        const savedJobsCount = student.savedJobs.length;
        const appliedJobsCount = student.appliedJobs.length;
        const pendingApplications = student.appliedJobs.filter(j => j.status === 'pending').length;
        const interviewsCount = student.appliedJobs.filter(j => j.status === 'interview').length;

        // Get profile views from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        res.json({
            success: true,
            stats: {
                profileViews: student.profileViews,
                profileCompleteness: student.profileCompleteness,
                postsCount: student.postsCount,
                followersCount: student.followersCount,
                followingCount: student.followingCount,
                savedJobsCount,
                appliedJobsCount,
                pendingApplications,
                interviewsCount,
                skillsCount: student.skills.length,
                educationCount: student.education.length,
                experienceCount: student.experience.length,
                languagesCount: student.languages.length,
                certificationsCount: student.certifications.length,
                projectsCount: student.projects?.length || 0
            }
        });

    } catch (error) {
        console.error('Error fetching student stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== SAVED JOBS ROUTES ====================

/**
 * @route   GET /api/students/saved-jobs
 * @desc    Get student's saved jobs
 * @access  Private/Student
 */
router.get('/saved-jobs', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('📋 Fetching saved jobs for user:', req.user.id);
        
        const student = await Student.findOne({ userId: req.user.id })
            .populate({
                path: 'savedJobs',
                populate: {
                    path: 'companyId',
                    select: 'companyName companyLogo industry location'
                }
            });
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student profile not found' 
            });
        }

        // Add savedAt timestamp to each job (you might want to store this in your schema)
        const savedJobsWithDate = student.savedJobs.map(job => ({
            ...job.toObject(),
            savedAt: job.savedAt || new Date() // If you have a savedAt field in your schema
        }));

        res.json({ 
            success: true, 
            savedJobs: savedJobsWithDate,
            total: savedJobsWithDate.length
        });

    } catch (error) {
        console.error('❌ Error fetching saved jobs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching saved jobs: ' + error.message 
        });
    }
});

/**
 * @route   POST /api/students/saved-jobs/:jobId
 * @desc    Save a job
 * @access  Private/Student
 */
router.post('/saved-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('💾 Saving job:', req.params.jobId, 'for user:', req.user.id);

        // Check if job exists
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        // Find student profile
        let student = await Student.findOne({ userId: req.user.id });
        
        if (!student) {
            // Create student profile if it doesn't exist
            student = new Student({
                userId: req.user.id,
                savedJobs: []
            });
            await student.save();
            console.log('✅ Created new student profile');
        }

        // Check if job already saved
        if (student.savedJobs.includes(req.params.jobId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Job already saved' 
            });
        }

        // Add job to saved jobs
        student.savedJobs.push(req.params.jobId);
        await student.save();

        console.log('✅ Job saved successfully');

        res.json({ 
            success: true, 
            message: 'Job saved successfully',
            savedJobs: student.savedJobs 
        });

    } catch (error) {
        console.error('❌ Error saving job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving job: ' + error.message 
        });
    }
});

/**
 * @route   DELETE /api/students/saved-jobs/:jobId
 * @desc    Remove saved job
 * @access  Private/Student
 */
router.delete('/saved-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
    try {
        console.log('🗑️ Removing saved job:', req.params.jobId, 'for user:', req.user.id);

        const student = await Student.findOne({ userId: req.user.id });

        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student profile not found' 
            });
        }

        // Check if job exists in saved jobs
        if (!student.savedJobs.includes(req.params.jobId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Job not found in saved list' 
            });
        }

        // Remove job from saved jobs
        student.savedJobs = student.savedJobs.filter(
            jobId => jobId.toString() !== req.params.jobId
        );
        await student.save();

        console.log('✅ Job removed successfully');

        res.json({ 
            success: true, 
            message: 'Job removed successfully',
            savedJobs: student.savedJobs 
        });

    } catch (error) {
        console.error('❌ Error removing saved job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error removing saved job: ' + error.message 
        });
    }
});

/**
 * @route   GET /api/students/saved-jobs/check/:jobId
 * @desc    Check if job is saved
 * @access  Private/Student
 */
router.get('/saved-jobs/check/:jobId', auth, auth.authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        
        if (!student) {
            return res.json({ success: true, isSaved: false });
        }

        const isSaved = student.savedJobs.includes(req.params.jobId);

        res.json({ 
            success: true, 
            isSaved 
        });

    } catch (error) {
        console.error('❌ Error checking saved job:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking saved job: ' + error.message 
        });
    }
});
module.exports = router;