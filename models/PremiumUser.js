const mongoose = require('mongoose');

const premiumUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    plan: {
        type: String,
        enum: ['basic', 'advanced', 'enterprise'],
        default: 'basic'
    },
    accessLevel: {
        type: String,
        enum: ['standard', 'priority', 'vip'],
        default: 'standard'
    },
    features: {
        allCourses: { type: Boolean, default: true },
        mentorship: { type: Boolean, default: false },
        jobAssistance: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false },
        studyGroups: { type: Boolean, default: false },
        premiumSupport: { type: Boolean, default: false }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    subscriptionStart: {
        type: Date,
        default: Date.now
    },
    subscriptionEnd: Date
}, {
    timestamps: true
});

// Add index for frequently queried fields
premiumUserSchema.index({ isActive: 1 });

// Add a method to check if subscription is active
premiumUserSchema.methods.isSubscriptionActive = function() {
    if (!this.subscriptionEnd) return true;
    return this.subscriptionEnd > new Date();
};

const PremiumUser = mongoose.model('PremiumUser', premiumUserSchema);

module.exports = PremiumUser;
