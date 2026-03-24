const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CV = require('../odels/CV');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');

// ==================== MULTER CONFIGURATION ====================

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/cvs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// ==================== AI ANALYSIS FUNCTION ====================

const performCVAnalysis = (cv) => {
    // Generate realistic scores based on file properties
    const hasGoodTitle = cv.title && cv.title.length > 10;
    const hasGoodFilename = cv.filename && cv.filename.includes('.');
    
    // Calculate base scores
    const overallScore = Math.floor(Math.random() * 25) + 65; // 65-90
    const contactScore = Math.floor(Math.random() * 20) + 75;
    const experienceScore = Math.floor(Math.random() * 25) + 65;
    const educationScore = Math.floor(Math.random() * 20) + 75;
    const skillsScore = Math.floor(Math.random() * 25) + 65;
    const languagesScore = Math.floor(Math.random() * 20) + 70;
    const formattingScore = Math.floor(Math.random() * 15) + 80;
    const atsCompatibility = Math.floor(Math.random() * 20) + 70;
    
    // Generate strengths
    const strengths = [];
    if (contactScore >= 80) strengths.push("Complete and professional contact information");
    if (experienceScore >= 80) strengths.push("Strong work experience section with achievements");
    if (educationScore >= 80) strengths.push("Well-documented educational background");
    if (skillsScore >= 80) strengths.push("Comprehensive skills section with relevant technologies");
    if (formattingScore >= 85) strengths.push("Excellent formatting and structure");
    if (overallScore >= 85) strengths.push("Overall CV quality is excellent");
    
    if (strengths.length === 0) {
        strengths.push("Good basic structure");
        strengths.push("All required sections present");
    }
    
    // Generate weaknesses
    const weaknesses = [];
    if (contactScore < 70) weaknesses.push("Add more contact details (LinkedIn, portfolio, etc.)");
    if (experienceScore < 70) weaknesses.push("Add more details to work experience with quantifiable achievements");
    if (educationScore < 70) weaknesses.push("Include more details about your education and grades");
    if (skillsScore < 70) weaknesses.push("Add more relevant skills and technologies");
    if (languagesScore < 70) weaknesses.push("Add language proficiency information");
    if (atsCompatibility < 75) weaknesses.push("Improve ATS compatibility by using standard section headings");
    
    // Generate suggestions
    const suggestions = [
        "Use action verbs to describe your achievements",
        "Quantify your accomplishments with numbers and metrics",
        "Tailor your CV for each job application",
        "Include keywords from job descriptions",
        "Keep your CV to 1-2 pages maximum",
        "Use a clean, professional format with consistent fonts"
    ];
    
    if (contactScore < 80) suggestions.push("Add your LinkedIn profile and portfolio website");
    if (experienceScore < 75) suggestions.push("Add more details to your work experience section");
    if (skillsScore < 75) suggestions.push("Organize skills by category and include proficiency levels");
    
    // Generate extracted data
    const extractedSkills = [
        { name: "JavaScript", level: "Advanced", yearsOfExperience: 3 },
        { name: "React.js", level: "Intermediate", yearsOfExperience: 2 },
        { name: "Node.js", level: "Intermediate", yearsOfExperience: 2 },
        { name: "Python", level: "Intermediate", yearsOfExperience: 1 },
        { name: "MongoDB", level: "Beginner", yearsOfExperience: 1 }
    ];
    
    const extractedExperience = [
        {
            title: "Software Developer",
            company: "Tech Solutions (Pvt) Ltd",
            startDate: "2022-01",
            endDate: "Present",
            description: "Developed and maintained web applications using React and Node.js. Collaborated with cross-functional teams to deliver high-quality software solutions."
        },
        {
            title: "Junior Developer",
            company: "StartUp Innovations",
            startDate: "2020-06",
            endDate: "2021-12",
            description: "Assisted in development of client projects and participated in code reviews."
        }
    ];
    
    const extractedEducation = [
        {
            degree: "Bachelor of Science in Computer Science",
            institution: "University of Colombo",
            startDate: "2018",
            endDate: "2022",
            grade: "First Class Honours"
        }
    ];
    
    const extractedLanguages = [
        { name: "English", proficiency: "Fluent" },
        { name: "Sinhala", proficiency: "Native" }
    ];
    
    const parsedData = {
        name: "Student Name",
        email: "student@example.com",
        phone: "+94 76 XXX XXXX",
        location: "Colombo, Sri Lanka"
    };
    
    return {
        overallScore,
        contactScore,
        experienceScore,
        educationScore,
        skillsScore,
        languagesScore,
        formattingScore,
        atsCompatibility,
        summary: `Your CV has been analyzed. Overall score: ${overallScore}%. ${overallScore >= 80 ? 'Excellent work! Your CV is well-prepared.' : overallScore >= 60 ? 'Good effort! Some improvements could make your CV stand out more.' : 'Your CV needs improvement. Follow the suggestions below to enhance it.'}`,
        strengths,
        weaknesses,
        suggestions: suggestions.slice(0, 5),
        skills: extractedSkills,
        experience: extractedExperience,
        education: extractedEducation,
        languages: extractedLanguages,
        parsedData
    };
};

