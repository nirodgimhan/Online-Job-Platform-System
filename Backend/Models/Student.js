const mongoose = require('mongoose');

// Address sub‑schema
const AddressSchema = new mongoose.Schema({
    street: { type: String, trim: true, maxlength: [200, 'Street cannot exceed 200 characters'], default: '' },
    city: { type: String, trim: true, maxlength: [100, 'City cannot exceed 100 characters'], default: '' },
    state: { type: String, trim: true, maxlength: [100, 'State cannot exceed 100 characters'], default: '' },
    country: { type: String, trim: true, maxlength: [100, 'Country cannot exceed 100 characters'], default: '' },
    zipCode: { type: String, trim: true, maxlength: [20, 'Zip code cannot exceed 20 characters'], default: '' }
}, { _id: false });

// Social links
const SocialLinksSchema = new mongoose.Schema({
    linkedin: { type: String, trim: true, maxlength: [255, 'LinkedIn URL cannot exceed 255 characters'], default: '' },
    github: { type: String, trim: true, maxlength: [255, 'GitHub URL cannot exceed 255 characters'], default: '' },
    portfolio: { type: String, trim: true, maxlength: [255, 'Portfolio URL cannot exceed 255 characters'], default: '' },
    twitter: { type: String, trim: true, maxlength: [255, 'Twitter URL cannot exceed 255 characters'], default: '' }
}, { _id: false });

// CV file info
const CvSchema = new mongoose.Schema({
    url: { type: String, trim: true, maxlength: [500, 'CV URL cannot exceed 500 characters'], default: '' },
    filename: { type: String, trim: true, maxlength: [255, 'Filename cannot exceed 255 characters'], default: '' },
    uploadedAt: { type: Date, default: null }
}, { _id: false });

// Education
const EducationSchema = new mongoose.Schema({
    degree: { type: String, trim: true, maxlength: [100, 'Degree cannot exceed 100 characters'], default: '' },
    institution: { type: String, trim: true, maxlength: [200, 'Institution cannot exceed 200 characters'], default: '' },
    fieldOfStudy: { type: String, trim: true, maxlength: [100, 'Field of study cannot exceed 100 characters'], default: '' },
    startDate: { type: String, trim: true, maxlength: [10, 'Start date cannot exceed 10 characters'], default: '' },
    endDate: { type: String, trim: true, maxlength: [10, 'End date cannot exceed 10 characters'], default: '' },
    grade: { type: String, trim: true, maxlength: [20, 'Grade cannot exceed 20 characters'], default: '' },
    description: { type: String, trim: true, maxlength: [500, 'Description cannot exceed 500 characters'], default: '' }
});

// Experience
const ExperienceSchema = new mongoose.Schema({
    jobTitle: { type: String, trim: true, maxlength: [100, 'Job title cannot exceed 100 characters'], default: '' },
    company: { type: String, trim: true, maxlength: [100, 'Company name cannot exceed 100 characters'], default: '' },
    location: { type: String, trim: true, maxlength: [100, 'Location cannot exceed 100 characters'], default: '' },
    startDate: { type: String, trim: true, maxlength: [10, 'Start date cannot exceed 10 characters'], default: '' },
    endDate: { type: String, trim: true, maxlength: [10, 'End date cannot exceed 10 characters'], default: '' },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: [500, 'Description cannot exceed 500 characters'], default: '' }
});

// Skill (object, not string)
const SkillSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Skill name is required'],
        trim: true,
        minlength: [1, 'Skill name must be at least 1 character'],
        maxlength: [50, 'Skill name cannot exceed 50 characters']
    },
    level: { 
        type: String, 
        enum: {
            values: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            message: 'Skill level must be Beginner, Intermediate, Advanced, or Expert'
        },
        default: 'Intermediate'
    },
    yearsOfExperience: { 
        type: String, 
        trim: true,
        maxlength: [10, 'Years of experience cannot exceed 10 characters'],
        default: '' 
    }
});

// Language
const LanguageSchema = new mongoose.Schema({
    language: { 
        type: String, 
        required: [true, 'Language name is required'],
        trim: true,
        minlength: [1, 'Language name must be at least 1 character'],
        maxlength: [50, 'Language name cannot exceed 50 characters']
    },
    proficiency: { 
        type: String, 
        enum: {
            values: ['Basic', 'Conversational', 'Professional', 'Native'],
            message: 'Proficiency must be Basic, Conversational, Professional, or Native'
        },
        default: 'Conversational'
    },
    certification: { 
        type: String, 
        trim: true,
        maxlength: [255, 'Certification cannot exceed 255 characters'],
        default: '' 
    }
});

// Certification
const CertificationSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Certification name is required'],
        trim: true,
        minlength: [1, 'Certification name must be at least 1 character'],
        maxlength: [200, 'Certification name cannot exceed 200 characters']
    },
    issuingOrganization: { 
        type: String, 
        required: [true, 'Issuing organization is required'],
        trim: true,
        maxlength: [200, 'Issuing organization cannot exceed 200 characters']
    },
    issueDate: { 
        type: String, 
        trim: true,
        maxlength: [10, 'Issue date cannot exceed 10 characters'],
        default: '' 
    },
    expirationDate: { 
        type: String, 
        trim: true,
        maxlength: [10, 'Expiration date cannot exceed 10 characters'],
        default: '' 
    },
    credentialId: { 
        type: String, 
        trim: true,
        maxlength: [100, 'Credential ID cannot exceed 100 characters'],
        default: '' 
    },
    credentialUrl: { 
        type: String, 
        trim: true,
        maxlength: [500, 'Credential URL cannot exceed 500 characters'],
        default: '' 
    }
});

