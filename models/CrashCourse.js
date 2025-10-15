const mongoose = require('mongoose');

const crashCourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  // duration is optional; if not set, UI should ignore it
  duration: { type: String, default: '' }, // e.g., "6 hours" or "2 weeks"
  price: { type: Number, default: 0 },
  strikePrice: { type: Number, default: 0 }, // optional display-only
}, { timestamps: true });

crashCourseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CrashCourse', crashCourseSchema);
