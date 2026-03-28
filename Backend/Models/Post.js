const mongoose = require('mongoose');

// Reply Schema
const replySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    userType: {
        type: String,
        enum: {
            values: ['student', 'company'],
            message: 'User type must be either student or company'
        },
        required: [true, 'User type is required']
    },
    content: {
        type: String,
        required: [true, 'Reply content is required'],
        trim: true,
        minlength: [1, 'Reply must be at least 1 character'],
        maxlength: [500, 'Reply cannot exceed 500 characters']
    },
    likes: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userType: {
            type: String,
            enum: ['student', 'company']
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

// Comment Schema
const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    userType: {
        type: String,
        enum: {
            values: ['student', 'company'],
            message: 'User type must be either student or company'
        },
        required: [true, 'User type is required']
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        minlength: [1, 'Comment must be at least 1 character'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    likes: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userType: {
            type: String,
            enum: ['student', 'company']
        }
    }],
    replies: [replySchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

// Media Schema
const mediaSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: {
            values: ['image', 'video', 'document'],
            message: 'Media type must be image, video, or document'
        },
        required: [true, 'Media type is required']
    },
    url: {
        type: String,
        required: [true, 'Media URL is required'],
        trim: true,
        maxlength: [500, 'Media URL cannot exceed 500 characters']
    },
    thumbnail: {
        type: String,
        trim: true,
        maxlength: [500, 'Thumbnail URL cannot exceed 500 characters']
    },
    filename: {
        type: String,
        trim: true,
        maxlength: [255, 'Filename cannot exceed 255 characters']
    },
    size: {
        type: Number,
        min: [0, 'File size cannot be negative'],
        max: [100 * 1024 * 1024, 'File size cannot exceed 100MB'] // 100MB limit
    },
    mimeType: {
        type: String,
        trim: true,
        maxlength: [100, 'MIME type cannot exceed 100 characters']
    }
}, { _id: true });

