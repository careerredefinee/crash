const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    dob: Date,
    skills: [String],
    password: String,
    profilePic: { type: String, default: '/images/default-avatar.png' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    isAdmin: { type: Boolean, default: false },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    resumes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add method to get user profile without sensitive data
userSchema.methods.getProfile = function() {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

// Create a text index for search
userSchema.index({ name: 'text', email: 'text', skills: 'text' });

module.exports = mongoose.model('User', userSchema);
