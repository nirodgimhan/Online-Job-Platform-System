const mongoose = require('mongoose');

// Student Schema - Simplified version for now
const StudentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    summary: { 
        type: String, 
        default: '' 
    },
    profilePhoto: { 
        type: String, 
        default: null 
    },
    coverPhoto: { 
        type: String, 
        default: null 
    },
    education: [{
        degree: String,
        institution: String,
        fieldOfStudy: String,
        startDate: String,
        endDate: String,
        grade: String
    }],
    experience: [{
        jobTitle: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        current: { type: Boolean, default: false },
        description: String
    }],
    skills: [String],
    languages: [{
        language: String,
        proficiency: { 
            type: String, 
            enum: ['Basic', 'Conversational', 'Professional', 'Native'],
            default: 'Conversational'
        }
    }],
    certifications: [{
        name: String,
        issuingOrganization: String,
        issueDate: String,
        credentialId: String
    }],
    portfolio: String,
    savedJobs: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Job' 
    }],
    appliedJobs: [{
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        appliedAt: { type: Date, default: Date.now },
        status: { 
            type: String, 
            enum: ['pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'],
            default: 'pending'
        }
    }],
    followers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    following: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    profileViews: { 
        type: Number, 
        default: 0 
    },
    lastActive: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.models.Student || mongoose.model('Student', StudentSchema);