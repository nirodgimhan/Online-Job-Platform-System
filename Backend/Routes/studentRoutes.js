const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Student = require('../Models/Student');
const User = require('../models/User');
const Job = require('../models/Job');

// Models used in feed/follow routes (adjust paths if needed)
const Post = require('../models/Post');        // if you have a Post model
const Company = require('../models/Company');  // if you have a Company model

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const cvDir = path.join(uploadDir, 'cvs');
if (!fs.existsSync(cvDir)) {
  fs.mkdirSync(cvDir, { recursive: true });
}

// Multer config for images (profile/cover)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// Multer config for CV (PDF/DOC/DOCX)
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, cvDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const cvFileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only PDF, DOC, DOCX files are allowed'));
};
const cvUpload = multer({ storage: cvStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: cvFileFilter });

// ==================== PROFILE ROUTES ====================

// @route   GET api/students/profile
// @desc    Get current student profile
// @access  Private/Student
router.get('/profile', auth, auth.authorize('student'), async (req, res) => {
  try {
    let student = await Student.findOne({ userId: req.user.id })
      .populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture'])
      .populate('savedJobs')
      .populate('appliedJobs.jobId');
    if (!student) {
      student = new Student({ userId: req.user.id });
      await student.save();
      student = await Student.findById(student._id).populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture']);
    }
    const studentData = student.toObject();
    if (student.userId) {
      studentData.name = student.userId.name;
      studentData.email = student.userId.email;
      studentData.phoneNumber = student.userId.phoneNumber;
      studentData.profilePicture = student.userId.profilePicture;
    }
    res.json({ success: true, student: studentData });
  } catch (error) {
    console.error('Error fetching student profile:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// @route   POST api/students/profile
// @desc    Create or update student profile (full fields)
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
      socialLinks,
      phoneNumber,
      address,
      cv,
      projects,
      achievements
    } = req.body;

    const updateData = {};
    if (summary !== undefined) updateData.summary = summary;
    if (education !== undefined) updateData.education = education;
    if (experience !== undefined) updateData.experience = experience;
    if (skills !== undefined) updateData.skills = skills;
    if (languages !== undefined) updateData.languages = languages;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (jobPreferences !== undefined) updateData.jobPreferences = jobPreferences;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;
    if (cv !== undefined) updateData.cv = cv;
    if (projects !== undefined) updateData.projects = projects;
    if (achievements !== undefined) updateData.achievements = achievements;
    updateData.lastActive = Date.now();

    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).populate('userId', ['name', 'email', 'phoneNumber', 'profilePicture']);

    if (phoneNumber !== undefined) {
      await User.findByIdAndUpdate(req.user.id, { phoneNumber });
    }
    await User.findByIdAndUpdate(req.user.id, { lastActive: Date.now() });

    const studentData = student.toObject();
    if (student.userId) {
      studentData.name = student.userId.name;
      studentData.email = student.userId.email;
      studentData.phoneNumber = student.userId.phoneNumber;
      studentData.profilePicture = student.userId.profilePicture;
    }
    res.json({ success: true, student: studentData });
  } catch (error) {
    console.error('Error updating student profile:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// @route   POST api/students/profile/photo
// @desc    Upload profile photo
// @access  Private/Student
router.post('/profile/photo', auth, auth.authorize('student'), upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Delete old profile picture if exists
    const user = await User.findById(req.user.id);
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '..', user.profilePicture.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Save new file
    const photoUrl = `/uploads/${req.file.filename}`;

    // Update both User and Student models
    await User.findByIdAndUpdate(req.user.id, { profilePicture: photoUrl });
    await Student.findOneAndUpdate(
      { userId: req.user.id },
      { profilePhoto: photoUrl, lastActive: Date.now() },
      { new: true, upsert: true }
    );

    res.json({ success: true, profilePicture: photoUrl });
  } catch (error) {
    console.error('Error uploading profile photo:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST api/students/profile/cover
// @desc    Upload cover photo
// @access  Private/Student
router.post('/profile/cover', auth, auth.authorize('student'), upload.single('coverPhoto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const photoUrl = `/uploads/${req.file.filename}`;
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { coverPhoto: photoUrl, lastActive: Date.now() },
      { new: true, upsert: true }
    );
    res.json({ success: true, coverPhoto: photoUrl, student });
  } catch (error) {
    console.error('Error uploading cover photo:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST api/students/cv/upload
// @desc    Upload CV file
// @access  Private/Student
router.post('/cv/upload', auth, auth.authorize('student'), cvUpload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const cvData = {
      url: `/uploads/cvs/${req.file.filename}`,
      filename: req.file.originalname,
      uploadedAt: new Date()
    };
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { cv: cvData, lastActive: Date.now() },
      { new: true, upsert: true }
    );
    res.json({ success: true, cv: cvData, student });
  } catch (error) {
    console.error('Error uploading CV:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE api/students/cv
// @desc    Delete CV file
// @access  Private/Student
router.delete('/cv', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.cv && student.cv.url) {
      const cvPath = path.join(__dirname, '..', student.cv.url);
      if (fs.existsSync(cvPath)) fs.unlinkSync(cvPath);
    }
    student.cv = { url: '', filename: '', uploadedAt: null };
    await student.save();
    res.json({ success: true, message: 'CV deleted successfully' });
  } catch (error) {
    console.error('Error deleting CV:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==================== SAVED JOBS ====================
router.get('/saved-jobs', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate({ path: 'savedJobs', populate: { path: 'companyId', select: 'companyName companyLogo industry location' } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const savedJobsWithDate = student.savedJobs.map(job => ({ ...job.toObject(), savedAt: job.savedAt || new Date() }));
    res.json({ success: true, savedJobs: savedJobsWithDate, total: savedJobsWithDate.length });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ success: false, message: 'Error fetching saved jobs: ' + error.message });
  }
});

router.post('/saved-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    let student = await Student.findOne({ userId: req.user.id });
    if (!student) student = new Student({ userId: req.user.id, savedJobs: [] });
    if (student.savedJobs.includes(req.params.jobId)) return res.status(400).json({ success: false, message: 'Job already saved' });
    student.savedJobs.push(req.params.jobId);
    await student.save();
    res.json({ success: true, message: 'Job saved successfully', savedJobs: student.savedJobs });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({ success: false, message: 'Error saving job: ' + error.message });
  }
});

router.delete('/saved-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    if (!student.savedJobs.includes(req.params.jobId)) return res.status(400).json({ success: false, message: 'Job not found in saved list' });
    student.savedJobs = student.savedJobs.filter(id => id.toString() !== req.params.jobId);
    await student.save();
    res.json({ success: true, message: 'Job removed successfully', savedJobs: student.savedJobs });
  } catch (error) {
    console.error('Error removing saved job:', error);
    res.status(500).json({ success: false, message: 'Error removing saved job: ' + error.message });
  }
});

router.get('/saved-jobs/check/:jobId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const isSaved = student ? student.savedJobs.includes(req.params.jobId) : false;
    res.json({ success: true, isSaved });
  } catch (error) {
    console.error('Error checking saved job:', error);
    res.status(500).json({ success: false, message: 'Error checking saved job: ' + error.message });
  }
});

// ==================== APPLIED JOBS ====================
router.get('/applied-jobs', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate({ path: 'appliedJobs.jobId', populate: { path: 'company', select: 'name logo location' } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    res.json({ success: true, appliedJobs: student.appliedJobs });
  } catch (error) {
    console.error('Error fetching applied jobs:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

router.post('/applied-jobs/:jobId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    if (student.appliedJobs.some(j => j.jobId.toString() === req.params.jobId)) {
      return res.status(400).json({ success: false, message: 'Already applied for this job' });
    }
    student.appliedJobs.push({ jobId: req.params.jobId, appliedAt: Date.now(), status: 'pending' });
    await student.save();
    res.json({ success: true, appliedJobs: student.appliedJobs });
  } catch (error) {
    console.error('Error applying for job:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// ==================== FOLLOW & CONNECTIONS ====================
router.get('/following', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('following', 'name email profilePicture');
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    res.json({ success: true, following: student.following });
  } catch (error) {
    console.error('Error fetching following:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

router.post('/follow/:userId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const targetStudent = await Student.findOne({ userId: req.params.userId });
    if (!student || !targetStudent) return res.status(404).json({ success: false, message: 'Student profile not found' });
    if (student.following.includes(req.params.userId)) return res.status(400).json({ success: false, message: 'Already following this user' });
    student.following.push(req.params.userId);
    await student.save();
    targetStudent.followers.push(req.user.id);
    await targetStudent.save();
    res.json({ success: true, message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

router.delete('/follow/:userId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const targetStudent = await Student.findOne({ userId: req.params.userId });
    if (!student || !targetStudent) return res.status(404).json({ success: false, message: 'Student profile not found' });
    student.following = student.following.filter(id => id.toString() !== req.params.userId);
    await student.save();
    targetStudent.followers = targetStudent.followers.filter(id => id.toString() !== req.user.id);
    await targetStudent.save();
    res.json({ success: true, message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

router.get('/connections/count', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const count = student ? student.followers.length + student.following.length : 0;
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching connections count:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// ==================== FEED & POSTS ====================
router.get('/feed', auth, auth.authorize('student'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const followingIds = student.following.map(f => f.userId);
    const posts = await Post.find({
      $or: [
        { userId: req.user.id },
        { userId: { $in: followingIds }, visibility: { $in: ['public', 'followers'] } }
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
        { userId: { $in: followingIds }, visibility: { $in: ['public', 'followers'] } }
      ],
      isArchived: false,
      isReported: false
    });
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.some(like => like.userId.toString() === req.user.id);
      return postObj;
    });
    res.json({
      success: true,
      posts: postsWithLikeStatus,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching student feed:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// ==================== FOLLOWING COMPANIES ====================
router.post('/follow-company/:companyId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const company = await Company.findOne({ userId: req.params.companyId });
    if (!student || !company) return res.status(404).json({ success: false, message: 'User not found' });
    if (student.following.some(f => f.userId.toString() === req.params.companyId)) {
      return res.status(400).json({ success: false, message: 'Already following this company' });
    }
    await student.follow(req.params.companyId, 'company');
    await company.addFollower(req.user.id, 'student');
    await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(req.params.companyId, { $inc: { followersCount: 1 } });
    res.json({ success: true, message: 'Successfully following company', followingCount: student.followingCount });
  } catch (error) {
    console.error('Error following company:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

router.delete('/follow-company/:companyId', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const company = await Company.findOne({ userId: req.params.companyId });
    if (!student || !company) return res.status(404).json({ success: false, message: 'User not found' });
    await student.unfollow(req.params.companyId);
    await company.removeFollower(req.user.id);
    await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(req.params.companyId, { $inc: { followersCount: -1 } });
    res.json({ success: true, message: 'Successfully unfollowed company', followingCount: student.followingCount });
  } catch (error) {
    console.error('Error unfollowing company:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

router.get('/following/companies', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate({
      path: 'following.userId',
      model: 'User',
      select: 'name profilePicture'
    });
    const companies = await Promise.all(
      student.following
        .filter(f => f.userType === 'company')
        .map(async (follow) => {
          const company = await Company.findOne({ userId: follow.userId._id })
            .select('companyName industry companyLogo description');
          return { ...follow.toObject(), companyDetails: company };
        })
    );
    res.json({ success: true, following: companies, count: companies.length });
  } catch (error) {
    console.error('Error fetching followed companies:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// ==================== FOLLOWERS ====================
router.get('/followers', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate({ path: 'followers.userId', model: 'User', select: 'name profilePicture role' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const followers = await Promise.all(
      student.followers.map(async (follower) => {
        const followerData = { ...follower.toObject(), user: follower.userId };
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
    res.json({ success: true, followers, count: student.followersCount });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// ==================== SEARCH COMPANIES ====================
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
    if (industry) query.industry = { $regex: industry, $options: 'i' };
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
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error searching companies:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// ==================== STATS ====================
router.get('/stats', auth, auth.authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const savedJobsCount = student.savedJobs.length;
    const appliedJobsCount = student.appliedJobs.length;
    const pendingApplications = student.appliedJobs.filter(j => j.status === 'pending').length;
    const interviewsCount = student.appliedJobs.filter(j => j.status === 'interview').length;
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
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

// ==================== PROFILE VIEWS ====================
router.post('/profile/view', auth, async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { profileViews: 1 } },
      { new: true }
    );
    res.json({ success: true, views: student?.profileViews || 0 });
  } catch (error) {
    console.error('Error incrementing profile views:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
});

module.exports = router;