const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Interview = require('../Models/Interview'); // Changed to lowercase 'models'
const Application = require('../models/Application'); // Changed to lowercase 'models'
const Job = require('../models/Job'); // Changed to lowercase 'models'
const User = require('../models/User'); // Changed to lowercase 'models'
const auth = require('../middleware/auth');

// POST /api/interviews - Schedule a new interview
router.post('/', auth, async (req, res) => {
  console.log('\n========================================');
  console.log('POST /api/interviews - Request received');
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
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
    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('studentId');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    console.log('Application found:', {
      id: application._id,
      jobId: application.jobId?._id,
      studentId: application.studentId?._id,
      studentName: application.studentId?.name,
      applicationStatus: application.status
    });

    // Check if student exists
    if (!application.studentId) {
      console.error('Student ID missing in application:', application._id);
      return res.status(400).json({
        success: false,
        message: 'Student information missing for this application. The application may be corrupted.'
      });
    }

    // Get student details - handle both populated and unpopulated
    let student = application.studentId;
    if (student && typeof student === 'object' && student._id) {
      student = student;
    } else if (student && typeof student === 'string') {
      student = await User.findById(student);
    }

    if (!student) {
      console.error('Student not found:', application.studentId);
      return res.status(400).json({
        success: false,
        message: 'Student not found for this application. The student account may have been deleted.'
      });
    }

    // Get job details
    let job = application.jobId;
    if (job && typeof job === 'object' && job._id) {
      job = job;
    } else if (job && typeof job === 'string') {
      job = await Job.findById(job);
    }

    if (!job) {
      return res.status(400).json({
        success: false,
        message: 'Job information missing for this application. The job may have been deleted.'
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
        message: 'An interview is already scheduled for this application',
        existingInterview: {
          id: existingInterview._id,
          date: existingInterview.scheduledDate,
          status: existingInterview.status
        }
      });
    }

    // Validate date
    const interviewDate = new Date(scheduledDate);
    if (isNaN(interviewDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use ISO format (YYYY-MM-DDTHH:mm)'
      });
    }

    const now = new Date();
    if (interviewDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Interview date must be in the future',
        currentTime: now.toISOString(),
        selectedTime: interviewDate.toISOString()
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
      interviewerName: interviewerName || req.user.name || req.user.companyName,
      interviewerEmail: interviewerEmail || req.user.email,
      notes: notes || '',
      status: 'scheduled'
    });

    await interview.save();
    console.log('✅ Interview created:', interview._id);

    // Update application status
    application.status = 'Interview';
    application.interviewDate = interviewDate;
    application.interviewDetails = {
      date: interviewDate.toISOString(),
      mode: mode || 'Online',
      link: meetingLink || '',
      address: location?.address || '',
      city: location?.city || '',
      country: location?.country || '',
      notes: notes || ''
    };
    application.updatedAt = new Date();
    await application.save();
    console.log('✅ Application updated to Interview status');

    // Return populated interview
    const populatedInterview = await Interview.findById(interview._id)
      .populate('jobId', 'title description location employmentType')
      .populate('studentId', 'name email phoneNumber')
      .populate('companyId', 'name companyName email');

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interview: populatedInterview,
      application: {
        id: application._id,
        status: application.status,
        interviewDate: application.interviewDate
      }
    });

  } catch (error) {
    console.error('❌ Error in POST /api/interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule interview',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/interviews - Get all interviews for logged in user
router.get('/', auth, async (req, res) => {
  console.log('========================================');
  console.log('GET /api/interviews - Request received');
  console.log('User:', { id: req.user?.id, role: req.user?.role });
  console.log('========================================');
  
  try {
    let query = {};
    
    if (req.user.role === 'company') {
      query.companyId = req.user.id;
      console.log('Fetching interviews for company:', req.user.id);
    } else if (req.user.role === 'student') {
      query.studentId = req.user.id;
      console.log('Fetching interviews for student:', req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const interviews = await Interview.find(query)
      .populate('jobId', 'title description location employmentType salary')
      .populate('studentId', 'name email phoneNumber')
      .populate('companyId', 'name companyName email')
      .sort({ scheduledDate: -1 });

    console.log(`Found ${interviews.length} interviews for ${req.user.role}`);

    // Process interviews to add computed fields
    const processedInterviews = interviews.map(interview => {
      const interviewObj = interview.toObject();
      interviewObj.isUpcoming = new Date(interview.scheduledDate) > new Date();
      interviewObj.isPast = new Date(interview.scheduledDate) <= new Date();
      interviewObj.relativeTime = getRelativeTime(interview.scheduledDate);
      return interviewObj;
    });

    res.json({
      success: true,
      interviews: processedInterviews,
      count: processedInterviews.length
    });

  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
});

// Helper function to get relative time
function getRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMs < 0) return 'Passed';
    if (diffMins < 60) return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } catch (e) {
    return '';
  }
}

// GET /api/interviews/:id - Get single interview by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview ID format'
      });
    }

    const interview = await Interview.findById(id)
      .populate('jobId', 'title description location employmentType salary requirements')
      .populate('studentId', 'name email phoneNumber skills experience education')
      .populate('companyId', 'name companyName email companyLogo');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check authorization
    if (interview.companyId._id.toString() !== req.user.id && 
        interview.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this interview'
      });
    }

    const interviewObj = interview.toObject();
    interviewObj.isUpcoming = new Date(interview.scheduledDate) > new Date();
    interviewObj.isPast = new Date(interview.scheduledDate) <= new Date();
    interviewObj.relativeTime = getRelativeTime(interview.scheduledDate);

    res.json({
      success: true,
      interview: interviewObj
    });

  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview',
      error: error.message
    });
  }
});

