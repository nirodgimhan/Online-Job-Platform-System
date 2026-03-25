const mongoose = require('mongoose');
const Interview = require('../Models/Interview');
const Application = require('../Models/Application');

// @desc    Schedule a new interview
// @route   POST /api/interviews
// @access  Private (Company only)
const scheduleInterview = async (req, res) => {
  console.log('\n========================================');
  console.log('✅ scheduleInterview - Request received');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('User:', { id: req.user?.id, role: req.user?.role });
  console.log('========================================\n');
  
  try {
    const {
      applicationId,
      scheduledDate,
      duration,
      mode,
      meetingLink,
      location,
      interviewerName,
      interviewerEmail,
      notes
    } = req.body;

    // Validate required fields
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date is required'
      });
    }

    // Check user authorization
    if (!req.user || req.user.role !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Only companies can schedule interviews'
      });
    }

    // Get application with populated fields
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get models
    const Job = mongoose.model('Job');
    const User = mongoose.model('User');
    
    // Get job details
    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(400).json({
        success: false,
        message: 'Job information missing for this application'
      });
    }

    // Get student details
    const student = await User.findById(application.studentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student information missing for this application'
      });
    }

    // Check if interview already exists
    const existingInterview = await Interview.findOne({
      applicationId: application._id,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (existingInterview) {
      return res.status(400).json({
        success: false,
        message: 'An interview is already scheduled for this application'
      });
    }

    // Validate date
    const interviewDate = new Date(scheduledDate);
    if (isNaN(interviewDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (interviewDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Interview date must be in the future'
      });
    }

    // Create interview
    const interview = new Interview({
      applicationId: application._id,
      jobId: job._id,
      companyId: req.user.id,
      studentId: student._id,
      scheduledDate: interviewDate,
      duration: duration || 60,
      mode: mode || 'Online',
      meetingLink: meetingLink || '',
      location: location || {},
      interviewerName: interviewerName || req.user.name,
      interviewerEmail: interviewerEmail || req.user.email,
      notes: notes || '',
      status: 'scheduled'
    });

    await interview.save();
    console.log('✅ Interview created:', interview._id);

    // Update application status
    application.status = 'interview';
    application.interviewDate = interviewDate;
    application.interviewDetails = {
      mode: mode || 'Online',
      link: meetingLink || '',
      address: location?.address || '',
      city: location?.city || '',
      country: location?.country || '',
      time: interviewDate.toISOString(),
      notes: notes || ''
    };
    application.updatedAt = new Date();
    await application.save();

    // Return populated interview
    const populatedInterview = await Interview.findById(interview._id)
      .populate('jobId', 'title')
      .populate('studentId', 'name email')
      .populate('companyId', 'name companyName');

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interview: populatedInterview
    });

  } catch (error) {
    console.error('❌ Error in scheduleInterview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule interview',
      error: error.message
    });
  }
};

// @desc    Get all interviews for logged in user
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res) => {
  console.log('✅ getInterviews - Request received');
  
  try {
    let query = {};
    
    if (req.user.role === 'company') {
      query.companyId = req.user.id;
    } else if (req.user.role === 'student') {
      query.studentId = req.user.id;
    }

    const interviews = await Interview.find(query)
      .populate('jobId', 'title location')
      .populate('studentId', 'name email phoneNumber')
      .populate('companyId', 'name companyName')
      .sort({ scheduledDate: -1 });

    console.log(`Found ${interviews.length} interviews`);

    res.json({
      success: true,
      interviews: interviews || []
    });

  } catch (error) {
    console.error('Error in getInterviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
};

// @desc    Get single interview by ID
// @route   GET /api/interviews/:id
// @access  Private
const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('jobId', 'title')
      .populate('studentId', 'name email')
      .populate('companyId', 'name companyName');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.json({
      success: true,
      interview
    });

  } catch (error) {
    console.error('Error in getInterviewById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview',
      error: error.message
    });
  }
};

