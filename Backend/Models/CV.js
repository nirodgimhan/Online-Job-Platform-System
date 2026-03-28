const mongoose = require('mongoose');

const CVSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    title: {
        type: String,
        required: [true, 'CV title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    filename: {
        type: String,
        required: [true, 'Filename is required'],
        trim: true,
        maxlength: [255, 'Filename cannot exceed 255 characters']
    },
    filePath: {
        type: String,
        required: [true, 'File path is required'],
        trim: true,
        maxlength: [500, 'File path cannot exceed 500 characters']
    },
    fileType: {
        type: String,
        required: [true, 'File type is required'],
        trim: true,
        enum: {
            values: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            message: 'File type must be PDF, DOC, DOCX, or TXT'
        }
    },
    fileSize: {
        type: Number,
        required: [true, 'File size is required'],
        min: [0, 'File size cannot be negative'],
        max: [10 * 1024 * 1024, 'File size cannot exceed 10MB']
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    parsedContent: {
        text: {
            type: String,
            trim: true,
            maxlength: [10000, 'Parsed text cannot exceed 10000 characters']
        },
        skills: [{
            type: String,
            trim: true,
            maxlength: [50, 'Each skill cannot exceed 50 characters']
        }],
        education: [{
            type: String,
            trim: true,
            maxlength: [200, 'Each education entry cannot exceed 200 characters']
        }],
        experience: [{
            type: String,
            trim: true,
            maxlength: [500, 'Each experience entry cannot exceed 500 characters']
        }],
        contactInfo: {
            name: {
                type: String,
                trim: true,
                maxlength: [100, 'Name cannot exceed 100 characters']
            },
            email: {
                type: String,
                trim: true,
                lowercase: true,
                validate: {
                    validator: function(v) {
                        if (!v) return true;
                        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
                    },
                    message: 'Please enter a valid email address'
                }
            },
            phone: {
                type: String,
                trim: true,
                maxlength: [20, 'Phone number cannot exceed 20 characters']
            },
            location: {
                type: String,
                trim: true,
                maxlength: [100, 'Location cannot exceed 100 characters']
            }
        }
    },
    aiAnalysis: {
        overallScore: {
            type: Number,
            min: [0, 'Score cannot be less than 0'],
            max: [100, 'Score cannot exceed 100']
        },
        skillsScore: {
            type: Number,
            min: [0, 'Score cannot be less than 0'],
            max: [100, 'Score cannot exceed 100']
        },
        experienceScore: {
            type: Number,
            min: [0, 'Score cannot be less than 0'],
            max: [100, 'Score cannot exceed 100']
        },
        educationScore: {
            type: Number,
            min: [0, 'Score cannot be less than 0'],
            max: [100, 'Score cannot exceed 100']
        },
        formattingScore: {
            type: Number,
            min: [0, 'Score cannot be less than 0'],
            max: [100, 'Score cannot exceed 100']
        },
        keywordsScore: {
            type: Number,
            min: [0, 'Score cannot be less than 0'],
            max: [100, 'Score cannot exceed 100']
        },
        suggestions: [{
            type: String,
            trim: true,
            maxlength: [255, 'Each suggestion cannot exceed 255 characters']
        }],
        atsCompatibility: {
            type: Number,
            min: [0, 'ATS compatibility cannot be less than 0'],
            max: [100, 'ATS compatibility cannot exceed 100']
        }
    },
    analytics: {
        views: {
            type: Number,
            default: 0,
            min: [0, 'Views cannot be negative']
        },
        downloads: {
            type: Number,
            default: 0,
            min: [0, 'Downloads cannot be negative']
        },
        applicationsUsing: {
            type: Number,
            default: 0,
            min: [0, 'Applications count cannot be negative']
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save middleware to update timestamps
CVSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for efficient queries
CVSchema.index({ studentId: 1, isPrimary: -1 });
CVSchema.index({ studentId: 1, createdAt: -1 });
CVSchema.index({ 'aiAnalysis.overallScore': -1 });

// Check if model exists before creating (for hot reloading in development)
module.exports = mongoose.models.CV || mongoose.model('CV', CVSchema);