require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Import models and routes
const PremiumMaterial = require('./models/PremiumMaterial');
const PremiumUser = require('./models/PremiumUser');
const CrashCourse = require('./models/CrashCourse');
const CrashCourseEnrollment = require('./models/CrashCourseEnrollment');
const Workshop = require('./models/Workshop');
const WorkshopRegistration = require('./models/WorkshopRegistration');
const CrashContact = require('./models/CrashContact');
const resumesRouter = require('./routes/resumes');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'career-redefine-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// Core middleware MUST be applied before routes
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://careerredefinee_db_user:AaBb12%4012@careerredefine.qqk8sno.mongodb.net/?retryWrites=true&w=majority&appName=careerredefine';

// Job Schema
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Public: register for a specific workshop
app.post('/api/workshops/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, whatsapp, email, message } = req.body;
    if (!name || !whatsapp || !email) {
      return res.status(400).json({ success: false, error: 'Name, WhatsApp, and email are required' });
    }
    const ws = await Workshop.findById(id);
    if (!ws) return res.status(404).json({ success: false, error: 'Workshop not found' });
    const reg = new WorkshopRegistration({ workshop: id, name, whatsapp, email, message: message || '' });
    await reg.save();
    // Try to send emails (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: adminEmail,
        subject: `New Workshop Registration: ${ws.title}`,
        text: `Workshop: ${ws.title}\nName: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}\nMessage: ${message || ''}`
      });
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: `Registration Received - ${ws.title}`,
        text: `Hello ${name},\n\nThank you for registering for the workshop "${ws.title}". We will contact you with details.\n\nDetails:\nWhatsApp: ${whatsapp}\nMessage: ${message || ''}\n\nBest Regards,\nCareer Redefine`
      });
    } catch (mailErr) {
      console.warn('Workshop registration email failed:', mailErr?.message || mailErr);
    }
    res.json({ success: true, registration: reg });
  } catch (err) {
    console.error('Workshop registration error:', err);
    res.status(500).json({ success: false, error: 'Failed to register' });
  }
});

const Job = mongoose.model('Job', jobSchema);

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));




// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dizzyhird',
  api_key: process.env.CLOUDINARY_API_KEY || '644853658274247',
  api_secret: process.env.CLOUDINARY_API_SECRET || '6HjBg1Nuc8xTlq4-1Nsabh96Deo'
});

// Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'career-redefine',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
  },
});

const upload = multer({ storage: storage });

// (moved middleware above)

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Session configuration
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Job posting routes
app.post('/api/jobs', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    const { title, company, location, salary, description, requirements, link } = req.body;

    // Basic validation
    if (!title || !company || !location || !salary || !description || !requirements || !link) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Create new job
    const newJob = new Job({
      title,
      company,
      location,
      salary,
      description,
      requirements,
      link
    });

    // Save to database
    await newJob.save();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to post job',
      details: error.message
    });
  }
});

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      details: error.message
    });
  }
});

const Resume = require('./models/Resume');
const User = require('./models/User');
const materialsByIdRouter = require('./api/materials-by-id');
app.use('/api/premium/materials', materialsByIdRouter);

// Mount resume routes
app.use('/api/resumes', resumesRouter);

// Premium Users API
app.post('/api/admin/premium/users', async (req, res) => {
    try {
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        
        // Check if user is admin
        if (!req.session.user || !req.session.user.isAdmin) {
            console.log('Admin access denied - user not admin');
            return res.status(403).json({ 
                success: false, 
                error: 'Admin access required' 
            });
        }

        const { name, email, phone, password, plan, accessLevel, features } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            console.log('Validation failed - missing required fields');
            return res.status(400).json({ 
                success: false, 
                error: 'Name, email, and password are required',
                received: { name: !!name, email: !!email, password: !!password }
            });
        }

        // Check if user already exists
        const existingUser = await PremiumUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'A user with this email already exists' 
            });
        }

        // Create new premium user
        const premiumUser = new PremiumUser({
            name,
            email,
            phone: phone || '',
            password, // In production, you should hash the password before saving
            plan: plan || 'basic',
            accessLevel: accessLevel || 'standard',
            features: {
                allCourses: features?.allCourses || false,
                mentorship: features?.mentorship || false,
                jobAssistance: features?.jobAssistance || false,
                analytics: features?.analytics || false,
                studyGroups: features?.studyGroups || false,
                premiumSupport: features?.premiumSupport || false
            },
            subscriptionStart: new Date(),
            // Set subscription end date (e.g., 1 month from now)
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        await premiumUser.save();

        // In production, you might want to:
        // 1. Hash the password before saving
        // 2. Send a welcome email
        // 3. Generate a JWT token for the new user

        res.status(201).json({
            success: true,
            message: 'Premium user created successfully',
            user: {
                id: premiumUser._id,
                name: premiumUser.name,
                email: premiumUser.email,
                plan: premiumUser.plan,
                accessLevel: premiumUser.accessLevel,
                features: premiumUser.features
            }
        });

    } catch (error) {
        console.error('Error creating premium user:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create premium user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin: Get all resumes
app.get('/api/admin/resumes', async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let query = {};
        if (search) {
            query.$text = { $search: search };
        }

        const [resumes, total] = await Promise.all([
            Resume.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('user', 'name email')
                .lean(),
            Resume.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: resumes,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch resumes' });
    }
});

// Admin: Delete a resume
app.delete('/api/admin/resumes/:id', async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(resume.publicId);
        
        // Delete from database
        await Resume.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ success: false, error: 'Failed to delete resume' });
    }
});

// Configure multer for in-memory storage
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

