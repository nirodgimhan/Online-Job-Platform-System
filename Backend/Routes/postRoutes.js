const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Post = require('../Models/Post');
const Student = require('../models/Student');
const Company = require('../Models/Company');
const User = require('../models/User');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for media uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'post-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImages = /jpeg|jpg|png|gif|webp/;
    const allowedVideos = /mp4|mov|avi|mkv|webm/;
    const allowedDocs = /pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    
    if (allowedImages.test(ext) || allowedImages.test(mime)) {
        file.mediaType = 'image';
        cb(null, true);
    } else if (allowedVideos.test(ext) || allowedVideos.test(mime)) {
        file.mediaType = 'video';
        cb(null, true);
    } else if (allowedDocs.test(ext) || allowedDocs.test(mime)) {
        file.mediaType = 'document';
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: fileFilter
});

// ==================== POST CRUD OPERATIONS ====================

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, upload.array('media', 10), async (req, res) => {
    try {
        const { content, visibility, tags, mentionedUsers } = req.body;
        
        if (!content && (!req.files || req.files.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Post must have content or media'
            });
        }

        // Determine user type
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.user.id });
        
        const userType = student ? 'student' : (company ? 'company' : null);
        
        if (!userType) {
            return res.status(400).json({
                success: false,
                message: 'User profile not found'
            });
        }

        // Process uploaded media
        const media = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                media.push({
                    type: file.mediaType || 'document',
                    url: `/uploads/posts/${file.filename}`,
                    filename: file.filename,
                    size: file.size,
                    mimeType: file.mimetype
                });
            });
        }

        // Parse tags and mentioned users
        const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];
        const mentionsArray = mentionedUsers ? JSON.parse(mentionedUsers) : [];

        const newPost = new Post({
            userId: req.user.id,
            userType,
            content: content || '',
            media,
            visibility: visibility || 'public',
            tags: tagsArray,
            mentionedUsers: mentionsArray,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newPost.save();

        // Add post reference to user's profile
        if (userType === 'student') {
            await Student.findOneAndUpdate(
                { userId: req.user.id },
                { 
                    $push: { posts: newPost._id },
                    $inc: { postsCount: 1 }
                }
            );
            
            // Update user's posts count
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { postsCount: 1 }
            });
        } else if (userType === 'company') {
            await Company.findOneAndUpdate(
                { userId: req.user.id },
                { 
                    $push: { posts: newPost._id },
                    $inc: { postsCount: 1 },
                    lastPostAt: new Date()
                }
            );
        }

        const populatedPost = await Post.findById(newPost._id)
            .populate('userId', 'name email profilePicture role');

        res.json({
            success: true,
            message: 'Post created successfully',
            post: populatedPost
        });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   GET api/posts/feed
// @desc    Get posts feed (from followed users)
// @access  Private
router.get('/feed', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        // Get user's following list
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.user.id });
        
        let followingIds = [req.user.id]; // Include own posts
        
        if (student) {
            followingIds = [...followingIds, ...student.following.map(f => f.userId)];
        } else if (company) {
            followingIds = [...followingIds, ...company.following.map(f => f.userId)];
        }

        const posts = await Post.getFeed(followingIds, parseInt(page), parseInt(limit));
        
        // Check if each post is liked by the current user
        const postsWithLikeStatus = posts.map(post => {
            const postObj = post.toObject();
            postObj.isLiked = post.isLikedBy(req.user.id);
            postObj.isShared = post.sharedBy.some(share => share.userId.toString() === req.user.id);
            
            // Check comment likes
            if (postObj.comments) {
                postObj.comments = postObj.comments.map(comment => {
                    comment.isLiked = comment.likes.some(like => like.userId.toString() === req.user.id);
                    return comment;
                });
            }
            
            return postObj;
        });

        const total = await Post.countDocuments({
            $or: [
                { userId: { $in: followingIds }, visibility: { $in: ['public', 'followers'] } },
                { userId: req.user.id }
            ],
            isArchived: false,
            isReported: false
        });

        res.json({
            success: true,
            posts: postsWithLikeStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   GET api/posts/user/:userId
// @desc    Get posts by user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { userId: req.params.userId };

        // If not viewing own profile, only show public posts
        if (req.params.userId !== req.user.id) {
            query.visibility = 'public';
        }

        const posts = await Post.find(query)
            .populate('userId', 'name profilePicture role')
            .populate('comments.userId', 'name profilePicture')
            .populate('comments.replies.userId', 'name profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Post.countDocuments(query);

        // Check like status for each post
        const postsWithLikeStatus = posts.map(post => {
            const postObj = post.toObject();
            postObj.isLiked = post.isLikedBy(req.user.id);
            return postObj;
        });

        res.json({
            success: true,
            posts: postsWithLikeStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   GET api/posts/:postId
// @desc    Get single post by ID
// @access  Private
router.get('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('userId', 'name email profilePicture role')
            .populate('comments.userId', 'name profilePicture')
            .populate('comments.replies.userId', 'name profilePicture')
            .populate('mentionedUsers.userId', 'name profilePicture');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check visibility permissions
        if (post.visibility === 'private' && post.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this post'
            });
        }

        if (post.visibility === 'followers') {
            // Check if user is a follower
            const student = await Student.findOne({ userId: req.user.id });
            const company = await Company.findOne({ userId: req.user.id });
            
            let isFollowing = false;
            
            if (student) {
                isFollowing = student.following.some(f => f.userId.toString() === post.userId.toString());
            } else if (company) {
                isFollowing = company.following.some(f => f.userId.toString() === post.userId.toString());
            }
            
            if (!isFollowing && post.userId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this post'
                });
            }
        }

        // Increment view count
        await post.incrementEngagement('view');

        const postObj = post.toObject();
        postObj.isLiked = post.isLikedBy(req.user.id);
        postObj.isShared = post.sharedBy.some(share => share.userId.toString() === req.user.id);

        res.json({
            success: true,
            post: postObj
        });

    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   PUT api/posts/:postId
// @desc    Update a post
// @access  Private (only post owner)
router.put('/:postId', auth, async (req, res) => {
    try {
        const { content, visibility, tags } = req.body;

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user is the post owner
        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own posts'
            });
        }

        // Update fields
        if (content !== undefined) post.content = content;
        if (visibility !== undefined) post.visibility = visibility;
        if (tags !== undefined) post.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());

        post.isEdited = true;
        post.editedAt = new Date();
        post.updatedAt = new Date();

        await post.save();

        const updatedPost = await Post.findById(post._id)
            .populate('userId', 'name profilePicture role');

        res.json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost
        });

    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   DELETE api/posts/:postId
