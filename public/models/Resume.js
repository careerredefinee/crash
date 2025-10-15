const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);