app.post('/api/resumes', uploadMemory.single('resume'), async (req, res) => {
  try {
      console.log("📥 Incoming resume upload request");

      if (!req.file) {
          console.error("❌ No file uploaded");
          return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      console.log("📄 File received:", req.file.originalname, req.file.mimetype, req.file.size);

      // Convert buffer to base64 for Cloudinary
      const fileBase64 = req.file.buffer.toString('base64');
      const fileDataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

      console.log("☁️ Uploading to Cloudinary...");
      const cloudinaryRes = await cloudinary.uploader.upload(fileDataUri, {
          resource_type: "auto",
          folder: "resumes",
          public_id: `resume_${Date.now()}`
      });
      console.log("✅ Cloudinary upload success:", cloudinaryRes.secure_url);

      // Get user information
      const user = await User.findById(req.session.user?._id);
      if (!user) {
          // Clean up the uploaded file if user not found
          await cloudinary.uploader.destroy(cloudinaryRes.public_id);
          return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      console.log("🗄 Saving resume to MongoDB...");
      const resume = new Resume({
          url: cloudinaryRes.secure_url,
          originalName: req.file.originalname,
          publicId: cloudinaryRes.public_id,
          user: user._id,
          userEmail: user.email,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          status: 'pending',
          uploadedAt: new Date()
      });
      
      await resume.save();
      console.log("✅ Resume saved:", resume);
      
      // Update user's resume reference if needed
      if (!user.resume) {
          user.resume = resume._id;
          await user.save();
      }

      return res.json({ 
          success: true, 
          resume: {
              url: resume.url,
              originalName: resume.originalName,
              uploadedAt: resume.uploadedAt
          }
      });
  } catch (error) {
      console.error('💥 Resume upload error:', error);
      return res.status(500).json({
          success: false,
          error: error.message || 'Upload failed',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
});


const callRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const CallRequest = mongoose.models.CallRequest || mongoose.model('CallRequest', callRequestSchema);


// Course Schema
const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  video: String,
  price: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  duration: String,
  instructor: String,
  videoDurationMinutes: { type: Number, default: 0 }, // Total video duration in minutes
  link: String, // Optional page link for the course
  createdAt: { type: Date, default: Date.now }
});

const Course = mongoose.model('Course', courseSchema);

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 }, // Progress percentage (0-100)
  watchedMinutes: { type: Number, default: 0 }, // Minutes watched
  completed: { type: Boolean, default: false },
  certificateGenerated: { type: Boolean, default: false }
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

// Certificate Schema
const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  certificateId: { type: String, unique: true },
  generatedAt: { type: Date, default: Date.now },
  downloadCount: { type: Number, default: 0 }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// Premium User Schema
const premiumUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  dob: Date,
  skills: [String],
  password: { type: String, required: true },
  profilePic: { type: String, default: '/images/default-avatar.png' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  plan: { type: String, enum: ['basic', 'advanced', 'enterprise'], default: 'basic' },
  accessLevel: { type: String, enum: ['standard', 'priority', 'vip'], default: 'standard' },
  features: {
    allCourses: { type: Boolean, default: true },
    mentorship: { type: Boolean, default: true },
    jobAssistance: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true },
    studyGroups: { type: Boolean, default: true },
    premiumSupport: { type: Boolean, default: true },
    assessments: { type: Boolean, default: true },
    quizzes: { type: Boolean, default: true },
    studyMaterials: { type: Boolean, default: true },
    liveClasses: { type: Boolean, default: true }
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


// Premium Assessment Schema
const premiumAssessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['data-science', 'web-development', 'ai-ml', 'cloud-computing'], required: true },
  timeLimit: { type: Number, default: 30 }, // in minutes
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 1 }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const PremiumAssessment = mongoose.model('PremiumAssessment', premiumAssessmentSchema);

// Premium Material Schema
const premiumMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['data-science', 'web-development', 'ai-ml'], required: true },
  fileUrl: String, // Cloudinary URL
  fileType: { type: String, enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx'] },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

//const PremiumMaterial = mongoose.model('PremiumMaterial', premiumMaterialSchema);

// Premium Group Schema
const premiumGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  maxMembers: { type: Number, default: 10 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PremiumUser' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const PremiumGroup = mongoose.model('PremiumGroup', premiumGroupSchema);

// Course Query Schema
const courseQuerySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  courseTitle: String,
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'replied', 'closed'], default: 'pending' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  reply: String,
  repliedAt: Date,
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const CourseQuery = mongoose.model('CourseQuery', courseQuerySchema);

// Payment Schema
const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true },
  paymentScreenshot: String, // Cloudinary URL
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNotes: String
});

const Payment = mongoose.model('Payment', paymentSchema);

// Blog Schema
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAdmin: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model('Blog', blogSchema);

// Job Schema - defined at the top of the file

// Job Routes
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    console.log('Received job submission:', req.body); // Log the request body
    
    if (!req.session.user || !req.session.user.isAdmin) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { title, company, location, salary, description, requirements, link } = req.body;
    console.log('Parsed job data:', { title, company, location, salary, description, requirements, link });

    // Check for missing fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!company) missingFields.push('company');
    if (!location) missingFields.push('location');
    if (!salary) missingFields.push('salary');
    if (!description) missingFields.push('description');
    if (!requirements) missingFields.push('requirements');
    if (!link) missingFields.push('link');

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required',
        missingFields: missingFields
      });
    }

    const newJob = new Job({
      title,
      company,
      location,
      salary,
      description,
      requirements,
      link
    });

    await newJob.save();
    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ success: false, error: 'Failed to create job' });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ success: false, error: 'Failed to delete job' });
  }
});

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  time: String,
  reason: String,
  status: { type: String, default: 'pending' },
  meetingLink: { type: String, default: '' }, // Optional meeting link for appointments
  createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: Number,
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Nodemailer configuration
let transporter;
const EMAIL_USER = process.env.EMAIL_USER || 'careerredefinee@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'xzcucouyjgfrpatn';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

try {
  // Prefer explicit SMTP to avoid provider-specific auth edge cases
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
  const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : SMTP_PORT === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });

  // Verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('SMTP Connection Error:', error);
    } else {
      console.log('SMTP Server is ready to take our messages');
    }
  });
} catch (error) {
  console.error('Error initializing email transporter:', error);
}

// Create or update default admin
async function createDefaultAdmin() {
  try {
    const email = 'shannu@admin.com';
    const password = '66770000';
    const existing = await User.findOne({ email });
    if (!existing) {
      const admin = new User({
        name: 'Admin',
        email,
        password,
        isAdmin: true
      });
      await admin.save();
      console.log('Default admin created with requested credentials');
    } else {
      // Ensure correct password and admin flag
      let changed = false;
      if (existing.password !== password) { existing.password = password; changed = true; }
      if (!existing.isAdmin) { existing.isAdmin = true; changed = true; }
      if (changed) {
        await existing.save();
        console.log('Default admin updated with requested credentials');
      } else {
        console.log('Default admin already up-to-date');
      }
    }
  } catch (error) {
    console.error('Error creating/updating admin:', error);
  }
}

createDefaultAdmin();

// Serve about.html at /about
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'courses.html'));
});

app.get('/workshops', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'workshops.html'));
});

app.get('/tools', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tools.html'));
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

// Contact route
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/jobs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'jobs.html'));
});

app.get('/reviews', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reviews.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
// Get only admin blogs
app.get('/api/admin-blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ isAdmin: true })
      .populate('comments.user', 'name')  // Populate comment user names
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error('Failed to fetch admin blogs:', error);
    res.status(500).json({ error: 'Failed to fetch admin blogs' });
  }
});

