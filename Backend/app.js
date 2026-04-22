const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ==================== OPTIONAL DEPENDENCIES ====================
let helmet, compression, rateLimit, morgan, socketIo;

try {
    helmet = require('helmet');
    console.log('✅ Helmet loaded');
} catch (err) {
    helmet = () => (req, res, next) => next();
}

try {
    compression = require('compression');
    console.log('✅ Compression loaded');
} catch (err) {
    compression = () => (req, res, next) => next();
}

try {
    rateLimit = require('express-rate-limit');
    console.log('✅ Rate limit loaded');
} catch (err) {
    rateLimit = null;
}

try {
    morgan = require('morgan');
    console.log('✅ Morgan loaded');
} catch (err) {
    morgan = null;
}

try {
    socketIo = require('socket.io');
    console.log('✅ Socket.io loaded');
} catch (err) {
    socketIo = null;
}

// ==================== ENVIRONMENT VARIABLES ====================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CLIENT_URLS = process.env.CLIENT_URLS 
    ? process.env.CLIENT_URLS.split(',') 
    : ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:3001'];

// ==================== CREATE DIRECTORIES ====================
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const cvsDir = path.join(__dirname, 'uploads', 'cvs');
if (!fs.existsSync(cvsDir)) fs.mkdirSync(cvsDir, { recursive: true });

const profilesDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// ==================== CORS CONFIGURATION (MOVED BEFORE RATE LIMITER) ====================
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            if (CLIENT_URLS.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log('❌ CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['x-auth-token'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==================== RATE LIMITER (NOW AFTER CORS) ====================
if (rateLimit) {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: NODE_ENV === 'development' ? 500 : 100,
        message: { success: false, message: 'Too many requests from this IP, please try again later.' }
    });
    app.use('/api/', limiter);
    console.log('✅ Rate limiting enabled');
}

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

if (compression) app.use(compression());

// ==================== BODY PARSER ====================
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ==================== STATIC FILES ====================
app.use('/uploads', express.static(uploadsDir));
app.use('/public', express.static(publicDir));

// ==================== LOGGING MIDDLEWARE ====================
if (morgan) {
    const accessLogStream = fs.createWriteStream(
        path.join(logDir, 'access.log'),
        { flags: 'a' }
    );
    app.use(morgan('combined', { stream: accessLogStream }));
    app.use(morgan('dev'));
    console.log('✅ Morgan logging enabled');
}

// Custom request logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// ==================== DATABASE CONNECTION CHECK ====================
app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.error(`❌ DB not connected - rejecting ${req.method} ${req.originalUrl}`);
        return res.status(503).json({
            success: false,
            message: 'Connection lost. Please try again.'
        });
    }
    next();
});

// ==================== DATABASE CONNECTION ====================
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    autoIndex: true,
    autoCreate: true
};

mongoose.connect(MONGO_URI, dbOptions)
    .then(() => {
        console.log('\n=================================');
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`📍 Host: ${mongoose.connection.host}`);
        console.log('=================================\n');
    })
    .catch(err => {
        console.error('\n❌ MongoDB Connection Error:', err.message);
        console.error('   Please ensure MongoDB is running.\n');
    });

mongoose.connection.on('connected', () => console.log('✅ MongoDB Connection Established'));
mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB Connection Lost – auto-reconnect will attempt'));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB Reconnected'));
mongoose.connection.on('error', (err) => console.error('⚠️ MongoDB Error:', err.message));