// @desc    Delete a post
// @access  Private (only post owner or admin)
router.delete('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user is the post owner or admin
        const user = await User.findById(req.user.id);
        if (post.userId.toString() !== req.user.id && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own posts'
            });
        }

        // Delete associated media files
        if (post.media && post.media.length > 0) {
            post.media.forEach(media => {
                const filePath = path.join(__dirname, '..', media.url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        // Remove post reference from user's profile
        const student = await Student.findOne({ userId: post.userId });
        const company = await Company.findOne({ userId: post.userId });

        if (student) {
            student.posts = student.posts.filter(id => id.toString() !== req.params.postId);
            student.postsCount = student.posts.length;
            await student.save();
        } else if (company) {
            company.posts = company.posts.filter(id => id.toString() !== req.params.postId);
            company.postsCount = company.posts.length;
            await company.save();
        }

        // Update user's posts count
        await User.findByIdAndUpdate(post.userId, {
            $inc: { postsCount: -1 }
        });

        await post.deleteOne();

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== LIKE/UNLIKE POSTS ====================

// @route   PUT api/posts/:postId/like
// @desc    Like or unlike a post
// @access  Private
router.put('/:postId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Determine user type
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.user.id });
        const userType = student ? 'student' : (company ? 'company' : null);

        const isLiked = post.isLikedBy(req.user.id);

        if (isLiked) {
            await post.unlike(req.user.id);
        } else {
            await post.like(req.user.id, userType);
        }

        res.json({
            success: true,
            isLiked: !isLiked,
            likesCount: post.likesCount
        });

    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== COMMENTS ====================

// @route   POST api/posts/:postId/comments
// @desc    Add comment to post
// @access  Private
router.post('/:postId/comments', auth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required'
            });
        }

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Determine user type
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.user.id });
        const userType = student ? 'student' : (company ? 'company' : null);

        const comment = await post.addComment(req.user.id, userType, content);

        // Populate user data for the comment
        await post.populate('comments.userId', 'name profilePicture');

        res.json({
            success: true,
            message: 'Comment added successfully',
            comment: post.comments.id(comment._id)
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   PUT api/posts/:postId/comments/:commentId
// @desc    Edit a comment
// @access  Private (only comment owner)
router.put('/:postId/comments/:commentId', auth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required'
            });
        }

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check if user is the comment owner
        if (comment.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own comments'
            });
        }

        comment.content = content;
        comment.updatedAt = new Date();
        await post.save();

        res.json({
            success: true,
            message: 'Comment updated successfully',
            comment
        });

    } catch (error) {
        console.error('Error editing comment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   DELETE api/posts/:postId/comments/:commentId
// @desc    Delete a comment
// @access  Private (only comment owner or post owner)
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check if user is the comment owner or post owner
        if (comment.userId.toString() !== req.user.id && post.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this comment'
            });
        }

        await post.deleteComment(req.params.commentId);

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   PUT api/posts/:postId/comments/:commentId/like
// @desc    Like or unlike a comment
// @access  Private
router.put('/:postId/comments/:commentId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Determine user type
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.user.id });
        const userType = student ? 'student' : (company ? 'company' : null);

        const isLiked = comment.likes.some(like => like.userId.toString() === req.user.id);

        if (isLiked) {
            comment.likes = comment.likes.filter(like => like.userId.toString() !== req.user.id);
        } else {
            comment.likes.push({
                userId: req.user.id,
                userType,
                createdAt: new Date()
            });
        }

        await post.save();

        res.json({
            success: true,
            isLiked: !isLiked,
            likesCount: comment.likes.length
        });

    } catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== REPLIES ====================