app.get('/blogs/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});



// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Send OTP email
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'Career Redefine - OTP Verification',
      text: `Your OTP for registration is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    // Store user data temporarily in session
    req.session.tempUser = { name, email, phone, password, otp };
    
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Registration error:', error);
    res.json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const tempUser = req.session.tempUser;

    if (!tempUser) {
      return res.json({ success: false, message: 'Session expired' });
    }

    if (parseInt(otp) === tempUser.otp) {
      const user = new User({
        name: tempUser.name,
        email: tempUser.email,
        phone: tempUser.phone,
        password: tempUser.password
      });

      await user.save();
      req.session.tempUser = null;
      req.session.user = user;

      // Send welcome email to the user BEFORE sending the response
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: tempUser.email, // get email from tempUser
        subject: '🎉 Welcome to Career Redefine!',
        text: `Hello ${tempUser.name},\n\nWelcome to Career Redefine!\n\nYour account has been successfully created. You can now log in and start exploring our courses and services.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest Regards,\nCareer Redefine Team`
      });

      return res.json({ success: true, message: 'Registration successful' });
    } else {
      return res.json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.json({ success: false, message: 'OTP verification failed' });
  }
});

// Login API - supports both regular users and premium users
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password are required' });
    }
    
    // First check regular users
    let user = await User.findOne({ email });
    let isPremium = false;
    
    // If not found in regular users, check premium users
    if (!user) {
      user = await PremiumUser.findOne({ email });
      if (user) {
        isPremium = true;
      }
    }
    
    if (!user) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }
    
    // Check password (in production, this should be hashed)
    if (user.password !== password) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }
    
    // For premium users, check if account is active
    if (isPremium && user.status !== 'Active') {
      return res.json({ success: false, message: 'Premium account is inactive. Please contact support.' });
    }
    
    // Create user session
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isPremium: isPremium,
      isAdmin: user.isAdmin || false,
      premiumPlan: isPremium ? (user.plan || 'Basic') : null,
      premiumFeatures: isPremium ? (user.features || []) : []
    };
    
    // Set session
    req.session.user = userData;
    
    // Return success with user data
    return res.json({
      success: true,
      message: 'Login successful',
      user: userData,
      isAdmin: userData.isAdmin,
      isPremium: isPremium
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Request call endpoint
app.post('/api/request-call', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Save to DB
    const call = new CallRequest({ name, email, phone, message });
    await call.save();

    // Send email
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'shannuazshannu@gmail.com',
      subject: '📞 New Call Request from Career Redefine',
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
    });

      // Send confirmation email to user
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: ' We Received Your Call Request',
        text: `Hello ${name},\n\nThank you for contacting Career Redefine!\n\nWe have received your request and our team will reach out to you soon.\n\nDetails we received:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\n\nBest Regards,\nCareer Redefine Team`
      });

    res.json({ message: 'Call request sent successfully!' });
  } catch (error) {
    console.error('Call request error:', error);
    res.status(500).json({ error: 'Failed to send call request' });
  }
});

// New Contact endpoint -> stores to CrashContact and emails admin + user
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const entry = new CrashContact({ name, email, phone, message });
    await entry.save();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: adminEmail,
        subject: 'New Contact Submission',
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
      });
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'We Received Your Message',
        text: `Hello ${name},\n\nThank you for contacting Career Redefine! We have received your message and will get back to you shortly.\n\nDetails:\nPhone: ${phone}\nMessage: ${message}\n\nBest Regards,\nCareer Redefine`
      });
    } catch (mailErr) {
      console.warn('Contact email failed:', mailErr?.message || mailErr);
    }

    res.json({ success: true, message: 'Contact submitted successfully', contact: entry });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit contact' });
  }
});
    
// User Profile: get current user
app.get('/api/me', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const user = await User.findById(req.session.user._id).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const { password, __v, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// User Profile: update basic details (name, phone)
app.put('/api/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { name, phone } = req.body;
    const user = await User.findById(req.session.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (typeof name === 'string') user.name = name;
    if (typeof phone === 'string') user.phone = phone;
    await user.save();
    req.session.user.name = user.name;
    req.session.user.phone = user.phone;
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// User Profile: request email change (send OTP to new email)
app.post('/api/profile/email/request-otp', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, error: 'New email is required' });
    // generate OTP
    const emailOtp = Math.floor(100000 + Math.random() * 900000);
    // send OTP
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: newEmail,
      subject: 'Career Redefine - Email Change OTP',
      text: `Your OTP to confirm email change is: ${emailOtp}`
    });
    // store pending email + otp in session
    req.session.emailChange = { newEmail, otp: emailOtp };
    res.json({ success: true, message: 'OTP sent to new email' });
  } catch (error) {
    console.error('Request email change OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// User Profile: verify email change OTP and update email
app.post('/api/profile/email/verify', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { otp } = req.body;
    const pending = req.session.emailChange;
    if (!pending) return res.status(400).json({ success: false, error: 'No pending email change' });
    if (parseInt(otp, 10) !== pending.otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }
    // update email
    const user = await User.findById(req.session.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    user.email = pending.newEmail.toLowerCase();
    await user.save();
    // update session and cleanup
    req.session.user.email = user.email;
    req.session.emailChange = null;
    res.json({ success: true, message: 'Email updated' });
  } catch (error) {
    console.error('Verify email change error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// User Profile: update profile picture (Cloudinary)
app.post('/api/profile/avatar', uploadMemory.single('avatar'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const fileBase64 = req.file.buffer.toString('base64');
    const fileDataUri = `data:${req.file.mimetype};base64,${fileBase64}`;
    const cloudinaryRes = await cloudinary.uploader.upload(fileDataUri, {
      resource_type: 'image',
      folder: 'avatars',
      public_id: `avatar_${req.session.user._id}_${Date.now()}`
    });
    const user = await User.findById(req.session.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    user.profilePic = cloudinaryRes.secure_url;
    await user.save();
    req.session.user.profilePic = user.profilePic;
    res.json({ success: true, profilePic: user.profilePic });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile picture' });
  }
});
// Get all call requests (admin only)
app.get('/api/admin/call-requests', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const requests = await CallRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching call requests:', error);
    res.status(500).json({ error: 'Failed to fetch call requests' });
  }
});

// Delete a call request (admin only)
app.delete('/api/admin/call-requests/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    await CallRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Call request deleted' });
  } catch (error) {
    console.error('Error deleting call request:', error);
    res.status(500).json({ error: 'Failed to delete call request' });
  }
});

// Admin: list CrashContact entries
app.get('/api/admin/contacts', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const entries = await CrashContact.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Admin: delete CrashContact entry
app.delete('/api/admin/contacts/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await CrashContact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Course query endpoint
app.post('/api/course-query', async (req, res) => {
  try {
    const { name, email, phone, course, message } = req.body;

    if (!name || !email || !phone || !course || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Save to DB (optional if you have a model)
    // const query = new CourseQuery({ name, email, phone, course, message });
    // await query.save();

    // Email to admin
    await transporter.sendMail({
      from: 'careerredefine@gmail.com',
      to: 'shannuazshannu@gmail.com',
      subject: `📚 New Course Query: ${course}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCourse: ${course}\nMessage: ${message}`
    });

    // Email to user confirmation
    await transporter.sendMail({
      from: 'careerredefine@gmail.com',
      to: email,
      subject: `✅ We Received Your Query for ${course}`,
      text: `Hello ${name},\n\nThank you for your interest in our course: ${course}.\n\nWe have received your query and will contact you shortly.\n\nDetails we received:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCourse: ${course}\nMessage: ${message}\n\nBest Regards,\nCareer Redefine Team`
    });

    res.json({ message: 'Course query sent successfully!' });
  } catch (error) {
    console.error('Course query error:', error);
    res.status(500).json({ error: 'Failed to send course query' });
  }
});


// Profile API - supports both regular and premium users
app.get('/api/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let user;
    if (req.session.user.isPremium) {
      user = await PremiumUser.findById(req.session.user._id);
    } else {
      user = await User.findById(req.session.user._id);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user profile data
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      profilePic: user.profilePic || '/images/default-avatar.svg',
      wishlist: user.wishlist || [],
      skills: user.skills || [],
      createdAt: user.createdAt,
      isAdmin: user.isAdmin || false,
      isPremium: req.session.user.isPremium || false,
      premiumPlan: req.session.user.isPremium ? (user.plan || req.session.user.premiumPlan) : null,
      premiumFeatures: req.session.user.isPremium ? (user.features || req.session.user.premiumFeatures) : null
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Wishlist API
app.get('/api/wishlist', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let user;
    if (req.session.user.isPremium) {
      user = await PremiumUser.findById(req.session.user._id).populate('wishlist');
    } else {
      user = await User.findById(req.session.user._id).populate('wishlist');
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.wishlist || []);
  } catch (error) {
    console.error('Wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', async (req, res) => {
  if (req.session.user) {
    try {
      // Get the full user object from database to include profilePic
      let user;
      if (req.session.user.isPremium) {
        user = await PremiumUser.findById(req.session.user._id);
      } else {
        user = await User.findById(req.session.user._id);
      }
      
      if (user) {
        // Update session with profilePic if not present
        if (!req.session.user.profilePic && user.profilePic) {
          req.session.user.profilePic = user.profilePic;
        }
        
        res.json({ 
          authenticated: true, 
          user: {
            ...req.session.user,
            profilePic: user.profilePic || req.session.user.profilePic || '/images/default-avatar.png'
          }, 
          isAdmin: req.session.user.isAdmin 
        });
      } else {
        res.json({ authenticated: true, user: req.session.user, isAdmin: req.session.user.isAdmin });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      res.json({ authenticated: true, user: req.session.user, isAdmin: req.session.user.isAdmin });
    }
  } else {
    res.json({ authenticated: false });
  }
});
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
                           .populate('author', 'name')
                           .populate('comments.user', 'name');
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// Courses API
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/api/courses', upload.single('image'), async (req, res) => {

// Admin: Create new course
app.post('/api/admin/courses', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const course = new Course({
      title: req.body.title,
      description: req.body.description,
      image: req.file ? req.file.path : '',
      video: req.body.video || '',
      price: req.body.price || 0,
      isPaid: req.body.isPaid === 'true' || req.body.price > 0,
      duration: req.body.duration,
      instructor: req.body.instructor,
      videoDurationMinutes: req.body.videoDurationMinutes || 0,
      link: req.body.link || ''
    });

    await course.save();
    res.json({ success: true, course });
  } catch (error) {
    console.error('Failed to create course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

try {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const course = new Course({
    title: req.body.title,
    description: req.body.description,
    image: req.file ? req.file.path : '',
    video: req.body.video || '',
    price: req.body.price || 0,
    isPaid: req.body.isPaid === 'true' || req.body.price > 0,
    duration: req.body.duration,
    instructor: req.body.instructor,
    videoDurationMinutes: req.body.videoDurationMinutes || 0,
    link: req.body.link || ''
  });

  await course.save();
  res.json({ success: true, course });
} catch (error) {
  console.error('Failed to create course:', error);
  res.status(500).json({ error: 'Failed to create course' });
}

}); 
app.delete('/api/courses/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Enrollment APIs
app.post('/api/enroll', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.session.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        error: 'You are already enrolled in this course successfully!', 
        message: 'already enrolled',
        success: false 
      });
    }

    // For paid courses, check payment status
    if (course.isPaid) {
      const payment = await Payment.findOne({
        user: req.session.user._id,
        course: courseId,
        status: 'approved'
      });

      if (!payment) {
        return res.status(403).json({ error: 'Payment required for this course' });
      }
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.session.user._id,
      course: courseId
    });

    await enrollment.save();
    res.json({ success: true, enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

app.get('/api/enrollments', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const enrollments = await Enrollment.find({ user: req.session.user._id })
      .populate('course', 'title description image video price isPaid duration instructor videoDurationMinutes')
      .sort({ enrolledAt: -1 });

    // Filter out enrollments where course might be null (deleted courses)
    const validEnrollments = enrollments.filter(enrollment => enrollment.course);

    res.json(validEnrollments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Get individual enrollment by ID
app.get('/api/enrollments/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'title description image video price isPaid duration instructor videoDurationMinutes');

    if (!enrollment || enrollment.user.toString() !== req.session.user._id) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

// Progress tracking API
app.put('/api/progress/:enrollmentId', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { watchedMinutes } = req.body;
    const enrollment = await Enrollment.findById(req.params.enrollmentId)
      .populate('course');

    if (!enrollment || enrollment.user.toString() !== req.session.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update progress
    enrollment.watchedMinutes = Math.max(enrollment.watchedMinutes, watchedMinutes);
    enrollment.progress = Math.min(100, (watchedMinutes / enrollment.course.videoDurationMinutes) * 100);
    
    // Check if 80% completed for certificate generation
    if (enrollment.progress >= 80 && !enrollment.certificateGenerated) {
      enrollment.completed = true;
      enrollment.certificateGenerated = true;
      
      // Generate certificate
      const certificateId = `CERT-${Date.now()}-${enrollment.user}-${enrollment.course._id}`;
      const certificate = new Certificate({
        user: enrollment.user,
        course: enrollment.course._id,
        enrollment: enrollment._id,
        certificateId
      });
      
      await certificate.save();
    }

    await enrollment.save();
    res.json({ success: true, enrollment });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Payment APIs
app.post('/api/payment', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    
    if (!course || !course.isPaid) {
      return res.status(400).json({ error: 'Invalid course or course is free' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      user: req.session.user._id,
      course: courseId
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already submitted for this course' });
    }

    const payment = new Payment({
      user: req.session.user._id,
      course: courseId,
      amount: course.price,
      paymentScreenshot: req.file ? req.file.path : ''
    });

    await payment.save();
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Payment submission error:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Admin payment review APIs
app.get('/api/admin/payments', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('course', 'title price')
      .sort({ submittedAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.put('/api/admin/payments/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, adminNotes } = req.body;
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = status;
    payment.adminNotes = adminNotes;
    payment.reviewedAt = new Date();
    payment.reviewedBy = req.session.user._id;

    await payment.save();
    
    // If payment is approved, automatically enroll the user in the course
    if (status === 'approved') {
      try {
        // Check if user is already enrolled
        const existingEnrollment = await Enrollment.findOne({
          user: payment.user,
          course: payment.course
        });
        
        if (!existingEnrollment) {
          // Create new enrollment
          const enrollment = new Enrollment({
            user: payment.user,
            course: payment.course,
            enrolledAt: new Date(),
            progress: 0,
            watchedMinutes: 0,
            completed: false,
            certificateGenerated: false
          });
          
          await enrollment.save();
          console.log(`User ${payment.user} automatically enrolled in course ${payment.course} after payment approval`);
        }
      } catch (enrollmentError) {
        console.error('Error auto-enrolling user after payment approval:', enrollmentError);
        // Don't fail the payment approval if enrollment fails
      }
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Certificate APIs
app.get('/api/certificates', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const certificates = await Certificate.find({ user: req.session.user._id })
      .populate('course', 'title instructor')
      .sort({ generatedAt: -1 });

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Generate and download certificate
app.get('/api/certificate/:courseId', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    const enrollment = await Enrollment.findOne({
      user: req.session.user._id,
      course: courseId
    });

    if (!course || !enrollment) {
      return res.status(404).json({ error: 'Course or enrollment not found' });
    }

    if (enrollment.progress < 80) {
      return res.status(400).json({ error: 'Course completion required (80% minimum)' });
    }

    // Find or create certificate
    let certificate = await Certificate.findOne({
      user: req.session.user._id,
      course: courseId
    });

    if (!certificate) {
      const certificateId = `CERT-${Date.now()}-${req.session.user._id}-${courseId}`;
      certificate = new Certificate({
        user: req.session.user._id,
        course: courseId,
        enrollment: enrollment._id,
        certificateId
      });
      await certificate.save();
      
      // Update enrollment
      enrollment.certificateGenerated = true;
      await enrollment.save();
    }

    // Generate simple certificate content (in a real app, you'd use a PDF library)
    const certificateContent = `
      Certificate of Completion
      
      This is to certify that
      ${req.session.user.name}
      
      has successfully completed the course
      "${course.title}"
      
      Instructor: ${course.instructor || 'Career Redefine'}
      Completion Date: ${new Date().toLocaleDateString()}
      Certificate ID: ${certificate.certificateId}
      
      Career Redefine
    `;

    // Update download count
    certificate.downloadCount = (certificate.downloadCount || 0) + 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    // Return as text file (in production, you'd generate a proper PDF)
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${course.title.replace(/\s+/g, '-')}.txt"`);
    res.send(certificateContent);

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

