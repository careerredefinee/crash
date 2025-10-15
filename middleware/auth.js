const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    try {
        // Check for token in Authorization header
        const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'career-redefine-secret-key');
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin
};