// @route   POST api/posts/:postId/comments/:commentId/replies
// @desc    Add reply to comment
// @access  Private
router.post('/:postId/comments/:commentId/replies', auth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Reply content is required'
            });
        }

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Determine user type
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.user.id });
        const userType = student ? 'student' : (company ? 'company' : null);

        const reply = await post.addReply(req.params.commentId, req.user.id, userType, content);

        if (!reply) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        res.json({
            success: true,
            message: 'Reply added successfully',
            reply
        });

    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   DELETE api/posts/:postId/comments/:commentId/replies/:replyId
// @desc    Delete a reply
// @access  Private (only reply owner)
router.delete('/:postId/comments/:commentId/replies/:replyId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const reply = comment.replies.id(req.params.replyId);

        if (!reply) {
            return res.status(404).json({
                success: false,
                message: 'Reply not found'
            });
        }

        // Check if user is the reply owner
        if (reply.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own replies'
            });
        }

        comment.replies = comment.replies.filter(r => r._id.toString() !== req.params.replyId);
        await post.save();

        res.json({
            success: true,
            message: 'Reply deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== SHARE POST ====================

// @route   POST api/posts/:postId/share
// @desc    Share a post
// @access  Private
router.post('/:postId/share', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Determine user type
        const student = await Student.findOne({ userId: req.user.id });
        const company = await Company.findOne({ userId: req.user.id });
        const userType = student ? 'student' : (company ? 'company' : null);

        await post.share(req.user.id, userType);

        res.json({
            success: true,
            message: 'Post shared successfully',
            shares: post.shares
        });

    } catch (error) {
        console.error('Error sharing post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== REPORT POST ====================

// @route   POST api/posts/:postId/report
// @desc    Report a post
// @access  Private
router.post('/:postId/report', auth, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for reporting'
            });
        }

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        await post.report(req.user.id, reason);

        res.json({
            success: true,
            message: 'Post reported successfully'
        });

    } catch (error) {
        console.error('Error reporting post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== TRENDING & SEARCH ====================

// @route   GET api/posts/trending
// @desc    Get trending posts
// @access  Public
router.get('/trending/all', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const posts = await Post.getTrending(parseInt(limit));

        // Populate user data
        await Post.populate(posts, {
            path: 'userId',
            select: 'name profilePicture role'
        });

        res.json({
            success: true,
            posts
        });

    } catch (error) {
        console.error('Error fetching trending posts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   GET api/posts/search
// @desc    Search posts
// @access  Public
router.get('/search/all', async (req, res) => {
    try {
        const { q, userType, tags, fromDate, toDate, page = 1, limit = 10 } = req.query;

        const filters = {
            userType,
            tags,
            fromDate,
            toDate
        };

        const posts = await Post.search(q, filters, parseInt(page), parseInt(limit));
        const total = await Post.countDocuments({ 
            $text: { $search: q },
            isArchived: false,
            isReported: false,
            visibility: 'public'
        });

        res.json({
            success: true,
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// ==================== ADMIN ROUTES ====================

// @route   GET api/posts/admin/all
// @desc    Get all posts (including reported) - Admin only
// @access  Private/Admin
router.get('/admin/all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { page = 1, limit = 20, showReported = false } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = showReported === 'true' ? { isReported: true } : {};

        const posts = await Post.find(query)
            .populate('userId', 'name email role')
            .populate('reports.userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Post.countDocuments(query);

        res.json({
            success: true,
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching all posts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

// @route   PUT api/posts/:postId/moderate
// @desc    Moderate a post (hide/archive) - Admin only
// @access  Private/Admin
router.put('/:postId/moderate', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { action } = req.body; // 'archive', 'unarchive', 'hide', 'unhide'

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        switch (action) {
            case 'archive':
                post.isArchived = true;
                break;
            case 'unarchive':
                post.isArchived = false;
                break;
            case 'hide':
                post.visibility = 'private';
                break;
            case 'unhide':
                post.visibility = 'public';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }

        await post.save();

        res.json({
            success: true,
            message: `Post ${action}d successfully`,
            post
        });

    } catch (error) {
        console.error('Error moderating post:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
});

module.exports = router;