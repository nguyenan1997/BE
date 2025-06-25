const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Add user info to request
    req.user = decoded;
    req.currentUser = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Authorize roles
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Check if user can access their own resource or is admin
const authorizeOwnResource = (resourceUserIdField = 'id') => {
  return (req, res, next) => {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUserId = req.params[resourceUserIdField];
    const currentUserId = req.currentUser.userId;

    // Allow if user is admin or accessing their own resource
    if (req.currentUser.role === 'admin' || resourceUserId === currentUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwnResource
}; 