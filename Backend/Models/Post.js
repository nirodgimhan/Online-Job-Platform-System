const mongoose = require('mongoose');

// Reply Schema
const replySchema = new mongoose.Schema({
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
    content: {
        type: String,
        required: true,
        maxlength: 500
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
        required: true
    },
    userType: {
        type: String,
        enum: ['student', 'company'],
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000
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
        enum: ['image', 'video', 'document'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String
    },
    filename: String,
    size: Number,
    mimeType: String
}, { _id: true });

// Main Post Schema
const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userType: {
        type: String,
        enum: ['student', 'company'],
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000,
        trim: true
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
        default: 0
    },
    comments: [commentSchema],
    commentsCount: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
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
        enum: ['public', 'followers', 'private'],
        default: 'public'
    },
    tags: [{
        type: String,
        trim: true
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
        default: 0
    },
    reports: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    engagement: {
        reach: {
            type: Number,
            default: 0
        },
        clicks: {
            type: Number,
            default: 0
        },
        uniqueViews: {
            type: Number,
            default: 0
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