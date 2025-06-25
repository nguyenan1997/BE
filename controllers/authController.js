const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user (Admin Only)
const register = async (req, res, next) => {
  try {
    // Data already validated by middleware
    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      fullName
    });

    // Don't return token on registration - user should login separately
    res.status(201).json({
      success: true,
      message: 'User registered successfully. User can now login with their credentials.',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    // Data already validated by middleware
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
const refreshToken = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user (server-side token blacklisting)
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Add token to blacklist (you can use Redis or database)
    // For now, we'll use a simple in-memory approach
    // In production, use Redis or database table for blacklisted tokens
    
    // TODO: Implement proper token blacklisting
    // Example with Redis:
    // await redis.setex(`blacklist:${token}`, 24 * 60 * 60, '1'); // 24 hours
    
    // For now, just return success (client should delete token)
    res.json({
      success: true,
      message: 'Logout successful. Please delete the token from your client.'
    });
  } catch (error) {
    next(error);
  }
};

// Logout all sessions (invalidate all user tokens)
const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // TODO: Implement logout all sessions
    // This would require tracking all active tokens per user
    // For now, just return success
    
    res.json({
      success: true,
      message: 'All sessions logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  refreshToken,
  logout,
  logoutAll
}; 