// Main Post Schema
const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    userType: {
        type: String,
        enum: {
            values: ['student', 'company'],
            message: 'User type must be either student or company'
        },
        required: [true, 'User type is required']
    },
    content: {
        type: String,
        required: [true, 'Post content is required'],
        trim: true,
        minlength: [1, 'Post content must be at least 1 character'],
        maxlength: [5000, 'Post content cannot exceed 5000 characters']
    },
    media: [mediaSchema],
    likes: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userType: {
            type: String,
            enum: ['student', 'company']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    likesCount: {
        type: Number,
        default: 0,
        min: [0, 'Likes count cannot be negative']
    },
    comments: [commentSchema],
    commentsCount: {
        type: Number,
        default: 0,
        min: [0, 'Comments count cannot be negative']
    },
    shares: {
        type: Number,
        default: 0,
        min: [0, 'Shares count cannot be negative']
    },
    sharedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userType: {
            type: String,
            enum: ['student', 'company']
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    visibility: {
        type: String,
        enum: {
            values: ['public', 'followers', 'private'],
            message: 'Visibility must be public, followers, or private'
        },
        default: 'public'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Each tag cannot exceed 50 characters']
    }],
    mentionedUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userType: {
            type: String,
            enum: ['student', 'company']
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    isPinned: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isReported: {
        type: Boolean,
        default: false
    },
    reportCount: {
        type: Number,
        default: 0,
        min: [0, 'Report count cannot be negative']
    },
    reports: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [500, 'Report reason cannot exceed 500 characters']
        },
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    engagement: {
        reach: {
            type: Number,
            default: 0,
            min: [0, 'Reach cannot be negative']
        },
        clicks: {
            type: Number,
            default: 0,
            min: [0, 'Clicks cannot be negative']
        },
        uniqueViews: {
            type: Number,
            default: 0,
            min: [0, 'Unique views cannot be negative']
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
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

// Virtual for user data
PostSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Pre-save middleware
PostSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    this.likesCount = this.likes.length;
    this.commentsCount = this.comments.length;
    
    // Clean tags: remove empty strings and trim each
    if (this.tags) {
        this.tags = this.tags.filter(tag => tag && tag.trim() !== '');
    }
    
    next();
});

// Method to like a post
PostSchema.methods.like = async function(userId, userType) {
    if (!this.likes.some(like => like.userId.toString() === userId.toString())) {
        this.likes.push({
            userId,
            userType,
            createdAt: new Date()
        });
        this.likesCount = this.likes.length;
        await this.save();
        return { liked: true, likesCount: this.likesCount };
    }
    return { liked: false, likesCount: this.likesCount };
};

// Method to unlike a post
PostSchema.methods.unlike = async function(userId) {
    this.likes = this.likes.filter(like => like.userId.toString() !== userId.toString());
    this.likesCount = this.likes.length;
    await this.save();
    return { liked: false, likesCount: this.likesCount };
};

// Method to check if liked by user
PostSchema.methods.isLikedBy = function(userId) {
    return this.likes.some(like => like.userId.toString() === userId.toString());
};

// Method to add a comment
PostSchema.methods.addComment = async function(userId, userType, content) {
    const comment = {
        userId,
        userType,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: [],
        replies: []
    };
    
    this.comments.push(comment);
    this.commentsCount = this.comments.length;
    await this.save();
    
    return comment;
};

// Method to delete a comment
PostSchema.methods.deleteComment = async function(commentId) {
    this.comments = this.comments.filter(c => c._id.toString() !== commentId.toString());
    this.commentsCount = this.comments.length;
    await this.save();
    return this;
};

// Method to add a reply to comment
PostSchema.methods.addReply = async function(commentId, userId, userType, content) {
    const comment = this.comments.id(commentId);
    if (comment) {
        const reply = {
            userId,
            userType,
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
            likes: []
        };
        comment.replies.push(reply);
        await this.save();
        return reply;
    }
    return null;
};

// Method to share a post
PostSchema.methods.share = async function(userId, userType) {
    if (!this.sharedBy.some(share => share.userId.toString() === userId.toString())) {
        this.sharedBy.push({
            userId,
            userType,
            sharedAt: new Date()
        });
        this.shares = this.sharedBy.length;
        await this.save();
    }
    return this;
};

// Method to increment engagement
PostSchema.methods.incrementEngagement = async function(type) {
    if (type === 'view') {
        this.engagement.uniqueViews += 1;
    } else if (type === 'click') {
        this.engagement.clicks += 1;
    }
    this.engagement.reach += 1;
    await this.save();
    return this;
};

// Method to report a post
PostSchema.methods.report = async function(userId, reason) {
    if (!this.reports.some(r => r.userId.toString() === userId.toString())) {
        this.reports.push({
            userId,
            reason,
            reportedAt: new Date()
        });
        this.reportCount = this.reports.length;
        this.isReported = this.reportCount >= 5;
        await this.save();
    }
    return this;
};

// Static method to get feed for a user
PostSchema.statics.getFeed = function(followingIds, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const query = {
        $or: [
            { userId: { $in: followingIds }, visibility: { $in: ['public', 'followers'] } },
            { visibility: 'public' }
        ],
        isArchived: false,
        isReported: false
    };
    
    return this.find(query)
        .populate('userId', 'name profilePicture role')
        .populate('comments.userId', 'name profilePicture')
        .populate('comments.replies.userId', 'name profilePicture')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static method to get trending posts
PostSchema.statics.getTrending = function(limit = 10) {
    return this.aggregate([
        {
            $match: {
                isArchived: false,
                isReported: false,
                visibility: 'public'
            }
        },
        {
            $addFields: {
                engagementScore: {
                    $add: [
                        { $multiply: ['$likesCount', 2] },
                        { $multiply: ['$commentsCount', 3] },
                        { $multiply: ['$shares', 4] },
                        { $divide: ['$engagement.uniqueViews', 10] }
                    ]
                }
            }
        },
        { $sort: { engagementScore: -1, createdAt: -1 } },
        { $limit: limit }
    ]);
};

// Static method to search posts
PostSchema.statics.search = function(query, filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const searchQuery = {
        isArchived: false,
        isReported: false,
        visibility: 'public'
    };
    
    if (query) {
        searchQuery.$text = { $search: query };
    }
    
    if (filters.userType) {
        searchQuery.userType = filters.userType;
    }
    
    if (filters.tags) {
        searchQuery.tags = { $in: filters.tags.split(',') };
    }
    
    if (filters.fromDate || filters.toDate) {
        searchQuery.createdAt = {};
        if (filters.fromDate) searchQuery.createdAt.$gte = new Date(filters.fromDate);
        if (filters.toDate) searchQuery.createdAt.$lte = new Date(filters.toDate);
    }
    
    return this.find(searchQuery)
        .populate('userId', 'name profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Indexes for better query performance
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ userType: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ 'likes.userId': 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ likesCount: -1 });
PostSchema.index({ commentsCount: -1 });
PostSchema.index({ shares: -1 });
PostSchema.index({ visibility: 1 });
PostSchema.index({ isPinned: -1 });
PostSchema.index({ isArchived: 1 });
PostSchema.index({ isReported: 1 });

// Text index for search
PostSchema.index({ 
    content: 'text', 
    tags: 'text' 
}, {
    weights: {
        content: 10,
        tags: 5
    },
    name: 'post_text_search'
});

// Check if model exists before creating
module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);