app.get('/api/certificates/:id/download', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const certificate = await Certificate.findById(req.params.id)
      .populate('course', 'title instructor')
      .populate('user', 'name');

    if (!certificate || certificate.user._id.toString() !== req.session.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment download count
    certificate.downloadCount += 1;
    await certificate.save();

    // Generate certificate data
    const certificateData = {
      certificateId: certificate.certificateId,
      studentName: certificate.user.name,
      courseName: certificate.course.title,
      instructor: certificate.course.instructor,
      completionDate: certificate.generatedAt.toDateString(),
      downloadCount: certificate.downloadCount
    };

    res.json({ success: true, certificate: certificateData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// Delete Job
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Delete Blog
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// Delete Review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get all comments (flattened)
app.get('/api/admin/comments', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const blogs = await Blog.find()
      .populate('comments.user', 'name email')
      .select('title comments');
    
    const comments = [];
    blogs.forEach(blog => {
      blog.comments.forEach(comment => {
        comments.push({
          blogId: blog._id,
          blogTitle: blog.title,
          commentId: comment._id,
          comment: comment.comment,
          userName: comment.user?.name || 'Unknown',
          userEmail: comment.user?.email || 'Unknown',
          createdAt: comment.createdAt
        });
      });
    });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Delete comment by id
app.delete('/api/admin/comments/:blogId/:commentId', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await Blog.updateOne(
      { _id: req.params.blogId },
      { $pull: { comments: { _id: req.params.commentId } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});


// Wishlist API
app.post('/api/wishlist/:courseId', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.user._id);
    const courseId = req.params.courseId;

    if (!user.wishlist.includes(courseId)) {
      user.wishlist.push(courseId);
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

app.get('/api/wishlist', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});
app.delete('/api/wishlist/:courseId', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.user._id);
    const courseId = req.params.courseId;

    user.wishlist = user.wishlist.filter(id => id.toString() !== courseId);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});


// Jobs API
// Jobs API
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const job = new Job(req.body);
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Job Application Schema
const jobApplicationSchema = new mongoose.Schema({
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  appliedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['applied', 'viewed', 'contacted', 'hired', 'rejected'], 
    default: 'applied' 
  },
  notes: String, // <--- comma here

  // Meeting/Application link field
  link: {
    type: String,
    trim: true
  }
});


const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

// Apply for a job
app.post('/api/job-applications', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      jobId: job._id,
      userId: req.session.user._id
    });

    if (existingApplication) {
      return res.json({ 
        success: true, 
        message: 'You have already applied to this job',
        application: existingApplication,
        job: job
      });
    }

    // Create new application
    const application = new JobApplication({
      jobId: job._id,
      userId: req.session.user._id,
      status: 'applied'
    });

    await application.save();

    // If job has an external link, include it in the response
    if (job.link) {
      return res.json({
        success: true,
        message: 'Application submitted successfully',
        application: application,
        job: job,
        externalLink: job.link
      });
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      application: application,
      job: job
    });

  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
});