// ==================== GRACEFUL SHUTDOWN ====================
const shutdown = async (signal) => {
    console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ==================== GLOBAL ERROR HANDLERS ====================
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

// ==================== IMPORT MODELS ====================
try {
    require('./models/User');
    require('./models/Student');
    require('./models/Company');
    require('./models/Post');
    require('./models/Job');
    require('./Models/Application');
    require('./Models/Interview');
    require('./models/CV');
    require('./models/Contact');
    require('./Models/Notification');
    require('./models/OTP');
    console.log('✅ All models loaded successfully');
} catch (err) {
    console.error('❌ Error loading models:', err.message);
}

// ==================== IMPORT ROUTES ====================
let authRoutes, userRoutes, studentRoutes, companyRoutes, postRoutes, jobRoutes, applicationRoutes;
let cvRoutes, notificationRoutes, messageRoutes, adminRoutes, searchRoutes, interviewRoutes, activityRoutes;
let contactRoutes, otpRoutes, feedbackRoutes;

const loadRoute = (path, fallbackMessage) => {
    try {
        const route = require(path);
        console.log(`✅ ${path} loaded`);
        return route;
    } catch (err) {
        console.error(`❌ Error loading ${path}:`, err.message);
        const router = express.Router();
        router.all('*', (req, res) => {
            res.status(501).json({ success: false, message: fallbackMessage });
        });
        return router;
    }
};

authRoutes          = loadRoute('./routes/authRoutes', 'Auth routes not implemented');
userRoutes          = loadRoute('./Routes/userRoutes', 'User routes not implemented');
studentRoutes       = loadRoute('./routes/studentRoutes', 'Student routes not implemented');
companyRoutes       = loadRoute('./routes/companyRoutes', 'Company routes not implemented');
postRoutes          = loadRoute('./routes/postRoutes', 'Post routes not implemented');
jobRoutes           = loadRoute('./Routes/jobRoutes', 'Job routes not implemented');
applicationRoutes   = loadRoute('./routes/applicationRoutes', 'Application routes not implemented');
cvRoutes            = loadRoute('./Routes/cvRoutes', 'CV routes not available');
interviewRoutes     = loadRoute('./routes/interviews', 'Interview routes not properly configured');
activityRoutes      = loadRoute('./routes/activityRoutes', 'Activity routes not available');
notificationRoutes  = loadRoute('./Routes/notificationRoutes', 'Notification routes not available');
messageRoutes       = loadRoute('./routes/messageRoutes', 'Message routes not available');
adminRoutes         = loadRoute('./routes/adminRoutes', 'Admin routes not available');
searchRoutes        = loadRoute('./routes/searchRoutes', 'Search routes not available');
contactRoutes       = loadRoute('./Routes/contactRoutes', 'Contact routes not implemented');
otpRoutes           = loadRoute('./routes/otpRoutes', 'OTP routes not implemented');
feedbackRoutes      = loadRoute('./routes/feedbackRoutes', 'Feedback routes not implemented');

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/feedback', feedbackRoutes);

console.log('\n✅ API routes registered:');
['auth','users','students','companies','posts','jobs','applications','cv','interviews',
 'notifications','messages','activities','admin','search','contact','otp','feedback'].forEach(r => {
    console.log(`   - /api/${r}`);
});

// ==================== HEALTH & INFO ====================
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        mongodb: { state: dbStateText, isConnected: dbState === 1 },
        directories: { uploads: fs.existsSync(uploadsDir), cvs: fs.existsSync(cvsDir), profiles: fs.existsSync(profilesDir) }
    });
});

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Job Portal API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth', users: '/api/users', students: '/api/students', companies: '/api/companies',
            posts: '/api/posts', jobs: '/api/jobs', applications: '/api/applications', cv: '/api/cv',
            interviews: '/api/interviews', notifications: '/api/notifications', messages: '/api/messages',
            activities: '/api/activities', contact: '/api/contact', otp: '/api/otp', feedback: '/api/feedback', health: '/api/health'
        }
    });
});

app.get('/', (req, res) => res.redirect('/api'));

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    }
    next(err);
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => ({ field: e.path, message: e.message }))
        });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ success: false, message: 'Duplicate key error', field, error: `${field} already exists` });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid ID format', field: err.path });
    }
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB' });
    }

    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({
        success: false,
        message,
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==================== START SERVER ====================
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log('\n=================================');
        console.log(`🚀 Server started on port ${port}`);
        console.log(`📍 URL: http://localhost:${port}`);
        console.log(`🔍 API: http://localhost:${port}/api`);
        console.log(`🔍 Health: http://localhost:${port}/api/health`);
        console.log(`📅 Interviews: http://localhost:${port}/api/interviews`);
        console.log(`📞 Contact: http://localhost:${port}/api/contact`);
        console.log(`📱 OTP: http://localhost:${port}/api/otp`);
        console.log(`💬 Feedback: http://localhost:${port}/api/feedback`);
        console.log(`⚙️  Environment: ${NODE_ENV}`);
        console.log(`📁 CV Uploads: ${cvsDir}`);
        console.log(`📁 Profile Pictures: ${profilesDir}`);
        console.log(`⏱️  Request timeout: DISABLED`);
        console.log(`🛡️  DB connection check: enabled`);
        console.log(`🌐 CORS: All origins allowed (development mode)`);
        console.log('=================================\n');

        if (socketIo) {
            try {
                const io = socketIo(server, { cors: { origin: CLIENT_URLS, credentials: true } });
                io.on('connection', (socket) => {
                    console.log('🔌 New client connected');
                    if (socket.user) socket.join(`user:${socket.user.id}`);
                    socket.on('join-chat', (chatId) => socket.join(`chat:${chatId}`));
                    socket.on('leave-chat', (chatId) => socket.leave(`chat:${chatId}`));
                    socket.on('disconnect', () => console.log('🔌 Client disconnected'));
                });
                app.set('io', io);
                console.log('✅ Socket.io initialized');
            } catch (err) {
                console.log('⚠️ Socket.io initialization failed');
            }
        }
    });

    server.timeout = 0;

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is in use, trying port ${port + 1}...`);
            server.close();
            startServer(port + 1);
        } else {
            console.error('❌ Server failed to start:', error.message);
            process.exit(1);
        }
    });
};

startServer(PORT);

module.exports = app;