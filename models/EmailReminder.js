const mongoose = require('mongoose');

const emailReminderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, trim: true, lowercase: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  workshopTitle: { type: String, required: true },
  workshopDateTime: { type: Date, required: true },
  meetingLink: { type: String, default: '' },
  
  // Email status tracking
  enrollmentEmailSent: { type: Boolean, default: false },
  morningReminderSent: { type: Boolean, default: false },
  tenMinuteReminderSent: { type: Boolean, default: false },
  
  // Timestamps for email sends
  enrollmentEmailSentAt: { type: Date },
  morningReminderSentAt: { type: Date },
  tenMinuteReminderSentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('EmailReminder', emailReminderSchema);
