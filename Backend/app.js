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
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const cvsDir = path.join(__dirname, 'uploads', 'cvs');
if (!fs.existsSync(cvsDir)) {
    fs.mkdirSync(cvsDir, { recursive: true });
    console.log('✅ CV upload directory created');
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// ==================== SECURITY MIDDLEWARE ====================

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

if (compression) {
    app.use(compression());
}

if (rateLimit) {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        }
    });
    app.use('/api/', limiter);
    console.log('✅ Rate limiting enabled');
}

// ==================== CORS CONFIGURATION ====================

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || CLIENT_URLS.indexOf(origin) !== -1 || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
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

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// ==================== DATABASE CONNECTION WITH KEEP-ALIVE ====================

let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    family: 4,
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 10000,
    waitQueueTimeoutMS: 20000
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, dbOptions);
        isConnected = true;
        connectionAttempts = 0;
        console.log('\n=================================');
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${conn.connection.name || 'JobApplicationPlatform'}`);
        console.log(`📍 Host: ${conn.connection.host || 'localhost'}`);
        console.log('=================================\n');
    } catch (err) {
        isConnected = false;
        connectionAttempts++;
        console.error('\n❌ MongoDB Connection Error:', err.message);
        
        if (connectionAttempts < MAX_RETRIES) {
            console.log(`🔄 Retrying connection in ${RETRY_DELAY/1000} seconds... (Attempt ${connectionAttempts}/${MAX_RETRIES})`);
            setTimeout(connectDB, RETRY_DELAY);
        } else {
            console.error('\n⚠️ MongoDB connection failed after multiple attempts.');
            console.error('   The server will continue but database operations may fail.');
            console.error('   Please ensure MongoDB is running and restart the server.\n');
        }
    }
};

// Initialize connection
setTimeout(connectDB, 1000);

// Keep connection alive with periodic ping
setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
        try {
            await mongoose.connection.db.admin().ping();
            if (!isConnected) {
                isConnected = true;
                console.log('✅ MongoDB Reconnected');
            }
        } catch (err) {
            if (isConnected) {
                isConnected = false;
                console.log('⚠️ MongoDB connection lost, attempting to reconnect...');
                connectDB();
            }
        }
    } else if (mongoose.connection.readyState === 0 && !isConnected) {
        connectDB();
    }
}, 30000);

// Connection event handlers
mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('✅ MongoDB Connection Established');
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.log('⚠️ MongoDB Connection Lost');
    setTimeout(connectDB, 5000);
});

mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('✅ MongoDB Reconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('⚠️ MongoDB Error:', err.message);
});

// Middleware to ensure DB connection for critical routes
const ensureDbConnection = async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        if (connectionAttempts < MAX_RETRIES) {
            return res.status(503).json({
                success: false,
                message: 'Database is connecting, please try again in a moment.',
                retry: true
            });
        } else {
            return res.status(503).json({
                success: false,
                message: 'Database connection unavailable. Please check your MongoDB server.',
                retry: false
            });
        }
    }
    next();
};

// Apply DB check to all API routes
app.use('/api', ensureDbConnection);

// ==================== IMPORT MODELS ====================

try {
    require('./models/User');
    require('./models/Student');
    require('./models/Company');
    require('./models/Post');
    require('./models/Job');
    require('./Models/Application');
    require('./Models/Interview');  // Changed from 'Models/Interview' to 'models/Interview'
    require('./models/CV');
    console.log('✅ All models loaded successfully');
} catch (err) {
    console.error('❌ Error loading models:', err.message);
}

// ==================== IMPORT ROUTES ====================

let authRoutes, userRoutes, studentRoutes, companyRoutes, postRoutes, jobRoutes, applicationRoutes;
let cvRoutes, notificationRoutes, messageRoutes, adminRoutes, searchRoutes, interviewRoutes, activityRoutes;

// Auth Routes
try {
    authRoutes = require('./routes/authRoutes');
    console.log('✅ authRoutes loaded');
} catch (err) {
    console.error('❌ Error loading authRoutes:', err.message);
    authRoutes = express.Router();
    authRoutes.all('*', (req, res) => {
        res.status(501).json({ success: false, message: 'Auth routes not implemented' });
    });
}

// User Routes
try {
    userRoutes = require('./routes/userRoutes');
    console.log('✅ userRoutes loaded');
} catch (err) {
    console.error('❌ Error loading userRoutes:', err.message);
    userRoutes = express.Router();
    userRoutes.all('*', (req, res) => {
        res.status(501).json({ success: false, message: 'User routes not implemented' });
    });
}

// Student Routes
try {
    studentRoutes = require('./routes/studentRoutes');
    console.log('✅ studentRoutes loaded');
} catch (err) {
    console.error('❌ Error loading studentRoutes:', err.message);
    studentRoutes = express.Router();
    studentRoutes.all('*', (req, res) => {
        res.status(501).json({ success: false, message: 'Student routes not implemented' });
    });
}

// Company Routes
try {
    companyRoutes = require('./routes/companyRoutes');
    console.log('✅ companyRoutes loaded');
} catch (err) {
    console.error('❌ Error loading companyRoutes:', err.message);
    companyRoutes = express.Router();
    companyRoutes.all('*', (req, res) => {
        res.status(501).json({ success: false, message: 'Company routes not implemented' });
    });
}

// Post Routes
try {
    postRoutes = require('./routes/postRoutes');
    console.log('✅ postRoutes loaded');
} catch (err) {
    console.error('❌ Error loading postRoutes:', err.message);
    postRoutes = express.Router();
    postRoutes.all('*', (req, res) => {
        res.status(501).json({ success: false, message: 'Post routes not implemented' });
    });
}

// Job Routes
try {
    jobRoutes = require('./routes/jobRoutes');
    console.log('✅ jobRoutes loaded');
} catch (err) {
    console.error('❌ Error loading jobRoutes:', err.message);
    jobRoutes = express.Router();
    jobRoutes.all('*', (req, res) => {
        res.status(501).json({ success: false, message: 'Job routes not implemented' });
    });
}

// Application Routes
try {
    applicationRoutes = require('./routes/applicationRoutes');
    console.log('✅ applicationRoutes loaded');
} catch (err) {
    console.error('❌ Error loading applicationRoutes:', err.message);
    applicationRoutes = express.Router();
    applicationRoutes.all('*', (req, res) => {
        res.status(501).json({ success: false, message: 'Application routes not implemented' });
    });
}

// CV Routes
try {
    cvRoutes = require('./routes/cvRoutes');
    console.log('✅ cvRoutes loaded');
} catch (err) {
    console.error('❌ Error loading cvRoutes:', err.message);
    cvRoutes = express.Router();
    cvRoutes.get('/', (req, res) => {
        res.json({ success: false, message: 'CV routes not available' });
    });
}

// Interview Routes - IMPORTANT: This is the main interview route
try {
    interviewRoutes = require('./routes/interviews'); // Changed from './Routes/interviewRoutes' to './routes/interviews'
    console.log('✅ interviewRoutes loaded from ./routes/interviews');
} catch (err) {
    console.error('❌ Error loading interviewRoutes:', err.message);
    interviewRoutes = express.Router();
    interviewRoutes.post('/', (req, res) => {
        res.status(501).json({ 
            success: false, 
            message: 'Interview routes not properly configured. Please check routes/interviews.js file.'
        });
    });
    interviewRoutes.get('/', (req, res) => {
        res.json({ success: false, message: 'Interview routes not available' });
    });
}

// Activity Routes
try {
    activityRoutes = require('./routes/activityRoutes');
    console.log('✅ activityRoutes loaded');
} catch (err) {
    console.log('⚠️ activityRoutes not found - creating fallback');
    activityRoutes = express.Router();
    activityRoutes.get('/recent', (req, res) => {
        res.json({ success: true, activities: [] });
    });
}

// Notification Routes
try {
    notificationRoutes = require('./routes/notificationRoutes');
    console.log('✅ notificationRoutes loaded');
} catch (err) {
    console.log('⚠️ notificationRoutes not found - optional');
    notificationRoutes = express.Router();
    notificationRoutes.get('/', (req, res) => {
        res.json({ success: true, notifications: [] });
    });
}

// Message Routes
try {
    messageRoutes = require('./routes/messageRoutes');
    console.log('✅ messageRoutes loaded');
} catch (err) {
    console.log('⚠️ messageRoutes not found - optional');
    messageRoutes = express.Router();
    messageRoutes.get('/recent', (req, res) => {
        res.json({ success: true, messages: [] });
    });
}

// Admin Routes
try {
    adminRoutes = require('./routes/adminRoutes');
    console.log('✅ adminRoutes loaded');
} catch (err) {
    console.log('⚠️ adminRoutes not found - optional');
    adminRoutes = express.Router();
}

// Search Routes
try {
    searchRoutes = require('./routes/searchRoutes');
    console.log('✅ searchRoutes loaded');
} catch (err) {
    console.log('⚠️ searchRoutes not found - optional');
    searchRoutes = express.Router();
}

// ==================== API ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/interviews', interviewRoutes);  // This is the main interview route
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

console.log('\n✅ API routes registered:');
console.log('   - /api/auth');
console.log('   - /api/users');
console.log('   - /api/students');
console.log('   - /api/companies');
console.log('   - /api/posts');
console.log('   - /api/jobs');
console.log('   - /api/applications');
console.log('   - /api/cv');
console.log('   - /api/interviews');  // Added to log
console.log('   - /api/notifications');
console.log('   - /api/messages');
console.log('   - /api/activities');
console.log('   - /api/admin');
console.log('   - /api/search');

// ==================== API HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
    
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        mongodb: {
            state: dbStateText,
            isConnected: dbState === 1,
            attempts: connectionAttempts
        },
        directories: {
            uploads: fs.existsSync(uploadsDir),
            cvs: fs.existsSync(cvsDir)
        },
        routes: {
            interviews: '/api/interviews'
        }
    });
});

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Job Portal API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            students: '/api/students',
            companies: '/api/companies',
            posts: '/api/posts',
            jobs: '/api/jobs',
            applications: '/api/applications',
            cv: '/api/cv',
            interviews: '/api/interviews',
            notifications: '/api/notifications',
            messages: '/api/messages',
            activities: '/api/activities',
            health: '/api/health'
        }
    });
});

app.get('/', (req, res) => {
    res.redirect('/api');
});

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
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload'
        });
    }
    next(err);
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }
    
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: 'Duplicate key error',
            field,
            error: `${field} already exists`
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            field: err.path
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }
    
    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB'
        });
    }
    
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    
    res.status(status).json({
        success: false,
        message,
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGINT', async () => {
    console.log('\n🔄 Gracefully shutting down...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Received SIGTERM, shutting down...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
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
        console.log(`⚙️  Environment: ${NODE_ENV}`);
        console.log(`📁 CV Uploads: ${cvsDir}`);
        console.log('=================================\n');
        
        if (socketIo) {
            try {
                const io = socketIo(server, {
                    cors: {
                        origin: CLIENT_URLS,
                        credentials: true
                    }
                });

                io.on('connection', (socket) => {
                    console.log('🔌 New client connected');
                    
                    if (socket.user) {
                        socket.join(`user:${socket.user.id}`);
                    }

                    socket.on('join-chat', (chatId) => {
                        socket.join(`chat:${chatId}`);
                    });

                    socket.on('leave-chat', (chatId) => {
                        socket.leave(`chat:${chatId}`);
                    });
                    
                    socket.on('disconnect', () => {
                        console.log('🔌 Client disconnected');
                    });
                });

                app.set('io', io);
                console.log('✅ Socket.io initialized');
            } catch (err) {
                console.log('⚠️ Socket.io initialization failed');
            }
        }
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is in use, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('❌ Server failed to start:', error.message);
            process.exit(1);
        }
    });
};

startServer(PORT);

module.exports = app;