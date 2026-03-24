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
        mode: {
            type: String,
            enum: ['Online', 'In-person']
        },
        link: String,
        address: String,
        time: String,
        notes: String
    },
    coverLetter: String,
    resume: {
        filename: String,
        path: String
    },
    additionalDocuments: [{
        name: String,
        filename: String,
        path: String
    }],
    aiScore: {
        type: Number,
        min: 0,
        max: 100
    },
    aiAnalysis: {
        skillsMatch: Number,
        experienceMatch: Number,
        educationMatch: Number,
        overallFit: Number,
        suggestions: [String]
    },
    notes: [{
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    feedback: {
        rating: Number,
        comments: String,
        providedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        providedDate: Date
    },
    offerLetter: {
        filename: String,
        path: String,
        sentDate: Date,
        acceptedDate: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Application', ApplicationSchema);