const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Shortlisted', 'Interview', 'Offered', 'Accepted', 'Rejected', 'Withdrawn'],
        default: 'Pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    reviewedDate: Date,
    interviewDate: Date,
    interviewDetails: {
        date: { type: Date },
        mode: { type: String, enum: ['Online', 'In-person', 'Phone'] },
        link: String,
        address: String,
        city: String,
        country: String,
        time: String,
        notes: String
    },
    coverLetter: { 
        type: String, 
        default: '' 
    },
    resume: {
        filename: String,
        path: String,
        fileSize: Number,
        cvId: { type: mongoose.Schema.Types.ObjectId, ref: 'CV' }
    },
    additionalDocuments: [{
        name: String,
        filename: String,
        path: String,
        fileSize: Number
    }],
    aiScore: { 
        type: Number, 
        min: 0, 
        max: 100, 
        default: 0 
    },
    aiAnalysis: {
        skillsMatch: Number,
        experienceMatch: Number,
        educationMatch: Number,
        overallFit: Number,
        suggestions: [String],
        atsCompatibility: Number
    },
    notes: [{
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        date: { type: Date, default: Date.now }
    }],
    feedback: {
        rating: Number,
        comments: String,
        providedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        providedDate: Date
    },
    offerLetter: {
        filename: String,
        path: String,
        sentDate: Date,
        acceptedDate: Date
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
ApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
ApplicationSchema.index({ companyId: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ appliedDate: -1 });

// Virtual for student details
ApplicationSchema.virtual('studentDetails', {
    ref: 'User',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true
});

// Virtual for company details
ApplicationSchema.virtual('companyDetails', {
    ref: 'User',
    localField: 'companyId',
    foreignField: '_id',
    justOne: true
});

// Method to update application status
ApplicationSchema.methods.updateStatus = async function(newStatus) {
    this.status = newStatus;
    this.updatedAt = Date.now();
    
    if (newStatus === 'Reviewed') {
        this.reviewedDate = Date.now();
    }
    
    await this.save();
    return this;
};

// Method to add interview details
ApplicationSchema.methods.addInterviewDetails = async function(interviewData) {
    this.status = 'Interview';
    this.interviewDate = interviewData.scheduledDate;
    this.interviewDetails = {
        date: interviewData.scheduledDate,
        mode: interviewData.mode,
        link: interviewData.meetingLink,
        address: interviewData.location?.address,
        city: interviewData.location?.city,
        country: interviewData.location?.country,
        time: interviewData.scheduledDate,
        notes: interviewData.notes
    };
    this.updatedAt = Date.now();
    await this.save();
    return this;
};

// Method to add feedback
ApplicationSchema.methods.addFeedback = async function(feedbackData) {
    this.feedback = {
        rating: feedbackData.rating,
        comments: feedbackData.comments,
        providedBy: feedbackData.providedBy,
        providedDate: Date.now()
    };
    
    if (feedbackData.recommendation === 'Hire') {
        this.status = 'Accepted';
    } else if (feedbackData.recommendation === 'Reject') {
        this.status = 'Rejected';
    }
    
    this.updatedAt = Date.now();
    await this.save();
    return this;
};

// ========== FIX: REMOVE VALIDATION PRE-SAVE HOOK ==========
// The following pre-save hook caused the "Student not found" error.
// It is now disabled because the route already validates existence.
// If you still want to keep a pre-save hook, comment it out or modify it to only update timestamps.

// ApplicationSchema.pre('save', async function(next) {
//     try {
//         this.updatedAt = Date.now();
//         if (this.isNew) {
//             const User = mongoose.model('User');
//             const Job = mongoose.model('Job');
//             
//             const student = await User.findById(this.studentId);
//             if (!student) {
//                 throw new Error(`Student not found with ID: ${this.studentId}`);
//             }
//             
//             const job = await Job.findById(this.jobId);
//             if (!job) {
//                 throw new Error(`Job not found with ID: ${this.jobId}`);
//             }
//             
//             const company = await User.findById(this.companyId);
//             if (!company) {
//                 throw new Error(`Company not found with ID: ${this.companyId}`);
//             }
//         }
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// Optional: Keep a simple pre-save to update timestamps
ApplicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);