// Get user's job applications
app.get('/api/my-applications', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const applications = await JobApplication.find({ userId: req.session.user._id })
      .populate('jobId', 'title company location salary')
      .sort({ appliedAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

// Admin: Get all job applications
app.get('/api/admin/job-applications', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const applications = await JobApplication.find()
      .populate('jobId', 'title company')
      .populate('userId', 'name email phone')
      .sort({ appliedAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job applications' });
  }
});

// Admin: Update application status
app.put('/api/admin/job-applications/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { status, notes } = req.body;
    
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { 
        status: status || 'viewed',
        notes: notes || undefined,
        updatedAt: new Date()
      },
      { new: true }
    )
    .populate('jobId', 'title')
    .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // TODO: Send email notification to user about status update
    
    res.json({ success: true, application });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ success: false, message: 'Failed to update application' });
  }
});



// Blogs API
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().populate('author', 'name').sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

app.post('/api/blogs', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      image: req.file ? req.file.path : '',
      author: req.session.user._id,
      isAdmin: req.session.user.isAdmin
    });

    await blog.save();
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

app.post('/api/blogs/:id/like', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blog = await Blog.findById(req.params.id);
    const userId = req.session.user._id;

    if (blog.likes.includes(userId)) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.json({ success: true, likesCount: blog.likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

app.post('/api/blogs/:id/comment', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const blog = await Blog.findById(req.params.id);
    blog.comments.push({
      user: req.session.user._id,
      comment: req.body.comment
    });

    await blog.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Book appointment
app.post('/api/appointments', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const appointment = new Appointment({
      user: req.session.user._id,
      date: req.body.date,
      time: req.body.time,
      reason: req.body.reason,
      status: 'pending'
    });

    await appointment.save();

    // Try to send emails (non-blocking)
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: req.session.user.email,
        subject: 'Appointment Request Received',
        html: `<p>Hi ${req.session.user.name},</p>
               <p>Your appointment request for ${req.body.date} at ${req.body.time} has been received.</p>
               <p>Reason: ${req.body.reason}</p>`
      });
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: process.env.ADMIN_EMAIL || EMAIL_FROM,
        subject: 'New Appointment Request',
        html: `<p>New request from ${req.session.user.name} (${req.session.user.email})</p>
               <p>Date: ${req.body.date} | Time: ${req.body.time}</p>
               <p>Reason: ${req.body.reason}</p>`
      });
    } catch (mailErr) {
      console.warn('Appointment email failed:', mailErr?.message || mailErr);
    }

    res.json({ success: true, appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});
