const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        },
        maxlength: [100, 'Email cannot exceed 100 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
        maxlength: [255, 'Password cannot exceed 255 characters']
    },
    role: {
        type: String,
        enum: {
            values: ['student', 'company', 'admin'],
            message: 'Role must be student, company, or admin'
        },
        required: [true, 'Role is required'],
        default: 'student'
    },
    profilePicture: {
        type: String,
        default: null,
        maxlength: [500, 'Profile picture URL cannot exceed 500 characters']
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: null,
        maxlength: [20, 'Phone number cannot exceed 20 characters'],
        validate: {
            validator: function(v) {
                if (!v) return true;
                // Basic international phone number pattern (optional)
                return /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/.test(v);
            },
            message: 'Please enter a valid phone number'
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    followingCount: {
        type: Number,
        default: 0,
        min: [0, 'Following count cannot be negative'],
        max: [10000, 'Following count cannot exceed 10,000']
    },
    followersCount: {
        type: Number,
        default: 0,
        min: [0, 'Followers count cannot be negative'],
        max: [10000, 'Followers count cannot exceed 10,000']
    },
    postsCount: {
        type: Number,
        default: 0,
        min: [0, 'Posts count cannot be negative'],
        max: [10000, 'Posts count cannot exceed 10,000']
    }
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
};

// Check if model exists before creating (for hot reloading)
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);