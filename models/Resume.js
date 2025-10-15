const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    publicId: { type: String, required: true },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    userEmail: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['pending', 'analyzing', 'analyzed', 'error'],
        default: 'pending'
    },
    analysis: {
        score: { type: Number },
        suggestions: [String],
        keywords: [String],
        analyzedAt: { type: Date }
    }
}, { timestamps: true });

// Add text index for search
resumeSchema.index({ 
    originalName: 'text', 
    userEmail: 'text',
    'analysis.keywords': 'text'
});

module.exports = mongoose.model('Resume', resumeSchema);