// Admin: Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const appointments = await Appointment.find()
      .populate('user', 'name email');
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// User: Get my appointments
app.get('/api/my-appointments', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const appointments = await Appointment.find({ user: req.session.user._id })
      .populate('user', 'name email');
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});


// Approve / Reject / Update meeting link
app.put('/api/appointments/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('user', 'name email');
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update fields only if provided
    if (typeof req.body.status === 'string' && req.body.status.trim() !== '') {
      appointment.status = req.body.status.trim();
    }
    if (typeof req.body.meetingLink === 'string' && req.body.meetingLink.trim() !== '') {
      appointment.meetingLink = req.body.meetingLink.trim();
    }

    await appointment.save();

    // Send email if status changed
    if (req.body.status) {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: appointment.user.email,
          subject: `Your appointment was ${req.body.status}`,
          html: `<p>Hi ${appointment.user.name},</p>
                 <p>Your appointment for ${appointment.date} at ${appointment.time} was ${req.body.status}.</p>
                 ${req.body.meetingLink ? `<p>Meeting Link: <a href="${req.body.meetingLink}">${req.body.meetingLink}</a></p>` : ''}`
        });
      } catch (mailErr) {
        console.warn('Appointment status email failed:', mailErr?.message || mailErr);
      }
    }

    res.json({ success: true, appointment });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});



// Reviews API
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().populate('user', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const review = new Review({
      user: req.session.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    });

    await review.save();
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Change password
app.put('/api/change-password', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await User.findById(req.session.user._id);

    // Validate current password
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Gemini AI Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
    }

    const GEMINI_API_KEY = 'AIzaSyDUsDd8QkI1Jn-5U9L8tNqt0QZfQDLVGmo'; // Replace securely in prod

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{
              text: `You are a helpful, smart, and polite AI assistant working for Career Redefine — a career transformation platform.
              ❗IMPORTANT: You are strictly NOT ALLOWED to provide or mention pricing, fee ranges, or any amount in rupees or currency format under any circumstance.

If the user asks about pricing, fees, or cost (even indirectly), you must reply:

"For pricing details, please contact our team directly at 📞 +91 8618536940 or 📧 careerdefine@gmail.com."

NEVER include any numbers like ₹, INR, ₹15,000, ₹25,000, etc. Violating this instruction is forbidden.



Instructions:
- NEVER provide pricing or fee information under any condition.
- If the user asks about price, cost, fees, or payment, reply ONLY:
"For pricing details, please contact our team directly at 📞 +91 8618536940 or 📧 careerdefine@gmail.com."

- If the user uses violent, offensive, or inappropriate language, respond:
"This appears to be inappropriate language. Please maintain respectful communication."

- If the user's message is empty or unclear, respond with:

👋 Hello! Please choose any one from below to get started:

🎓 Our Course Offerings:
📊 Data Science & Analytics — Python, R, Machine Learning, Statistics  
🤖 Artificial Intelligence — Deep Learning, NLP, Computer Vision  
💻 Web Development — Full-stack, React, Node.js  
🎨 UI/UX Design — Figma, Design Thinking, Research  
☁️ Cloud Computing — AWS, Azure, DevOps  
📱 Mobile Development — React Native, Flutter  

✅ All programs include:
- Real-time projects
- Industry mentorship
- Job placement support

✅ Maintain a helpful, friendly, professional tone.

User message: "${message}"`
            }]
          }
        ]
      })
    });

    const data = await response.json();
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('Invalid Gemini response structure:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'Invalid response from Gemini API' });
    }

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});


