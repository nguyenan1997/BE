const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');
const { 
  hashToken, 
  addToken,  
  removeToken, 
  removeUserTokens 
} = require('../utils/tokenStore');

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

    // Generate original JWT token
    const originalToken = generateToken(user.id);
    console.log(originalToken);
    
    // Hash the token for frontend
    const hashedToken = hashToken(originalToken);
    
    // Store original token
    await addToken(hashedToken, {
      originalToken,
      userId: user.id
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token: hashedToken,
        tokenType: 'hashed'
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

    // Generate new original token
    const newOriginalToken = generateToken(user.id);
    
    // Hash the new token for frontend
    const newHashedToken = hashToken(newOriginalToken);
    
    // Remove old token from store
    const oldToken = req.headers.authorization?.replace('Bearer ', '');
    if (oldToken) {
      await removeToken(oldToken);
    }
    
    // Store new token
    await addToken(newHashedToken, {
      originalToken: newOriginalToken,
      userId: user.id
    });

    res.json({
      success: true,
      data: {
        token: newHashedToken,
        tokenType: 'hashed'
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
    
    if (token) {
      await removeToken(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Logout from all devices
const logoutAll = async (req, res, next) => {
  try {
    // Remove all tokens for this user
    await removeUserTokens(req.user.userId);

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
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