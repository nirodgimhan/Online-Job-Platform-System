const mongoose = require('mongoose');

// Address sub‑schema
const AddressSchema = new mongoose.Schema({
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zipCode: { type: String, default: '' }
}, { _id: false });

// Social links
const SocialLinksSchema = new mongoose.Schema({
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    twitter: { type: String, default: '' }
}, { _id: false });

// CV file info
const CvSchema = new mongoose.Schema({
    url: { type: String, default: '' },
    filename: { type: String, default: '' },
    uploadedAt: { type: Date, default: null }
}, { _id: false });

// Education
const EducationSchema = new mongoose.Schema({
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    fieldOfStudy: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    grade: { type: String, default: '' },
    description: { type: String, default: '' }
});

// Experience
const ExperienceSchema = new mongoose.Schema({
    jobTitle: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' }
});

// Skill (object, not string)
const SkillSchema = new mongoose.Schema({
    name: { type: String, required: true },
    level: { 
        type: String, 
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Intermediate'
    },
    yearsOfExperience: { type: String, default: '' }
});

// Language
const LanguageSchema = new mongoose.Schema({
    language: { type: String, required: true },
    proficiency: { 
        type: String, 
        enum: ['Basic', 'Conversational', 'Professional', 'Native'],
        default: 'Conversational'
    },
    certification: { type: String, default: '' }
});

// Certification
const CertificationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    issuingOrganization: { type: String, required: true },
    issueDate: { type: String, default: '' },
    expirationDate: { type: String, default: '' },
    credentialId: { type: String, default: '' },
    credentialUrl: { type: String, default: '' }
});

// Project
const ProjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    url: { type: String, default: '' },
    technologies: [{ type: String }],
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false }
});

// Achievement
const AchievementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: String, default: '' },
    organization: { type: String, default: '' },
    type: { 
        type: String, 
        enum: ['award', 'honor', 'recognition'],
        default: 'award'
    }
});

// Main Student Schema
const StudentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    summary: { type: String, default: '' },
    profilePhoto: { type: String, default: null },
    coverPhoto: { type: String, default: null },
    phoneNumber: { type: String, default: '' },
    address: { type: AddressSchema, default: () => ({}) },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    cv: { type: CvSchema, default: () => ({}) },
    portfolio: { type: String, default: '' },

    // Arrays
    education: [EducationSchema],
    experience: [ExperienceSchema],
    skills: [SkillSchema],                 // <-- objects, not strings
    languages: [LanguageSchema],
    certifications: [CertificationSchema],
    projects: [ProjectSchema],             // <-- new
    achievements: [AchievementSchema],     // <-- new

    // Existing fields (kept for compatibility)
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    appliedJobs: [{
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        appliedAt: { type: Date, default: Date.now },
        status: { 
            type: String, 
            enum: ['pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'],
            default: 'pending'
        }
    }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    profileViews: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
}, { 
    timestamps: true 
});

module.exports = mongoose.models.Student || mongoose.model('Student', StudentSchema);