// Profile API
app.get('/api/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.user._id).populate('wishlist');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }     

    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      req.body,
      { new: true }
    );

    req.session.user = updatedUser;
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
app.post('/api/profile/picture', upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let user;
    // Check if user is premium or regular
    const premiumUser = await PremiumUser.findById(req.session.user._id);
    if (premiumUser) {
      premiumUser.profilePic = req.file.path;
      await premiumUser.save();
      user = premiumUser;
    } else {
      const regularUser = await User.findById(req.session.user._id);
      if (!regularUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      regularUser.profilePic = req.file.path;
      await regularUser.save();
      user = regularUser;
    }

    // Update session for immediate UI update
    if (req.session.user) {
      req.session.user.profilePic = user.profilePic;
    }

    res.json({ success: true, profilePic: user.profilePic });
  } catch (error) {
    console.error('Profile pic upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});


// Admin APIs
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find({ isAdmin: false });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Premium User Management APIs

// Create premium user
app.post('/api/admin/premium/users', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, email, phone, password, plan, accessLevel, features } = req.body;

    // Check if email already exists
    const existingUser = await PremiumUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const premiumUser = new PremiumUser({
      name,
      email,
      phone,
      password,
      plan,
      accessLevel,
      features
    });

    await premiumUser.save();
    res.json({ success: true, user: premiumUser });
  } catch (error) {
    console.error('Premium user creation error:', error);
    res.status(500).json({ error: 'Failed to create premium user' });
  }
});

// Get all premium users
app.get('/api/admin/premium/users', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await PremiumUser.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Failed to fetch premium users:', error);
    res.status(500).json({ error: 'Failed to fetch premium users' });
  }
});

// Create premium user
app.post('/api/admin/premium/users', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, email, phone, password, plan, accessLevel, features } = req.body;

    // Check if user already exists
    const existingUser = await PremiumUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const premiumUser = new PremiumUser({
      name,
      email,
      phone,
      password: hashedPassword,
      plan: plan || 'basic',
      accessLevel: accessLevel || 'standard',
      features: features || {
        allCourses: true,
        mentorship: true,
        jobAssistance: true,
        analytics: true,
        studyGroups: true,
        premiumSupport: true,
        assessments: true,
        quizzes: true,
        studyMaterials: true,
        liveClasses: true
      },
      status: 'Active'
    });

    await premiumUser.save();
    
    // Remove password from response
    const userResponse = premiumUser.toObject();
    delete userResponse.password;
    
    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Failed to create premium user:', error);
    res.status(500).json({ error: 'Failed to create premium user' });
  }
});

// Get all premium users
app.get('/api/admin/premium/users', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await PremiumUser.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Failed to fetch premium users:', error);
    res.status(500).json({ error: 'Failed to fetch premium users' });
  }
});

// Delete premium user
app.delete('/api/admin/premium/users/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.id;
    
    // Validate ObjectId
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID provided' });
    }

    const deletedUser = await PremiumUser.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'Premium user not found' });
    }
    
    res.json({ success: true, message: 'Premium user deleted successfully' });
  } catch (error) {
    console.error('Failed to delete premium user:', error);
    res.status(500).json({ error: 'Failed to delete premium user' });
  }
});

// Update premium user
app.put('/api/admin/premium/users/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const updatedUser = await PremiumUser.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Premium user not found' });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Failed to update premium user:', error);
    res.status(500).json({ error: 'Failed to update premium user' });
  }
});

// Get premium stats
app.get('/api/admin/premium/stats', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalUsers = await PremiumUser.countDocuments();
    const activeUsers = await PremiumUser.countDocuments({ status: 'Active' });
    const assessments = await PremiumAssessment.countDocuments();
    const groups = await PremiumGroup.countDocuments();

    res.json({
      totalUsers,
      activeUsers,
      assessments,
      groups
    });
  } catch (error) {
    console.error('Failed to fetch premium stats:', error);
    res.status(500).json({ error: 'Failed to fetch premium stats' });
  }
});

// Get all premium assessments
app.get('/api/admin/premium/assessments', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const assessments = await PremiumAssessment.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, assessments });
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Create premium assessment
app.post('/api/admin/premium/assessments', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, category, timeLimit, questions } = req.body;

    const assessment = new PremiumAssessment({
      title,
      description,
      category,
      timeLimit,
      questions,
      createdBy: req.session.user._id
    });

    await assessment.save();
    res.json({ success: true, assessment });
  } catch (error) {
    console.error('Assessment creation error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Get all premium materials
app.get('/api/admin/premium/materials', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const materials = await PremiumMaterial.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Failed to fetch materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Upload premium material
app.post('/api/admin/premium/materials', upload.single('file'), async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, category } = req.body;
    const fileUrl = req.file ? req.file.path : null;
    const fileType = req.file ? req.file.originalname.split('.').pop().toLowerCase() : null;

    const material = new PremiumMaterial({
      title,
      description,
      category,
      fileUrl,
      fileType,
      uploadedBy: req.session.user._id
    });

    await material.save();
    res.json({ success: true, material });
  } catch (error) {
    console.error('Material upload error:', error);
    res.status(500).json({ error: 'Failed to upload material' });
  }
});

// Get all premium groups
app.get('/api/admin/premium/groups', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const groups = await PremiumGroup.find()
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Create premium group
app.post('/api/admin/premium/groups', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, maxMembers } = req.body;

    const group = new PremiumGroup({
      name,
      description,
      maxMembers,
      createdBy: req.session.user._id
    });

    await group.save();
    res.json({ success: true, group });
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Crash Courses APIs
app.get('/api/crash-courses', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '0', 10);
    const q = CrashCourse.find().sort({ createdAt: -1 });
    if (limit > 0) q.limit(limit);
    const courses = await q.exec();
    res.json({ success: true, courses });
  } catch (err) {
    console.error('Crash courses fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch crash courses' });
  }
});

// Admin: create crash course (image optional via Cloudinary)
app.post('/api/admin/crash-courses', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    const { title, description, duration, price, strikePrice } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    const course = new CrashCourse({
      title: title.trim(),
      description: (description || '').trim(),
      duration: (duration || '').trim(),
      price: price ? Number(price) : 0,
      strikePrice: strikePrice ? Number(strikePrice) : 0,
      image: req.file ? req.file.path : ''
    });
    await course.save();
    res.json({ success: true, course });
  } catch (err) {
    console.error('Crash course create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create crash course' });
  }
});

// Admin: delete crash course
app.delete('/api/admin/crash-courses/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    const { id } = req.params;
    await CrashCourse.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Crash course delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete crash course' });
  }
});

