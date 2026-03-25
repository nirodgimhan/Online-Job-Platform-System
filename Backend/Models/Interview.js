const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 60
  },
  mode: {
    type: String,
    enum: ['Online', 'In-person', 'Phone'],
    default: 'Online'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  location: {
    address: String,
    city: String,
    country: String
  },
  interviewerName: {
    type: String
  },
  interviewerEmail: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    strengths: [String],
    weaknesses: [String],
    recommendation: {
      type: String,
      enum: ['Hire', 'Second Interview', 'Reject', 'Pending'],
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

module.exports = mongoose.model('Interview', interviewSchema);