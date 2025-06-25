const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  refreshToken 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin } = require('../validators/authValidator');

// Create middleware functions that call validators correctly
const validateRegistrationMiddleware = (req, res, next) => {
  const { error, value } = validateRegistration(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.body = value; // Replace with validated data
  next();
};

const validateLoginMiddleware = (req, res, next) => {
  const { error, value } = validateLogin(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.body = value; // Replace with validated data
  next();
};

router.post('/register', validateRegistrationMiddleware, register);
router.post('/login', validateLoginMiddleware, login);
router.get('/profile', authenticateToken, getProfile);
router.post('/refresh-token', authenticateToken, refreshToken);

module.exports = router; 