const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    // Company Information
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    
    // Basic Job Information
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    
    description: {
        type: String,
        required: [true, 'Job description is required'],
        trim: true,
        minlength: [50, 'Description must be at least 50 characters'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    
    // Employment Details
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'],
        default: 'Full-time',
        required: true
    },
    
    workMode: {
        type: String,
        enum: ['Remote', 'On-site', 'Hybrid'],
        default: 'Remote',
        required: true
    },
    
    // Location
    location: {
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        address: { type: String, trim: true }
    },
    
    // Salary
    salary: {
        min: { 
            type: Number, 
            min: 0,
            default: 0 
        },
        max: { 
            type: Number, 
            min: 0,
            default: 0 
        },
        currency: { 
            type: String, 
            enum: ['USD', 'EUR', 'GBP', 'LKR'],
            default: 'USD' 
        },
        isNegotiable: { 
            type: Boolean, 
            default: false 
        }
    },
    
    // Experience
    experience: {
        min: { 
            type: Number, 
            min: 0,
            default: 0 
        },
        max: { 
            type: Number, 
            min: 0,
            default: 0 
        },
        level: { 
            type: String, 
            enum: ['Entry', 'Mid', 'Senior', 'Lead'],
            default: 'Entry' 
        }
    },
    
    // Education
    education: {
        level: { type: String, trim: true },
        field: { type: String, trim: true }
    },
    
    // Requirements and Responsibilities
    requirements: [{
        type: String,
        trim: true
    }],
    
    responsibilities: [{
        type: String,
        trim: true
    }],
    
    // Skills
    skills: [{
        name: { type: String, trim: true },
        importance: { 
            type: String, 
            enum: ['Required', 'Preferred', 'Optional'],
            default: 'Required' 
        }
    }],
    
    // Benefits
    benefits: [{
        type: String,
        trim: true
    }],
    
    // Additional Information
    category: {
        type: String,
        trim: true
    },
    
    tags: [{
        type: String,
        trim: true
    }],
    
    applicationDeadline: {
        type: Date
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'closed', 'draft'],
        default: 'active'
    },
    
    // Statistics
    applicantsCount: {
        type: Number,
        default: 0
    },
    
    viewsCount: {
        type: Number,
        default: 0
    },
    
    isFeatured: {
        type: Boolean,
        default: false
    },
    
    // Timestamps
    postedAt: {
        type: Date,
        default: Date.now
    },
    
    expiresAt: {
        type: Date,
        default: function() {
            // Default expiry after 30 days
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for company details
JobSchema.virtual('company', {
    ref: 'Company',
    localField: 'companyId',
    foreignField: '_id',
    justOne: true
});

// Virtual for applications
JobSchema.virtual('applications', {
    ref: 'Application',
    localField: '_id',
    foreignField: 'jobId'
});

// Virtual for isExpired
JobSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for isActive
JobSchema.virtual('isActive').get(function() {
    return this.status === 'active' && !this.isExpired;
});

// Virtual for salary range display
JobSchema.virtual('salaryRange').get(function() {
    if (this.salary.isNegotiable) {
        return 'Negotiable';
    }
    if (this.salary.min && this.salary.max) {
        return `${this.salary.currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()}`;
    }
    if (this.salary.min) {
        return `${this.salary.currency} ${this.salary.min.toLocaleString()}+`;
    }
    if (this.salary.max) {
        return `Up to ${this.salary.currency} ${this.salary.max.toLocaleString()}`;
    }
    return 'Not specified';
});

// Virtual for experience display
JobSchema.virtual('experienceDisplay').get(function() {
    if (this.experience.min && this.experience.max) {
        return `${this.experience.min} - ${this.experience.max} years`;
    }
    if (this.experience.min) {
        return `${this.experience.min}+ years`;
    }
    return this.experience.level || 'Not specified';
});

// Pre-save middleware
JobSchema.pre('save', function(next) {
    // Update timestamps
    this.updatedAt = Date.now();
    
    // Set expiresAt if not set
    if (!this.expiresAt) {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        this.expiresAt = date;
    }
    
    // Clean up arrays
    if (this.requirements) {
        this.requirements = this.requirements.filter(req => req && req.trim() !== '');
    }
    if (this.responsibilities) {
        this.responsibilities = this.responsibilities.filter(resp => resp && resp.trim() !== '');
    }
    if (this.benefits) {
        this.benefits = this.benefits.filter(benefit => benefit && benefit.trim() !== '');
    }
    if (this.skills) {
        this.skills = this.skills.filter(skill => skill && skill.name && skill.name.trim() !== '');
    }
    if (this.tags) {
        this.tags = this.tags.filter(tag => tag && tag.trim() !== '');
    }
    
    next();
});

// Method to increment view count
JobSchema.methods.incrementViews = async function() {
    this.viewsCount += 1;
    await this.save();
    return this;
};

// Method to increment applicants count
JobSchema.methods.incrementApplicants = async function() {
    this.applicantsCount += 1;
    await this.save();
    return this;
};

// Method to decrement applicants count
JobSchema.methods.decrementApplicants = async function() {
    this.applicantsCount = Math.max(0, this.applicantsCount - 1);
    await this.save();
    return this;
};

// Method to close job
JobSchema.methods.close = async function() {
    this.status = 'closed';
    await this.save();
    return this;
};

// Method to reopen job
JobSchema.methods.reopen = async function() {
    this.status = 'active';
    await this.save();
    return this;
};

// Method to check if job is expired
JobSchema.methods.checkExpiry = function() {
    return this.expiresAt && this.expiresAt < new Date();
};

// Method to get public job data
JobSchema.methods.getPublicData = function() {
    const job = this.toObject();
    delete job.__v;
    return job;
};

// Static method to find active jobs
JobSchema.statics.findActive = function() {
    const now = new Date();
    return this.find({
        status: 'active',
        $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null }
        ]
    }).sort({ postedAt: -1, isFeatured: -1 });
};

