const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notificationController'); // Import notification helper

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role,
            name: user.name 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        console.log('📝 Registration request received:', req.body);

        const { name, email, password, role, phoneNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields: name, email, password, role' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address' 
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Validate role
        if (!['student', 'company', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role. Must be student, company, or admin' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            role,
            phoneNumber: phoneNumber || null,
            isVerified: true,
            isActive: true
        });

        await user.save();
        console.log('✅ User saved successfully with ID:', user._id);

        // Create role-specific profile
        if (role === 'student') {
            try {
                const student = new Student({
                    userId: user._id,
                    skills: [],
                    education: [],
                    experience: [],
                    languages: [],
                    certifications: []
                });
                await student.save();
                console.log('✅ Student profile created');

                // OPTIONAL: Notify admins about new student registration
                try {
                    const admins = await User.find({ role: 'admin' });
                    for (const admin of admins) {
                        await createNotification(
                            admin._id,
                            'new_student',
                            'New Student Registered',
                            `${name} has joined as a student.`,
                            '/admin/users'
                        );
                    }
                } catch (notifError) {
                    console.error('Error sending student registration notification:', notifError);
                    // Do not fail registration
                }
            } catch (studentError) {
                console.error('❌ Error creating student profile:', studentError);
                // Delete the user if profile creation fails
                await User.findByIdAndDelete(user._id);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error creating student profile' 
                });
            }
        } 
        else if (role === 'company') {
            try {
                const company = new Company({
                    userId: user._id,
                    companyName: name,
                    contactEmail: email,
                    verified: false,
                    hiringTeam: [],
                    locations: []
                });
                await company.save();
                console.log('✅ Company profile created');

                // NOTIFY ALL ADMINS about new company registration (pending verification)
                try {
                    const admins = await User.find({ role: 'admin' });
                    for (const admin of admins) {
                        await createNotification(
                            admin._id,
                            'new_company',
                            'New Company Registration',
                            `${name} has registered and needs verification.`,
                            '/admin/companies'
                        );
                    }
                } catch (notifError) {
                    console.error('Error sending company registration notification:', notifError);
                    // Do not fail registration
                }
            } catch (companyError) {
                console.error('❌ Error creating company profile:', companyError);
                // Delete the user if profile creation fails
                await User.findByIdAndDelete(user._id);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error creating company profile' 
                });
            }
        }
        // Admin doesn't need additional profile

        // Generate token
        const token = generateToken(user);

        // Remove password from output
        const userResponse = user.toObject();
        delete userResponse.password;

        console.log('✅ Registration successful for:', email, 'Role:', role);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('❌ Registration error details:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(', ') 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Error registering user: ' + error.message 
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        console.log('🔑 Login request received for email:', req.body.email);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check if account is active
        if (!user.isActive) {
            console.log('❌ Account deactivated:', email);
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been deactivated' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Update last active
        user.lastActive = Date.now();
        await user.save();

        // Get profile data based on role
        let profileData = null;
        if (user.role === 'student') {
            profileData = await Student.findOne({ userId: user._id });
        } else if (user.role === 'company') {
            profileData = await Company.findOne({ userId: user._id });
        }

        // Generate token
        const token = generateToken(user);

        console.log('✅ Login successful for:', user.email, 'Role:', user.role);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                profilePicture: user.profilePicture,
                phoneNumber: user.phoneNumber,
                profile: profileData
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error logging in' 
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Get profile data
        let profileData = null;
        if (user.role === 'student') {
            profileData = await Student.findOne({ userId: user._id });
        } else if (user.role === 'company') {
            profileData = await Company.findOne({ userId: user._id });
        }

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                profile: profileData
            }
        });

    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user' 
        });
    }
};

// @desc    Create admin (for testing)
// @route   POST /api/auth/create-admin
// @access  Public (disable in production)
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin already exists' 
            });
        }

        // Create admin
        const admin = new User({
            name: name || 'System Administrator',
            email: email || 'admin@jobportal.com',
            password: password || 'Admin@123',
            role: 'admin',
            isVerified: true,
            isActive: true
        });

        await admin.save();

        const token = generateToken(admin);

        res.status(201).json({
            success: true,
            message: 'Admin created',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ Create admin error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating admin' 
        });
    }
};