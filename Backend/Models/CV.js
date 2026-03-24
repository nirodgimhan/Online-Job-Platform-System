const mongoose = require('mongoose');

const CVSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    filename: String,
    filePath: String,
    fileType: String,
    fileSize: Number,
    isPrimary: {
        type: Boolean,
        default: false
    },
    parsedContent: {
        text: String,
        skills: [String],
        education: [String],
        experience: [String],
        contactInfo: {
            name: String,
            email: String,
            phone: String,
            location: String
        }
    },
    aiAnalysis: {
        overallScore: Number,
        skillsScore: Number,
        experienceScore: Number,
        educationScore: Number,
        formattingScore: Number,
        keywordsScore: Number,
        suggestions: [String],
        atsCompatibility: Number
    },
    analytics: {
        views: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 },
        applicationsUsing: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CV', CVSchema);