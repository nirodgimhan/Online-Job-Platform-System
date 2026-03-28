const mongoose = require('mongoose');

// Location Sub-document Schema
const locationSchema = new mongoose.Schema({
    address: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    zipCode: {
        type: String,
        trim: true
    },
    isHeadquarters: {
        type: Boolean,
        default: false
    }
}, { _id: true });

// Hiring Team Member Schema
const hiringTeamSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        trim: true
    },
    position: {
        type: String,
        trim: true
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
        validate: {
            validator: function(v) {
                if (!v) return true;
                // Basic international phone number pattern (optional)
                return /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/.test(v);
            },
            message: 'Please enter a valid phone number'
        }
    },
    profilePicture: String,
    linkedin: String,
    permissions: [{
        type: String,
        enum: ['post_jobs', 'edit_profile', 'view_applications', 'message_students', 'manage_team', 'view_analytics'],
        default: ['post_jobs', 'view_applications']
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

// Follower Schema
const followerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userType: {
        type: String,
        enum: ['student', 'company', 'admin'],
        required: true
    },
    followedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

// Following Schema
const followingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userType: {
        type: String,
        enum: ['student', 'company'],
        required: true
    },
    followedAt: {
        type: Date,
        default: Date.now
    },
    notes: String,
    tags: [String]
}, { _id: true });