// Project
const ProjectSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Project title is required'],
        trim: true,
        minlength: [1, 'Project title must be at least 1 character'],
        maxlength: [200, 'Project title cannot exceed 200 characters']
    },
    description: { 
        type: String, 
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
        default: '' 
    },
    url: { 
        type: String, 
        trim: true,
        maxlength: [500, 'URL cannot exceed 500 characters'],
        default: '' 
    },
    technologies: [{
        type: String,
        trim: true,
        maxlength: [50, 'Technology name cannot exceed 50 characters']
    }],
    startDate: { 
        type: String, 
        trim: true,
        maxlength: [10, 'Start date cannot exceed 10 characters'],
        default: '' 
    },
    endDate: { 
        type: String, 
        trim: true,
        maxlength: [10, 'End date cannot exceed 10 characters'],
        default: '' 
    },
    current: { type: Boolean, default: false }
});

// Achievement
const AchievementSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Achievement title is required'],
        trim: true,
        minlength: [1, 'Achievement title must be at least 1 character'],
        maxlength: [200, 'Achievement title cannot exceed 200 characters']
    },
    description: { 
        type: String, 
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: '' 
    },
    date: { 
        type: String, 
        trim: true,
        maxlength: [10, 'Date cannot exceed 10 characters'],
        default: '' 
    },
    organization: { 
        type: String, 
        trim: true,
        maxlength: [200, 'Organization cannot exceed 200 characters'],
        default: '' 
    },
    type: { 
        type: String, 
        enum: {
            values: ['award', 'honor', 'recognition'],
            message: 'Achievement type must be award, honor, or recognition'
        },
        default: 'award'
    }
});

// Main Student Schema
const StudentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User ID is required'], 
        unique: true,
        index: true
    },
    summary: { 
        type: String, 
        trim: true,
        maxlength: [500, 'Summary cannot exceed 500 characters'],
        default: '' 
    },
    profilePhoto: { 
        type: String, 
        trim: true,
        maxlength: [500, 'Profile photo URL cannot exceed 500 characters'],
        default: null 
    },
    coverPhoto: { 
        type: String, 
        trim: true,
        maxlength: [500, 'Cover photo URL cannot exceed 500 characters'],
        default: null 
    },
    phoneNumber: { 
        type: String, 
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters'],
        default: '' 
    },
    address: { type: AddressSchema, default: () => ({}) },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    cv: { type: CvSchema, default: () => ({}) },
    portfolio: { 
        type: String, 
        trim: true,
        maxlength: [500, 'Portfolio URL cannot exceed 500 characters'],
        default: '' 
    },

    // Arrays
    education: [EducationSchema],
    experience: [ExperienceSchema],
    skills: [SkillSchema],
    languages: [LanguageSchema],
    certifications: [CertificationSchema],
    projects: [ProjectSchema],
    achievements: [AchievementSchema],

    // Existing fields (kept for compatibility)
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    appliedJobs: [{
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        appliedAt: { type: Date, default: Date.now },
        status: { 
            type: String, 
            enum: {
                values: ['pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'],
                message: 'Application status must be pending, reviewed, shortlisted, interview, rejected, or hired'
            },
            default: 'pending'
        }
    }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    profileViews: { 
        type: Number, 
        default: 0,
        min: [0, 'Profile views cannot be negative']
    },
    lastActive: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre‑save middleware to clean arrays and trim strings
StudentSchema.pre('save', function(next) {
    // Clean arrays: remove empty entries
    const arrayFields = ['education', 'experience', 'skills', 'languages', 'certifications', 'projects', 'achievements'];
    arrayFields.forEach(field => {
        if (this[field]) {
            // For sub‑documents, we don't remove empty ones because they might have required fields;
            // but we can clean null/undefined entries. We'll just leave as is.
            // For skills, etc., we can filter out those with empty name if required.
            if (field === 'skills') {
                this[field] = this[field].filter(skill => skill && skill.name && skill.name.trim() !== '');
            } else if (field === 'languages') {
                this[field] = this[field].filter(lang => lang && lang.language && lang.language.trim() !== '');
            } else if (field === 'certifications') {
                this[field] = this[field].filter(cert => cert && cert.name && cert.name.trim() !== '');
            } else if (field === 'projects') {
                this[field] = this[field].filter(proj => proj && proj.title && proj.title.trim() !== '');
            } else if (field === 'achievements') {
                this[field] = this[field].filter(ach => ach && ach.title && ach.title.trim() !== '');
            }
            // For education and experience, we keep them even if incomplete because they might be partially filled
        }
    });

    // Trim string fields in main document
    if (this.summary) this.summary = this.summary.trim();
    if (this.phoneNumber) this.phoneNumber = this.phoneNumber.trim();
    if (this.portfolio) this.portfolio = this.portfolio.trim();
    
    next();
});

module.exports = mongoose.models.Student || mongoose.model('Student', StudentSchema);