const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getToken } = require('../utils/tokenStore');

// Authenticate JWT token (supports both hashed and original tokens)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    let decoded;
    let originalToken = token;

    const tokenData = await getToken(token);
    if (tokenData) {
      originalToken = tokenData.originalToken;
      decoded = jwt.verify(originalToken, process.env.JWT_SECRET);
    } else {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    }
    
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

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
  return async (req, res, next) => {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUserId = req.params[resourceUserIdField];
    const currentUser = req.currentUser;

    if (currentUser.role === 'superadmin') {
      return next(); // Superadmin thao tác với mọi user
    }

    if (currentUser.role === 'admin') {
      // Admin không thao tác với superadmin hoặc admin khác
      const targetUser = await User.findByPk(resourceUserId);
      if (targetUser && targetUser.role !== 'superadmin' && targetUser.role !== 'admin') {
        return next();
      }
    }

    if (currentUser.role === 'partner_company') {
      const targetUser = await User.findByPk(resourceUserId);
      if (targetUser && targetUser.role === 'employee_partner' && targetUser.company_id === currentUser.company_id) {
        return next();
      }
    }

    // Chính mình
    if (resourceUserId === currentUser.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources or those you manage.'
    });
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwnResource
}; 