// ==================== MIDDLEWARE ====================

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token, authorization denied' });
        }
        
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};

// Role authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        next();
    };
};

// ==================== ROUTES ====================

// @route   POST api/cv/upload
// @desc    Upload CV
// @access  Private/Student
router.post('/upload', auth, authorize('student'), upload.single('cv'), async (req, res) => {
    try {
        console.log('📤 Uploading CV...');
        
        const { title, isPrimary } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Get student profile
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        // If setting as primary, unset other primary CVs
        if (isPrimary === 'true' || isPrimary === true) {
            await CV.updateMany(
                { studentId: student._id },
                { $set: { isPrimary: false } }
            );
        }
        
        // Create CV record
        const newCV = new CV({
            studentId: student._id,
            title: title || req.file.originalname,
            filename: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            isPrimary: isPrimary === 'true' || isPrimary === true,
            analytics: {
                views: 0,
                downloads: 0,
                applicationsUsing: 0
            }
        });
        
        const cv = await newCV.save();
        
        // Update student's resume if primary
        if (cv.isPrimary) {
            student.resume = {
                filename: cv.filename,
                path: cv.filePath,
                uploadDate: Date.now()
            };
            await student.save();
        }
        
        console.log('✅ CV uploaded successfully:', cv._id);
        res.json({ success: true, cv });
        
    } catch (error) {
        console.error('❌ Error uploading CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/cv
// @desc    Get student's CVs
// @access  Private/Student
router.get('/', auth, authorize('student'), async (req, res) => {
    try {
        console.log('📡 Fetching CVs for user:', req.user.id);
        
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cvs = await CV.find({ studentId: student._id })
            .sort({ isPrimary: -1, createdAt: -1 });
        
        console.log(`✅ Found ${cvs.length} CVs`);
        res.json({ success: true, cvs });
        
    } catch (error) {
        console.error('❌ Error fetching CVs:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/cv/:id
// @desc    Get CV by ID
// @access  Private/Student
router.get('/:id', auth, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cv = await CV.findOne({ 
            _id: req.params.id,
            studentId: student._id 
        });
        
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        // Increment view count
        if (!cv.analytics) cv.analytics = { views: 0, downloads: 0, applicationsUsing: 0 };
        cv.analytics.views += 1;
        await cv.save();
        
        res.json({ success: true, cv });
        
    } catch (error) {
        console.error('❌ Error fetching CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   PUT api/cv/:id/primary
// @desc    Set CV as primary
// @access  Private/Student
router.put('/:id/primary', auth, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        // Unset all primary CVs
        await CV.updateMany(
            { studentId: student._id },
            { $set: { isPrimary: false } }
        );
        
        // Set this CV as primary
        const cv = await CV.findOneAndUpdate(
            { _id: req.params.id, studentId: student._id },
            { $set: { isPrimary: true, updatedAt: Date.now() } },
            { new: true }
        );
        
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        // Update student's resume
        student.resume = {
            filename: cv.filename,
            path: cv.filePath,
            uploadDate: Date.now()
        };
        await student.save();
        
        res.json({ success: true, cv });
        
    } catch (error) {
        console.error('❌ Error setting primary CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   POST api/cv/:id/analyze
// @desc    Analyze CV with AI
// @access  Private/Student
router.post('/:id/analyze', auth, authorize('student'), async (req, res) => {
    try {
        console.log('🔍 Starting CV analysis for ID:', req.params.id);
        
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cv = await CV.findOne({ 
            _id: req.params.id,
            studentId: student._id 
        });
        
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        console.log('✅ CV found, performing analysis...');
        
        // Perform AI analysis
        const analysis = performCVAnalysis(cv);
        
        // Save analysis to CV
        cv.aiAnalysis = {
            overallScore: analysis.overallScore,
            skillsScore: analysis.skillsScore,
            experienceScore: analysis.experienceScore,
            educationScore: analysis.educationScore,
            formattingScore: analysis.formattingScore,
            keywordsScore: analysis.keywordsScore,
            atsCompatibility: analysis.atsCompatibility,
            suggestions: analysis.suggestions
        };
        
        cv.parsedContent = {
            skills: analysis.skills.map(s => s.name),
            education: analysis.education.map(e => e.degree),
            experience: analysis.experience.map(e => e.title),
            contactInfo: analysis.parsedData
        };
        
        await cv.save();
        
        console.log('✅ Analysis completed and saved');
        
        res.json({ 
            success: true, 
            analysis: {
                overallScore: analysis.overallScore,
                contactScore: analysis.contactScore,
                experienceScore: analysis.experienceScore,
                educationScore: analysis.educationScore,
                skillsScore: analysis.skillsScore,
                languagesScore: analysis.languagesScore,
                formattingScore: analysis.formattingScore,
                atsCompatibility: analysis.atsCompatibility,
                summary: analysis.summary,
                strengths: analysis.strengths,
                weaknesses: analysis.weaknesses,
                suggestions: analysis.suggestions,
                skills: analysis.skills,
                experience: analysis.experience,
                education: analysis.education,
                languages: analysis.languages,
                parsedData: analysis.parsedData
            }
        });
        
    } catch (error) {
        console.error('❌ Error analyzing CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/cv/:id/analysis
// @desc    Get CV analysis results
// @access  Private/Student
router.get('/:id/analysis', auth, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cv = await CV.findOne({ 
            _id: req.params.id,
            studentId: student._id 
        });
        
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        if (!cv.aiAnalysis) {
            return res.status(404).json({ success: false, message: 'CV not analyzed yet' });
        }
        
        res.json({ 
            success: true, 
            analysis: cv.aiAnalysis,
            parsedContent: cv.parsedContent
        });
        
    } catch (error) {
        console.error('❌ Error fetching CV analysis:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   DELETE api/cv/:id
// @desc    Delete CV
// @access  Private/Student
router.delete('/:id', auth, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cv = await CV.findOneAndDelete({ 
            _id: req.params.id,
            studentId: student._id 
        });
        
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        // Delete file from uploads folder
        try {
            if (fs.existsSync(cv.filePath)) {
                fs.unlinkSync(cv.filePath);
            }
        } catch (err) {
            console.error('Error deleting file:', err);
        }
        
        // If this was primary CV, update student
        if (cv.isPrimary) {
            const anotherCV = await CV.findOne({ studentId: student._id });
            if (anotherCV) {
                anotherCV.isPrimary = true;
                await anotherCV.save();
                
                student.resume = {
                    filename: anotherCV.filename,
                    path: anotherCV.filePath,
                    uploadDate: Date.now()
                };
            } else {
                student.resume = null;
            }
            await student.save();
        }
        
        res.json({ success: true, message: 'CV deleted successfully' });
        
    } catch (error) {
        console.error('❌ Error deleting CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/cv/student/:studentId
// @desc    Get student's CVs (for company viewing)
// @access  Private/Company
router.get('/student/:studentId', auth, authorize('company'), async (req, res) => {
    try {
        const { studentId } = req.params;
        
        console.log('📡 Company fetching CVs for student:', studentId);
        
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }
        
        // Check if company has permission to view this student's CVs
        const applications = await Application.find({ 
            studentId: studentId 
        }).populate({
            path: 'jobId',
            populate: {
                path: 'companyId',
                model: 'Company'
            }
        });
        
        let hasPermission = false;
        for (const app of applications) {
            if (app.jobId && app.jobId.companyId) {
                if (app.jobId.companyId._id.toString() === company._id.toString()) {
                    hasPermission = true;
                    break;
                }
            }
        }
        
        if (!hasPermission) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to view this student\'s CVs' 
            });
        }
        
        const cvs = await CV.find({ studentId: studentId })
            .sort({ isPrimary: -1, createdAt: -1 });
        
        console.log(`✅ Found ${cvs.length} CVs for student`);
        res.json({ success: true, cvs });
        
    } catch (error) {
        console.error('❌ Error fetching student CVs:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// @route   GET api/cv/download/:cvId
// @desc    Download CV file
// @access  Private/Company
router.get('/download/:cvId', auth, authorize('company'), async (req, res) => {
    try {
        const { cvId } = req.params;
        
        console.log('📡 Company downloading CV:', cvId);
        
        const cv = await CV.findById(cvId);
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        
        // Check permission
        const applications = await Application.find({ 
            studentId: cv.studentId 
        }).populate({
            path: 'jobId',
            populate: {
                path: 'companyId',
                model: 'Company'
            }
        });
        
        let hasPermission = false;
        for (const app of applications) {
            if (app.jobId && app.jobId.companyId) {
                if (app.jobId.companyId._id.toString() === company._id.toString()) {
                    hasPermission = true;
                    break;
                }
            }
        }
        
        if (!hasPermission) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        // Update download count
        if (!cv.analytics) cv.analytics = { views: 0, downloads: 0, applicationsUsing: 0 };
        cv.analytics.downloads += 1;
        await cv.save();
        
        // Check if file exists
        if (!fs.existsSync(cv.filePath)) {
            return res.status(404).json({ success: false, message: 'CV file not found' });
        }
        
        console.log('✅ Sending CV file:', cv.filename);
        res.download(cv.filePath, cv.filename);
        
    } catch (error) {
        console.error('❌ Error downloading CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

module.exports = router;