// @desc    Update interview (reschedule)
// @route   PUT /api/interviews/:id
// @access  Private (Company only)
const updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Only company can update
    if (interview.companyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the company can update interview details'
      });
    }

    const { scheduledDate, duration, mode, meetingLink, location, notes } = req.body;

    if (scheduledDate) {
      const newDate = new Date(scheduledDate);
      if (newDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Interview date must be in the future'
        });
      }
      interview.scheduledDate = newDate;
    }
    
    if (duration) interview.duration = duration;
    if (mode) interview.mode = mode;
    if (meetingLink !== undefined) interview.meetingLink = meetingLink;
    if (location) interview.location = location;
    if (notes !== undefined) interview.notes = notes;

    interview.updatedAt = new Date();
    await interview.save();

    res.json({
      success: true,
      message: 'Interview updated successfully',
      interview
    });

  } catch (error) {
    console.error('Error in updateInterview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview',
      error: error.message
    });
  }
};

// @desc    Confirm interview (Student)
// @route   PUT /api/interviews/:id/confirm
// @access  Private (Student only)
const confirmInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Only student can confirm
    if (interview.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the student can confirm this interview'
      });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled interviews can be confirmed'
      });
    }

    interview.status = 'confirmed';
    interview.updatedAt = new Date();
    await interview.save();

    res.json({
      success: true,
      message: 'Interview confirmed successfully',
      interview
    });

  } catch (error) {
    console.error('Error in confirmInterview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm interview',
      error: error.message
    });
  }
};

// @desc    Add feedback for interview (Company)
// @route   POST /api/interviews/:id/feedback
// @access  Private (Company only)
const addFeedback = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Only company can add feedback
    if (interview.companyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the company can add feedback'
      });
    }

    const { rating, comments, strengths, weaknesses, recommendation } = req.body;

    interview.feedback = {
      rating: rating || 3,
      comments: comments || '',
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      recommendation: recommendation || 'Pending'
    };

    interview.status = 'completed';
    interview.updatedAt = new Date();
    await interview.save();

    // Update application with feedback
    const application = await Application.findById(interview.applicationId);
    if (application) {
      application.feedback = {
        rating: rating,
        comments: comments,
        providedBy: req.user.id,
        providedDate: new Date()
      };
      
      if (recommendation === 'Hire') {
        application.status = 'accepted';
      } else if (recommendation === 'Reject') {
        application.status = 'rejected';
      }
      
      await application.save();
    }

    res.json({
      success: true,
      message: 'Feedback added successfully',
      interview
    });

  } catch (error) {
    console.error('Error in addFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: error.message
    });
  }
};

// @desc    Cancel interview
// @route   DELETE /api/interviews/:id
// @access  Private (Company or Student)
const cancelInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Company or student can cancel
    if (interview.companyId.toString() !== req.user.id && 
        interview.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this interview'
      });
    }

    const { reason } = req.body;
    
    interview.status = 'cancelled';
    if (reason) {
      interview.notes = `Cancelled: ${reason}\n\n${interview.notes || ''}`;
    }
    interview.updatedAt = new Date();
    await interview.save();

    res.json({
      success: true,
      message: 'Interview cancelled successfully'
    });

  } catch (error) {
    console.error('Error in cancelInterview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel interview',
      error: error.message
    });
  }
};

// @desc    Get upcoming interviews
// @route   GET /api/interviews/upcoming
// @access  Private
const getUpcomingInterviews = async (req, res) => {
  try {
    let query = {
      scheduledDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    };
    
    if (req.user.role === 'company') {
      query.companyId = req.user.id;
    } else if (req.user.role === 'student') {
      query.studentId = req.user.id;
    }

    const interviews = await Interview.find(query)
      .populate('jobId', 'title')
      .populate('companyId', 'name companyName')
      .populate('studentId', 'name email')
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.json({
      success: true,
      interviews
    });

  } catch (error) {
    console.error('Error in getUpcomingInterviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming interviews',
      error: error.message
    });
  }
};

// @desc    Get interviews by date range
// @route   GET /api/interviews/date-range
// @access  Private
const getInterviewsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let query = {
      scheduledDate: {
        $gte: start,
        $lte: end
      }
    };
    
    if (req.user.role === 'company') {
      query.companyId = req.user.id;
    } else if (req.user.role === 'student') {
      query.studentId = req.user.id;
    }

    const interviews = await Interview.find(query)
      .populate('jobId', 'title')
      .populate('studentId', 'name')
      .populate('companyId', 'name')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      interviews
    });

  } catch (error) {
    console.error('Error in getInterviewsByDateRange:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
};

module.exports = {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  confirmInterview,
  addFeedback,
  cancelInterview,
  getUpcomingInterviews,
  getInterviewsByDateRange
};