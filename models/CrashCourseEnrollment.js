const mongoose = require('mongoose');

const crashCourseEnrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'CrashCourse', required: true },
  name: { type: String, required: true, trim: true },
  whatsapp: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CrashCourseEnrollment', crashCourseEnrollmentSchema);
