const mongoose = require('mongoose');

const workshopRegistrationSchema = new mongoose.Schema({
  workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  name: { type: String, required: true, trim: true },
  whatsapp: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('WorkshopRegistration', workshopRegistrationSchema);
