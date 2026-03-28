const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application ID is required']
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  duration: {
    type: Number,
    default: 60,
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 480 minutes (8 hours)']
  },
  mode: {
    type: String,
    enum: {
      values: ['Online', 'In-person', 'Phone'],
      message: 'Mode must be Online, In-person, or Phone'
    },
    default: 'Online'
  },
  meetingLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Basic URL validation for meeting links
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid URL for the meeting link'
    },
    maxlength: [500, 'Meeting link cannot exceed 500 characters']
  },
  location: {
    address: {
      type: String,
      trim: true,
      maxlength: [255, 'Address cannot exceed 255 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters']
    }
  },
  interviewerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Interviewer name cannot exceed 100 characters']
  },
  interviewerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    },
    maxlength: [100, 'Email cannot exceed 100 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'confirmed', 'completed', 'cancelled'],
      message: 'Status must be scheduled, confirmed, completed, or cancelled'
    },
    default: 'scheduled'
  },
  feedback: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Feedback comments cannot exceed 1000 characters']
    },
    strengths: [{
      type: String,
      trim: true,
      maxlength: [255, 'Each strength cannot exceed 255 characters']
    }],
    weaknesses: [{
      type: String,
      trim: true,
      maxlength: [255, 'Each weakness cannot exceed 255 characters']
    }],
    recommendation: {
      type: String,
      enum: {
        values: ['Hire', 'Second Interview', 'Reject', 'Pending'],
        message: 'Recommendation must be Hire, Second Interview, Reject, or Pending'
      },
      default: 'Pending'
    },
    providedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    providedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
interviewSchema.index({ applicationId: 1 });
interviewSchema.index({ companyId: 1 });
interviewSchema.index({ studentId: 1 });
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ studentId: 1, status: 1 });
interviewSchema.index({ companyId: 1, scheduledDate: -1 });

// Virtual for checking if interview is upcoming
interviewSchema.virtual('isUpcoming').get(function() {
  return this.scheduledDate > new Date();
});

// Virtual for checking if interview is past
interviewSchema.virtual('isPast').get(function() {
  return this.scheduledDate < new Date();
});

// Virtual for formatted date
interviewSchema.virtual('formattedDate').get(function() {
  if (!this.scheduledDate) return 'N/A';
  return this.scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for relative time
interviewSchema.virtual('relativeTime').get(function() {
  if (!this.scheduledDate) return '';
  const now = new Date();
  const diffMs = this.scheduledDate - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMs < 0) return 'Passed';
  if (diffMins < 60) return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
});

// Virtual for student name
interviewSchema.virtual('studentName').get(function() {
  return this.studentId?.name || 'Student';
});

// Virtual for company name
interviewSchema.virtual('companyName').get(function() {
  return this.companyId?.companyName || this.companyId?.name || 'Company';
});

// Virtual for job title
interviewSchema.virtual('jobTitle').get(function() {
  return this.jobId?.title || 'Position';
});

// Method to confirm interview
interviewSchema.methods.confirm = async function() {
  if (this.status !== 'scheduled') {
    throw new Error('Only scheduled interviews can be confirmed');
  }
  if (this.scheduledDate <= new Date()) {
    throw new Error('Cannot confirm an interview that has already passed');
  }
  this.status = 'confirmed';
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Method to cancel interview
interviewSchema.methods.cancel = async function(reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed interview');
  }
  if (this.status === 'cancelled') {
    throw new Error('Interview is already cancelled');
  }
  this.status = 'cancelled';
  if (reason) {
    this.notes = `Cancelled: ${reason}\n\n${this.notes || ''}`;
  }
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Method to complete interview
interviewSchema.methods.complete = async function() {
  if (this.status === 'cancelled') {
    throw new Error('Cannot complete a cancelled interview');
  }
  this.status = 'completed';
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Method to add feedback
interviewSchema.methods.addFeedback = async function(feedbackData) {
  if (this.status !== 'completed') {
    this.status = 'completed';
  }
  this.feedback = {
    rating: feedbackData.rating,
    comments: feedbackData.comments,
    strengths: feedbackData.strengths || [],
    weaknesses: feedbackData.weaknesses || [],
    recommendation: feedbackData.recommendation || 'Pending',
    providedBy: feedbackData.providedBy,
    providedAt: new Date()
  };
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Method to reschedule interview
interviewSchema.methods.reschedule = async function(newDate) {
  const newScheduledDate = new Date(newDate);
  if (isNaN(newScheduledDate.getTime())) {
    throw new Error('Invalid date format');
  }
  if (newScheduledDate <= new Date()) {
    throw new Error('New interview date must be in the future');
  }
  if (this.status === 'completed') {
    throw new Error('Cannot reschedule a completed interview');
  }
  if (this.status === 'cancelled') {
    throw new Error('Cannot reschedule a cancelled interview');
  }
  this.scheduledDate = newScheduledDate;
  this.status = 'scheduled'; // Reset to scheduled after rescheduling
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Static method to get interviews for a student
interviewSchema.statics.getStudentInterviews = async function(studentId) {
  return await this.find({ studentId })
    .populate('jobId', 'title description location employmentType')
    .populate('companyId', 'name companyName email')
    .populate('applicationId', 'status appliedDate')
    .sort({ scheduledDate: -1 });
};

// Static method to get upcoming interviews for a student
interviewSchema.statics.getUpcomingStudentInterviews = async function(studentId) {
  return await this.find({
    studentId,
    scheduledDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('jobId', 'title')
    .populate('companyId', 'name companyName')
    .sort({ scheduledDate: 1 });
};

// Static method to get interviews for a company
interviewSchema.statics.getCompanyInterviews = async function(companyId) {
  return await this.find({ companyId })
    .populate('jobId', 'title')
    .populate('studentId', 'name email')
    .populate('applicationId', 'status')
    .sort({ scheduledDate: -1 });
};

// Static method to get interviews by date range
interviewSchema.statics.getInterviewsByDateRange = async function(startDate, endDate, userId, userRole) {
  let query = {
    scheduledDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (userRole === 'student') {
    query.studentId = userId;
  } else if (userRole === 'company') {
    query.companyId = userId;
  }
  
  return await this.find(query)
    .populate('jobId', 'title')
    .populate('studentId', 'name')
    .populate('companyId', 'name')
    .sort({ scheduledDate: 1 });
};

// Pre-save middleware
interviewSchema.pre('save', function(next) {
  // Ensure scheduledDate is a Date object
  if (this.scheduledDate && typeof this.scheduledDate === 'string') {
    this.scheduledDate = new Date(this.scheduledDate);
  }
  
  // Validate scheduledDate for new interviews
  if (this.isNew && this.scheduledDate && this.scheduledDate <= new Date()) {
    next(new Error('Interview date must be in the future'));
  }
  
  next();
});

// Pre-update middleware to validate date changes
interviewSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.scheduledDate) {
    const newDate = new Date(update.scheduledDate);
    if (isNaN(newDate.getTime())) {
      next(new Error('Invalid date format'));
    }
    if (newDate <= new Date()) {
      next(new Error('Interview date must be in the future'));
    }
  }
  next();
});

// To JSON transform to include virtuals
interviewSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});
interviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);