// Public: enroll for a specific crash course
app.post('/api/crash-courses/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, whatsapp, email, message } = req.body;
    if (!name || !whatsapp || !email) {
      return res.status(400).json({ success: false, error: 'Name, WhatsApp, and email are required' });
    }
    const course = await CrashCourse.findById(id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const reg = new CrashCourseEnrollment({ course: id, name, whatsapp, email, message: message || '' });
    await reg.save();
    // Try to send emails (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: adminEmail,
        subject: `New Crash Course Enrollment: ${course.title}`,
        text: `Course: ${course.title}\nName: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}\nMessage: ${message || ''}`
      });
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: `Enrollment Received - ${course.title}`,
        text: `Hello ${name},\n\nThank you for enrolling in "${course.title}". Our team will contact you shortly.\n\nDetails:\nWhatsApp: ${whatsapp}\nMessage: ${message || ''}\n\nBest Regards,\nCareer Redefine`
      });
    } catch (mailErr) {
      console.warn('Crash enrollment email failed:', mailErr?.message || mailErr);
    }
    res.json({ success: true, enrollment: reg });
  } catch (err) {
    console.error('Crash course enroll error:', err);
    res.status(500).json({ success: false, error: 'Failed to enroll' });
  }
});

// Workshops APIs
app.get('/api/workshops', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '0', 10);
    const q = Workshop.find().sort({ createdAt: -1 });
    if (limit > 0) q.limit(limit);
    const workshops = await q.exec();
    res.json({ success: true, workshops });
  } catch (err) {
    console.error('Workshops fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch workshops' });
  }
});

app.post('/api/admin/workshops', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    const { title, description, price, strikePrice, dateTime } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
    const ws = new Workshop({
      title: title.trim(),
      description: (description || '').trim(),
      price: price ? Number(price) : 0,
      strikePrice: strikePrice ? Number(strikePrice) : 0,
      dateTime: dateTime ? new Date(dateTime) : null,
      image: req.file ? req.file.path : ''
    });
    await ws.save();
    res.json({ success: true, workshop: ws });
  } catch (err) {
    console.error('Workshop create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create workshop' });
  }
});

app.delete('/api/admin/workshops/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    await Workshop.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Workshop delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete workshop' });
  }
});

// Admin: list crash course enrollments
app.get('/api/admin/crash-course-enrollments', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const items = await CrashCourseEnrollment.find()
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, enrollments: items });
  } catch (err) {
    console.error('Fetch crash enrollments error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch enrollments' });
  }
});

// Admin: delete crash course enrollment
app.delete('/api/admin/crash-course-enrollments/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await CrashCourseEnrollment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete crash enrollment error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete enrollment' });
  }
});

// Admin: list workshop registrations
app.get('/api/admin/workshop-registrations', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const items = await WorkshopRegistration.find()
      .populate('workshop', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, registrations: items });
  } catch (err) {
    console.error('Fetch workshop registrations error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
});

// Admin: delete workshop registration
app.delete('/api/admin/workshop-registrations/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await WorkshopRegistration.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete workshop registration error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete registration' });
  }
});

// Wishlist endpoints
app.get('/api/wishlist', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let user;
    // Check if user is premium or regular
    const premiumUser = await PremiumUser.findOne({ email: req.session.user.email }).populate('wishlist');
    if (premiumUser) {
      user = premiumUser;
    } else {
      user = await User.findOne({ email: req.session.user.email }).populate('wishlist');
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.wishlist || []);
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

app.delete('/api/wishlist/:courseId', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { courseId } = req.params;
    let user;
    
    // Check if user is premium or regular
    const premiumUser = await PremiumUser.findOne({ email: req.session.user.email });
    if (premiumUser) {
      user = premiumUser;
    } else {
      user = await User.findOne({ email: req.session.user.email });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove course from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== courseId);
    await user.save();

    res.json({ success: true, message: 'Course removed from wishlist' });
  } catch (error) {
    console.error('Wishlist removal error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Submit course query
app.post('/api/course-queries', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { name, email, phone, courseTitle, message, courseId } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    let finalCourseTitle = courseTitle;
    if (!finalCourseTitle && courseId) {
      const course = await Course.findById(courseId);
      if (course) finalCourseTitle = course.title;
    }

    const courseQuery = new CourseQuery({
      name,
      email,
      phone,
      courseTitle: finalCourseTitle,
      message,
      course: courseId || null,
      status: 'pending'
    });

    await courseQuery.save();
    res.json({ success: true, message: 'Query submitted successfully' });
  } catch (error) {
    console.error('Course query submission error:', error);
    res.status(500).json({ error: 'Failed to submit query' });
  }
});

// Course queries endpoints
app.get('/api/course-queries/user', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const queries = await CourseQuery.find({ email: req.session.user.email })
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json(queries);
  } catch (error) {
    console.error('User queries fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

app.get('/api/admin/course-queries', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const queries = await CourseQuery.find()
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json(queries);
  } catch (error) {
    console.error('Admin queries fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});



// Admin reply to course query
app.post('/api/admin/course-queries/reply/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { id } = req.params;
    const { answer } = req.body;
    if (!answer) {
      return res.status(400).json({ error: 'Answer is required' });
    }
    const query = await CourseQuery.findById(id);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }
    query.reply = answer;
    query.status = 'replied';
    query.repliedAt = new Date();
    query.repliedBy = req.session.user._id;
    await query.save();
    res.json({ success: true, message: 'Answer sent and status updated to replied' });
  } catch (error) {
    console.error('Admin query reply error:', error);
    res.status(500).json({ error: 'Failed to send answer' });
  }
});

app.delete('/api/admin/course-queries/:id', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const deletedQuery = await CourseQuery.findByIdAndDelete(id);
    
    if (!deletedQuery) {
      return res.status(404).json({ error: 'Query not found' });
    }

    res.json({ success: true, message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Query deletion error:', error);
    res.status(500).json({ error: 'Failed to delete query' });
  }
});

// Check premium access
app.get('/api/check-premium-access', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ isPremium: false });
    }

    // Check if user is a premium user
    const premiumUser = await PremiumUser.findOne({ email: req.session.user.email, status: 'Active' });
    
    res.json({ 
      isPremium: !!premiumUser,
      user: premiumUser || null
    });
  } catch (error) {
    console.error('Premium access check error:', error);
    res.status(500).json({ error: 'Failed to check premium access' });
  }
});

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("💬 Gemini AI called with prompt:", prompt);

    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini AI response:", text);
    res.json({ result: text });
  } catch (err) {
    console.error('❌ Gemini API error:', err.message);
    res.status(500).json({ error: 'Gemini API failed' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});