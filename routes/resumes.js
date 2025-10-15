const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/resumes/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /pdf|doc|docx/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only PDF and Word documents are allowed'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload resume
router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const resume = new Resume({
            userId: req.session.user._id,
            originalName: req.file.originalname,
            fileName: req.file.filename,
            path: req.file.path,
            size: req.file.size
        });

        await resume.save();
        res.json({ success: true, message: 'Resume uploaded successfully', data: resume });
    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ success: false, error: 'Error uploading resume' });
    }
});

// Get user's resumes
router.get('/my-resumes', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const resumes = await Resume.find({ userId: req.session.user._id })
            .sort({ createdAt: -1 });
            
        res.json({ success: true, data: resumes });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ success: false, error: 'Error fetching resumes' });
    }
});

// Download resume
router.get('/download/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.session.user._id
        });

        if (!resume) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }

        const filePath = path.join(__dirname, '..', resume.path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        res.download(filePath, resume.originalName);
    } catch (error) {
        console.error('Error downloading resume:', error);
        res.status(500).json({ success: false, error: 'Error downloading resume' });
    }
});

// Delete resume
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const resume = await Resume.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.user._id
        });

        if (!resume) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }

        // Delete the file
        const filePath = path.join(__dirname, '..', resume.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ success: false, error: 'Error deleting resume' });
    }
});

module.exports = router;
