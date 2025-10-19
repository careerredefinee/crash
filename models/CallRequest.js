const mongoose = require('mongoose');

const callRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CallRequest', callRequestSchema);