// Main Company Schema
const CompanySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    
    // Core Information
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        minlength: [2, 'Company name must be at least 2 characters'],
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    companyLogo: {
        type: String,
        default: null
    },
    coverPhoto: {
        type: String,
        default: null
    },
    
    // Company Details
    industry: {
        type: String,
        trim: true,
        maxlength: [100, 'Industry name cannot exceed 100 characters']
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    foundedYear: {
        type: Number,
        min: [1800, 'Founded year cannot be before 1800'],
        max: [new Date().getFullYear(), 'Founded year cannot be in the future']
    },
    website: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
            },
            message: 'Please enter a valid URL'
        }
    },
    description: {
        type: String,
        maxlength: [5000, 'Description cannot exceed 5000 characters'],
        trim: true
    },
    shortDescription: {
        type: String,
        maxlength: [300, 'Short description cannot exceed 300 characters'],
        trim: true
    },
    tagline: {
        type: String,
        maxlength: [100, 'Tagline cannot exceed 100 characters'],
        trim: true
    },
    
    // Locations
    locations: [locationSchema],
    
    // Primary Address
    address: {
        street: { type: String, trim: true, maxlength: 200 },
        city: { type: String, trim: true, maxlength: 100 },
        state: { type: String, trim: true, maxlength: 100 },
        country: { type: String, trim: true, maxlength: 100 },
        zipCode: { type: String, trim: true, maxlength: 20 }
    },
    
    // Contact Information
    contactEmail: {
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
    contactPhone: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true;
                // Basic international phone number pattern
                return /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/.test(v);
            },
            message: 'Please enter a valid phone number'
        }
    },
    
    // Social Media Links
    socialMedia: {
        linkedin: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^(https?:\/\/)?(www\.)?linkedin\.com\/company\/.*$/.test(v);
                },
                message: 'Please enter a valid LinkedIn company URL'
            }
        },
        twitter: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^(https?:\/\/)?(www\.)?twitter\.com\/.*$/.test(v);
                },
                message: 'Please enter a valid Twitter URL'
            }
        },
        facebook: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^(https?:\/\/)?(www\.)?facebook\.com\/.*$/.test(v);
                },
                message: 'Please enter a valid Facebook URL'
            }
        },
        instagram: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^(https?:\/\/)?(www\.)?instagram\.com\/.*$/.test(v);
                },
                message: 'Please enter a valid Instagram URL'
            }
        },
        youtube: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^(https?:\/\/)?(www\.)?youtube\.com\/.*$/.test(v);
                },
                message: 'Please enter a valid YouTube URL'
            }
        },
        github: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^(https?:\/\/)?(www\.)?github\.com\/.*$/.test(v);
                },
                message: 'Please enter a valid GitHub URL'
            }
        }
    },
    
    // Verification Status
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,
    verificationDocuments: [{
        url: String,
        documentType: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Hiring Team
    hiringTeam: [hiringTeamSchema],
    
    // Company Media
    companyPhotos: [{
        url: String,
        caption: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    companyVideos: [{
        url: String,
        title: String,
        thumbnail: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // ==================== JOB RELATED FIELDS ====================
    
    // Jobs posted by this company
    postedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    
    // Job statistics
    totalJobsPosted: {
        type: Number,
        default: 0,
        min: 0
    },
    activeJobsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Job categories this company typically hires for
    jobCategories: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    
    // Default job settings (optional)
    defaultJobSettings: {
        applicationDeadlineDays: {
            type: Number,
            default: 30,
            min: 1,
            max: 365
        },
        autoCloseExpired: {
            type: Boolean,
            default: true
        },
        notifyNewApplications: {
            type: Boolean,
            default: true
        }
    },
    
    // ==================== SOCIAL FEATURES ====================
    
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    postsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    followers: [followerSchema],
    followersCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    following: [followingSchema],
    followingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // ==================== PROFILE STATISTICS ====================
    
    profileViews: {
        type: Number,
        default: 0,
        min: 0
    },
    profileCompleteness: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    
    // Engagement Metrics
    engagementMetrics: {
        weeklyViews: {
            type: Number,
            default: 0,
            min: 0
        },
        monthlyViews: {
            type: Number,
            default: 0,
            min: 0
        },
        totalApplications: {
            type: Number,
            default: 0,
            min: 0
        },
        averageResponseTime: {
            type: Number, // in hours
            default: 0,
            min: 0
        }
    },
    
    // ==================== BILLING ====================
    
    billingInfo: {
        subscriptionPlan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
        },
        billingEmail: {
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
        paymentMethod: String,
        validUntil: Date,
        autoRenew: {
            type: Boolean,
            default: true
        },
        maxJobsAllowed: {
            type: Number,
            default: 5,
            min: 0
        },
        maxFeaturedJobs: {
            type: Number,
            default: 1,
            min: 0
        }
    },
    
    // ==================== SETTINGS ====================
    
    settings: {
        jobAlertSettings: {
            notifyNewApplicants: {
                type: Boolean,
                default: true
            },
            notifyApplicationStatus: {
                type: Boolean,
                default: true
            },
            dailyDigest: {
                type: Boolean,
                default: false
            }
        },
        privacySettings: {
            showEmail: {
                type: Boolean,
                default: false
            },
            showPhone: {
                type: Boolean,
                default: false
            },
            showTeam: {
                type: Boolean,
                default: true
            }
        },
        notificationPreferences: {
            emailNotifications: {
                type: Boolean,
                default: true
            },
            pushNotifications: {
                type: Boolean,
                default: true
            },
            smsNotifications: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // ==================== ACTIVITY TRACKING ====================
    
    lastActive: {
        type: Date,
        default: Date.now
    },
    lastPostAt: Date,
    lastJobPostAt: Date,
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isProfilePublic: {
        type: Boolean,
        default: true
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

// ==================== VIRTUALS ====================

// Virtual for user data
CompanySchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Virtual for open jobs
CompanySchema.virtual('openJobs', {
    ref: 'Job',
    localField: 'postedJobs',
    foreignField: '_id',
    justOne: false
});

// Virtual for active jobs (not expired)
CompanySchema.virtual('activeJobs').get(function() {
    return this.activeJobsCount || 0;
});

// Virtual for jobs remaining based on subscription
CompanySchema.virtual('jobsRemaining').get(function() {
    const maxJobs = this.billingInfo?.maxJobsAllowed || 5;
    return Math.max(0, maxJobs - this.activeJobsCount);
});

// Virtual for can post more jobs
CompanySchema.virtual('canPostMoreJobs').get(function() {
    return this.jobsRemaining > 0;
});

// Virtual for total applications received
CompanySchema.virtual('totalApplicationsReceived').get(function() {
    return this.engagementMetrics?.totalApplications || 0;
});

// ==================== PRE-SAVE MIDDLEWARE ====================

CompanySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    this.lastActive = Date.now();
    
    // Trim string fields (optional)
    if (this.companyName) this.companyName = this.companyName.trim();
    if (this.industry) this.industry = this.industry.trim();
    if (this.tagline) this.tagline = this.tagline.trim();
    if (this.shortDescription) this.shortDescription = this.shortDescription.trim();
    if (this.description) this.description = this.description.trim();
    if (this.website) this.website = this.website.trim();
    if (this.contactEmail) this.contactEmail = this.contactEmail.trim().toLowerCase();
    if (this.contactPhone) this.contactPhone = this.contactPhone.trim();
    
    // Calculate profile completeness
    let totalFields = 0;
    let completedFields = 0;
    
    const fieldsToCheck = [
        'companyName', 'industry', 'companySize', 'foundedYear', 'website',
        'description', 'shortDescription', 'tagline', 'contactEmail', 'contactPhone',
        'companyLogo', 'coverPhoto'
    ];
    
    fieldsToCheck.forEach(field => {
        totalFields++;
        if (this[field] && this[field].toString().length > 0) completedFields++;
    });
    
    // Check locations
    totalFields++;
    if (this.locations && this.locations.length > 0) completedFields++;
    
    // Check social media
    if (this.socialMedia) {
        Object.keys(this.socialMedia).forEach(key => {
            totalFields++;
            if (this.socialMedia[key]) completedFields++;
        });
    }
    
    this.profileCompleteness = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    next();
});

// ==================== JOB RELATED METHODS ====================

// Method to add a job
CompanySchema.methods.addJob = async function(jobId) {
    if (!this.postedJobs.includes(jobId)) {
        this.postedJobs.push(jobId);
        this.totalJobsPosted = this.postedJobs.length;
        this.activeJobsCount = this.activeJobsCount + 1;
        this.lastJobPostAt = new Date();
        await this.save();
    }
    return this;
};

// Method to remove a job
CompanySchema.methods.removeJob = async function(jobId, wasActive = true) {
    this.postedJobs = this.postedJobs.filter(id => id.toString() !== jobId.toString());
    this.totalJobsPosted = this.postedJobs.length;
    if (wasActive) {
        this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
    await this.save();
    return this;
};

// Method to update job count when job status changes
CompanySchema.methods.updateJobCount = async function(increment = true) {
    if (increment) {
        this.activeJobsCount += 1;
    } else {
        this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    }
    await this.save();
    return this;
};

// Method to check if can post more jobs
CompanySchema.methods.canPostJob = function() {
    const maxJobs = this.billingInfo?.maxJobsAllowed || 5;
    return this.activeJobsCount < maxJobs;
};

// Method to get job statistics
CompanySchema.methods.getJobStats = async function() {
    const Job = mongoose.model('Job');
    const jobs = await Job.find({ companyId: this._id });
    
    const stats = {
        total: jobs.length,
        active: jobs.filter(j => j.status === 'active').length,
        closed: jobs.filter(j => j.status === 'closed').length,
        draft: jobs.filter(j => j.status === 'draft').length,
        totalViews: jobs.reduce((sum, j) => sum + (j.viewsCount || 0), 0),
        totalApplications: jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0)
    };
    
    return stats;
};

// ==================== SOCIAL METHODS ====================

// Method to follow a student
CompanySchema.methods.followStudent = async function(studentId) {
    const studentIdStr = studentId.toString();
    
    if (!this.following.some(f => f.userId.toString() === studentIdStr)) {
        this.following.push({ userId: studentId });
        this.followingCount = this.following.length;
        await this.save();
        return true;
    }
    return false;
};

// Method to unfollow a student
CompanySchema.methods.unfollowStudent = async function(studentId) {
    const studentIdStr = studentId.toString();
    
    this.following = this.following.filter(f => f.userId.toString() !== studentIdStr);
    this.followingCount = this.following.length;
    await this.save();
    return true;
};

// Method to add a follower
CompanySchema.methods.addFollower = async function(userId) {
    const userIdStr = userId.toString();
    
    if (!this.followers.some(f => f.userId.toString() === userIdStr)) {
        this.followers.push({ userId });
        this.followersCount = this.followers.length;
        await this.save();
        return true;
    }
    return false;
};

// Method to remove a follower
CompanySchema.methods.removeFollower = async function(userId) {
    const userIdStr = userId.toString();
    
    this.followers = this.followers.filter(f => f.userId.toString() !== userIdStr);
    this.followersCount = this.followers.length;
    await this.save();
    return true;
};

// Method to check if following a student
CompanySchema.methods.isFollowing = function(userId) {
    return this.following.some(f => f.userId.toString() === userId.toString());
};

// Method to check if followed by a user
CompanySchema.methods.isFollowedBy = function(userId) {
    return this.followers.some(f => f.userId.toString() === userId.toString());
};

// ==================== POST METHODS ====================

// Method to add a post
CompanySchema.methods.addPost = async function(postId) {
    if (!this.posts.includes(postId)) {
        this.posts.push(postId);
        this.postsCount = this.posts.length;
        this.lastPostAt = new Date();
        await this.save();
    }
    return this;
};

// Method to remove a post
CompanySchema.methods.removePost = async function(postId) {
    this.posts = this.posts.filter(id => id.toString() !== postId.toString());
    this.postsCount = this.posts.length;
    await this.save();
    return this;
};

// ==================== STATISTICS METHODS ====================

// Method to increment profile views
CompanySchema.methods.incrementViews = async function() {
    this.profileViews += 1;
    this.engagementMetrics.weeklyViews += 1;
    this.engagementMetrics.monthlyViews += 1;
    await this.save();
    return this;
};

// Method to increment applications count
CompanySchema.methods.incrementApplications = async function() {
    this.engagementMetrics.totalApplications += 1;
    await this.save();
    return this;
};

// Method to update average response time
CompanySchema.methods.updateResponseTime = async function(responseTimeHours) {
    const current = this.engagementMetrics.averageResponseTime;
    const total = this.engagementMetrics.totalApplications;
    
    // Calculate new average
    const newAverage = ((current * (total - 1)) + responseTimeHours) / total;
    this.engagementMetrics.averageResponseTime = Math.round(newAverage * 10) / 10;
    
    await this.save();
    return this;
};

// ==================== PROFILE METHODS ====================

// Method to get public profile (for other users)
CompanySchema.methods.getPublicProfile = function(viewerId = null) {
    const company = this.toObject();
    
    // Remove sensitive information
    delete company.billingInfo;
    delete company.verificationDocuments;
    delete company.engagementMetrics;
    delete company.settings;
    
    // Only show limited team info
    if (company.hiringTeam) {
        company.hiringTeam = company.hiringTeam
            .filter(member => member.isActive)
            .map(member => ({
                name: member.name,
                role: member.role,
                position: member.position,
                profilePicture: member.profilePicture
            }));
    }
    
    // Add follow status if viewer is provided
    if (viewerId) {
        company.isFollowedByViewer = this.isFollowedBy(viewerId);
        company.isFollowingViewer = this.isFollowing(viewerId);
    }
    
    // Add job stats
    company.activeJobsCount = this.activeJobsCount;
    company.totalJobsPosted = this.totalJobsPosted;
    
    return company;
};

// ==================== STATIC METHODS ====================

// Static method to search companies
CompanySchema.statics.search = function(query, filters = {}, limit = 20, skip = 0) {
    const searchQuery = {};
    
    if (query) {
        searchQuery.$or = [
            { companyName: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { industry: { $regex: query, $options: 'i' } },
            { tagline: { $regex: query, $options: 'i' } },
            { 'locations.city': { $regex: query, $options: 'i' } },
            { 'locations.country': { $regex: query, $options: 'i' } }
        ];
    }
    
    // Apply filters
    if (filters.industry) {
        searchQuery.industry = { $regex: filters.industry, $options: 'i' };
    }
    
    if (filters.location) {
        searchQuery.$or = [
            { 'address.city': { $regex: filters.location, $options: 'i' } },
            { 'address.country': { $regex: filters.location, $options: 'i' } },
            { 'locations.city': { $regex: filters.location, $options: 'i' } },
            { 'locations.country': { $regex: filters.location, $options: 'i' } }
        ];
    }
    
    if (filters.verified !== undefined) {
        searchQuery.verified = filters.verified;
    }
    
    if (filters.companySize) {
        searchQuery.companySize = filters.companySize;
    }
    
    if (filters.isHiring) {
        searchQuery.activeJobsCount = { $gt: 0 };
    }
    
    return this.find(searchQuery)
        .select('-billingInfo -hiringTeam -verificationDocuments')
        .populate('userId', 'name email')
        .limit(limit)
        .skip(skip)
        .sort({ profileCompleteness: -1, followersCount: -1, lastActive: -1 });
};

// Static method to get hiring companies (with active jobs)
CompanySchema.statics.getHiringCompanies = function(limit = 10) {
    return this.find({ activeJobsCount: { $gt: 0 }, isProfilePublic: true })
        .sort({ activeJobsCount: -1, followersCount: -1 })
        .limit(limit)
        .select('companyName companyLogo industry activeJobsCount');
};

// Static method to get trending companies
CompanySchema.statics.getTrending = function(limit = 10) {
    return this.aggregate([
        {
            $addFields: {
                popularityScore: {
                    $add: [
                        '$profileViews',
                        { $multiply: ['$followersCount', 10] },
                        { $multiply: ['$activeJobsCount', 20] }
                    ]
                }
            }
        },
        { $sort: { popularityScore: -1, lastActive: -1 } },
        { $limit: limit }
    ]);
};

// ==================== INDEXES ====================

CompanySchema.index({ userId: 1 });
CompanySchema.index({ companyName: 'text', description: 'text' });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ 'locations.city': 1, 'locations.country': 1 });
CompanySchema.index({ verified: 1 });
CompanySchema.index({ followersCount: -1 });
CompanySchema.index({ profileCompleteness: -1 });
CompanySchema.index({ lastActive: -1 });
CompanySchema.index({ createdAt: -1 });
CompanySchema.index({ activeJobsCount: -1 });
CompanySchema.index({ 'billingInfo.subscriptionPlan': 1 });

// Check if model exists before creating
module.exports = mongoose.models.Company || mongoose.model('Company', CompanySchema);