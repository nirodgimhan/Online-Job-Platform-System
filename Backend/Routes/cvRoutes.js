const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CV = require('../Models/CV');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// ==================== MULTER CONFIGURATION ====================

const uploadDir = path.join(__dirname, '../uploads/cvs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ CV upload directory created');
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ==================== ROUTES ====================

// GET all CVs
router.get('/', auth, async (req, res) => {
    try {
        console.log('📡 GET /api/cv - User:', req.user.id);
        
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cvs = await CV.find({ studentId: student._id }).sort({ isPrimary: -1, createdAt: -1 });
        
        res.json({ success: true, cvs });
        
    } catch (error) {
        console.error('Error fetching CVs:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// POST upload CV
router.post('/upload', auth, upload.single('cv'), async (req, res) => {
    try {
        console.log('📤 POST /api/cv/upload');
        
        const { title, isPrimary } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        if (isPrimary === 'true' || isPrimary === true) {
            await CV.updateMany({ studentId: student._id }, { isPrimary: false });
        }
        
        const newCV = new CV({
            studentId: student._id,
            title: title || req.file.originalname,
            filename: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            isPrimary: isPrimary === 'true' || isPrimary === true,
            analytics: { views: 0, downloads: 0, applicationsUsing: 0 }
        });
        
        const cv = await newCV.save();
        
        if (cv.isPrimary) {
            student.resume = {
                filename: cv.filename,
                path: cv.filePath,
                uploadDate: Date.now()
            };
            await student.save();
        }
        
        res.json({ success: true, cv });
        
    } catch (error) {
        console.error('Error uploading CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// PUT set primary
router.put('/:id/primary', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        await CV.updateMany({ studentId: student._id }, { isPrimary: false });
        
        const cv = await CV.findOneAndUpdate(
            { _id: req.params.id, studentId: student._id },
            { isPrimary: true, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        student.resume = {
            filename: cv.filename,
            path: cv.filePath,
            uploadDate: Date.now()
        };
        await student.save();
        
        res.json({ success: true, cv });
        
    } catch (error) {
        console.error('Error setting primary CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// POST analyze CV
router.post('/:id/analyze', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cv = await CV.findOne({ _id: req.params.id, studentId: student._id });
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        // Mock analysis data
        const analysis = {
            overallScore: 78,
            contactScore: 85,
            experienceScore: 72,
            educationScore: 88,
            skillsScore: 75,
            languagesScore: 70,
            formattingScore: 82,
            atsCompatibility: 76,
            summary: "Your CV looks good! Here are some suggestions to improve it.",
            strengths: ["Clear formatting", "Good education section", "Relevant skills listed"],
            weaknesses: ["Add more quantifiable achievements", "Include LinkedIn profile"],
            suggestions: ["Add numbers to your achievements", "Include a professional summary"],
            skills: [{ name: "JavaScript", level: "Advanced" }, { name: "React", level: "Intermediate" }],
            experience: [{ title: "Developer", company: "Tech Corp", startDate: "2022", endDate: "Present" }],
            education: [{ degree: "BSc Computer Science", institution: "University", startDate: "2018", endDate: "2022" }],
            languages: [{ name: "English", proficiency: "Fluent" }],
            parsedData: { name: "Student", email: "student@example.com", phone: "+94 76 XXX XXXX", location: "Colombo" }
        };
        
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
        
        res.json({ success: true, analysis });
        
    } catch (error) {
        console.error('Error analyzing CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// DELETE CV
router.delete('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        
        const cv = await CV.findOneAndDelete({ _id: req.params.id, studentId: student._id });
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        
        try {
            if (fs.existsSync(cv.filePath)) {
                fs.unlinkSync(cv.filePath);
            }
        } catch (err) {}
        
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
        console.error('Error deleting CV:', error.message);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

module.exports = router;