// Static method to search jobs
JobSchema.statics.search = function(query, filters = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const searchQuery = { status: 'active' };
    
    // Text search
    if (query) {
        searchQuery.$text = { $search: query };
    }
    
    // Apply filters
    if (filters.employmentType) {
        searchQuery.employmentType = filters.employmentType;
    }
    
    if (filters.workMode) {
        searchQuery.workMode = filters.workMode;
    }
    
    if (filters.location) {
        searchQuery['location.city'] = { $regex: filters.location, $options: 'i' };
    }
    
    if (filters.experienceLevel) {
        searchQuery['experience.level'] = filters.experienceLevel;
    }
    
    if (filters.minSalary) {
        searchQuery['salary.min'] = { $gte: filters.minSalary };
    }
    
    if (filters.skills && filters.skills.length > 0) {
        searchQuery['skills.name'] = { $in: filters.skills };
    }
    
    if (filters.category) {
        searchQuery.category = { $regex: filters.category, $options: 'i' };
    }
    
    return this.find(searchQuery)
        .populate('companyId', 'companyName companyLogo industry')
        .sort({ isFeatured: -1, postedAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static method to get job statistics
JobSchema.statics.getStats = async function(companyId) {
    const total = await this.countDocuments({ companyId });
    const active = await this.countDocuments({ 
        companyId, 
        status: 'active',
        expiresAt: { $gt: new Date() }
    });
    const closed = await this.countDocuments({ companyId, status: 'closed' });
    const expired = await this.countDocuments({ 
        companyId, 
        expiresAt: { $lt: new Date() },
        status: 'active'
    });
    const totalViews = await this.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: '$viewsCount' } } }
    ]);
    const totalApplicants = await this.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: '$applicantsCount' } } }
    ]);
    
    return {
        total,
        active,
        closed,
        expired,
        totalViews: totalViews[0]?.total || 0,
        totalApplicants: totalApplicants[0]?.total || 0,
        averageApplicantsPerJob: active > 0 ? Math.round((totalApplicants[0]?.total || 0) / active) : 0
    };
};

// Indexes for better query performance
JobSchema.index({ companyId: 1, postedAt: -1 });
JobSchema.index({ title: 'text', description: 'text', 'skills.name': 'text' });
JobSchema.index({ status: 1, expiresAt: 1 });
JobSchema.index({ employmentType: 1 });
JobSchema.index({ workMode: 1 });
JobSchema.index({ 'location.city': 1 });
JobSchema.index({ 'experience.level': 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ isFeatured: -1, postedAt: -1 });

// Text index for search
JobSchema.index({ 
    title: 'text', 
    description: 'text', 
    'skills.name': 'text',
    requirements: 'text',
    responsibilities: 'text',
    category: 'text',
    tags: 'text'
}, {
    weights: {
        title: 10,
        'skills.name': 8,
        description: 5,
        category: 3,
        tags: 3,
        requirements: 2,
        responsibilities: 2
    },
    name: 'job_text_search'
});

// Check if model exists before creating
module.exports = mongoose.models.Job || mongoose.model('Job', JobSchema);