// PUT /api/interviews/:id - Update interview details (Reschedule)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview ID format'
      });
    }

    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Only company can update interview details
    if (interview.companyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the company can update interview details'
      });
    }

    // Check if interview can be updated
    if (interview.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a completed interview'
      });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a cancelled interview'
      });
    }

    const { scheduledDate, duration, mode, meetingLink, location, notes } = req.body;

    // Validate new date if provided
    if (scheduledDate) {
      const newDate = new Date(scheduledDate);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      
      if (newDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Interview date must be in the future'
        });
      }
      interview.scheduledDate = newDate;
    }
    
    // Update other fields
    if (duration) interview.duration = duration;
    if (mode) interview.mode = mode;
    if (meetingLink !== undefined) interview.meetingLink = meetingLink;
    if (location) interview.location = location;
    if (notes !== undefined) interview.notes = notes;

    interview.updatedAt = new Date();
    await interview.save();

    // Update application interview details
    const application = await Application.findById(interview.applicationId);
    if (application) {
      application.interviewDetails = {
        date: interview.scheduledDate.toISOString(),
        mode: interview.mode,
        link: interview.meetingLink,
        address: interview.location?.address,
        city: interview.location?.city,
        country: interview.location?.country,
        notes: interview.notes
      };
      await application.save();
    }

    res.json({
      success: true,
      message: 'Interview updated successfully',
      interview: {
        ...interview.toObject(),
        isUpcoming: new Date(interview.scheduledDate) > new Date(),
        relativeTime: getRelativeTime(interview.scheduledDate)
      }
    });

  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview',
      error: error.message
    });
  }
});

// PUT /api/interviews/:id/confirm - Confirm interview (Student)
router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview ID format'
      });
    }

    const interview = await Interview.findById(id);
    
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
        message: `Only scheduled interviews can be confirmed. Current status: ${interview.status}`
      });
    }

    // Check if interview date is still valid
    if (new Date(interview.scheduledDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm an interview that has already passed'
      });
    }

    interview.status = 'confirmed';
    interview.updatedAt = new Date();
    await interview.save();

    // Update application to show interview is confirmed
    const application = await Application.findById(interview.applicationId);
    if (application) {
      application.interviewDetails = {
        ...application.interviewDetails,
        confirmed: true,
        confirmedAt: new Date().toISOString()
      };
      await application.save();
    }

    res.json({
      success: true,
      message: 'Interview confirmed successfully',
      interview: {
        ...interview.toObject(),
        isUpcoming: new Date(interview.scheduledDate) > new Date(),
        relativeTime: getRelativeTime(interview.scheduledDate)
      }
    });

  } catch (error) {
    console.error('Error confirming interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm interview',
      error: error.message
    });
  }
});

// POST /api/interviews/:id/feedback - Add feedback (Company)
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview ID format'
      });
    }

    const interview = await Interview.findById(id);
    
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

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required and must be between 1 and 5'
      });
    }

    interview.feedback = {
      rating: rating,
      comments: comments || '',
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      recommendation: recommendation || 'Pending',
      providedBy: req.user.id,
      providedAt: new Date()
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
        application.status = 'Accepted';
      } else if (recommendation === 'Reject') {
        application.status = 'Rejected';
      }
      
      await application.save();
    }

    res.json({
      success: true,
      message: 'Feedback added successfully',
      interview: {
        ...interview.toObject(),
        feedback: interview.feedback
      }
    });

  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: error.message
    });
  }
});

// DELETE /api/interviews/:id - Cancel interview
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview ID format'
      });
    }

    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check authorization
    if (interview.companyId.toString() !== req.user.id && 
        interview.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this interview'
      });
    }

    // Check if interview can be cancelled
    if (interview.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed interview'
      });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Interview is already cancelled'
      });
    }

    const { reason } = req.body;
    
    interview.status = 'cancelled';
    if (reason) {
      interview.notes = `Cancelled: ${reason}\n\n${interview.notes || ''}`;
    }
    interview.updatedAt = new Date();
    await interview.save();

    // Update application status
    const application = await Application.findById(interview.applicationId);
    if (application) {
      application.status = 'Shortlisted';
      application.interviewDetails = null;
      application.interviewDate = null;
      await application.save();
    }

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      interview: {
        ...interview.toObject(),
        cancelledAt: new Date().toISOString(),
        cancelledBy: req.user.id,
        cancelledReason: reason || 'No reason provided'
      }
    });

  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel interview',
      error: error.message
    });
  }
});

// GET /api/interviews/upcoming - Get upcoming interviews
router.get('/upcoming/me', auth, async (req, res) => {
  try {
    let query = {
      scheduledDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    };
    
    if (req.user.role === 'company') {
      query.companyId = req.user.id;
    } else if (req.user.role === 'student') {
      query.studentId = req.user.id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const interviews = await Interview.find(query)
      .populate('jobId', 'title')
      .populate('companyId', 'name companyName')
      .populate('studentId', 'name email')
      .sort({ scheduledDate: 1 })
      .limit(10);

    const processedInterviews = interviews.map(interview => ({
      ...interview.toObject(),
      relativeTime: getRelativeTime(interview.scheduledDate)
    }));

    res.json({
      success: true,
      interviews: processedInterviews,
      count: processedInterviews.length
    });

  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming interviews',
      error: error.message
    });
  }
});

// GET /api/interviews/date-range - Get interviews by date range
router.get('/date-range', auth, async (req, res) => {
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
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
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
      interviews,
      count: interviews.length,
      range: { start: start.toISOString(), end: end.toISOString() }
    });

  } catch (error) {
    console.error('Error fetching interviews by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
});

module.exports = router;